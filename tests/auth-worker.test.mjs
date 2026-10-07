import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import worker from '../auth-worker/worker.mjs';

globalThis.crypto ||= webcrypto;
const origin = 'https://erilab-auth.example.workers.dev';
const env = { GITHUB_CLIENT_ID: 'test-id', GITHUB_CLIENT_SECRET: 'test-secret', SITE_ORIGIN: 'https://erilab.xyz', REPO: 'hwslim/hwslim.github.io' };
const request = (path, cookie) => new Request(`${origin}${path}`, { headers: cookie ? { Cookie: cookie } : {} });

async function startLogin() {
  const result = await worker.fetch(request('/auth?provider=github&site_id=erilab.xyz'), env);
  const cookie = result.headers.get('Set-Cookie');
  const state = new URL(result.headers.get('Location')).searchParams.get('state');
  return { result, cookie, state };
}

test('login uses public repository scope and a secure expiring state cookie', async () => {
  const { result, cookie, state } = await startLogin();
  assert.equal(result.status, 302);
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  const authorize = new URL(result.headers.get('Location'));
  assert.equal(authorize.origin, 'https://github.com');
  assert.equal(authorize.searchParams.get('scope'), 'public_repo');
  assert.equal(authorize.searchParams.get('redirect_uri'), `${origin}/callback`);
  assert.ok(state);
  assert.equal((await startLogin()).state === state, false);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
});

test('wrong origins, missing configuration, and mismatched state cannot reach token exchange', async () => {
  assert.equal((await worker.fetch(request('/auth?provider=github&site_id=evil.example'), env)).status, 400);
  assert.equal((await worker.fetch(request('/auth?provider=github&site_id=erilab.xyz'), {})).status, 503);
  assert.equal((await worker.fetch(request('/callback?code=code&state=attacker'), env)).status, 400);
  const { cookie } = await startLogin();
  const response = await worker.fetch(request('/callback?code=code&state=attacker', cookie), env);
  assert.equal(response.status, 400);
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
});

test('successful login verifies push access and delivers the token only to the site opener', async () => {
  const savedFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(url.includes('access_token') ? { access_token: 'test-token' } : { permissions: { push: true } }), { status: 200 });
  };
  try {
    const { state, cookie } = await startLogin();
    const response = await worker.fetch(request(`/callback?code=code&state=${state}`, cookie), env);
    const html = await response.text();
    assert.equal(calls.length, 2);
    assert.equal(JSON.parse(calls[0].options.body).client_secret, env.GITHUB_CLIENT_SECRET);
    assert.equal(calls[1].url, 'https://api.github.com/repos/hwslim/hwslim.github.io');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
    assert.equal(html.includes(env.GITHUB_CLIENT_SECRET), false);
    assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
    const messages = [];
    const opener = { postMessage: (...args) => messages.push(args) };
    let listener;
    let closed = false;
    const context = { window: { opener, addEventListener: (_, fn) => { listener = fn; }, removeEventListener() {}, close: () => { closed = true; } } };
    vm.runInNewContext(html.match(/<script nonce="[^"]+">([\s\S]+)<\/script>/)[1], context);
    assert.deepEqual(messages[0], ['authorizing:github', 'https://erilab.xyz']);
    listener({ origin: 'https://evil.example', source: opener, data: 'authorizing:github' });
    listener({ origin: 'https://erilab.xyz', source: {}, data: 'authorizing:github' });
    assert.equal(messages.length, 1);
    listener({ origin: 'https://erilab.xyz', source: opener, data: 'authorizing:github' });
    assert.equal(messages[1][0], 'authorization:github:success:{"token":"test-token","provider":"github"}');
    assert.equal(messages[1][1], 'https://erilab.xyz');
    assert.equal(closed, true);
  } finally { globalThis.fetch = savedFetch; }
});

test('accounts without repository write access and failed exchanges never receive tokens', async () => {
  const savedFetch = globalThis.fetch;
  try {
    for (const scenario of ['denied', 'failed']) {
      globalThis.fetch = async url => new Response(JSON.stringify(url.includes('access_token') ? (scenario === 'failed' ? { error: 'bad_verification_code' } : { access_token: 'private-test-token' }) : { permissions: { push: false } }));
      const { state, cookie } = await startLogin();
      const response = await worker.fetch(request(`/callback?code=code&state=${state}`, cookie), env);
      const html = await response.text();
      assert.match(html, /authorization:github:error:/);
      assert.equal(html.includes('private-test-token'), false);
      assert.equal(html.includes(env.GITHUB_CLIENT_SECRET), false);
    }
  } finally { globalThis.fetch = savedFetch; }
});
