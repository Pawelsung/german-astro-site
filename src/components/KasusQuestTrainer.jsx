import React, { useCallback, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import LessonApp from './lesson/LessonApp.jsx';
import ChoiceCard from './lesson/ChoiceCard.jsx';
import { PickerRow } from './lesson/BottomSheet.jsx';
import { useStoredProgress } from '../hooks/useStoredProgress';
import { needsReview as itemNeedsReview, readProgressMap } from '../lib/progressStorage';
import data from '../data/lesson4-kasus-quest-data.json';
import { nextChoiceRecord } from '../lib/lessonRound.mjs';
import { analyzeCaseSentence } from '../lib/caseDiagram.mjs';
import { genderKey } from '../lib/grammarColors.mjs';
import CaseDiagram from './CaseDiagram.jsx';

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
  'boss-challenge': '綜合練習',
  genitiv: 'Genitiv',
  'n-deklination': 'n-Deklination'
};

const STYLE_LABELS = {
  guided: '引導模式',
  detective: '提示模式',
  challenge: '獨立練習'
};

const MODE_GUIDES = {
  genitiv: {
    title: 'Genitiv',
    focus: '問「誰的？」（Wessen?），或看到 wegen／trotz／während／statt 時用 Genitiv。',
    steps: ['冠詞：des／der／des／der（eines、meines、keiner…）', '陽性／中性名詞加 -(e)s：des Films', '陰性和複數名詞本身不變']
  },
  'n-deklination': {
    title: 'n-Deklination',
    focus: '陽性、指人或動物、字尾 -e／-ent／-ist 的名詞，除了 Nominativ 單數都加 -(e)n。',
    steps: ['先判斷格位，選對冠詞', '再看名詞是不是 n-Deklination（der Student、der Kollege…）', '是的話名詞加 -(e)n：den Studenten']
  },
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
  'reflexive-error': '反身代名詞',
  'n-declension-error': 'n-Deklination'
};

// Matches the case colors of the sentence diagram (global.css --case-*).
const CASE_STYLES = {
  Nominativ: 'case-tone-nom',
  Akkusativ: 'case-tone-akk',
  Dativ: 'case-tone-dat',
  Genitiv: 'case-tone-gen'
};

function loadProgress() {
  return readProgressMap(STORAGE_KEY);
}


function cx(...values) {
  return values.filter(Boolean).join(' ');
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

const TRIGGER_TERMS = [
  [/relative pronoun as subject/gi, '關係代名詞當主詞'],
  [/relative pronoun/gi, '關係代名詞'],
  [/relative clause/gi, '關係子句'],
  [/two-way preposition/gi, '雙向介系詞'],
  [/preposition classification/gi, '介系詞分類'],
  [/reflexive/gi, '反身'],
  [/body part/gi, '身體部位'],
  [/^subject$/i, '主詞']
];

// Clue text in Chinese; before answering, case names are masked so the clue points at the
// verb or preposition without giving the answer away.
function triggerText(trigger = '', reveal = false) {
  let text = TRIGGER_TERMS.reduce((value, [pattern, zh]) => value.replace(pattern, zh), String(trigger || '-'));
  if (!reveal) text = text.replace(/Nominativ|Akkusativ|Dativ|Genitiv/g, '？');
  return text;
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
    <div className="lf-card">
      <h4 className="mb-3 text-sm font-black">{title}</h4>
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

const EXERCISES = data.exercises || [];
const FILTERS = [
  { id: 'level', label: '程度', options: [{ id: 'all', label: '全部程度' }, ...['A1', 'A2', 'B1'].map(id => ({ id, label: id }))] },
  { id: 'mode', label: '題型', options: [{ id: 'all', label: '全部題型' }, ...Object.keys(MODE_LABELS).filter(mode => EXERCISES.some(item => item.mode === mode)).map(mode => ({ id: mode, label: MODE_LABELS[mode] }))] },
  { id: 'only', label: '篩選', options: [{ id: 'all', label: '全部題目' }, { id: 'saved', label: '已整理' }] }
];

function KasusPrompt({ item, picked, style }) {
  const [hint, setHint] = useState(false);
  const showClue = style === 'guided' || hint || picked;
  return <>
    <p className="lc-sub">{item.prompt}</p>
    <p className="lc-sentence" lang="de">{item.sentence}</p>
    <p className="lc-sub">{item.translation}</p>
    <div className="lc-chips">
      <span>{genderKey(item.gender) && <i className={`g-dot g-${genderKey(item.gender)}`} />}目標詞：{item.targetNoun || '-'}</span>
      {showClue && <span>線索：{triggerText(item.trigger, !!picked)}</span>}
      {picked && <span className={CASE_STYLES[item.case]}>{item.case}</span>}
    </div>
    {style === 'detective' && !hint && !picked && <button type="button" className="calm-link" onClick={() => setHint(true)}>顯示提示</button>}
  </>;
}

export default function KasusQuestTrainer() {
  const [style, setStyle] = useState('guided');
  const [progress, setProgress] = useStoredProgress(STORAGE_KEY, loadProgress);

  const itemsFor = useCallback(({ level, mode, only }) => EXERCISES.filter(item => {
    const record = progress[item.id] || {};
    return (level === 'all' || item.level === level) && (mode === 'all' || item.mode === mode) && (only !== 'saved' || record.starred || record.needsReview);
  }), [progress]);
  const reviewItems = () => EXERCISES.filter(item => itemNeedsReview(progress[item.id] || {}));

  const summary = useMemo(() => {
    const values = Object.values(progress);
    const correct = values.reduce((sum, item) => sum + (item?.correct || 0), 0);
    const wrong = values.reduce((sum, item) => sum + (item?.wrong || 0), 0);
    return [
      ['已作答', values.filter(item => item?.answered).length],
      ['正確率', correct + wrong ? `${Math.round((correct / (correct + wrong)) * 100)}%` : '—'],
      ['錯誤紀錄', wrong],
      ['需複習', values.filter(itemNeedsReview).length],
      ['已整理', values.filter(item => item?.starred || item?.needsReview).length]
    ];
  }, [progress]);

  const topMistakes = useMemo(() => {
    const totals = {};
    for (const record of Object.values(progress)) {
      if (!record?.wrong) continue;
      for (const type of record.mistakeTypes || []) totals[type] = (totals[type] || 0) + record.wrong;
    }
    return Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 4);
  }, [progress]);

  function toggleFlag(id, flag) {
    setProgress(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [flag]: !prev[id]?.[flag], updatedAt: new Date().toISOString() } }));
  }

  const panels = [
    { id: 'style', title: `作答方式：${STYLE_LABELS[style]}`, render: ({ close }) => Object.entries(STYLE_LABELS).map(([key, label]) => (
      <PickerRow key={key} title={label} detail={{ guided: '一開始就顯示線索', detective: '需要時才點開提示', challenge: '答完才顯示線索' }[key]} selected={style === key} onClick={() => { setStyle(key); close(); }}/>
    )) },
    { id: 'guide', title: '題型說明', render: ({ item }) => {
      const guide = MODE_GUIDES[item?.mode] || MODE_GUIDES['case-detective'];
      return <div className="lf-card"><p><b>{guide.title}</b></p><p>{guide.focus}</p><ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol></div>;
    } },
    { id: 'reference', title: '參考表', render: () => <>
      {data.caseGuide.map(item => (
        <div key={item.case} className={`lf-card ${CASE_STYLES[item.case] || ''}`}><p><b>{item.case} · {item.questionWords.join(' / ')}</b></p><p>{item.zh}</p><p>{item.simpleRule}</p></div>
      ))}
      <ReferenceTable title="定冠詞" table={data.articleTables.definiteArticle} />
      <ReferenceTable title="不定冠詞" table={data.articleTables.indefiniteArticle} />
    </> },
    { id: 'path', title: '學習路徑', render: ({ setFilters }) => data.learningPath.map(item => {
      const { level, mode } = getPathFilter(item);
      return <PickerRow key={item.level} title={cleanPathTitle(item.title)} detail={`${cleanPathLevel(item.level)} · ${item.targetCEFR} · ${item.goals.join('、')}`} onClick={() => setFilters({ level: level === 'ALL' ? 'all' : level, mode: mode === 'ALL' ? 'all' : mode })}/>;
    }) },
    { id: 'mistakes', title: '錯誤類型', render: () => (topMistakes.length === 0
      ? <p className="picker-status">完成幾題後，這裡會整理需要加強的文法點。</p>
      : topMistakes.map(([type, count]) => <div key={type} className="lf-card"><p><b>{MISTAKE_LABELS[type] || type}</b> · {count} 次</p></div>)) }
  ];

  function renderQuestion({ key, item, isLast, report, next, prev }) {
    const record = progress[item.id] || {};
    return <ChoiceCard
      key={key}
      tag={MODE_LABELS[item.mode]}
      level={item.level}
      actions={<>
        <button type="button" className="lc-flag" aria-label={record.starred ? '取消收藏' : '收藏'} aria-pressed={!!record.starred} onClick={() => toggleFlag(item.id, 'starred')}><Star size={16} fill={record.starred ? 'currentColor' : 'none'}/></button>
        <button type="button" className="lc-flag" aria-pressed={!!record.needsReview} onClick={() => toggleFlag(item.id, 'needsReview')}>複習</button>
      </>}
      prompt={picked => <KasusPrompt item={item} picked={picked} style={style}/>}
      options={item.options}
      answer={item.answer}
      wide={!isCompactOptionSet(item)}
      formatOption={cleanOption}
      wrongTitle={`正確答案：${cleanOption(item.answer)}`}
      extra={<>
        {analyzeCaseSentence(item) ? <CaseDiagram exercise={item} /> : <p className="lc-solved" lang="de">{cleanOption(item.fullSentence)}</p>}
        <p className="lc-note">{item.explanationZh}</p>
        <details className="lc-details">
          <summary>判斷線索</summary>
          <dl>
            <div><dt>提問方式</dt><dd>{item.questionWord}</dd></div>
            <div><dt>性別 / 數</dt><dd>{item.gender || '依句意判斷'}</dd></div>
            <div><dt>可能錯誤</dt><dd>{(item.mistakeTypes || []).map(type => MISTAKE_LABELS[type] || type).join('、')}</dd></div>
          </dl>
        </details>
      </>}
      isLast={isLast}
      onPrev={prev}
      onSkip={next}
      onNext={next}
      onChoose={(option, correct) => {
        report(correct, cleanOption(item.fullSentence));
        const now = new Date().toISOString();
        setProgress(prevProgress => {
          const before = prevProgress[item.id] || {};
          return { ...prevProgress, [item.id]: { ...nextChoiceRecord(before, correct, now), lastAnswer: option, lastAnsweredAt: now, mistakeTypes: correct ? before.mistakeTypes || [] : item.mistakeTypes || [] } };
        });
      }}
    />;
  }

  return <LessonApp
    lessonKey="l4"
    title="格位練習"
    blurb="先找句子裡的角色，再決定冠詞和代名詞。"
    filters={FILTERS}
    itemsFor={itemsFor}
    reviewItems={reviewItems}
    records={summary}
    panels={panels}
    renderQuestion={renderQuestion}
  />;
}
