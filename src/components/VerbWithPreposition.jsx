import React, { useMemo, useState } from 'react';
import { Star, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import FlipCard from './lesson/FlipCard.jsx';
import VoiceSettings from './lesson/VoiceSettings.jsx';
import SpeakButton from './lesson/SpeakButton.jsx';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { isLesson2Due, loadLesson2Progress } from '../lib/progressStorage';
import { verbPrepositions as verbData } from '../data/verb-prepositions';
import { woDaPractice } from '../data/wo-da-practice';
import { blankPreposition } from '../lib/prepositionBlank.mjs';
import { WO_DA_KIND_LABEL, WO_DA_RULES, fillWoDa, woDaAnswer, woDaOptions } from '../lib/woDa.mjs';

const CASE_NAME = { A: 'Akkusativ', D: 'Dativ' };
const PRACTICE_LABELS = { flash: '字卡', word: '單字模式', sentence: '例句填空', case: '格位判斷', woda: 'wo/da 代換' };
const FILTERS = [
  { id: 'practice', label: '練習方式', alwaysShow: true, options: Object.entries(PRACTICE_LABELS).map(([id, label]) => ({ id, label })) },
  { id: 'only', label: '篩選', options: [{ id: 'all', label: '全部' }, { id: 'saved', label: '只看收藏' }] }
];
const ALL_PREPS = [...new Set(verbData.map(item => item.prep))];
const randomly = list => [...list].sort(() => 0.5 - Math.random());
const entryFor = item => verbData.find(entry => entry.id === item.entryId);

function WordPrompt({ item, picked }) {
  const [hint, setHint] = useState(false);
  const blank = blankPreposition(item.example, item.prep);
  return <>
    <p className="lc-sentence is-center" lang="de">{item.verb}</p>
    <p className="lc-sub is-center">{item.verbTrans}</p>
    {hint && <p className="lc-fact" lang="de">提示：{blank ? `${blank.before}___${blank.after}` : item.example}</p>}
    {!hint && !picked && <button type="button" className="calm-link" onClick={() => setHint(true)}>顯示提示例句</button>}
  </>;
}

function SentencePrompt({ item, picked }) {
  const blank = blankPreposition(item.example, item.prep);
  return <>
    {blank
      ? <p className="lc-sentence" lang="de">{blank.before}{picked ? <span className="lc-filled">{blank.found}</span> : <span className="lc-blank"/>}{blank.after}</p>
      : <p className="lc-sentence" lang="de">{item.example}</p>}
    {blank?.contraction && <p className="lc-sub">{picked ? `${blank.contraction.form} = ${blank.contraction.expansion}` : '空格處是縮寫或複合形式，請選出原本的介系詞'}</p>}
    <p className="lc-sub"><span lang="de">{item.verb}</span>（{item.verbTrans}）</p>
  </>;
}

// --- 3.3 List View Component ---
const VerbList = ({ data, speak, userData, toggleStar }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.verb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.verbTrans.includes(searchTerm) ||
                          item.prep.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStar = showOnlyStarred ? userData.starred.includes(item.id) : true;
      return matchSearch && matchStar;
    });
  }, [data, searchTerm, showOnlyStarred, userData.starred]);

  return (
    <div className="w-full">
      <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100 mb-3 flex flex-col gap-3">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
            type="text"
            placeholder="搜尋動詞或意思..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center justify-between px-1 sm:px-2">
            <span className="text-xs sm:text-sm font-bold text-gray-500">共 {filteredData.length} 個</span>
            <button
                onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                aria-pressed={showOnlyStarred}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${showOnlyStarred ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
            >
                <Star size={14} className={showOnlyStarred ? "fill-amber-500 text-amber-500" : ""} />
                已收藏
            </button>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {filteredData.map(item => {
          const isStarred = userData.starred.includes(item.id);
          const srsData = userData.srs[item.id];
          const nextReview = srsData?.nextReview ? new Date(srsData.nextReview).toLocaleDateString() : '尚未複習';

          return (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div
              className="p-3.5 sm:p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1 flex items-start gap-2 sm:gap-3">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                    className="mt-0.5 sm:mt-1 flex-shrink-0"
                >
                    <Star size={20} className={isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                </button>
                <div>
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-1">
                        <span className="font-extrabold text-base sm:text-lg text-gray-800">{item.verb}</span>
                        <span className="text-amber-600 font-extrabold text-sm sm:text-base">+ {item.prep}</span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold border border-gray-200">+{item.case}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{item.verbTrans}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <SpeakButton label="播放動詞發音" onSpeak={() => speak(item.verb)}/>
                <div className="p-1 sm:p-2 text-gray-300">
                  {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {expandedId === item.id && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 bg-gradient-to-b from-transparent to-amber-50/30">
                <div className="pt-2 sm:pt-3 border-t border-gray-100 space-y-2.5 sm:space-y-3">
                   <div className="flex justify-between items-center text-[10px] sm:text-xs">
                     <div><span className="font-bold text-gray-500">三態: </span><span className="text-gray-800 font-medium">{item.forms}</span></div>
                     <div className="bg-blue-50 text-blue-700 px-1.5 py-1 rounded font-bold flex items-center gap-1"><Calendar size={10}/> 複習: {nextReview}</div>
                   </div>
                   <div className="bg-white p-3 sm:p-4 rounded-xl border border-amber-100 shadow-sm">
                     <p className="text-gray-800 mb-1 font-medium text-sm sm:text-base">{item.example}</p>
                     <p className="text-gray-500 text-xs sm:text-sm mb-2">{item.exampleTrans}</p>
                     <SpeakButton small label="播放例句" onSpeak={() => speak(item.example)}/>
                   </div>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};


export default function VerbWithPreposition() {
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(0.9);
  const { voices, speak, speechMessage } = useGermanSpeech({ voiceURI: voice, rate });
  const [userData, setUserData] = useStoredProgress('verb-preposition-trainer-v1', loadLesson2Progress);

  const itemsFor = ({ practice, only }) => {
    const saved = id => only !== 'saved' || userData.starred.includes(id);
    return practice === 'woda' ? woDaPractice.filter(item => saved(item.entryId)) : verbData.filter(item => saved(item.id));
  };
  const reviewItems = () => verbData.filter(item => isLesson2Due(userData.srs[item.id]));

  const toggleStar = id => setUserData(prev => ({ ...prev, starred: prev.starred.includes(id) ? prev.starred.filter(entry => entry !== id) : [...prev.starred, id] }));
  const addHistory = record => setUserData(prev => ({ ...prev, history: [...prev.history, record] }));

  function rateCard(id, rating) {
    setUserData(prev => {
      const current = prev.srs[id]?.interval || 0;
      const interval = rating === 'hard' ? 1 : rating === 'good' ? (current === 0 ? 3 : current * 2) : (current === 0 ? 7 : current * 3);
      return { ...prev, srs: { ...prev.srs, [id]: { interval, nextReview: Date.now() + interval * 86400000, updatedAt: new Date().toISOString() } } };
    });
  }

  const records = [
    ['已收藏', userData.starred.length],
    ['已複習卡片', Object.keys(userData.srs).length],
    ['測驗紀錄', userData.history.length]
  ];
  const panels = [
    { id: 'list', title: '動詞列表', render: () => <VerbList data={verbData} speak={speak} userData={userData} toggleStar={toggleStar}/> },
    { id: 'voice', title: '語音設定', render: () => <VoiceSettings voices={voices} voice={voice} onVoice={setVoice} rate={rate} onRate={setRate} speak={speak}/> }
  ];

  function renderFlash({ key, item, isLast, report, next, prev }) {
    const starred = userData.starred.includes(item.id);
    return <FlipCard
      key={key}
      tag={`+ ${item.prep}`}
      actions={<button type="button" className="lc-flag" aria-label={starred ? '取消收藏' : '收藏'} aria-pressed={starred} onClick={() => toggleStar(item.id)}><Star size={16} fill={starred ? 'currentColor' : 'none'}/></button>}
      front={<div className="calm-word-block">
        <p className="calm-word" lang="de">{item.verb}</p>
        <p className="lc-sub is-center">{item.verbTrans}</p>
        <SpeakButton label="播放動詞發音" onSpeak={() => speak(item.verb)}/>
      </div>}
      back={<div className="calm-answer">
        <p className="lc-sentence is-center" lang="de">{item.verb} + {item.prep}</p>
        <div className="calm-tags"><span>+ {CASE_NAME[item.case]}</span></div>
        <p className="calm-forms" lang="de">{item.forms}</p>
        <div className="calm-example">
          <p lang="de">{item.example} <SpeakButton small label="播放例句" onSpeak={() => speak(item.example)}/></p>
          <p className="calm-example-zh">{item.exampleTrans}</p>
        </div>
      </div>}
      footer={<div className="calm-actions">
        {[['hard', '困難', '1 天'], ['good', '普通', '3 天'], ['easy', '簡單', '7 天']].map(([rating, label, days]) => (
          <button key={rating} type="button" className="calm-rate lc-rate" data-tone={rating === 'easy' ? 'know' : undefined} onClick={() => { rateCard(item.id, rating); next(); }}>{label}<small>{days}</small></button>
        ))}
      </div>}
      onFirstReveal={() => report(null, '')}
      isLast={isLast}
      onNext={next}
      onPrev={prev}
    />;
  }

  function renderQuestion(args) {
    const { key, item, isLast, report, next, prev, selection, review } = args;
    const practice = review ? 'flash' : selection.practice;
    if (practice === 'flash') return renderFlash(args);
    if (practice === 'woda') {
      const entry = entryFor(item);
      const answer = woDaAnswer(item, entry);
      const solved = fillWoDa(item, answer);
      const [before, after] = item.sentence.split('___');
      return <ChoiceCard
        key={key}
        tag={PRACTICE_LABELS.woda}
        hint={WO_DA_KIND_LABEL[item.kind]}
        prompt={picked => <p className="lc-sentence" lang="de">{before}{picked ? <span className="lc-filled">{answer}</span> : <span className="lc-blank"/>}{after}</p>}
        options={woDaOptions(item, entry, randomly(ALL_PREPS))}
        answer={answer}
        wrongTitle={`正確答案：${answer}`}
        solved={solved}
        translation={item.trans}
        extra={<p className="lc-rule"><span lang="de">{entry.verb} {entry.prep} + {entry.case === 'A' ? 'Akk' : 'Dat'}</span>　{WO_DA_RULES[item.kind]}</p>}
        isLast={isLast}
        onSpeak={() => speak(solved)}
        onPrev={prev}
        onSkip={next}
        onNext={next}
        onChoose={(_, correct) => {
          report(correct, solved);
          speak(solved);
          addHistory({ mode: 'woda', score: correct ? 10 : 0, verb: entry.verb, correct, date: new Date().toISOString() });
        }}
      />;
    }
    const isCase = practice === 'case';
    const answer = isCase ? CASE_NAME[item.case] : item.prep;
    // Verbs like sprechen (über/mit) have two right answers; never offer the other one as a distractor.
    const validPreps = verbData.filter(entry => entry.verb === item.verb).map(entry => entry.prep);
    const options = isCase ? ['Akkusativ', 'Dativ'] : [item.prep, ...randomly(ALL_PREPS.filter(prep => !validPreps.includes(prep))).slice(0, 3)];
    return <ChoiceCard
      key={key}
      tag={PRACTICE_LABELS[practice]}
      prompt={picked => practice === 'word' ? <WordPrompt item={item} picked={picked}/>
        : practice === 'sentence' ? <SentencePrompt item={item} picked={picked}/>
        : <><p className="lc-sentence is-center" lang="de">{item.verb} + {item.prep}</p><p className="lc-sub is-center">後面應該接什麼格位？</p></>}
      options={options}
      answer={answer}
      wrongTitle={`正確答案：${answer}`}
      solved={item.example}
      translation={item.exampleTrans}
      extra={<p className="lc-rule"><span lang="de">{item.verb} {item.prep} + {CASE_NAME[item.case]}</span></p>}
      onSpeak={() => speak(item.example)}
      isLast={isLast}
      onPrev={prev}
      onSkip={next}
      onNext={next}
      onChoose={(_, correct) => {
        report(correct, `${item.verb} ${item.prep} + ${CASE_NAME[item.case]}`);
        speak(correct ? 'Richtig!' : `Falsch. Die Antwort ist ${answer}`);
        addHistory({ mode: practice, score: correct ? 10 : 0, verb: item.verb, correct, date: new Date().toISOString() });
      }}
    />;
  }

  return <>
    {speechMessage && <p role="status" className="speech-toast">{speechMessage}</p>}
    <LessonApp
      lessonKey="l2"
      title="動詞與介系詞"
      blurb="動詞＋介系詞＋格位要整組記。"
      filters={FILTERS}
      itemsFor={itemsFor}
      reviewItems={reviewItems}
      records={records}
      panels={panels}
      featuredPanels={['list']}
      unit={selection => (selection.practice === 'flash' ? '張' : '題')}
      renderQuestion={renderQuestion}
    />
  </>;
}
