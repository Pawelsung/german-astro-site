import { findClozeTarget } from './vocabPractice.mjs';
export const POS_LABELS = { noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞', 'adverb/connector': '副詞／連接詞', connector: '連接詞', conjunction: '連接詞', preposition: '介系詞', phrase: '片語', other: '其他' };
export const wordKey = word => [word.article || '', word.word || '', word.meaning || word.translationZh || ''].map(s => String(s).trim().normalize('NFC')).join('|');
export function normalizeVocabulary(input) {
  let items = input;
  if (Array.isArray(input?.lessons)) items = input.lessons.flatMap(lesson => (lesson.vocabulary || []).map(w => ({ ...w, lesson: w.lesson || lesson.lesson, lessonTitle: w.lessonTitle || lesson.title, category: w.category || w.lessonTag || lesson.lessonTag, source: w.source || input.meta?.name })));
  else if (!Array.isArray(input)) items = input?.words || input?.vocabulary;
  if (!Array.isArray(items)) throw new Error('請匯入單字陣列或含 lessons 的 JSON 字庫。');
  const seen = new Set();
  return items.filter(w => w && typeof w === 'object').map(w => {
    const category = String(w.category || w.lessonTag || '未分類');
    const match = category.match(/Lektion\s*(\d+)\s*[｜|]?\s*(.*)/i);
    const article = String(w.article || '').trim().toLowerCase();
    return { ...w, article, word: String(w.word || '').trim(), meaning: String(w.meaning || w.translationZh || '').trim(), example: String(w.example || w.exampleDe || ''), exampleZh: String(w.exampleZh || w.exampleTranslationZh || ''), category, lesson: Number(w.lesson || match?.[1]) || null, lessonTitle: String(w.lessonTitle || match?.[2] || ''), pos: w.pos || (['der','die','das'].includes(article) ? 'noun' : 'other'), errors: Math.max(0, Number(w.errors) || 0), starred: !!w.starred };
  }).filter(w => {
    if (!w.word || !w.meaning || seen.has(wordKey(w))) return false;
    seen.add(wordKey(w)); return true;
  });
}
export function mergeVocabularyProgress(incoming, saved) {
  const byKey = new Map(saved.map(w => [wordKey(w), w]));
  const byId = new Map(saved.filter(w => w.id).map(w => [w.id, w]));
  return incoming.map(w => {
    const old = (w.id && byId.get(w.id)) || byKey.get(wordKey(w));
    if (!old) return w;
    const latest = (old.updatedAt || '') >= (w.updatedAt || '') ? old : w;
    return { ...w, errors: latest.errors || 0, starred: !!latest.starred, seen: latest.seen || 0, attempts: latest.attempts || 0, correct: latest.correct || 0, updatedAt: latest.updatedAt };
  });
}
export function chaptersFor(words) {
  const chapters = new Map();
  for (const w of words) {
    const key = w.lesson ? String(w.lesson) : w.category;
    if (!chapters.has(key)) chapters.set(key, { key, label: w.lesson ? `第 ${w.lesson} 課 · ${w.lessonTitle || w.category}` : w.category, count: 0 });
    chapters.get(key).count++;
  }
  return [...chapters.values()].sort((a,b) => a.key.localeCompare(b.key, 'zh-TW', { numeric: true }));
}
export function filterVocabulary(words, { chapter = 'all', filter = 'all', mode = 'learn', query = '' } = {}) {
  const q = query.trim().toLocaleLowerCase('de');
  return words.filter(w => (chapter === 'all' || String(w.lesson || w.category) === chapter) && (filter !== 'review' || w.errors > 0) && (filter !== 'starred' || w.starred) && (mode !== 'article' || ['der','die','das'].includes(w.article)) && (mode !== 'cloze' || findClozeTarget(w)) && (!q || `${w.article} ${w.word} ${w.meaning}`.toLocaleLowerCase('de').includes(q)));
}
export function articleExplanation(word) {
  if (word.article === 'die' && /(ung|heit|keit|schaft|tion|tät)$/.test(word.word)) return '這類字尾通常是陰性名詞，使用 die。請連同例句一起記憶。';
  if (word.article === 'das' && /(chen|lein)$/.test(word.word)) return '這個指小詞字尾使用中性冠詞 das。';
  return `把「${word.article} ${word.word}」當作一個單位記憶，不能只由中文意思推算性別。`;
}
