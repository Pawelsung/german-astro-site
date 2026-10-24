// Local daily activity: answers per day for the home page goal ring and streak,
// plus the last lesson visited for the "continue" button.
export const ACTIVITY_KEY = 'gw-daily-activity-v1';
export const LAST_LESSON_KEY = 'gw-last-lesson-v1';
export const DAILY_GOAL = 10;
const KEEP_DAYS = 60;

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readDays(store = storage()) {
  try {
    const parsed = JSON.parse(store?.getItem(ACTIVITY_KEY) || '{}');
    return parsed && typeof parsed.days === 'object' && !Array.isArray(parsed.days) ? parsed.days : {};
  } catch {
    return {};
  }
}

export function recordAnswer(correct, now = new Date(), store = storage()) {
  if (!store) return;
  const days = readDays(store);
  const key = dayKey(now);
  const today = days[key] || { answered: 0, correct: 0 };
  days[key] = { answered: today.answered + 1, correct: today.correct + (correct ? 1 : 0) };
  const recent = Object.keys(days).sort().slice(-KEEP_DAYS);
  const trimmed = Object.fromEntries(recent.map((k) => [k, days[k]]));
  try {
    store.setItem(ACTIVITY_KEY, JSON.stringify({ days: trimmed }));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('learning-progress-updated', { detail: { key: ACTIVITY_KEY } }));
  } catch {
    // Storage full or blocked: activity is a nice-to-have.
  }
}

// A streak counts consecutive active days ending today, or yesterday if today has no answers yet.
export function getActivity(now = new Date(), store = storage()) {
  const days = readDays(store);
  const today = days[dayKey(now)] || { answered: 0, correct: 0 };
  let streak = 0;
  const cursor = new Date(now);
  if (!today.answered) cursor.setDate(cursor.getDate() - 1);
  while ((days[dayKey(cursor)]?.answered || 0) > 0) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const week = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    week.push({ key: dayKey(date), answered: days[dayKey(date)]?.answered || 0 });
  }
  return {
    goal: DAILY_GOAL,
    todayAnswered: today.answered,
    todayCorrect: today.correct,
    streak,
    week
  };
}

export function recordLessonVisit(href, title, store = storage()) {
  try {
    store?.setItem(LAST_LESSON_KEY, JSON.stringify({ href, title, at: new Date().toISOString() }));
  } catch {
    // ignore
  }
}

export function getLastLesson(store = storage()) {
  try {
    const parsed = JSON.parse(store?.getItem(LAST_LESSON_KEY) || 'null');
    return parsed && typeof parsed.href === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
