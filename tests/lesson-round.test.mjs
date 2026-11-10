import test from 'node:test';
import assert from 'node:assert/strict';
import { nextChoiceRecord, revealsAnswer, roundVerdict, scrambled, takeRound } from '../src/lib/lessonRound.mjs';
import { needsReview, mergeLessonValue, mergeRemoteProgress, PROGRESS_KEYS } from '../src/lib/progressStorage.ts';

const data = new Map();
const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
globalThis.window = { localStorage, dispatchEvent() {}, addEventListener() {} };
globalThis.CustomEvent ??= class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };

const pool = n => Array.from({ length: n }, (_, i) => `q${i}`);

test('rounds work through the whole pool before anything repeats', () => {
  const items = pool(25);
  let queue = [];
  const seen = [];
  for (let i = 0; i < 2; i++) { const r = takeRound(queue, items); seen.push(...r.round); queue = r.queue; assert.equal(r.round.length, 10); }
  assert.equal(new Set(seen).size, 20);
  const third = takeRound(queue, items);
  assert.equal(third.round.length, 10);
  assert.equal(new Set(third.round).size, 10);
  assert.ok(queue.every(item => third.round.includes(item)));
});

test('a pool smaller than a round gives a shorter round, an empty pool none', () => {
  assert.equal(takeRound([], pool(4)).round.length, 4);
  assert.deepEqual(takeRound([], []).round, []);
});

test('items that left the pool are dropped from the queue', () => {
  const { round } = takeRound(['gone', 'q1'], ['q1', 'q2'], { size: 2 });
  assert.ok(!round.includes('gone'));
  assert.deepEqual([...round].sort(), ['q1', 'q2']);
});

test('the stored answer record keeps the format lesson counters read', () => {
  const wrong = nextChoiceRecord({ correct: 2, wrong: 1, note: 'kept' }, false, 'T');
  assert.deepEqual(wrong, { correct: 2, wrong: 2, note: 'kept', answered: true, lastCorrect: false, needsReview: true, updatedAt: 'T' });
  assert.equal(needsReview(wrong), true);
  const right = nextChoiceRecord(wrong, true, 'U');
  assert.equal(right.correct, 3);
  assert.equal(needsReview(right), false);
  assert.deepEqual(nextChoiceRecord(undefined, true, 'V'), { answered: true, correct: 1, wrong: 0, lastCorrect: true, needsReview: false, updatedAt: 'V' });
});

test('verdict follows the score', () => {
  assert.match(roundVerdict(10, 10), /滿分/);
  assert.match(roundVerdict(8, 10), /很棒/);
  assert.match(roundVerdict(5, 10), /不錯/);
  assert.match(roundVerdict(1, 10), /重點卡/);
});

test('an upload keeps what another device answered, and the newer answer wins', () => {
  const local = { a: { wrong: 1, updatedAt: '2026-02-01' }, shared: { correct: 1, updatedAt: '2026-01-01' } };
  const remote = { b: { correct: 1, updatedAt: '2026-01-15' }, shared: { correct: 5, updatedAt: '2026-03-01' } };
  const merged = mergeLessonValue('lesson7', local, remote);
  assert.deepEqual(Object.keys(merged).sort(), ['a', 'b', 'shared']);
  assert.equal(merged.shared.correct, 5);
  assert.equal(mergeLessonValue('lesson7', local, null), local);
  assert.equal(mergeLessonValue('lesson7', null, remote), remote);
  assert.equal(mergeLessonValue('lesson7', null, undefined), null);
});

test('lesson 5 rebuilds mistakes from merged answers and joins bookmarks', () => {
  const merged = mergeLessonValue('lesson5',
    { answers: { a: { correct: false, updatedAt: '1' } }, mistakes: ['a'], bookmarks: ['x'] },
    { answers: { a: { correct: true, updatedAt: '2' }, b: { correct: false, updatedAt: '1' } }, mistakes: ['b'], bookmarks: ['y'] });
  assert.deepEqual(merged.mistakes, ['b']);
  assert.deepEqual(merged.bookmarks.sort(), ['x', 'y']);
});

test('repeating a merge does not duplicate lesson 2 history', () => {
  const record = { verb: 'x', at: 1 };
  const once = mergeLessonValue('lesson2', { starred: [], srs: {}, history: [record] }, { starred: [], srs: {}, history: [record, { verb: 'y', at: 2 }] });
  assert.equal(once.history.length, 2);
  const twice = mergeLessonValue('lesson2', once, once);
  assert.deepEqual(twice.history, once.history);
});

test('sign-in merge still handles a lesson 5 record missing on one side', () => {
  data.clear();
  data.set(PROGRESS_KEYS.lesson5, JSON.stringify({ answers: { a: { correct: false } }, mistakes: ['a'], bookmarks: [] }));
  assert.deepEqual(mergeRemoteProgress({}).lesson5.mistakes, ['a']);
});

test('word tiles are never shown already in the right order', () => {
  const tiles = ['weil', 'ich', 'müde', 'bin'];
  for (let i = 0; i < 200; i++) {
    const mixed = scrambled(tiles);
    assert.deepEqual([...mixed].sort(), [...tiles].sort());
    assert.notDeepEqual(mixed, tiles);
  }
  assert.notDeepEqual(scrambled(['a', 'b']), ['a', 'b']);
  assert.deepEqual(scrambled(['a']), ['a']);
  assert.deepEqual(scrambled(['a', 'a']), ['a', 'a']);
});

test('a hint gives the answer away only when it contains the whole word', () => {
  assert.equal(revealsAnswer('sich etwas merken', 'sich'), true);
  assert.equal(revealsAnswer('der Mann', 'Der'), true);
  assert.equal(revealsAnswer('der Mann', 'den'), false);
  assert.equal(revealsAnswer('für', 'ü'), false);
  assert.equal(revealsAnswer('', 'der'), false);
});
