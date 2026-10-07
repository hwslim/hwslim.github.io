import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const originalConfig = JSON.parse(readFileSync('public/admin/config.json', 'utf8'));
function fakeMap(value) { return { get: key => value[key], toJS: () => value, merge: other => fakeMap({ ...value, ...other }) }; }

async function boot(config) {
  const elements = { setup: { hidden: false }, 'setup-help': { hidden: true }, 'setup-status': { textContent: '' } };
  const saved = { document: globalThis.document, window: globalThis.window, fetch: globalThis.fetch };
  let event, widget, initialized;
  globalThis.document = { getElementById: id => elements[id], createElement: () => ({}), head: { appendChild: script => script.onload() } };
  globalThis.window = { createClass: value => value, CMS: { registerWidget: (_, control) => { widget = control; }, registerEventListener: value => { event = value; }, init: value => { initialized = value; } } };
  globalThis.fetch = async () => new Response(JSON.stringify(config));
  try { await import(`../public/admin/admin.mjs?test=${Math.random()}`); }
  finally { Object.assign(globalThis, saved); }
  return { elements, event, widget, initialized };
}

test('unconfigured admin explains setup instead of starting a broken login', async () => {
  const result = await boot({ ...originalConfig, backend: { ...originalConfig.backend, base_url: '' } });
  assert.equal(result.elements['setup-help'].hidden, false);
  assert.match(result.elements['setup-status'].textContent, /설정/);
  assert.equal(result.initialized, undefined);
});

test('configured admin registers all fields and the Alumni pre-save operation', async () => {
  const result = await boot({ ...originalConfig, backend: { ...originalConfig.backend, base_url: 'https://erilab-auth.example.workers.dev' } });
  assert.equal(result.elements.setup.hidden, true);
  assert.equal(result.initialized.config.load_config_file, false);
  assert.equal(result.initialized.config.backend.repo, 'hwslim/hwslim.github.io');
  assert.equal(result.event.name, 'preSave');
  const saved = result.event.handler({ entry: fakeMap({ collection: 'people', data: fakeMap({ name: 'Person', group: 'Alumni', position: 0, destination: 'Company', email: 'person@kist.re.kr', cv_file: '/uploads/cv.pdf' }) }) }).toJS();
  assert.equal(saved.email, '');
  assert.equal(saved.cv_file, '');
  assert.throws(() => result.event.handler({ entry: fakeMap({ collection: 'people', data: fakeMap({ ...saved, destination: '' }) }) }), /기관/);
  const home = JSON.parse(readFileSync('content/settings/home.json', 'utf8'));
  assert.deepEqual(result.event.handler({ entry: fakeMap({ collection: 'settings', slug: 'home', data: fakeMap(home) }) }).toJS(), home);
});
