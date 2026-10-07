import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(file => file.isDirectory() ? files(join(directory, file.name)) : [join(directory, file.name)]);
}
const references = new Set();
for (const file of files('content').filter(file => file.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const value of Object.values(data)) {
    if (typeof value !== 'string' || !/^(\/|https?:\/\/)/.test(value)) continue;
    const url = new URL(value, 'https://erilab.xyz');
    if (url.origin === 'https://erilab.xyz') references.add(decodeURIComponent(url.pathname));
  }
}
let removed = 0;
for (const file of [...files('out/uploads'), ...files('out/assets/people')]) {
  if (!references.has(`/${relative('out', file)}`)) { rmSync(file); removed++; }
}
console.log(`Removed ${removed} unreferenced profile/upload files from the public build.`);
