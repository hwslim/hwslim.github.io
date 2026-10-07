import type { ReactNode } from 'react';
import { getSettings, linkUrl, sitePath } from '../lib/content.mjs';

export type Entry = Record<string, string>;
const site = getSettings();

export function SiteShell({ page, children }: { page: string; children: ReactNode }) {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><div className="container header-inner">
      <a className="brand" href={sitePath('/')} aria-label={`${site.lab_name} home`}>
        {site.logo ? <img src={linkUrl(site.logo)} alt={site.lab_name} width="160" height="55" /> : <strong>{site.lab_name}</strong>}
      </a>
      <nav className="site-nav" aria-label="Main navigation">{['home', 'research', 'people', 'publications', 'news', 'gallery', 'contact'].map(name =>
        <a key={name} href={sitePath(name === 'home' ? '/' : `/${name}/`)} aria-current={page === name ? 'page' : undefined}>{site[`nav_${name}`]}</a>)}</nav>
    </div></header>
    <main id="main">{children}</main>
    <footer className="site-footer"><div className="container footer-main">
      <div><a className="footer-name" href={sitePath('/')}>{site.lab_name}<span className="accent-dot">.</span></a><p>{site.full_name}</p></div>
      <div><p className="footer-description">{site.footer_text}</p><p className="muted">{site.affiliation}</p></div>
    </div><div className="container footer-bottom"><span>{site.lab_name} · {site.affiliation}</span><a href={sitePath('/admin/')}>Admin</a></div></footer>
  </>;
}

export function ResearchCards({ entries }: { entries: Entry[] }) {
  return <div className="research-grid">{entries.map((item, index) => <article className="research-card" key={item.id}>
    <span className="research-number">{String(index + 1).padStart(2, '0')}</span>
    {item.image && <img className="research-image" src={linkUrl(item.image)} alt={item.title} loading="lazy" />}
    <h3>{linkUrl(item.link) ? <a href={linkUrl(item.link)} target="_blank" rel="noopener noreferrer">{item.title} <span className="small-arrow">↗</span></a> : item.title}</h3>
    <p className="preserve-lines">{item.summary}</p>
  </article>)}</div>;
}

export function PeopleCards({ entries }: { entries: Entry[] }) {
  return <div className="people-grid">{entries.map(person => <article className="person-card" key={person.id}>
    {person.image ? <div className="portrait"><img src={linkUrl(person.image)} alt={person.name} width="500" height="500" loading="lazy" /></div>
      : <div className="portrait initials" aria-hidden="true">{person.name.slice(0, 1)}</div>}
    <h3>{linkUrl(person.link) ? <a href={linkUrl(person.link)} target="_blank" rel="noopener noreferrer">{person.name} <span className="small-arrow">↗</span></a> : person.name}</h3>
    {person.group === 'Students' ? person.school && <p className="person-role">{person.school}</p> : <p className="person-role">{person.education && person.education !== person.role && `${person.education} · `}{person.role}</p>}
    {person.special_service === '1' && <span className="service-badge">Technical Research Personnel</span>}
    {person.school && person.group !== 'Students' && <p className="person-school">{person.school}</p>}
    {person.bio && <p className="person-bio preserve-lines">{person.bio}</p>}
    {person.email && <a className="person-email" href={`mailto:${person.email}`}>{person.email}</a>}
    {(linkUrl(person.cv_url) || linkUrl(person.cv_file)) && <div className="person-links">
      {linkUrl(person.cv_url) && <a href={linkUrl(person.cv_url)} target="_blank" rel="noopener noreferrer">CV ↗</a>}
      {linkUrl(person.cv_file) && <a href={linkUrl(person.cv_file)}>CV (PDF) ↓</a>}
    </div>}
  </article>)}</div>;
}

export function AlumniList({ entries }: { entries: Entry[] }) {
  return <div className="alumni-list">{entries.map(person => <article className="alumni-row" key={person.id}><div><h3>{person.name}</h3></div><p>{person.destination}</p></article>)}</div>;
}

export function PublicationList({ entries }: { entries: Entry[] }) {
  return <div className="publication-list">{entries.map(item => <article className="publication" key={item.id}>
    {item.image && <img src={linkUrl(item.image)} alt={item.title} loading="lazy" />}
    <div className="publication-content"><div className="publication-meta"><span>{item.venue} · {item.year}</span>
      {['Oral', 'Spotlight'].includes(item.status) && <span className="status-tag">{item.status}</span>}
    </div><h3>{item.title}</h3><p className="authors preserve-lines">{item.authors}</p>
    <div className="publication-links">{[['paper_url', 'Paper'], ['code_url', 'Code'], ['project_url', 'Project']].map(([key, label]) =>
      linkUrl(item[key]) && <a key={key} href={linkUrl(item[key])} target="_blank" rel="noopener noreferrer">{key === 'paper_url' && /^https?:\/\/arxiv\.org\//.test(item[key]) ? 'arXiv' : label} ↗</a>)}</div></div>
  </article>)}</div>;
}

export function NewsList({ entries }: { entries: Entry[] }) {
  return <div className="news-list">{entries.map(item => <article className="news-item" key={item.id}>
    <time dateTime={item.date}>{item.date}</time><div><h3>{linkUrl(item.link) ? <a href={linkUrl(item.link)} target="_blank" rel="noopener noreferrer">{item.title} ↗</a> : item.title}</h3>
    <p className="preserve-lines">{item.body}</p>{item.image && <img src={linkUrl(item.image)} alt={item.title} loading="lazy" />}</div>
  </article>)}</div>;
}

export function GalleryCards({ entries }: { entries: Entry[] }) {
  return <div className="gallery-grid">{entries.map(item => <figure className="gallery-card" key={item.id}>
    <a className="gallery-photo" href={linkUrl(item.image)} target="_blank" rel="noopener noreferrer" aria-label={`View ${item.title} full-size`}>
      <img src={linkUrl(item.image)} alt={item.title} loading="lazy" />
    </a>
    <figcaption><time dateTime={item.date}>{item.date}</time><h2>{item.title}</h2>
      {item.caption && <p className="preserve-lines">{item.caption}</p>}
    </figcaption>
  </figure>)}</div>;
}
