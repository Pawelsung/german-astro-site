import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, passivExercises } from '../src/data/lesson8-passiv.ts';
import { solvedText } from '../src/lib/passiv.mjs';
import { collectLocalProgress, getLearningSummary, getReviewAction, mergeRemoteProgress, PROGRESS_KEYS } from '../src/lib/progressStorage.ts';

test('49 original exercises cover all seven stages with distinct answers and ids', () => {
  assert.equal(passivExercises.length, 49);
  assert.equal(new Set(passivExercises.map(x => x.id)).size, 49);
  for (const stage of STAGES) assert.equal(passivExercises.filter(x => x.stage === stage.id).length, 7);
  for (const item of passivExercises) {
    assert.ok(STAGES.some(x => x.id === item.stage));
    assert.ok(item.options[0]?.trim(), item.id);
    assert.equal(new Set(item.options).size, item.options.length, item.id);
    assert.ok(item.trans && item.explain, item.id);
    if (item.stage === 'transform') assert.ok(item.fact && !item.sentence);
    else assert.equal(item.sentence.split('___').length - 1, item.stage === 'state' ? 0 : 1, item.id);
    assert.ok(!solvedText(item).includes('___'));
  }
});
test('spoken feedback uses a full German sentence for each task type', () => {
  assert.equal(solvedText(passivExercises[0]), 'Ich werde heute untersucht.');
  assert.equal(solvedText(passivExercises.find(x => x.stage === 'transform')), 'Das Gemüse wird geschnitten.');
  assert.equal(solvedText(passivExercises.find(x => x.stage === 'state')), 'Die Tür ist geöffnet.');
  for (const item of passivExercises.filter(x => x.stage === 'perfect')) {
    assert.match(solvedText(item), / worden\./);
    assert.doesNotMatch(solvedText(item), /geworden/);
  }
});
test('lesson 8 progress joins summaries, review routing and sync without changing existing keys', () => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) }, dispatchEvent() {} };
  globalThis.CustomEvent ??= class {};
  assert.equal(PROGRESS_KEYS.lesson7, 'german-lesson7-konjunktiv-progress');
  assert.equal(PROGRESS_KEYS.lesson8, 'german-lesson8-passiv-progress');
  data.set(PROGRESS_KEYS.lesson8, JSON.stringify({ a: { answered: true, wrong: 1, needsReview: true, updatedAt: '1' } }));
  assert.ok(collectLocalProgress().lesson8.a);
  const summary = getLearningSummary();
  assert.equal(summary.lesson8AnsweredCount, 1);
  assert.equal(summary.lesson8WrongCount, 1);
  assert.equal(getReviewAction(summary).href, '/lesson8-passiv/?review=1');
  mergeRemoteProgress({ lesson8: { b: { answered: true, correct: 1, updatedAt: '2' } } });
  assert.equal(getLearningSummary().lesson8AnsweredCount, 2);
  delete globalThis.window;
});
