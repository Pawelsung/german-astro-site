import test from 'node:test';
import assert from 'node:assert/strict';
import { verbPrepositions } from '../src/data/verb-prepositions.ts';
import { woDaPractice } from '../src/data/wo-da-practice.ts';
import { daForm, fillWoDa, isSentenceStart, personForm, woDaAnswer, woDaOptions, woForm } from '../src/lib/woDa.mjs';

const entries = new Map(verbPrepositions.map((entry) => [entry.id, entry]));
const preps = [...new Set(verbPrepositions.map((entry) => entry.prep))];

test('compound forms add r only before a vowel', () => {
  assert.equal(woForm('auf'), 'worauf');
  assert.equal(woForm('über'), 'worüber');
  assert.equal(woForm('unter'), 'worunter');
  assert.equal(woForm('mit'), 'womit');
  assert.equal(woForm('gegen'), 'wogegen');
  assert.equal(daForm('an'), 'daran');
  assert.equal(daForm('von'), 'davon');
  assert.equal(personForm('auf', 'A'), 'auf wen');
  assert.equal(personForm('mit', 'D'), 'mit wem');
});

test('every wo/da item points at an entry and has one blank', () => {
  const ids = new Set();
  for (const item of woDaPractice) {
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.ok(entries.has(item.entryId), `item ${item.id}: unknown entry ${item.entryId}`);
    assert.equal(item.sentence.split('___').length, 2, `item ${item.id}: needs exactly one blank`);
    assert.ok(item.trans, `item ${item.id}: missing translation`);
  }
});

test('options hold the answer once and never a second right answer', () => {
  for (const item of woDaPractice) {
    const entry = entries.get(item.entryId);
    const answer = woDaAnswer(item, entry);
    const options = woDaOptions(item, entry, preps);
    assert.equal(options.length, 4, `item ${item.id}: ${options.join(', ')}`);
    assert.equal(options.filter((option) => option === answer).length, 1, `item ${item.id}`);
    assert.ok(!fillWoDa(item, answer).includes('___'));
  }
});

test('question items give a reply that shows thing or person', () => {
  for (const item of woDaPractice.filter((entry) => entry.kind !== 'da')) {
    assert.match(item.sentence, /^___ .+\? – .+/, `item ${item.id} needs "question? – reply"`);
    const entry = entries.get(item.entryId);
    // The reply starts with the same preposition, which is what makes the answer unambiguous.
    const reply = item.sentence.split(' – ')[1];
    assert.ok(reply.toLowerCase().startsWith(`${entry.prep} `), `item ${item.id}: reply should start with ${entry.prep}`);
  }
});

test('a blank that opens a sentence is capitalized', () => {
  assert.ok(isSentenceStart('___ wartest du?'));
  assert.ok(isSentenceStart('Ein eigenes Haus? ___ träume ich schon lange.'));
  assert.ok(!isSentenceStart('Ich warte schon lange ___.'));
  for (const item of woDaPractice) {
    const answer = woDaAnswer(item, entries.get(item.entryId));
    const filled = fillWoDa(item, answer);
    // No sentence in the bank may start with a lower-case letter once filled in.
    for (const sentence of filled.split(/(?<=[.?!])\s+/)) {
      assert.match(sentence, /^[–\p{Lu}]/u, `item ${item.id}: "${sentence}"`);
    }
  }
});
