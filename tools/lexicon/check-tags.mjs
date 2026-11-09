// Validate grading output in tools/lexicon/tags against the input batches and print a summary.
// Usage: node tools/lexicon/check-tags.mjs [batch-01 ...]
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DIR = new URL('./', import.meta.url);
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1']);
const TOPICS = new Set(['daily', 'food', 'shop', 'home', 'travel', 'city', 'nature', 'time', 'grammar', 'work', 'school', 'health', 'people', 'feel', 'leisure', 'media', 'society', 'general']);
const KINDS = new Set(['word', 'phrase', 'term', 'chunk']);

const readTsv = url => readFileSync(url, 'utf8').split('\n').filter(Boolean).slice(1).map(l => l.split('\t'));

const wanted = process.argv.slice(2);
const batches = readdirSync(new URL('batches/', DIR)).filter(f => f.endsWith('.tsv')).map(f => f.replace('.tsv', ''))
  .filter(b => !wanted.length || wanted.includes(b));

let errors = 0;
const count = (m, k) => (m[k] = (m[k] || 0) + 1, m);
const levels = {}, kinds = {}, topics = {};
let pushYes = 0, flagged = 0, done = 0;

for (const b of batches) {
  const tagUrl = new URL(`tags/${b}.tsv`, DIR);
  if (!existsSync(tagUrl)) { console.log(`${b}: 尚未分級`); continue; }
  const input = readTsv(new URL(`batches/${b}.tsv`, DIR)).map(r => r[0]);
  const rows = readTsv(tagUrl);
  const problems = [];
  if (rows.length !== input.length) problems.push(`行數 ${rows.length}，應為 ${input.length}`);
  rows.forEach((r, i) => {
    const [id, level, topic, kind, push] = r;
    if (id !== input[i]) problems.push(`第 ${i + 2} 行 id ${id} ≠ ${input[i]}`);
    if (!LEVELS.has(level)) problems.push(`${id}: level ${level}`);
    if (!TOPICS.has(topic)) problems.push(`${id}: topic ${topic}`);
    if (!KINDS.has(kind)) problems.push(`${id}: kind ${kind}`);
    if (!['y', 'n'].includes(push)) problems.push(`${id}: push ${push}`);
    if ((kind === 'term' || kind === 'chunk') && push === 'y') problems.push(`${id}: ${kind} 不可推送`);
    count(levels, level); count(kinds, kind); count(topics, topic);
    if (push === 'y') pushYes++;
    if (r[5]) flagged++;
    done++;
  });
  errors += problems.length;
  console.log(`${b}: ${problems.length ? '✗ ' + problems.slice(0, 10).join('；') : '✓'}`);
}

const fmt = m => Object.entries(m).sort().map(([k, v]) => `${k} ${v}`).join('、');
console.log(`\n已分級 ${done}｜程度：${fmt(levels)}\n類型：${fmt(kinds)}｜可推送 ${pushYes}｜有標註 ${flagged}\n主題：${fmt(topics)}`);
process.exit(errors ? 1 : 0);
