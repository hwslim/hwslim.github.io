export const newsTemplates = [
  {
    value: 'paper-accepted', label: '논문 합격',
    title: 'Paper Accepted to [Conference] [Year]',
    body: 'Our paper, “[Paper Title],” has been accepted to [Conference] [Year].\nCongratulations to the authors!',
  },
  {
    value: 'papers-accepted', label: '여러 논문 합격',
    title: '[Number] Papers Accepted to [Conference] [Year]',
    body: '[Number] papers from ERILab have been accepted to [Conference] [Year].\nCongratulations to all authors!',
  },
  {
    value: 'journal-accepted', label: '저널 게재 승인',
    title: 'Paper Accepted for Publication in [Journal]',
    body: 'Our paper, “[Paper Title],” has been accepted for publication in [Journal].\nCongratulations to the authors!',
  },
  {
    value: 'oral', label: 'Oral 선정',
    title: 'Oral Presentation at [Conference] [Year]',
    body: 'Our paper, “[Paper Title],” has been accepted to [Conference] [Year] and selected for an oral presentation.\nCongratulations to the authors!',
  },
  {
    value: 'spotlight', label: 'Spotlight 선정',
    title: 'Spotlight at [Conference] [Year]',
    body: 'Our paper, “[Paper Title],” has been accepted to [Conference] [Year] and selected as a spotlight.\nCongratulations to the authors!',
  },
  {
    value: 'preprint', label: 'arXiv 공개',
    title: 'New Preprint: [Paper Title]',
    body: 'Our new preprint, “[Paper Title],” is now available on arXiv.',
  },
  {
    value: 'welcome', label: '새 구성원 합류',
    title: 'Welcome to ERILab, [Name]!',
    body: 'Welcome to ERILab, [Name]!\n[Name] joins us as a [Role].',
  },
  {
    value: 'graduation', label: '졸업',
    title: 'Congratulations on Your Graduation, [Name]!',
    body: 'Congratulations to [Name] on completing their [Degree] at [University]!',
  },
  {
    value: 'career', label: '새로운 진로',
    title: '[Name] Joins [Organization]',
    body: '[Name] is joining [Organization] as a [Position].\nCongratulations on this new chapter!',
  },
  {
    value: 'award', label: '수상·장학금',
    title: '[Name] Receives [Award Name]',
    body: 'Congratulations to [Name] on receiving the [Award Name]!',
  },
  {
    value: 'release', label: '코드·데이터셋 공개',
    title: '[Code/Dataset] Released for [Project Title]',
    body: 'We have released the [code/dataset] for “[Project Title].”\nCheck it out at the link below.',
  },
  {
    value: 'talk', label: '초청 강연·세미나',
    title: '[Name] Gives an Invited Talk at [Institution/Event]',
    body: '[Name] gave an invited talk on “[Topic]” at [Institution/Event].',
  },
  {
    value: 'collaboration', label: '공동연구 시작',
    title: 'New Collaboration with [Organization]',
    body: 'We are starting a collaboration with [Organization] on [Research Topic].',
  },
  {
    value: 'event', label: '연구실 행사',
    title: 'ERILab [Event Name]',
    body: 'ERILab held its [Event Name] on [Date], bringing the team together for [Activity].',
  },
];

export function registerNewsWidgets() {
  const CMS = window.CMS;
  const eventName = 'erilab:news-template';
  const TemplateControl = window.createClass({
    isValid() { return !this.props.value || newsTemplates.some(item => item.value === this.props.value); },
    selectTemplate(value) {
      const template = newsTemplates.find(item => item.value === value);
      if (template) {
        const entry = this.props.getEntry();
        const title = entry.getIn(['data', 'title'], '') || '';
        const body = entry.getIn(['data', 'body'], '') || '';
        const previous = newsTemplates.find(item => item.value === this.props.value);
        const unchanged = previous && title === previous.title && body === previous.body;
        if ((title || body) && !unchanged && !window.confirm('작성한 제목과 본문을 선택한 템플릿으로 바꿀까요? 날짜·사진·링크는 유지됩니다.')) return;
      }
      this.props.onChange(value);
      if (template) document.dispatchEvent(new window.CustomEvent(eventName, { detail: template }));
    },
    render() {
      const { field, forID, value, classNameWrapper } = this.props;
      return window.h('div', { id: forID, className: `${classNameWrapper} erilab-options`, role: 'radiogroup', 'aria-label': field.get('label') },
        [{ value: '', label: '직접 작성' }, ...newsTemplates].map(item => window.h('label', { key: item.value, className: 'erilab-option' },
          window.h('input', { type: 'radio', name: forID, value: item.value, checked: (value || '') === item.value, onChange: event => this.selectTemplate(event.target.value) }), item.label)));
    },
  });
  CMS.registerWidget('erilab-news-template', TemplateControl);
  for (const [name, widget] of [['title', 'string'], ['body', 'text']]) {
    const Control = CMS.getWidget(widget).control;
    CMS.registerWidget(`erilab-news-${name}`, window.createClass({
      componentDidMount() { document.addEventListener(eventName, this.applyTemplate); },
      componentWillUnmount() { document.removeEventListener(eventName, this.applyTemplate); },
      applyTemplate(event) { this.props.onChange(event.detail[name]); },
      render() { return window.h(Control, this.props); },
    }));
  }
}
