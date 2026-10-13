import { SiteShell, ResearchCards, PublicationList, NewsList } from '../components/site';
import { VisionVisual } from '../components/vision-visual';
import { SiteImage } from '../components/site-image';
import { getSettings, getRecords, linkUrl, sitePath } from '../lib/content.mjs';

export default function Home() {
  const site = getSettings();
  const research = getRecords('research');
  const publications = getRecords('publications').slice(0, 3);
  const news = getRecords('news').slice(0, 3);
  return <SiteShell page="home">
    <section className="hero container">
      <div className="hero-copy">
        <p className="eyebrow"><span className="tiny-dot" />{site.hero_eyebrow}</p>
        <h1 className="preserve-lines">{site.hero_title}</h1>
        <p className="hero-description preserve-lines">{site.hero_description}</p>
        <div className="hero-actions"><a className="button primary" href={sitePath('/research/')}>{site.research_button} <span>↗</span></a><a className="text-link" href={sitePath('/people/')}>{site.people_button} <span>→</span></a></div>
        <p className="hero-affiliation">{site.affiliation}</p>
      </div>
      <figure className="hero-figure"><div className={`visual-surface${site.hero_image ? ' has-photo' : ''}`}>{site.hero_image ? <SiteImage className="hero-photo" src={linkUrl(site.hero_image)} alt={site.hero_caption} /> : <VisionVisual caption={site.hero_caption} />}</div>
        {site.hero_caption && <figcaption><span className="caption-line" />{site.hero_caption}</figcaption>}
      </figure>
    </section>
    {research.length > 0 && <section className="section section-tinted"><div className="container"><div className="section-heading"><div><p className="eyebrow">{site.nav_research}</p><h2>{site.home_research_title}</h2><p>{site.home_research_intro}</p></div><a className="text-link" href={sitePath('/research/')}>{site.view_all_label} →</a></div><ResearchCards entries={research} /></div></section>}
    <section className="section container"><div className="section-heading"><div><p className="eyebrow">{site.nav_news}</p><h2>{site.home_news_title}</h2></div><a className="text-link" href={sitePath('/news/')}>{site.view_all_label} →</a></div>{news.length ? <NewsList entries={news} /> : <p className="empty-state">{site.news_empty}</p>}</section>
    {publications.length > 0 && <section className="section section-tinted"><div className="container"><div className="section-heading"><div><p className="eyebrow">{site.nav_publications}</p><h2>{site.home_publications_title}</h2></div><a className="text-link" href={sitePath('/publications/')}>{site.view_all_label} →</a></div><PublicationList entries={publications} /></div></section>}
  </SiteShell>;
}
