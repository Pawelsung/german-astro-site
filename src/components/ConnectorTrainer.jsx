import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  ListChecks,
  RotateCcw,
  Shuffle,
  Star,
  XCircle
} from 'lucide-react';
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

const SYNTAX_STYLES = {
  coordinating: 'border-sky-200 bg-sky-50 text-sky-800',
  connector_adverb: 'border-orange-200 bg-orange-50 text-orange-800',
  subordinating: 'border-violet-200 bg-violet-50 text-violet-800',
  infinitive_construction: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  paired_connector: 'border-rose-200 bg-rose-50 text-rose-800'
};

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function loadProgress() {
  if (typeof window === 'undefined') return { answers: {}, mistakes: [], bookmarks: [] };
  try {
    return {
      answers: {},
      mistakes: [],
      bookmarks: [],
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    };
  } catch {
    return { answers: {}, mistakes: [], bookmarks: [] };
  }
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).join(' ');
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

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
    return normalizeAnswer(value).toLowerCase() === normalizeAnswer(question.sampleAnswer).toLowerCase();
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
  return question.answer;
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'min-w-0 rounded-xl border px-3 py-2 text-xs font-black transition active:scale-95',
        active ? 'border-violet-600 bg-violet-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-violet-50'
      )}
    >
      {children}
    </button>
  );
}

function ConnectorCard({ connector, syntaxType, bookmarked, onBookmark }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-2xl font-black text-slate-900">{connector.word}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{connector.meaningZh}</p>
        </div>
        <button
          type="button"
          onClick={() => onBookmark(connector.id)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700 active:scale-95"
          aria-label="收藏"
          title="收藏"
        >
          <Star className={cx('h-5 w-5', bookmarked && 'fill-violet-500')} />
        </button>
      </div>

      <div className={cx('mb-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-black', SYNTAX_STYLES[connector.syntaxType])}>
        {syntaxType?.labelZh || connector.syntaxType}
      </div>

      <div className="space-y-3 text-sm">
        <div className="min-w-0 rounded-xl bg-slate-50 p-3">
          <p className="break-words font-black text-slate-800">{connector.exampleDe}</p>
          <p className="mt-1 break-words font-bold text-slate-500">{connector.exampleZh}</p>
        </div>
        <p className="break-words font-bold leading-relaxed text-slate-600">{connector.usageNoteZh}</p>
        {connector.confusableWith?.length > 0 && (
          <p className="break-words text-xs font-black text-slate-400">
            易混淆：{connector.confusableWith.join(' / ')}
          </p>
        )}
      </div>
    </article>
  );
}

function LearnView({ connectors, progress, onBookmark }) {
  const syntaxById = Object.fromEntries(data.syntaxTypes.map((item) => [item.id, item]));

  return (
    <div className="space-y-4">
      {connectors.length === 0 ? (
        <div className="min-w-0 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-black text-slate-500">目前篩選沒有連接詞卡片</p>
        </div>
      ) : (
        <section className="grid min-w-0 gap-4 md:grid-cols-2">
          {connectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              syntaxType={syntaxById[connector.syntaxType]}
              bookmarked={progress.bookmarks.includes(connector.id)}
              onBookmark={onBookmark}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ChoiceQuestion({ question, value, onChange, locked }) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-2">
      {question.options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={locked}
          onClick={() => onChange(option.id)}
          className={cx(
            'min-h-12 min-w-0 break-words rounded-xl border px-4 py-3 text-left text-sm font-black transition active:scale-[0.98]',
            value === option.id ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-violet-50'
          )}
        >
          {option.textZh || option.text}
        </button>
      ))}
    </div>
  );
}

function OrderQuestion({ question, value, onChange, locked }) {
  const selected = Array.isArray(value) ? value : [];
  const remaining = question.tokens.filter((token, index) => !selected.some((item) => item.token === token && item.index === index));

  return (
    <div className="space-y-3">
      <div className="min-h-16 min-w-0 rounded-xl border border-violet-100 bg-violet-50 p-3">
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 && <span className="text-sm font-bold text-violet-400">依序點選詞塊</span>}
          {selected.map((item) => (
            <button
              key={`${item.token}-${item.index}`}
              type="button"
              disabled={locked}
              onClick={() => onChange(selected.filter((part) => part.index !== item.index))}
              className="min-w-0 break-words rounded-lg bg-violet-600 px-3 py-2 text-sm font-black text-white"
            >
              {item.token}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map((token) => {
          const index = question.tokens.findIndex((item, itemIndex) => item === token && !selected.some((part) => part.index === itemIndex));
          return (
            <button
              key={`${token}-${index}`}
              type="button"
              disabled={locked}
              onClick={() => onChange([...selected, { token, index }])}
              className="min-w-0 break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 active:scale-95"
            >
              {token}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextQuestion({ question, value, onChange, locked }) {
  return (
    <textarea
      value={value || ''}
      disabled={locked}
      onChange={(event) => onChange(event.target.value)}
      rows={3}
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      placeholder="輸入你的答案"
    />
  );
}

function PairQuestion({ question, value, onChange, locked }) {
  const pairs = value || {};

  return (
    <div className="space-y-3">
      {question.left.map((left) => (
        <div key={left.id} className="grid min-w-0 gap-2 rounded-xl border border-slate-100 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)] sm:items-center">
          <div className="min-w-0 break-words font-black text-slate-800">{left.text}</div>
          <ArrowRight className="hidden h-4 w-4 text-slate-300 sm:block" />
          <select
            disabled={locked}
            value={pairs[left.id] || ''}
            onChange={(event) => onChange({ ...pairs, [left.id]: event.target.value })}
            className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700"
          >
            <option value="">選擇後半</option>
            {question.right.map((right) => (
              <option key={right.id} value={right.id}>{right.text}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function ClozeQuestion({ question, value, onChange, locked }) {
  const answers = value || {};

  return (
    <div className="space-y-4">
      <p className="min-w-0 break-words rounded-xl bg-slate-50 p-3 text-sm font-bold leading-relaxed text-slate-700">{question.textWithBlanks}</p>
      {question.blanks.map((blank) => (
        <label key={blank.blankIndex} className="block">
          <span className="mb-1 block text-xs font-black text-slate-500">空格 {blank.blankIndex}</span>
          <select
            disabled={locked}
            value={answers[blank.blankIndex] || ''}
            onChange={(event) => onChange({ ...answers, [blank.blankIndex]: event.target.value })}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-700"
          >
            <option value="">選擇答案</option>
            {blank.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function QuestionInput({ question, value, onChange, locked }) {
  if (question.type === 'order_words') return <OrderQuestion question={question} value={value} onChange={onChange} locked={locked} />;
  if (question.type === 'pair_connector') return <PairQuestion question={question} value={value} onChange={onChange} locked={locked} />;
  if (question.type === 'cloze') return <ClozeQuestion question={question} value={value} onChange={onChange} locked={locked} />;
  if (question.type === 'error_correction' || question.type === 'transform_sentence' || question.type === 'sentence_builder') {
    return <TextQuestion question={question} value={value} onChange={onChange} locked={locked} />;
  }
  return <ChoiceQuestion question={question} value={value} onChange={onChange} locked={locked} />;
}

function QuestionPrompt({ question }) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">{TYPE_LABELS[question.type] || question.type}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">{question.level}</span>
      </div>
      <h3 className="break-words text-lg font-black leading-snug text-slate-900">{question.promptZh}</h3>
      {question.promptDe && <p className="break-words text-3xl font-black text-violet-700">{question.promptDe}</p>}
      {question.sentenceWithBlank && <p className="min-w-0 break-words rounded-xl bg-slate-50 p-3 text-base font-black text-slate-800">{question.sentenceWithBlank}</p>}
      {question.wrongSentence && <p className="min-w-0 break-words rounded-xl bg-rose-50 p-3 text-base font-black text-rose-800">{question.wrongSentence}</p>}
      {question.sourceSentence && <p className="min-w-0 break-words rounded-xl bg-slate-50 p-3 text-base font-black text-slate-800">{question.sourceSentence}</p>}
    </div>
  );
}

function QuizView({ questions, progress, setProgress }) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState(null);
  const [result, setResult] = useState(null);

  const question = questions[index] || null;

  useEffect(() => {
    setIndex(0);
    setDraft(null);
    setResult(null);
  }, [questions]);

  useEffect(() => {
    setDraft(null);
    setResult(null);
  }, [question?.id]);

  if (!question) {
    return (
      <div className="min-w-0 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="font-black text-slate-500">目前篩選沒有題目</p>
      </div>
    );
  }

  const submit = () => {
    const correct = isAnswerCorrect(
      question,
      question.type === 'order_words' ? (draft || []).map((item) => item.token) : draft
    );
    setResult(correct);
    setProgress((current) => {
      const answers = {
        ...current.answers,
        [question.id]: { correct, answeredAt: new Date().toISOString() }
      };
      const mistakes = correct
        ? current.mistakes.filter((id) => id !== question.id)
        : [...new Set([...current.mistakes, question.id])];
      return { ...current, answers, mistakes };
    });
  };

  const next = () => {
    setIndex((current) => (current + 1) % questions.length);
  };

  const resetQuestion = () => {
    setDraft(null);
    setResult(null);
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-500">
          {index + 1} / {questions.length}
        </div>
        <button
          type="button"
          onClick={() => {
            const shuffled = Math.floor(Math.random() * questions.length);
            setIndex(shuffled);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600"
        >
          <Shuffle className="h-4 w-4" />
          隨機題
        </button>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <QuestionPrompt question={question} />
        <div className="min-w-0 space-y-4">
          <QuestionInput question={question} value={draft} onChange={setDraft} locked={result !== null} />

          {result !== null && (
            <div className={cx('rounded-xl border p-4', result ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50')}>
              <div className="mb-2 flex items-center gap-2 font-black">
                {result ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
                <span className={result ? 'text-emerald-800' : 'text-rose-800'}>
                  {result ? '正確' : '需要修正'}
                </span>
              </div>
              <p className="break-words text-sm font-black text-slate-800">答案：{getAnswerText(question)}</p>
              <p className="mt-2 break-words text-sm font-bold leading-relaxed text-slate-600">{question.explanationZh}</p>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={submit}
              disabled={result !== null}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              送出
            </button>
            <button
              type="button"
              onClick={resetQuestion}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
              重做
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700"
            >
              下一題
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MistakesView({ questions, progress, setMode }) {
  const mistakes = questions.filter((question) => progress.mistakes.includes(question.id));

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-rose-100 bg-white p-4 shadow-sm md:p-5">
      <h2 className="mb-3 text-base font-black text-slate-800">錯題整理</h2>
      {mistakes.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">目前沒有錯題。答錯後會自動收進這裡。</p>
      ) : (
        <div className="space-y-3">
          {mistakes.map((question) => (
            <div key={question.id} className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="break-words text-sm font-black text-rose-900">{question.promptZh}</p>
              <p className="mt-1 break-words text-sm font-bold text-slate-700">{question.sentenceWithBlank || question.wrongSentence || question.sourceSentence || question.promptDe}</p>
              <p className="mt-2 break-words text-xs font-bold leading-relaxed text-slate-600">{question.explanationZh}</p>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setMode('quiz')}
        className="mt-4 rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white"
      >
        回到練習
      </button>
    </section>
  );
}

export default function ConnectorTrainer() {
  const [mode, setMode] = useState('learn');
  const [moduleId, setModuleId] = useState('all');
  const [level, setLevel] = useState('all');
  const [syntax, setSyntax] = useState('all');
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('learning-progress-updated'));
  }, [progress]);

  const connectors = useMemo(() => {
    return data.connectors.filter((connector) => {
      const connectorIds = MODULE_CONNECTORS[moduleId];
      if (moduleId !== 'all' && connectorIds?.length && !connectorIds.includes(connector.id)) return false;
      if (level !== 'all' && !String(connector.level).includes(level)) return false;
      if (syntax !== 'all' && connector.syntaxType !== syntax) return false;
      return true;
    });
  }, [moduleId, level, syntax]);

  const questions = useMemo(() => {
    return data.questions.filter((question) => {
      if (moduleId !== 'all' && question.moduleId !== moduleId) return false;
      if (level !== 'all' && !String(question.level).includes(level)) return false;
      return true;
    });
  }, [moduleId, level]);

  const answeredCount = Object.keys(progress.answers).length;
  const correctCount = Object.values(progress.answers).filter((answer) => answer.correct).length;

  const toggleBookmark = (id) => {
    setProgress((current) => ({
      ...current,
      bookmarks: current.bookmarks.includes(id)
        ? current.bookmarks.filter((item) => item !== id)
        : [...current.bookmarks, id]
    }));
  };

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-5">
      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <BookOpen className="mb-2 h-5 w-5 text-violet-600" />
          <p className="text-2xl font-black text-slate-900">{data.connectors.length}</p>
          <p className="text-xs font-black text-slate-400">連接詞卡片</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <ListChecks className="mb-2 h-5 w-5 text-violet-600" />
          <p className="text-2xl font-black text-slate-900">{data.questions.length}</p>
          <p className="text-xs font-black text-slate-400">練習題</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <CheckCircle className="mb-2 h-5 w-5 text-emerald-600" />
          <p className="text-2xl font-black text-slate-900">{correctCount}/{answeredCount || 0}</p>
          <p className="text-xs font-black text-slate-400">答對紀錄</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <XCircle className="mb-2 h-5 w-5 text-rose-600" />
          <p className="text-2xl font-black text-slate-900">{progress.mistakes.length}</p>
          <p className="text-xs font-black text-slate-400">錯題</p>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterButton active={mode === 'learn'} onClick={() => setMode('learn')}>學習卡</FilterButton>
          <FilterButton active={mode === 'quiz'} onClick={() => setMode('quiz')}>練習</FilterButton>
          <FilterButton active={mode === 'mistakes'} onClick={() => setMode('mistakes')}>錯題</FilterButton>
          <FilterButton active={mode === 'bookmarks'} onClick={() => setMode('bookmarks')}>收藏</FilterButton>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-3">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-black text-slate-400">模組</span>
            <select value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
              {MODULES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-black text-slate-400">等級</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
              <option value="all">全部</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-black text-slate-400">語序類型</span>
            <select value={syntax} onChange={(event) => setSyntax(event.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
              <option value="all">全部</option>
              {data.syntaxTypes.map((item) => <option key={item.id} value={item.id}>{item.labelZh}</option>)}
            </select>
          </label>
        </div>
      </section>

      {mode === 'learn' && <LearnView connectors={connectors} progress={progress} onBookmark={toggleBookmark} />}
      {mode === 'quiz' && <QuizView questions={questions} progress={progress} setProgress={setProgress} />}
      {mode === 'mistakes' && <MistakesView questions={data.questions} progress={progress} setMode={setMode} />}
      {mode === 'bookmarks' && (
        <LearnView
          connectors={data.connectors.filter((connector) => progress.bookmarks.includes(connector.id))}
          progress={progress}
          onBookmark={toggleBookmark}
        />
      )}
    </div>
  );
}
