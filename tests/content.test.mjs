import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize, getRecords, sortRecords, researcherRank, publicPerson, linkUrl } from '../lib/content.mjs';
import { prepareEntry, validateEntry } from '../public/admin/validation.mjs';

const config = JSON.parse(readFileSync('public/admin/config.json', 'utf8'));
const fields = kind => config.collections.find(collection => collection.name === kind).fields;
const person = { name: 'Test Person', group: 'Researchers', education: 'Ph.D.', role: 'Postdoctoral Researcher', position: 0, special_service: false };

test('all migrated records satisfy the same rules used by the editor', () => {
  for (const kind of ['people', 'publications', 'research', 'news', 'gallery']) {
    for (const entry of getRecords(kind)) assert.doesNotThrow(() => validateEntry(kind, entry, fields(kind)));
  }
});

test('researchers sort by rank with postdocs and technical service at the same rank', () => {
  const entries = [
    { ...person, id: '1', role: 'Postdoctoral Researcher', position: '4' },
    { ...person, id: '2', role: 'Senior Researcher', position: '9' },
    { ...person, id: '3', role: 'Researcher', special_service: '1', position: '2' },
    { ...person, id: '4', role: 'Principal Researcher', position: '10' },
    { ...person, id: '5', role: 'Researcher', position: '0' },
  ];
  const sorted = sortRecords(entries, 'people').sort((a, b) => researcherRank(a) - researcherRank(b));
  assert.deepEqual(sorted.map(entry => entry.id), ['4', '2', '3', '1', '5']);
});

test('moving to Alumni clears profile fields and requires the destination', () => {
  const data = prepareEntry('people', { ...person, group: 'Alumni', email: 'person@kist.re.kr', image: '/uploads/portrait.png', cv_file: '/uploads/cv.pdf', cv_url: 'https://example.org/cv', school: 'KIST', bio: 'Biography', special_service: true, destination: 'Company' });
  validateEntry('people', data, fields('people'));
  for (const field of ['education', 'role', 'email', 'image', 'cv_file', 'cv_url', 'school', 'bio']) assert.equal(data[field], '');
  assert.equal(data.special_service, false);
  assert.deepEqual(Object.keys(publicPerson(normalize(data))).sort(), ['destination', 'group', 'id', 'name', 'position']);
  assert.throws(() => validateEntry('people', { ...data, destination: '' }, fields('people')), /기관/);
  assert.throws(() => validateEntry('people', { ...data, email: 'person@kist.re.kr' }, fields('people')), /Alumni/);
});

test('student programs and official Intern title survive migration', () => {
  const student = prepareEntry('people', { ...person, group: 'Students', education: 'M.S. Student', school: 'KAIST' });
  validateEntry('people', student, fields('people'));
  assert.equal(publicPerson(normalize(student)).role, 'M.S. Student');
  assert.equal(publicPerson({ ...person, group: 'Interns' }).role, 'Intern');
  assert.throws(() => validateEntry('people', { ...student, education: 'M.S.' }, fields('people')), /학생/);
  assert.throws(() => validateEntry('people', { ...person, education: 'Ph.D. Student' }, fields('people')), /학위/);
});

test('publication badge choices are only none, Oral, Spotlight', () => {
  const paper = { title: 'Paper', authors: 'Author', venue: 'arXiv', year: 2026, position: 0 };
  for (const status of ['', 'Oral', 'Spotlight']) validateEntry('publications', { ...paper, status }, fields('publications'));
  for (const status of ['Accepted', 'Poster', 'Workshop', 'Demo']) assert.throws(() => validateEntry('publications', { ...paper, status }, fields('publications')), /옵션/);
});

test('unsafe links and invalid CV files are rejected before saving', () => {
  for (const link of ['javascript:alert(1)', '//evil.example', '/uploads/../secret', 'file:///tmp/cv', 'https://example.org/a b']) {
    assert.throws(() => validateEntry('people', { ...person, cv_url: link }, fields('people')));
  }
  assert.equal(linkUrl('javascript:alert(1)'), '');
  validateEntry('people', { ...person, cv_url: 'https://example.org/cv', cv_file: '/uploads/person.pdf' }, fields('people'));
  assert.throws(() => validateEntry('people', { ...person, cv_file: '/uploads/person.exe' }, fields('people')), /pdf/);
});

test('latest news and publication year ordering remain correct when records are added', () => {
  assert.deepEqual(sortRecords([{ id: '1', date: '2026-01-02' }, { id: '2', date: '2026-09-02' }], 'news').map(item => item.id), ['2', '1']);
  assert.deepEqual(sortRecords([{ id: '1', year: '2024' }, { id: '2', year: '2026' }], 'publications').map(item => item.id), ['2', '1']);
});

test('gallery requires a dated photo and displays newer events before older uploads', () => {
  const photo = { title: 'Lab group photo', date: '2026-09-10', image: '/uploads/group.jpg' };
  assert.doesNotThrow(() => validateEntry('gallery', photo, fields('gallery')));
  for (const image of ['', '/uploads/cv.pdf', 'javascript:alert(1)']) {
    assert.throws(() => validateEntry('gallery', { ...photo, image }, fields('gallery')));
  }
  assert.throws(() => validateEntry('gallery', { ...photo, date: '2026-02-30' }, fields('gallery')), /날짜/);
  const photos = [
    { ...photo, id: 'later-upload', date: '2025-12-20' },
    { ...photo, id: 'earlier-upload', date: '2026-09-10' },
  ];
  assert.deepEqual(sortRecords(photos, 'gallery').map(item => item.id), ['earlier-upload', 'later-upload']);
});
