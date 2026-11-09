import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACEMENT_SIZE, advanceToday, buildDailyQueue, currentItem, getReviewSnapshot, newTodayState,
  pickPlacement, pickWeeklyCheck, placementPassed, rateQueueItem, reconcileToday, weeklyCheckDue, withBaseline, withDayDone, withoutBaseline
} from '../src/lib/reviewQueue.mjs';
import { RATINGS, emptyRecord, emptyReview } from '../src/lib/reviewStore.mjs';

const today = 20000;
const DAY = 86400000;
const words = (level, count) => Array.from({ length: count }, (_, i) => ({ id: `${level}-${i}`, level }));
const pool = [...words('A1', 200), ...words('A2', 200), ...words('B1', 600), ...words('B2', 160)];
function reviewWith(extra = {}) {
  const review = emptyReview();
  review.settings = { ...review.settings, level: 'B1', ...extra };
  return review;
}
const due = (review, count, level = 'B1', b = 2) => {
  for (let i = 0; i < count; i++) review.words[`${level}-${i}`] = { ...emptyRecord(), b, d: today - 1, t: 1 };
};
const kinds = items => items.reduce((m, it) => (m[it.kind] = (m[it.kind] || 0) + 1, m), {});

test('with nothing due, a full goal of new words follows the 7:2:1 mix over time', () => {
  const review = reviewWith();
  let slot = 0;
  const total = {};
  for (let i = 0; i < 20; i++) {
    const result = buildDailyQueue({ pool, review, today, goal: 5, slot, exclude: new Set() });
    slot = result.slot;
    for (const it of result.items) {
      total[it.kind] = (total[it.kind] || 0) + 1;
      review.words[it.id] = { ...emptyRecord(), b: 1, d: today + 5, t: today * 86400000 };
    }
  }
  assert.deepEqual(total, { new: 70, stretch: 20, revisit: 10 });
});

test('due words go first but always leave room for three new words', () => {
  const review = reviewWith();
  due(review, 20);
  const { items } = buildDailyQueue({ pool, review, today, goal: 15 });
  assert.equal(items.length, 15);
  assert.equal(kinds(items).due, 12);
  assert.ok(items.slice(0, 12).every(it => it.kind === 'due'));
});

test('a backlog over twice the goal pauses new words', () => {
  const review = reviewWith();
  due(review, 31);
  const { items } = buildDailyQueue({ pool, review, today, goal: 15 });
  assert.deepEqual(kinds(items), { due: 15 });
});

test('due words are ordered weakest box first, then longest overdue', () => {
  const review = reviewWith();
  review.words['B1-1'] = { ...emptyRecord(), b: 3, d: today - 9, t: 1 };
  review.words['B1-2'] = { ...emptyRecord(), b: 1, d: today - 1, t: 1 };
  review.words['B1-3'] = { ...emptyRecord(), b: 1, d: today - 5, t: 1 };
  const { items } = buildDailyQueue({ pool, review, today, goal: 10 });
  assert.deepEqual(items.slice(0, 3).map(it => it.id), ['B1-3', 'B1-2', 'B1-1']);
});

test('an empty group passes its place on instead of shortening the day', () => {
  const small = [...words('B1', 3), ...words('A2', 30)];
  const { items } = buildDailyQueue({ pool: small, review: reviewWith(), today, goal: 10 });
  assert.equal(items.length, 10);
  assert.equal(items.filter(it => it.id.startsWith('B1')).length, 3);
});

test('the queue is the same on two devices and skips excluded words', () => {
  const a = buildDailyQueue({ pool, review: reviewWith(), today, goal: 15 });
  const b = buildDailyQueue({ pool, review: reviewWith(), today, goal: 15 });
  assert.deepEqual(a, b);
  const c = buildDailyQueue({ pool, review: reviewWith(), today, goal: 5, exclude: new Set(a.items.map(it => it.id)) });
  assert.ok(c.items.every(it => !a.items.some(x => x.id === it.id)));
});

test('reaching the goal counts each word once, and more can follow', () => {
  let state = newTodayState(today, 2);
  state.items = [{ id: 'a', kind: 'new' }, { id: 'b', kind: 'due' }];
  state = advanceToday(state, RATINGS.DONT_KNOW);
  state = advanceToday(state, RATINGS.KNOW);
  assert.equal(state.done, 2);
  assert.deepEqual(currentItem(state), { id: 'a', kind: 'new', repeat: true });
  state = advanceToday(state, RATINGS.DONT_KNOW);
  assert.equal(state.done, 2);
  assert.equal(currentItem(state), null);
  state.items = [...state.items, { id: 'c', kind: 'new' }];
  state = advanceToday(state, RATINGS.KNOW);
  assert.equal(state.done, 3);
});

test('home snapshot needs no lexicon and resets with the day', () => {
  const review = reviewWith({ dailyGoal: 15 });
  due(review, 4);
  assert.deepEqual(getReviewSnapshot({ day: today, done: 15 }, review, today), { goal: 15, done: 15, due: 4, reached: true, started: true });
  assert.equal(getReviewSnapshot({ day: today - 1, done: 15 }, review, today).done, 0);
  assert.equal(getReviewSnapshot(null, review, today).reached, false);
});

test('the home count and queue follow words rated on another device', () => {
  const review = reviewWith();
  review.settings = withDayDone(review.settings, today, 6, 5);
  assert.equal(getReviewSnapshot(null, review, today).done, 6);
  assert.equal(getReviewSnapshot(null, review, today + 1).done, 0);
  review.words.gone = { ...emptyRecord(), b: 1, d: today + 1, t: today * DAY };
  review.words.waiting = { ...emptyRecord(), b: 2, d: today, t: 1 };
  review.words.old = { ...emptyRecord(), b: 5, d: today + 20, t: (today - 40) * DAY };
  review.words.seen = { ...emptyRecord(), b: 5, d: today + 20, t: today * DAY };
  review.words.again = { ...emptyRecord(), b: 1, d: today + 1, t: today * DAY };
  const items = [
    { id: 'behind', kind: 'new' }, { id: 'gone', kind: 'new' }, { id: 'waiting', kind: 'due' }, { id: 'old', kind: 'revisit' },
    { id: 'seen', kind: 'revisit' }, { id: 'again', kind: 'new', repeat: true }, { id: 'fresh', kind: 'new' }
  ];
  const state = { ...newTodayState(today, 15), items, pos: 1, done: 1 };
  const next = reconcileToday(state, review, today);
  assert.deepEqual(next.items.map(it => it.id), ['behind', 'waiting', 'old', 'again', 'fresh']);
  assert.equal(next.done, 6);
  assert.equal(reconcileToday(next, review, today), next);
});

test('known-level words start high, so a correct answer keeps them learned and a miss sends them back', () => {
  const item = { id: 'A1-1', kind: 'weekly' };
  assert.equal(rateQueueItem(item, undefined, RATINGS.KNOW, { today, now: 1 }).b, 6);
  assert.equal(rateQueueItem(item, undefined, RATINGS.DONT_KNOW, { today, now: 1 }).b, 1);
  assert.equal(rateQueueItem({ id: 'x', kind: 'new' }, undefined, RATINGS.KNOW, { today, now: 1 }).b, 1);
});

test('weekly check comes once a week, only from lower levels and never from words still being learned', () => {
  assert.equal(weeklyCheckDue({ level: 'B1' }, today), true);
  assert.equal(weeklyCheckDue({ level: 'B1', weeklyDone: today - 6 }, today), false);
  assert.equal(weeklyCheckDue({ level: 'B1', weeklyDone: today - 7 }, today), true);
  assert.equal(weeklyCheckDue({ level: 'A1' }, today), false);
  const review = reviewWith();
  review.words['A1-0'] = { ...emptyRecord(), b: 1, d: today + 1, t: 1 };
  const picked = pickWeeklyCheck({ pool: [...words('A1', 40), ...words('B1', 40)], review, today });
  assert.equal(picked.length, 10);
  assert.ok(picked.every(it => it.id.startsWith('A1') && it.id !== 'A1-0'));
});

test('placement is stable, unique, A2 only, and needs 80 percent', () => {
  const a = pickPlacement({ pool, review: reviewWith(), seed: 7 });
  assert.equal(a.length, PLACEMENT_SIZE);
  assert.equal(new Set(a).size, PLACEMENT_SIZE);
  assert.ok(a.every(id => id.startsWith('A2')));
  assert.deepEqual(a, pickPlacement({ pool, review: reviewWith(), seed: 7 }));
  assert.equal(placementPassed(32, 40), true);
  assert.equal(placementPassed(31, 40), false);
  assert.equal(placementPassed(0, 0), false);
});

test('marking lower levels as known can be undone and never touches word records', () => {
  const review = reviewWith();
  review.words['A2-0'] = { ...emptyRecord(), b: 1, d: today, t: 1 };
  const settings = withBaseline(review.settings, today, 99);
  assert.deepEqual(settings.baseline, { A1: today, A2: today });
  assert.equal(settings.t, 99);
  assert.equal(review.words['A2-0'].b, 1);
  assert.equal(withoutBaseline(settings, 100).baseline, undefined);
});

test('at A2 with a baseline, marked words are not offered as new', () => {
  const review = reviewWith({ level: 'A2', baseline: { A1: today, A2: today } });
  const { items } = buildDailyQueue({ pool, review, today, goal: 10 });
  assert.ok(items.every(it => it.kind !== 'new' || it.id.startsWith('B1')));
});
