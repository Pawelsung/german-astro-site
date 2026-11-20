// Trim the graded lexicon into small files the browser can load.
// Usage: node tools/lexicon/build-site-data.mjs
//
// index.json   rows: [id, article, word, level, topic, pos, inPool, variants?]
// <level>.json { id: [plural, meaning, exampleDe, exampleZh, verb] }, verb = [present3, past, perfect] or 0
// lists.json   word ids replaced by their row number in index.json
import { mergeSchritte } from './merge-schritte.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const DATA = new URL('../../src/data/lexicon/', import.meta.url);
const SITE = new URL('site/', DATA);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const readJson = url => JSON.parse(readFileSync(url, 'utf8'));

// Words that may be picked for daily review or notifications.
export const inPool = e => e.push && e.kind !== 'term' && e.kind !== 'chunk';

function verbForms(e) {
  if (e.pos !== 'verb') return 0;
  if (e.verb) return [e.verb.praesens3 || '', e.verb.praeteritum || '', e.verb.perfekt || ''];
  const p = e.practice;
  if (!p?.perfekt_3sg && !p?.praeteritum_3sg) return 0;
  return [p.present?.['er/sie/es'] || '', p.praeteritum_3sg || '', p.perfekt_3sg || ''];
}

const { entries } = readJson(new URL('lexicon.graded.json', DATA));
const rowOf = new Map(entries.map((e, i) => [e.id, i]));

const index = entries.map(e => {
  const row = [e.id, e.article, e.word, e.level, e.topic, e.pos, inPool(e) ? 1 : 0];
  if (e.variants?.length) row.push(e.variants);
  return row;
});

mkdirSync(SITE, { recursive: true });
writeFileSync(new URL('index.json', SITE), JSON.stringify(index));

for (const level of LEVELS) {
  const details = Object.fromEntries(entries.filter(e => e.level === level).map(e => {
    const example = e.examples[0] || { de: '', zh: '' };
    return [e.id, [e.plural || '', e.meanings[0] || '', example.de, example.zh || '', verbForms(e)]];
  }));
  writeFileSync(new URL(`${level}.json`, SITE), JSON.stringify(details));
}

const lists = readJson(new URL('lists.graded.json', DATA)).map(list => ({
  id: list.id,
  label: list.label,
  groups: list.groups.map(g => ({ label: g.label, rows: g.ids.map(id => rowOf.get(id)) }))
}));
writeFileSync(new URL('lists.json', SITE), JSON.stringify(lists));

console.log(`site data: ${index.length} words, ${index.filter(r => r[6]).length} in pool`);

// Export personal lists in the existing lesson-1 bank format, using master ids and prose.
const customLists = readJson(new URL('custom-lists.json', import.meta.url));
const byId = new Map(entries.map(e => [e.id, e]));
let underlined;
for (const list of customLists) {
  const resolved = readJson(new URL('lists.graded.json', DATA)).find(l => l.id === list.id);
  const words = resolved.groups.flatMap((g, groupOrder) => g.ids.map(id => {
    const e = byId.get(id);
    if (!e) throw new Error(`${list.id}: unknown id ${id}`);
    const ex = e.examples[0] || {};
    const forms = verbForms(e);
    return { id, article: e.article, word: e.word, pos: e.pos, level: e.level, plural: e.plural,
      meaning: e.meanings[0], exampleDe: ex.de || '', exampleZh: ex.zh || '',
      category: g.label, groupOrder,
      ...(forms ? { practice: { praeteritum_3sg: forms[1], perfekt_3sg: forms[2] } } : {}) };
  }));
  if (list.id === 'schritte-b1-1-underlined') underlined = words;
  else writeFileSync(new URL(`../../public/vocab/${list.id}.json`, import.meta.url), JSON.stringify(words, null, 2) + '\n');
  console.log(`${list.id}: ${words.length} words in ${resolved.groups.length} lessons`);
}

// Legacy banks remain immutable inputs to build-lexicon; never feed this export back into it.
const vocab = new URL('../../public/vocab/', import.meta.url);
const banks = ['complete', 'hidden-advanced', 'enhanced', 'supplement', 'nouns'].map(name =>
  readJson(new URL(`schritte-b1-1-${name}.json`, vocab)));
banks.push(readJson(new URL('schritte-b1-1.json', vocab)));
if (!underlined) throw new Error('Missing underlined custom list');
const merged = mergeSchritte(banks, underlined);
writeFileSync(new URL('schritte-b1-1-merged.json', vocab), JSON.stringify(merged, null, 2) + '\n');
const manifest = readJson(new URL('index.json', vocab));
const preset = { id: 'schritte-b1-1', label: 'Schritte B1.1',
  description: '完整單字、補充、進階詞與課本劃線字，依 Lektion 1～7 分組。',
  path: '/vocab/schritte-b1-1-merged.json', count: merged.length };
writeFileSync(new URL('index.json', vocab), JSON.stringify([preset,
  ...['course-notes', 'a1-b1-part1'].map(id => manifest.find(p => p.id === id))], null, 2) + '\n');
console.log(`merged Schritte: ${merged.length}, underlined: ${merged.filter(w => w.underlined).length}`);
