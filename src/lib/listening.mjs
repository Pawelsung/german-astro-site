// Pure helpers for the listening and writing pages: splitting a sentence into tappable words,
// matching a tapped word to the site's word list, and comparing a shadowed sentence with what
// speech recognition heard.

const nfc = s => String(s || '').normalize('NFC');
// Letters (with umlauts and ß), digits, apostrophes and inner hyphens make up a word.
const WORD = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;

// [{ text, word }] where word is the tappable part (null for spaces and punctuation).
export function splitWords(sentence) {
  const text = nfc(sentence);
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(WORD)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), word: null });
    parts.push({ text: match[0], word: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), word: null });
  return parts;
}

const ENDINGS = ['', 'e', 'n', 'en', 'es', 's', 'er', 'em', 'ern', 'nen'];

// index rows: [id, article, word, level, topic, pos, inPool]. Only reviewable rows (inPool) match.
export function buildWordMatcher(indexRows) {
  const byWord = new Map();
  for (const row of indexRows || []) {
    if (!row[6] || /\s/.test(row[2])) continue;
    const key = nfc(row[2]).toLowerCase();
    if (!byWord.has(key)) byWord.set(key, []);
    byWord.get(key).push(row);
  }
  // A tapped form like "berühmten" or "Nachrichten" is tried without common endings. Capitalised
  // forms prefer nouns, lower-case ones prefer anything else, so "Essen" and "essen" differ.
  return surface => {
    const word = nfc(surface).trim();
    if (!word) return null;
    const lower = word.toLowerCase();
    const capital = word[0] !== word[0].toLowerCase();
    for (const ending of ENDINGS) {
      if (ending && !lower.endsWith(ending)) continue;
      const stem = ending ? lower.slice(0, -ending.length) : lower;
      if (stem.length < 2) continue;
      const rows = byWord.get(stem);
      if (!rows) continue;
      const preferred = rows.find(row => (row[5] === 'noun') === capital);
      return preferred || rows[0];
    }
    return null;
  };
}

const normalize = word => nfc(word).toLowerCase().replace(/ß/g, 'ss');
const tokens = text => [...nfc(text).matchAll(WORD)].map(match => match[0]);

// Marks each word of the target sentence as heard or missed, by the longest common subsequence
// of the two word lists, so one missed word does not shift every word after it.
export function compareShadowing(target, heard) {
  const want = tokens(target);
  const got = tokens(heard).map(normalize);
  const a = want.map(normalize);
  const table = Array.from({ length: a.length + 1 }, () => new Array(got.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = got.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === got[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const words = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < got.length && a[i] === got[j]) { words.push({ word: want[i], heard: true }); i++; j++; }
    else if (j < got.length && table[i][j + 1] > table[i + 1][j]) j++;
    else { words.push({ word: want[i], heard: false }); i++; }
  }
  const heardCount = words.filter(word => word.heard).length;
  return { words, heardCount, total: words.length, score: words.length ? heardCount / words.length : 0 };
}

// The segment playing at a time, by index; -1 before the first one.
export function segmentAt(segments, time) {
  let found = -1;
  for (let index = 0; index < segments.length; index++) {
    if (segments[index].start <= time + 0.05) found = index;
    else break;
  }
  return found;
}

// Whether a rewrite matches the corrected text, ignoring spacing and final punctuation.
export function sameText(a, b) {
  const clean = text => nfc(text).replace(/\s+/g, ' ').replace(/[\s.!?]+$/, '').trim();
  return clean(a) !== '' && clean(a) === clean(b);
}
