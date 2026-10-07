import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('only unreferenced media is removed, retaining CV links and same-site absolute URLs', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'erilab-media-test-'));
  const originalDirectory = process.cwd();
  try {
    for (const folder of ['content/people', 'out/uploads', 'out/assets/people']) mkdirSync(join(directory, folder), { recursive: true });
    writeFileSync(join(directory, 'content/people/person.json'), JSON.stringify({ cv_url: '/uploads/cv.pdf', image: 'https://erilab.xyz/assets/people/photo.png?version=1' }));
    for (const file of ['uploads/cv.pdf', 'uploads/old-cv.pdf', 'assets/people/photo.png', 'assets/people/alumni-photo.png']) writeFileSync(join(directory, 'out', file), 'fixture');
    process.chdir(directory);
    await import('../scripts/prune-media.mjs');
    assert.equal(existsSync(join(directory, 'out/uploads/cv.pdf')), true);
    assert.equal(existsSync(join(directory, 'out/assets/people/photo.png')), true);
    assert.equal(existsSync(join(directory, 'out/uploads/old-cv.pdf')), false);
    assert.equal(existsSync(join(directory, 'out/assets/people/alumni-photo.png')), false);
  } finally { process.chdir(originalDirectory); rmSync(directory, { recursive: true, force: true }); }
});
