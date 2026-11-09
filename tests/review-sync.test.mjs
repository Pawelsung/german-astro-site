import test from 'node:test';
import assert from 'node:assert/strict';
import { changedKeys, hashProgress, hashValue, readSyncState, shouldDownload, stableStringify, writeSyncState, DOWNLOAD_INTERVAL_MS } from '../src/lib/cloudSync.mjs';
import { RATINGS, applyLessonAnswer, decodeReview, emptyRecord, emptyReview, encodeReview } from '../src/lib/reviewStore.mjs';
import { PROGRESS_KEYS, collectLocalProgress, mergeRemoteProgress } from '../src/lib/progressStorage.ts';

const data = new Map();
const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
globalThis.window = { localStorage, dispatchEvent() {} };

test('hashes ignore key order and treat missing values as empty', () => {
  assert.equal(stableStringify({ b: 1, a: [{ d: 2, c: 3 }] }), stableStringify({ a: [{ c: 3, d: 2 }], b: 1 }));
  assert.equal(hashValue(undefined), hashValue(null));
  assert.notEqual(hashValue({ a: 1 }), hashValue({ a: 2 }));
});

test('only documents that changed are written', () => {
  const keys = ['lesson1Words', 'review'];
  const hashes = hashProgress({ lesson1Words: [1], review: { words: 'a' } }, keys);
  assert.deepEqual(changedKeys({ lesson1Words: [1], review: { words: 'a' } }, keys, hashes), []);
  assert.deepEqual(changedKeys({ lesson1Words: [1], review: { words: 'b' } }, keys, hashes), ['review']);
  assert.deepEqual(changedKeys({ lesson1Words: [], review: null }, keys), ['lesson1Words', 'review']);
});

test('a tab downloads at most once per interval, and per user', () => {
  assert.equal(shouldDownload({ downloadedAt: 0 }), true);
  assert.equal(shouldDownload({ downloadedAt: 1000 }, 1000 + DOWNLOAD_INTERVAL_MS - 1), false);
  assert.equal(shouldDownload({ downloadedAt: 1000 }, 1000 + DOWNLOAD_INTERVAL_MS), true);
  const session = new Map();
  const store = { getItem: k => session.get(k) ?? null, setItem: (k, v) => session.set(k, v) };
  writeSyncState('me', { downloadedAt: 5, hashes: { a: 'x' } }, store);
  assert.deepEqual(readSyncState('me', store), { downloadedAt: 5, hashes: { a: 'x' } });
  assert.deepEqual(readSyncState('other', store), { downloadedAt: 0, hashes: {} });
});

test('sign-in merge combines the review record without losing the newer side', () => {
  data.clear();
  const local = emptyReview();
  local.words.a = { ...emptyRecord(), b: 4, t: 200 };
  local.words.b = { ...emptyRecord(), b: 1, t: 50 };
  const remote = emptyReview();
  remote.words.a = { ...emptyRecord(), b: 2, t: 100 };
  remote.words.c = { ...emptyRecord(), b: 3, t: 70 };
  data.set(PROGRESS_KEYS.review, JSON.stringify(encodeReview(local)));
  const merged = mergeRemoteProgress({ review: encodeReview(remote) });
  const words = decodeReview(merged.review).words;
  assert.equal(words.a.b, 4);
  assert.equal(words.b.b, 1);
  assert.equal(words.c.b, 3);
  assert.deepEqual(decodeReview(JSON.parse(data.get(PROGRESS_KEYS.review))).words, words);
});

test('accounts without a review record stay empty', () => {
  data.clear();
  assert.equal(collectLocalProgress().review, null);
  assert.equal(mergeRemoteProgress({}).review, null);
  assert.equal(data.has(PROGRESS_KEYS.review), false);
});

const opts = { today: 100, now: 9 };
test('lesson practice feeds the record by mode', () => {
  assert.equal(applyLessonAnswer('x', undefined, { mode: 'pos', correct: true }, opts), undefined);
  const card = applyLessonAnswer('x', undefined, { mode: 'card', correct: true }, opts);
  assert.equal(card.b, 1);
  const wrong = applyLessonAnswer('x', { ...emptyRecord(), b: 4, d: 500 }, { mode: 'card', correct: false }, opts);
  assert.equal(wrong.b, 1);
  assert.equal(wrong.me, 1);
});

test('a correct answer on a word not yet due does not advance it', () => {
  const later = { ...emptyRecord(), b: 2, d: 150 };
  assert.equal(applyLessonAnswer('x', later, { mode: 'card', correct: true }, opts), later);
  const due = { ...emptyRecord(), b: 2, d: 100 };
  assert.equal(applyLessonAnswer('x', due, { mode: 'dictation', correct: true }, opts).b, 3);
});

test('article mistakes never lower the box', () => {
  const record = { ...emptyRecord(), b: 4, d: 500 };
  const modeWrong = applyLessonAnswer('x', record, { mode: 'article', correct: false }, opts);
  assert.equal(modeWrong.b, 4);
  assert.equal(modeWrong.ae, 1);
  const typed = applyLessonAnswer('x', record, { mode: 'produce', correct: false, reason: 'wrong-article' }, opts);
  assert.equal(typed.b, 4);
  assert.equal(typed.me, 0);
  assert.equal(applyLessonAnswer('x', modeWrong, { mode: 'article', correct: true }, opts).aw, 0);
  assert.equal(RATINGS.KNOW, 'know');
});
