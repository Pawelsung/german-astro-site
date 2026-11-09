import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RATINGS, TOP_BOX, emptyRecord, emptyReview, rateWord, statusOf, topBoxInterval,
  markArticleWrong, markArticleRight, encodeReview, decodeReview, mergeReview
} from '../src/lib/reviewStore.mjs';

const at = { today: 1000, now: 5000 };

test('knowing a word climbs the boxes on the agreed intervals', () => {
  let record;
  const dueIn = [];
  for (let i = 0; i < 5; i++) {
    record = rateWord('das-buch', record, RATINGS.KNOW, at);
    dueIn.push(record.d - at.today);
  }
  assert.deepEqual(dueIn, [1, 3, 7, 16, 35]);
  assert.equal(record.b, 5);
  assert.equal(record.c, 5);
});

test('the top box spreads over 60 to 90 days and does not overflow', () => {
  let record = { ...emptyRecord(), b: TOP_BOX };
  record = rateWord('das-buch', record, RATINGS.KNOW, at);
  assert.equal(record.b, TOP_BOX);
  for (const id of ['a', 'der-apfel', 'sich-beeilen', 'zurzeit']) {
    assert.ok(topBoxInterval(id) >= 60 && topBoxInterval(id) <= 90, id);
  }
});

test('not knowing returns to box 1, due tomorrow, and counts a meaning error', () => {
  const record = rateWord('das-buch', { ...emptyRecord(), b: 4 }, RATINGS.DONT_KNOW, at);
  assert.equal(record.b, 1);
  assert.equal(record.d, at.today + 1);
  assert.equal(record.me, 1);
});

test('unsure keeps the box, halves the interval with a one day minimum, and is not an error', () => {
  const fromBox3 = rateWord('das-buch', { ...emptyRecord(), b: 3 }, RATINGS.UNSURE, at);
  assert.equal(fromBox3.b, 3);
  assert.equal(fromBox3.d, at.today + 3);
  assert.equal(fromBox3.me, 0);
  assert.equal(rateWord('das-buch', { ...emptyRecord(), b: 0 }, RATINGS.UNSURE, at).d, at.today + 1);
  assert.equal(rateWord('das-buch', { ...emptyRecord(), b: 1 }, RATINGS.UNSURE, at).d, at.today + 1);
});

test('unknown ratings are rejected', () => {
  assert.throws(() => rateWord('das-buch', undefined, 'maybe', at));
});

test('box maps to the three learning states', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(statusOf),
    ['learning', 'learning', 'almost', 'almost', 'learned', 'learned', 'learned']);
});

test('article mistakes are tracked separately and never change the box', () => {
  const wrong = markArticleWrong({ ...emptyRecord(), b: 4, d: 77 }, { now: 9 });
  assert.equal(wrong.b, 4);
  assert.equal(wrong.d, 77);
  assert.equal(wrong.ae, 1);
  assert.equal(wrong.aw, 1);
  assert.equal(wrong.me, 0);
  assert.equal(markArticleRight(wrong, { now: 10 }).aw, 0);
});

function sampleReview() {
  const review = emptyReview();
  review.words['das-buch'] = rateWord('das-buch', undefined, RATINGS.KNOW, at);
  review.words['sich-beeilen'] = markArticleWrong(rateWord('sich-beeilen', undefined, RATINGS.DONT_KNOW, at), { now: 6000 });
  review.stars['der-apfel'] = { on: true, t: 7 };
  review.stars.zurzeit = { on: false, t: 8 };
  review.settings = { dailyGoal: 25, level: 'B1', t: 3 };
  return review;
}

test('encoding round-trips and produces plain strings', () => {
  const review = sampleReview();
  const stored = encodeReview(review);
  assert.equal(typeof stored.words, 'string');
  assert.equal(typeof stored.stars, 'string');
  assert.deepEqual(decodeReview(stored), review);
  assert.deepEqual(decodeReview(JSON.parse(JSON.stringify(stored))), review);
});

test('corrupt stored data does not throw or invent records', () => {
  assert.deepEqual(decodeReview(null), emptyReview());
  const decoded = decodeReview({ words: 'broken\nok,1,2,3,4,5,6,7,8\nbad,x,2,3,4,5,6,7,8', stars: '', settings: '{nope' });
  assert.deepEqual(Object.keys(decoded.words), ['ok']);
  assert.equal(decoded.settings.dailyGoal, 15);
});

test('the newer record wins, while counters keep their highest value', () => {
  const a = emptyReview();
  const b = emptyReview();
  a.words.x = { ...emptyRecord(), b: 4, d: 50, t: 100, r: 9, c: 8, me: 1 };
  b.words.x = { ...emptyRecord(), b: 1, d: 10, t: 200, r: 3, c: 2, me: 4 };
  const merged = mergeReview(a, b).words.x;
  assert.equal(merged.b, 1);
  assert.equal(merged.d, 10);
  assert.equal(merged.r, 9);
  assert.equal(merged.c, 8);
  assert.equal(merged.me, 4);
});

test('equal timestamps resolve to the lower box', () => {
  const a = emptyReview();
  const b = emptyReview();
  a.words.x = { ...emptyRecord(), b: 4, t: 100 };
  b.words.x = { ...emptyRecord(), b: 2, t: 100 };
  assert.equal(mergeReview(a, b).words.x.b, 2);
});

test('merging is order independent and repeatable, so two devices converge', () => {
  const a = sampleReview();
  const b = emptyReview();
  b.words['das-buch'] = { ...emptyRecord(), b: 3, d: 42, t: 9000, r: 1 };
  b.words['der-tisch'] = { ...emptyRecord(), b: 2, t: 1 };
  b.stars['der-apfel'] = { on: false, t: 99 };
  b.settings = { dailyGoal: 15, t: 2 };
  const ab = mergeReview(a, b);
  assert.deepEqual(ab, mergeReview(b, a));
  assert.deepEqual(mergeReview(ab, b), ab);
  assert.deepEqual(mergeReview(ab, a), ab);
  assert.equal(ab.stars['der-apfel'].on, false);
  assert.equal(ab.settings.dailyGoal, 25);
});
