import React from 'react';

export default function VoiceSettings({ voices, voice, onVoice, rate, onRate, pitch, onPitch, autoSpeak, onAutoSpeak, speak }) {
  return <div className="lf-form">
    <label>德語人聲
      <select value={voice} onChange={event => onVoice(event.target.value)}>
        <option value="">自然人聲（預設）</option>
        {voices.map(item => <option key={item.voiceURI} value={item.voiceURI}>{item.name} ({item.lang})</option>)}
      </select>
    </label>
    <label>語速 {rate.toFixed(1)}x
      <input type="range" min="0.5" max="1.5" step="0.1" value={rate} onChange={event => onRate(parseFloat(event.target.value))}/>
    </label>
    {onPitch && <label>音高 {pitch.toFixed(1)}
      <input type="range" min="0.7" max="1.5" step="0.1" value={pitch} onChange={event => onPitch(parseFloat(event.target.value))}/>
    </label>}
    {onAutoSpeak && <label className="is-inline"><input type="checkbox" checked={autoSpeak} onChange={event => onAutoSpeak(event.target.checked)}/>自動播放動詞</label>}
    <button type="button" className="calm-secondary" onClick={() => speak('Das ist ein Test für die Aussprache.')}>測試發音</button>
  </div>;
}
