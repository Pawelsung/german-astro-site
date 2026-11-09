// Build the graded lexicon: merged banks + grading tags + corrections + new-word drafts.
// Also reports coverage and the flags that still need a decision.
// Usage: node tools/lexicon/apply-tags.mjs
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = new URL('./', import.meta.url);
const DATA = new URL('../../src/data/lexicon/', import.meta.url);
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const readJson = url => JSON.parse(readFileSync(url, 'utf8'));

// Rough size of each level's new vocabulary, from the commonly cited cumulative totals
// (A1 ≈ 650, A2 ≈ 1300, B1 ≈ 2400 words). Planning estimates, not an official count of this bank.
const TARGET_NEW_WORDS = { A1: 650, A2: 650, B1: 1100 };

// The Schritte B1.1 Lernwortschatz is B1 by definition, so a grader's B2/C1 on those words is capped.
const OFFICIAL_B1_BANK = 'schritte-b1-1-enhanced';

// Flags that only describe the word; nothing needs deciding.
const INFORMATIONAL = /可分動詞|複數|專有名詞|品牌|罵|貶|口語|過時|縮寫|罕見|形容詞變化名詞|外來|地域|奧地利|常搭配/;
const NEVER_PUSH = /專有名詞|品牌|罵|貶/;

const slug = s => String(s).trim().normalize('NFC').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';

const tags = new Map();
for (const file of readdirSync(new URL('tags/', DIR)).filter(f => f.endsWith('.tsv')).sort()) {
  const rows = readFileSync(new URL(`tags/${file}`, DIR), 'utf8').split('\n').filter(Boolean).slice(1);
  for (const row of rows) {
    const [id, level, topic, kind, push, flag = ''] = row.split('\t');
    tags.set(id, { level, topic, kind, push: push === 'y', flag });
  }
}

const { entries } = readJson(new URL('lexicon.draft.json', DATA));
const untagged = entries.filter(e => !tags.has(e.id));
if (untagged.length) throw new Error(`尚未分級：${untagged.slice(0, 5).map(e => e.id).join(', ')} 等 ${untagged.length} 筆`);

let capped = 0;
const byId = new Map(entries.map(e => {
  const t = tags.get(e.id);
  const official = e.sources.some(s => s.bank === OFFICIAL_B1_BANK);
  const level = official && (t.level === 'B2' || t.level === 'C1') ? 'B1' : t.level;
  if (level !== t.level) capped++;
  return [e.id, { ...e, level, topic: t.topic, kind: t.kind, push: t.push && !NEVER_PUSH.test(t.flag), flag: t.flag }];
}));

// New words written for the A1–B1 gaps. Case-only pairs (sie/Sie) share a slug, so later ones get a suffix.
let added = 0;
for (const file of readdirSync(new URL('drafts/', DIR)).filter(f => f.endsWith('.json')).sort()) {
  for (const w of readJson(new URL(`drafts/${file}`, DIR))) {
    const base = slug(`${w.article || ''} ${w.word}`);
    let id = base;
    for (let n = 2; byId.has(id); n++) id = `${base}-${n}`;
    byId.set(id, {
      id, article: w.article || '', word: w.word, pos: w.pos,
      kind: w.pos === 'phrase' ? 'phrase' : 'word',
      plural: w.plural || '', verb: w.verb || null, noArticle: !!w.noArticle,
      meanings: [w.meaning], examples: [{ de: w.exampleDe, zh: w.exampleZh }],
      sourceLevel: null, practice: null, sources: [{ bank: `new-${file.replace('.json', '')}`, id: null, group: null }],
      level: w.level, topic: w.topic, push: true, flag: ''
    });
    added++;
  }
}

const fix = readJson(new URL('corrections.json', DIR));
const touched = new Set([...(fix.resolved || [])]);
const need = id => {
  const e = byId.get(id);
  if (!e) throw new Error(`corrections.json 找不到 ${id}`);
  touched.add(id);
  return e;
};
for (const [id, text] of Object.entries(fix.meaning)) need(id).meanings = [text];
for (const [id, ex] of Object.entries(fix.example)) need(id).examples = [ex];
for (const [id, pos] of Object.entries(fix.pos)) need(id).pos = pos;
for (const [id, kind] of Object.entries(fix.kind)) need(id).kind = kind;
for (const [id, level] of Object.entries(fix.level)) need(id).level = level;
for (const id of fix.noPush) need(id).push = false;

const lemma = e => `${e.article ? e.article + ' ' : ''}${e.word}`;
const redirects = new Map();
for (const [id, change] of Object.entries(fix.rename)) {
  const e = need(id);
  byId.delete(id);
  e.variants = [...(e.variants || []), lemma(e)];
  Object.assign(e, change);
  byId.set(e.id, e);
  touched.add(e.id);
  redirects.set(id, e.id);
}

for (const [from, to] of Object.entries(fix.merge)) {
  const source = need(from);
  const target = need(to);
  target.variants = [...(target.variants || []), lemma(source)];
  target.sources.push(...source.sources);
  for (const ex of source.examples) if (!target.examples.some(x => x.de === ex.de)) target.examples.push(ex);
  byId.delete(from);
  redirects.set(from, to);
}

const graded = [...byId.values()].sort((a, b) => a.word.localeCompare(b.word, 'de') || a.article.localeCompare(b.article));
for (const e of graded) if (touched.has(e.id) || INFORMATIONAL.test(e.flag)) e.flag = '';

// Review records are keyed by id, so an id may never disappear without a redirect.
const LOCK = new URL('ids.lock', DATA);
const locked = existsSync(LOCK) ? readFileSync(LOCK, 'utf8').split('\n').filter(Boolean) : [];
const lost = locked.filter(id => !byId.has(id) && !redirects.has(id));
if (lost.length) throw new Error(`這些 id 消失了且沒有 redirect：${lost.slice(0, 10).join(', ')}（共 ${lost.length} 筆）`);
writeFileSync(LOCK, [...new Set([...locked, ...byId.keys()])].sort().join('\n') + '\n');
writeFileSync(new URL('redirects.json', DATA), JSON.stringify(Object.fromEntries([...redirects].sort()), null, 1));

writeFileSync(new URL('lexicon.graded.json', DATA), JSON.stringify({ meta: { count: graded.length, status: 'graded-ai-only' }, entries: graded }, null, 1));

const lists = readJson(new URL('lists.json', DATA)).map(list => ({
  ...list,
  groups: list.groups.map(g => ({ ...g, ids: [...new Set(g.ids.map(id => redirects.get(id) || id))] }))
}));
writeFileSync(new URL('lists.graded.json', DATA), JSON.stringify(lists, null, 1));

const tally = rows => Object.fromEntries(LEVELS.map(l => [l, rows.filter(e => e.level === l).length]));
const words = tally(graded.filter(e => e.kind === 'word'));
const phrases = tally(graded.filter(e => e.kind === 'phrase'));
const pushable = tally(graded.filter(e => e.push));
const flagged = graded.filter(e => e.flag);

const coverage = [
  '# 主字庫涵蓋率報告',
  '',
  `共 ${graded.length} 筆（新增 ${added} 筆、合併 ${Object.keys(fix.merge).length} 筆）；Schritte B1.1 官方字表中被標為 B2 以上、校正回 B1 的有 ${capped} 筆。`,
  '',
  '| 程度 | 單字 | 片語 | 可推送 | 目標新字數（估計） | 缺口（估計） |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...LEVELS.map(l => {
    const target = TARGET_NEW_WORDS[l];
    return `| ${l} | ${words[l]} | ${phrases[l]} | ${pushable[l]} | ${target ?? '—'} | ${target ? Math.max(0, target - words[l]) : '—'} |`;
  }),
  '',
  '目標新字數取自常見的累積字數（A1 約 650、A2 約 1300、B1 約 2400），只是規劃用的估計。'
];
writeFileSync(new URL('coverage-report.md', DIR), coverage.join('\n') + '\n');

const flagLines = ['# 待處理標註', '', `共 ${flagged.length} 筆。`, '', '| id | 詞條 | 程度 | 標註 |', '| --- | --- | --- | --- |',
  ...flagged.map(e => `| ${e.id} | ${lemma(e)} | ${e.level} | ${e.flag.replace(/\|/g, '／')} |`)];
writeFileSync(new URL('flags.md', DIR), flagLines.join('\n') + '\n');

console.log(`total ${graded.length}, added ${added}, merged ${Object.keys(fix.merge).length}, capped ${capped}, open flags ${flagged.length}`);
console.log('words', words, 'phrases', phrases, 'push', pushable);
