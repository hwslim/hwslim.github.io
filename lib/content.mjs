import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

/** @typedef {Record<string, string>} Entry */
/** @param {Record<string, unknown>} input @returns {Entry} */
export function normalize(input) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === true ? '1' : value === false ? '' : String(value ?? '')]));
}

export function getSettings() {
  return Object.assign({}, ...['site', 'home', 'pages', 'contact'].map(group =>
    normalize(JSON.parse(readFileSync(join(process.cwd(), 'content/settings', `${group}.json`), 'utf8')))));
}

/** @param {Entry[]} entries @param {string} kind */
export function sortRecords(entries, kind) {
  return [...entries].sort((a, b) => ['news', 'gallery'].includes(kind)
    ? b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    : Number(b.year || 0) - Number(a.year || 0) || Number(a.position || 0) - Number(b.position || 0) || a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/** @param {string} kind @returns {Entry[]} */
export function getRecords(kind) {
  const directory = join(process.cwd(), 'content', kind);
  return sortRecords(readdirSync(directory).filter(file => file.endsWith('.json')).map(file => {
    const entry = normalize(JSON.parse(readFileSync(join(directory, file), 'utf8')));
    return { ...entry, id: entry.id || basename(file, '.json') };
  }), kind);
}

/** @param {Entry} person */
export function researcherRank(person) {
  if (['Head, Principal Researcher', 'Principal Researcher'].includes(person.role)) return 0;
  if (person.role === 'Senior Researcher') return 1;
  if (person.role === 'Postdoctoral Researcher' || person.special_service === '1') return 2;
  return 3;
}

/** @param {Entry} person @returns {Entry | null} */
export function publicPerson(person) {
  if (person.group === 'Former Undergraduate Students') return null;
  if (person.group === 'Alumni') return { id: person.id, name: person.name, destination: person.destination, group: 'Alumni', position: person.position };
  return { ...person, role: person.group === 'Interns' ? 'Intern' : person.group === 'Students' ? person.education : person.role };
}

/** @param {string} authors @param {Entry[]} people */
export function publicationAuthorParts(authors, people) {
  const nameKey = name => name.toLowerCase().replace(/[\s.\-]/g, '');
  const memberNames = new Set(people.flatMap(person => {
    const words = person.name.trim().split(/\s+/);
    return [
      person.name,
      person.name_ko,
      [...words.slice(-1), ...words.slice(0, -1)].join(' '),
      words.length > 2 ? [words[0], ...words.slice(1, -1).map(word => word[0]), ...words.slice(-1)].join(' ') : '',
    ].filter(Boolean).map(nameKey);
  }));
  return authors.split(/([,;\n]+)/).map(text => ({ text, member: memberNames.has(nameKey(text)) }));
}

/** @param {string} path */
export function sitePath(path) { return `${process.env.PAGES_BASE_PATH || ''}${path}`; }

/** @param {string} value */
export function linkUrl(value) {
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return sitePath(value);
  try { return ['https:', 'http:'].includes(new URL(value).protocol) ? value : ''; } catch { return ''; }
}

export const peopleGroups = ['Principal Investigator', 'Researchers', 'Interns', 'Students', 'Alumni'];
export const studentPrograms = { 'Ph.D. Student': 'Ph.D. Students', 'M.S. Student': 'M.S. Students', 'Undergraduate Student': 'Undergraduate Students' };
