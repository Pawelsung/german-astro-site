import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoundTracker } from '../src/lib/roundTracker.mjs';

test('completes a round every ten answers with score and mistakes', () => {
  const done = [];
  const tracker = createRoundTracker((summary) => done.push(summary));
  for (let i = 0; i < 9; i += 1) assert.equal(tracker.record(i !== 3, `Satz ${i}`), null);
  assert.deepEqual(tracker.progress(), { round: 1, answered: 9, size: 10 });
  const summary = tracker.record(false, 'Satz 9');
  assert.deepEqual(summary, { round: 1, total: 10, correct: 8, mistakes: ['Satz 3', 'Satz 9'] });
  assert.equal(done.length, 1);
  assert.deepEqual(tracker.progress(), { round: 2, answered: 0, size: 10 });
});

test('unlabelled mistakes still count against the score', () => {
  const tracker = createRoundTracker(null, 2);
  tracker.record(false);
  assert.deepEqual(tracker.record(true, 'ok'), { round: 1, total: 2, correct: 1, mistakes: [] });
});
