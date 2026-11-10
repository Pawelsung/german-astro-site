import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet, PickerRow } from './lesson/BottomSheet.jsx';

const BANK_NOTES = {
  'a1-b1-part1': '這份字庫依主題整理，未標示每字的個別 CEFR 等級。',
  'course-notes': '依筆記中出現的次數分組（不是課本課次），★ 越多代表上課越常出現。'
};
const groupKey = word => String(word.lesson || word.category);

export default function VocabPicker({ presets, presetId, chapterKey, chapters, words, loading, error, onOpen, onPickPreset, onPickChapter }) {
  const sheet = useRef(null);
  const current = presets.find(p => p.id === presetId);
  const [tab, setTab] = useState('levels');
  const [step, setStep] = useState('banks');
  const chapter = chapters.find(c => c.key === chapterKey);
  const levels = presets.filter(p => p.level);
  const banks = presets.filter(p => !p.level);
  const progress = useMemo(() => {
    const totals = new Map();
    for (const word of words) {
      const entry = totals.get(groupKey(word)) || { practised: 0, review: 0 };
      if (word.attempts > 0 || word.seen > 0) entry.practised++;
      if (word.errors > 0) entry.review++;
      totals.set(groupKey(word), entry);
    }
    return totals;
  }, [words]);

  const close = () => sheet.current?.close();
  function open() {
    onOpen();
    setTab('levels');
    setStep('banks');
    sheet.current?.open();
  }
  async function chooseBank(preset) {
    const groups = preset.id === presetId ? chapters.length : await onPickPreset(preset);
    if (!groups) return;
    if (groups > 1) setStep('groups'); else close();
  }
  function chooseGroup(key) {
    onPickChapter(key);
    close();
  }

  const bankRow = preset => <PickerRow key={preset.id} title={preset.label} detail={`${preset.count} 字`} selected={preset.id === presetId} disabled={loading} onClick={() => chooseBank(preset)}/>;

  return <section className="picker" aria-label="選擇學習範圍">
    <button type="button" className="picker-trigger" aria-haspopup="dialog" onClick={open}>
      <span>{current?.level || current?.label || '自訂字庫'}</span>
      <span className="picker-trigger-group">{chapter?.label || '全部'} · {chapter?.count ?? words.length} 字</span>
      <ChevronDown size={20} aria-hidden="true"/>
    </button>
    <BottomSheet ref={sheet} title={step === 'groups' ? (current?.level || current?.label || '自訂字庫') : '選擇字庫'} onBack={step === 'groups' ? () => setStep('banks') : undefined}>
        {step === 'banks' && <div className="picker-tabs" role="group" aria-label="字庫類型">
          <button type="button" aria-pressed={tab === 'levels'} onClick={() => setTab('levels')}>程度</button>
          <button type="button" aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>我的教材</button>
        </div>}
        <div className="picker-list">
          {step === 'banks' && tab === 'levels' && (levels.length
            ? levels.map(p => <PickerRow key={p.id} title={p.level} detail={`${p.count} 字 · 已學會 ${p.learned}`} value={p.learned} max={p.count} selected={p.id === presetId} disabled={loading} onClick={() => chooseBank(p)}/>)
            : <p className="picker-status">分級字庫暫時無法載入，請重新整理再試。</p>)}
          {step === 'banks' && tab === 'mine' && <>
            {banks.map(bankRow)}
            {presetId === 'custom' && <PickerRow title="已匯入字庫" detail={`${words.length} 字`} selected onClick={() => (chapters.length > 1 ? setStep('groups') : close())}/>}
          </>}
          {step === 'groups' && <>
            {BANK_NOTES[presetId] && <p className="picker-status">{BANK_NOTES[presetId]}</p>}
            <PickerRow title="全部" detail={`${words.length} 字`} selected={chapterKey === 'all'} onClick={() => chooseGroup('all')}/>
            {chapters.map(c => {
              const { practised = 0, review = 0 } = progress.get(c.key) || {};
              return <PickerRow key={c.key} title={c.label} detail={`${c.count} 字 · 已練 ${practised}${review ? ` · 待複習 ${review}` : ''}`} value={practised} max={c.count} selected={chapterKey === c.key} onClick={() => chooseGroup(c.key)}/>;
            })}
          </>}
          {loading && <p role="status" className="picker-status">正在載入字庫…</p>}
          {error && <p role="alert" className="picker-status picker-error">{error}</p>}
        </div>
    </BottomSheet>
  </section>;
}
