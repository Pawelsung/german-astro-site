import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, concept, tenseExercises } from '../src/data/lesson9-tenses.ts';
import { tenseText } from '../src/lib/tenses.mjs';
import { collectLocalProgress, getLearningSummary, getReviewAction, mergeRemoteProgress, PROGRESS_KEYS } from '../src/lib/progressStorage.ts';

test('lesson 9 exercises are well formed, one answer each, across eight stages', () => {
  assert.equal(STAGES.length, 8);
  assert.equal(new Set(tenseExercises.map(x => x.id)).size, tenseExercises.length);
  assert.ok(tenseExercises.length >= 90);
  for (const stage of STAGES) assert.ok(tenseExercises.filter(x => x.stage === stage.id).length >= 10, stage.id);
  for (const item of tenseExercises) {
    assert.ok(STAGES.some(x => x.id === item.stage), item.id);
    assert.ok(['A2', 'B1', 'B2'].includes(item.level), item.id);
    assert.equal(item.options.length, 4, item.id);
    assert.equal(new Set(item.options).size, 4, item.id);
    assert.equal(item.sentence.split('___').length - 1, 1, item.id);
    assert.ok(item.trans && item.explain, item.id);
    assert.ok(!tenseText(item).includes('___'), item.id);
  }
});

test('every level has practice and Futur II stays B2', () => {
  for (const level of ['A2', 'B1', 'B2']) assert.ok(tenseExercises.some(x => x.level === level), level);
  assert.ok(tenseExercises.filter(x => x.stage === 'futur2').every(x => x.level === 'B2'));
  assert.equal(concept.length, 3);
});

test('lesson 9 progress joins summaries, review routing and sync in its own key', () => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }, dispatchEvent() {} };
  globalThis.CustomEvent ??= class {};
  assert.equal(PROGRESS_KEYS.lesson8, 'german-lesson8-passiv-progress');
  assert.equal(PROGRESS_KEYS.lesson9, 'german-lesson9-tenses-progress');
  data.set(PROGRESS_KEYS.lesson9, JSON.stringify({ a: { answered: true, wrong: 1, needsReview: true, updatedAt: '1' } }));
  assert.ok(collectLocalProgress().lesson9.a);
  const summary = getLearningSummary();
  assert.equal(summary.lesson9AnsweredCount, 1);
  assert.equal(summary.lesson9WrongCount, 1);
  assert.equal(getReviewAction(summary).href, '/lesson9-tenses/?review=1');
  mergeRemoteProgress({ lesson9: { b: { answered: true, correct: 1, updatedAt: '2' } } });
  assert.equal(getLearningSummary().lesson9AnsweredCount, 2);
  delete globalThis.window;
});
