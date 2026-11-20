import { normalizeVocabulary, wordKey } from '../../src/lib/vocabulary.mjs';

// Keep the original bank id/prose. Other versions remain addressable for saved progress.
export function mergeSchritte(banks, underlined) {
  const merged = new Map();
  const lemma = w => `${w.article}|${w.word}`;
  for (const bank of [...banks, underlined]) {
    for (const w of normalizeVocabulary(bank)) {
      const key = lemma(w);
      let target = merged.get(key);
      if (!target) {
        target = { ...w, underlined: false, legacyIds: [], legacyKeys: [] };
        merged.set(key, target);
      }
      if (w.id && w.id !== target.id && !target.legacyIds.includes(w.id)) target.legacyIds.push(w.id);
      if (!target.legacyKeys.includes(wordKey(w))) target.legacyKeys.push(wordKey(w));
      if (bank === underlined) {
        target.underlined = true;
        // Existing complete/hidden-advanced words keep their textbook lesson, title and category.
        // Only new words introduced by the underline list use its lesson metadata.
      }
    }
  }
  return [...merged.values()].map(w => ({ ...w, groupOrder: w.lesson - 1 }))
    .sort((a, b) => a.lesson - b.lesson);
}
