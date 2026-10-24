// Keep speak() synchronous with the button's user gesture (required on iOS).
export function createGermanSpeechPlayer(env, notify = () => {}) {
  let active = null;
  let timer = null;
  const clearTimer = () => { if (timer !== null) env.clearTimeout(timer); timer = null; };
  const stop = () => {
    active = null;
    clearTimer();
    if (env.speechSynthesis?.speaking || env.speechSynthesis?.pending) env.speechSynthesis.cancel();
  };
  return {
    stop,
    speak(text, { voiceURI = '', rate = 0.9, pitch = 1 } = {}) {
      if (!String(text || '').trim()) return;
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
          : '無法播放發音。請在語音設定選「系統德語人聲」後再試，並確認手機音量與音訊輸出。');
      };
      notify('正在準備發音…');
      timer = env.setTimeout(() => {
        if (active === utterance) notify('發音尚未啟動。請再點喇叭；若仍無聲，請選系統德語人聲，並確認手機音量與音訊輸出。');
      }, 6000);
      try {
        if (synth.paused) synth.resume();
        synth.speak(utterance);
      } catch {
        active = null; clearTimer();
        notify('發音無法啟動，請重新整理 Safari 後再點喇叭。');
      }
    }
  };
}
