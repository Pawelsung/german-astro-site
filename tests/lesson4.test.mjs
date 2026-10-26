import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../src/data/lesson4-kasus-quest-data.json', import.meta.url)));
const N_DECLENSION = ['Student', 'Kollege', 'Nachbar', 'Kunde', 'Junge', 'Präsident', 'Tourist', 'Löwe', 'Herr', 'Journalist', 'Mensch', 'Name'];

test('every exercise has distinct options containing the answer', () => {
  for (const e of data.exercises) {
    assert.ok(e.options.includes(e.answer), e.id);
    assert.equal(new Set(e.options).size, e.options.length, e.id);
  }
});

test('single-blank answers rebuild the full sentence exactly', () => {
  for (const e of data.exercises.filter((x) => x.sentence.split('___').length === 2 && !x.sentence.includes('→'))) {
    assert.equal(e.sentence.replace('___', e.answer), e.fullSentence, e.id);
  }
});

test('n-declension nouns take -n outside the nominative singular', () => {
  for (const e of data.exercises.filter((x) => x.mode === 'n-deklination' && x.sentence.includes('___'))) {
    const noun = e.answer.split(' ').pop();
    const base = e.targetNoun.split(' ').pop();
    assert.ok(N_DECLENSION.includes(base), `${e.id}: ${base} is not in the n-declension list`);
    if (e.case === 'Nominativ') assert.equal(noun, base, e.id);
    else assert.match(noun, new RegExp(`^${base}(n|en|ns)$`), e.id);
  }
});

test('masculine and neuter genitive nouns take -(e)s unless they are n-declension', () => {
  for (const e of data.exercises.filter((x) => x.mode === 'genitiv' && x.sentence.includes('___') && ['m', 'n'].includes(x.gender))) {
    const base = e.targetNoun.split(' ').pop();
    const noun = e.answer.split(' ').pop();
    assert.match(noun, new RegExp(`^${base}e?s$`), e.id);
  }
});
