import { readFile } from 'node:fs/promises';
import { validateDataset } from '../lib/data-model.js';
for (const mode of ['demo', 'production']) {
  try {
    const data = JSON.parse(await readFile(new URL(`../data/${mode}.json`, import.meta.url), 'utf8'));
    const errors = validateDataset(data, { mode });
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log(`${mode}: valid`);
  } catch (error) { console.error(`${mode}: ${error.message}`); process.exitCode = 1; }
}
