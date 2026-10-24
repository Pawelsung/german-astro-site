import React, { useEffect, useRef, useState } from 'react';
import { ROUND_EVENT, ROUND_PROGRESS_EVENT, playAnswerSound, roundProgress } from '../lib/answerFeedback';
import { getActivity } from '../lib/dailyActivity.mjs';

// Delay so the explanation of the tenth answer can be seen before the summary covers it.
const OPEN_DELAY_MS = 1200;

function verdict(correct, total) {
  const ratio = correct / total;
  if (ratio === 1) return '滿分！太厲害了 🎉';
  if (ratio >= 0.8) return '很棒，繼續保持！';
  if (ratio >= 0.5) return '不錯！把錯的再看一次會更穩。';
  return '先看一下重點卡，再來一輪會更順。';
}

function ScoreRing({ correct, total }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="round-ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} className="round-ring-track" />
        <circle cx="50" cy="50" r={radius} className="round-ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - correct / total)} />
      </svg>
      <div className="round-ring-label"><strong>{correct}</strong><span>/ {total}</span></div>
    </div>
  );
}

export default function RoundSummary() {
  const [progress, setProgress] = useState(() => roundProgress());
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState(null);
  const primary = useRef(null);

  useEffect(() => {
    let timer = null;
    const onProgress = (event) => setProgress(event.detail);
    const onComplete = (event) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSummary(event.detail);
        setActivity(getActivity());
        if (event.detail.correct / event.detail.total >= 0.8) {
          playAnswerSound(true);
          setTimeout(() => playAnswerSound(true), 160);
        }
      }, OPEN_DELAY_MS);
    };
    window.addEventListener(ROUND_PROGRESS_EVENT, onProgress);
    window.addEventListener(ROUND_EVENT, onComplete);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(ROUND_PROGRESS_EVENT, onProgress);
      window.removeEventListener(ROUND_EVENT, onComplete);
    };
  }, []);

  useEffect(() => {
    if (!summary) return undefined;
    primary.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') setSummary(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [summary]);

  function openConcept() {
    setSummary(null);
    const card = document.getElementById('concept-card');
    if (!card) return;
    card.open = true;
    // Scroll once the overlay is gone, otherwise the page's own scroll restoration wins.
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  return (
    <>
      <span className="round-pill" title="每 10 題為一輪，做完會顯示結算" aria-label={`本輪進度 ${progress.answered} / ${progress.size}`}>
        <span className="round-pill-bar"><span style={{ width: `${(progress.answered / progress.size) * 100}%` }} /></span>
        <span>{progress.answered}/{progress.size}</span>
      </span>

      {summary && (
        <div className="round-overlay" data-round-summary onClick={(event) => { if (event.target === event.currentTarget) setSummary(null); }}>
          <section className="round-modal" role="dialog" aria-modal="true" aria-labelledby="round-title">
            <p className="round-kicker">第 {summary.round} 輪完成</p>
            <h2 id="round-title" className="round-title">{verdict(summary.correct, summary.total)}</h2>
            <div className="round-score">
              <ScoreRing correct={summary.correct} total={summary.total} />
              {activity && (
                <ul className="round-stats">
                  <li><strong>{Math.round((summary.correct / summary.total) * 100)}%</strong> 本輪正確率</li>
                  <li><strong>{activity.todayAnswered}</strong> 今天已作答</li>
                  <li><strong>{activity.streak || 1}</strong> 天連續學習</li>
                </ul>
              )}
            </div>
            {summary.mistakes.length > 0 && (
              <div className="round-mistakes">
                <p>這幾題再看一次：</p>
                <ul>
                  {summary.mistakes.map((label, index) => <li key={`${label}-${index}`} lang="de">{label}</li>)}
                </ul>
              </div>
            )}
            <div className="round-actions">
              <button ref={primary} type="button" className="round-primary" onClick={() => setSummary(null)}>再來一輪</button>
              {document.getElementById('concept-card') && <button type="button" className="round-secondary" onClick={openConcept}>看重點卡</button>}
              <a className="round-secondary" href="/">回首頁</a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
