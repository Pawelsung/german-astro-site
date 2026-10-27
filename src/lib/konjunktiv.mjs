// Konjunktiv II forms for lesson 7, built from stems so the drill and the concept table share one source.

export const PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

// k2: Konjunktiv II stem, past: Präteritum stem. level marks the forms B1 learners must produce vs. recognise.
export const KONJUNKTIV_VERBS = [
  { infinitive: 'sein', k2: 'wär', past: 'war', level: 'A2', meaning: '是' },
  { infinitive: 'haben', k2: 'hätt', past: 'hatt', level: 'A2', meaning: '有' },
  { infinitive: 'werden', k2: 'würd', past: 'wurd', level: 'A2', meaning: '（würde + 不定式）' },
  { infinitive: 'können', k2: 'könnt', past: 'konnt', level: 'A2', meaning: '能夠' },
  { infinitive: 'müssen', k2: 'müsst', past: 'musst', level: 'B1', meaning: '必須' },
  { infinitive: 'dürfen', k2: 'dürft', past: 'durft', level: 'B1', meaning: '可以' },
  { infinitive: 'sollen', k2: 'sollt', past: 'sollt', level: 'A2', meaning: '應該' },
  { infinitive: 'wollen', k2: 'wollt', past: 'wollt', level: 'B1', meaning: '想要' },
  { infinitive: 'mögen', k2: 'möcht', past: 'mocht', level: 'A2', meaning: '想要（möchte）' },
  { infinitive: 'wissen', k2: 'wüsst', past: 'wusst', level: 'B1+', meaning: '知道' },
  { infinitive: 'kommen', k2: 'käm', past: 'kam', level: 'B1+', meaning: '來' },
  { infinitive: 'gehen', k2: 'ging', past: 'ging', level: 'B1+', meaning: '去' },
  { infinitive: 'geben', k2: 'gäb', past: 'gab', level: 'B1+', meaning: '給（es gäbe）' }
];

// Stems ending in -t/-d take an -e- before -st/-t (hättest, würdet); others do not (wärst, kämt).
const needsE = (stem) => /[td]$/.test(stem);

export function konjunktivForm(verb, person) {
  // gehen retains -e- in gingest/ginget; gingst/gingt are Präteritum.
  const e = needsE(verb.k2) || verb.infinitive === 'gehen' ? 'e' : '';
  return verb.k2 + ['e', `${e}st`, 'e', 'en', `${e}t`, 'en'][person];
}

// Präteritum: weak-looking stems (hatt-, konnt-) take -e/-est, strong ones (war, kam) have no ending in ich/er.
export function pastForm(verb, person) {
  const weak = needsE(verb.past);
  const endings = weak ? ['e', 'est', 'e', 'en', 'et', 'en'] : ['', 'st', '', 'en', 't', 'en'];
  return verb.past + endings[person];
}

// gehen has no umlaut, so its Konjunktiv II adds -e (ginge) while the Präteritum does not (ging).
// sollen and wollen are the only ones where both are identical.
export const sameAsPast = (verb) => PERSONS.every((_, person) => konjunktivForm(verb, person) === pastForm(verb, person));

// One drill item per verb and person: the answer, the Präteritum (where it differs) and wrong persons.
export function formExercises() {
  const items = [];
  for (const verb of KONJUNKTIV_VERBS) {
    PERSONS.forEach((pronoun, person) => {
      const answer = konjunktivForm(verb, person);
      const pool = [pastForm(verb, person), ...PERSONS.map((_, other) => konjunktivForm(verb, other)), ...PERSONS.map((_, other) => pastForm(verb, other))];
      const options = [answer];
      for (const candidate of pool) {
        if (options.length === 4) break;
        // A form that is right for this person (sollte = Präteritum) cannot be a distractor.
        if (!options.includes(candidate) && candidate !== answer) options.push(candidate);
      }
      items.push({
        id: `f-${verb.infinitive}-${person}`,
        stage: 'forms',
        level: verb.level,
        verb,
        pronoun,
        person,
        options,
        explain: formExplain(verb, person, answer)
      });
    });
  }
  return items;
}

function formExplain(verb, person, answer) {
  if (sameAsPast(verb)) return `${verb.infinitive} 的 Konjunktiv II 和過去式同形（${answer}），要靠上下文判斷。`;
  if (verb.infinitive === 'gehen') return `gehen → ging → ginge：沒有變音，在過去式後面加 -e。`;
  const umlaut = verb.k2 !== verb.past;
  return `${verb.infinitive} → 過去式 ${pastForm(verb, 2)} → Konjunktiv II ${konjunktivForm(verb, 2)}${umlaut ? '（加變音）' : ''}；${PERSONS[person]} 用 ${answer}。`;
}

// "du hättest", the text shown and spoken after a form item.
export const formPhrase = (item) => `${item.pronoun.split('/')[0]} ${konjunktivForm(item.verb, item.person)}`;

export const fillBlank = (sentence, answer) => sentence.replace('___', answer);
