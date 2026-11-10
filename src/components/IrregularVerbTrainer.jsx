import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import FlipCard from './lesson/FlipCard.jsx';
import VoiceSettings from './lesson/VoiceSettings.jsx';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { needsReview as itemNeedsReview, readProgressMap } from '../lib/progressStorage';
import { useAnswerShortcuts, useRevealOnShow } from '../lib/answerFeedback';
import { shuffle } from '../lib/lessonRound.mjs';
import { irregularVerbs } from '../data/irregular-verbs';

const STORAGE_KEY = 'irregular-verbs-trainer-v3';
const PRACTICE_LABELS = { flash: '字卡', typing: '拼寫', aux: '助動詞', modal: '情態動詞' };
const LEVELS = [...new Set(irregularVerbs.map(verb => verb.level))];
const FILTERS = [
  { id: 'practice', label: '練習方式', alwaysShow: true, options: Object.entries(PRACTICE_LABELS).map(([id, label]) => ({ id, label })) },
  { id: 'level', label: '程度', options: [{ id: 'all', label: '全部等級' }, ...LEVELS.map(id => ({ id, label: id }))] },
  { id: 'type', label: '動詞類型', options: [{ id: 'all', label: '全部類型' }, { id: 'strong', label: '強變化' }, { id: 'mixed', label: '混合變化' }, { id: 'modal', label: '情態動詞' }, { id: 'special', label: '特殊核心' }] },
  { id: 'aux', label: 'Perfekt 助動詞', options: [{ id: 'all', label: '全部助動詞' }, { id: 'hat', label: 'haben' }, { id: 'ist', label: 'sein' }] },
  { id: 'only', label: '篩選', options: [{ id: 'all', label: '全部動詞' }, { id: 'wrong', label: '錯誤紀錄' }, { id: 'hard', label: '需要複習' }, { id: 'starred', label: '已收藏' }] },
  { id: 'order', label: '字卡順序', options: [{ id: 'seq', label: '依序' }, { id: 'random', label: '隨機' }] }
];
const MODAL_FORMS = ['darf', 'kann', 'mag', 'muss', 'soll', 'will'];

function normalizeText(value = '') {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitPerfekt(perfekt = '') {
  const parts = perfekt.split(' ');
  if (parts.length < 2) {
    return { aux: '', participle: perfekt };
  }
  return {
    aux: parts[0],
    participle: parts.slice(1).join(' ')
  };
}

function loadProgress() {
  return readProgressMap(STORAGE_KEY);
}


function stripEndingForCompare(word = '') {
  const lower = word.toLowerCase();
  if (lower.endsWith('en')) return lower.slice(0, -2);
  if (lower.endsWith('n')) return lower.slice(0, -1);
  if (lower.endsWith('et')) return lower.slice(0, -2);
  if (lower.endsWith('t')) return lower.slice(0, -1);
  return lower;
}

function firstVowelGroup(word = '') {
  const match = word.match(/ie|ei|au|äu|eu|[aäeéiíoöuü]/i);
  return match ? match[0] : '';
}

function highlightChangedVowel(baseWord = '', targetWord = '') {
  if (!targetWord) return targetWord;

  const baseStem = stripEndingForCompare(baseWord);
  const targetStem = stripEndingForCompare(targetWord);

  const baseVowel = firstVowelGroup(baseStem);
  const targetVowel = firstVowelGroup(targetStem);

  if (!targetVowel) return targetWord;

  const shouldHighlight =
    baseVowel &&
    targetVowel &&
    baseVowel.toLowerCase() !== targetVowel.toLowerCase();

  if (!shouldHighlight) return targetWord;

  const index = targetWord.toLowerCase().indexOf(targetVowel.toLowerCase());
  if (index === -1) return targetWord;

  return (
    <>
      {targetWord.slice(0, index)}
      <span className="font-black text-rose-600 underline decoration-2 underline-offset-4">
        {targetWord.slice(index, index + targetVowel.length)}
      </span>
      {targetWord.slice(index + targetVowel.length)}
    </>
  );
}

function renderPerfektWithAuxHighlight(perfekt = '') {
  if (!perfekt) return perfekt;

  const { aux, participle } = splitPerfekt(perfekt);

  const auxClass =
    aux === 'ist'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-sky-100 text-sky-700 border-sky-200';

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={`px-2 py-0.5 rounded-lg border text-sm font-black ${auxClass}`}>
        {aux}
      </span>
      <span>{participle}</span>
    </span>
  );
}

function getTypeMeta(type) {
  const map = {
    strong: {
      label: '強變化',
      cls: 'bg-rose-100 text-rose-700 border-rose-200'
    },
    mixed: {
      label: '混合變化',
      cls: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    modal: {
      label: '情態動詞',
      cls: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    special: {
      label: '特殊核心',
      cls: 'bg-violet-100 text-violet-700 border-violet-200'
    }
  };

  return map[type] || {
    label: '未分類',
    cls: 'bg-slate-100 text-slate-700 border-slate-200'
  };
}

function inferAuxHint(verb) {
  if (verb?.auxiliary === 'ist') {
    return {
      label: 'Perfekt 用 sein',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
  }

  if (verb?.auxiliary === 'hat') {
    return {
      label: 'Perfekt 用 haben',
      cls: 'bg-sky-100 text-sky-700 border-sky-200'
    };
  }

  return null;
}

function deriveLearningState(item = {}) {
  const seen = item.seenCount || 0;
  const correct = item.correctCount || 0;
  const pending = itemNeedsReview(item);

  if (correct >= 5 && !pending) {
    return { label: '已熟記', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }

  if (pending) {
    return { label: '需要複習', cls: 'bg-rose-100 text-rose-600 border-rose-200' };
  }

  if (seen > 0) {
    return { label: '學習中', cls: 'bg-violet-100 text-violet-700 border-violet-200' };
  }

  return { label: '未開始', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function AudioPill({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center"
      aria-label={label}
      title={label}
      type="button"
    >
      🔊
    </button>
  );
}

function matchesFilters(verb, { level, type, aux }) {
  return (level === 'all' || verb.level === level) && (type === 'all' || verb.type === type) && (aux === 'all' || verb.auxiliary === aux);
}

function VerbListPanel({ selection, progress, speak }) {
  const [search, setSearch] = useState('');
  const verbs = useMemo(() => {
    const query = normalizeText(search);
    return irregularVerbs.filter(verb => matchesFilters(verb, selection)
      && (!query || [verb.infinitive, verb.present3rd, verb.praeteritum, verb.perfekt, verb.meaningZh, verb.level, verb.group || '', verb.type || ''].join(' ').toLowerCase().includes(query)));
  }, [search, selection]);
  const renderStats = verb => {
    const item = progress[verb.id] || {};
    return { seen: item.seenCount || 0, correct: item.correctCount || 0, wrong: item.wrongCount || 0, starred: !!item.starred, hard: !!item.isHard };
  };
  return <>
    <div className="lf-form"><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="搜尋動詞、中文、時態..." aria-label="搜尋動詞"/></div>
    <p className="picker-status">共 {verbs.length} 個動詞</p>
    <div className="grid gap-3">
          {verbs.map((verb) => {
            const stats = renderStats(verb);
            const typeMeta = getTypeMeta(verb.type);
            const auxHint = inferAuxHint(verb);
            const learningState = deriveLearningState(progress[verb.id]);

            return (
              <div
                key={verb.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4"
              >
                <div className="grid gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="text-2xl font-black">{verb.infinitive}</div>
                      <AudioPill onClick={() => speak(verb.infinitive)} label="播放動詞發音" />

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-sm font-black border border-violet-200">
                          {verb.level}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-black border ${learningState.cls}`}>
                          {learningState.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-black border ${typeMeta.cls}`}>
                          {typeMeta.label}
                        </span>
                        {auxHint && (
                          <span className={`px-3 py-1 rounded-full text-sm font-black border ${auxHint.cls}`}>
                            {auxHint.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">3. Person</div>
                        <div className="font-black">
                          {highlightChangedVowel(verb.infinitive, verb.present3rd)}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">Präteritum</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black">
                            {highlightChangedVowel(verb.infinitive, verb.praeteritum)}
                          </div>
                          <AudioPill onClick={() => speak(verb.praeteritum)} label="播放過去式發音" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">Perfekt</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black">{renderPerfektWithAuxHighlight(verb.perfekt)}</div>
                          <AudioPill onClick={() => speak(verb.perfekt)} label="播放完成式發音" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">中文</div>
                        <div className="font-black">{verb.meaningZh}</div>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-50 rounded-2xl p-3">
                      <div className="text-xs font-black text-slate-400 mb-2">例句</div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-slate-600 font-medium flex-1">{verb.example}</div>
                        <AudioPill onClick={() => speak(verb.example)} label="播放例句發音" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="text-sm font-black text-slate-500 mb-2">學習紀錄</div>
                    <div className="text-sm font-bold text-slate-700">看過：{stats.seen}</div>
                    <div className="text-sm font-bold text-slate-700">答對：{stats.correct}</div>
                    <div className="text-sm font-bold text-slate-700">答錯：{stats.wrong}</div>
                    <div className="text-sm font-bold text-slate-700">已收藏：{stats.starred ? '是' : '否'}</div>
                    <div className="text-sm font-bold text-slate-700">需要複習：{stats.hard ? '是' : '否'}</div>
                  </div>
                </div>
              </div>
            );
          })}
    </div>
  </>;
}

function VerbForms({ verb, speak }) {
  return <div className="lf-forms">
    <div><small>3. Person</small><p lang="de">{highlightChangedVowel(verb.infinitive, verb.present3rd)}</p></div>
    <div><small>Präteritum</small><p lang="de">{highlightChangedVowel(verb.infinitive, verb.praeteritum)}</p><AudioPill onClick={() => speak(verb.praeteritum)} label="播放過去式發音"/></div>
    <div className="is-wide"><small>Perfekt</small><div lang="de" className="lf-perfekt">{renderPerfektWithAuxHighlight(verb.perfekt)}</div><AudioPill onClick={() => speak(verb.perfekt)} label="播放完成式發音"/></div>
  </div>;
}

function TypingCard({ verb, level, speak, actions, onResult, onNext, onPrev, isLast }) {
  const [past, setPast] = useState('');
  const [perfect, setPerfect] = useState('');
  const [result, setResult] = useState(null);
  useAnswerShortcuts({ answered: result !== null, onNext });
  const feedbackRef = useRevealOnShow(result !== null);

  function submit(event) {
    event.preventDefault();
    if (result !== null || !past.trim() || !perfect.trim()) return;
    const correct = normalizeText(past) === normalizeText(verb.praeteritum) && normalizeText(perfect) === normalizeText(verb.perfekt);
    setResult(correct);
    onResult(correct);
  }

  return <form className="lc fx-question" onSubmit={submit}>
    <div className="lc-prompt">
      <div className="lc-top"><p className="lc-tags"><span>{PRACTICE_LABELS.typing}</span><span>{level}</span></p><div className="lc-actions">{actions}</div></div>
      <div className="lc-body">
        <p className="lc-sentence is-center" lang="de">{verb.infinitive}</p>
        <p className="lc-sub is-center">{verb.meaningZh}</p>
        <div className="lc-center"><AudioPill onClick={() => speak(verb.infinitive)} label="播放動詞發音"/></div>
      </div>
    </div>
    <div className="lf-form">
      <label>Präteritum<input lang="de" autoCapitalize="none" autoComplete="off" spellCheck={false} disabled={result !== null} value={past} onChange={event => setPast(event.target.value)} placeholder="請輸入過去式"/></label>
      <label>Perfekt<input lang="de" autoCapitalize="none" autoComplete="off" spellCheck={false} disabled={result !== null} value={perfect} onChange={event => setPerfect(event.target.value)} placeholder="請輸入完成式"/></label>
    </div>
    {result === null ? <>
      <button className="calm-primary" disabled={!past.trim() || !perfect.trim()}>檢查答案</button>
      <div className="lc-nav">
        {onPrev && <button type="button" className="calm-link" onClick={onPrev}>上一題</button>}
        <button type="button" className="calm-link" onClick={onNext}>跳過</button>
      </div>
    </> : <div ref={feedbackRef} role="status" className="lc-feedback fx-enter" data-correct={result}>
      <p className="lc-verdict">{result ? '答對了' : '正確答案'}</p>
      <p className="lc-solved" lang="de"><span>{verb.infinitive} – {verb.praeteritum} – {verb.perfekt}</span></p>
      <p className="lc-note" lang="de">{verb.example}</p>
      <button type="button" className="calm-primary" onClick={onNext}>{isLast ? '看結果' : '下一題'}</button>
    </div>}
  </form>;
}

export default function IrregularVerbTrainer() {
  const [progress, setProgress] = useStoredProgress(STORAGE_KEY, loadProgress);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const { voices, speak, speechMessage } = useGermanSpeech({ voiceURI: voice, rate, pitch });

  const itemsFor = selection => irregularVerbs.filter(verb => {
    const item = progress[verb.id];
    return matchesFilters(verb, selection)
      && (selection.practice !== 'modal' || verb.type === 'modal')
      && (selection.only !== 'wrong' || itemNeedsReview(item))
      && (selection.only !== 'hard' || item?.isHard)
      && (selection.only !== 'starred' || item?.starred);
  });
  const reviewItems = () => irregularVerbs.filter(verb => itemNeedsReview(progress[verb.id]));

  function updateItem(id, updater) {
    setProgress(prev => ({ ...prev, [id]: { ...updater(prev[id] || {}), updatedAt: new Date().toISOString() } }));
  }
  const markSeen = id => updateItem(id, item => ({ ...item, seenCount: (item.seenCount || 0) + 1 }));
  const markCorrect = id => updateItem(id, item => ({ ...item, correctCount: (item.correctCount || 0) + 1, lastCorrect: true, isHard: false }));
  const markWrong = id => updateItem(id, item => ({ ...item, wrongCount: (item.wrongCount || 0) + 1, lastCorrect: false, isHard: true }));
  const markResult = (id, correct) => (correct ? markCorrect(id) : markWrong(id));

  const records = useMemo(() => {
    const items = Object.values(progress);
    return [
      ['練習過', items.filter(item => (item?.seenCount || 0) + (item?.correctCount || 0) + (item?.wrongCount || 0) > 0).length],
      ['需要複習', items.filter(itemNeedsReview).length],
      ['已收藏', items.filter(item => item?.starred).length]
    ];
  }, [progress]);

  const panels = [
    { id: 'list', title: '動詞列表', render: ({ selection }) => <VerbListPanel selection={selection} progress={progress} speak={speak}/> },
    { id: 'voice', title: '語音設定', render: () => <VoiceSettings voices={voices} voice={voice} onVoice={setVoice} rate={rate} onRate={setRate} pitch={pitch} onPitch={setPitch} autoSpeak={autoSpeak} onAutoSpeak={setAutoSpeak} speak={speak}/> }
  ];

  function flagButtons(verb) {
    const item = progress[verb.id] || {};
    return <>
      <button type="button" className="lc-flag" aria-label={item.starred ? '取消收藏' : '收藏'} aria-pressed={!!item.starred} onClick={() => updateItem(verb.id, current => ({ ...current, starred: !current.starred }))}><Star size={16} fill={item.starred ? 'currentColor' : 'none'}/></button>
      <button type="button" className="lc-flag" aria-pressed={!!item.isHard} onClick={() => updateItem(verb.id, current => ({ ...current, isHard: !current.isHard }))}>複習</button>
    </>;
  }

  function renderQuestion({ key, item: verb, isLast, report, next, prev, selection, review }) {
    const practice = review ? 'flash' : selection.practice;
    if (practice === 'flash') {
      const canClear = review || selection.only === 'wrong' || selection.only === 'hard';
      return <FlipCard
        key={key}
        tag={getTypeMeta(verb.type).label}
        level={verb.level}
        actions={flagButtons(verb)}
        front={<div className="calm-word-block">
          <AutoSpeak enabled={autoSpeak} text={verb.infinitive} speak={speak}/>
          <p className="calm-word" lang="de">{verb.infinitive}</p>
          <p className="lc-sub is-center">{verb.meaningZh}</p>
          <AudioPill onClick={() => speak(verb.infinitive)} label="播放動詞發音"/>
        </div>}
        back={<div className="calm-answer">
          <p className="lc-sentence is-center" lang="de">{verb.infinitive}</p>
          <p className="lc-sub is-center">{verb.meaningZh}</p>
          <VerbForms verb={verb} speak={speak}/>
          <div className="calm-example"><p lang="de">{verb.example}</p></div>
        </div>}
        footer={<div className={`calm-actions${canClear ? ' calm-actions-two' : ' lc-single'}`}>
          {canClear && <button type="button" className="calm-rate" onClick={() => { markCorrect(verb.id); next(); }}>已掌握，移出複習</button>}
          <button type="button" className="calm-rate" data-tone="know" onClick={next}>{isLast ? '看結果' : '下一張'}</button>
        </div>}
        onFirstReveal={() => { markSeen(verb.id); report(null, ''); }}
        isLast={isLast}
        onNext={next}
        onPrev={prev}
      />;
    }
    if (practice === 'typing') {
      return <TypingCard key={key} verb={verb} level={verb.level} speak={speak} actions={flagButtons(verb)} isLast={isLast} onNext={next} onPrev={prev}
        onResult={correct => { report(correct, `${verb.infinitive} – ${verb.praeteritum} – ${verb.perfekt}`); markResult(verb.id, correct); }}/>;
    }
    const isAux = practice === 'aux';
    const answer = isAux ? verb.auxiliary : verb.present3rd;
    const options = isAux ? ['hat', 'ist'] : [verb.present3rd, ...shuffle(MODAL_FORMS.filter(form => form !== verb.present3rd)).slice(0, 3)];
    const label = isAux ? `${verb.infinitive} → ${verb.perfekt}` : `${verb.infinitive} → er ${verb.present3rd}`;
    return <ChoiceCard
      key={key}
      tag={PRACTICE_LABELS[practice]}
      level={verb.level}
      actions={flagButtons(verb)}
      hint={isAux ? 'Perfekt 要用 haben 還是 sein？' : 'er／sie／es 的現在式是？'}
      prompt={() => <>
        <p className="lc-sentence is-center" lang="de">{isAux ? `${verb.infinitive} · ${splitPerfekt(verb.perfekt).participle}` : verb.infinitive}</p>
        <p className="lc-sub is-center">{verb.meaningZh}</p>
        <div className="lc-center"><AudioPill onClick={() => speak(verb.infinitive)} label="播放動詞發音"/></div>
      </>}
      options={options}
      answer={answer}
      wrongTitle={`正確答案：${answer}`}
      solved={label}
      extra={!isAux && <VerbForms verb={verb} speak={speak}/>}
      isLast={isLast}
      onPrev={prev}
      onSkip={next}
      onNext={next}
      onChoose={(_, correct) => { report(correct, label); markResult(verb.id, correct); }}
    />;
  }

  return <>
    {speechMessage && <p role="status" className="speech-toast">{speechMessage}</p>}
    <LessonApp
      lessonKey="l3"
      title="不規則動詞"
      blurb="Infinitiv、Präteritum、Perfekt 三態一起記。"
      filters={FILTERS}
      itemsFor={itemsFor}
      reviewItems={reviewItems}
      records={records}
      panels={panels}
      featuredPanels={['list']}
      unit={selection => (selection.practice === 'flash' ? '張' : '題')}
      isSequential={selection => selection.practice === 'flash' && selection.order === 'seq'}
      renderQuestion={renderQuestion}
    />
  </>;
}

function AutoSpeak({ enabled, text, speak }) {
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setTimeout(() => speak(text), 180);
    return () => clearTimeout(timer);
  }, [enabled, text]);
  return null;
}
