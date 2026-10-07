const alumniFields = ['name_ko', 'education', 'role', 'school', 'bio', 'image', 'link', 'email', 'cv_url', 'cv_file'];
const studentDegrees = ['Ph.D. Student', 'M.S. Student', 'Undergraduate Student'];

export function prepareEntry(kind, input) {
  const data = { ...input };
  if (kind === 'people' && data.group === 'Alumni') {
    for (const field of alumniFields) data[field] = '';
    data.special_service = false;
  }
  if (kind === 'people' && ['Students', 'Interns'].includes(data.group)) data.role = '';
  return data;
}

export function validateEntry(kind, data, fields) {
  for (const field of fields) {
    const value = data[field.name];
    const empty = value === undefined || value === null || value === '';
    if (field.required && empty) throw new Error(`${field.label}: 값을 입력하세요.`);
    if (empty) continue;
    if (field.widget === 'erilab-options' && !field.options.some(option => option.value === value)) throw new Error(`${field.label}: 정해진 옵션을 선택하세요.`);
    if (field.widget === 'number' && (!Number.isInteger(Number(value)) || Number(value) < field.min || Number(value) > field.max)) throw new Error(`${field.label}: ${field.min}–${field.max} 사이의 정수를 입력하세요.`);
    if (field.widget === 'boolean' && ![true, false, '1', ''].includes(value)) throw new Error(`${field.label}: 켜기/끄기를 선택하세요.`);
    if (field.name.includes('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`${field.label}: 이메일 주소를 확인하세요.`);
    if (field.widget === 'datetime') {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error(`${field.label}: 올바른 날짜를 입력하세요.`);
    }
    if (field.name.endsWith('_url') || ['link', 'image', 'logo', 'hero_image', 'cv_file'].includes(field.name)) {
      let url;
      try {
        url = new URL(value, 'https://erilab.xyz');
        if ((!/^https?:\/\//.test(value) && !/^\/(?!\/)/.test(value)) || !['http:', 'https:'].includes(url.protocol) || /[\s\\]/.test(value) || /(^|\/)\.\.(\/|$)/.test(value)) throw new Error();
      } catch { throw new Error(`${field.label}: http(s) 주소 또는 /로 시작하는 파일 경로를 입력하세요.`); }
      if (field.media_extensions && !field.media_extensions.includes(url.pathname.split('.').pop().toLowerCase())) throw new Error(`${field.label}: ${field.media_extensions.join(', ')} 파일만 사용할 수 있습니다.`);
    }
  }
  if (kind === 'people') {
    if (data.group === 'Alumni') {
      if (!String(data.destination || '').trim()) throw new Error('Alumni의 이동한 기관·진로를 입력하세요.');
      if (alumniFields.some(field => data[field]) || data.special_service === true || data.special_service === '1') throw new Error('Alumni에는 이름과 이동한 기관·진로만 남겨주세요.');
    } else {
      const isStudent = data.group === 'Students';
      if (isStudent && !studentDegrees.includes(data.education)) throw new Error('학생은 박사과정·석사과정·학부생 중 하나를 선택하세요.');
      if (!isStudent && studentDegrees.includes(data.education)) throw new Error('현 연구원은 학위(Ph.D./M.S./B.S.)를 선택하세요.');
      if (['Researchers', 'Principal Investigator'].includes(data.group) && !data.role) throw new Error('직함을 선택하세요.');
    }
  }
  return data;
}
