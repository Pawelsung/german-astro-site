// Daily activity: per-device answers, aggregated for the home page goal ring and streak,
// plus the last lesson visited for the "continue" button.
export const ACTIVITY_KEY = 'gw-daily-activity-v1';
export const DEVICE_ID_KEY = 'gw-device-id-v1';
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

const isMap = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

export function readActivity(store = storage()) {
  try {
    const parsed = JSON.parse(store?.getItem(ACTIVITY_KEY) || '{}');
    return isMap(parsed) ? parsed : {};
  } catch { return {}; }
}

export function getDeviceId(store = storage()) {
  const existing = store?.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  // Do not upload under a transient id if persistence is blocked.
  if (!store) throw new Error('Activity device storage unavailable');
  store.setItem(DEVICE_ID_KEY, id);
  return id;
}

// Both operands have cloud shape. Max per device/day makes repeated merges safe.
export function mergeActivityValues(a, b, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS + 1);
  const first = dayKey(cutoff);
  // Another device may sit in a time zone ahead of this one; keep its "tomorrow".
  const ahead = new Date(now);
  ahead.setDate(ahead.getDate() + 2);
  const last = dayKey(ahead);
  const devices = new Map();
  for (const value of [a, b]) {
    if (!isMap(value?.devices)) continue;
    for (const [id, days] of Object.entries(value.devices)) {
      if (!isMap(days)) continue;
      const merged = devices.get(id) || new Map();
      for (const [day, entry] of Object.entries(days)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < first || day > last ||
            dayKey(new Date(day + 'T12:00:00')) !== day || !isMap(entry)) continue;
        const answered = count(entry.answered);
        const correct = count(entry.correct);
        if (!answered && !correct) continue;
        const previous = merged.get(day) || {};
        merged.set(day, { answered: Math.max(previous.answered || 0, answered), correct: Math.max(previous.correct || 0, correct) });
      }
      if (merged.size) devices.set(id, merged);
    }
  }
  return { devices: Object.fromEntries([...devices].map(([id, days]) => [id, Object.fromEntries(days)])) };
}

export function activityToCloud(local, deviceId, now = new Date()) {
  return mergeActivityValues(
    { devices: isMap(local?.others) ? local.others : {} },
    { devices: { [deviceId]: local?.days } }, now
  );
}

export function activityToLocal(cloud, deviceId, now = new Date()) {
  const { devices } = mergeActivityValues(cloud, null, now);
  return { days: devices[deviceId] || {}, others: Object.fromEntries(Object.entries(devices).filter(([id]) => id !== deviceId)) };
}

export function recordAnswer(correct, now = new Date(), store = storage()) {
  if (!store) return;
  const local = readActivity(store);
  const days = isMap(local.days) ? local.days : {};
  const key = dayKey(now);
  const today = days[key] || { answered: 0, correct: 0 };
  days[key] = { answered: count(today.answered) + 1, correct: count(today.correct) + (correct ? 1 : 0) };
  const recent = Object.keys(days).sort().slice(-KEEP_DAYS);
  const trimmed = Object.fromEntries(recent.map((k) => [k, days[k]]));
  try {
    store.setItem(ACTIVITY_KEY, JSON.stringify({ ...local, days: trimmed }));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('learning-progress-updated', { detail: { key: ACTIVITY_KEY } }));
  } catch {
    // Storage full or blocked: activity is a nice-to-have.
  }
}

// A streak counts consecutive active days ending today, or yesterday if today has no answers yet.
export function getActivity(now = new Date(), store = storage()) {
  const local = readActivity(store);
  const days = Object.create(null);
  for (const source of [local.days, ...Object.values(isMap(local.others) ? local.others : {})]) {
    if (!isMap(source)) continue;
    for (const [day, entry] of Object.entries(source)) {
      if (!isMap(entry)) continue;
      const previous = days[day] || { answered: 0, correct: 0 };
      Object.defineProperty(days, day, { value: { answered: previous.answered + count(entry.answered), correct: previous.correct + count(entry.correct) }, enumerable: true, configurable: true });
    }
  }
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
