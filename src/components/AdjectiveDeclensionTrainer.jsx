import { useStoredProgress } from '../hooks/useStoredProgress';
import { needsReview as itemNeedsReview, readProgressMap } from '../lib/progressStorage';
import { isReviewRequested } from '../lib/progressStorage';
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, RotateCcw, Star, XCircle } from 'lucide-react';
import lessonData from '../data/lesson6-adjective-declension';
import { loadLesson6Progress, saveLesson6Progress } from '../lib/progressStorage';
import { answerCue, useAnswerShortcuts, useRevealOnShow } from '../lib/answerFeedback';
import { splitArticle } from '../lib/grammarColors.mjs';

const MODE_LABELS = {
  concept: '概念',
  'quick-drill': '快速練習',
  'case-detective': '格位偵探',
  'dativ-focus': 'Dativ 特訓',
  'sentence-upgrade': '句子升級',
  'error-fix': '錯誤修正'
};

const STAGE_LABELS = {
  1: '概念暖身',
  2: '定冠詞',
  3: '不定冠詞 / Akkusativ',
  4: 'Dativ',
  5: 'B1 挑戰'
};

const ARTICLE_LABELS = {
  definite: '定冠詞',
  indefinite: '不定冠詞',
  zero: '無冠詞'
};

const CASE_LABELS = {
  nominativ: 'Nominativ',
  akkusativ: 'Akkusativ',
  dativ: 'Dativ'
};

const ENDING_PATTERN = /(er|en|es|em|e)$/;

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function HighlightedGerman({ text }) {
  const words = String(text).split(/(\s+)/);

  return (
    <>
      {words.map((word, index) => {
        if (/^\s+$/.test(word)) return word;
        const clean = word.replace(/[.,!?;:)]*$/, '');
        const trailing = word.slice(clean.length);
        const match = clean.match(ENDING_PATTERN);
        if (!match || clean.length <= match[0].length + 1) {
          return <React.Fragment key={`${word}-${index}`}>{word}</React.Fragment>;
        }

        const stem = clean.slice(0, -match[0].length);
        return (
          <React.Fragment key={`${word}-${index}`}>
            {stem}
            <span className="rounded bg-rose-100 px-0.5 font-black text-rose-700">{match[0]}</span>
            {trailing}
          </React.Fragment>
        );
      })}
    </>
  );
}

function rotateOptions(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return [];
  const clean = Array.from(new Set(options));
  const shift = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % clean.length;
  return [...clean.slice(shift), ...clean.slice(0, shift)];
}

function getItemProgress(progress, id) {
  return progress[id] || {};
}

function optionIsLong(options = []) {
  return options.some((option) => String(option).length > 34);
}

function DeclensionTable({ table }) {
  return (
    <div className="grid gap-2">
      {table.rows.map((row) => (
        <div key={row.caseName} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-black text-slate-500">{row.caseName}</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-4">
            {[
              ['陽性', row.masculine],
              ['陰性', row.feminine],
              ['中性', row.neuter],
              ['複數', row.plural]
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-lg bg-white px-2.5 py-2">
                <div className="text-[10px] font-black text-slate-400">{label}</div>
                <div className="mt-0.5 break-words text-slate-800">
                  <HighlightedGerman text={value} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConceptPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('concepts');
  const tableTabs = [
    ['definite', '定冠詞'],
    ['indefinite', '不定冠詞'],
    ['zero', '無冠詞']
  ];
  const activeTable = lessonData.declensionTables[activeTab];

  return (
    <section className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm md:p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h3 className="text-sm font-black text-slate-800">文法速查</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">點上方分頁切換內容；看完可收合回到練習題。</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab('concepts')}
              className={cx('rounded-lg px-3 py-2 text-xs font-black', activeTab === 'concepts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/70')}
            >
              概念
            </button>
            {tableTabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cx('rounded-lg px-3 py-2 text-xs font-black', activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/70')}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
          >
            收合
          </button>
        </div>
      </div>

      {activeTab === 'concepts' ? (
        <div className="mt-3 grid gap-2">
          {lessonData.conceptCards.map((card) => (
            <details key={card.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <summary className="cursor-pointer list-none">
                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-800">{card.title}</div>
                    <div className="mt-0.5 truncate text-xs font-bold text-slate-500">{card.shortRule}</div>
                  </div>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-amber-700">{card.focus}</span>
                </div>
              </summary>
              <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-sm">
                <p className="font-bold leading-relaxed text-slate-600">{card.explanation}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {card.examples.slice(0, 3).map((example) => (
                    <div key={example.german} className="rounded-lg bg-white px-3 py-2">
                      <div className="font-black text-slate-800">
                        <HighlightedGerman text={example.german} />
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-slate-500">{example.chinese}</div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-3">
            <h4 className="text-sm font-black text-slate-800">{activeTable.title}</h4>
            <p className="mt-1 text-xs font-bold text-slate-500">{activeTable.note}</p>
          </div>
          <DeclensionTable table={activeTable} />
        </div>
      )}
    </section>
  );
}

export default function AdjectiveDeclensionTrainer() {
  const [mode, setMode] = useState('ALL');
  const [stage, setStage] = useState('ALL');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answeredExercise, setAnsweredExercise] = useState(null);
  const [progress, setProgress] = useStoredProgress('german-lesson6-adjective-declension-progress', loadLesson6Progress);

  useEffect(() => {
    if (isReviewRequested()) setReviewOnly(true);
  }, []);



  const exercises = lessonData.exercises || [];
  const availableModes = Object.keys(MODE_LABELS).filter((item) => exercises.some((exercise) => exercise.mode === item));
  const availableStages = [...new Set(exercises.map((exercise) => exercise.stage))].sort((a, b) => a - b);

  const filtered = useMemo(() => {
    let next = exercises;
    if (mode !== 'ALL') next = next.filter((exercise) => exercise.mode === mode);
    if (stage !== 'ALL') next = next.filter((exercise) => String(exercise.stage) === stage);
    if (reviewOnly) next = next.filter((exercise) => {
      const item = getItemProgress(progress, exercise.id);
      return itemNeedsReview(item);
    });
    if (savedOnly) next = next.filter((exercise) => getItemProgress(progress, exercise.id).starred);
    return next;
  }, [exercises, mode, stage, reviewOnly, savedOnly, progress]);

  const current = answeredExercise || filtered[currentIndex % Math.max(filtered.length, 1)] || null;
  const currentProgress = current ? getItemProgress(progress, current.id) : {};
  const displayedOptions = useMemo(
    () => rotateOptions(current?.options || [], current?.id || ''),
    [current]
  );
  const answeredItems = Object.values(progress).filter((item) => item?.answered);
  const correctCount = Object.values(progress).reduce((sum, item) => sum + (item?.correct || 0), 0);
  const wrongCount = Object.values(progress).reduce((sum, item) => sum + (item?.wrong || 0), 0);
  const reviewCount = Object.values(progress).filter(itemNeedsReview).length;
  const starredCount = Object.values(progress).filter((item) => item?.starred).length;
  const accuracy = correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;

  const records = useMemo(() => {
    return exercises
      .filter((exercise) => progress[exercise.id]?.answered)
      .map((exercise) => ({ exercise, item: progress[exercise.id] }))
      .sort((a, b) => String(b.item.lastAnsweredAt || '').localeCompare(String(a.item.lastAnsweredAt || '')));
  }, [exercises, progress]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelected(null);
    setAnsweredExercise(null);
  }, [mode, stage, reviewOnly, savedOnly]);

  function answer(option) {
    if (!current || selected) return;
    const isCorrect = option === current.answer;
    answerCue(isCorrect, current.prompt.includes('____') ? current.prompt.replace('____', current.answer) : current.answer);
    setAnsweredExercise(current);
    setSelected(option);
    setProgress((prev) => {
      const item = prev[current.id] || {};
      return {
        ...prev,
        [current.id]: {
          ...item,
          answered: true,
          needsReview: !isCorrect,
          updatedAt: new Date().toISOString(),
          correct: (item.correct || 0) + (isCorrect ? 1 : 0),
          wrong: (item.wrong || 0) + (isCorrect ? 0 : 1),
          lastAnswer: option,
          lastCorrect: isCorrect,
          lastAnsweredAt: new Date().toISOString()
        }
      };
    });
  }

  function toggleFlag(flag) {
    if (!current) return;
    setProgress((prev) => {
      const item = prev[current.id] || {};
      return {
        ...prev,
        [current.id]: {
          ...item,
          [flag]: !item[flag],
          updatedAt: new Date().toISOString()
        }
      };
    });
  }

  useAnswerShortcuts({ options: displayedOptions || [], answered: !!selected, onSelect: answer, onNext: () => next() });
  const feedbackRef = useRevealOnShow(selected);

  function next() {
    if (filtered.length === 0) { setSelected(null); setAnsweredExercise(null); return; }
    setSelected(null);
    setAnsweredExercise(null);
    setCurrentIndex((currentIndex + (answeredExercise && !filtered.some(item => item.id === answeredExercise.id) ? 0 : 1)) % filtered.length);
  }

  function prev() {
    if (filtered.length === 0) { setSelected(null); setAnsweredExercise(null); return; }
    setSelected(null);
    setAnsweredExercise(null);
    setCurrentIndex((currentIndex - 1 + filtered.length) % filtered.length);
  }

  function resetProgress() {
    setSelected(null);
    setAnsweredExercise(null);
    setProgress({});
  }

  function applyStudyFlow(item) {
    setReviewOnly(false);
    setSavedOnly(false);
    setSelected(null);
    setAnsweredExercise(null);

    if (item.modes.includes('concept')) {
      setShowConcepts((value) => !value);
      setStage('ALL');
      setMode('ALL');
      return;
    }

    setStage(String(item.step));
    setMode(item.modes.find((entry) => exercises.some((exercise) => exercise.mode === entry)) || 'ALL');
  }

  return (
    <div className="grid gap-4 text-slate-800">
      <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-800">{lessonData.meta.subtitle}</h2>
            <p className="mt-1 hidden text-sm font-bold leading-relaxed text-slate-500 md:block">{lessonData.meta.description}</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center sm:min-w-[430px]">
            {[
              ['已作答', answeredItems.length],
              ['正確率', answeredItems.length ? `${accuracy}%` : '—'],
              ['需複習', reviewCount],
              ['收藏', starredCount]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-amber-50 px-3 py-2">
                <div className="text-[11px] font-black text-amber-700">{label}</div>
                <div className="text-xl font-black text-slate-800">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <button type="button" aria-expanded={showTools} aria-controls="adjective-tools" onClick={() => setShowTools(value => !value)} className="mt-3 min-h-10 w-full rounded-xl border border-amber-100 px-3 py-2 text-sm font-bold md:hidden">
          {showTools ? '收合篩選與工具' : '篩選、錯題與文法速查'}{reviewOnly ? ' · 錯題模式' : ''}
        </button>
        <div id="adjective-tools" className={cx('mt-4 grid-cols-2 gap-2 md:grid md:grid-cols-[1fr_1fr_auto_auto_auto_auto]', showTools ? 'grid' : 'hidden')}>
          <select aria-label="題型" value={mode} onChange={(event) => setMode(event.target.value)} className="min-h-10 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm font-bold outline-none focus:border-amber-400">
            <option value="ALL">全部題型</option>
            {availableModes.map((item) => <option key={item} value={item}>{MODE_LABELS[item]}</option>)}
          </select>
          <select aria-label="學習階段" value={stage} onChange={(event) => setStage(event.target.value)} className="min-h-10 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm font-bold outline-none focus:border-amber-400">
            <option value="ALL">全部階段</option>
            {availableStages.map((item) => <option key={item} value={String(item)}>{STAGE_LABELS[item] || `Stage ${item}`}</option>)}
          </select>
          <button type="button" onClick={() => setReviewOnly((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black', reviewOnly ? 'border-rose-600 bg-rose-600 text-white' : 'border-amber-100 bg-white text-slate-700 hover:bg-amber-50')}>
            錯題
          </button>
          <button type="button" onClick={() => setSavedOnly((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black', savedOnly ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-100 bg-white text-slate-700 hover:bg-amber-50')}>
            收藏
          </button>
          <button type="button" onClick={() => setShowConcepts((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black', showConcepts ? 'border-slate-800 bg-slate-800 text-white' : 'border-amber-100 bg-white text-slate-700 hover:bg-amber-50')}>
            {showConcepts ? '收合文法速查' : '打開文法速查'}
          </button>
          <button type="button" onClick={() => setShowRecords((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black', showRecords ? 'border-teal-700 bg-teal-700 text-white' : 'border-amber-100 bg-white text-slate-700 hover:bg-amber-50')}>
            紀錄
          </button>
        </div>
      </section>

      {showConcepts && <ConceptPanel onClose={() => setShowConcepts(false)} />}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,760px)_320px]">
        {!current ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500">
            目前篩選條件沒有題目。
          </div>
        ) : (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-2 shadow-md shadow-amber-900/10 md:p-4">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-teal-50/60 p-3 md:p-5">
              <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-black text-amber-800">{STAGE_LABELS[current.stage] || `Stage ${current.stage}`}</span>
                  <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-black text-teal-800">{MODE_LABELS[current.mode]}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">{current.level}</span>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" aria-label="收藏" onClick={() => toggleFlag('starred')} className={cx('grid h-9 w-9 place-items-center rounded-xl border shadow-sm', currentProgress.starred ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-100 bg-white text-slate-500 hover:bg-amber-50')}>
                    <Star size={16} className={cx(currentProgress.starred && 'fill-white')} />
                  </button>
                  <button type="button" onClick={() => toggleFlag('needsReview')} className={cx('h-9 rounded-xl border px-2.5 text-[11px] font-black shadow-sm', currentProgress.needsReview ? 'border-rose-600 bg-rose-600 text-white' : 'border-amber-100 bg-white text-slate-500 hover:bg-amber-50')}>
                    複習
                  </button>
                </div>
              </div>

              <div key={current.id} className="fx-question rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm md:p-5">
                <div className="text-sm font-black text-slate-400">{current.questionZh}</div>
                <h2 className="mt-3 break-words text-2xl font-black leading-relaxed text-slate-900 md:text-3xl">{current.prompt}</h2>
                {current.given && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {current.given.noun && (() => { const { article, rest, gender } = splitArticle(current.given.noun); return <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{gender && <i className={`g-dot g-${gender}`} />}{article && <span className={`g-${gender}`}>{article}&nbsp;</span>}{rest}</span>; })()}
                    {current.given.adjective && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{current.given.adjective}</span>}
                    {current.given.articleType && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{ARTICLE_LABELS[current.given.articleType]}</span>}
                    {current.given.caseName && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{CASE_LABELS[current.given.caseName]}</span>}
                  </div>
                )}
              </div>

              <div className={cx('mt-3 grid gap-2', optionIsLong(displayedOptions) ? 'grid-cols-1' : 'grid-cols-2')}>
                {displayedOptions.map((option, optionIndex) => {
                  const isAnswer = option === current.answer;
                  const isSelected = option === selected;
                  return (
                    <button
                      key={`${current.id}-${option}`}
                      type="button"
                      data-answer-option
                      onClick={() => answer(option)}
                      className={cx(
                        'flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 py-3 text-left text-base font-black shadow-sm transition-all active:scale-[0.98]',
                        selected && isAnswer && 'fx-correct',
                        selected && isSelected && !isAnswer && 'fx-wrong',
                        !optionIsLong(displayedOptions) && 'text-center',
                        !selected && 'border-amber-100 bg-white text-slate-800 hover:border-amber-400 hover:bg-amber-50',
                        selected && isAnswer && 'border-emerald-600 bg-emerald-100 text-emerald-900',
                        selected && isSelected && !isAnswer && 'border-rose-600 bg-rose-100 text-rose-900',
                        selected && !isSelected && !isAnswer && 'border-slate-100 bg-slate-50 text-slate-400'
                      )}
                    >
                      {!selected && optionIndex < 9 && <span className="kbd-hint" aria-hidden="true">{optionIndex + 1}</span>}
                      <span className={cx('min-w-0 flex-1', !optionIsLong(displayedOptions) && 'text-center')}>{option}</span>
                    </button>
                  );
                })}
              </div>

              {selected && (
                <div ref={feedbackRef} role="status" className={cx('fx-enter mt-4 scroll-mb-24 rounded-2xl border-2 p-4 shadow-sm', selected === current.answer ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50')}>
                  <div className="flex items-center gap-2">
                    {selected === current.answer ? <CheckCircle className="text-emerald-700" size={20} /> : <XCircle className="text-rose-700" size={20} />}
                    <div className={cx('font-black', selected === current.answer ? 'text-emerald-900' : 'text-rose-900')}>
                      {selected === current.answer ? '正確' : `正確答案：${current.answer}`}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm font-bold leading-relaxed text-slate-700">
                    {current.explanation.map((line) => <p key={line}>{line}</p>)}
                  </div>
                  <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm font-black text-slate-700">{current.miniRule}</div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={prev} className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-black text-amber-700 shadow-sm hover:bg-amber-50">
                上一題
              </button>
              <button type="button" onClick={next} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]', selected && 'ring-4 ring-amber-400/40')}>
                下一題
                {selected && <span className="kbd-hint !border-white/30 !bg-white/15 !text-white" aria-hidden="true">Enter</span>}
              </button>
            </div>
          </section>
        )}

        <aside className="grid gap-3 xl:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-800">學習流程</h3>
            <div className="mt-3 grid gap-2">
              {lessonData.studyFlow.map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => applyStudyFlow(item)}
                  className={cx(
                    'rounded-xl border px-3 py-2 text-left',
                    item.modes.includes('concept') && showConcepts
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-transparent bg-slate-50 hover:border-amber-200 hover:bg-amber-50'
                  )}
                >
                  <div className="text-xs font-black text-amber-700">Step {item.step} · {item.minutes} 分鐘</div>
                  <div className="mt-1 text-sm font-black text-slate-800">{item.title}</div>
                  <div className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                    {item.modes.includes('concept') && showConcepts ? '目前已開啟，點此可收合。' : item.description}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">常見錯誤</h3>
              <button type="button" onClick={resetProgress} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100">
                <RotateCcw size={13} /> 重置
              </button>
            </div>
            <div className="grid gap-2">
              {lessonData.commonMistakes.map((item) => (
                <div key={item.wrong} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold leading-relaxed">
                  <div className="text-rose-600">{item.wrong}</div>
                  <div className="mt-1 text-emerald-700">{item.correct}</div>
                  <div className="mt-1 text-slate-500">{item.reason}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {showRecords && (
        <section className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-800">答題紀錄</h3>
          {records.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">尚未有答題紀錄。</p>
          ) : (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {records.slice(0, 80).map(({ exercise, item }) => (
                <div key={exercise.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate text-sm font-black text-slate-800">{exercise.answer}</div>
                    <span className={cx('shrink-0 rounded-full px-2 py-1 text-[11px] font-black', item.lastCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                      {item.lastCorrect ? '答對' : '答錯'}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs font-bold text-slate-500">{exercise.prompt}</div>
                  <div className="mt-1 text-xs font-bold text-slate-400">你的答案：{item.lastAnswer}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
