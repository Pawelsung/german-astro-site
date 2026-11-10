import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { collectTexts } from '../tools/audioTexts.mjs';
import { adjectiveSpeechText, connectorSpeechText, kasusSpeechText } from '../src/lib/lessonSpeech.mjs';

const root = new URL('..', import.meta.url).pathname;
const { files } = JSON.parse(readFileSync(`${root}public/audio/manifest.json`, 'utf8'));

test('every text the site can read aloud has a recording on disk', () => {
  const missing = collectTexts().filter(text => !files[text] || !existsSync(`${root}public/audio/de-charon/${files[text]}`));
  assert.deepEqual(missing.slice(0, 20), []);
});

test('read-aloud sentences are German and fill in the answer', () => {
  assert.equal(kasusSpeechText({ fullSentence: 'durch → Akkusativ Zone' }), null);
  assert.equal(adjectiveSpeechText({ prompt: '____ gefällt mir.', answer: 'Der neue Film' }), 'Der neue Film gefällt mir.');
  assert.equal(adjectiveSpeechText({ prompt: 'Ich lese ein Buch.｜加入形容詞 wichtig。', answer: 'Ich lese ein wichtiges Buch.' }), 'Ich lese ein wichtiges Buch.');
  assert.equal(connectorSpeechText({ type: 'choose_connector', sentenceWithBlank: 'Er kommt, ___ er Zeit hat.', options: [{ id: 'weil', text: 'weil' }], answer: 'weil' }), 'Er kommt, weil er Zeit hat.');
  assert.equal(connectorSpeechText({ type: 'choose_connector', sentenceWithBlank: 'Er übt ___ Grammatik ___ Aussprache.', options: [{ id: 'a', text: 'sowohl ... als auch' }], answer: 'a' }), 'Er übt sowohl Grammatik als auch Aussprache.');
  assert.equal(connectorSpeechText({ type: 'pair_connector' }), null);
});
