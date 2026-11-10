import React, { useMemo, useState } from 'react';
import { CheckCircle, Star, XCircle } from 'lucide-react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import SpeakButton from './lesson/SpeakButton.jsx';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { connectorSpeechText } from '../lib/lessonSpeech.mjs';
import { scrambled } from '../lib/lessonRound.mjs';
import { readProgressMap } from '../lib/progressStorage';
import { useAnswerShortcuts, useRevealOnShow } from '../lib/answerFeedback';
import data from '../data/connectors-question-bank.json';

const STORAGE_KEY = 'german-lesson5-connectors-progress';

const MODULES = [
  { id: 'all', label: '全部模組' },
  { id: 'm1-overview', label: '語序總覽' },
  { id: 'm2-reason-result', label: '原因/結果' },
  { id: 'm3-contrast-concession', label: '轉折/讓步' },
  { id: 'm4-time', label: '時間' },
  { id: 'm5-purpose-condition-method', label: '目的/條件/方法' },
  { id: 'm6-paired', label: '成對連接詞' },
  { id: 'm7-mixed-challenge', label: '混合挑戰' }
];

const MODULE_CONNECTORS = {
  'm1-overview': ['und', 'aber', 'oder', 'denn', 'sondern', 'deshalb', 'trotzdem', 'weil', 'dass', 'obwohl', 'wenn'],
  'm2-reason-result': ['weil', 'da', 'denn', 'deshalb', 'deswegen', 'darum'],
  'm3-contrast-concession': ['aber', 'sondern', 'jedoch', 'obwohl', 'trotzdem', 'dennoch', 'zwar_aber'],
  'm4-time': ['wenn', 'als', 'bevor', 'nachdem', 'während', 'seitdem', 'bis', 'sobald'],
  'm5-purpose-condition-method': ['damit', 'um_zu', 'wenn', 'falls', 'sofern', 'indem', 'ohne_zu', 'anstatt_zu'],
  'm6-paired': [
    'nicht_nur_sondern_auch',
    'sowohl_als_auch',
    'entweder_oder',
    'weder_noch',
    'zwar_aber',
    'je_desto',
    'einerseits_andererseits'
  ],
  'm7-mixed-challenge': []
};

const TYPE_LABELS = {
  classify_syntax: '語序分類',
  choose_connector: '選詞',
  order_words: '排序',
  error_correction: '改錯',
  transform_sentence: '改寫',
  pair_connector: '配對',
  cloze: '短文填空',
  sentence_builder: '造句'
};

function loadProgress() {
  const stored = readProgressMap(STORAGE_KEY);
  return {
    answers: stored.answers && typeof stored.answers === 'object' ? stored.answers : {},
    mistakes: Array.isArray(stored.mistakes) ? stored.mistakes : [],
    bookmarks: Array.isArray(stored.bookmarks) ? stored.bookmarks : []
  };
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).join(' ');
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

// Typed sentences are compared without case, punctuation or extra spaces: the lesson is about word order.
function looseSentence(value) {
  return String(value ?? '').normalize('NFC').toLocaleLowerCase('de').replace(/[.,!?;:„“"']/g, ' ').replace(/\s+/g, ' ').trim();
}

// Rewrites have more than one right answer, so a mismatch goes to self-check instead of "wrong".
const SELF_CHECK_TYPES = new Set(['transform_sentence', 'sentence_builder']);

function isAnswerCorrect(question, value) {
  if (question.type === 'pair_connector') {
    const expected = new Set(question.answer.map((item) => `${item.left}:${item.right}`));
    const actual = new Set(Object.entries(value || {}).map(([left, right]) => `${left}:${right}`));
    return expected.size === actual.size && [...expected].every((item) => actual.has(item));
  }

  if (question.type === 'cloze') {
    return question.blanks.every((blank) => normalizeAnswer(value?.[blank.blankIndex]) === normalizeAnswer(blank.answer));
  }

  if (question.type === 'order_words') {
    return normalizeAnswer(value) === normalizeAnswer(question.answer);
  }

  if (question.type === 'transform_sentence' || question.type === 'sentence_builder') {
    return looseSentence(value) === looseSentence(question.sampleAnswer);
  }

  if (question.type === 'error_correction') {
    return [question.answer, ...(question.acceptedAnswers || [])].some((answer) => looseSentence(value) === looseSentence(answer));
  }

  return normalizeAnswer(value) === normalizeAnswer(question.answer);
}

function getAnswerText(question) {
  if (question.type === 'order_words') return question.answerText;
  if (question.type === 'transform_sentence' || question.type === 'sentence_builder') return question.sampleAnswer;
  if (question.type === 'pair_connector') {
    return question.answer.map((item) => `${item.left} + ${item.right}: ${item.meaningZh}`).join(' / ');
  }
  if (question.type === 'cloze') return question.fullAnswer;
  const option = question.options?.find((entry) => entry.id === question.answer);
  return option?.textZh || option?.text || question.answer;
}

const CHOICE_TYPES = new Set(['classify_syntax', 'choose_connector']);
const FILTERS = [
  { id: 'module', label: '模組', options: MODULES },
  { id: 'level', label: '等級', options: [{ id: 'all', label: '全部等級' }, ...['A2', 'B1', 'B2'].map(id => ({ id, label: id }))] }
];
const syntaxById = Object.fromEntries(data.syntaxTypes.map(item => [item.id, item]));
const questionText = question => question.sentenceWithBlank || question.wrongSentence || question.sourceSentence || question.promptDe;

function ConnectorCard({ connector, bookmarked, onBookmark, speak }) {
  return <article className="lf-card">
    <div className="lc-top">
      <div>
        <p className="lc-sentence" lang="de">{connector.word}</p>
        <p>{connector.meaningZh}</p>
      </div>
      <button type="button" className="lc-flag" aria-label={bookmarked ? '取消收藏' : '收藏'} aria-pressed={bookmarked} onClick={() => onBookmark(connector.id)}><Star size={16} fill={bookmarked ? 'currentColor' : 'none'}/></button>
    </div>
    <div className="lc-chips"><span>{syntaxById[connector.syntaxType]?.labelZh || connector.syntaxType}</span></div>
    <p lang="de"><b>{connector.exampleDe}</b> <SpeakButton small label="播放例句" onSpeak={() => speak(connector.exampleDe)}/></p>
    <p>{connector.exampleZh}</p>
    <p>{connector.usageNoteZh}</p>
    {connector.confusableWith?.length > 0 && <p>易混淆：<span lang="de">{connector.confusableWith.join(' / ')}</span></p>}
  </article>;
}

function CardsPanel({ selection, progress, onBookmark, speak }) {
  const [syntax, setSyntax] = useState('all');
  const connectors = data.connectors.filter(connector => {
    const ids = MODULE_CONNECTORS[selection.module];
    if (selection.module !== 'all' && ids?.length && !ids.includes(connector.id)) return false;
    if (selection.level !== 'all' && !String(connector.level).includes(selection.level)) return false;
    return syntax === 'all' || connector.syntaxType === syntax;
  });
  return <>
    <div className="lf-form"><label>語序類型
      <select value={syntax} onChange={event => setSyntax(event.target.value)}>
        <option value="all">全部</option>
        {data.syntaxTypes.map(item => <option key={item.id} value={item.id}>{item.labelZh}</option>)}
      </select>
    </label></div>
    {connectors.length === 0 ? <p className="picker-status">目前篩選沒有連接詞卡片</p>
      : connectors.map(connector => <ConnectorCard key={connector.id} connector={connector} bookmarked={progress.bookmarks.includes(connector.id)} onBookmark={onBookmark} speak={speak}/>)}
  </>;
}

function OrderInput({ question, value, onChange, locked }) {
  const selected = Array.isArray(value) ? value : [];
  // The question bank stores tokens in the correct order, so they must be mixed up before showing them.
  const [tokens] = useState(() => scrambled(question.tokens.map((token, index) => ({ token, index }))));
  const remaining = tokens.filter(item => !selected.some(chosen => chosen.index === item.index));
  return <>
    <div className="lc-tray" lang="de">
      {selected.length === 0 && <span className="lc-sub">依序點選詞塊</span>}
      {selected.map(item => <button key={item.index} type="button" className="lc-token is-picked" disabled={locked} onClick={() => onChange(selected.filter(part => part.index !== item.index))}>{item.token}</button>)}
    </div>
    <div className="lc-tokens" lang="de">
      {remaining.map(item => <button key={item.index} type="button" className="lc-token" disabled={locked} onClick={() => onChange([...selected, item])}>{item.token}</button>)}
    </div>
  </>;
}

function BuildInput({ question, value, onChange, locked }) {
  if (question.type === 'order_words') return <OrderInput question={question} value={value} onChange={onChange} locked={locked}/>;
  if (question.type === 'pair_connector') {
    const pairs = value || {};
    return <div className="lf-form">{question.left.map(left => <label key={left.id}><span lang="de">{left.text}</span>
      <select disabled={locked} value={pairs[left.id] || ''} onChange={event => onChange({ ...pairs, [left.id]: event.target.value })}>
        <option value="">選擇後半</option>
        {question.right.map(right => <option key={right.id} value={right.id}>{right.text}</option>)}
      </select>
    </label>)}</div>;
  }
  if (question.type === 'cloze') {
    const answers = value || {};
    return <div className="lf-form">
      <p className="lc-fact" lang="de">{question.textWithBlanks}</p>
      {question.blanks.map(blank => <label key={blank.blankIndex}>空格 {blank.blankIndex}
        <select disabled={locked} value={answers[blank.blankIndex] || ''} onChange={event => onChange({ ...answers, [blank.blankIndex]: event.target.value })}>
          <option value="">選擇答案</option>
          {blank.options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>)}
    </div>;
  }
  return <div className="lf-form"><textarea lang="de" rows={3} autoCapitalize="none" spellCheck={false} disabled={locked} value={value || ''} onChange={event => onChange(event.target.value)} placeholder="輸入你的答案"/></div>;
}

function hasDraft(question, draft) {
  if (question.type === 'pair_connector') return Object.values(draft || {}).filter(Boolean).length === question.left.length;
  if (question.type === 'cloze') return question.blanks.every(blank => draft?.[blank.blankIndex]);
  if (Array.isArray(draft)) return draft.length > 0;
  return !!String(draft || '').trim();
}

function BuildCard({ question, speak, onFinish, onNext, onPrev, isLast }) {
  const [draft, setDraft] = useState(null);
  const [result, setResult] = useState(null);
  const answered = result === true || result === false;
  const spoken = connectorSpeechText(question);
  useAnswerShortcuts({ answered, onNext });
  const feedbackRef = useRevealOnShow(result !== null);

  function submit() {
    if (result !== null || !hasDraft(question, draft)) return;
    const correct = isAnswerCorrect(question, question.type === 'order_words' ? draft.map(item => item.token) : draft);
    if (!correct && SELF_CHECK_TYPES.has(question.type)) { setResult('check'); return; }
    finish(correct);
  }
  function finish(correct) {
    setResult(correct);
    onFinish(correct);
  }

  return <div className="lc fx-question">
    <div className="lc-prompt">
      <div className="lc-top"><p className="lc-tags"><span>{TYPE_LABELS[question.type] || question.type}</span><span>{question.level}</span></p></div>
      <div className="lc-body">
        <p className="lc-sub">{question.promptZh}</p>
        {question.promptDe && <p className="lc-sentence is-center" lang="de">{question.promptDe}</p>}
        {question.sentenceWithBlank && <p className="lc-fact" lang="de">{question.sentenceWithBlank}</p>}
        {question.wrongSentence && <p className="lc-fact is-bad" lang="de">{question.wrongSentence}</p>}
        {question.sourceSentence && <p className="lc-fact" lang="de">{question.sourceSentence}</p>}
      </div>
    </div>
    <div className={result === false ? 'fx-wrong' : result === true ? 'fx-correct' : undefined}><BuildInput question={question} value={draft} onChange={setDraft} locked={result !== null}/></div>
    {result === null && <>
      <button type="button" className="calm-primary" disabled={!hasDraft(question, draft)} onClick={submit}>送出</button>
      <div className="lc-nav">
        {onPrev && <button type="button" className="calm-link" onClick={onPrev}>上一題</button>}
        <button type="button" className="calm-link" onClick={() => setDraft(null)}>清除</button>
        <button type="button" className="calm-link" onClick={onNext}>跳過</button>
      </div>
    </>}
    {result === 'check' && <div role="status" className="lc-feedback fx-enter">
      <p className="lc-verdict">和範例寫法不同，請自己對照</p>
      <p className="lc-note">你的答案：<span lang="de">{draft}</span></p>
      <p className="lc-note">範例答案：<span lang="de">{question.sampleAnswer}</span></p>
      <p className="lc-note">子句放前或放後、換一個詞序，只要動詞位置正確都算對。</p>
      <div className="calm-actions calm-actions-two">
        <button type="button" className="calm-rate" onClick={() => finish(false)}>我寫錯了</button>
        <button type="button" className="calm-rate" data-tone="know" onClick={() => finish(true)}>我的寫法也正確</button>
      </div>
    </div>}
    {answered && <div ref={feedbackRef} role="status" className="lc-feedback fx-enter" data-correct={result}>
      <p className="lc-verdict">{result ? <CheckCircle size={20}/> : <XCircle size={20}/>}{result ? '答對了' : '需要修正'}</p>
      <p className="lc-solved" lang="de">
        {spoken && <SpeakButton small label="再聽一次" onSpeak={() => speak(spoken)}/>}
        <span>{getAnswerText(question)}</span>
      </p>
      <p className="lc-note">{question.explanationZh}</p>
      <button type="button" className="calm-primary" onClick={onNext}>{isLast ? '看結果' : '下一題'}<span className="kbd-hint" aria-hidden="true">Enter</span></button>
    </div>}
  </div>;
}

export default function ConnectorTrainer() {
  const [progress, setProgress] = useStoredProgress(STORAGE_KEY, loadProgress);
  const { speak, speechMessage } = useGermanSpeech();

  const itemsFor = ({ module, level }) => data.questions.filter(question =>
    (module === 'all' || question.moduleId === module) && (level === 'all' || String(question.level).includes(level)));
  const reviewItems = () => data.questions.filter(question => progress.mistakes.includes(question.id));

  const records = useMemo(() => {
    const answers = Object.values(progress.answers);
    return [
      ['連接詞卡片', data.connectors.length],
      ['答對', `${answers.filter(answer => answer.correct).length}/${answers.length}`],
      ['錯題', progress.mistakes.length]
    ];
  }, [progress]);

  const toggleBookmark = id => setProgress(current => ({
    ...current,
    bookmarks: current.bookmarks.includes(id) ? current.bookmarks.filter(item => item !== id) : [...current.bookmarks, id]
  }));

  function saveAnswer(question, correct) {
    setProgress(current => ({
      ...current,
      answers: { ...current.answers, [question.id]: { correct, answeredAt: new Date().toISOString() } },
      mistakes: correct ? current.mistakes.filter(id => id !== question.id) : [...new Set([...current.mistakes, question.id])]
    }));
  }

  const panels = [
    { id: 'cards', title: '連接詞卡片', render: ({ selection }) => <CardsPanel selection={selection} progress={progress} onBookmark={toggleBookmark} speak={speak}/> },
    { id: 'saved', title: '收藏', render: () => {
      const saved = data.connectors.filter(connector => progress.bookmarks.includes(connector.id));
      return saved.length === 0 ? <p className="picker-status">還沒有收藏的連接詞。</p> : saved.map(connector => <ConnectorCard key={connector.id} connector={connector} bookmarked onBookmark={toggleBookmark} speak={speak}/>);
    } },
    { id: 'mistakes', title: '錯題整理', render: () => {
      const wrong = reviewItems();
      return wrong.length === 0 ? <p className="picker-status">目前沒有錯題。答錯後會自動收進這裡。</p> : wrong.map(question => (
        <div key={question.id} className="lf-card"><p><b>{question.promptZh}</b></p><p lang="de">{questionText(question)}</p><p>{question.explanationZh}</p></div>
      ));
    } },
    { id: 'log', title: '答題紀錄', render: () => {
      const answered = data.questions.filter(question => progress.answers[question.id])
        .sort((a, b) => (progress.answers[b.id]?.answeredAt || '').localeCompare(progress.answers[a.id]?.answeredAt || ''));
      return answered.length === 0 ? <p className="picker-status">目前還沒有答題紀錄。</p> : answered.map(question => {
        const answer = progress.answers[question.id];
        return <div key={question.id} className="lf-card">
          <p className={answer.correct ? 'is-good' : 'is-bad'}><b>{answer.correct ? '答對' : '答錯'}</b> · {TYPE_LABELS[question.type] || question.type}{answer.answeredAt ? ` · ${new Date(answer.answeredAt).toLocaleString('zh-TW')}` : ''}</p>
          <p><b>{question.promptZh}</b></p>
          <p lang="de">{questionText(question)}</p>
          <p>答案：<span lang="de">{getAnswerText(question)}</span></p>
        </div>;
      });
    } }
  ];

  function renderQuestion({ key, item, isLast, report, next, prev }) {
    const finish = correct => { report(correct, getAnswerText(item)); saveAnswer(item, correct); };
    if (!CHOICE_TYPES.has(item.type)) return <BuildCard key={key} question={item} speak={speak} isLast={isLast} onFinish={finish} onNext={next} onPrev={prev}/>;
    const spoken = connectorSpeechText(item);
    const textOf = id => { const option = item.options.find(entry => entry.id === id); return option?.textZh || option?.text || id; };
    return <ChoiceCard
      key={key}
      tag={TYPE_LABELS[item.type] || item.type}
      level={item.level}
      prompt={() => <>
        <p className="lc-sub">{item.promptZh}</p>
        {item.promptDe && <p className="lc-sentence is-center" lang="de">{item.promptDe}</p>}
        {item.sentenceWithBlank && <p className="lc-sentence" lang="de">{item.sentenceWithBlank}</p>}
      </>}
      options={item.options.map(option => option.id)}
      answer={item.answer}
      wide={item.options.some(option => String(option.textZh || option.text).length > 14)}
      optionLang={item.options[0]?.textZh ? undefined : 'de'}
      formatOption={textOf}
      wrongTitle={`正確答案：${textOf(item.answer)}`}
      solved={spoken}
      onSpeak={spoken ? () => speak(spoken) : undefined}
      explain={item.explanationZh}
      isLast={isLast}
      onPrev={prev}
      onSkip={next}
      onNext={next}
      onChoose={(_, correct) => finish(correct)}
    />;
  }

  return <>
    {speechMessage && <p role="status" className="speech-toast">{speechMessage}</p>}
    <LessonApp
    lessonKey="l5"
    title="連接詞與語序"
    blurb="先判斷連接詞會不會改變動詞的位置。"
    filters={FILTERS}
    itemsFor={itemsFor}
    reviewItems={reviewItems}
    records={records}
    panels={panels}
    featuredPanels={['cards']}
    renderQuestion={renderQuestion}
    />
  </>;
}
