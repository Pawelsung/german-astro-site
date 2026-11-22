import React, { useCallback, useMemo } from 'react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { PROGRESS_KEYS, needsReview, readProgressMap } from '../lib/progressStorage';
import { nextChoiceRecord } from '../lib/lessonRound.mjs';
import { tenseText } from '../lib/tenses.mjs';
import { STAGES, tenseExercises } from '../data/lesson9-tenses';

const ALL_ITEMS = tenseExercises;
const loadProgress = () => readProgressMap(PROGRESS_KEYS.lesson9);
const FILTERS = [
  { id: 'stage', label: '範圍', options: [{ id: 'all', label: '全部範圍' }, ...STAGES.map(({ id, label }) => ({ id, label }))] },
  { id: 'level', label: '程度', options: [{ id: 'all', label: '全部程度' }, { id: 'A2', label: 'A2' }, { id: 'B1', label: 'B1' }, { id: 'B2', label: 'B2' }] }
];

const Blank = ({ picked, answer }) => (picked ? <span className="lc-filled">{answer}</span> : <span className="lc-blank"/>);

function Prompt({ item, picked }) {
  const [before, after] = item.sentence.split('___');
  return <>
    {item.fact && <p className="lc-fact"><small>情境</small><span lang="de">{item.fact}</span></p>}
    <p lang="de" className="lc-sentence">{before}<Blank picked={picked} answer={item.options[0]}/>{after}</p>
  </>;
}

export default function TensesTrainer() {
  const [progress, setProgress] = useStoredProgress(PROGRESS_KEYS.lesson9, loadProgress);
  const { speak, speechMessage } = useGermanSpeech();

  const records = useMemo(() => {
    const items = Object.values(progress);
    const correct = items.reduce((sum, item) => sum + (item?.correct || 0), 0);
    const attempts = items.reduce((sum, item) => sum + (item?.correct || 0) + (item?.wrong || 0), 0);
    return [
      ['已作答', `${items.filter(item => item?.answered).length} / ${ALL_ITEMS.length}`],
      ['正確率', attempts ? `${Math.round((correct / attempts) * 100)}%` : '—'],
      ['待複習', items.filter(needsReview).length]
    ];
  }, [progress]);

  const itemsFor = useCallback(({ stage, level }) => ALL_ITEMS.filter(item => (stage === 'all' || item.stage === stage) && (!level || level === 'all' || item.level === level)), []);
  const reviewItems = () => ALL_ITEMS.filter(item => needsReview(progress[item.id]));

  function renderQuestion({ key, item, isLast, report, next, prev }) {
    const stage = STAGES.find(entry => entry.id === item.stage);
    const answer = item.options[0];
    const solved = tenseText(item);
    return <ChoiceCard
      key={key}
      tag={stage?.label}
      level={item.level}
      hint={stage?.hint}
      prompt={picked => <Prompt item={item} picked={picked}/>}
      options={item.options}
      answer={answer}
      optionLang="de"
      solved={solved}
      translation={item.trans}
      explain={item.explain}
      wrongTitle={`正確答案：${answer}`}
      isLast={isLast}
      onSpeak={() => speak(solved)}
      onPrev={prev}
      onSkip={next}
      onNext={next}
      onChoose={(_, correct) => {
        report(correct, solved);
        speak(solved);
        setProgress(prev => ({ ...prev, [item.id]: nextChoiceRecord(prev[item.id], correct) }));
      }}
    />;
  }

  return <>
    {speechMessage && <p role="status" className="speech-toast">{speechMessage}</p>}
    <LessonApp
    lessonKey="l9"
    title="時態"
    blurb="過去完成式、未來式和未來完成式：先分清楚事情發生的先後。"
    filters={FILTERS}
    itemsFor={itemsFor}
    reviewItems={reviewItems}
    records={records}
    renderQuestion={renderQuestion}
    />
  </>;
}
