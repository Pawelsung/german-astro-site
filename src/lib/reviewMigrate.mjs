// Moves lesson 1 progress into the review record. Safe to run on every load:
// it only fills words that have no record yet and never touches the old keys.
import { dayNumber, emptyRecord, hashText, intervalFor } from './reviewStore.mjs';

const nfc = s => String(s || '').trim().normalize('NFC');
const lemma = (article, word) => `${nfc(article).toLowerCase()} ${nfc(word)}`.trim();

// index rows: [id, article, word, level, topic, pos, inPool, variants?]
export function buildResolver(indexRows) {
  const ids = new Map();
  for (const [id, article, word, , , , , variants] of indexRows) {
    ids.set(lemma(article, word), id);
    for (const variant of variants || []) if (!ids.has(nfc(variant))) ids.set(nfc(variant), id);
  }
  return word => ids.get(lemma(word?.article, word?.word)) || null;
}

const newest = (a, b) => ((a.updatedAt || '') >= (b.updatedAt || '') ? a : b);

function combineById(words, resolve) {
  const byId = new Map();
  let unmapped = 0;
  for (const word of words) {
    const id = resolve(word);
    if (!id) { unmapped++; continue; }
    const seen = byId.get(id);
    if (!seen) {
      byId.set(id, { attempts: word.attempts || 0, correct: word.correct || 0, seen: word.seen || 0, errors: word.errors || 0, starred: !!word.starred, updatedAt: word.updatedAt || '' });
      continue;
    }
    seen.attempts += word.attempts || 0;
    seen.correct += word.correct || 0;
    seen.seen += word.seen || 0;
    seen.errors = Math.max(seen.errors, word.errors || 0);
    seen.starred = seen.starred || !!word.starred;
    seen.updatedAt = newest(seen, word).updatedAt || seen.updatedAt;
  }
  return { byId, unmapped };
}

function toRecord(id, old, today) {
  const practiced = old.attempts > 0 || old.seen > 0;
  if (!practiced && !old.errors) return null;
  const base = { ...emptyRecord(), r: old.attempts, c: old.correct, me: old.errors, t: Date.parse(old.updatedAt) || 1 };
  if (old.errors > 0) return { ...base, b: 1, d: today };
  if (old.correct === 0) return { ...base, b: 0, d: today };
  const b = old.correct >= 3 ? 3 : 2;
  // Spread over the box's interval so old words do not all come due on the same day.
  return { ...base, b, d: today + 1 + (hashText(id) % intervalFor(b, id)) };
}

export function migrateLegacyWords({ currentWords = [], archive = {}, review, resolve, today = dayNumber() }) {
  // The archive holds other banks; the current bank is newer whenever both hold the same word version.
  const versions = new Map();
  const versionKey = w => `${nfc(w.article)}|${nfc(w.word)}|${nfc(w.meaning || w.translationZh)}`;
  for (const word of [...Object.values(archive), ...currentWords]) {
    if (!word || typeof word !== 'object') continue;
    const key = versionKey(word);
    versions.set(key, versions.has(key) ? newest(versions.get(key), word) : word);
  }

  const { byId, unmapped } = combineById([...versions.values()], resolve);
  const next = { ...review, words: { ...review.words }, stars: { ...review.stars } };
  let addedWords = 0;
  let addedStars = 0;
  for (const [id, old] of byId) {
    if (!next.words[id]) {
      const record = toRecord(id, old, today);
      if (record) { next.words[id] = record; addedWords++; }
    }
    if (old.starred && !next.stars[id]) {
      next.stars[id] = { on: true, t: Date.parse(old.updatedAt) || 1 };
      addedStars++;
    }
  }
  return { review: next, addedWords, addedStars, unmapped };
}
