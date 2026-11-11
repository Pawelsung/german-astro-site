import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeReview, emptyReview, encodeReview, mergeReview } from '../src/lib/reviewStore.mjs';
import { importLangLoopWords } from '../src/lib/langloopWords.mjs';

const known = new Set(['geben', 'der-abend']);
const at = { today: 1000, now: 9_000_000 };
const saved = (lexiconId, updatedAt = '2026-11-11T03:00:00.000Z') => ({ lexiconId, updatedAt });

test('a saved word is starred and due today', () => {
  const { review, added } = importLangLoopWords(emptyReview(), [saved('geben')], known, at);
  assert.deepEqual(added, ['geben']);
  assert.equal(review.stars.geben.on, true);
  assert.equal(review.words.geben.d, 1000);
  assert.equal(review.words.geben.b, 1);
});

test('words outside the review pool or without an id are left alone', () => {
  const { added } = importLangLoopWords(emptyReview(), [saved('quatsch'), saved(null), { lexiconId: 'geben' }], known, at);
  assert.deepEqual(added, []);
});

test('importing twice changes nothing the second time', () => {
  const first = importLangLoopWords(emptyReview(), [saved('geben')], known, at);
  const second = importLangLoopWords(first.review, [saved('geben')], known, { ...at, now: at.now + 1 });
  assert.deepEqual(second.added, []);
  assert.deepEqual(second.review, first.review);
});

test('unstarring here sticks until the word is saved again in LangLoop', () => {
  const first = importLangLoopWords(emptyReview(), [saved('geben')], known, at);
  const unstarred = { ...first.review, stars: { geben: { on: false, t: Date.parse('2026-11-12T00:00:00.000Z') } } };
  assert.deepEqual(importLangLoopWords(unstarred, [saved('geben')], known, at).added, []);
  assert.deepEqual(importLangLoopWords(unstarred, [saved('geben', '2026-11-13T00:00:00.000Z')], known, at).added, ['geben']);
});

test('a known word drops back to the first box but keeps its history', () => {
  const start = emptyReview();
  start.words.geben = { b: 5, d: 1030, t: 1, r: 8, c: 7, me: 1, ae: 0, aw: 0 };
  const { review } = importLangLoopWords(start, [saved('geben')], known, at);
  assert.equal(review.words.geben.b, 1);
  assert.equal(review.words.geben.d, 1000);
  assert.equal(review.words.geben.r, 9);
  assert.equal(review.words.geben.me, 2);
});

test('the import survives encoding and wins the merge with an older copy', () => {
  const { review } = importLangLoopWords(emptyReview(), [saved('geben')], known, at);
  const merged = mergeReview(decodeReview(encodeReview(emptyReview())), decodeReview(encodeReview(review)));
  assert.equal(merged.stars.geben.on, true);
  assert.equal(merged.words.geben.d, 1000);
});
