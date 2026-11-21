import { useCallback, useEffect, useRef, useState } from 'react';

// Records one short clip with the microphone. The clip stays in memory only (an object URL) and
// is dropped on reset, on a new recording, or when the page closes. A recording stops itself
// after MAX_MS so a forgotten one cannot grow past what speech recognition accepts.
const MAX_MS = 60_000;

function pickType() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return '';
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState({ blob: null, url: '' });
  const [error, setError] = useState('');
  const recorder = useRef(null);
  const timer = useRef(null);
  const player = useRef(null);

  const drop = useCallback(() => {
    setClip(previous => { if (previous.url) URL.revokeObjectURL(previous.url); return { blob: null, url: '' }; });
  }, []);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError('');
    const type = pickType();
    if (type === null || !navigator.mediaDevices?.getUserMedia) { setError('這個瀏覽器不支援錄音。'); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('沒有麥克風權限。請在瀏覽器的網站設定允許麥克風，再按一次錄音。');
      return;
    }
    drop();
    const chunks = [];
    const next = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    next.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    next.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, { type: next.mimeType || type || 'audio/webm' });
      setClip({ blob, url: URL.createObjectURL(blob) });
      setRecording(false);
    };
    recorder.current = next;
    next.start();
    setRecording(true);
    timer.current = setTimeout(stop, MAX_MS);
  }, [drop, stop]);

  const play = useCallback(() => {
    if (!clip.url) return;
    player.current?.pause();
    player.current = new Audio(clip.url);
    player.current.play().catch(() => {});
  }, [clip.url]);

  const reset = useCallback(() => { stop(); drop(); setError(''); }, [stop, drop]);

  useEffect(() => () => { stop(); player.current?.pause(); }, [stop]);
  useEffect(() => () => { if (clip.url) URL.revokeObjectURL(clip.url); }, [clip.url]);

  return { recording, blob: clip.blob, url: clip.url, error, start, stop, play, reset };
}
