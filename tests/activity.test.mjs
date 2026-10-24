import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAnswer, getActivity, dayKey } from '../src/lib/dailyActivity.mjs';

function memoryStore() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

test('counts today answers and accuracy', () => {
  const store = memoryStore();
  const now = new Date(2026, 9, 24, 10);
  recordAnswer(true, now, store);
  recordAnswer(false, now, store);
  const activity = getActivity(now, store);
  assert.equal(activity.todayAnswered, 2);
  assert.equal(activity.todayCorrect, 1);
  assert.equal(activity.streak, 1);
});

test('streak continues from yesterday until today has answers', () => {
  const store = memoryStore();
  recordAnswer(true, new Date(2026, 9, 21), store);
  recordAnswer(true, new Date(2026, 9, 22), store);
  recordAnswer(true, new Date(2026, 9, 23), store);
  assert.equal(getActivity(new Date(2026, 9, 24), store).streak, 3);
  assert.equal(getActivity(new Date(2026, 9, 25), store).streak, 0);
});

test('week view always has seven days ending today', () => {
  const now = new Date(2026, 0, 2);
  const week = getActivity(now, memoryStore()).week;
  assert.equal(week.length, 7);
  assert.equal(week.at(-1).key, dayKey(now));
  assert.equal(week[0].key, '2025-12-27');
});
