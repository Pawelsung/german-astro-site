// Turns a lesson 4 exercise into a sentence diagram model: which words carry the case,
// which verb or preposition triggers it, and (for relative clauses) which noun is referred to.
import { genderKey } from './grammarColors.mjs';

const PREPOSITIONS = new Set(['mit', 'für', 'ohne', 'bei', 'durch', 'zu', 'in', 'auf', 'an', 'aus', 'seit', 'gegen', 'um', 'unter', 'über', 'neben', 'vor', 'hinter', 'zwischen', 'nach', 'von', 'gegenüber', 'entlang', 'bis', 'wegen', 'trotz', 'während', 'statt', 'innerhalb', 'außerhalb']);
const SEPARABLE = ['an', 'auf', 'aus', 'ein', 'mit', 'vor', 'zu', 'ab', 'zurück', 'weg'];
const DETERMINER = /^(d(er|ie|as|en|em|es)|k?ein(e[mnrs]?)?|mein|dein|sein|ihr|unser|eu(e)?r|dies)/i;

const strip = (token) => token.replace(/[.,!?;:"„“]/g, '');
const lower = (token) => strip(token).toLocaleLowerCase('de');
// Consonant skeleton survives vowel changes: helfen/hilft → hlf, sehen/sieht → sh.
const skeleton = (word) => lower(word).replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/[aeiouy]/g, '');


export { genderKey };
export const CASE_KEYS = { Nominativ: 'nom', Akkusativ: 'akk', Dativ: 'dat', Genitiv: 'gen' };

function charToToken(tokens, charIndex) {
  let position = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    if (charIndex < position + tokens[i].length + 1) return i;
    position += tokens[i].length + 1;
  }
  return tokens.length - 1;
}

// Extends a target span forward to its noun (e.g. "den" → "den Mann").
function extendToNoun(tokens, start, end, nounPhrase) {
  const noun = lower(String(nounPhrase || '').split(' ').pop() || '');
  if (!noun) return end;
  for (let i = end + 1; i <= Math.min(end + 3, tokens.length - 1); i += 1) {
    const word = lower(tokens[i]);
    // Dative plural adds -n: Kinder → Kindern.
    if (word === noun || (word.startsWith(noun) && word.length - noun.length <= 2)) return i;
  }
  return end;
}

function blankTargets(exercise, sentence, tokens) {
  const parts = sentence.split('___');
  if (parts.length < 2) return null;
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${parts.map(escape).join('(.+?)')}$`, 'd');
  const match = pattern.exec(exercise.fullSentence.trim());
  if (!match?.indices) return null;
  const nouns = String(exercise.targetNoun || '').split(' / ');
  const genders = String(exercise.gender || '').split('/');
  const cases = String(exercise.case || '').split(' + ');
  const blanks = match.indices.slice(1);
  return blanks.map(([from, to], i) => {
    const start = charToToken(tokens, from);
    const last = charToToken(tokens, Math.max(from, to - 1));
    if (blanks.length === 1) {
      return { start, end: extendToNoun(tokens, start, last, nouns[0]), caseName: cases[0], gender: genderKey(exercise.gender) };
    }
    // Several blanks: only trust a gender when the blank grows into one of the listed nouns.
    const owner = nouns.findIndex((noun) => extendToNoun(tokens, start, last, noun) !== last);
    const end = owner >= 0 ? extendToNoun(tokens, start, last, nouns[owner]) : last;
    return { start, end, caseName: cases[i] || cases[0], gender: owner >= 0 ? genderKey(genders[owner]) : null };
  });
}

function repairTargets(exercise, tokens) {
  const wrong = exercise.sentence.trim().split(/\s+/);
  if (wrong.length !== tokens.length) return null;
  const changed = tokens.map((token, i) => (strip(token) !== strip(wrong[i]) ? i : -1)).filter((i) => i >= 0);
  if (!changed.length) return null;
  const start = changed[0];
  return [{ start, end: extendToNoun(tokens, start, changed.at(-1), exercise.targetNoun), caseName: exercise.case, gender: genderKey(exercise.gender) }];
}

function nounTargets(exercise, tokens) {
  const noun = lower(String(exercise.targetNoun || '').split(' ').pop() || '');
  // Genitive and n-declension add an ending: Bruder → Bruders, Student → Studenten.
  const at = tokens.findIndex((token) => { const word = lower(token); return word === noun || (word.startsWith(noun) && word.length - noun.length <= 2); });
  if (at < 0) return null;
  const start = at > 0 && DETERMINER.test(strip(tokens[at - 1])) ? at - 1 : at;
  return [{ start, end: at, caseName: exercise.case, gender: genderKey(exercise.gender) }];
}

// Spellings of a token with participle "ge-" and separable prefixes removed: angerufen → rufen.
function tokenVariants(token) {
  const word = lower(token);
  const variants = [word];
  const prefix = SEPARABLE.find((p) => word.startsWith(p) && word.length > p.length + 3);
  const rest = prefix ? word.slice(prefix.length) : word;
  if (prefix) variants.push(rest);
  if (rest.startsWith('ge') && rest.length > 4) variants.push(rest.slice(2));
  return variants;
}

const IRREGULAR = { haben: ['hab', 'hat', 'hast', 'gehabt'], sein: ['bin', 'bist', 'ist', 'sind', 'seid', 'war', 'gewesen'] };

function findTrigger(exercise, tokens, target, taken) {
  const segment = String(exercise.trigger || '').split(';')[0].trim();
  if (!segment || segment === 'subject' || /classification|two-way|body part/i.test(segment)) return null;
  // "relative pronoun + sehen" → sehen; "sich erinnern an + Akkusativ" → sich erinnern an.
  const head = segment.split('+').map((part) => part.trim()).find((part) => part && !/relative|pronoun|reflexive|Nominativ|Akkusativ|Dativ|Genitiv/i.test(part));
  if (!head) return null;
  const words = head.split(/\s+/).filter((word) => !['sich', 'etwas'].includes(word));
  const distance = (i) => Math.abs(i - target.start);
  const candidates = tokens.map((_, i) => i).filter((i) => !taken.has(i));
  const closest = (list) => list.sort((a, b) => distance(a) - distance(b))[0];

  // A preposition right before the target is the real trigger, even in "sprechen über".
  const prep = words.find((word) => PREPOSITIONS.has(word));
  if (prep) {
    const hit = closest(candidates.filter((i) => lower(tokens[i]) === prep && i < target.start));
    if (hit !== undefined && (words.length === 1 || target.start - hit <= 1)) return { index: hit, kind: 'prep', label: segment };
  }
  const verb = words.filter((word) => /^[a-zäöüß]+n$/.test(word) && !PREPOSITIONS.has(word)).pop();
  if (!verb) return null;
  const stems = [skeleton(verb).replace(/n$/, '')];
  const prefix = SEPARABLE.find((p) => verb.startsWith(p) && verb.length > p.length + 3);
  if (prefix) stems.push(skeleton(verb.slice(prefix.length)).replace(/n$/, ''));
  const forms = IRREGULAR[verb] || [];
  const hit = closest(candidates.filter((i) => tokenVariants(tokens[i]).some((variant) => {
    if (forms.some((form) => variant.startsWith(form))) return true;
    const sk = skeleton(variant);
    return sk.length >= 2 && stems.some((stem) => stem.length >= 2 && sk.startsWith(stem));
  })));
  return hit === undefined ? null : { index: hit, kind: 'verb', label: segment };
}

export function analyzeCaseSentence(exercise) {
  if (!exercise?.fullSentence || exercise.mode === 'preposition-classify' || exercise.diagram === false) return null;
  let sentence = String(exercise.sentence || '');
  if (sentence.includes('→')) sentence = sentence.split('→').pop().trim();
  const tokens = exercise.fullSentence.trim().split(/\s+/);

  const targets = sentence.includes('___')
    ? blankTargets(exercise, sentence, tokens)
    : exercise.mode === 'sentence-repair'
      ? repairTargets(exercise, tokens)
      : nounTargets(exercise, tokens);
  if (!targets?.length) return null;

  const taken = new Set(targets.flatMap(({ start, end }) => Array.from({ length: end - start + 1 }, (_, k) => start + k)));
  const single = targets.length === 1;
  const subject = single && (exercise.trigger === 'subject' || /as subject/.test(exercise.trigger || ''));

  // Relative pronouns point back to the noun they replace.
  let antecedent = null;
  if (single && /relative/i.test(`${exercise.mode} ${exercise.trigger}`)) {
    const noun = lower(String(exercise.targetNoun || '').split(' ').pop() || '');
    const at = tokens.findIndex((token, i) => i < targets[0].start && lower(token) === noun);
    if (at >= 0) {
      const start = at > 0 && DETERMINER.test(strip(tokens[at - 1])) ? at - 1 : at;
      antecedent = { start, end: at };
      for (let i = start; i <= at; i += 1) taken.add(i);
    }
  }

  const trigger = single && !subject ? findTrigger(exercise, tokens, targets[0], taken) : null;
  return { tokens, targets, trigger, antecedent, subject, questionWord: exercise.questionWord || '' };
}
