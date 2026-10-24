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
