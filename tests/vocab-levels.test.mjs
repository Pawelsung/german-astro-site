import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { alignSavedWords, levelPresets, levelWords } from '../src/lib/vocabLevels.mjs';
import { chaptersFor, mergeVocabularyProgress, normalizeVocabulary } from '../src/lib/vocabulary.mjs';
import { emptyRecord, emptyReview } from '../src/lib/reviewStore.mjs';

const read = name => JSON.parse(readFileSync(new URL(`../src/data/lexicon/site/${name}.json`, import.meta.url)));
const rows = read('index');

for (const [level, expected] of [['A1', 680], ['A2', 648], ['B1', 1100], ['B2', 160]]) {
  test(`${level} keeps every practice word, once, in groups of at most 40`, () => {
    const words = normalizeVocabulary(levelWords(rows, read(level), level));
    assert.equal(words.length, expected);
    assert.equal(new Set(words.map(w => w.id)).size, expected);
    assert.ok(words.every(w => w.meaning && w.pos));
    const groups = chaptersFor(words);
    if (level === 'B2') assert.equal(groups.length, 1);
    else assert.ok(groups.every(g => g.count <= 40), JSON.stringify(groups.filter(g => g.count > 40)));
  });
}

test('groups keep the topic order and number only the topics that were split', () => {
  const row = (i, topic) => [`w${i}`, '', `w${String(i).padStart(3, '0')}`, 'A1', topic, 'verb', 1];
  const data = [...Array.from({ length: 41 }, (_, i) => row(i, 'general')), row(90, 'food')];
  const details = Object.fromEntries(data.map(r => [r[0], ['', 'x', '', '', ['', 'ging', 'ist gegangen']]]));
  const words = levelWords(data, details, 'A1');
  assert.deepEqual(chaptersFor(words).map(c => [c.label, c.count]), [['飲食', 1], ['一般用語 1', 20], ['一般用語 2', 21]]);
  assert.deepEqual(words[0].practice, { praeteritum_3sg: 'ging', perfekt_3sg: 'ist gegangen' });
});

test('level cards count only well-known words at that level', () => {
  const review = emptyReview();
  const a1 = rows.find(r => r[3] === 'A1' && r[6])[0];
  review.words[a1] = { ...emptyRecord(), b: 4 };
  review.words[rows.find(r => r[3] === 'A1' && r[6] && r[0] !== a1)[0]] = { ...emptyRecord(), b: 3 };
  const [first, second] = levelPresets(rows, review);
  assert.deepEqual([first.level, first.learned, first.count], ['A1', 1, 680]);
  assert.equal(second.learned, 0);
});

test('practice from a bank that words the meaning differently carries over, newest first', () => {
  const incoming = [{ id: 'der-tisch', article: 'der', word: 'Tisch', meaning: '桌子', category: 'x' }];
  const saved = [
    { id: 'old-bank-1', article: 'der', word: 'Tisch', meaning: '桌', errors: 2, updatedAt: '2026-02-01' },
    { id: 'old-bank-2', article: 'der', word: 'Tisch', meaning: '餐桌', errors: 1, seen: 3, starred: true, updatedAt: '2026-01-01' },
    { id: 'other', article: 'die', word: 'Tür', meaning: '門', errors: 9 }
  ];
  const resolve = w => (w.word === 'Tisch' ? 'der-tisch' : null);
  const [word] = mergeVocabularyProgress(incoming, alignSavedWords(saved, resolve));
  assert.equal(word.errors, 2);
  assert.equal(word.meaning, '桌子');
  assert.equal(alignSavedWords(saved, resolve).find(w => w.word === 'Tür').id, 'other');
});
