export const PROGRESS_KEYS = {
  lesson1Words: 'deutschLernkartenDB_vPro',
  lesson1Stats: 'deutschLernkartenStats',
  lesson2: 'verb-preposition-trainer-v1',
  lesson3: 'irregular-verbs-trainer-v3',
  lesson4: 'kasus-quest-trainer-v1',
  lesson5: 'german-lesson5-connectors-progress'
};

export const defaultLesson2Progress = {
  starred: [],
  srs: {},
  history: []
};

export function readJSON(key: string, fallback: any = null) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: any) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('learning-progress-updated'));
}

export function loadLesson2Progress() {
  const parsed = readJSON(PROGRESS_KEYS.lesson2, defaultLesson2Progress);
  return {
    starred: Array.isArray(parsed?.starred) ? parsed.starred : [],
    srs: parsed?.srs && typeof parsed.srs === 'object' ? parsed.srs : {},
    history: Array.isArray(parsed?.history) ? parsed.history : []
  };
}

export function saveLesson2Progress(progress: any) {
  writeJSON(PROGRESS_KEYS.lesson2, progress);
}

export function getLearningSummary() {
  const lesson1Words = readJSON(PROGRESS_KEYS.lesson1Words, []);
  const lesson2Progress = loadLesson2Progress();
  const lesson3Progress = readJSON(PROGRESS_KEYS.lesson3, {});
  const lesson4Progress = readJSON(PROGRESS_KEYS.lesson4, {});
  const lesson5Progress = readJSON(PROGRESS_KEYS.lesson5, {});
  const lesson3Items = lesson3Progress ? Object.values(lesson3Progress) : [];
  const lesson4Items = lesson4Progress ? Object.values(lesson4Progress) : [];
  const lesson5Answers = lesson5Progress?.answers || {};
  const lesson5Mistakes = Array.isArray(lesson5Progress?.mistakes) ? lesson5Progress.mistakes : [];
  const lesson5Bookmarks = Array.isArray(lesson5Progress?.bookmarks) ? lesson5Progress.bookmarks : [];

  const lesson1WordCount = Array.isArray(lesson1Words) ? lesson1Words.length : 0;
  const lesson1ErrorCount = Array.isArray(lesson1Words)
    ? lesson1Words.filter((word: any) => (word.errors || 0) > 0).length
    : 0;
  const lesson3WrongCount = lesson3Items.filter(
    (item: any) => item?.isHard || (item?.wrongCount || 0) > 0
  ).length;
  const lesson3StarredCount = lesson3Items.filter((item: any) => item?.starred).length;
  const lesson4WrongCount = lesson4Items.filter(
    (item: any) => item?.needsReview || (item?.wrong || 0) > 0
  ).length;
  const lesson4StarredCount = lesson4Items.filter((item: any) => item?.starred).length;
  const lesson5AnsweredCount = Object.keys(lesson5Answers).length;
  const lesson5CorrectCount = Object.values(lesson5Answers).filter((item: any) => item?.correct).length;
  const lesson5WrongCount = lesson5Mistakes.length;
  const lesson5StarredCount = lesson5Bookmarks.length;

  return {
    lesson1WordCount,
    lesson1ErrorCount,
    lesson2StarredCount: lesson2Progress.starred.length,
    lesson2ReviewCount: Object.keys(lesson2Progress.srs || {}).length,
    lesson3WrongCount,
    lesson3StarredCount,
    lesson4WrongCount,
    lesson4StarredCount,
    lesson5AnsweredCount,
    lesson5CorrectCount,
    lesson5WrongCount,
    lesson5StarredCount,
    totalSavedItems:
      lesson1WordCount +
      lesson2Progress.starred.length +
      Object.keys(lesson2Progress.srs || {}).length +
      lesson3WrongCount +
      lesson3StarredCount +
      lesson4WrongCount +
      lesson4StarredCount +
      lesson5WrongCount +
      lesson5StarredCount
  };
}

function mergeUnique(a: any[] = [], b: any[] = []) {
  return [...new Set([...a, ...b])];
}

function mergeObjects(local: any = {}, remote: any = {}) {
  return { ...remote, ...local };
}

function mergeLesson2(local: any = defaultLesson2Progress, remote: any = defaultLesson2Progress) {
  return {
    starred: mergeUnique(local.starred, remote.starred),
    srs: mergeObjects(local.srs, remote.srs),
    history: [...(remote.history || []), ...(local.history || [])].slice(-250)
  };
}

export function collectLocalProgress() {
  return {
    lesson1Words: readJSON(PROGRESS_KEYS.lesson1Words, []),
    lesson1Stats: readJSON(PROGRESS_KEYS.lesson1Stats, null),
    lesson2: loadLesson2Progress(),
    lesson3: readJSON(PROGRESS_KEYS.lesson3, {}),
    lesson4: readJSON(PROGRESS_KEYS.lesson4, {}),
    lesson5: readJSON(PROGRESS_KEYS.lesson5, {}),
    updatedAt: new Date().toISOString()
  };
}

export function mergeRemoteProgress(remoteProgress: any = {}) {
  const local = collectLocalProgress();
  const merged = {
    lesson1Words:
      Array.isArray(local.lesson1Words) && local.lesson1Words.length > 0
        ? local.lesson1Words
        : remoteProgress.lesson1Words || [],
    lesson1Stats: local.lesson1Stats || remoteProgress.lesson1Stats || null,
    lesson2: mergeLesson2(local.lesson2, remoteProgress.lesson2),
    lesson3: mergeObjects(local.lesson3, remoteProgress.lesson3),
    lesson4: mergeObjects(local.lesson4, remoteProgress.lesson4),
    lesson5: mergeObjects(local.lesson5, remoteProgress.lesson5),
    updatedAt: new Date().toISOString()
  };

  writeJSON(PROGRESS_KEYS.lesson1Words, merged.lesson1Words);
  if (merged.lesson1Stats) writeJSON(PROGRESS_KEYS.lesson1Stats, merged.lesson1Stats);
  writeJSON(PROGRESS_KEYS.lesson2, merged.lesson2);
  writeJSON(PROGRESS_KEYS.lesson3, merged.lesson3);
  writeJSON(PROGRESS_KEYS.lesson4, merged.lesson4);
  writeJSON(PROGRESS_KEYS.lesson5, merged.lesson5);

  return merged;
}
