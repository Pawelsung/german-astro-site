import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ListMusic, Pause, Play, Repeat2, SkipBack, SkipForward, X } from 'lucide-react';
import LangLoopWordSheet from './LangLoopWordSheet.jsx';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { getProject, listProjects, openLangLoop, useLangLoopAccess } from '../lib/langloopClient';
import { segmentAt, splitWords } from '../lib/listening.mjs';

const SPEED_KEY = 'gw-listening-speed-v1';

function PageFrame({ title, onBack, children }) {
  return (
    <div className="calm-page">
      <header className="calm-bar">
        <div className="calm-bar-side">
          {onBack
            ? <button type="button" className="calm-icon" aria-label="回材料列表" onClick={onBack}><ArrowLeft size={22}/></button>
            : <a className="calm-icon" href="/" aria-label="回首頁"><ArrowLeft size={22}/></a>}
        </div>
        <div className="calm-bar-center">{title}</div>
        <div className="calm-bar-side calm-bar-end"/>
      </header>
      <main className="calm-main">{children}</main>
    </div>
  );
}

function Notice({ title, body, children }) {
  return (
    <div className="calm-notice fx-enter">
      <h1>{title}</h1>
      {body && <p>{body}</p>}
      {children && <div className="calm-stack">{children}</div>}
    </div>
  );
}

const minutes = seconds => (seconds ? `${Math.max(1, Math.round(seconds / 60))} 分鐘` : '');


function ProjectList({ user, onOpen }) {
  const [state, setState] = useState({ phase: 'loading' });
  useEffect(() => {
    let alive = true;
    listProjects(user)
      .then(projects => { if (alive) setState({ phase: 'ready', projects }); })
      .catch(error => { if (alive) setState({ phase: 'error', message: error.message }); });
    return () => { alive = false; };
  }, [user]);

  const openLL = async () => openLangLoop(await user.getIdToken());

  if (state.phase === 'loading') return <p className="calm-loading">讀取聽力材料…</p>;
  if (state.phase === 'error') return <Notice title="暫時打不開" body={state.message}><button type="button" className="calm-secondary" onClick={() => location.reload()}>重新整理</button></Notice>;
  if (!state.projects.length) {
    return <Notice title="還沒有聽力材料" body="在 LangLoop 打開一個德文專案，從右上角選單勾選「放到德語網站」，它就會出現在這裡。">
      <button type="button" className="calm-primary" onClick={openLL}>開啟 LangLoop</button>
    </Notice>;
  }
  return <div className="calm-session fx-enter">
    <p className="calm-hint">同一段分三天聽：先不看字幕抓大意，再對照字幕，最後不看字幕跟讀。</p>
    <div className="picker-list">
      {state.projects.map(project => (
        <button key={project.id} type="button" className="picker-row" onClick={() => onOpen(project.id)}>
          <strong lang="de">{project.title}</strong>
          <span>{[minutes(project.duration), `${project.segmentCount} 句`].filter(Boolean).join(' · ')}</span>
        </button>
      ))}
    </div>
    <button type="button" className="calm-link" onClick={openLL}>到 LangLoop 新增材料</button>
  </div>;
}

const RATES = [0.5, 0.75, 0.9, 1, 1.25];
// Pausing takes a few milliseconds to land, so stop slightly before the sentence ends.
const END_LEAD = 0.02;
// "Previous" after this much of a sentence restarts it instead of going back.
const RESTART_AFTER = 1.5;

function clock(seconds) {
  if (!Number.isFinite(seconds)) return '00:00';
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function readRate() {
  try { const value = Number(localStorage.getItem(SPEED_KEY)); return RATES.includes(value) ? value : 1; } catch { return 1; }
}

// The sentence's words with their timings; without timings, its words without them.
function wordsOf(segment, words) {
  const timed = words.filter(word => word.segmentId === segment.id);
  if (timed.length) return timed;
  return splitWords(segment.text).filter(part => part.word).map((part, index) => ({ id: `${segment.id}-${index}`, word: part.text, start: -1, end: -1 }));
}

function SentenceWords({ words, nowId, time, speaking, onLookup, className }) {
  return words.map((word, index) => (
    <React.Fragment key={word.id}>
      {index ? ' ' : ''}
      <button
        type="button"
        className={`${className}${word.id === nowId ? ' is-now' : speaking && word.start > time ? ' is-ahead' : ''}`}
        onClick={event => { event.stopPropagation(); onLookup(word.word); }}
      >{word.word}</button>
    </React.Fragment>
  ));
}

// The same player as LangLoop's: one sentence large in the middle with the word being spoken lit,
// the sentences before and after it small, a progress bar, and the full transcript on demand.
export function Player({ user, projectId, onBack, fetchProject = getProject }) {
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [playError, setPlayError] = useState('');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(readRate);
  const [loopId, setLoopId] = useState(null);
  const audio = useRef(null);
  const stopSegment = useRef(null);
  const loopSegment = useRef(null);
  const seeking = useRef(false);
  const resumeAt = useRef(null);
  const transcript = useRef(null);
  const wordSheet = useRef(null);
  const shortcut = useRef(() => {});
  const { speak } = useGermanSpeech();

  const load = useCallback(() => fetchProject(user, projectId).then(setProject).catch(err => setError(err.message)), [user, projectId, fetchProject]);
  useEffect(() => { load(); }, [load]);

  const segments = project?.segments || [];
  const words = project?.words || [];
  const activeIndex = segments.length ? Math.max(0, segmentAt(segments, time)) : -1;
  const active = segments[activeIndex] || null;
  const nowId = words.find(word => time >= word.start && time <= word.end)?.id ?? null;
  const looping = loopId !== null && loopId === active?.id;
  const loopIndex = loopId ? segments.findIndex(segment => segment.id === loopId) + 1 : 0;

  useEffect(() => { loopSegment.current = segments.find(segment => segment.id === loopId) || null; }, [loopId, project]);

  // Sentence bounds are checked every frame while playing: timeupdate fires only ~4 times a second.
  function enforceBounds(el) {
    if (stopSegment.current && el.currentTime >= stopSegment.current.end - END_LEAD) { el.pause(); stopSegment.current = null; }
    else if (loopSegment.current && el.currentTime >= loopSegment.current.end - END_LEAD) el.currentTime = loopSegment.current.start;
    if (!seeking.current) setTime(el.currentTime);
  }

  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    const tick = () => { if (audio.current) enforceBounds(audio.current); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const listener = event => shortcut.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  async function start(el) {
    el.playbackRate = rate;
    try { await el.play(); setPlayError(''); }
    catch (caught) { if (caught?.name !== 'AbortError') setPlayError('無法播放音檔。請再按一次播放，或重新載入音檔。'); }
  }

  function playFrom(seconds) {
    const el = audio.current;
    if (!el) return;
    setTime(seconds);
    el.currentTime = seconds;
    start(el);
  }

  const toggle = () => { const el = audio.current; if (!el) return; if (el.paused) start(el); else el.pause(); };

  function playSegment(segment) {
    stopSegment.current = null;
    if (loopId) setLoopId(segment.id);
    playFrom(segment.start);
  }

  function playOnce(segment) {
    setLoopId(null);
    loopSegment.current = null;
    stopSegment.current = segment;
    playFrom(segment.start);
  }

  function toggleLoop() {
    stopSegment.current = null;
    if (loopId) { setLoopId(null); return; }
    if (!active) return;
    setLoopId(active.id);
    playFrom(active.start);
  }

  function step(offset) {
    if (!active) return;
    const restart = offset === -1 && time - active.start > RESTART_AFTER;
    const target = segments[restart ? activeIndex : activeIndex + offset];
    if (target) playSegment(target);
  }

  function changeRate(value) {
    setRate(value);
    if (audio.current) audio.current.playbackRate = value;
    try { localStorage.setItem(SPEED_KEY, String(value)); } catch { /* per-device convenience only */ }
  }

  function lookup(word, segment) {
    audio.current?.pause();
    wordSheet.current?.open(word, segment.text, projectId);
  }

  function openTranscript() {
    transcript.current?.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (active) document.getElementById(`row-${active.id}`)?.scrollIntoView({ block: 'center' });
    }));
  }

  // A signed audio link lasts an hour; reloading gets a fresh one and carries on from there.
  function reloadAudio() {
    resumeAt.current = audio.current?.currentTime ?? time;
    setPlayError('');
    load();
  }

  function onLoaded() {
    const el = audio.current;
    if (!el) return;
    if (Number.isFinite(el.duration)) setDuration(el.duration);
    el.playbackRate = rate;
    if (resumeAt.current != null) { el.currentTime = resumeAt.current; resumeAt.current = null; }
  }

  shortcut.current = event => {
    if (document.querySelector('dialog[open]') || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))) return;
    if (event.key === ' ') { event.preventDefault(); toggle(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'r' || event.key === 'R') toggleLoop();
  };

  if (error) return <PageFrame onBack={onBack}><Notice title="暫時打不開" body={error}><button type="button" className="calm-secondary" onClick={onBack}>回材料列表</button></Notice></PageFrame>;
  if (!project) return <PageFrame onBack={onBack}><p className="calm-loading">準備材料…</p></PageFrame>;

  const previous = segments[activeIndex - 1];
  const next = segments[activeIndex + 1];
  const speaking = active && time > active.start + 0.05 && time <= active.end;

  return <div className="calm-page listen-page">
    <header className="calm-bar">
      <div className="calm-bar-side"><button type="button" className="calm-icon" aria-label="回材料列表" onClick={onBack}><ArrowLeft size={22}/></button></div>
      <div className="calm-bar-center listen-title" lang="de">{project.title}</div>
      <div className="calm-bar-side calm-bar-end"/>
    </header>
    <audio ref={audio} src={project.audioUrl} preload="metadata"
      onTimeUpdate={() => audio.current && enforceBounds(audio.current)}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onLoadedMetadata={onLoaded} onDurationChange={onLoaded}
      onError={() => { setPlaying(false); setPlayError('音檔載入失敗，播放連結可能已過期。'); }}/>

    <section className="listen-stage" aria-label="聽力練習">
      {active ? <>
        {previous
          ? <button type="button" className="listen-neighbor" lang="de" title="跳到上一句" onClick={() => playSegment(previous)}>{previous.text}</button>
          : <div className="listen-neighbor-empty" aria-hidden="true"/>}
        <div key={active.id} className="fx-enter">
          <p className="listen-focus-meta">
            <span>第 {activeIndex + 1} / {segments.length} 句</span>
            {looping && <span className="listen-focus-badge">循環中</span>}
          </p>
          <p className="listen-focus-text" lang="de" title="重播這一句" onClick={() => playOnce(active)}>
            <SentenceWords words={wordsOf(active, words)} nowId={nowId} time={time} speaking={speaking} className="listen-w" onLookup={word => lookup(word, active)}/>
          </p>
          <p className="listen-hint">點單字查詢意思 · 點句子旁邊的空白重播<span className="listen-hint-keys"> · 空白鍵 播放／暫停 · ← → 換句 · R 循環</span></p>
        </div>
        {next
          ? <button type="button" className="listen-neighbor" lang="de" title="跳到下一句" onClick={() => playSegment(next)}>{next.text}</button>
          : <div className="listen-neighbor-empty" aria-hidden="true"/>}
      </> : <p className="calm-loading">這份材料沒有字幕。</p>}
    </section>

    <footer className="listen-footer">
      <div className="listen-footer-inner">
        {playError && <div className="listen-error" role="alert"><span>{playError}</span><button type="button" onClick={reloadAudio}>重新載入音檔</button></div>}
        <div className="listen-time">
          <span>{clock(time)}</span>
          <input type="range" className="listen-range" aria-label="播放進度" min={0} max={duration || 0} step="0.01"
            value={Math.min(time, duration || time)}
            onChange={event => { const value = Number(event.target.value); setTime(value); if (audio.current) audio.current.currentTime = value; }}
            onPointerDown={() => { seeking.current = true; }} onPointerUp={() => { seeking.current = false; }} onPointerCancel={() => { seeking.current = false; }}/>
          <span>{clock(duration)}</span>
        </div>
        <div className="listen-buttons">
          <div className="listen-left">
            <label className="listen-speed">
              <span className="sr-only">播放速度</span>
              <select value={rate} onChange={event => changeRate(Number(event.target.value))}>
                {RATES.map(value => <option key={value} value={value}>{value}x</option>)}
              </select>
            </label>
            <span className="listen-status" aria-live="polite">{loopId ? `第 ${loopIndex} 句循環中` : active ? `第 ${activeIndex + 1} / ${segments.length} 句` : ''}</span>
          </div>
          <div className="listen-center">
            <button type="button" className="listen-step" aria-label="上一句" disabled={!active} onClick={() => step(-1)}><SkipBack size={20} fill="currentColor" aria-hidden="true"/></button>
            <button type="button" className="listen-play" aria-label={playing ? '暫停' : '播放'} onClick={toggle}>
              {playing ? <Pause size={22} fill="currentColor" aria-hidden="true"/> : <Play size={22} fill="currentColor" aria-hidden="true"/>}
            </button>
            <button type="button" className="listen-step" aria-label="下一句" disabled={!active || activeIndex >= segments.length - 1} onClick={() => step(1)}><SkipForward size={20} fill="currentColor" aria-hidden="true"/></button>
          </div>
          <div className="listen-right">
            <button type="button" className="listen-tool" aria-label={looping ? '停止循環這一句' : '循環目前這一句'} aria-pressed={loopId !== null} disabled={!active} onClick={toggleLoop}><Repeat2 size={20} aria-hidden="true"/></button>
            <button type="button" className="listen-tool" aria-label="顯示全部字幕" title="全部字幕" onClick={openTranscript}><ListMusic size={20} aria-hidden="true"/></button>
          </div>
        </div>
      </div>
    </footer>

    <dialog ref={transcript} className="listen-transcript" aria-labelledby="transcript-heading">
      <header className="listen-transcript-head">
        <h2 id="transcript-heading">全部字幕 <span>{segments.length} 句</span></h2>
        <button type="button" className="calm-icon" aria-label="關閉全部字幕" onClick={() => transcript.current?.close()}><X size={22}/></button>
      </header>
      <ol className="listen-transcript-list">
        {segments.map((segment, index) => {
          const isActive = segment.id === active?.id;
          return <li key={segment.id} id={`row-${segment.id}`} className={`listen-row${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'true' : undefined}>
            <div className="listen-row-num">{String(index + 1).padStart(2, '0')}<span>{clock(segment.start)}</span></div>
            <p className="listen-row-text" lang="de" onClick={() => { playSegment(segment); transcript.current?.close(); }}>
              <SentenceWords words={wordsOf(segment, words)} nowId={nowId} time={time} speaking={false} className="listen-w" onLookup={word => lookup(word, segment)}/>
            </p>
            <button type="button" className={`listen-tool${isActive ? ' is-on' : ''}`} aria-label={`播放第 ${index + 1} 句一次`} onClick={() => playOnce(segment)}><Play size={18} aria-hidden="true"/></button>
          </li>;
        })}
      </ol>
    </dialog>

    <LangLoopWordSheet ref={wordSheet} user={user} speak={speak}/>
  </div>;
}

export default function ListeningApp() {
  const access = useLangLoopAccess();
  const [projectId, setProjectId] = useState(() => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('p')));

  useEffect(() => {
    const onPop = () => setProjectId(new URLSearchParams(location.search).get('p'));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = id => { history.pushState(null, '', `?p=${encodeURIComponent(id)}`); setProjectId(id); };
  const back = () => { history.pushState(null, '', location.pathname); setProjectId(null); };

  if (access.status === 'loading') return <PageFrame><p className="calm-loading">確認帳號…</p></PageFrame>;
  if (access.status === 'signed-out') return <PageFrame><Notice title="請先登入" body="聽力練習要用受邀的 Google 帳號登入。"><a className="calm-primary" href="/">回首頁登入</a></Notice></PageFrame>;
  if (access.status === 'denied') return <PageFrame><Notice title="這個功能還沒開放" body="聽力練習目前只開放給受邀的帳號。單字和文法練習都可以照常使用。"><a className="calm-primary" href="/">回首頁</a></Notice></PageFrame>;
  if (projectId) return <Player key={projectId} user={access.user} projectId={projectId} onBack={back}/>;
  return <PageFrame title="聽力練習"><ProjectList user={access.user} onOpen={open}/></PageFrame>;
}
