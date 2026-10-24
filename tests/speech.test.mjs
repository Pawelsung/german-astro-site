import test from 'node:test';
import assert from 'node:assert/strict';
import { createGermanSpeechPlayer } from '../src/lib/germanSpeech.mjs';
function setup() {
  const calls = [], messages = [], timers = new Map();
  let counter = 0;
  const synth = { speaking: false, pending: false, paused: false, getVoices: () => [],
    speak: u => calls.push(['speak', u]), cancel: () => calls.push(['cancel']), resume: () => calls.push(['resume']) };
  const env = { speechSynthesis: synth, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    setTimeout: fn => { timers.set(++counter, fn); return counter; }, clearTimeout: id => timers.delete(id) };
  return { synth, calls, messages, timers, player: createGermanSpeechPlayer(env, m => messages.push(m)) };
}
test('first tap speaks synchronously with system German voice even before voice list loads', () => {
  const { player, calls } = setup();
  player.speak('Guten Tag');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'speak');
  assert.equal(calls[0][1].lang, 'de-DE');
  assert.equal(calls[0][1].voice, undefined);
  assert.equal(calls[0][1].text, 'Guten Tag');
});
test('refreshes selected voice at tap time and falls back when URI is missing', () => {
  const { player, synth, calls } = setup();
  const voice = { lang:'de-DE', voiceURI:'de-local' };
  synth.getVoices = () => [voice];
  player.speak('Hallo', {voiceURI:'de-local'});
  assert.equal(calls.at(-1)[1].voice, voice);
  player.speak('Hallo', {voiceURI:'old-device-voice'});
  assert.equal(calls.at(-1)[1].voice, undefined);
});
test('paused queue resumes in the same call, and replacement ignores stale error events', () => {
  const { player, synth, calls, messages } = setup();
  player.speak('eins'); const old = calls[0][1];
  synth.speaking = true; synth.paused = true;
  player.speak('zwei');
  assert.deepEqual(calls.slice(1).map(c=>c[0]), ['cancel','resume','speak']);
  old.onerror({error:'not-allowed'});
  assert.equal(messages.at(-1),'正在準備發音…');
  calls.at(-1)[1].onerror({error:'not-allowed'});
  assert.match(messages.at(-1), /再點一次/);
});
test('silent engine reports a retry instruction and cleanup clears its watchdog', () => {
  const { player, calls, timers, messages } = setup();
  player.speak('Hallo');
  [...timers.values()][0]();
  assert.match(messages.at(-1), /尚未啟動/);
  calls[0][1].onstart();
  assert.equal(timers.size,0);
  player.stop();
  calls[0][1].onerror({error:'audio-busy'});
  assert.equal(messages.at(-1),'正在播放德語發音…');
});
