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

import { ACTIVITY_KEY, DEVICE_ID_KEY, getDeviceId, activityToCloud, activityToLocal, mergeActivityValues } from '../src/lib/dailyActivity.mjs';
const now = new Date(2026, 10, 19, 12);
const day = '2026-11-19';
const entry = (answered, correct = answered) => ({ answered, correct });

test('legacy days remain readable and recording preserves other devices', () => {
  const store = memoryStore();
  store.setItem(ACTIVITY_KEY, JSON.stringify({ days: { [day]: entry(5) } }));
  assert.equal(getActivity(now, store).todayAnswered, 5);
  store.setItem(ACTIVITY_KEY, JSON.stringify({ days: { [day]: entry(5) }, others: { phone: { [day]: entry(6) } } }));
  assert.equal(getActivity(now, store).todayAnswered, 11);
  recordAnswer(false, now, store);
  assert.deepEqual(JSON.parse(store.getItem(ACTIVITY_KEY)).others, { phone: { [day]: entry(6) } });
  assert.equal(getActivity(now, store).todayAnswered, 12);
  assert.equal(getActivity(now, store).todayCorrect, 11);
  assert.equal(getActivity(now, store).week.at(-1).answered, 12);
});

test('streak joins days recorded on different devices', () => {
  const store = memoryStore();
  store.setItem(ACTIVITY_KEY, JSON.stringify({ days: { '2026-11-18': entry(5) }, others: { phone: { [day]: entry(6) } } }));
  assert.equal(getActivity(now, store).streak, 2);
});

test('device merge is commutative, idempotent and restores own cloud counters', () => {
  const a = { devices: { mine: { [day]: entry(5, 4) } } };
  const b = { devices: { mine: { [day]: entry(7, 3) }, phone: { [day]: entry(6) } } };
  const merged = mergeActivityValues(a, b, now);
  assert.deepEqual(merged, mergeActivityValues(b, a, now));
  assert.deepEqual(merged, mergeActivityValues(merged, b, now));
  const local = activityToLocal(merged, 'mine', now);
  assert.deepEqual(local.days[day], entry(7, 4));
  assert.deepEqual(local.others, { phone: { [day]: entry(6) } });
  assert.deepEqual(activityToCloud(local, 'mine', now), merged);
  assert.deepEqual(a.devices.mine[day], entry(5, 4));
});

test('merge retains exactly the latest 60 calendar days and ignores corrupt data', () => {
  const cloud = { devices: {
    expired: { '2026-09-20': entry(8) },
    mixed: { '2026-09-21': entry(1), [day]: entry(2), '2026-02-30': entry(9), '2026-11-22': entry(9),
      '2026-11-18': { answered: -4, correct: '2' }, '2026-11-17': { answered: Infinity, correct: NaN },
      '2026-11-16': null, '2026-11-15': [], '2026-11-14': { answered: '5', correct: 1 } },
    broken: [], null: null
  } };
  assert.deepEqual(mergeActivityValues(cloud, false, now), { devices: { mixed: {
    '2026-09-21': entry(1), [day]: entry(2), '2026-11-14': entry(0, 1)
  } } });
  for (const bad of [null, [], 3, 'bad', { devices: [] }]) assert.deepEqual(mergeActivityValues(bad, null, now), { devices: {} });
});

test('device id is persisted and reused', () => {
  const store = memoryStore();
  const id = getDeviceId(store);
  assert.ok(id);
  assert.equal(getDeviceId(store), id);
  assert.equal(store.getItem(DEVICE_ID_KEY), id);
});

test('a device in a time zone ahead keeps its next-day entry', async () => {
  const { mergeActivityValues } = await import('../src/lib/dailyActivity.mjs');
  const now = new Date(2026, 10, 19, 23);
  const merged = mergeActivityValues({ devices: { taipei: { '2026-11-20': { answered: 3, correct: 2 } } } }, null, now);
  assert.equal(merged.devices.taipei['2026-11-20'].answered, 3);
});
