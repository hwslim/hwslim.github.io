const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' };
const cookieName = '__Host-erilab-oauth-state';
const clearCookie = `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

function response(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extra } });
}

function popup(origin, payload, success) {
  const nonce = crypto.randomUUID();
  const message = `authorization:github:${success ? 'success' : 'error'}:${JSON.stringify(payload)}`;
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
  return response(`<!doctype html><html lang="ko"><meta charset="utf-8"><title>ERILab GitHub 로그인</title><p>로그인을 처리하고 있습니다. 이 창은 자동으로 닫힙니다.</p><script nonce="${nonce}">
    const origin = ${json(origin)};
    if (window.opener) {
      window.addEventListener('message', function receive(event) {
        if (event.origin !== origin || event.source !== window.opener || event.data !== 'authorizing:github') return;
        window.removeEventListener('message', receive);
        window.opener.postMessage(${json(message)}, origin);
        window.close();
      });
      window.opener.postMessage('authorizing:github', origin);
    } else document.querySelector('p').textContent = '관리자 페이지에서 로그인을 다시 시작하세요.';
  </script></html>`, 200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': clearCookie, 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'` });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return response('Method not allowed', 405, { Allow: 'GET' });
    if (url.pathname === '/health') return response('ERILab authentication worker');
    if (!['/auth', '/callback'].includes(url.pathname)) return response('Not found', 404);
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || env.SITE_ORIGIN !== 'https://erilab.xyz' || env.REPO !== 'hwslim/hwslim.github.io') return response('OAuth configuration is incomplete.', 503);
    const callback = `${url.origin}/callback`;
    if (url.pathname === '/auth') {
      if (url.searchParams.get('provider') !== 'github' || url.searchParams.get('site_id') !== new URL(env.SITE_ORIGIN).hostname) return response('Unsupported login origin or provider.', 400);
      const state = crypto.randomUUID();
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callback, scope: 'public_repo', state }).toString();
      return response('', 302, { Location: authorize.href, 'Set-Cookie': `${cookieName}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600` });
    }
    const stateCookie = request.headers.get('Cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const state = url.searchParams.get('state');
    if (!state || !stateCookie || state !== stateCookie) return response('Login state is invalid or expired. Restart from the admin page.', 400, { 'Set-Cookie': clearCookie });
    if (url.searchParams.has('error') || !url.searchParams.get('code')) return popup(env.SITE_ORIGIN, { message: 'GitHub 로그인이 취소되었습니다.' }, false);
    try {
      const exchanged = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code'), redirect_uri: callback }),
      });
      const data = await exchanged.json();
      if (!exchanged.ok || !data.access_token) throw new Error('GitHub 인증을 완료하지 못했습니다. 다시 로그인하세요.');
      const permission = await fetch(`https://api.github.com/repos/${env.REPO}`, { headers: { Authorization: `Bearer ${data.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ERILab-CMS', 'X-GitHub-Api-Version': '2022-11-28' } });
      const repo = await permission.json();
      if (!permission.ok || !repo.permissions?.push) return popup(env.SITE_ORIGIN, { message: '이 GitHub 계정에는 ERILab 저장소 편집 권한이 없습니다.' }, false);
      return popup(env.SITE_ORIGIN, { token: data.access_token, provider: 'github' }, true);
    } catch {
      return popup(env.SITE_ORIGIN, { message: 'GitHub 인증 연결에 실패했습니다. 잠시 후 다시 로그인하세요.' }, false);
    }
  },
};
