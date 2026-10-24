import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeCaseSentence, genderKey } from '../src/lib/caseDiagram.mjs';

const data = JSON.parse(readFileSync(new URL('../src/data/lesson4-kasus-quest-data.json', import.meta.url)));
const byId = Object.fromEntries(data.exercises.map((e) => [e.id, e]));
const words = (model, { start, end }) => model.tokens.slice(start, end + 1).join(' ');

test('every sentence exercise produces a diagram; classification cards do not', () => {
  for (const exercise of data.exercises) {
    const model = analyzeCaseSentence(exercise);
    if (exercise.mode === 'preposition-classify') assert.equal(model, null, exercise.id);
    else assert.ok(model?.targets.length, exercise.id);
  }
});

test('verb trigger points at the conjugated verb and the target grows to the noun', () => {
  const model = analyzeCaseSentence(byId['kasus-a1-akk-001']);
  assert.equal(words(model, model.targets[0]), 'den Mann.');
  assert.equal(model.tokens[model.trigger.index], 'sehe');
  assert.equal(model.targets[0].gender, 'der');
});

test('subjects have no trigger; relative pronouns link back to their noun', () => {
  assert.equal(analyzeCaseSentence(byId['kasus-a1-nom-001']).subject, true);
  const relative = data.exercises.find((e) => e.fullSentence === 'Der Mann, den ich gesehen habe, ist nett.');
  const model = analyzeCaseSentence(relative);
  assert.equal(words(model, model.antecedent), 'Der Mann,');
  assert.equal(model.tokens[model.trigger.index], 'gesehen');
});

test('prepositions trigger directly and dative plurals still match', () => {
  const prep = analyzeCaseSentence(data.exercises.find((e) => e.fullSentence === 'Ich fahre mit dem Bus.'));
  assert.equal(prep.trigger.kind, 'prep');
  const plural = analyzeCaseSentence(data.exercises.find((e) => e.fullSentence === 'Wir helfen den Kindern.'));
  assert.equal(words(plural, plural.targets[0]), 'den Kindern.');
});

test('gender keys accept articles and data codes', () => {
  assert.deepEqual(['m', 'f', 'n', 'pl', 'Die', 'x'].map(genderKey), ['der', 'die', 'das', 'pl', 'die', null]);
});
