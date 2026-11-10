import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MoreHorizontal } from 'lucide-react';
import { BottomSheet, PickerRow } from './BottomSheet.jsx';
import { LessonMenu, openConcept } from './LessonMenu.jsx';
import { answerCue, playAnswerSound } from '../../lib/answerFeedback';
import { getActivity } from '../../lib/dailyActivity.mjs';
import { isReviewRequested, readJSON, writeJSON } from '../../lib/progressStorage';
import { cleanSelection, emptySelection, roundVerdict, takeRound } from '../../lib/lessonRound.mjs';
import { ROUND_SIZE } from '../../lib/roundTracker.mjs';

// With this as the random source, shuffling leaves the order unchanged.
const KEEP_ORDER = () => 0.9999;

// The same start, question and result screens for every grammar lesson.
// A lesson supplies its items and renderQuestion; progress stays in that lesson's own storage.
// filters: [{ id, label, options: [{ id, label }], alwaysShow? }], the first option being the default; itemsFor gets { [filterId]: optionId }.
// panels open from the ⋯ menu (see LessonMenu); featuredPanels also get a link on the start page.
// report(null) records a card that was looked at but not scored.
export default function LessonApp({ lessonKey, title, blurb, filters, itemsFor, reviewItems, records = [], panels = [], featuredPanels = [], isSequential, unit = () => '題', renderQuestion }) {
  const scopeKey = `gw-lesson-filters-${lessonKey}`;
  const [selection, setSelection] = useState(() => cleanSelection(readJSON(scopeKey, null), filters));
  const [phase, setPhase] = useState('start');
  const [run, setRun] = useState(null);
  const [activity, setActivity] = useState(null);
  const queue = useRef([]);
  const rounds = useRef(0);
  const scopeSheet = useRef(null);
  const menu = useRef(null);
  const reviewCount = reviewItems().length;
  const scopeCount = itemsFor(selection).length;
  const scopeLabels = filters.flatMap(filter => {
    const chosen = filter.options.find(option => option.id === selection[filter.id]);
    return chosen && (filter.alwaysShow || chosen.id !== filter.options[0].id) ? [chosen.label] : [];
  });
  const results = run ? Object.values(run.results) : [];

  function begin(review) {
    const pool = review ? reviewItems() : itemsFor(selection);
    const taken = takeRound(review ? [] : queue.current, pool, !review && isSequential?.(selection) ? { random: KEEP_ORDER } : {});
    if (!review) queue.current = taken.queue;
    if (!taken.round.length) { setPhase(review ? 'clear' : 'start'); return; }
    rounds.current += 1;
    setRun({ items: taken.round, review, pos: 0, results: {}, number: rounds.current });
    setPhase('session');
  }

  useEffect(() => { if (isReviewRequested() && reviewItems().length) begin(true); }, []);

  function applyFilters(patch) {
    const next = { ...emptySelection(filters), ...patch };
    setSelection(next);
    queue.current = [];
    writeJSON(scopeKey, next);
    menu.current?.close();
    setPhase('start');
  }

  function chooseFilter(filterId, optionId) {
    const next = { ...selection, [filterId]: optionId };
    setSelection(next);
    queue.current = [];
    writeJSON(scopeKey, next);
    if (filters.length === 1) scopeSheet.current?.close();
  }

  function advance() {
    if (run.pos + 1 < run.items.length) { setRun({ ...run, pos: run.pos + 1 }); return; }
    if (!results.length) { setPhase('start'); return; }
    setActivity(getActivity());
    setPhase('result');
    const scored = results.filter(item => item.correct !== null);
    if (scored.length && scored.filter(item => item.correct).length / scored.length >= 0.8) {
      playAnswerSound(true);
      setTimeout(() => playAnswerSound(true), 160);
    }
  }

  // Keyed by position, so going back and answering again replaces that question's result.
  function report(correct, label) {
    if (correct !== null) answerCue(correct, label);
    setRun(prev => ({ ...prev, results: { ...prev.results, [prev.pos]: { correct, label } } }));
  }

  const back = phase === 'start'
    ? <a className="calm-icon" href="/" aria-label="回首頁"><ArrowLeft size={22}/></a>
    : <button type="button" className="calm-icon" aria-label="回到開始頁" onClick={() => setPhase('start')}><ArrowLeft size={22}/></button>;
  const scored = results.filter(item => item.correct !== null);
  const correctCount = scored.filter(item => item.correct).length;
  const mistakes = scored.filter(item => !item.correct && item.label);
  const currentItem = phase === 'session' ? run.items[run.pos] : null;

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
          <span>{scopeLabels.join(' · ') || '全部範圍'}</span>
          <span className="picker-trigger-group">{scopeCount} {unit(selection)}</span>
          <ChevronDown size={20} aria-hidden="true"/>
        </button>
        <button type="button" className="calm-primary" disabled={!scopeCount} onClick={() => begin(false)}>{scopeCount ? `開始 ${Math.min(ROUND_SIZE, scopeCount)} ${unit(selection)}` : '這個範圍沒有題目'}</button>
        {reviewCount > 0 && <button type="button" className="calm-secondary" onClick={() => begin(true)}>待複習 {reviewCount} 題</button>}
        <div className="lf-links">
          <button type="button" className="calm-link" onClick={openConcept}>看 1 分鐘重點</button>
          {panels.filter(item => featuredPanels.includes(item.id)).map(item => <button key={item.id} type="button" className="calm-link" onClick={() => menu.current?.open(item.id)}>{item.title}</button>)}
        </div>
      </section>}

      {phase === 'session' && <div className="lf-session">
        <div className="calm-progress" aria-hidden="true"><span style={{ width: `${((run.pos + 1) / run.items.length) * 100}%` }}/></div>
        {renderQuestion({
          key: `${run.number}-${run.pos}`,
          item: currentItem,
          selection,
          review: run.review,
          isLast: run.pos + 1 >= run.items.length,
          report,
          next: advance,
          prev: run.pos > 0 ? () => setRun({ ...run, pos: run.pos - 1 }) : undefined
        })}
      </div>}

      {phase === 'result' && <section className="lf-start fx-enter">
        <p className="lf-kicker">{run.review ? '複習完成' : '這一輪完成'}</p>
        <h1>{scored.length ? roundVerdict(correctCount, scored.length) : `看完 ${results.length} 張字卡`}</h1>
        {scored.length > 0 && <p className="lf-score"><strong>{correctCount}</strong> / {scored.length}</p>}
        {activity && scored.length > 0 && <p>今天已作答 {activity.todayAnswered} 題 · 連續 {activity.streak || 1} 天</p>}
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
        {filters.map(filter => <React.Fragment key={filter.id}>
          {filters.length > 1 && <p className="picker-status">{filter.label}</p>}
          {filter.options.map(option => {
            const count = itemsFor({ ...selection, [filter.id]: option.id }).length;
            return <PickerRow key={option.id} title={option.label} detail={`${count} ${unit({ ...selection, [filter.id]: option.id })}`} selected={selection[filter.id] === option.id} disabled={!count && selection[filter.id] !== option.id} onClick={() => chooseFilter(filter.id, option.id)}/>;
          })}
        </React.Fragment>)}
      </div>
      {filters.length > 1 && <button type="button" className="calm-primary picker-done" onClick={() => scopeSheet.current?.close()}>完成（{scopeCount} {unit(selection)}）</button>}
    </BottomSheet>

    <LessonMenu ref={menu} records={records} panels={panels} panelArgs={{ item: currentItem, selection, setFilters: applyFilters }}/>
  </div>;
}
