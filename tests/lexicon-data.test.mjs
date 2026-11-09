import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { normalizeVocabulary } from '../src/lib/vocabulary.mjs';

const dataUrl = path => new URL(`../src/data/lexicon/${path}`, import.meta.url);
const read = path => JSON.parse(readFileSync(dataUrl(path), 'utf8'));
const { entries } = read('lexicon.graded.json');
const ids = new Set(entries.map(e => e.id));
const lemma = (article, word) => `${article ? `${article} ` : ''}${word}`;

test('lexicon ids are unique and every locked id still resolves', () => {
  assert.equal(ids.size, entries.length);
  const redirects = read('redirects.json');
  const locked = readFileSync(dataUrl('ids.lock'), 'utf8').split('\n').filter(Boolean);
  for (const id of locked) assert.ok(ids.has(id) || redirects[id], id);
  for (const target of Object.values(redirects)) assert.ok(ids.has(target), target);
});

test('every list points at existing words', () => {
  for (const list of read('lists.graded.json')) {
    for (const group of list.groups) for (const id of group.ids) assert.ok(ids.has(id), `${list.id}: ${id}`);
  }
});

test('every word in the bundled banks maps to a lexicon entry', () => {
  const known = new Set(entries.flatMap(e => [lemma(e.article, e.word), ...(e.variants || [])]));
  const dir = new URL('../public/vocab/', import.meta.url);
  let rows = 0;
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json')) {
    for (const w of normalizeVocabulary(JSON.parse(readFileSync(new URL(file, dir), 'utf8')))) {
      rows++;
      assert.ok(known.has(lemma(w.article, w.word)), `${file}: ${lemma(w.article, w.word)}`);
    }
  }
  assert.ok(rows > 3000);
});

test('site data matches the lexicon and stays small', () => {
  const index = read('site/index.json');
  assert.deepEqual(index.map(r => r[0]), entries.map(e => e.id));
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
    const details = read(`site/${level}.json`);
    assert.equal(Object.keys(details).length, entries.filter(e => e.level === level).length, level);
  }
  const sample = entries.find(e => e.id === 'der-apfel');
  assert.equal(read(`site/${sample.level}.json`)[sample.id][1], sample.meanings[0]);
  for (const file of readdirSync(dataUrl('site/'))) {
    assert.ok(statSync(dataUrl(`site/${file}`)).size < 1024 * 1024, file);
    assert.doesNotMatch(readFileSync(dataUrl(`site/${file}`), 'utf8'), /"sources"|graded-ai-only/, file);
  }
});

test('daily pool excludes terms, chunks and unpushable words', () => {
  const pool = new Set(read('site/index.json').filter(r => r[6]).map(r => r[0]));
  for (const e of entries) {
    if (e.kind === 'term' || e.kind === 'chunk' || !e.push) assert.ok(!pool.has(e.id), e.id);
  }
});
