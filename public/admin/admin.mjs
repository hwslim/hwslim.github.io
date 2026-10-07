import { prepareEntry, validateEntry } from './validation.mjs';

const status = document.getElementById('setup-status');
try {
  const response = await fetch('./config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('관리자 설정 파일을 불러오지 못했습니다.');
  const config = await response.json();
  if (!config.backend.base_url) {
    status.textContent = '최초 로그인 설정이 필요합니다.';
    document.getElementById('setup-help').hidden = false;
  } else {
    status.textContent = 'GitHub 로그인 화면을 불러오고 있습니다.';
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/decap-cms@3.16.3/dist/decap-cms.js';
      script.integrity = 'sha384-A/Gdn928CNLufmnGWGs9RM4Q9o8bSNLeJERqBFrBjwzL7FRpoLT3MPF8Tl0+Wd2p';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = () => reject(new Error('관리자 화면을 불러오지 못했습니다. 네트워크 연결을 확인하세요.'));
      document.head.appendChild(script);
    });
    const OptionsControl = window.createClass({
      isValid() {
        const value = this.props.value || '';
        if (!value && !this.props.field.get('required', true)) return true;
        return this.props.field.get('options').some(option => option.get('value') === value);
      },
      render() {
        const { field, forID, onChange, value, classNameWrapper } = this.props;
        return window.h('div', { id: forID, className: `${classNameWrapper} erilab-options`, role: 'radiogroup', 'aria-label': field.get('label') },
          field.get('options').map(option => window.h('label', { key: option.get('value'), className: 'erilab-option' },
            window.h('input', { type: 'radio', name: forID, value: option.get('value'), checked: (value || '') === option.get('value'), onChange: event => onChange(event.target.value) }), option.get('label'))).toArray());
      },
    });
    window.CMS.registerWidget('erilab-options', OptionsControl);
    window.CMS.registerEventListener({
      name: 'preSave',
      handler: ({ entry }) => {
        const kind = entry.get('collection');
        const collection = config.collections.find(item => item.name === kind);
        const fields = collection.files ? collection.files.find(file => file.name === entry.get('slug')).fields : collection.fields;
        const original = entry.get('data');
        const data = prepareEntry(kind, original.toJS());
        validateEntry(kind, data, fields);
        return original.merge(data);
      },
    });
    window.CMS.init({ config: { ...config, load_config_file: false } });
    document.getElementById('setup').hidden = true;
  }
} catch (error) {
  status.textContent = error.message;
}
