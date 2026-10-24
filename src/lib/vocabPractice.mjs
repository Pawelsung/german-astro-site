// Production practice for lesson 1: Chinese → German typing and example-sentence cloze.

const nfc = (text) => String(text ?? '').normalize('NFC');
const squash = (text) => nfc(text).replace(/\s+/g, ' ').trim();
const TOKEN = /[\p{L}\p{M}'-]+/gu;
const PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich', 'uns', 'euch', 'mir', 'dir', 'er/sie/es', 'sie/sie']);

function practiceForms(word) {
  const practice = word.practice && typeof word.practice === 'object' ? word.practice : {};
  const phrases = [
    String(word.plural || '').replace(/^die\s+/i, ''),
    practice.participleII,
    practice.praeteritum_3sg,
    ...Object.values(practice.present || {})
  ];
  // "ich wundere mich" / "sich gewundert" → keep the verb, skip subject and reflexive pronouns.
  return phrases
    .flatMap((phrase) => nfc(phrase).split(/\s+/))
    .filter((form) => form && form !== '-' && !PRONOUNS.has(form.toLowerCase()));
}

// Finds the word (or one of its inflected forms) in the example sentence and splits it out.
export function findClozeTarget(word) {
  const example = nfc(word?.example);
  const base = nfc(word?.word).replace(/^sich\s+/i, '').trim();
  if (!example || !base) return null;

  if (/\s/.test(base)) {
    const at = example.toLocaleLowerCase('de').indexOf(base.toLocaleLowerCase('de'));
    if (at < 0) return null;
    const answer = example.slice(at, at + base.length);
    return { before: example.slice(0, at), answer, after: example.slice(at + base.length), base: word.word, inflected: false };
  }

  const tokens = [...example.matchAll(TOKEN)].map((match) => ({ text: match[0], index: match.index }));
  const forms = practiceForms(word);
  const lower = base.toLocaleLowerCase('de');
  const stem = lower.slice(0, Math.max(4, lower.length - 2));
  const pick =
    tokens.find((token) => token.text === base) ||
    tokens.find((token) => token.text.toLocaleLowerCase('de') === lower) ||
    tokens.find((token) => forms.includes(token.text)) ||
    (lower.length > 3 ? tokens.find((token) => token.text.toLocaleLowerCase('de').startsWith(stem)) : null);
  if (!pick) return null;
  return {
    before: example.slice(0, pick.index),
    answer: pick.text,
    after: example.slice(pick.index + pick.text.length),
    base: word.word,
    inflected: pick.text.toLocaleLowerCase('de') !== lower
  };
}

// "der Mut" for nouns, the plain headword otherwise.
export function productionAnswer(word) {
  return squash(word.article ? `${word.article} ${word.word}` : word.word);
}

// Compares typed German with the expected form and explains near misses.
export function checkTyped(expected, typed, { sentenceStart = false } = {}) {
  const want = squash(expected);
  const got = squash(typed);
  if (!got) return { correct: false, reason: 'empty' };
  if (got === want) return { correct: true };
  const fold = (text) => text.toLocaleLowerCase('de');
  // A blank at the start of a sentence may be typed in lower case.
  if (sentenceStart && fold(got) === fold(want) && got.slice(1) === want.slice(1)) return { correct: true };

  const [wantArticle, ...wantRest] = want.split(' ');
  const [gotArticle, ...gotRest] = got.split(' ');
  const isArticle = (text) => ['der', 'die', 'das'].includes(fold(text));
  if (isArticle(wantArticle)) {
    if (!isArticle(gotArticle)) {
      return wantRest.join(' ') === got ? { correct: false, reason: 'missing-article' } : { correct: false, reason: 'wrong' };
    }
    if (fold(gotArticle) !== fold(wantArticle) && gotRest.join(' ') === wantRest.join(' ')) return { correct: false, reason: 'wrong-article' };
  }
  if (fold(got) === fold(want)) return { correct: false, reason: 'capitalization' };
  const plain = (text) => fold(text).replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
  const expand = (text) => fold(text).replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
  if (plain(got) === plain(want) || fold(got) === expand(want)) return { correct: false, reason: 'umlaut' };
  if (fold(want).startsWith('sich ') && fold(got) === fold(want).slice(5)) return { correct: true, note: 'reflexive' };
  return { correct: false, reason: 'wrong' };
}

export const MISS_REASONS = {
  empty: '還沒有輸入答案。',
  'missing-article': '單字對了，但名詞要連冠詞一起寫。',
  'wrong-article': '單字對了，冠詞錯了。',
  capitalization: '拼字對了，注意大小寫：德文名詞第一個字母要大寫。',
  umlaut: '差一點！注意變音字母 ä／ö／ü／ß。',
  wrong: ''
};
