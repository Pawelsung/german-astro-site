import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITY_KEY, DEVICE_ID_KEY, dayKey, recordAnswer, getActivity } from '../src/lib/dailyActivity.mjs';
import { PROGRESS_KEYS, collectLocalProgress, mergeRemoteActivity, mergeRemoteProgress } from '../src/lib/progressStorage.ts';
import { changedKeys, hashProgress } from '../src/lib/cloudSync.mjs';

const data = new Map();
const events = [];
globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
globalThis.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }, dispatchEvent: event => events.push(event) };

test('collect, upload merge, pull and subsequent answers preserve local/cloud shapes and hashes', () => {
  data.clear();
  data.set(DEVICE_ID_KEY, 'mine');
  const day = dayKey();
  data.set(ACTIVITY_KEY, JSON.stringify({ days: { [day]: { answered: 5, correct: 3 } } }));
  const collected = collectLocalProgress();
  assert.equal(Object.values(PROGRESS_KEYS).includes(ACTIVITY_KEY), false);
  assert.deepEqual(collected.activity, { devices: { mine: { [day]: { answered: 5, correct: 3 } } } });
  const remote = { devices: { mine: { [day]: { answered: 7, correct: 4 } }, phone: { [day]: { answered: 6, correct: 6 } } } };
  const merged = mergeRemoteActivity(remote);
  assert.deepEqual(merged, remote);
  assert.deepEqual(changedKeys({ activity: merged }, ['activity'], hashProgress({ activity: remote }, ['activity'])), []);
  const local = JSON.parse(data.get(ACTIVITY_KEY));
  assert.equal(local.devices, undefined);
  assert.equal(local.days[day].answered, 7);
  assert.equal(local.others.phone[day].answered, 6);
  assert.ok(events.some(event => event.type === 'learning-progress-updated' && event.detail?.key === ACTIVITY_KEY));
  assert.deepEqual(mergeRemoteProgress({ activity: remote }).activity, remote);
  recordAnswer(true);
  assert.equal(getActivity().todayAnswered, 14);
  const next = collectLocalProgress();
  assert.deepEqual(changedKeys(next, ['activity'], hashProgress({ activity: merged }, ['activity'])), ['activity']);
  assert.equal(next.activity.devices.mine[day].answered, 8);
  assert.equal(next.activity.devices.phone[day].answered, 6);
});

test('without a storable device id, activity is not uploaded and the cloud copy is kept', () => {
  data.clear();
  const day = dayKey();
  data.set(ACTIVITY_KEY, JSON.stringify({ days: { [day]: { answered: 2, correct: 1 } } }));
  const original = window.localStorage.setItem;
  window.localStorage.setItem = (key, value) => { if (key === DEVICE_ID_KEY) throw new Error('quota'); data.set(key, value); };
  try {
    assert.equal(collectLocalProgress().activity, null);
    const remote = { devices: { phone: { [day]: { answered: 4, correct: 4 } } } };
    assert.deepEqual(mergeRemoteActivity(remote), remote);
  } finally {
    window.localStorage.setItem = original;
  }
});
