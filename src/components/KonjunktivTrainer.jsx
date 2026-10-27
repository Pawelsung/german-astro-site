import React, { useMemo, useState } from 'react';
import { CheckCircle, Play, RotateCcw, Volume2, XCircle } from 'lucide-react';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { PROGRESS_KEYS, isReviewRequested, needsReview, readProgressMap } from '../lib/progressStorage';
import { answerCue, useAnswerShortcuts, useRevealOnShow } from '../lib/answerFeedback';
import { fillBlank, formExercises, formPhrase } from '../lib/konjunktiv.mjs';
import { STAGES, konjunktivExercises } from '../data/lesson7-konjunktiv';

const ALL_ITEMS = [...formExercises(), ...konjunktivExercises];
const loadProgress = () => readProgressMap(PROGRESS_KEYS.lesson7);
const cx = (...values) => values.filter(Boolean).join(' ');

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The German text read aloud and shown in the feedback once the item is answered.
function solvedText(item) {
  if (item.stage === 'forms') return formPhrase(item);
  if (item.stage === 'transform') return item.options[0];
  if (item.stage === 'function') return item.sentence;
  return fillBlank(item.sentence, item.options[0]);
}

function Sentence({ item, picked }) {
  const [before, after] = item.sentence.split('___');
  return (
    <p lang="de" className="text-lg sm:text-2xl font-bold leading-relaxed text-slate-800 break-words">
      {before}
      {picked
        ? <span className="mx-1 rounded-md bg-emerald-100 px-1.5 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">{item.options[0]}</span>
        : <span className="mx-1 mb-1 inline-block w-16 border-b-4 border-emerald-400 sm:w-24" />}
      {after}
    </p>
  );
}

function Prompt({ item, picked }) {
  if (item.stage === 'forms') {
    return (
      <div className="text-center">
        <p lang="de" className="text-2xl sm:text-4xl font-extrabold text-slate-800">
          {item.pronoun}{' '}
          {picked
            ? <span className="rounded-md bg-emerald-100 px-2 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">{item.options[0]}</span>
            : <span className="inline-block w-20 border-b-4 border-emerald-400 align-middle sm:w-28" />}
        </p>
        <p className="mt-3 text-sm font-bold text-slate-500"><span lang="de">{item.verb.infinitive}</span>（{item.verb.meaning}）的 Konjunktiv II</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {item.fact && (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/60">
          <span className="mr-2 text-xs font-black text-slate-400">原句</span>
          <span lang="de" className="font-bold">{item.fact}</span>
        </p>
      )}
      {item.stage === 'transform' && <p className="text-sm font-bold text-slate-500">選出正確的 Konjunktiv II 句子：</p>}
      {item.stage === 'function' && <p lang="de" className="text-lg sm:text-2xl font-bold leading-relaxed text-slate-800">{item.sentence}</p>}
      {item.sentence && item.stage !== 'function' && <Sentence item={item} picked={picked} />}
    </div>
  );
}

export default function KonjunktivTrainer() {
  const [progress, setProgress] = useStoredProgress(PROGRESS_KEYS.lesson7, loadProgress);
  const [reviewOnly, setReviewOnly] = useState(() => isReviewRequested());
  const [stage, setStage] = useState('all');
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const { speak } = useGermanSpeech();

  // The deck is fixed when stage, review mode or round changes, so answering does not reshuffle it.
  const deck = useMemo(() => {
    const pool = reviewOnly
      ? ALL_ITEMS.filter((item) => needsReview(progress[item.id]))
      : ALL_ITEMS.filter((item) => stage === 'all' || item.stage === stage);
    return shuffle(pool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, reviewOnly, round]);

  const current = deck[index % Math.max(deck.length, 1)];
  const options = useMemo(() => (current ? shuffle(current.options) : []), [current?.id, round, index]);
  const answer = current?.options[0];

  const items = Object.values(progress);
  const answeredCount = items.filter((item) => item?.answered).length;
  const correctTotal = items.reduce((sum, item) => sum + (item?.correct || 0), 0);
  const attemptTotal = items.reduce((sum, item) => sum + (item?.correct || 0) + (item?.wrong || 0), 0);
  const reviewCount = items.filter(needsReview).length;

  function choose(option) {
    if (!current || picked) return;
    const correct = option === answer;
    setPicked(option);
    answerCue(correct, solvedText(current));
    speak(solvedText(current));
    setProgress((prev) => {
      const before = prev[current.id] || {};
      return {
        ...prev,
        [current.id]: {
          ...before,
          answered: true,
          correct: (before.correct || 0) + Number(correct),
          wrong: (before.wrong || 0) + Number(!correct),
          lastCorrect: correct,
          needsReview: !correct,
          updatedAt: new Date().toISOString()
        }
      };
    });
  }

  function next() {
    setPicked(null);
    // In review mode a correct answer leaves the deck, so rebuild it from the remaining items.
    if (reviewOnly) { setRound((value) => value + 1); setIndex(0); return; }
    if (index + 1 >= deck.length) { setRound((value) => value + 1); setIndex(0); return; }
    setIndex((value) => value + 1);
  }

  function changeStage(id) {
    setStage(id);
    setReviewOnly(false);
    setIndex(0);
    setPicked(null);
  }

  useAnswerShortcuts({ options, answered: !!picked, onSelect: choose, onNext: next, enabled: !!current });
  const feedbackRef = useRevealOnShow(picked);
  const stageInfo = STAGES.find((item) => item.id === current?.stage);
  const wide = current?.stage === 'transform';
  const isCorrect = picked && picked === answer;

  return (
    <div className="mx-auto grid max-w-3xl gap-3 text-slate-800">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar" role="group" aria-label="練習範圍">
        {[{ id: 'all', label: '全部' }, ...STAGES].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={!reviewOnly && stage === item.id}
            onClick={() => changeStage(item.id)}
            className={cx(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-black sm:text-sm',
              !reviewOnly && stage === item.id
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs font-bold text-slate-500">
        <span>已作答 <b className="text-slate-800">{answeredCount}</b> / {ALL_ITEMS.length}</span>
        <span>正確率 <b className="text-slate-800">{attemptTotal ? `${Math.round((correctTotal / attemptTotal) * 100)}%` : '—'}</b></span>
        <span>待複習 <b className="text-rose-600">{reviewCount}</b></span>
        {reviewOnly && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">錯題複習中</span>}
      </div>

      {!current ? (
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm dark:border-slate-700">
          <CheckCircle className="mx-auto mb-3 text-emerald-500" size={32} />
          <p className="font-black">{reviewOnly ? '錯題都複習完了！' : '這個範圍沒有題目'}</p>
          <button type="button" onClick={() => changeStage('all')} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">練習全部題目</button>
        </div>
      ) : (
        <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{stageInfo?.label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500 dark:bg-slate-800">{current.level}</span>
            </div>
            <span className="text-xs font-bold text-slate-400">{(index % deck.length) + 1} / {deck.length}</span>
          </div>
          <p className="mb-3 text-xs font-bold text-slate-400">{stageInfo?.hint}</p>

          <div className="mb-5 min-h-[96px]">
            <Prompt item={current} picked={picked} />
          </div>

          <div className={cx('grid gap-2 sm:gap-3', wide ? 'grid-cols-1' : 'grid-cols-2')}>
            {options.map((option, idx) => {
              const state = !picked ? 'open' : option === answer ? 'right' : option === picked ? 'wrong' : 'rest';
              return (
                <button
                  key={`${current.id}-${option}`}
                  type="button"
                  data-answer-option
                  disabled={!!picked}
                  onClick={() => choose(option)}
                  lang={current.stage === 'function' ? undefined : 'de'}
                  className={cx(
                    'inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 py-3 font-bold shadow-sm transition active:scale-[0.98]',
                    wide ? 'justify-start text-left text-sm sm:text-base' : 'justify-center text-base sm:text-lg',
                    state === 'open' && 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800',
                    state === 'right' && 'fx-correct border-green-500 bg-green-100 text-green-700',
                    state === 'wrong' && 'fx-wrong border-red-500 bg-red-100 text-red-700',
                    state === 'rest' && 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                  )}
                >
                  {!picked && idx < 9 && <span className="kbd-hint" aria-hidden="true">{idx + 1}</span>}
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          <div
            ref={feedbackRef}
            key={picked ? 'answered' : 'open'}
            role="status"
            className={cx(
              'mt-5 scroll-mb-6 rounded-2xl border p-3 sm:p-4',
              picked && 'fx-enter',
              !picked && 'border-slate-100 bg-slate-50 text-slate-600',
              picked && isCorrect && 'border-green-200 bg-green-50 text-green-800',
              picked && !isCorrect && 'border-red-200 bg-red-50 text-red-800'
            )}
          >
            {picked ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 font-extrabold">
                  {isCorrect ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  {isCorrect ? '正確' : `正確答案：${current.stage === 'transform' ? '見下方' : answer}`}
                </p>
                <p lang="de" className="flex items-start gap-2 font-bold text-slate-800">
                  <button type="button" onClick={() => speak(solvedText(current))} aria-label="再聽一次" className="mt-0.5 shrink-0 rounded-full p-1 hover:bg-white/60"><Volume2 size={16} /></button>
                  <span>{solvedText(current)}</span>
                </p>
                {current.trans && <p className="text-sm text-slate-600">{current.trans}</p>}
                <p className="text-sm text-slate-700">{current.explain}</p>
              </div>
            ) : (
              <p className="text-sm font-bold">選出答案，或先看下一題。</p>
            )}
            <button
              type="button"
              onClick={next}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-extrabold shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              {picked ? '下一題' : '跳過'} <Play size={16} className="fill-current" />
              {picked && <span className="kbd-hint" aria-hidden="true">Enter</span>}
            </button>
          </div>
        </section>
      )}

      {reviewCount > 0 && !reviewOnly && (
        <button type="button" onClick={() => { setReviewOnly(true); setIndex(0); setPicked(null); setRound((v) => v + 1); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 dark:border-rose-900/60">
          <RotateCcw size={16} /> 只練錯題（{reviewCount}）
        </button>
      )}
    </div>
  );
}
