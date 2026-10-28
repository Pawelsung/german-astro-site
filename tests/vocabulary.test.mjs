import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { POS_LABELS, normalizeVocabulary, chaptersFor, filterVocabulary, mergeVocabularyProgress } from '../src/lib/vocabulary.mjs';
const read = path => JSON.parse(readFileSync(new URL('../public' + path, import.meta.url)));
const complete = normalizeVocabulary(read('/vocab/schritte-b1-1-complete.json'));

test('every bundled vocabulary loads and matches advertised unique count', () => {
  for (const preset of read('/vocab/index.json')) {
    const words = normalizeVocabulary(read(preset.path));
    assert.equal(words.length, preset.count, preset.id);
    if (preset.id.startsWith('schritte')) assert.equal(chaptersFor(words).length, 7, preset.id);
  }
});
test('class-notes vocabulary keeps frequency groups in order and every entry is usable', () => {
  const notes = normalizeVocabulary(read('/vocab/personal-notes.json'));
  assert.deepEqual(chaptersFor(notes).map(c => c.label.split(' ')[0]), ['★★★', '★★', '★', '初次收錄（1']);
  assert.deepEqual(chaptersFor(complete).map(c => c.key), ['1', '2', '3', '4', '5', '6', '7']);
  for (const w of notes) {
    assert.ok(POS_LABELS[w.pos], `${w.word}: unlabeled pos ${w.pos}`);
    assert.doesNotMatch(w.meaning, /原文|原筆記|複數 /, w.word);
    if (w.pos === 'noun' && w.article) assert.match(w.article, /^(der|die|das)$/, w.word);
    if (w.plural) assert.match(w.plural, /^die /, w.word);
    if (w.example) assert.doesNotMatch(w.example, /Im Kurs sprechen wir heute über|das Wort „/, w.word);
  }
});
test('B1 chapter 3 contains exactly its own 79 words; article mode excludes non-nouns', () => {
  const third = filterVocabulary(complete, {chapter:'3'});
  assert.equal(third.length,79);
  assert.ok(third.every(w => w.lesson === 3));
  assert.equal(filterVocabulary(complete,{chapter:'3',mode:'article'}).length,38);
});
test('chapter, query, and review filters compose', () => {
  const words = [{word:'Magen',meaning:'胃',article:'der',lesson:3,errors:1}, {word:'Magen',meaning:'胃',article:'der',lesson:1,errors:2}];
  assert.equal(filterVocabulary(words,{chapter:'3',filter:'review',query:'胃'}).length,1);
  assert.equal(filterVocabulary(words,{filter:'starred'}).length,0);
});
test('legacy chapter labels are upgraded without inventing CEFR levels', () => {
  const [w] = normalizeVocabulary([{word:'Magen',meaning:'胃',article:'der',category:'Lektion 3｜Gesund bleiben',errors:1,starred:true}]);
  assert.equal(w.lesson,3); assert.equal(w.pos,'noun'); assert.equal(w.level,undefined);
  assert.equal(w.errors,1); assert.equal(w.starred,true);
});
test('switching datasets preserves mistakes, bookmarks, and cleared states', () => {
  const word = complete[0];
  const saved = [{...word, errors:0,starred:false, attempts:3,updatedAt:'2026-10-14'}];
  const [merged] = mergeVocabularyProgress([{...word,errors:3,starred:true}],saved);
  assert.equal(merged.errors,0); assert.equal(merged.starred,false); assert.equal(merged.attempts,3);
});
test('import validates structure and ignores unusable rows', () => {
  assert.throws(() => normalizeVocabulary({unexpected:true}));
  assert.equal(normalizeVocabulary([null,{}, {word:'Apfel',meaning:'蘋果',article:'der'}]).length,1);
});
