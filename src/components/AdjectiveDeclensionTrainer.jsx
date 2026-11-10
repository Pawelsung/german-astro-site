import React, { useCallback, useMemo, useState } from 'react';
import { RotateCcw, Star } from 'lucide-react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import { PickerRow } from './lesson/BottomSheet.jsx';
import SpeakButton from './lesson/SpeakButton.jsx';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { adjectiveSpeechText } from '../lib/lessonSpeech.mjs';
import { loadLesson6Progress, needsReview as itemNeedsReview } from '../lib/progressStorage';
import lessonData from '../data/lesson6-adjective-declension';
import { nextChoiceRecord } from '../lib/lessonRound.mjs';
import { splitArticle } from '../lib/grammarColors.mjs';

const MODE_LABELS = {
  concept: '概念',
  'quick-drill': '快速練習',
  'case-detective': '格位偵探',
  'dativ-focus': 'Dativ 特訓',
  'sentence-upgrade': '句子升級',
  'error-fix': '錯誤修正',
  'genitiv-focus': 'Genitiv 特訓'
};

const STAGE_LABELS = {
  1: '概念暖身',
  2: '定冠詞',
  3: '不定冠詞 / Akkusativ',
  4: 'Dativ',
  5: 'B1 挑戰',
  6: '定冠詞 Akk／Dat',
  7: '複數',
  8: 'mein／kein',
  9: 'Genitiv'
};

const ARTICLE_LABELS = {
  definite: '定冠詞',
  indefinite: '不定冠詞',
  possessive: '所有格 mein',
  negative: '否定 kein',
  zero: '無冠詞'
};

const CASE_LABELS = {
  nominativ: 'Nominativ',
  akkusativ: 'Akkusativ',
  dativ: 'Dativ',
  genitiv: 'Genitiv'
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

function ConceptPanel({ speak }) {
  const [activeTab, setActiveTab] = useState('concepts');
  const tableTabs = [
    ['definite', '定冠詞'],
    ['indefinite', '不定冠詞'],
    ['possessive', 'mein／kein'],
    ['zero', '無冠詞']
  ];
  const activeTable = lessonData.declensionTables[activeTab];

  return (
    <section className="grid gap-1">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-5">
        {[['concepts', '概念'], ...tableTabs].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)} className={cx('min-h-10 rounded-lg px-3 py-2 text-xs font-black', activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/70')}>
            {label}
          </button>
        ))}
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
                      <SpeakButton small label="播放例句" onSpeak={() => speak(example.german)}/>
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

const EXERCISES = lessonData.exercises || [];
const FILTERS = [
  { id: 'stage', label: '學習階段', options: [{ id: 'all', label: '全部階段' }, ...[...new Set(EXERCISES.map(item => item.stage))].sort((a, b) => a - b).map(stage => ({ id: String(stage), label: STAGE_LABELS[stage] || `Stage ${stage}` }))] },
  { id: 'mode', label: '題型', options: [{ id: 'all', label: '全部題型' }, ...Object.keys(MODE_LABELS).filter(mode => EXERCISES.some(item => item.mode === mode)).map(mode => ({ id: mode, label: MODE_LABELS[mode] }))] },
  { id: 'only', label: '篩選', options: [{ id: 'all', label: '全部題目' }, { id: 'saved', label: '只看收藏' }] }
];

function GivenChips({ given }) {
  if (!given) return null;
  const parts = given.noun ? splitArticle(given.noun) : null;
  const gender = parts && (given.number === 'pl' ? 'pl' : parts.gender);
  return <div className="lc-chips">
    {parts && <span>{gender && <i className={`g-dot g-${gender}`} />}{parts.article && <b className={`g-${gender}`}>{parts.article}&nbsp;</b>}{parts.rest}</span>}
    {given.adjective && <span>{given.adjective}</span>}
    {given.articleType && <span>{ARTICLE_LABELS[given.articleType]}</span>}
    {given.caseName && <span>{CASE_LABELS[given.caseName]}</span>}
  </div>;
}

export default function AdjectiveDeclensionTrainer() {
  const [progress, setProgress] = useStoredProgress('german-lesson6-adjective-declension-progress', loadLesson6Progress);
  const { speak, speechMessage } = useGermanSpeech();

  const itemsFor = useCallback(({ stage, mode, only }) => EXERCISES.filter(item =>
    (stage === 'all' || String(item.stage) === stage)
    && (mode === 'all' || item.mode === mode)
    && (only !== 'saved' || progress[item.id]?.starred)), [progress]);
  const reviewItems = () => EXERCISES.filter(item => itemNeedsReview(progress[item.id] || {}));

  const summary = useMemo(() => {
    const values = Object.values(progress);
    const correct = values.reduce((sum, item) => sum + (item?.correct || 0), 0);
    const wrong = values.reduce((sum, item) => sum + (item?.wrong || 0), 0);
    return [
      ['已作答', values.filter(item => item?.answered).length],
      ['正確率', correct + wrong ? `${Math.round((correct / (correct + wrong)) * 100)}%` : '—'],
      ['需複習', values.filter(itemNeedsReview).length],
      ['收藏', values.filter(item => item?.starred).length]
    ];
  }, [progress]);

  const answeredLog = useMemo(() => EXERCISES
    .filter(item => progress[item.id]?.answered)
    .map(item => ({ exercise: item, record: progress[item.id] }))
    .sort((a, b) => String(b.record.lastAnsweredAt || '').localeCompare(String(a.record.lastAnsweredAt || ''))), [progress]);

  function toggleFlag(id, flag) {
    setProgress(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [flag]: !prev[id]?.[flag], updatedAt: new Date().toISOString() } }));
  }

  function resetProgress() {
    if (window.confirm('確定要清除第 6 課的全部作答紀錄和收藏嗎？清除後無法復原。')) setProgress({});
  }

  const panels = [
    { id: 'tables', title: '文法速查', render: () => <ConceptPanel speak={speak}/> },
    { id: 'flow', title: '學習流程', render: ({ setFilters }) => lessonData.studyFlow.filter(step => !step.modes.includes('concept')).map(step => (
      <PickerRow key={step.step} title={`Step ${step.step} · ${step.title}`} detail={`${step.minutes} 分鐘 · ${step.description}`}
        onClick={() => setFilters({ stage: String(step.step), mode: step.modes.find(entry => EXERCISES.some(item => item.mode === entry)) || 'all' })}/>
    )) },
    { id: 'mistakes', title: '常見錯誤', render: () => lessonData.commonMistakes.map(item => (
      <div key={item.wrong} className="lf-card"><p className="is-bad">{item.wrong}</p><p className="is-good">{item.correct}</p><p>{item.reason}</p></div>
    )) },
    { id: 'log', title: '答題紀錄', render: () => <>
      {answeredLog.length === 0 ? <p className="picker-status">尚未有答題紀錄。</p> : answeredLog.slice(0, 80).map(({ exercise, record }) => (
        <div key={exercise.id} className="lf-card">
          <p className={record.lastCorrect ? 'is-good' : 'is-bad'}><b lang="de">{exercise.answer}</b> · {record.lastCorrect ? '答對' : '答錯'}</p>
          <p lang="de">{exercise.prompt}</p>
          <p>你的答案：<span lang="de">{record.lastAnswer}</span></p>
        </div>
      ))}
      <button type="button" className="calm-link" onClick={resetProgress}><RotateCcw size={14}/>&nbsp;清除全部紀錄</button>
    </> }
  ];

  function renderQuestion({ key, item, isLast, report, next, prev }) {
    const hasBlank = item.prompt.includes('____');
    const record = progress[item.id] || {};
    const spoken = adjectiveSpeechText(item);
    return <ChoiceCard
      key={key}
      tag={STAGE_LABELS[item.stage] || `Stage ${item.stage}`}
      level={item.level}
      actions={<>
        <button type="button" className="lc-flag" aria-label={record.starred ? '取消收藏' : '收藏'} aria-pressed={!!record.starred} onClick={() => toggleFlag(item.id, 'starred')}><Star size={16} fill={record.starred ? 'currentColor' : 'none'}/></button>
        <button type="button" className="lc-flag" aria-pressed={!!record.needsReview} onClick={() => toggleFlag(item.id, 'needsReview')}>複習</button>
      </>}
      hint={MODE_LABELS[item.mode]}
      prompt={picked => <>
        <p className="lc-sub">{item.questionZh}</p>
        <p className="lc-sentence" lang="de">{picked && hasBlank ? item.prompt.replace('____', item.answer) : item.prompt}</p>
        <GivenChips given={item.given}/>
      </>}
      options={[...new Set(item.options)]}
      answer={item.answer}
      wide={optionIsLong(item.options)}
      wrongTitle={`正確答案：${item.answer}`}
      solved={spoken}
      onSpeak={spoken ? () => speak(spoken) : undefined}
      extra={<>
        {item.explanation.map(line => <p key={line} className="lc-note">{line}</p>)}
        <p className="lc-rule">{item.miniRule}</p>
      </>}
      isLast={isLast}
      onPrev={prev}
      onSkip={next}
      onNext={next}
      onChoose={(option, correct) => {
        report(correct, hasBlank ? item.prompt.replace('____', item.answer) : item.answer);
        const now = new Date().toISOString();
        setProgress(prevProgress => ({ ...prevProgress, [item.id]: { ...nextChoiceRecord(prevProgress[item.id], correct, now), lastAnswer: option, lastAnsweredAt: now } }));
      }}
    />;
  }

  return <>
    {speechMessage && <p role="status" className="speech-toast">{speechMessage}</p>}
    <LessonApp
    lessonKey="l6"
    title="形容詞字尾"
    blurb="先看冠詞有沒有露出性別，再決定字尾。"
    filters={FILTERS}
    itemsFor={itemsFor}
    reviewItems={reviewItems}
    records={summary}
    panels={panels}
    renderQuestion={renderQuestion}
    />
  </>;
}
