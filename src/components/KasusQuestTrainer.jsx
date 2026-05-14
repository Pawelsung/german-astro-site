import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, RotateCcw, Star, XCircle } from 'lucide-react';
import data from '../data/lesson4-kasus-quest-data.json';

const STORAGE_KEY = 'kasus-quest-trainer-v1';

const MODE_LABELS = {
  'article-builder': '冠詞變化',
  'case-detective': '格位判斷',
  'pronoun-switch': '代名詞替換',
  'verb-case-trainer': '動詞支配格位',
  'preposition-map': '介系詞格位',
  'preposition-classify': '介系詞分類',
  'relative-pronoun-case': '關係代名詞',
  'reflexive-choice': '反身代名詞',
  'sentence-repair': '句子修正',
  'boss-challenge': '綜合練習'
};

const STYLE_LABELS = {
  guided: '引導模式',
  detective: '提示模式',
  challenge: '獨立練習'
};

const MODE_GUIDES = {
  'article-builder': {
    title: '冠詞變化',
    focus: '先判斷格位，再把名詞性別套進冠詞表。',
    steps: ['找出名詞在句中的角色', '確認 der/die/das 或複數', '選出該格位的冠詞形式']
  },
  'case-detective': {
    title: '格位判斷',
    focus: '不要先背答案，先問 Wer、Wen、Wem。',
    steps: ['找出動詞', '問出對應問題', '確認目標詞是主詞、直接受詞或間接受詞']
  },
  'pronoun-switch': {
    title: '代名詞替換',
    focus: '先保留原名詞的性別，再依格位換成正確代名詞。',
    steps: ['看原名詞性別與單複數', '判斷它在句中的格位', '換成 er/ihn/ihm 等對應形式']
  },
  'verb-case-trainer': {
    title: '動詞支配格位',
    focus: '有些動詞會直接要求 Dativ 或特定雙受詞結構。',
    steps: ['先看動詞搭配', '判斷誰是給予或接受對象', '再決定冠詞與代名詞形式']
  },
  'preposition-map': {
    title: '介系詞格位',
    focus: '先分固定格位與雙向介系詞，再看句意。',
    steps: ['確認介系詞', '判斷固定 Akkusativ、固定 Dativ 或雙向', '雙向介系詞再看方向或位置']
  },
  'preposition-classify': {
    title: '介系詞分類',
    focus: '先把介系詞放進分類，之後選冠詞會更穩。',
    steps: ['固定 Akkusativ', '固定 Dativ', '雙向介系詞依語意判斷']
  },
  'relative-pronoun-case': {
    title: '關係代名詞',
    focus: '關係代名詞的格位看它在子句中的角色，不看主句。',
    steps: ['找先行詞的性別與數', '只看關係子句內的角色', '套用關係代名詞表']
  },
  'reflexive-choice': {
    title: '反身代名詞',
    focus: 'mich/mir 的差別取決於反身代名詞在句中承擔的格位。',
    steps: ['確認動詞是否已有另一個 Akkusativ 受詞', '沒有時常用 Akkusativ', '已有時反身代名詞常轉為 Dativ']
  },
  'sentence-repair': {
    title: '句子修正',
    focus: '把錯句拆成動詞、目標詞、格位三個部分來修。',
    steps: ['找出錯誤位置', '確認動詞或介系詞要求', '修正冠詞或代名詞形式']
  },
  'boss-challenge': {
    title: '綜合練習',
    focus: '同一題可能同時有動詞支配、冠詞、介系詞與關係子句。',
    steps: ['先分句', '逐一判斷每個目標詞', '最後再檢查整句是否一致']
  }
};

const MISTAKE_LABELS = {
  'case-error': '格位判斷',
  'article-error': '冠詞變化',
  'verb-pattern-error': '動詞搭配',
  'pronoun-error': '代名詞',
  'preposition-error': '介系詞規則',
  'relative-clause-error': '關係子句',
  'reflexive-error': '反身代名詞'
};

const CASE_STYLES = {
  Nominativ: 'bg-cyan-50 text-cyan-800 border-cyan-300',
  Akkusativ: 'bg-amber-50 text-amber-800 border-amber-300',
  Dativ: 'bg-teal-50 text-teal-800 border-teal-300',
  Genitiv: 'bg-indigo-50 text-indigo-800 border-indigo-300'
};

function loadProgress() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent('learning-progress-updated'));
}

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function getExerciseProgress(progress, id) {
  return progress[id] || {};
}

function cleanPathTitle(title = '') {
  return title
    .replace('格位急救站', '格位基礎整理')
    .replace('A1 復健關：', 'A1 基礎：')
    .replace('A2 核心關：', 'A2 核心：')
    .replace('B1 關係代名詞關', 'B1 關係代名詞')
    .replace('B1 反身代名詞關', 'B1 反身代名詞')
    .replace('B1 綜合破案', 'B1 綜合練習')
    .replace('Boss', '綜合')
    .replace('破案', '練習');
}

function cleanPathLevel(level = '') {
  return level.replace('Boss', '綜合');
}

function cleanOption(option = '') {
  return option
    .replace('Akkusativ Zone', '固定 Akkusativ')
    .replace('Dativ Zone', '固定 Dativ')
    .replace('Two-way Zone', '雙向介系詞');
}

function getPathFilter(item) {
  const title = item.title || '';
  const recommendedModes = item.recommendedModes || [];
  const firstAvailableMode = recommendedModes.find((itemMode) => MODE_LABELS[itemMode]);

  if (title.includes('Nominativ vs Akkusativ')) return { level: 'A1', mode: 'ALL' };
  if (title.includes('Akkusativ vs Dativ')) return { level: 'A2', mode: 'verb-case-trainer' };
  if (title.includes('介系詞')) return { level: 'ALL', mode: 'preposition-map' };
  if (title.includes('關係代名詞')) return { level: 'B1', mode: 'relative-pronoun-case' };
  if (title.includes('反身代名詞')) return { level: 'B1', mode: 'reflexive-choice' };
  if (title.includes('綜合')) return { level: 'B1', mode: 'boss-challenge' };

  return { level: item.targetCEFR === 'A1' ? 'A1' : 'ALL', mode: firstAvailableMode || 'case-detective' };
}

function isCompactOptionSet(exercise) {
  if (!exercise?.options?.length) return true;
  return exercise.options.every((option) => cleanOption(option).length <= 18);
}

function ReferenceTable({ title, table }) {
  const genders = ['m', 'f', 'n', 'pl'];
  const cases = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'];

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-black text-slate-700">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-left text-xs font-bold">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2">格位</th>
              {genders.map((gender) => <th key={gender} className="py-2">{gender}</th>)}
            </tr>
          </thead>
          <tbody>
            {cases.map((caseName) => (
              <tr key={caseName} className="border-t border-slate-100">
                <td className="py-2 text-slate-500">{caseName}</td>
                {genders.map((gender) => (
                  <td key={gender} className="py-2 text-slate-800">{table?.[gender]?.[caseName] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function KasusQuestTrainer() {
  const [level, setLevel] = useState('ALL');
  const [mode, setMode] = useState('ALL');
  const [style, setStyle] = useState('guided');
  const [mistakeOnly, setMistakeOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [activePath, setActivePath] = useState('ALL');
  const [showReference, setShowReference] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const exercises = data.exercises || [];
  const modes = Object.keys(MODE_LABELS).filter((item) => exercises.some((exercise) => exercise.mode === item));

  const filtered = useMemo(() => {
    let next = exercises;
    if (level !== 'ALL') next = next.filter((exercise) => exercise.level === level);
    if (mode !== 'ALL') next = next.filter((exercise) => exercise.mode === mode);
    if (mistakeOnly) next = next.filter((exercise) => getExerciseProgress(progress, exercise.id).wrong > 0);
    if (savedOnly) next = next.filter((exercise) => {
      const item = getExerciseProgress(progress, exercise.id);
      return item.starred || item.needsReview;
    });
    return next;
  }, [exercises, level, mode, mistakeOnly, savedOnly, progress]);

  const current = filtered[currentIndex] || null;
  const currentProgress = current ? getExerciseProgress(progress, current.id) : {};
  const currentGuide = MODE_GUIDES[current?.mode] || MODE_GUIDES['case-detective'];
  const compactOptions = isCompactOptionSet(current);
  const answered = Object.values(progress).filter((item) => item?.answered).length;
  const correct = Object.values(progress).reduce((sum, item) => sum + (item?.correct || 0), 0);
  const wrong = Object.values(progress).reduce((sum, item) => sum + (item?.wrong || 0), 0);
  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const needsReview = Object.values(progress).filter((item) => item?.needsReview || (item?.wrong || 0) > 0).length;
  const savedItems = Object.values(progress).filter((item) => item?.starred || item?.needsReview).length;
  const mistakeStats = Object.values(progress).reduce((acc, item) => {
    if (!item?.wrong) return acc;
    for (const mistakeType of item.mistakeTypes || []) {
      acc[mistakeType] = (acc[mistakeType] || 0) + item.wrong;
    }
    return acc;
  }, {});
  const topMistakes = Object.entries(mistakeStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  function resetAnswer(nextIndex = currentIndex) {
    setSelected(null);
    setShowHint(style === 'guided');
    setCurrentIndex(nextIndex);
  }

  useEffect(() => {
    setCurrentIndex(0);
    setSelected(null);
    setShowHint(style === 'guided');
  }, [level, mode, mistakeOnly, savedOnly, style]);

  function answer(option) {
    if (!current || selected) return;
    const isCorrect = option === current.answer;
    setSelected(option);
    setShowHint(true);
    setProgress((prev) => {
      const item = prev[current.id] || {};
      return {
        ...prev,
        [current.id]: {
          ...item,
          answered: true,
          correct: (item.correct || 0) + (isCorrect ? 1 : 0),
          wrong: (item.wrong || 0) + (isCorrect ? 0 : 1),
          lastAnswer: option,
          lastAnsweredAt: new Date().toISOString(),
          mistakeTypes: isCorrect ? item.mistakeTypes || [] : current.mistakeTypes || []
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
          [flag]: !item[flag]
        }
      };
    });
  }

  function next() {
    if (filtered.length === 0) return;
    resetAnswer((currentIndex + 1) % filtered.length);
  }

  function prev() {
    if (filtered.length === 0) return;
    resetAnswer((currentIndex - 1 + filtered.length) % filtered.length);
  }

  function applyPath(item) {
    const nextFilter = getPathFilter(item);
    setActivePath(item.level);
    setLevel(nextFilter.level);
    setMode(nextFilter.mode);
    setMistakeOnly(false);
    setSavedOnly(false);
  }

  const showInlineHint = style === 'guided' || showHint || selected;
  const showGuidance = showHint || selected;

  return (
    <div className="text-slate-800">
      <details className="mb-3 rounded-2xl border border-teal-100 bg-white p-3 shadow-sm">
        <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-700">篩選與紀錄</div>
            <div className="mt-0.5 truncate text-xs font-bold text-slate-400">
              {level === 'ALL' ? '全部程度' : level} · {mode === 'ALL' ? '全部題型' : MODE_LABELS[mode]} · {filtered.length} 題
            </div>
          </div>
          <span className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-700">設定</span>
        </summary>

        <div className="mt-3 grid gap-3">
          <div className="grid gap-2 md:grid-cols-[110px_1fr_140px_auto_auto_auto] md:items-center">
            <select value={level} onChange={(event) => { setLevel(event.target.value); setActivePath('ALL'); }} className="min-h-10 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm font-bold outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100">
              <option value="ALL">全部程度</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
            </select>

            <select value={mode} onChange={(event) => { setMode(event.target.value); setActivePath('ALL'); }} className="min-h-10 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm font-bold outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100">
              <option value="ALL">全部題型</option>
              {modes.map((item) => <option key={item} value={item}>{MODE_LABELS[item]}</option>)}
            </select>

            <select value={style} onChange={(event) => setStyle(event.target.value)} className="min-h-10 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm font-bold outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100">
              {Object.entries(STYLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>

            <button type="button" onClick={() => setMistakeOnly((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black shadow-sm', mistakeOnly ? 'border-rose-600 bg-rose-600 text-white' : 'border-teal-100 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50')}>
              錯誤紀錄
            </button>

            <button type="button" onClick={() => setSavedOnly((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black shadow-sm', savedOnly ? 'border-amber-500 bg-amber-500 text-white' : 'border-teal-100 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50')}>
              已整理
            </button>

            <button type="button" onClick={() => setShowReference((value) => !value)} className={cx('min-h-10 rounded-xl border px-3 py-2 text-sm font-black shadow-sm', showReference ? 'border-teal-700 bg-teal-700 text-white' : 'border-teal-100 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50')}>
              參考表
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2 overflow-x-auto">
            {[
              ['已作答', answered],
              ['正確率', `${accuracy}%`],
              ['錯誤紀錄', wrong],
              ['目前範圍', filtered.length],
              ['已整理', savedItems]
            ].map(([label, value]) => (
              <div key={label} className="min-w-24 rounded-xl bg-teal-50/70 px-3 py-2">
                <div className="text-[11px] font-black text-slate-400">{label}</div>
                <div className="text-lg font-black text-slate-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {!current ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center font-bold text-slate-500">
          目前篩選條件沒有可練習的題目。
        </div>
      ) : (
        <div className="grid justify-center gap-4 xl:grid-cols-[minmax(0,760px)_320px]">
          <div className="w-full max-w-[760px] min-w-0 rounded-2xl border border-teal-200 bg-teal-50/70 p-2 shadow-md shadow-teal-900/10 md:p-4 dark:bg-slate-900 dark:border-teal-900/60 dark:shadow-black/20">
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-cyan-50/60 to-white p-3 md:p-5 dark:from-teal-950/35 dark:via-cyan-950/20 dark:to-slate-900 dark:border-teal-900/60">
              <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-black text-teal-800">{current.level}</span>
                    <span className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-black text-teal-800">{MODE_LABELS[current.mode]}</span>
                    {showInlineHint && (
                      <span className={cx('rounded-full border px-2.5 py-1 text-[11px] font-black', CASE_STYLES[current.case] || 'border-slate-200 bg-white text-slate-600')}>{current.case}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" aria-label="已收藏" onClick={() => toggleFlag('starred')} className={cx('grid h-9 w-9 place-items-center rounded-xl border shadow-sm transition-colors', currentProgress.starred ? 'border-amber-500 bg-amber-500 text-white' : 'border-teal-100 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50')}>
                    <Star size={16} className={cx(currentProgress.starred && 'fill-white')} />
                  </button>
                  <button type="button" onClick={() => toggleFlag('needsReview')} className={cx('h-9 rounded-xl border px-2.5 text-[11px] font-black shadow-sm transition-colors', currentProgress.needsReview ? 'border-rose-600 bg-rose-600 text-white' : 'border-teal-100 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50')}>
                    複習
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-teal-200 bg-white/90 p-3 shadow-sm md:p-5 dark:bg-slate-900/75 dark:border-teal-900/50">
                <div className="text-xs font-black text-slate-400 md:text-sm">{current.prompt}</div>
                <h2 className="mt-2 break-words text-xl font-black leading-relaxed text-slate-800 md:text-3xl">{current.sentence}</h2>
                <p className="mt-2 text-sm font-bold text-slate-500 md:text-base">{current.translation}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700">目標詞：{current.targetNoun || '-'}</span>
                  {showInlineHint && <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-700">線索：{current.trigger || '-'}</span>}
                </div>
              </div>

              <div className={cx('mt-3 grid gap-2 md:mt-4 md:grid-cols-2', compactOptions && 'grid-cols-2')}>
                {current.options.map((option) => {
                  const isAnswer = option === current.answer;
                  const isSelected = option === selected;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => answer(option)}
                      className={cx(
                        'min-h-14 rounded-2xl border-2 px-3 py-3 text-left text-base font-black shadow-sm transition-all md:px-4',
                        compactOptions && 'text-center',
                        !selected && 'border-teal-100 bg-white text-slate-800 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900',
                        selected && isAnswer && 'border-emerald-600 bg-emerald-100 text-emerald-900 shadow-emerald-100',
                        selected && isSelected && !isAnswer && 'border-rose-600 bg-rose-100 text-rose-900 shadow-rose-100',
                        selected && !isSelected && !isAnswer && 'border-slate-100 bg-slate-50 text-slate-400 shadow-none'
                      )}
                    >
                      {cleanOption(option)}
                    </button>
                  );
                })}
              </div>

              {selected && (
                <div className={cx('mt-4 rounded-2xl border-2 p-4 shadow-sm', selected === current.answer ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50')}>
                  <div className="flex items-center gap-2">
                    {selected === current.answer ? <CheckCircle className="text-emerald-700" size={20} /> : <XCircle className="text-rose-700" size={20} />}
                  <div className={cx('font-black', selected === current.answer ? 'text-emerald-900' : 'text-rose-900')}>{selected === current.answer ? '正確' : `正確答案：${cleanOption(current.answer)}`}</div>
                  </div>
                  <div className="mt-3 break-words text-lg font-black text-slate-800">{cleanOption(current.fullSentence)}</div>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">{current.explanationZh}</p>
                </div>
              )}

              <div className="mt-3">
                {style === 'detective' && !showHint && !selected ? (
                  <button type="button" onClick={() => setShowHint(true)} className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-black text-teal-700 shadow-sm hover:bg-teal-50">
                    顯示提示
                  </button>
                ) : (
                  showGuidance && (
                    <details className="rounded-xl border border-teal-100 bg-white px-3 py-2 shadow-sm">
                      <summary className="cursor-pointer list-none text-sm font-black text-teal-700">判斷線索</summary>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-xl bg-teal-50 px-3 py-2">
                          <div className="text-xs font-black text-slate-400">提問方式</div>
                          <div className="mt-1 font-black">{current.questionWord}</div>
                        </div>
                        <div className="rounded-xl bg-teal-50 px-3 py-2">
                          <div className="text-xs font-black text-slate-400">性別 / 數</div>
                          <div className="mt-1 font-black">{current.gender || '依句意判斷'}</div>
                        </div>
                        <div className="rounded-xl bg-teal-50 px-3 py-2">
                          <div className="text-xs font-black text-slate-400">可能錯誤</div>
                          <div className="mt-1 font-black">{(current.mistakeTypes || []).map((item) => MISTAKE_LABELS[item] || item).join('、')}</div>
                        </div>
                      </div>
                    </details>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={prev} className="rounded-2xl border border-teal-100 bg-white px-4 py-3 text-sm font-black text-teal-700 shadow-sm hover:border-teal-300 hover:bg-teal-50">
                ← 上一題
              </button>
              <button type="button" onClick={next} className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm shadow-teal-900/20 hover:bg-teal-800">
                下一題 →
              </button>
            </div>
          </div>

          <aside className="grid gap-3 xl:self-start">
            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-700">目前題型</h3>
                  <p className="mt-1 text-xs font-bold text-slate-400">{currentGuide.title}</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{STYLE_LABELS[style]}</span>
              </div>
              <p className="text-sm font-bold leading-relaxed text-slate-600">{currentGuide.focus}</p>
              <div className="mt-3 grid gap-2">
                {currentGuide.steps.map((step, index) => (
                  <div key={step} className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold leading-relaxed text-slate-600">
                    <span className="mr-1 text-teal-500">{index + 1}.</span>{step}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-700">錯誤類型</h3>
                <span className="text-xs font-black text-slate-400">{needsReview} 題需要複習</span>
              </div>
              {topMistakes.length === 0 ? (
                <p className="rounded-xl bg-teal-50 px-3 py-5 text-center text-sm font-bold text-slate-400">完成幾題後，這裡會整理需要加強的文法點。</p>
              ) : (
                <div className="grid gap-2">
                  {topMistakes.map(([mistakeType, count]) => (
                    <div key={mistakeType} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl bg-teal-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-700">{MISTAKE_LABELS[mistakeType] || mistakeType}</div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.min(100, count * 18)}%` }} />
                        </div>
                      </div>
                      <div className="text-sm font-black text-rose-500">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showReference && (
              <div className="grid gap-3">
                <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-black text-slate-700">格位判斷流程</h3>
                  <div className="grid gap-2">
                    {data.caseGuide.map((item) => (
                      <div key={item.case} className={cx('rounded-xl border p-3 text-sm', CASE_STYLES[item.case] || 'border-slate-200 bg-slate-50')}>
                        <div className="font-black">{item.case} · {item.questionWords.join(' / ')}</div>
                        <div className="mt-1 font-bold">{item.zh}</div>
                        <div className="mt-1 text-xs opacity-80">{item.simpleRule}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <ReferenceTable title="定冠詞" table={data.articleTables.definiteArticle} />
                <ReferenceTable title="不定冠詞" table={data.articleTables.indefiniteArticle} />
              </div>
            )}

            <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <RotateCcw size={16} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-700">學習路徑</h3>
            </div>
            <div className="grid gap-2">
              {data.learningPath.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => applyPath(item)}
                  className={cx(
                    'rounded-xl p-3 text-left transition-all',
                    activePath === item.level
                      ? 'border border-teal-500 bg-teal-50 shadow-sm'
                      : 'border border-transparent bg-slate-50 hover:border-teal-200 hover:bg-teal-50'
                  )}
                >
                  <div className="text-xs font-black text-slate-400">{cleanPathLevel(item.level)} · {item.targetCEFR}</div>
                  <div className="mt-1 font-black text-slate-800">{cleanPathTitle(item.title)}</div>
                  <div className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{item.goals.join('、')}</div>
                </button>
              ))}
            </div>
          </div>
          </aside>
        </div>
      )}
    </div>
  );
}
