import React, { useCallback, useMemo } from 'react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { PROGRESS_KEYS, needsReview, readProgressMap } from '../lib/progressStorage';
import { nextChoiceRecord } from '../lib/lessonRound.mjs';
import { fillBlank, formExercises, formPhrase } from '../lib/konjunktiv.mjs';
import { STAGES, konjunktivExercises } from '../data/lesson7-konjunktiv';

const ALL_ITEMS = [...formExercises(), ...konjunktivExercises];
const loadProgress = () => readProgressMap(PROGRESS_KEYS.lesson7);
const FILTERS = [{ id: 'stage', label: '範圍', options: [{ id: 'all', label: '全部範圍' }, ...STAGES.map(({ id, label }) => ({ id, label }))] }];

// The German text read aloud and shown in the feedback once the item is answered.
function solvedText(item) {
  if (item.stage === 'forms') return formPhrase(item);
  if (item.stage === 'transform') return item.options[0];
  if (item.stage === 'function') return item.sentence;
  return fillBlank(item.sentence, item.options[0]);
}

const Blank = ({ picked, answer }) => (picked ? <span className="lc-filled">{answer}</span> : <span className="lc-blank"/>);

function Prompt({ item, picked }) {
  if (item.stage === 'forms') {
    return <>
      <p lang="de" className="lc-sentence is-center">{item.pronoun} <Blank picked={picked} answer={item.options[0]}/></p>
      <p className="lc-sub is-center"><span lang="de">{item.verb.infinitive}</span>（{item.verb.meaning}）的 Konjunktiv II</p>
    </>;
  }
  const [before, after] = (item.sentence || '').split('___');
  return <>
    {item.fact && <p className="lc-fact"><small>原句</small><span lang="de">{item.fact}</span></p>}
    {item.stage === 'transform' && <p className="lc-sub">依照上方改寫要求，選出 Konjunktiv II 句子：</p>}
    {item.stage === 'function' && <p lang="de" className="lc-sentence">{item.sentence}</p>}
    {item.sentence && item.stage !== 'function' && <p lang="de" className="lc-sentence">{before}<Blank picked={picked} answer={item.options[0]}/>{after}</p>}
  </>;
}

export default function KonjunktivTrainer() {
  const [progress, setProgress] = useStoredProgress(PROGRESS_KEYS.lesson7, loadProgress);
  const { speak } = useGermanSpeech();

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

  const itemsFor = useCallback(({ stage }) => ALL_ITEMS.filter(item => stage === 'all' || item.stage === stage), []);
  const reviewItems = () => ALL_ITEMS.filter(item => needsReview(progress[item.id]));

  function renderQuestion({ key, item, isLast, report, next, prev }) {
    const stage = STAGES.find(entry => entry.id === item.stage);
    const answer = item.options[0];
    const solved = solvedText(item);
    return <ChoiceCard
      key={key}
      tag={stage?.label}
      level={item.level}
      hint={stage?.hint}
      prompt={picked => <Prompt item={item} picked={picked}/>}
      options={item.options}
      answer={answer}
      wide={item.stage === 'transform'}
      optionLang={item.stage === 'function' ? undefined : 'de'}
      solved={solved}
      translation={item.trans}
      explain={item.explain}
      wrongTitle={item.stage === 'transform' ? '正確答案如上' : `正確答案：${answer}`}
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

  return <LessonApp
    lessonKey="l7"
    title="Konjunktiv II"
    blurb="用 würde、hätte、wäre、könnte 表達假設、願望和客氣語氣。"
    filters={FILTERS}
    itemsFor={itemsFor}
    reviewItems={reviewItems}
    records={records}
    renderQuestion={renderQuestion}
  />;
}
