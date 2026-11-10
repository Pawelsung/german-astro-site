import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MoreHorizontal } from 'lucide-react';
import { BottomSheet, PickerRow } from './BottomSheet.jsx';
import { SOUND_STORAGE_KEY, answerCue, isSoundEnabled, playAnswerSound } from '../../lib/answerFeedback';
import { getActivity } from '../../lib/dailyActivity.mjs';
import { LESSON_LINKS } from '../../lib/lessonLinks.mjs';
import { isReviewRequested, readJSON, writeJSON } from '../../lib/progressStorage';
import { roundVerdict, takeRound } from '../../lib/lessonRound.mjs';
import { ROUND_SIZE } from '../../lib/roundTracker.mjs';

const openConcept = () => document.getElementById('lesson-concept')?.showModal();

// The same start, question and result screens for every grammar lesson.
// A lesson supplies its items and renderQuestion; progress stays in that lesson's own storage.
export default function LessonApp({ lessonKey, title, blurb, scopes, itemsFor, reviewItems, records = [], renderQuestion }) {
  const scopeKey = `gw-lesson-scope-${lessonKey}`;
  const [scope, setScope] = useState(() => {
    const saved = readJSON(scopeKey, 'all');
    return scopes.some(item => item.id === saved) ? saved : 'all';
  });
  const [phase, setPhase] = useState('start');
  const [run, setRun] = useState(null);
  const [activity, setActivity] = useState(null);
  const [sound, setSound] = useState(isSoundEnabled);
  const queue = useRef([]);
  const rounds = useRef(0);
  const scopeSheet = useRef(null);
  const menu = useRef(null);
  const reviewCount = reviewItems().length;
  const currentScope = scopes.find(item => item.id === scope) || scopes[0];

  function begin(review) {
    const pool = review ? reviewItems() : itemsFor(scope);
    const taken = takeRound(review ? [] : queue.current, pool);
    if (!review) queue.current = taken.queue;
    if (!taken.round.length) { setPhase(review ? 'clear' : 'start'); return; }
    rounds.current += 1;
    setRun({ items: taken.round, review, pos: 0, results: [], number: rounds.current });
    setPhase('session');
  }

  useEffect(() => { if (isReviewRequested() && reviewItems().length) begin(true); }, []);

  function chooseScope(id) {
    setScope(id);
    queue.current = [];
    writeJSON(scopeKey, id);
    scopeSheet.current?.close();
  }

  function finish(results) {
    if (!results.length) { setPhase('start'); return; }
    setActivity(getActivity());
    setPhase('result');
    if (results.filter(item => item.correct).length / results.length >= 0.8) {
      playAnswerSound(true);
      setTimeout(() => playAnswerSound(true), 160);
    }
  }

  function advance() {
    if (run.pos + 1 >= run.items.length) finish(run.results);
    else setRun({ ...run, pos: run.pos + 1 });
  }

  function report(correct, label) {
    answerCue(correct, label);
    setRun(prev => ({ ...prev, results: [...prev.results, { correct, label }] }));
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    try { localStorage.setItem(SOUND_STORAGE_KEY, String(next)); } catch { /* the choice lasts for this page only */ }
  }

  function showConcept() {
    menu.current?.close();
    openConcept();
  }

  const back = phase === 'start'
    ? <a className="calm-icon" href="/" aria-label="回首頁"><ArrowLeft size={22}/></a>
    : <button type="button" className="calm-icon" aria-label="回到開始頁" onClick={() => setPhase('start')}><ArrowLeft size={22}/></button>;
  const here = typeof window === 'undefined' ? '' : window.location.pathname.replace(/\/$/, '');
  const correctCount = run ? run.results.filter(item => item.correct).length : 0;
  const mistakes = run ? run.results.filter(item => !item.correct && item.label) : [];

  return <div className="calm-page">
    <header className="calm-bar">
      <div className="calm-bar-side">{back}</div>
      <div className="calm-bar-center">{phase === 'session' ? `${run.pos + 1} / ${run.items.length}` : ''}</div>
      <div className="calm-bar-side calm-bar-end"><button type="button" className="calm-icon" aria-label="更多選項" aria-haspopup="dialog" onClick={() => menu.current?.open()}><MoreHorizontal size={22}/></button></div>
    </header>
    <main className="calm-main">
      {phase === 'start' && <section className="lf-start fx-enter">
        <h1>{title}</h1>
        <p>{blurb}</p>
        <button type="button" className="picker-trigger" aria-haspopup="dialog" onClick={() => scopeSheet.current?.open()}>
          <span>{currentScope.label}</span>
          <span className="picker-trigger-group">{currentScope.count} 題</span>
          <ChevronDown size={20} aria-hidden="true"/>
        </button>
        <button type="button" className="calm-primary" onClick={() => begin(false)}>開始 {Math.min(ROUND_SIZE, currentScope.count)} 題</button>
        {reviewCount > 0 && <button type="button" className="calm-secondary" onClick={() => begin(true)}>待複習 {reviewCount} 題</button>}
        <button type="button" className="calm-link" onClick={openConcept}>看 1 分鐘重點</button>
      </section>}

      {phase === 'session' && <div className="lf-session">
        <div className="calm-progress" aria-hidden="true"><span style={{ width: `${((run.pos + 1) / run.items.length) * 100}%` }}/></div>
        {renderQuestion({
          key: `${run.number}-${run.pos}`,
          item: run.items[run.pos],
          isLast: run.pos + 1 >= run.items.length,
          report,
          next: advance
        })}
      </div>}

      {phase === 'result' && <section className="lf-start fx-enter">
        <p className="lf-kicker">{run.review ? '複習完成' : '這一輪完成'}</p>
        <h1>{roundVerdict(correctCount, run.results.length)}</h1>
        <p className="lf-score"><strong>{correctCount}</strong> / {run.results.length}</p>
        {activity && <p>今天已作答 {activity.todayAnswered} 題 · 連續 {activity.streak || 1} 天</p>}
        {mistakes.length > 0 && <div className="lf-mistakes">
          <p>這幾題再看一次：</p>
          <ul>{mistakes.map((item, index) => <li key={`${item.label}-${index}`} lang="de">{item.label}</li>)}</ul>
        </div>}
        <button type="button" className="calm-primary" onClick={() => begin(run.review)}>{run.review ? '繼續複習' : '再來一輪'}</button>
        <button type="button" className="calm-link" onClick={openConcept}>看 1 分鐘重點</button>
      </section>}

      {phase === 'clear' && <section className="lf-start fx-enter">
        <h1>錯題都複習完了！</h1>
        <p>答對的題目已經從待複習移除。</p>
        <button type="button" className="calm-primary" onClick={() => setPhase('start')}>回到開始頁</button>
      </section>}
    </main>

    <BottomSheet ref={scopeSheet} title="選擇範圍">
      <div className="picker-list">
        {scopes.map(item => <PickerRow key={item.id} title={item.label} detail={`${item.count} 題`} selected={item.id === scope} onClick={() => chooseScope(item.id)}/>)}
      </div>
    </BottomSheet>

    <BottomSheet ref={menu} title="更多選項">
      <div className="picker-list">
        {records.length > 0 && <dl className="lf-records">{records.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <PickerRow title="看 1 分鐘重點" onClick={showConcept}/>
        <PickerRow title={`答題音效：${sound ? '開' : '關'}`} onClick={toggleSound}/>
        <p className="picker-status">換一課</p>
        <nav className="lf-lessons" aria-label="切換學習主題">
          {LESSON_LINKS.map(([href, label]) => <a key={href} href={href} aria-current={here === href.replace(/\/$/, '') ? 'page' : undefined}>{label}</a>)}
        </nav>
        <a className="calm-link" href="/">回首頁</a>
      </div>
    </BottomSheet>
  </div>;
}
