// Merge every word bank in public/vocab into one master lexicon (draft).
// Each lemma gets one stable id; banks become lists that point at those ids.
// Usage: node --experimental-strip-types tools/lexicon/build-lexicon.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { normalizeVocabulary } from '../../src/lib/vocabulary.mjs';

const ROOT = new URL('../../', import.meta.url);
const OUT_DIR = new URL('src/data/lexicon/', ROOT);
const REPORT = new URL('tools/lexicon/merge-report.md', ROOT);

// Earlier banks win when fields disagree: curated Schritte data first, then notes, then older flat lists.
const BANK_PRIORITY = [
  'schritte-b1-1-complete',
  'schritte-b1-1-enhanced',
  'schritte-b1-1-supplement',
  'schritte-b1-1-hidden-advanced',
  'course-notes',
  'schritte-b1-1',
  'schritte-b1-1-nouns',
  'a1-b1-part1'
];

const nfc = s => String(s || '').trim().normalize('NFC');
// German capitalisation separates nouns from other words (das Essen / essen), so keys stay case-sensitive.
const lemmaKey = w => `${w.article || ''}|${nfc(w.word)}`;
const slug = s => nfc(s).toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';

function kindOf(w) {
  const text = nfc(w.word);
  if (w.pos === 'phrase' || /\s/.test(text)) return 'phrase';
  return 'word';
}

function levelOf(w) {
  const m = String(w.level || '').match(/\b(A1|A2|B1|B2|C1)\b/);
  return m ? m[1] : null;
}

const entries = new Map();
const lists = [];

for (const bank of BANK_PRIORITY) {
  const raw = JSON.parse(readFileSync(new URL(`public/vocab/${bank}.json`, ROOT), 'utf8'));
  const words = normalizeVocabulary(raw);
  const list = { id: bank, label: raw.meta?.name || bank, groups: new Map() };
  for (const w of words) {
    const key = lemmaKey(w);
    let e = entries.get(key);
    if (!e) {
      e = {
        key,
        article: w.article || '',
        word: nfc(w.word),
        pos: w.pos,
        kind: kindOf(w),
        plural: w.plural || '',
        meanings: [],
        examples: [],
        sourceLevel: null,
        practice: w.practice || null,
        sources: []
      };
      entries.set(key, e);
    }
    if (!e.plural && w.plural) e.plural = w.plural;
    if ((!e.pos || e.pos === 'other') && w.pos && w.pos !== 'other') e.pos = w.pos;
    if (!e.practice && w.practice) e.practice = w.practice;
    if (!e.sourceLevel && levelOf(w)) e.sourceLevel = levelOf(w);
    if (w.meaning && !e.meanings.includes(w.meaning)) e.meanings.push(w.meaning);
    if (w.example && !e.examples.some(x => x.de === nfc(w.example))) e.examples.push({ de: nfc(w.example), zh: w.exampleZh || '' });
    e.sources.push({ bank, id: w.id || null, group: w.category || null });
    const group = w.category || '全部';
    if (!list.groups.has(group)) list.groups.set(group, []);
    if (!list.groups.get(group).includes(key)) list.groups.get(group).push(key);
  }
  lists.push(list);
}

// Stable, readable ids: article + word slug, suffixed only on true collisions.
const used = new Map();
for (const e of entries.values()) {
  const base = slug(`${e.article} ${e.word}`);
  const n = (used.get(base) || 0) + 1;
  used.set(base, n);
  e.id = n === 1 ? base : `${base}-${n}`;
}

const keyToId = new Map([...entries.values()].map(e => [e.key, e.id]));
const outEntries = [...entries.values()]
  .sort((a, b) => a.word.localeCompare(b.word, 'de') || a.article.localeCompare(b.article))
  .map(({ key, ...e }) => e);
const outLists = lists.map(l => ({
  id: l.id,
  label: l.label,
  groups: [...l.groups].map(([label, keys]) => ({ label, ids: keys.map(k => keyToId.get(k)) }))
}));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(new URL('lexicon.draft.json', OUT_DIR), JSON.stringify({ meta: { builtAt: new Date().toISOString().slice(0, 10), count: outEntries.length }, entries: outEntries }, null, 1));
writeFileSync(new URL('lists.json', OUT_DIR), JSON.stringify(outLists, null, 1));

// ---- report ----
const byWord = new Map();
for (const e of outEntries) {
  const k = e.word;
  if (!byWord.has(k)) byWord.set(k, []);
  byWord.get(k).push(e);
}
const articleConflicts = [...byWord.values()].filter(g => g.length > 1 && g.every(e => e.article) && new Set(g.map(e => e.article)).size > 1);
const multiMeaning = outEntries.filter(e => e.meanings.length > 2);
const kinds = outEntries.reduce((m, e) => (m[e.kind] = (m[e.kind] || 0) + 1, m), {});
const levels = outEntries.reduce((m, e) => (m[e.sourceLevel || '未標'] = (m[e.sourceLevel || '未標'] || 0) + 1, m), {});
const multiSource = outEntries.filter(e => new Set(e.sources.map(s => s.bank)).size > 1).length;

const lines = [
  '# 主字庫合併報告（草稿）',
  '',
  `- 合併後詞條：${outEntries.length}`,
  `- 類型：${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join('、')}`,
  `- 來源已有程度：${Object.entries(levels).map(([k, v]) => `${k} ${v}`).join('、')}`,
  `- 出現在兩個以上字庫：${multiSource}`,
  '',
  '## 各字庫',
  '',
  ...outLists.map(l => `- ${l.id}：${l.groups.reduce((n, g) => n + g.ids.length, 0)} 筆，${l.groups.length} 組`),
  '',
  `## 同一個字、不同冠詞（${articleConflicts.length}）`,
  '',
  '有些是真的同形異義（der/das Band），有些是字庫之間不一致，需要人工確認。',
  '',
  ...articleConflicts.map(g => `- ${g.map(e => `${e.article} ${e.word}（${e.meanings[0] || ''}；${e.sources.map(s => s.bank).join(', ')}）`).join(' ／ ')}`),
  '',
  `## 釋義超過兩種寫法（${multiMeaning.length}，分級時一併整理）`,
  '',
  ...multiMeaning.slice(0, 40).map(e => `- ${e.article ? e.article + ' ' : ''}${e.word}：${e.meanings.join(' ｜ ')}`),
  multiMeaning.length > 40 ? `- …另外 ${multiMeaning.length - 40} 筆` : ''
];
writeFileSync(REPORT, lines.join('\n') + '\n');
console.log(`lexicon: ${outEntries.length} entries, ${outLists.length} lists → src/data/lexicon/`);
console.log(`report: tools/lexicon/merge-report.md (${articleConflicts.length} article conflicts, ${multiMeaning.length} multi-meaning)`);
