import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildResolver, migrateLegacyWords } from '../src/lib/reviewMigrate.mjs';
import { emptyRecord, emptyReview } from '../src/lib/reviewStore.mjs';

const rows = [
  ['das-buch', 'das', 'Buch', 'A1', 'school', 'noun', 1],
  ['der-kunde', 'der', 'Kunde', 'A2', 'shop', 'noun', 1, ['die Kundin']],
  ['haben', '', 'haben', 'A1', 'grammar', 'verb', 1],
  ['die-tuer', 'die', 'Tür', 'A1', 'home', 'noun', 1]
];
const resolve = buildResolver(rows);
const today = 20000;
const run = (input, review = emptyReview()) => migrateLegacyWords({ review, resolve, today, ...input });
const buch = extra => ({ article: 'das', word: 'Buch', meaning: '書', ...extra });

test('old states convert to the agreed boxes', () => {
  const words = [
    buch({ errors: 2, attempts: 3, correct: 1 }),
    { article: '', word: 'haben', meaning: '有', attempts: 5, correct: 5 },
    { article: 'die', word: 'Tür', meaning: '門', seen: 1 }
  ];
  const { review } = run({ currentWords: words });
  assert.equal(review.words['das-buch'].b, 1);
  assert.equal(review.words['das-buch'].d, today);
  assert.equal(review.words['das-buch'].me, 2);
  assert.equal(review.words.haben.b, 3);
  assert.ok(review.words.haben.d > today && review.words.haben.d <= today + 7);
  assert.equal(review.words['die-tuer'].b, 0);
});

test('one or two correct answers give box 2, and nothing maps above box 3', () => {
  const { review } = run({ currentWords: [buch({ attempts: 2, correct: 2 })] });
  assert.equal(review.words['das-buch'].b, 2);
  const many = run({ currentWords: [buch({ attempts: 90, correct: 90 })] }).review;
  assert.equal(many.words['das-buch'].b, 3);
});

test('never practised words create no record; starred only goes to stars', () => {
  const { review, addedWords, addedStars } = run({ currentWords: [buch({}), { article: 'die', word: 'Tür', meaning: '門', starred: true }] });
  assert.deepEqual(review.words, {});
  assert.equal(addedWords, 0);
  assert.equal(addedStars, 1);
  assert.equal(review.stars['die-tuer'].on, true);
});

test('both legacy sources are read and the same word combines', () => {
  const archive = { old: buch({ meaning: '書本', attempts: 2, correct: 2, errors: 0, starred: true, updatedAt: '2026-01-01' }) };
  const currentWords = [buch({ attempts: 1, correct: 1, errors: 3, updatedAt: '2026-02-01' })];
  const { review } = run({ currentWords, archive });
  const record = review.words['das-buch'];
  assert.equal(record.r, 3);
  assert.equal(record.c, 3);
  assert.equal(record.me, 3);
  assert.equal(record.b, 1);
  assert.equal(review.stars['das-buch'].on, true);
});

test('the same word version in both sources is counted once, newest first', () => {
  const archive = { old: buch({ attempts: 9, correct: 9, updatedAt: '2026-01-01' }) };
  const currentWords = [buch({ attempts: 10, correct: 10, updatedAt: '2026-02-01' })];
  assert.equal(run({ currentWords, archive }).review.words['das-buch'].r, 10);
});

test('merged forms map through variants', () => {
  const { review } = run({ currentWords: [{ article: 'die', word: 'Kundin', meaning: '女顧客', attempts: 1, correct: 1 }] });
  assert.ok(review.words['der-kunde']);
});

test('running twice changes nothing and existing records are never overwritten', () => {
  const currentWords = [buch({ errors: 1, attempts: 1 })];
  const first = run({ currentWords });
  const second = run({ currentWords }, first.review);
  assert.deepEqual(second.review, first.review);
  assert.equal(second.addedWords, 0);
  const existing = emptyReview();
  existing.words['das-buch'] = { ...emptyRecord(), b: 5, d: 99, t: 7 };
  assert.equal(run({ currentWords }, existing).review.words['das-buch'].b, 5);
});

test('words outside the lexicon are counted and do not throw', () => {
  const { review, unmapped } = run({ currentWords: [{ article: '', word: 'Eigenes', meaning: 'x', attempts: 1 }, null] });
  assert.equal(unmapped, 1);
  assert.deepEqual(review.words, {});
});

test('the input is not mutated', () => {
  const review = emptyReview();
  run({ currentWords: [buch({ errors: 1, attempts: 1 })] }, review);
  assert.deepEqual(review, emptyReview());
});

test('the real lexicon index resolves merged and renamed words', () => {
  const index = JSON.parse(readFileSync(new URL('../src/data/lexicon/site/index.json', import.meta.url), 'utf8'));
  const real = buildResolver(index);
  assert.equal(real({ article: '', word: 'jemand / jemanden / jemandem' }), 'jemand');
  assert.equal(real({ article: 'die', word: 'Lehrerin' }), 'der-lehrer');
  assert.equal(real({ article: 'das', word: 'Buch' }), 'das-buch');
});
