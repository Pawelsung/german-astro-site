import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../tools/lexicon/examples/', import.meta.url);
const read = url => JSON.parse(readFileSync(url, 'utf8'));
const entries = new Map(read(new URL('../src/data/lexicon/lexicon.graded.json', import.meta.url)).entries.map(e => [e.id, e]));
const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss');
const tokens = text => normalize(text).match(/[a-z0-9]+/g) || [];
// A deliberately loose lexical check, not a grammatical review. Verb forms supply
// irregular stems; separable verbs may match their root away from their prefix.
function containsLemma(entry, sentence) {
  const words = tokens(sentence);
  const lemma = tokens(entry.word).filter(w => !['sich', 'der', 'die', 'das', 'ein', 'eine', 'zu'].includes(w));
  const candidates = lemma.map(w => entry.pos === 'verb' ? w.replace(/(?:en|n)$/, '') : w.replace(/e$/, ''));
  if (entry.pos === 'verb') {
    for (const form of Object.values(entry.verb || {})) {
      if (typeof form === 'string') candidates.push(...tokens(form).filter(w => !['hat', 'ist', 'sich', 'er', 'sie', 'es'].includes(w)).map(w => w.replace(/(?:en|et|t)$/, '')));
    }
    for (const root of [...candidates]) {
      const split = root.match(/^(?:zuruck|zusammen|weiter|wieder|hinein|heraus|vorbei|auf|aus|ein|mit|nach|vor|weg|zu|ab|an|um|los)(.{3,})$/);
      if (split) candidates.push(split[1]);
    }
  }
  return candidates.some(root => root.length >= 2 && words.some(w => w.startsWith(root)));
}

test('補充例句的 id、內容、標點與詞條用字有效', () => {
  const seen = new Set();
  const missing = [];
  for (const file of readdirSync(dir, { withFileTypes: true }).filter(f => f.isFile() && f.name.endsWith('.json'))) {
    for (const [id, ex] of Object.entries(read(new URL(file.name, dir)))) {
      assert.ok(entries.has(id), `${file.name}: 找不到 ${id}`);
      assert.ok(!seen.has(id), `重複 id: ${id}`);
      seen.add(id);
      for (const field of ['de', 'zh']) assert.ok(typeof ex[field] === 'string' && ex[field].trim(), `${id}: ${field} 為空`);
      assert.doesNotMatch(ex.de, /Im Unterricht lernen wir heute|Im Kurs sprechen wir heute|Das ist ein|Das Wort/i, `${id}: 樣板句`);
      assert.match(ex.de, /[.!?][“”»"’‘]*$/, `${id}: 缺句尾標點`);
      if (!containsLemma(entries.get(id), ex.de)) missing.push(id);
      assert.deepEqual(entries.get(id).examples, [ex], `${id}: 主字庫尚未套用例句`);
    }
  }
  assert.deepEqual(missing, [], `例句找不到詞根：${missing.join(', ')}`);
});

test('詞根檢查容許變格、變位與可分動詞，仍會拒絕無關句子', () => {
  const cases = [
    [{ word: 'Kind', pos: 'noun' }, 'Sie hilft den Kindern.'],
    [{ word: 'Mund', pos: 'noun' }, 'Die Münder sind offen.'],
    [{ word: 'arbeiten', pos: 'verb' }, 'Sie arbeitet heute.'],
    [{ word: 'schreiben', pos: 'verb', verb: { praeteritum: 'schrieb' } }, 'Sie schrieb einen Brief.'],
    [{ word: 'aufstehen', pos: 'verb' }, 'Wir stehen früh auf.'],
    [{ word: 'sich anziehen', pos: 'verb' }, 'Sie zieht sich warm an.'],
  ];
  for (const [entry, sentence] of cases) {
    assert.ok(containsLemma(entry, sentence), `${entry.word}: ${sentence}`);
    assert.ok(!containsLemma(entry, 'Heute regnet es.'), entry.word);
  }
});
