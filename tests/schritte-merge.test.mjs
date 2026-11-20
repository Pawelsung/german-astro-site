import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeVocabulary, wordKey, mergeVocabularyProgress, migrateVocabularyUI, filterVocabulary, chaptersFor } from '../src/lib/vocabulary.mjs';
import { mergeSchritte } from '../tools/lexicon/merge-schritte.mjs';
import { buildResolver } from '../src/lib/reviewMigrate.mjs';
const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)));
const bank = name => read(`public/vocab/schritte-b1-1${name ? '-' + name : ''}.json`);
const merged = normalizeVocabulary(bank('merged'));
const legacy = ['complete', 'hidden-advanced', 'enhanced', 'supplement', 'nouns', ''].map(bank);
const list = read('src/data/lexicon/lists.graded.json').find(l => l.id === 'schritte-b1-1-underlined');
const entries = read('src/data/lexicon/lexicon.graded.json').entries;
const underlined = list.groups.flatMap(g => g.ids.map(id => {
  const e = entries.find(e => e.id === id);
  return { id, article: e.article, word: e.word, meaning: e.meanings[0], category: g.label };
}));
const find = old => merged.find(w => w.id === old.id || w.legacyIds.includes(old.id) || w.legacyKeys.includes(wordKey(old)));

test('retired presets migrate idempotently and preserve valid scope and modes', () => {
  for (const suffix of ['enhanced', 'supplement', 'nouns', 'hidden-advanced', 'underlined']) {
    const old = { preset: `schritte-b1-1-${suffix}`, chapter: '3', mode: 'article', filter: 'starred', index: 89 };
    const next = migrateVocabularyUI(old);
    assert.deepEqual(next, { ...old, preset: 'schritte-b1-1', index: 0, filter: suffix === 'underlined' ? 'underlined' : 'starred' });
    assert.deepEqual(migrateVocabularyUI(next), next);
    assert.equal(old.index, 89);
    assert.equal(migrateVocabularyUI({ ...old, chapter: 'unknown' }).chapter, 'all');
  }
  assert.deepEqual(migrateVocabularyUI({preset:'custom'}), {preset:'custom'});
  assert.deepEqual(migrateVocabularyUI(null), {});
});

test('merged bank has 742 unique lemmas: 459 complete + 86 advanced + 197 new underlines', () => {
  const key = w => `${w.article}|${w.word}`;
  const base = mergeSchritte(legacy.slice(0, 2), []);
  assert.equal(new Set(normalizeVocabulary(legacy[0]).map(key)).size, 459);
  assert.equal(base.length, 545);
  assert.equal(merged.length, 742);
  assert.equal(new Set(merged.map(key)).size, merged.length);
  assert.equal(new Set(merged.map(w => w.id)).size, merged.length);
  assert.deepEqual(chaptersFor(merged).map(c => c.key), ['1','2','3','4','5','6','7']);
  assert.deepEqual(read('public/vocab/index.json').map(p => p.id), ['schritte-b1-1','course-notes','a1-b1-part1']);
});

test('all old ids and word keys still match progress, including id-less nouns and duplicate lemmas', () => {
  const resolve = buildResolver(read('src/data/lexicon/site/index.json'));
  for (const old of [...legacy.flatMap(normalizeVocabulary), ...normalizeVocabulary(underlined)]) {
    const target = find(old);
    assert.ok(target, `${old.id}: ${wordKey(old)}`);
    assert.equal(resolve(target), resolve(old), old.word);
    const saved = { ...old, errors: 4, starred: true, attempts: 8, correct: 3, seen: 9, updatedAt: '2026-11-20' };
    const [next] = mergeVocabularyProgress([target], [saved]);
    for (const field of ['errors','starred','attempts','correct','seen','updatedAt']) assert.equal(next[field], saved[field], `${old.word}: ${field}`);
    assert.equal(next.id, target.id);
  }
});

test('all 275 underlines preserve source lesson metadata and filters compose', () => {
  const base = mergeSchritte(legacy.slice(0, 2), []);
  const normalizedUnderlines = normalizeVocabulary(underlined);
  const original = base.find(w => w.id === 'b1_1_l01_w003');
  const annotation = normalizedUnderlines.find(w => w.word === original.word && w.article === original.article);
  assert.equal(original.word, 'verrückt');
  assert.equal(original.lesson, 1);
  assert.equal(annotation.lesson, 3);
  assert.ok(normalizedUnderlines.some(old => !base.some(w => w.word === old.word && w.article === old.article)));
  assert.equal(merged.filter(w => w.underlined).length, 275);
  assert.ok(merged.every(w => typeof w.underlined === 'boolean'));
  for (const old of normalizeVocabulary(underlined)) {
    const target = find(old);
    assert.equal(target.underlined, true, old.id);
    const source = base.find(w => w.word === old.word && w.article === old.article) ?? old;
    for (const field of ['lesson', 'lessonTitle', 'category']) {
      assert.equal(target[field], source[field], `${old.id}: ${field}`);
    }
  }
  assert.deepEqual(filterVocabulary(merged, {filter:'underlined'}), merged.filter(w => w.underlined));
  for (let chapter = 1; chapter <= 7; chapter++) {
    assert.deepEqual(filterVocabulary(merged, {filter:'underlined',chapter:String(chapter)}), merged.filter(w => w.underlined && w.lesson === chapter));
  }
});

test('newer cleared progress wins across legacy aliases and repeated hydration is stable', () => {
  const target = merged.find(w => w.legacyIds.length);
  const old = {...target, id:target.legacyIds[0],errors:3,starred:true,updatedAt:'2026-01-01'};
  const latest = {...target,errors:0,starred:false,attempts:5,updatedAt:'2026-11-20'};
  const [next] = mergeVocabularyProgress([target], [latest, old]);
  assert.equal(next.errors, 0);
  assert.equal(next.starred, false);
  assert.equal(next.attempts, 5);
  assert.deepEqual(mergeVocabularyProgress([target], [next]), [next]);
});

test('canonical master list agrees with merged bank through the existing review resolver', () => {
  const resolve = buildResolver(read('src/data/lexicon/site/index.json'));
  const lists = read('src/data/lexicon/lists.graded.json');
  const canonical = lists.find(l => l.id === 'schritte-b1-1');
  const actual = canonical.groups.flatMap(g => g.ids);
  assert.equal(actual.length, 738); // Four legacy variants already share corrected master ids.
  assert.equal(new Set(actual).size, actual.length);
  assert.deepEqual(new Set(actual), new Set(merged.map(resolve)));
  for (const id of ['schritte-b1-1-complete', 'schritte-b1-1-enhanced', 'schritte-b1-1-supplement', 'schritte-b1-1-nouns', 'schritte-b1-1-hidden-advanced', 'schritte-b1-1-underlined']) {
    assert.ok(lists.some(l => l.id === id), id);
  }
});


test('pre-timestamp cloud aliases retain mistakes, stars and practice counts', () => {
  const target = merged.find(w => w.legacyIds.length);
  const old = {...target, id:target.legacyIds[0],errors:3,starred:true,attempts:7};
  const [next] = mergeVocabularyProgress([target], [old, target]);
  assert.equal(next.errors, 3);
  assert.equal(next.starred, true);
  assert.equal(next.attempts, 7);
});
