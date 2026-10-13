import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { validateEntry } from '../public/admin/validation.mjs';

const config = JSON.parse(readFileSync('public/admin/config.json', 'utf8'));
if (config.backend.base_url && !/^https:\/\/[^/]+$/.test(config.backend.base_url)) throw new Error('backend.base_url must be an HTTPS origin without a trailing slash.');
let count = 0;
for (const collection of config.collections) {
  const files = collection.files || readdirSync(collection.folder).filter(file => file.endsWith('.json')).map(file => ({ file: join(collection.folder, file), fields: collection.fields }));
  for (const file of files) {
    const data = JSON.parse(readFileSync(file.file, 'utf8'));
    try {
      validateEntry(collection.name, data, file.fields);
      for (const field of file.fields.filter(field => ['image', 'file'].includes(field.widget))) {
        const value = data[field.name];
        if (!value) continue;
        const url = new URL(value, config.site_url);
        if (url.origin !== config.site_url) continue;
        const path = join('public', decodeURIComponent(url.pathname));
        if (!statSync(path).isFile()) throw new Error(`File is missing: ${value}`);
        if (statSync(path).size > 10 * 1024 * 1024) throw new Error(`File exceeds 10 MB: ${value}`);
      }
    } catch (error) { throw new Error(`${file.file}: ${error.message}`); }
    count++;
  }
}
console.log(`Validated ${count} content files and CMS fields.`);
