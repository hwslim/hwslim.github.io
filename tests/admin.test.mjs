import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const originalConfig = JSON.parse(readFileSync('public/admin/config.json', 'utf8'));
function fakeMap(value) {
  return {
    get: (key, fallback) => value[key] ?? fallback,
    getIn: (keys, fallback) => keys.reduce((current, key) => current?.get ? current.get(key) : current?.[key], value) ?? fallback,
    toJS: () => value,
    merge: other => fakeMap({ ...value, ...other }),
  };
}

async function boot(config) {
  const elements = { setup: { hidden: false }, 'setup-help': { hidden: true }, 'setup-status': { textContent: '' } };
  const saved = { document: globalThis.document, window: globalThis.window, fetch: globalThis.fetch };
  let event, initialized;
  const widgets = {};
  const browserDocument = Object.assign(new EventTarget(), { getElementById: id => elements[id], createElement: () => ({}), head: { appendChild: script => script.onload() } });
  const browserWindow = {
    createClass: value => value,
    h: (type, props, ...children) => ({ type, props, children: children.flat() }),
    CustomEvent: class extends Event { constructor(name, options) { super(name); this.detail = options.detail; } },
    CMS: { registerWidget: (name, control) => { widgets[name] = control; }, getWidget: name => ({ control: name === 'text' ? 'textarea' : 'input' }), registerEventListener: value => { event = value; }, init: value => { initialized = value; } },
  };
  globalThis.document = browserDocument;
  globalThis.window = browserWindow;
  globalThis.fetch = async () => new Response(JSON.stringify(config));
  try { await import(`../public/admin/admin.mjs?test=${Math.random()}`); }
  finally { Object.assign(globalThis, saved); }
  return { elements, event, widgets, initialized, browserDocument, browserWindow };
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
  const archived = result.event.handler({ entry: fakeMap({ collection: 'people', data: fakeMap({ name: 'Former Student', name_ko: '이전학생', group: 'Alumni', education: 'Undergraduate Student', position: 0, email: 'student@kist.re.kr' }) }) }).toJS();
  assert.equal(archived.group, 'Former Undergraduate Students');
  assert.equal(archived.name_ko, '이전학생');
  assert.equal(archived.email, '');
  assert.equal(archived.destination, '');
  assert.deepEqual(result.event.handler({ entry: fakeMap({ collection: 'people', data: fakeMap(archived) }) }).toJS(), archived);
  const home = JSON.parse(readFileSync('content/settings/home.json', 'utf8'));
  assert.deepEqual(result.event.handler({ entry: fakeMap({ collection: 'settings', slug: 'home', data: fakeMap(home) }) }).toJS(), home);
});

test('news situation toggles fill both editable fields and protect an existing draft', async () => {
  const result = await boot({ ...originalConfig, backend: { ...originalConfig.backend, base_url: 'https://erilab-auth.example.workers.dev' } });
  const savedGlobals = { window: globalThis.window, document: globalThis.document };
  globalThis.window = result.browserWindow;
  globalThis.document = result.browserDocument;
  const data = { template: '', title: '', body: '', date: '2026-10-07', image: '/uploads/photo.jpg', link: 'https://example.org/paper' };
  const untouched = { date: data.date, image: data.image, link: data.link };
  const controls = [];
  try {
    for (const name of ['title', 'body']) {
      const control = Object.assign(Object.create(result.widgets[`erilab-news-${name}`]), {
        props: { value: data[name], onChange: value => { data[name] = value; control.props.value = value; } },
      });
      control.applyTemplate = control.applyTemplate.bind(control);
      control.componentDidMount();
      controls.push(control);
    }
    const selector = Object.assign(Object.create(result.widgets['erilab-news-template']), {
      props: {
        value: '', forID: 'news-template', classNameWrapper: 'control', field: fakeMap({ label: '소식 상황' }),
        getEntry: () => fakeMap({ data }),
        onChange: value => { data.template = value; selector.props.value = value; },
      },
    });
    const rendered = selector.render();
    assert.equal(rendered.props.role, 'radiogroup');
    assert.equal(rendered.children[1].children[1], '논문 합격');
    rendered.children[1].children[0].props.onChange({ target: { value: 'paper-accepted' } });
    assert.equal(data.title, 'Paper Accepted to [Conference] [Year]');
    assert.equal(data.body, 'Our paper, “[Paper Title],” has been accepted to [Conference] [Year].\nCongratulations to the authors!');
    window.confirm = () => { throw new Error('An untouched template can be switched immediately.'); };
    selector.selectTemplate('papers-accepted');
    assert.match(data.title, /\[Number\] Papers Accepted/);
    selector.selectTemplate('paper-accepted');
    assert.equal(controls[0].render().type, 'input');
    assert.equal(controls[1].render().type, 'textarea');
    controls[1].render().props.onChange('Manually edited announcement.');
    const edited = result.event.handler({ entry: fakeMap({ collection: 'news', data: fakeMap(data) }) }).toJS();
    assert.equal(edited.body, 'Manually edited announcement.');
    assert.equal(edited.template, 'paper-accepted');
    let confirmations = 0;
    window.confirm = () => { confirmations++; return false; };
    selector.selectTemplate('welcome');
    assert.equal(confirmations, 1);
    assert.equal(data.template, 'paper-accepted');
    assert.equal(data.body, 'Manually edited announcement.');
    window.confirm = () => true;
    selector.selectTemplate('welcome');
    assert.equal(data.title, 'Welcome to ERILab, [Name]!');
    assert.match(data.body, /joins us as a \[Role\]/);
    assert.deepEqual({ date: data.date, image: data.image, link: data.link }, untouched);
    const draft = { ...data };
    window.confirm = () => { throw new Error('Direct writing should not ask to overwrite.'); };
    selector.selectTemplate('');
    assert.deepEqual(data, { ...draft, template: '' });
    const persisted = result.event.handler({ entry: fakeMap({ collection: 'news', data: fakeMap(data) }) }).toJS();
    assert.deepEqual(persisted, data);
    assert.throws(() => result.event.handler({ entry: fakeMap({ collection: 'news', data: fakeMap({ ...data, template: 'unknown' }) }) }), /상황/);
    for (const control of controls) control.componentWillUnmount();
    document.dispatchEvent(new window.CustomEvent('erilab:news-template', { detail: { title: 'Stale update', body: 'Stale update' } }));
    assert.deepEqual(data, persisted);
  } finally {
    for (const control of controls) control.componentWillUnmount();
    Object.assign(globalThis, savedGlobals);
  }
});
