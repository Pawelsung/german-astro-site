import test from 'node:test';
import assert from 'node:assert/strict';
import { blankPreposition } from '../src/lib/prepositionBlank.mjs';
import { verbPrepositions } from '../src/data/verb-prepositions.ts';

test('every lesson 2 example sentence gets exactly one blank', () => {
  for (const item of verbPrepositions) {
    const blank = blankPreposition(item.example, item.prep);
    assert.ok(blank, `${item.verb} ${item.prep}: ${item.example}`);
    assert.ok(!new RegExp(`(?<!\\p{L})${item.prep}(?!\\p{L})`, 'iu').test(blank.before), `${item.verb}: preposition left before blank`);
  }
});

test('umlaut prepositions and contractions are blanked', () => {
  assert.equal(blankPreposition('Wir müssen über das Meeting sprechen.', 'über').found, 'über');
  const am = blankPreposition('Nimmst du wieder am Sprachkurs teil?', 'an');
  assert.equal(am.found, 'am');
  assert.deepEqual(am.contraction, { form: 'am', expansion: 'an + dem' });
  assert.equal(blankPreposition('Ich warte auf dich.', 'an'), null);
});
