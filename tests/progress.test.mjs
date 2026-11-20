import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLearningSummary, getReviewAction, PROGRESS_KEYS, writeJSON, needsReview, mergeRemoteProgress } from '../src/lib/progressStorage.ts';

const data = new Map();
const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
globalThis.window = { localStorage, dispatchEvent() {} };
const put = (key, value) => localStorage.setItem(key, JSON.stringify(value));

test('each lesson routes its own pending items to review', () => {
  const fixtures = [
    [PROGRESS_KEYS.lesson1Words, [{ errors: 1 }], 'lesson1-wort'],
    [PROGRESS_KEYS.lesson2, { srs: { warten: { nextReview: 1 } } }, 'lesson2-VerbWithPreposition'],
    [PROGRESS_KEYS.lesson3, { beginnen: { isHard: true } }, 'lesson3-irregular-verbs'],
    [PROGRESS_KEYS.lesson4, { q1: { wrong: 1 } }, 'lesson4-kasus'],
    [PROGRESS_KEYS.lesson5, { mistakes: ['q1'] }, 'lesson5-connectors'],
    [PROGRESS_KEYS.lesson6, { q1: { needsReview: true } }, 'lesson6-adjective-declension']
  ];
  for (const [key, value, path] of fixtures) {
    data.clear(); put(key, value);
    assert.equal(getReviewAction(getLearningSummary()).href, `/${path}/?review=1`);
  }
});

test('only due SRS items count; empty state starts learning', () => {
  data.clear();
  put(PROGRESS_KEYS.lesson2, { srs: { later: { nextReview: Date.now() + 86400000 }, invalid: {} } });
  assert.equal(getLearningSummary().lesson2ReviewCount, 0);
  assert.equal(getReviewAction(getLearningSummary()).href, '/lesson1-wort/');
});

test('guest saves are immediately readable by dashboard', () => {
  data.clear();
  writeJSON(PROGRESS_KEYS.lesson1Words, [{word: 'Film', errors: 1, starred: true}]);
  assert.equal(getLearningSummary().lesson1ErrorCount, 1);
  assert.equal(getLearningSummary().lesson1StarredCount, 1);
});

test('correct answers resolve legacy mistakes without deleting history', () => {
  for (const key of [PROGRESS_KEYS.lesson3, PROGRESS_KEYS.lesson4, PROGRESS_KEYS.lesson6]) {
    data.clear(); put(key, { q: { wrong: 3, wrongCount: 3, lastCorrect: true, needsReview: false, isHard: false } });
    assert.equal(getReviewAction(getLearningSummary()).href, '/lesson1-wort/');
  }
  assert.equal(needsReview({wrong: 1}), true);
  assert.equal(needsReview({lastCorrect: true, needsReview: true}), true);
});

test('newer remote progress wins; chapter 6 survives split merge', () => {
  data.clear();
  put(PROGRESS_KEYS.lesson6, {q: {wrong: 1, updatedAt: '2026-01-01'}});
  mergeRemoteProgress({ lesson6: {q: {wrong: 1, lastCorrect: true, updatedAt: '2026-02-01'}} });
  assert.equal(getLearningSummary().lesson6WrongCount, 0);
});

test('resolved vocabulary is not resurrected by stale cloud copy', () => {
  data.clear();
  put(PROGRESS_KEYS.lesson1Words, [{id:'x', errors:0, starred:false, updatedAt:'2026-02-01'}]);
  mergeRemoteProgress({lesson1Words:[{id:'x', errors:2, starred:true, updatedAt:'2026-01-01'}]});
  assert.equal(getLearningSummary().lesson1ErrorCount, 0);
  assert.equal(getLearningSummary().lesson1StarredCount, 0);
});

test('corrupt JSON does not break dashboard', () => {
  data.clear(); data.set(PROGRESS_KEYS.lesson1Words, '{broken');
  assert.equal(getLearningSummary().lesson1ErrorCount, 0);
});


test('old cloud bank ids hydrate into merged Schritte without losing progress or review schedule', async () => {
  const { normalizeVocabulary, mergeVocabularyProgress, migrateVocabularyUI } = await import('../src/lib/vocabulary.mjs');
  const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)));
  const merged = normalizeVocabulary(read('public/vocab/schritte-b1-1-merged.json'));
  const old = normalizeVocabulary(read('public/vocab/schritte-b1-1-hidden-advanced.json'))
    .find(w => w.word === 'sich anstrengen');
  const target = merged.find(w => w.legacyIds.includes(old.id));
  assert.ok(target);
  const { encodeReview, emptyReview, emptyRecord, decodeReview } = await import('../src/lib/reviewStore.mjs');
  const state = emptyReview();
  state.words['sich-anstrengen'] = { ...emptyRecord(), b: 4, d: 24000, t: 12, r: 9 };
  const review = encodeReview(state);
  data.clear();
  put(PROGRESS_KEYS.review, review);
  mergeRemoteProgress({ lesson1Words: [{ ...old, errors: 3, starred: true, attempts: 12, correct: 7, seen: 4, updatedAt: '2026-11-20' }] });
  const saved = JSON.parse(localStorage.getItem(PROGRESS_KEYS.lesson1Words));
  const hydrated = mergeVocabularyProgress(merged, saved);
  const word = hydrated.find(w => w.id === target.id);
  assert.equal(word.errors, 3);
  assert.equal(word.starred, true);
  assert.equal(word.attempts, 12);
  assert.equal(word.correct, 7);
  assert.equal(word.seen, 4);
  assert.deepEqual(mergeVocabularyProgress(merged, hydrated), hydrated);
  assert.deepEqual(migrateVocabularyUI({preset:'schritte-b1-1-hidden-advanced', chapter:'3', filter:'review'}),
    {preset:'schritte-b1-1',chapter:'3',filter:'review',index:0});
  // Hydration never rewrites the review store; its master ids and due dates stay intact.
  assert.deepEqual(decodeReview(JSON.parse(localStorage.getItem(PROGRESS_KEYS.review))).words, state.words);
  const before = localStorage.getItem(PROGRESS_KEYS.review);
  mergeVocabularyProgress(merged, saved);
  assert.equal(localStorage.getItem(PROGRESS_KEYS.review), before);
});
