import { useEffect, useRef, useState } from 'react';
import { audioKey, createGermanSpeechPlayer, loadAudioManifest } from '../lib/germanSpeech.mjs';

// Progress notices are not shown: they appeared above the card and pushed it down on every tap.
const PROGRESS_MESSAGES = new Set(['正在播放德語發音…', '正在準備發音…']);

export function useGermanSpeech({ voiceURI = '', rate = 0.9, pitch = 1 } = {}) {
  const [voices, setVoices] = useState([]);
  const [speechMessage, setRawMessage] = useState('');
  const setSpeechMessage = message => setRawMessage(PROGRESS_MESSAGES.has(message) ? '' : message);
  const player = useRef(null);
  const audioFiles = useRef({});
  useEffect(() => {
    loadAudioManifest().then(files => { audioFiles.current = files; });
  }, []);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const refresh = () => setVoices(synth.getVoices().filter(v => /^de[-_]/i.test(v.lang)));
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => { synth.removeEventListener('voiceschanged', refresh); player.current?.stop(); };
  }, []);
  const speak = text => {
    player.current ||= createGermanSpeechPlayer(window, setSpeechMessage, { resolveAudio: key => audioFiles.current[key] || audioFiles.current[audioKey(key)] || null });
    player.current.speak(text, { voiceURI, rate, pitch });
  };
  return { voices, speak, speechMessage };
}
