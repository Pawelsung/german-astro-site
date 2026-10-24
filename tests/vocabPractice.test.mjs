import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkTyped, findClozeTarget, productionAnswer } from '../src/lib/vocabPractice.mjs';
import { normalizeVocabulary } from '../src/lib/vocabulary.mjs';

const words = normalizeVocabulary(JSON.parse(readFileSync(new URL('../public/vocab/schritte-b1-1-complete.json', import.meta.url))));
const find = (word) => words.find((w) => w.word === word);

test('cloze finds base words, plurals and conjugated verb forms', () => {
  assert.equal(findClozeTarget(find('mutig')).answer, 'mutig');
  const verb = findClozeTarget(find('sich wundern'));
  assert.equal(verb.answer, 'gewundert');
  assert.equal(verb.inflected, true);
  assert.equal(`${verb.before}${verb.answer}${verb.after}`, find('sich wundern').example);
});

test('most B1 words can be turned into a cloze', () => {
  const covered = words.filter((w) => findClozeTarget(w)).length;
  assert.ok(covered / words.length > 0.95, `${covered}/${words.length}`);
});

test('production answers include the article for nouns', () => {
  assert.equal(productionAnswer({ article: 'der', word: 'Mut' }), 'der Mut');
  assert.equal(productionAnswer({ article: '', word: 'mutig' }), 'mutig');
});

test('typed answers explain near misses', () => {
  assert.deepEqual(checkTyped('der Mut', ' der  Mut '), { correct: true });
  assert.equal(checkTyped('der Mut', 'Mut').reason, 'missing-article');
  assert.equal(checkTyped('der Mut', 'die Mut').reason, 'wrong-article');
  assert.equal(checkTyped('der Mut', 'der mut').reason, 'capitalization');
  assert.equal(checkTyped('die Überschrift', 'die Uberschrift').reason, 'umlaut');
  assert.equal(checkTyped('die Überschrift', 'die Ueberschrift').reason, 'umlaut');
  assert.equal(checkTyped('Zumindest', 'zumindest', { sentenceStart: true }).correct, true);
  assert.equal(checkTyped('sich wundern', 'wundern').correct, true);
  assert.equal(checkTyped('mutig', 'müde').reason, 'wrong');
});
