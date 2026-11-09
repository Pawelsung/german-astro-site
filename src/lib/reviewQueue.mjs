// Picks what to study today. Pure functions; `pool` is [{ id, level }] from the lexicon index.
import { RATINGS, emptyRecord, hashText, rateWord } from './reviewStore.mjs';

export const TODAY_KEY = 'gw-review-today-v1';
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const EXTRA_BATCH = 5;
export const WEEKLY_CHECK_SIZE = 10;
export const PLACEMENT_SIZE = 40;
const MIN_NEW_SLOTS = 3;
const RETURN_AFTER_DAYS = 30;
const DAY_MS = 86400000;
// Ten places: seven at the learner's level, two one level up, one from the levels below.
const SLOT_PATTERN = ['main', 'main', 'stretch', 'main', 'main', 'main', 'low', 'main', 'stretch', 'main'];
const KIND_OF_SLOT = { main: 'new', stretch: 'stretch', low: 'revisit' };

const dailyOrder = (day, id) => hashText(`${day}:${id}`);
const lastSeenDay = record => Math.floor((record.t || 0) / DAY_MS);

function candidates({ pool, review, today, exclude }) {
  const level = review.settings.level || 'B1';
  const rank = LEVELS.indexOf(level);
  const next = LEVELS[rank + 1];
  const baseline = review.settings.baseline || {};
  const groups = { due: [], main: [], stretch: [], low: [] };
  for (const word of pool) {
    if (exclude.has(word.id)) continue;
    const record = review.words[word.id];
    if (record && record.d <= today) { groups.due.push(word.id); continue; }
    const wordRank = LEVELS.indexOf(word.level);
    if (wordRank < rank) {
      if (!record || (record.b >= 4 && today - lastSeenDay(record) >= RETURN_AFTER_DAYS)) groups.low.push(word.id);
    } else if (!record && word.level === level && !baseline[word.level]) groups.main.push(word.id);
    else if (!record && word.level === next) groups.stretch.push(word.id);
  }
  const byDay = (a, b) => dailyOrder(today, a) - dailyOrder(today, b) || (a < b ? -1 : 1);
  groups.main.sort(byDay);
  groups.stretch.sort(byDay);
  groups.low.sort(byDay);
  // Weakest first, then longest overdue, so a backlog clears from the words most at risk.
  groups.due.sort((a, b) => {
    const ra = review.words[a];
    const rb = review.words[b];
    return ra.b - rb.b || ra.d - rb.d || byDay(a, b);
  });
  return groups;
}

export function buildDailyQueue({ pool, review, today, goal, exclude = new Set(), slot = 0 }) {
  const groups = candidates({ pool, review, today, exclude });
  const backlog = groups.due.length > goal * 2;
  const dueLimit = backlog ? goal : Math.max(1, goal - MIN_NEW_SLOTS);
  const items = groups.due.splice(0, dueLimit).map(id => ({ id, kind: 'due' }));

  let cursor = slot;
  if (!backlog) {
    while (items.length < goal) {
      const wanted = SLOT_PATTERN[cursor % SLOT_PATTERN.length];
      // When a group runs out its place passes on, so the long-run mix stays as close as the words allow.
      const source = [wanted, 'main', 'stretch', 'low'].find(name => groups[name].length);
      if (!source) break;
      items.push({ id: groups[source].shift(), kind: KIND_OF_SLOT[source] });
      cursor++;
    }
  }
  while (items.length < goal && groups.due.length) items.push({ id: groups.due.shift(), kind: 'due' });
  return { items, slot: cursor % SLOT_PATTERN.length };
}

// Words that were never reviewed here but come back as known start high, so "會了" keeps them high.
export function rateQueueItem(item, record, rating, options) {
  const known = item.kind === 'revisit' || item.kind === 'weekly';
  return rateWord(item.id, record || (known ? { ...emptyRecord(), b: 5 } : undefined), rating, options);
}

export const newTodayState = (today, goal) => ({ day: today, goal, items: [], pos: 0, done: 0 });
export const currentItem = state => state.items[state.pos] || null;

export function advanceToday(state, rating) {
  const item = currentItem(state);
  if (!item) return state;
  const items = [...state.items];
  // A missed word comes back once in the same sitting; that second look changes no record.
  if (rating === RATINGS.DONT_KNOW && !item.repeat) items.push({ ...item, repeat: true });
  const counts = !item.repeat && item.kind !== 'weekly';
  return { ...state, items, pos: state.pos + 1, done: state.done + (counts ? 1 : 0) };
}

export function getReviewSnapshot(stored, review, today) {
  const goal = review.settings.dailyGoal;
  const done = stored?.day === today ? stored.done : 0;
  const due = Object.values(review.words).filter(record => record.d <= today).length;
  return { goal, done, due, reached: done >= goal, started: done > 0 };
}

export function weeklyCheckDue(settings, today) {
  if (!settings.level || settings.level === 'A1') return false;
  return settings.weeklyDone === undefined || today - settings.weeklyDone >= 7;
}

export function pickWeeklyCheck({ pool, review, today, exclude = new Set(), size = WEEKLY_CHECK_SIZE }) {
  const rank = LEVELS.indexOf(review.settings.level || 'B1');
  return pool
    .filter(word => LEVELS.indexOf(word.level) < rank && !exclude.has(word.id))
    .filter(word => { const r = review.words[word.id]; return !r || (r.b >= 4 && r.d > today); })
    .sort((a, b) => dailyOrder(today, a.id) - dailyOrder(today, b.id) || (a.id < b.id ? -1 : 1))
    .slice(0, size)
    .map(word => ({ id: word.id, kind: 'weekly' }));
}

// Stable for a given seed, so reloading mid-check shows the same words.
export function pickPlacement({ pool, review, seed, size = PLACEMENT_SIZE }) {
  return pool
    .filter(word => word.level === 'A2' && !review.words[word.id])
    .map(word => word.id)
    .sort((a, b) => dailyOrder(seed, a) - dailyOrder(seed, b) || (a < b ? -1 : 1))
    .slice(0, size);
}

export const placementPassed = (known, total) => total > 0 && known >= Math.ceil(total * 0.8);

export const withBaseline = (settings, today, now) => ({ ...settings, baseline: { A1: today, A2: today }, placedAt: today, t: now });
export function withoutBaseline(settings, now) {
  const { baseline, ...rest } = settings;
  return { ...rest, t: now };
}
