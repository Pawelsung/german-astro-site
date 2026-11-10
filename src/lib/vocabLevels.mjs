// Turns the graded lexicon into word banks lesson 1 can practise, split into small groups.
export const LEVEL_BANKS = ['A1', 'A2', 'B1', 'B2'];
const MAX_GROUP = 40;
const TOPICS = [
  ['people', '人物與家庭'], ['home', '居家'], ['daily', '日常生活'], ['food', '飲食'], ['shop', '購物'],
  ['health', '身體與健康'], ['school', '學校與學習'], ['work', '工作'], ['travel', '交通與旅行'], ['city', '城市與地點'],
  ['nature', '自然與天氣'], ['time', '時間與數量'], ['leisure', '休閒'], ['media', '媒體與科技'], ['feel', '情緒與態度'],
  ['society', '社會與文化'], ['grammar', '功能詞與文法'], ['general', '一般用語']
];
// Too few words per topic to be worth choosing between.
const SINGLE_GROUP_LEVELS = new Set(['B2']);
const LEARNED_BOX = 4;

const practisable = (row, level) => row[6] && row[3] === level;

function toWord(row, detail, category, groupOrder) {
  const [id, article, word, level, , pos] = row;
  const [plural, meaning, example, exampleZh, verb] = detail;
  const practice = verb ? { practice: { praeteritum_3sg: verb[1], perfekt_3sg: verb[2] } } : {};
  return { id, article, word, plural, meaning, example, exampleZh, pos, level, category, groupOrder, ...practice };
}

export function levelWords(rows, details, level) {
  const picked = rows.filter(row => practisable(row, level) && details[row[0]])
    .sort((a, b) => a[2].localeCompare(b[2], 'de') || (a[0] < b[0] ? -1 : 1));
  if (SINGLE_GROUP_LEVELS.has(level)) return picked.map(row => toWord(row, details[row[0]], level, 0));

  const words = [];
  let groupOrder = 0;
  for (const [topic, label] of TOPICS) {
    const group = picked.filter(row => row[4] === topic);
    const parts = Math.ceil(group.length / MAX_GROUP);
    for (let part = 0; part < parts; part++) {
      const name = parts > 1 ? `${label} ${part + 1}` : label;
      const slice = group.slice(Math.floor((part * group.length) / parts), Math.floor(((part + 1) * group.length) / parts));
      words.push(...slice.map(row => toWord(row, details[row[0]], name, groupOrder)));
      groupOrder++;
    }
  }
  return words;
}

export function levelPresets(rows, review) {
  return LEVEL_BANKS.map(level => {
    const ids = rows.filter(row => practisable(row, level)).map(row => row[0]);
    return {
      id: `level-${level}`, level, label: `${level} 分級字庫`, count: ids.length,
      learned: ids.filter(id => (review.words[id]?.b || 0) >= LEARNED_BOX).length
    };
  });
}

// Banks can word a meaning differently, so progress is matched on the lexicon id. Newest last, so it wins.
export function alignSavedWords(saved, resolve) {
  return [...saved]
    .sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''))
    .map(word => { const id = resolve(word); return id ? { ...word, id } : word; });
}
