// Every German text the site can read aloud; each one needs a recording.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { audioKey } from '../src/lib/germanSpeech.mjs';
import { normalizeVocabulary } from '../src/lib/vocabulary.mjs';
import { verbPrepositions } from '../src/data/verb-prepositions.ts';
import { irregularVerbs } from '../src/data/irregular-verbs.ts';
import { woDaPractice } from '../src/data/wo-da-practice.ts';
import { fillWoDa, woDaAnswer } from '../src/lib/woDa.mjs';
import { konjunktivExercises } from '../src/data/lesson7-konjunktiv.ts';
import { fillBlank, formExercises, formPhrase } from '../src/lib/konjunktiv.mjs';
import adjectiveData from '../src/data/lesson6-adjective-declension.ts';
import { adjectiveSpeechText, connectorSpeechText, kasusSpeechText } from '../src/lib/lessonSpeech.mjs';

const ROOT = new URL('..', import.meta.url).pathname;

export function collectTexts() {
  const texts = new Set();
  const add = (value) => { const key = audioKey(value); if (key) texts.add(key); };

  // Lesson 1: every bundled vocabulary file (speak() uses the bare word and the example).
  const vocabDir = join(ROOT, 'public/vocab');
  for (const file of readdirSync(vocabDir).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
    for (const word of normalizeVocabulary(JSON.parse(readFileSync(join(vocabDir, file), 'utf8')))) {
      add(word.word);
      add(word.example);
    }
  }

  // Review cards read the graded lexicon, which includes words that are in no bundled bank.
  const lexicon = JSON.parse(readFileSync(join(ROOT, 'src/data/lexicon/lexicon.graded.json'), 'utf8'));
  for (const entry of lexicon.entries) {
    add(entry.word);
    for (const example of entry.examples) add(example.de);
  }

  // Lesson 2: verbs, examples and the spoken quiz feedback.
  for (const item of verbPrepositions) { add(item.verb); add(item.example); }
  add('Richtig!');
  add('Das ist ein Test für die Aussprache.');
  for (const answer of new Set(['Akkusativ', 'Dativ', ...verbPrepositions.map((item) => item.prep)])) add(`Falsch. Die Antwort ist ${answer}`);
  // wo/da mode reads the completed sentence after each answer.
  const entries = new Map(verbPrepositions.map((item) => [item.id, item]));
  for (const item of woDaPractice) add(fillWoDa(item, woDaAnswer(item, entries.get(item.entryId))));

  // Lesson 7: the solved form or sentence read after each answer (same rule as solvedText in KonjunktivTrainer).
  for (const item of formExercises()) add(formPhrase(item));
  for (const item of konjunktivExercises) {
    if (item.stage === 'transform') add(item.options[0]);
    else if (item.stage === 'function') add(item.sentence);
    else add(fillBlank(item.sentence, item.options[0]));
  }

  // Lesson 3: forms, participle (speak(splitPerfekt(perfekt).participle)) and examples.
  for (const verb of irregularVerbs) {
    add(verb.infinitive); add(verb.praeteritum); add(verb.perfekt); add(verb.example);
    add(String(verb.perfekt || '').split(' ').slice(1).join(' ') || verb.perfekt);
  }
  // Lessons 4, 5 and 6: the solved sentence read from the play button after each answer.
  const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
  for (const item of readJson('src/data/lesson4-kasus-quest-data.json').exercises) add(kasusSpeechText(item));
  const connectors = readJson('src/data/connectors-question-bank.json');
  for (const question of connectors.questions) add(connectorSpeechText(question));
  for (const connector of connectors.connectors) add(connector.exampleDe);
  for (const item of adjectiveData.exercises) add(adjectiveSpeechText(item));
  for (const card of adjectiveData.conceptCards) for (const example of card.examples.slice(0, 3)) add(example.german);

  return [...texts];
}
