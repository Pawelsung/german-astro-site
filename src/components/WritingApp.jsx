import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, Square } from 'lucide-react';
import LangLoopWordSheet from './LangLoopWordSheet.jsx';
import SpeakButton from './lesson/SpeakButton.jsx';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { useRecorder } from '../hooks/useRecorder';
import { correctText, transcribe, useLangLoopAccess } from '../lib/langloopClient';
import { sameText } from '../lib/listening.mjs';

const DRAFT_KEY = 'gw-writing-draft-v1';
const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const KIND_LABELS = { grammar: '文法', vocabulary: '用字', spelling: '拼字', word_order: '語序', style: '說法' };

// One prompt a week, so the week's writing has a topic without having to think of one.
const PROMPTS = [
  '這個週末你做了什麼？',
  '介紹你住的城市或街區。',
  '描述你平常的一天，從早上到晚上。',
  '你最近買了什麼東西？為什麼買？',
  '說說一道你喜歡的菜，要怎麼做？',
  '你上一次旅行去了哪裡？發生了什麼事？',
  '你的工作或學校最近有什麼事？',
  '寫一則短訊息，約朋友這週見面。',
  '你小時候最喜歡做什麼？',
  '你覺得學德文最難的是什麼？',
  '下個月你有什麼計畫？',
  '描述一個你很喜歡的人。'
];

const weekNumber = () => Math.floor(Date.now() / (7 * 24 * 3600 * 1000));

function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { return {}; }
}

function PageFrame({ children }) {
  return (
    <div className="calm-page">
      <header className="calm-bar">
        <div className="calm-bar-side"><a className="calm-icon" href="/" aria-label="回首頁"><ArrowLeft size={22}/></a></div>
        <div className="calm-bar-center">寫作與口說</div>
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

function Writer({ user }) {
  const draft = useRef(readDraft()).current;
  const [promptIndex, setPromptIndex] = useState(() => (Number.isInteger(draft.prompt) ? draft.prompt : weekNumber()) % PROMPTS.length);
  const [level, setLevel] = useState(LEVELS.includes(draft.level) ? draft.level : 'A2');
  const [text, setText] = useState(typeof draft.text === 'string' ? draft.text : '');
  const [spoken, setSpoken] = useState(draft.spoken === true);
  const [speech, setSpeech] = useState({ phase: 'idle' });
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [rewrite, setRewrite] = useState('');
  const [rewriteChecked, setRewriteChecked] = useState(false);
  const recorder = useRecorder();
  const wordSheet = useRef(null);
  const { speak } = useGermanSpeech();
  const prompt = PROMPTS[promptIndex];

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ prompt: promptIndex, level, text, spoken })); } catch { /* the draft is a convenience only */ }
  }, [promptIndex, level, text, spoken]);

  // A finished recording is turned into text and added to the end of the draft.
  useEffect(() => {
    if (!recorder.blob) return;
    let alive = true;
    setSpeech({ phase: 'working' });
    transcribe(user, recorder.blob)
      .then(({ text: heard }) => {
        if (!alive) return;
        setText(previous => [previous.trim(), heard].filter(Boolean).join(' '));
        setSpoken(true);
        setSpeech({ phase: 'idle' });
        recorder.reset();
      })
      .catch(err => { if (alive) setSpeech({ phase: 'failed', message: err.message }); });
    return () => { alive = false; };
  }, [recorder.blob]);

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) { setError('先寫幾句德文，或按「用說的」。'); return; }
    setChecking(true);
    setError('');
    try {
      const data = await correctText(user, { text, level, topic: prompt, spoken });
      setResult({ ...data.correction, remaining: data.remaining, original: text });
      setRewrite('');
      setRewriteChecked(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  function startOver() {
    setText('');
    setSpoken(false);
    setResult(null);
    setRewrite('');
    setRewriteChecked(false);
    setPromptIndex(index => (index + 1) % PROMPTS.length);
  }

  const rewriteMatches = rewriteChecked && sameText(rewrite, result?.corrected);

  return <div className="calm-session fx-enter">
    <div className="write-prompt">
      <strong>這週的題目</strong>
      {prompt}
      <div><button type="button" className="calm-link" onClick={() => setPromptIndex(index => (index + 1) % PROMPTS.length)}>換一題</button></div>
    </div>

    <form className="lf-form" onSubmit={submit}>
      <div className="calm-choices" role="group" aria-label="程度">
        {LEVELS.map(value => <button key={value} type="button" className={value === level ? 'is-on' : ''} aria-pressed={value === level} onClick={() => setLevel(value)}>{value}</button>)}
      </div>
      <label>
        你的德文（3 到 5 句）
        <textarea lang="de" rows={6} value={text} spellCheck={false} disabled={checking} onChange={event => { setText(event.target.value); setError(''); }} placeholder="Am Wochenende habe ich …"/>
      </label>
      <div className="write-row">
        {recorder.recording
          ? <button type="button" className="calm-secondary" onClick={recorder.stop}><Square size={18} aria-hidden="true"/>&nbsp;說完了</button>
          : <button type="button" className="calm-secondary" disabled={checking || speech.phase === 'working'} onClick={recorder.start}><Mic size={18} aria-hidden="true"/>&nbsp;{speech.phase === 'working' ? '轉成文字中…' : '用說的'}</button>}
        <button type="submit" className="calm-primary" disabled={checking || recorder.recording}>{checking ? '批改中…' : '批改'}</button>
      </div>
      {recorder.error && <p role="alert" className="calm-hint">{recorder.error}</p>}
      {speech.phase === 'failed' && <p role="alert" className="calm-hint">{speech.message}</p>}
      {error && <p role="alert" className="calm-hint">{error}</p>}
      {!result && <p className="calm-hint">卡住、不會說的地方先用中文寫，批改會告訴你德文怎麼說。用說的會先轉成文字放進上面的框，可以改了再批改。</p>}
    </form>

    {result && <>
      <section className="write-section" aria-live="polite">
        <h2>批改結果</h2>
        {result.summary && <p>{result.summary}</p>}
        {result.changes.length === 0 && <p className="calm-hint">沒有找到需要改的地方。</p>}
        {result.changes.map((change, index) => (
          <div key={index} className="write-change">
            <div lang="de"><del>{change.original || '（加上）'}</del> → <ins>{change.corrected || '（刪掉）'}</ins></div>
            <p>{KIND_LABELS[change.kind] || '文法'}：{change.reason}</p>
          </div>
        ))}
        <p className="calm-hint">AI 批改大多可靠，但不是百分之百。看得懂原因再接受；看不懂的可以先跳過。</p>
      </section>

      <section className="write-section">
        <div className="listen-word-head">
          <h2>正確版</h2>
          <SpeakButton label="唸正確版" onSpeak={() => speak(result.corrected)}/>
        </div>
        <p className="write-corrected" lang="de">{result.corrected}</p>
      </section>

      <section className="write-section lf-form">
        <h2>自己重寫一次</h2>
        <label>
          不看上面，憑記憶寫出正確版
          <textarea lang="de" rows={4} value={rewrite} spellCheck={false} onChange={event => { setRewrite(event.target.value); setRewriteChecked(false); }}/>
        </label>
        <button type="button" className="calm-secondary" disabled={!rewrite.trim()} onClick={() => setRewriteChecked(true)}>對照正確版</button>
        {rewriteChecked && <p role="status" className="calm-hint">{rewriteMatches ? '完全一樣，做得好！' : '還有地方不一樣，對照上面的正確版再看一次。'}</p>}
      </section>

      {result.words.length > 0 && <section className="write-section">
        <h2>這次可以學的字</h2>
        <div className="write-words">
          {result.words.map(word => (
            <div key={word.word} className="write-word">
              <div><strong lang="de">{word.word}</strong> <span>{word.meaning}</span></div>
              <button type="button" className="calm-link" onClick={() => wordSheet.current?.open(word.word, result.corrected)}>存起來</button>
            </div>
          ))}
        </div>
      </section>}

      <section className="write-section">
        <p className="calm-hint">今天還可以批改 {result.remaining} 次。</p>
        <button type="button" className="calm-secondary" onClick={startOver}>寫下一篇</button>
      </section>
    </>}

    <LangLoopWordSheet ref={wordSheet} user={user} speak={speak}/>
  </div>;
}

export default function WritingApp() {
  const access = useLangLoopAccess();
  if (access.status === 'loading') return <PageFrame><p className="calm-loading">確認帳號…</p></PageFrame>;
  if (access.status === 'signed-out') return <PageFrame><Notice title="請先登入" body="寫作與口說批改要用受邀的 Google 帳號登入。"><a className="calm-primary" href="/">回首頁登入</a></Notice></PageFrame>;
  if (access.status === 'denied') return <PageFrame><Notice title="這個功能還沒開放" body="AI 批改目前只開放給受邀的帳號。單字和文法練習都可以照常使用。"><a className="calm-primary" href="/">回首頁</a></Notice></PageFrame>;
  return <PageFrame><Writer user={access.user}/></PageFrame>;
}
