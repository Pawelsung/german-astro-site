export const PROGRESS_KEYS = {
  lesson1Words: 'deutschLernkartenDB_vPro',
  lesson1Stats: 'deutschLernkartenStats',
  lesson2: 'verb-preposition-trainer-v1',
  lesson3: 'irregular-verbs-trainer-v3',
  lesson4: 'kasus-quest-trainer-v1',
  lesson5: 'german-lesson5-connectors-progress',
  lesson6: 'german-lesson6-adjective-declension-progress'
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
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('learning-progress-updated', { detail: { key } }));
  } catch {
    window.dispatchEvent(new CustomEvent('learning-storage-error'));
  }
}

export function needsReview(item: any) {
  if (!item || typeof item !== 'object') return false;
  return Boolean(item.needsReview || item.isHard || (item.lastCorrect !== true && ((item.wrong || 0) > 0 || (item.wrongCount || 0) > 0)));
}

export function readProgressMap(key: string) {
  const value = readJSON(key, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

export function loadLesson6Progress() {
  return readProgressMap(PROGRESS_KEYS.lesson6);
}

export function saveLesson6Progress(progress: any) {
  writeJSON(PROGRESS_KEYS.lesson6, progress);
}

export function getReviewAction(summary: ReturnType<typeof getLearningSummary>) {
  const lessons = [
    [summary.lesson1ErrorCount, '/lesson1-wort/', '單字練習'],
    [summary.lesson2ReviewCount, '/lesson2-VerbWithPreposition/', '動詞與介系詞'],
    [summary.lesson3WrongCount, '/lesson3-irregular-verbs/', '不規則動詞'],
    [summary.lesson4WrongCount, '/lesson4-kasus/', '格位練習'],
    [summary.lesson5WrongCount, '/lesson5-connectors/', '連接詞與語序'],
    [summary.lesson6WrongCount, '/lesson6-adjective-declension/', '形容詞字尾']
  ] as const;
  const next = lessons.find(([count]) => count > 0);
  return next
    ? { href: `${next[1]}?review=1`, label: `複習${next[2]}（${next[0]} 題）` }
    : { href: '/lesson1-wort/', label: '開始學習練習' };
}

export function isReviewRequested() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('review') === '1';
}

export function isLesson2Due(item: any, now = Date.now()) {
  return typeof item?.nextReview === 'number' && item.nextReview <= now;
}

export function getLearningSummary() {
  const lesson1Words = readJSON(PROGRESS_KEYS.lesson1Words, []);
  const lesson2Progress = loadLesson2Progress();
  const lesson3Progress = readJSON(PROGRESS_KEYS.lesson3, {});
  const lesson4Progress = readJSON(PROGRESS_KEYS.lesson4, {});
  const lesson5Progress = readJSON(PROGRESS_KEYS.lesson5, {});
  const lesson6Progress = readJSON(PROGRESS_KEYS.lesson6, {});
  const lesson3Items = lesson3Progress ? Object.values(lesson3Progress) : [];
  const lesson4Items = lesson4Progress ? Object.values(lesson4Progress) : [];
  const lesson6Items = lesson6Progress ? Object.values(lesson6Progress) : [];
  const lesson5Answers = lesson5Progress?.answers || {};
  const lesson5Mistakes = Array.isArray(lesson5Progress?.mistakes) ? lesson5Progress.mistakes : [];
  const lesson5Bookmarks = Array.isArray(lesson5Progress?.bookmarks) ? lesson5Progress.bookmarks : [];

  const lesson1WordCount = Array.isArray(lesson1Words) ? lesson1Words.length : 0;
  const lesson1ErrorCount = Array.isArray(lesson1Words)
    ? lesson1Words.filter((word: any) => (word?.errors || 0) > 0).length
    : 0;
  const lesson3WrongCount = lesson3Items.filter(
    needsReview
  ).length;
  const lesson3StarredCount = lesson3Items.filter((item: any) => item?.starred).length;
  const lesson4WrongCount = lesson4Items.filter(
    needsReview
  ).length;
  const lesson4StarredCount = lesson4Items.filter((item: any) => item?.starred).length;
  const lesson5AnsweredCount = Object.keys(lesson5Answers).length;
  const lesson5CorrectCount = Object.values(lesson5Answers).filter((item: any) => item?.correct).length;
  const lesson5WrongCount = lesson5Mistakes.length;
  const lesson5StarredCount = lesson5Bookmarks.length;
  const lesson6AnsweredCount = lesson6Items.filter((item: any) => item?.answered).length;
  const lesson6WrongCount = lesson6Items.filter(needsReview).length;
  const lesson6StarredCount = lesson6Items.filter((item: any) => item?.starred).length;

  return {
    lesson1WordCount,
    lesson1ErrorCount,
    lesson1StarredCount: Array.isArray(lesson1Words) ? lesson1Words.filter((word: any) => word?.starred).length : 0,
    lesson2StarredCount: lesson2Progress.starred.length,
    lesson2ReviewCount: Object.values(lesson2Progress.srs || {}).filter((item) => isLesson2Due(item)).length,
    lesson3WrongCount,
    lesson3StarredCount,
    lesson4WrongCount,
    lesson4StarredCount,
    lesson5AnsweredCount,
    lesson5CorrectCount,
    lesson5WrongCount,
    lesson5StarredCount,
    lesson6AnsweredCount,
    lesson6WrongCount,
    lesson6StarredCount,
    totalSavedItems:
      lesson1WordCount +
      lesson2Progress.starred.length +
      Object.keys(lesson2Progress.srs || {}).length +
      lesson3WrongCount +
      lesson3StarredCount +
      lesson4WrongCount +
      lesson4StarredCount +
      lesson5WrongCount +
      lesson5StarredCount +
      lesson6WrongCount +
      lesson6StarredCount
  };
}

function mergeUnique(a: any[] = [], b: any[] = []) {
  return [...new Set([...a, ...b])];
}

function mergeObjects(local: any = {}, remote: any = {}) {
  const result = { ...remote, ...local };
  for (const key of Object.keys(remote || {})) {
    const a = local?.[key];
    const b = remote[key];
    const at = a?.updatedAt || a?.lastAnsweredAt || a?.answeredAt || '';
    const bt = b?.updatedAt || b?.lastAnsweredAt || b?.answeredAt || '';
    if (bt > at) result[key] = b;
  }
  return result;
}

function getWordKey(word: any) {
  return String(word?.id || `${word?.article || ''}:${word?.word || ''}:${word?.meaning || ''}`);
}

function mergeLesson1Words(localWords: any[] = [], remoteWords: any[] = []) {
  if (!Array.isArray(localWords) || localWords.length === 0) return remoteWords || [];
  if (!Array.isArray(remoteWords) || remoteWords.length === 0) return localWords;

  const merged = new Map<string, any>();

  remoteWords.forEach((word) => {
    merged.set(getWordKey(word), word);
  });

  localWords.forEach((word) => {
    const key = getWordKey(word);
    const remoteWord = merged.get(key);
    if (!remoteWord) {
      merged.set(key, word);
      return;
    }

    merged.set(key, {
      ...remoteWord,
      ...word,
      ...((word.updatedAt || remoteWord.updatedAt)
        ? ((word.updatedAt || '') >= (remoteWord.updatedAt || '') ? word : remoteWord)
        : { errors: Math.max(remoteWord.errors || 0, word.errors || 0), starred: Boolean(remoteWord.starred || word.starred) })
    });
  });

  return [...merged.values()];
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
    lesson6: readJSON(PROGRESS_KEYS.lesson6, {}),
    updatedAt: new Date().toISOString()
  };
}

export function mergeRemoteProgress(remoteProgress: any = {}) {
  const local = collectLocalProgress();
  const merged = {
    lesson1Words: mergeLesson1Words(local.lesson1Words, remoteProgress.lesson1Words),
    lesson1Stats: local.lesson1Stats || remoteProgress.lesson1Stats || null,
    lesson2: mergeLesson2(local.lesson2, remoteProgress.lesson2),
    lesson3: mergeObjects(local.lesson3, remoteProgress.lesson3),
    lesson4: mergeObjects(local.lesson4, remoteProgress.lesson4),
    lesson5: {
      answers: mergeObjects(local.lesson5?.answers, remoteProgress.lesson5?.answers),
      mistakes: Object.entries(mergeObjects(local.lesson5?.answers, remoteProgress.lesson5?.answers)).filter(([, value]: any) => !value.correct).map(([key]) => key),
      bookmarks: mergeUnique(local.lesson5?.bookmarks, remoteProgress.lesson5?.bookmarks)
    },
    lesson6: mergeObjects(local.lesson6, remoteProgress.lesson6),
    updatedAt: new Date().toISOString()
  };

  writeJSON(PROGRESS_KEYS.lesson1Words, merged.lesson1Words);
  if (merged.lesson1Stats) writeJSON(PROGRESS_KEYS.lesson1Stats, merged.lesson1Stats);
  writeJSON(PROGRESS_KEYS.lesson2, merged.lesson2);
  writeJSON(PROGRESS_KEYS.lesson3, merged.lesson3);
  writeJSON(PROGRESS_KEYS.lesson4, merged.lesson4);
  writeJSON(PROGRESS_KEYS.lesson5, merged.lesson5);
  writeJSON(PROGRESS_KEYS.lesson6, merged.lesson6);

  return merged;
}
