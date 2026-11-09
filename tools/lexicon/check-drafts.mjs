// Validate new-word drafts in tools/lexicon/drafts against the required shape and the existing lexicon.
// Usage: node tools/lexicon/check-drafts.mjs [file.json ...]
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('./', import.meta.url);
const LEXICON = new URL('../../src/data/lexicon/lexicon.draft.json', import.meta.url);
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);
const TOPICS = new Set(['daily', 'food', 'shop', 'home', 'travel', 'city', 'nature', 'time', 'grammar', 'work', 'school', 'health', 'people', 'feel', 'leisure', 'media', 'society', 'general']);
const POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'connector', 'conjunction', 'preposition', 'pronoun', 'determiner', 'particle', 'numeral', 'phrase']);
const ARTICLES = new Set(['der', 'die', 'das']);

const nfc = s => String(s || '').trim().normalize('NFC');
const lemma = w => `${w.article || ''}|${nfc(w.word).replace(/^sich\s+/, '')}`;

const existing = new Set(JSON.parse(readFileSync(LEXICON, 'utf8')).entries.map(lemma));
const wanted = process.argv.slice(2);
const files = readdirSync(new URL('drafts/', DIR)).filter(f => f.endsWith('.json') && (!wanted.length || wanted.includes(f))).sort();

// Duplicates are checked across every draft, even when validating one file.
const seen = new Map();
for (const file of readdirSync(new URL('drafts/', DIR)).filter(f => f.endsWith('.json')).sort()) {
  for (const w of JSON.parse(readFileSync(new URL(`drafts/${file}`, DIR), 'utf8'))) {
    if (!seen.has(lemma(w))) seen.set(lemma(w), []);
    seen.get(lemma(w)).push(file);
  }
}

let errors = 0;
for (const file of files) {
  const words = JSON.parse(readFileSync(new URL(`drafts/${file}`, DIR), 'utf8'));
  const problems = [];
  const counts = {};
  for (const w of words) {
    const name = nfc(w.word) || '(空白)';
    const bad = msg => problems.push(`${name}: ${msg}`);
    counts[w.level] = (counts[w.level] || 0) + 1;
    if (!LEVELS.has(w.level)) bad(`level ${w.level}`);
    if (!TOPICS.has(w.topic)) bad(`topic ${w.topic}`);
    if (!POS.has(w.pos)) bad(`pos ${w.pos}`);
    for (const field of ['word', 'meaning', 'exampleDe', 'exampleZh']) if (!nfc(w[field])) bad(`缺 ${field}`);
    if (/[A-Za-zÄÖÜäöüß]{3,}/.test(w.meaning || '')) bad('meaning 含外文，可能洩漏答案');
    if (/複數|校訂|應校正/.test(w.meaning || '')) bad('meaning 含註記');
    if (w.pos === 'noun') {
      if (!ARTICLES.has(w.article) && !w.noArticle) bad('名詞缺冠詞（無冠詞的名詞要設 noArticle: true）');
      if (!/^[A-ZÄÖÜ]/.test(nfc(w.word))) bad('名詞未大寫');
      if (ARTICLES.has(w.article) && !('plural' in w)) bad('名詞缺 plural（不可數請填空字串）');
    } else if (w.article) bad('非名詞不該有冠詞');
    if (w.pos === 'verb') {
      const v = w.verb || {};
      for (const f of ['praesens3', 'praeteritum', 'perfekt']) if (!nfc(v[f])) bad(`動詞缺 ${f}`);
      if (!['haben', 'sein', 'haben/sein'].includes(v.aux)) bad(`動詞 aux ${v.aux}`);
    }
    if (existing.has(lemma(w))) bad('主字庫已有');
    if (seen.get(lemma(w)).length > 1) bad(`草稿重複：${seen.get(lemma(w)).join('、')}`);
  }
  errors += problems.length;
  console.log(`${file}: ${words.length} 筆 ${JSON.stringify(counts)} ${problems.length ? `✗ ${problems.length} 個問題` : '✓'}`);
  problems.slice(0, 30).forEach(p => console.log(`  ${p}`));
}
process.exit(errors ? 1 : 0);
