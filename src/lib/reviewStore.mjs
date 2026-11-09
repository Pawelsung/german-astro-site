// The site-wide review record: one entry per lexicon word, plus stars and settings.
// Pure functions only, so the same code runs for local storage, cloud sync and tests.
//
// Stored as strings rather than Firestore maps: 3012 words × 8 fields × 2 automatic
// indexes would exceed Firestore's 40,000 index entries per document.

export const REVIEW_KEY = 'gw-review-v1';
export const DEFAULT_DAILY_GOAL = 15;
export const INTERVALS = [0, 1, 3, 7, 16, 35];
export const TOP_BOX = 6;
export const RATINGS = { KNOW: 'know', UNSURE: 'unsure', DONT_KNOW: 'dont-know' };

const WORD_FIELDS = ['b', 'd', 't', 'r', 'c', 'me', 'ae', 'aw'];
const COUNTERS = ['r', 'c', 'me', 'ae', 'aw'];

export const dayNumber = (date = new Date()) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

export const emptyReview = () => ({ words: {}, stars: {}, settings: { dailyGoal: DEFAULT_DAILY_GOAL, t: 0 } });
export const emptyRecord = () => ({ b: 0, d: 0, t: 0, r: 0, c: 0, me: 0, ae: 0, aw: 0 });

// Spreads the top box over 60–90 days per word, so a whole level never comes due at once.
export function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}
export const topBoxInterval = id => 60 + (hashText(id) % 31);
export const intervalFor = (box, id) => (box >= TOP_BOX ? topBoxInterval(id) : INTERVALS[Math.max(0, box)]);

export function statusOf(box) {
  if (box >= 4) return 'learned';
  return box >= 2 ? 'almost' : 'learning';
}

export function rateWord(id, record, rating, { today = dayNumber(), now = Date.now() } = {}) {
  const old = record || emptyRecord();
  const next = { ...old, r: old.r + 1, t: now };
  if (rating === RATINGS.KNOW) {
    next.b = Math.min(old.b + 1, TOP_BOX);
    next.c = old.c + 1;
    next.d = today + intervalFor(next.b, id);
  } else if (rating === RATINGS.UNSURE) {
    next.d = today + Math.max(1, Math.floor(intervalFor(old.b, id) / 2));
  } else if (rating === RATINGS.DONT_KNOW) {
    next.b = 1;
    next.me = old.me + 1;
    next.d = today + 1;
  } else {
    throw new Error(`unknown rating: ${rating}`);
  }
  return next;
}

// A wrong article is tracked on its own and never moves the word between boxes.
export function markArticleWrong(record, { now = Date.now() } = {}) {
  const old = record || emptyRecord();
  return { ...old, ae: old.ae + 1, aw: 1, t: now };
}
export const markArticleRight = (record, { now = Date.now() } = {}) => ({ ...record, aw: 0, t: now });

export function encodeReview(review) {
  const words = Object.entries(review.words).sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([id, r]) => [id, ...WORD_FIELDS.map(f => r[f] || 0)].join(',')).join('\n');
  const stars = Object.entries(review.stars).sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([id, s]) => [id, s.on ? 1 : 0, s.t].join(',')).join('\n');
  return { v: 1, words, stars, settings: JSON.stringify(review.settings) };
}

export function decodeReview(stored) {
  const review = emptyReview();
  if (!stored || typeof stored !== 'object') return review;
  for (const line of String(stored.words || '').split('\n').filter(Boolean)) {
    const [id, ...values] = line.split(',');
    if (!id || values.length !== WORD_FIELDS.length) continue;
    const numbers = values.map(Number);
    if (numbers.some(n => !Number.isFinite(n))) continue;
    review.words[id] = Object.fromEntries(WORD_FIELDS.map((f, i) => [f, numbers[i]]));
  }
  for (const line of String(stored.stars || '').split('\n').filter(Boolean)) {
    const [id, on, t] = line.split(',');
    if (id) review.stars[id] = { on: on === '1', t: Number(t) || 0 };
  }
  try {
    const settings = JSON.parse(stored.settings || '{}');
    if (settings && typeof settings === 'object') review.settings = { ...review.settings, ...settings };
  } catch { /* keep defaults when settings are corrupt */ }
  return review;
}

function mergeRecord(a, b) {
  let winner;
  if (a.t !== b.t) winner = a.t > b.t ? a : b;
  else if (a.b !== b.b) winner = a.b < b.b ? a : b;
  else winner = a.d <= b.d ? a : b;
  const merged = { ...winner };
  for (const f of COUNTERS) merged[f] = Math.max(a[f] || 0, b[f] || 0);
  // aw is a current state rather than a count, so the newer record decides it.
  merged.aw = winner.aw || 0;
  return merged;
}

function mergeStar(a, b) {
  if (a.t !== b.t) return a.t > b.t ? a : b;
  return a.on ? a : b;
}

function mergeMap(a, b, combine) {
  const out = { ...a };
  for (const [id, value] of Object.entries(b)) out[id] = id in out ? combine(out[id], value) : value;
  return out;
}

export function mergeReview(a, b) {
  let settings;
  if ((a.settings.t || 0) !== (b.settings.t || 0)) settings = (a.settings.t || 0) > (b.settings.t || 0) ? a.settings : b.settings;
  else settings = JSON.stringify(a.settings) <= JSON.stringify(b.settings) ? a.settings : b.settings;
  return { words: mergeMap(a.words, b.words, mergeRecord), stars: mergeMap(a.stars, b.stars, mergeStar), settings };
}

// How lesson 1 practice feeds the record. Returns the record unchanged when the answer should not count.
export function applyLessonAnswer(id, record, { mode, correct, reason }, { today = dayNumber(), now = Date.now() } = {}) {
  if (mode === 'pos') return record;
  const articleSlip = reason === 'wrong-article' || reason === 'missing-article';
  if (mode === 'article' || articleSlip) {
    if (!correct) return markArticleWrong(record, { now });
    return record?.aw ? markArticleRight(record, { now }) : record;
  }
  if (!correct) return rateWord(id, record, RATINGS.DONT_KNOW, { today, now });
  // Correct answers only advance a word that is new or due, so one sitting cannot inflate a box.
  return !record || record.d <= today ? rateWord(id, record, RATINGS.KNOW, { today, now }) : record;
}
