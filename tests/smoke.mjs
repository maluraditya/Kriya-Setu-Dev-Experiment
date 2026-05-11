import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const viteConfig = read('vite.config.ts');
const envExample = read('.env.example');
const app = read('App.tsx');
const grade11Topics = read('data/grades/11th/index.ts');

assert.equal(packageJson.private, true, 'package must remain private');

assert(
  !viteConfig.includes('process.env.API_KEY') && !viteConfig.includes('process.env.GEMINI_API_KEY'),
  'Vite config must not inject Gemini secrets into the client bundle',
);

assert(
  envExample.includes('GEMINI_API_KEY=your_gemini_api_key_here'),
  '.env.example should document the server-side Gemini key without a real secret',
);

const changedBiologyTopics = [
  ['binomial-nomenclature', 'BinomialNomenclatureLab'],
  ['bryophytes-pteridophytes', 'BryophytesPteridophytesLab'],
  ['animal-kingdom-non-chordates', 'AnimalKingdomLab'],
  ['frogs', 'FrogsLab'],
  ['cell-membrane-transport', 'CellMembraneLab'],
  ['enzymes', 'EnzymesLab'],
  ['cell-cycle-regulation', 'CellCycleLab'],
  ['chordata', 'ChordataLab'],
  ['anatomy-flowering-plants', 'AnatomyFloweringPlantsLab'],
  ['morphology-flowering-plants', 'MorphologyFloweringPlantsLab'],
];

for (const [topicId, componentName] of changedBiologyTopics) {
  assert(grade11Topics.includes(`id: '${topicId}'`), `Missing topic metadata for ${topicId}`);
  assert(app.includes(`activeTopicId === '${topicId}'`), `Missing App route guard for ${topicId}`);
  assert(app.includes(`<${componentName}`), `Missing App component render for ${componentName}`);
}

if (existsSync(join(root, 'dist/index.html'))) {
  const builtHtml = read('dist/index.html');
  assert(!builtHtml.includes('%VITE_SITE_URL%'), 'Built HTML must not contain unresolved VITE_SITE_URL placeholders');
}

console.log('Smoke checks passed');
