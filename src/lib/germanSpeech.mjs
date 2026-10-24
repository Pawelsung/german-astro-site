// Lookup key shared by tools/generate-audio.mjs and the player, so both match the same text.
export function audioKey(text) {
  return String(text || '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

export const AUDIO_MANIFEST_URL = '/audio/manifest.json';
let manifestRequest = null;

// Fetches the pre-generated audio manifest once and resolves to { text: url }.
export function loadAudioManifest(fetchImpl = globalThis.fetch) {
  if (!fetchImpl) return Promise.resolve({});
  manifestRequest ||= fetchImpl(AUDIO_MANIFEST_URL)
    .then(response => (response.ok ? response.json() : { files: {} }))
    .then(manifest => {
      const base = AUDIO_MANIFEST_URL.replace(/manifest\.json$/, 'de-charon/');
      return Object.fromEntries(Object.entries(manifest.files || {}).map(([text, file]) => [text, base + file]));
    })
    .catch(() => ({}));
  return manifestRequest;
}

// Keep speak() synchronous with the button's user gesture (required on iOS).
// With no voice chosen, pre-generated natural audio plays first; system speech is the fallback.
export function createGermanSpeechPlayer(env, notify = () => {}, { resolveAudio = () => null } = {}) {
  let active = null;
  let audio = null;
  let timer = null;
  const clearTimer = () => { if (timer !== null) env.clearTimeout(timer); timer = null; };
  const stop = () => {
    active = null;
    clearTimer();
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio = null; }
    if (env.speechSynthesis?.speaking || env.speechSynthesis?.pending) env.speechSynthesis.cancel();
  };
  const speakSynth = (text, { voiceURI = '', rate = 0.9, pitch = 1 } = {}) => {
      const synth = env.speechSynthesis;
      if (!synth || !env.SpeechSynthesisUtterance) { notify('此瀏覽器不支援發音，請用 Safari 或 Chrome 開啟。'); return; }
      stop();
      const utterance = new env.SpeechSynthesisUtterance(text);
      active = utterance; // Retain the utterance for the entire playback lifecycle.
      utterance.lang = 'de-DE';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      // Refresh at tap time; voices can arrive after the page first renders.
      // Leave voice unset by default so Safari chooses its system German voice.
      const voice = synth.getVoices().find(v => v.voiceURI === voiceURI && /^de[-_]/i.test(v.lang));
      if (voice) utterance.voice = voice;
      utterance.onstart = () => { if (active === utterance) { clearTimer(); notify('正在播放德語發音…'); } };
      utterance.onend = () => { if (active === utterance) { active = null; clearTimer(); notify(''); } };
      utterance.onerror = event => {
        if (active !== utterance) return;
        active = null; clearTimer();
        if (['interrupted', 'canceled'].includes(event.error)) { notify(''); return; }
        notify(event.error === 'not-allowed'
          ? 'Safari 尚未允許播放，請直接再點一次喇叭。'
          : '無法播放發音。請在語音設定改選其他德語人聲後再試，並確認手機音量與音訊輸出。');
      };
      notify('正在準備發音…');
      timer = env.setTimeout(() => {
        if (active === utterance) notify('發音尚未啟動。請再點喇叭；若仍無聲，請在語音設定改選德語人聲，並確認手機音量與音訊輸出。');
      }, 6000);
      try {
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      } catch {
        active = null; clearTimer();
        notify('發音無法啟動，請重新整理 Safari 後再點喇叭。');
      }
  };
  return {
    stop,
    speak(text, options = {}) {
      if (!String(text || '').trim()) return;
      const url = !options.voiceURI && env.Audio ? resolveAudio(audioKey(text)) : null;
      if (!url) { speakSynth(text, options); return; }
      stop();
      const clip = new env.Audio(url);
      audio = clip;
      // 0.9 is the default speech rate, so it maps to the recording's natural speed.
      clip.playbackRate = Math.min(Math.max((options.rate || 0.9) / 0.9, 0.5), 2);
      const fallback = () => { if (audio === clip) { audio = null; speakSynth(text, options); } };
      clip.onended = () => { if (audio === clip) { audio = null; notify(''); } };
      clip.onerror = fallback;
      notify('正在播放德語發音…');
      try {
        const playing = clip.play();
        if (playing?.catch) playing.catch(fallback);
      } catch {
        fallback();
      }
    }
  };
}
