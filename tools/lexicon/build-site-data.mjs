// Trim the graded lexicon into small files the browser can load.
// Usage: node tools/lexicon/build-site-data.mjs
//
// index.json   rows: [id, article, word, level, topic, pos, inPool, variants?]
// <level>.json { id: [plural, meaning, exampleDe, exampleZh, verb] }, verb = [present3, past, perfect] or 0
// lists.json   word ids replaced by their row number in index.json
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
