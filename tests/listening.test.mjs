import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWordMatcher, compareShadowing, sameText, segmentAt, splitWords } from '../src/lib/listening.mjs';

test('a sentence splits into tappable words and the text between them', () => {
  const parts = splitWords('Ich fahre heute nach Berlin – endlich!');
  assert.equal(parts.map(part => part.text).join(''), 'Ich fahre heute nach Berlin – endlich!');
  assert.deepEqual(parts.filter(part => part.word).map(part => part.word), ['Ich', 'fahre', 'heute', 'nach', 'Berlin', 'endlich']);
  assert.deepEqual(splitWords('Grüß dich, U-Bahn').filter(part => part.word).map(part => part.word), ['Grüß', 'dich', 'U-Bahn']);
});

const rows = [
  ['die-nachricht', 'die', 'Nachricht', 'A2', 'media', 'noun', 1],
  ['beruehmt', '', 'berühmt', 'A2', 'travel', 'adjective', 1],
  ['das-essen', 'das', 'Essen', 'A1', 'food', 'noun', 1],
  ['essen', '', 'essen', 'A1', 'food', 'verb', 1],
  ['nicht-im-pool', '', 'selten', 'B2', 'misc', 'adjective', 0],
  ['eine-phrase', '', 'zum Beispiel', 'A1', 'misc', 'phrase', 1]
];

test('tapped forms find their word-list entry', () => {
  const match = buildWordMatcher(rows);
  assert.equal(match('Nachrichten')?.[0], 'die-nachricht');
  assert.equal(match('berühmten')?.[0], 'beruehmt');
  assert.equal(match('Essen')?.[0], 'das-essen');
  assert.equal(match('essen')?.[0], 'essen');
  assert.equal(match('selten'), null);
  assert.equal(match('Beispiel'), null);
  assert.equal(match('Siegessäule'), null);
});

test('shadowing marks the words recognition did not hear', () => {
  const result = compareShadowing('Ich komme an vielen berühmten Sehenswürdigkeiten vorbei.', 'ich komme an vielen berühmten Sehenswürdigkeit vorbei');
  assert.deepEqual(result.words.filter(word => !word.heard).map(word => word.word), ['Sehenswürdigkeiten']);
  assert.equal(result.heardCount, 6);
  assert.equal(result.total, 7);
  const skipped = compareShadowing('Das Angebot wird immer größer.', 'Das wird immer grösser');
  assert.deepEqual(skipped.words.filter(word => !word.heard).map(word => word.word), ['Angebot']);
  assert.equal(compareShadowing('Guten Morgen', '').score, 0);
});

test('the playing sentence follows the time', () => {
  const segments = [{ start: 0, end: 2 }, { start: 2, end: 5 }, { start: 5, end: 9 }];
  assert.equal(segmentAt(segments, 0), 0);
  assert.equal(segmentAt(segments, 3.2), 1);
  assert.equal(segmentAt(segments, 9.5), 2);
  assert.equal(segmentAt([{ start: 1, end: 2 }], 0.2), -1);
});

test('a rewrite matches when only spacing or the final stop differ', () => {
  assert.equal(sameText('Ich fahre mit dem Bus', 'Ich fahre  mit dem Bus.'), true);
  assert.equal(sameText('Ich fahre mit der Bus.', 'Ich fahre mit dem Bus.'), false);
  assert.equal(sameText('', ''), false);
});
