import { SiteShell, ResearchCards, PeopleCards, AlumniList, PublicationList, NewsList, GalleryCards } from './site';
import { SiteImage } from './site-image';
import { getSettings, getRecords, peopleGroups, studentPrograms, researcherRank, publicPerson, linkUrl } from '../lib/content.mjs';

export function ContentPage({ page }: { page: string }) {
  const site = getSettings();
  const entries = page === 'contact' ? [] : getRecords(page);
  const people = entries.map(publicPerson);
  const studentRecruiting: Record<string, string> = {
    'Ph.D. Student': site.phd_students_empty,
    'M.S. Student': site.ms_students_empty,
    'Undergraduate Student': site.undergraduate_students_empty,
  };
  const years = [...new Set(entries.map(item => item.year))].sort((a, b) => Number(b) - Number(a));
  return <SiteShell page={page}>
    <section className="page-intro container"><p className="eyebrow"><span className="tiny-dot" />{site.affiliation}</p><h1>{site[`${page}_title`]}</h1><p className="preserve-lines">{site[`${page}_intro`]}</p></section>
    <section className="page-body container">
      {page === 'research' && (entries.length ? <ResearchCards entries={entries} /> : <p className="empty-state">{site.research_empty}</p>)}
      {page === 'people' && peopleGroups.map(group => {
        const members = people.filter(person => person.group === group);
        if (group === 'Principal Investigator' && !members.length) return null;
        if (group === 'Researchers') members.sort((a, b) => researcherRank(a) - researcherRank(b));
        return <div className="people-group" key={group}><h2 className="group-title">{group}</h2>
          {group === 'Students' ? Object.entries(studentPrograms).map(([program, label]) => {
            const students = members.filter(person => person.education === program);
            return <div className="student-group" key={program}><h3 className="student-title">{label}</h3>{students.length ? <PeopleCards entries={students} /> : <p className="group-empty">{studentRecruiting[program]}</p>}</div>;
          }) : members.length ? (group === 'Alumni' ? <AlumniList entries={members} /> : <PeopleCards entries={members} />) : <p className="group-empty">{site[group === 'Alumni' ? 'alumni_empty' : group === 'Interns' ? 'interns_empty' : 'people_empty']}</p>}
        </div>;
      })}
      {page === 'publications' && (entries.length ? years.map(year => <div className="publication-year" key={year}><h2 className="year-label">{year}</h2><PublicationList entries={entries.filter(item => item.year === year)} /></div>) : <p className="empty-state">{site.publications_empty}</p>)}
      {page === 'news' && (entries.length ? <NewsList entries={entries} /> : <p className="empty-state">{site.news_empty}</p>)}
      {page === 'gallery' && (entries.length ? <GalleryCards entries={entries} /> : <p className="empty-state">{site.gallery_empty}</p>)}
      {page === 'contact' && <div className="contact-grid"><div className="contact-panel">{linkUrl(site.kist_logo) && linkUrl(site.contact_url) && <a className="contact-logo" href={linkUrl(site.contact_url)} target="_blank" rel="noopener noreferrer" aria-label={site.contact_link_label}><SiteImage src={linkUrl(site.kist_logo)} alt="KIST — Korea Institute of Science and Technology" width="1229" height="405" /></a>}<h2>{site.contact_location}</h2>{site.contact_address && <p className="preserve-lines">{site.contact_address}</p>}{linkUrl(site.contact_url) && <a className="text-link" href={linkUrl(site.contact_url)} target="_blank" rel="noopener noreferrer">{site.contact_link_label} ↗</a>}</div>{(site.join_description || site.contact_email) && <div className="join-panel"><h2>{site.join_title}</h2>{site.join_description && <p className="preserve-lines">{site.join_description}</p>}{site.contact_email && <a className="text-link" href={`mailto:${site.contact_email}`}>{site.contact_email} →</a>}</div>}</div>}
    </section>
  </SiteShell>;
}
