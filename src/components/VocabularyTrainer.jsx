import { useGermanSpeech } from '../hooks/useGermanSpeech';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, RotateCcw, Search, Settings2, Star, Upload, Volume2 } from 'lucide-react';
import { PROGRESS_KEYS, readJSON, writeJSON, isReviewRequested } from '../lib/progressStorage';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { POS_LABELS, wordKey, normalizeVocabulary, mergeVocabularyProgress, chaptersFor, filterVocabulary, articleExplanation } from '../lib/vocabulary.mjs';

const UI_KEY = 'german-vocabulary-workspace-v1';
const CACHE_KEY = 'german-vocabulary-library-v1';
const DEFAULT_PRESET = 'schritte-b1-1';
const modes = [['learn', '字卡'], ['article', '冠詞'], ['spell', '聽寫'], ['pos', '詞性'], ['list', '字典']];
const readWords = () => { try { return normalizeVocabulary(readJSON(PROGRESS_KEYS.lesson1Words, [])); } catch { return []; } };
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold transition-colors hover:border-sky-400 hover:bg-sky-50 disabled:opacity-40';
const field = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm';
const emptyUI = { preset: DEFAULT_PRESET, chapter: 'all', mode: 'learn', index: 0, filter: 'all' };

function PracticeDetails({ practice }) {
  if (!practice || typeof practice !== 'object') return null;
  const rows = [
    ['用法', practice.pattern || practice.examplePattern],
    ['過去式', practice.praeteritum_3sg],
    ['完成式', practice.perfekt_3sg],
    ['格位', practice.case || practice.reflexiveCase],
    ['位置', practice.sentencePosition],
  ].filter(([, value]) => typeof value === 'string' && value);
  return <div>
    {rows.map(([label, value]) => <p key={label}><strong>{label}：</strong>{value}</p>)}
    {practice.present && typeof practice.present === 'object' && <details><summary>查看現在式變化</summary>{Object.entries(practice.present).filter(([, value]) => typeof value === 'string').map(([person, value]) => <p lang="de" key={person}>{value}</p>)}</details>}
    {typeof practice.usageNoteZh === 'string' && <p>{practice.usageNoteZh}</p>}
    {typeof practice.practicePromptZh === 'string' && <p>{practice.practicePromptZh}</p>}
  </div>;
}

export default function VocabularyTrainer() {
  const [words, setWords] = useStoredProgress(PROGRESS_KEYS.lesson1Words, readWords);
  const [ui, setUI] = useState(() => ({ ...emptyUI, ...(words.length && !readJSON(UI_KEY, null) ? { preset: words.some(w => w.lesson) ? DEFAULT_PRESET : 'custom' } : {}), ...readJSON(UI_KEY, {}), ...(isReviewRequested() ? { chapter: 'all', filter: 'review', mode: 'learn', index: 0 } : {}) }));
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [tools, setTools] = useState(false);
  const [voice, setVoice] = useState(() => readJSON(PROGRESS_KEYS.lesson1Stats, {})?.voices?.selectedURI || '');
  const [rate, setRate] = useState(() => readJSON(PROGRESS_KEYS.lesson1Stats, {})?.voices?.rate || 0.9);
  const { voices, speak, speechMessage } = useGermanSpeech({ voiceURI: voice, rate });
  const [session, setSession] = useState({ done: 0, correct: 0 });
  const request = useRef(0);
  const fileInput = useRef(null);
  const submitting = useRef(false);
  // Freeze current question after answering so a resolved review item stays visible.
  const [answeredWord, setAnsweredWord] = useState(null);
  const chapters = useMemo(() => chaptersFor(words), [words]);
  const filtered = useMemo(() => filterVocabulary(words, { ...ui, query }), [words, ui.chapter, ui.filter, ui.mode, query]);
  const current = answeredWord || filtered[ui.index % Math.max(filtered.length, 1)];
  const selectedPreset = presets.find(p => p.id === ui.preset);
  const isB1 = ui.preset.startsWith('schritte-');
  const activeLevel = ui.preset === 'custom' ? 'custom' : isB1 ? 'b1' : 'mixed';

  function change(patch) {
    setUI(prev => ({ ...prev, ...patch, index: 0 }));
    setFeedback(null); setAnsweredWord(null); setFlipped(false); setAnswer(''); submitting.current = false;
  }
  useEffect(() => { writeJSON(UI_KEY, ui); }, [ui]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/vocab/index.json', { signal: controller.signal }).then(res => {
      if (!res.ok) throw new Error('無法載入字庫清單，請重新整理再試。');
      return res.json();
    }).then(async list => {
      setPresets(list);
      if (!words.length) await loadPreset(list.find(p => p.id === ui.preset) || list.find(p => p.id === DEFAULT_PRESET), true);
      else {
        if (!readJSON(UI_KEY, null)) change({ preset: words.some(w => w.lesson) ? DEFAULT_PRESET : 'custom' });
        setLoading(false);
      }
    }).catch(e => { if (e.name !== 'AbortError') { setError(e.message); setLoading(false); } });
    return () => { controller.abort(); request.current++; };
  }, []);
  useEffect(() => {
    const keydown = e => {
      if (e.target.closest('input, select, textarea, button, a, summary') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      if (e.key === ' ' && ui.mode === 'learn') { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [current, ui, filtered]);
  function saveAudio(next) {
    const previous = readJSON(PROGRESS_KEYS.lesson1Stats, {});
    writeJSON(PROGRESS_KEYS.lesson1Stats, { ...previous, voices: { ...previous?.voices, rate, selectedURI: voice, ...next } });
  }
  async function loadPreset(preset, initial = false) {
    if (!preset) return;
    const id = ++request.current; setLoading(true); setError('');
    try {
      const res = await fetch(preset.path);
      if (!res.ok) throw new Error('字庫暫時無法載入，原有紀錄已保留。');
      const incoming = normalizeVocabulary(await res.json());
      if (!incoming.length) throw new Error('字庫沒有可用的單字。');
      if (id !== request.current) return;
      const archive = readJSON(CACHE_KEY, {});
      for (const w of readWords()) archive[wordKey(w)] = w;
      writeJSON(CACHE_KEY, archive);
      setWords(mergeVocabularyProgress(incoming, Object.values(archive)));
      setQuery(''); change({ preset: preset.id, chapter: 'all', filter: initial && isReviewRequested() ? 'review' : 'all' });
      setMessage(`已載入 ${preset.label}，既有錯題與收藏已保留。`);
    } catch (e) { if (id === request.current) setError(e.message); }
    finally { if (id === request.current) setLoading(false); }
  }
  function updateWord(patch) {
    if (!current) return;
    const key = wordKey(current);
    setWords(previous => previous.map(w => wordKey(w) === key ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w));
  }
  function submit(value) {
    if (!current || feedback || submitting.current || !String(value).trim()) return;
    submitting.current = true;
    const expected = ui.mode === 'article' ? current.article : ui.mode === 'pos' ? current.pos : current.word;
    // German noun capitalization and umlauts are part of spelling.
    const correct = String(value).trim().normalize('NFC') === String(expected).trim().normalize('NFC');
    setAnsweredWord(current); setFeedback({ correct, expected });
    updateWord({ errors: correct ? 0 : (current.errors || 0) + 1, attempts: (current.attempts || 0) + 1, correct: (current.correct || 0) + Number(correct) });
    setSession(s => ({ done: s.done + 1, correct: s.correct + Number(correct) }));
  }
  function move(delta) {
    // In a review deck the current word may have been removed on a correct answer.
    const stillPresent = filtered.some(w => wordKey(w) === wordKey(current || {}));
    setUI(prev => ({ ...prev, index: (prev.index + (answeredWord && !stillPresent && delta > 0 ? 0 : delta) + filtered.length) % Math.max(filtered.length, 1) }));
    setFeedback(null); setAnsweredWord(null); setFlipped(false); setAnswer(''); submitting.current = false;
  }
  function exportBackup() {
    const archive = readJSON(CACHE_KEY, {});
    words.forEach(w => { archive[wordKey(w)] = w; });
    const blob = new Blob([JSON.stringify({ vocabulary: Object.values(archive), stats: readJSON(PROGRESS_KEYS.lesson1Stats, {}) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'german-vocabulary-backup.json'; a.click(); URL.revokeObjectURL(url);
  }
  async function importBackup(event) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('請使用 5 MB 以下的 JSON 字庫。');
      const imported = normalizeVocabulary(JSON.parse(await file.text()));
      if (!imported.length) throw new Error('找不到有效單字，請確認 word 與 meaning 欄位。');
      const archive = readJSON(CACHE_KEY, {}); words.forEach(w => { archive[wordKey(w)] = w; }); writeJSON(CACHE_KEY, archive);
      setWords(mergeVocabularyProgress(imported, Object.values(archive))); change({ preset: 'custom', chapter: 'all', filter: 'all' }); setQuery(''); setError(''); setMessage(`已匯入 ${imported.length} 個單字，原字庫紀錄已保留。`);
    } catch (e) { setError(`匯入失敗：${e.message}`); }
    event.target.value = '';
  }
  return <div className="vocab-workspace">
    <section className="vocab-library" aria-label="選擇學習範圍">
      <div className="vocab-library-heading"><BookOpen size={20}/><div><h2>我的單字課程</h2><p>先選教材，再選這次想練習的課次。</p></div></div>
      <div className="vocab-selectors">
        <label>程度／教材<select className={field} aria-label="程度與教材" disabled={loading} value={activeLevel} onChange={e => loadPreset(presets.find(p => p.id === (e.target.value === 'b1' ? DEFAULT_PRESET : 'a1-b1-part1')))}><option value="b1">B1 · Schritte B1.1</option><option value="mixed">A1–B1 · 綜合主題</option>{activeLevel === 'custom' && <option value="custom">自訂字庫</option>}</select></label>
        <label>字庫<select className={field} aria-label="字庫" disabled={loading} value={ui.preset} onChange={e => loadPreset(presets.find(p => p.id === e.target.value))}>{presets.filter(p => activeLevel === 'b1' ? p.id.startsWith('schritte-') : p.id === 'a1-b1-part1').map(p => <option key={p.id} value={p.id}>{p.label} · {p.count} 字</option>)}{ui.preset === 'custom' && <option value="custom">已匯入字庫</option>}</select></label>
        <label>{isB1 ? '課次' : '課次／主題'}<select className={field} aria-label="課次" value={ui.chapter} onChange={e => change({ chapter: e.target.value })}><option value="all">全部 · {words.length} 字</option>{chapters.map(c => <option key={c.key} value={c.key}>{c.label} · {c.count} 字</option>)}</select></label>
      </div>
      {activeLevel === 'mixed' && <p className="vocab-note">這份字庫依主題整理，未標示每字的個別 CEFR 等級。</p>}
      <details className="vocab-chapters"><summary>瀏覽{isB1 ? '各課' : '主題'}進度 <span>{chapters.length} 個單元</span></summary><div className="vocab-chapter-grid">{chapters.map(c => {
        const items = words.filter(w => String(w.lesson || w.category) === c.key); const learned = items.filter(w => w.attempts > 0 || w.seen > 0).length;
        return <button key={c.key} className={ui.chapter === c.key ? 'selected' : ''} aria-pressed={ui.chapter === c.key} onClick={() => change({ chapter: c.key })}><strong>{c.label}</strong><span>{c.count} 字 · 已練 {learned} · 待複習 {items.filter(w => w.errors > 0).length}</span><progress max={c.count} value={learned} aria-label={`${c.label}已練習進度`}/></button>;
      })}</div></details>
    </section>
    <section className="vocab-study" aria-label="單字練習">
      <div className="vocab-toolbar"><div role="group" aria-label="練習模式" className="vocab-tabs">{modes.map(([id,label]) => <button key={id} aria-pressed={ui.mode === id} onClick={() => change({ mode:id })}>{label}</button>)}</div><button className={button} aria-label="語音與資料設定" aria-expanded={tools} onClick={() => setTools(v => !v)}><Settings2 size={18}/></button></div>
      <div className="vocab-filter-row"><div role="group" aria-label="單字篩選" className="vocab-filters">{[['all','全部'],['review','待複習'],['starred','收藏']].map(([id,label]) => <button key={id} aria-pressed={ui.filter === id} onClick={() => change({filter:id})}>{label}</button>)}</div><label className="vocab-search"><Search size={16}/><input aria-label="搜尋單字或中文" placeholder="搜尋單字或中文" value={query} onChange={e => { setQuery(e.target.value); change({}); }}/></label></div>
      {tools && <div className="vocab-tools"><label className="md:hidden">切換字庫<select className={field} aria-label="手機字庫" value={ui.preset} disabled={loading} onChange={e => loadPreset(presets.find(p => p.id === e.target.value))}>{presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}{ui.preset === 'custom' && <option value="custom">自訂字庫</option>}</select></label><label>德語人聲<select className={field} value={voice} onChange={e => { setVoice(e.target.value); saveAudio({selectedURI:e.target.value}); }}><option value="">系統德語人聲</option>{voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}</select></label><label>語速<select className={field} value={rate} onChange={e => { setRate(Number(e.target.value)); saveAudio({rate:Number(e.target.value)}); }}>{[0.6,0.8,0.9,1,1.2].map(r => <option key={r} value={r}>{r}×</option>)}</select></label><button className={button} onClick={exportBackup}><Download size={16}/>匯出備份</button><button className={button} onClick={() => fileInput.current?.click()}><Upload size={16}/>匯入 JSON</button><input type="file" accept=".json,application/json" ref={fileInput} hidden onChange={importBackup}/></div>}
      {speechMessage && <p role="status" className="vocab-message">{speechMessage}</p>}
      {error && <p role="alert" className="vocab-error">{error} <button onClick={() => loadPreset(selectedPreset || presets.find(p => p.id === DEFAULT_PRESET))}>重新載入字庫</button></p>}
      {message && <div className="vocab-message" role="status">{message}<button aria-label="關閉訊息" onClick={() => setMessage('')}>×</button></div>}
      {loading ? <p role="status" className="vocab-empty">正在載入字庫…</p> : !current ? <div className="vocab-empty"><Check size={28}/><h3>{ui.filter === 'review' ? '這個範圍沒有待複習單字' : '沒有符合條件的單字'}</h3><p>可以切換課次、模式或清除篩選繼續學習。</p><button className={button} onClick={() => { setQuery(''); change({ filter:'all', chapter:'all', mode:'learn' }); }}>查看全部單字</button></div> : ui.mode === 'list' ? <div className="vocab-dictionary">{filtered.map(w => <article key={wordKey(w)}><div><h3 lang="de">{w.article} {w.word}</h3><p>{w.meaning}</p><small>{POS_LABELS[w.pos] || w.pos} · {w.category}</small>{w.example && <p lang="de">{w.example}</p>}{w.exampleZh && <p>{w.exampleZh}</p>}</div><button className={button} aria-label={`播放 ${w.word}`} onClick={() => speak(w.word)}><Volume2 size={18}/></button></article>)}</div> : <>
        <div className="vocab-card-meta"><span>{chapters.find(c => c.key === ui.chapter)?.label || '全部課次'} · {Math.min(ui.index + 1, Math.max(filtered.length,1))} / {Math.max(filtered.length,answeredWord ? 1 : 0)}</span><button className={button} aria-label={current.starred ? '取消收藏' : '收藏單字'} aria-pressed={!!current.starred} onClick={() => { updateWord({starred:!current.starred}); if(answeredWord) setAnsweredWord(w => ({...w,starred:!w.starred})); }}><Star size={17} fill={current.starred ? 'currentColor' : 'none'}/></button></div>
        <div className="vocab-card" key={`${wordKey(current)}-${ui.mode}`}>
          <span className="vocab-pos">{ui.mode === 'pos' && !feedback ? '判斷詞性' : POS_LABELS[current.pos] || current.pos}</span>
          {ui.mode === 'spell' ? <><h3>{current.meaning}</h3><button className={button} onClick={() => speak(current.word)}><Volume2 size={19}/>播放單字</button></> : <><h3 lang="de">{ui.mode === 'learn' && current.article && <span className="vocab-article">{current.article} </span>}{current.word}</h3><button className="vocab-audio" aria-label="播放單字發音" onClick={() => speak(current.word)}><Volume2 size={22}/></button>{ui.mode !== 'learn' && <p>{current.meaning}</p>}</>}
          {ui.mode === 'learn' && <><button className={button} aria-expanded={flipped} onClick={() => {setFlipped(v => !v); if(!flipped) updateWord({seen:(current.seen || 0)+1});}}><RotateCcw size={16}/>{flipped ? '收起解釋' : '顯示解釋與例句'}</button>{flipped && <div className="vocab-explanation"><strong>{current.meaning}</strong>{current.plural && current.plural !== '-' && <p>複數：{current.plural}</p>}<PracticeDetails practice={current.practice}/>{current.example && <p lang="de">{current.example} <button aria-label="播放例句" onClick={() => speak(current.example)}><Volume2 size={16}/></button></p>}<p>{current.exampleZh}</p></div>}</>}
          {ui.mode === 'article' && <div className="vocab-answers">{['der','die','das'].map(a => <button key={a} disabled={!!feedback} onClick={() => submit(a)}>{a}</button>)}</div>}
          {ui.mode === 'pos' && <div className="vocab-answers">{[...new Set(['noun','verb','adjective','adverb','connector','preposition','phrase',current.pos])].map(p => <button key={p} disabled={!!feedback} onClick={() => submit(p)}>{POS_LABELS[p] || p}</button>)}</div>}
          {ui.mode === 'spell' && <form className="vocab-spelling" onSubmit={e => {e.preventDefault();submit(answer);}}><label htmlFor="vocab-answer">輸入聽到的單字（注意名詞大寫）</label><input id="vocab-answer" className={field} autoComplete="off" autoCapitalize="none" spellCheck={false} disabled={!!feedback} value={answer} onChange={e => setAnswer(e.target.value)}/><div className="vocab-umlauts">{['ä','ö','ü','ß'].map(char => <button type="button" key={char} disabled={!!feedback} onClick={() => setAnswer(a => a + char)}>{char}</button>)}</div><button className={button} disabled={!!feedback || !answer.trim()}>檢查答案</button></form>}
        </div>
        {feedback && <div role="status" className={`vocab-feedback ${feedback.correct ? 'correct' : 'incorrect'}`}><strong>{feedback.correct ? '答對了！' : `正確答案：${ui.mode === 'pos' ? POS_LABELS[feedback.expected] || feedback.expected : feedback.expected}`}</strong><p>{ui.mode === 'article' ? articleExplanation(current) : ui.mode === 'spell' ? `正確拼寫：${current.word}。留意大小寫與變音字母。` : `${current.word} 是${POS_LABELS[current.pos] || current.pos}。`}</p>{current.example && <p lang="de">{current.example}</p>}{current.exampleZh && <p>{current.exampleZh}</p>}<small>{feedback.correct ? '已從待複習清單移除。' : '已加入待複習清單。'}讀完後再繼續下一題。</small></div>}
        <div className="vocab-navigation"><button className={button} onClick={() => move(-1)}><ArrowLeft size={17}/>上一個</button><span>本次作答 {session.done} · 答對 {session.correct}</span><button className="vocab-primary" onClick={() => move(1)}>下一個<ArrowRight size={17}/></button></div>
      </>}
    </section>
  </div>;
}
