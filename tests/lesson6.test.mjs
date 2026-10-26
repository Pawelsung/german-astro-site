import test from 'node:test';
import assert from 'node:assert/strict';
import lesson from '../src/data/lesson6-adjective-declension.ts';

// Independent reference tables (written separately from the generator) to recompute every answer.
const ARTICLES = {
  definite: { nominativ: ['der', 'die', 'das', 'die'], akkusativ: ['den', 'die', 'das', 'die'], dativ: ['dem', 'der', 'dem', 'den'], genitiv: ['des', 'der', 'des', 'der'] },
  indefinite: { nominativ: ['ein', 'eine', 'ein', ''], akkusativ: ['einen', 'eine', 'ein', ''], dativ: ['einem', 'einer', 'einem', ''], genitiv: ['eines', 'einer', 'eines', ''] },
  possessive: { nominativ: ['mein', 'meine', 'mein', 'meine'], akkusativ: ['meinen', 'meine', 'mein', 'meine'], dativ: ['meinem', 'meiner', 'meinem', 'meinen'], genitiv: ['meines', 'meiner', 'meines', 'meiner'] },
  negative: { nominativ: ['kein', 'keine', 'kein', 'keine'], akkusativ: ['keinen', 'keine', 'kein', 'keine'], dativ: ['keinem', 'keiner', 'keinem', 'keinen'], genitiv: ['keines', 'keiner', 'keines', 'keiner'] },
  zero: { nominativ: ['', '', '', ''], akkusativ: ['', '', '', ''], dativ: ['', '', '', ''], genitiv: ['', '', '', ''] }
};
const WEAK = { nominativ: ['e', 'e', 'e', 'en'], akkusativ: ['en', 'e', 'e', 'en'], dativ: ['en', 'en', 'en', 'en'], genitiv: ['en', 'en', 'en', 'en'] };
const MIXED = { nominativ: ['er', 'e', 'es', 'en'], akkusativ: ['en', 'e', 'es', 'en'], dativ: ['en', 'en', 'en', 'en'], genitiv: ['en', 'en', 'en', 'en'] };
const STRONG = { nominativ: ['er', 'e', 'es', 'e'], akkusativ: ['en', 'e', 'es', 'e'], dativ: ['em', 'er', 'em', 'en'], genitiv: ['en', 'er', 'en', 'er'] };
const SLOT = { m: 0, f: 1, n: 2, pl: 3 };

function expected(noun, adjective, articleType, caseName, number) {
  const slot = number === 'pl' ? 3 : SLOT[noun.gender];
  const article = ARTICLES[articleType][caseName][slot];
  const table = articleType === 'definite' ? WEAK : articleType === 'zero' || (articleType === 'indefinite' && slot === 3) ? STRONG : MIXED;
  const ending = table[caseName][slot];
  const stem = adjective.stem ?? adjective.adjective;
  let nounForm = noun.noun;
  if (slot === 3) nounForm = caseName === 'dativ' ? noun.dativePlural : noun.plural;
  else if (caseName === 'genitiv' && noun.gender !== 'f') nounForm = noun.genitive;
  return [article, stem + ending, nounForm].filter(Boolean).join(' ');
}

const nouns = Object.fromEntries(lesson.nouns.map((n) => [`${n.article} ${n.noun}`, n]));
const pluralNouns = Object.fromEntries(lesson.nouns.filter((n) => n.plural).map((n) => [`die ${n.plural}`, n]));
const adjectives = Object.fromEntries(lesson.adjectives.map((a) => [`${a.adjective}（${a.meaning}）`, a]));
const generated = lesson.exercises.filter((e) => e.given && e.id.startsWith('l6-s'));

test('every generated lesson 6 answer matches the independent declension tables', () => {
  assert.ok(generated.length > 200, `only ${generated.length} generated`);
  for (const exercise of generated) {
    const { noun: nounText, adjective: adjText, articleType, caseName, number } = exercise.given;
    const noun = number === 'pl' ? pluralNouns[nounText] : nouns[nounText];
    assert.ok(noun, `${exercise.id}: unknown noun ${nounText}`);
    const want = expected(noun, adjectives[adjText], articleType, caseName, number);
    assert.equal(exercise.answer.toLowerCase(), want.toLowerCase(), exercise.id);
  }
});

test('every exercise has four distinct, clean options including the answer', () => {
  for (const exercise of lesson.exercises) {
    assert.equal(exercise.options.length, 4, exercise.id);
    assert.equal(new Set(exercise.options.map((o) => o.trim())).size, 4, `${exercise.id}: ${exercise.options}`);
    assert.ok(exercise.options.includes(exercise.answer), exercise.id);
  }
});

test('new grammar areas are all present', () => {
  const has = (filter) => generated.some((e) => filter(e.given));
  assert.ok(has((g) => g.articleType === 'definite' && g.caseName === 'akkusativ'));
  assert.ok(has((g) => g.articleType === 'definite' && g.caseName === 'dativ'));
  assert.ok(has((g) => g.number === 'pl'));
  assert.ok(has((g) => g.articleType === 'possessive'));
  assert.ok(has((g) => g.articleType === 'negative'));
  assert.ok(has((g) => g.caseName === 'genitiv' && g.articleType === 'zero'));
});
