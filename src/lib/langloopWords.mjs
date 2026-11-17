// Words saved in LangLoop's word list (生字本) join the review here. LangLoop only stores them;
// this site writes its own review record, so the normal cloud sync carries them to other devices.
import { RATINGS, dayNumber, rateWord } from './reviewStore.mjs';

// `words` come from LangLoop's GET /api/words: [{ lexiconId, updatedAt, ... }].
// `knownIds` are the lexicon ids that can be reviewed (the review pool).
// The star's time marks the import: a word is taken again only if it was saved in LangLoop
// after its star last changed here, so unstarring it here sticks until it is saved again.
export function importLangLoopWords(review, words, knownIds, { today = dayNumber(), now = Date.now() } = {}) {
  const next = { ...review, words: { ...review.words }, stars: { ...review.stars } };
  const added = [];
  for (const word of Array.isArray(words) ? words : []) {
    const id = typeof word?.lexiconId === 'string' ? word.lexiconId : '';
    const savedAt = Date.parse(word?.updatedAt) || 0;
    if (!id || !savedAt || !knownIds.has(id) || added.includes(id)) continue;
    const star = next.stars[id];
    if (star && star.t >= savedAt) continue;
    next.stars[id] = { on: true, t: savedAt };
    // Saving a word there means "I don't know this yet", so it counts as a miss and is due today.
    next.words[id] = { ...rateWord(id, next.words[id], RATINGS.DONT_KNOW, { today, now }), d: today };
    added.push(id);
  }
  return { review: next, added };
}
