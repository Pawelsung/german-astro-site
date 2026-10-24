import { useEffect, useRef, useState } from 'react';
import { audioKey, createGermanSpeechPlayer, loadAudioManifest } from '../lib/germanSpeech.mjs';

export function useGermanSpeech({ voiceURI = '', rate = 0.9, pitch = 1 } = {}) {
  const [voices, setVoices] = useState([]);
  const [speechMessage, setSpeechMessage] = useState('');
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
