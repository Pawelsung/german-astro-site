import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, passivExercises } from '../src/data/lesson8-passiv.ts';
import { solvedText } from '../src/lib/passiv.mjs';
import { collectLocalProgress, getLearningSummary, getReviewAction, mergeRemoteProgress, PROGRESS_KEYS } from '../src/lib/progressStorage.ts';

// The ids of the first 49 items; progress is stored by id, so they must never change.
const ORIGINAL_IDS = ['forms', 'transform', 'past', 'perfect', 'modal', 'agent', 'state'].flatMap(stage => Array.from({ length: 7 }, (_, i) => `${stage}-${i + 1}`));

test('142 original exercises cover twelve stages with distinct answers and ids', () => {
  assert.equal(passivExercises.length, 142);
  assert.equal(new Set(passivExercises.map(x => x.id)).size, 142);
  assert.equal(STAGES.length, 12);
  for (const stage of STAGES) assert.ok(passivExercises.filter(x => x.stage === stage.id).length >= 8, stage.id);
  for (const item of passivExercises) {
    assert.ok(STAGES.some(x => x.id === item.stage));
    assert.ok(['A2', 'B1', 'B2'].includes(item.level), item.id);
    assert.ok(item.options[0]?.trim(), item.id);
    assert.equal(new Set(item.options).size, item.options.length, item.id);
    assert.ok(item.trans && item.explain, item.id);
    if (item.stage === 'transform') assert.ok(item.fact && !item.sentence);
    else assert.equal(item.sentence.split('___').length - 1, item.stage === 'state' ? 0 : 1, item.id);
    assert.ok(!solvedText(item).includes('___'));
  }
});

test('the first 49 ids are kept, so saved lesson 8 progress still matches', () => {
  const ids = new Set(passivExercises.map(x => x.id));
  for (const id of ORIGINAL_IDS) assert.ok(ids.has(id), id);
});

test('each level has practice, and B2 has its own stages', () => {
  const count = level => passivExercises.filter(x => x.level === level).length;
  assert.equal(count('A2'), 15);
  assert.equal(count('B1'), 98);
  assert.equal(count('B2'), 29);
  for (const stage of ['subjunctive', 'modal-past', 'participle']) assert.ok(passivExercises.filter(x => x.stage === stage).every(x => x.level === 'B2'), stage);
  assert.equal(solvedText(passivExercises.find(x => x.id === 'modal-past-5')), 'Es tut mir leid, dass Ihr Termin hat verschoben werden müssen.');
});

test('spoken feedback uses a full German sentence for each task type', () => {
  assert.equal(solvedText(passivExercises[0]), 'Ich werde heute untersucht.');
  assert.equal(solvedText(passivExercises.find(x => x.stage === 'transform')), 'Das Gemüse wird geschnitten.');
  assert.equal(solvedText(passivExercises.find(x => x.stage === 'state')), 'Die Tür ist geöffnet.');
  for (const item of passivExercises.filter(x => x.stage === 'perfect')) {
    assert.match(solvedText(item), / worden[.?!]$/);
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
