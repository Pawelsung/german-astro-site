import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, X } from 'lucide-react';

const BANK_NOTES = {
  'a1-b1-part1': '這份字庫依主題整理，未標示每字的個別 CEFR 等級。',
  'course-notes': '依筆記中出現的次數分組（不是課本課次），★ 越多代表上課越常出現。'
};
const groupKey = word => String(word.lesson || word.category);

function Row({ title, detail, value, max, selected, disabled, onClick }) {
  return <button type="button" className="vp-row" aria-pressed={selected} disabled={disabled} onClick={onClick}>
    <strong>{title}</strong>
    {detail && <span>{detail}</span>}
    {max > 0 && <i className="vp-bar" aria-hidden="true"><b style={{ width: `${Math.round((value / max) * 100)}%` }}/></i>}
  </button>;
}

export default function VocabPicker({ presets, presetId, chapterKey, chapters, words, loading, error, onOpen, onPickPreset, onPickChapter }) {
  const dialog = useRef(null);
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

  const close = () => dialog.current?.close();
  function open() {
    onOpen();
    setTab('levels');
    setStep('banks');
    dialog.current?.showModal();
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

  const bankRow = preset => <Row key={preset.id} title={preset.label} detail={`${preset.count} 字`} selected={preset.id === presetId} disabled={loading} onClick={() => chooseBank(preset)}/>;

  return <section className="vp" aria-label="選擇學習範圍">
    <button type="button" className="vp-trigger" aria-haspopup="dialog" onClick={open}>
      <span>{current?.level || current?.label || '自訂字庫'}</span>
      <span className="vp-trigger-group">{chapter?.label || '全部'} · {chapter?.count ?? words.length} 字</span>
      <ChevronDown size={20} aria-hidden="true"/>
    </button>
    <dialog ref={dialog} className="vp-sheet" aria-label="選擇字庫" onClick={e => { if (e.target === dialog.current) close(); }}>
      <div className="vp-panel">
        <header className="vp-head">
          {step === 'groups'
            ? <button type="button" className="calm-icon" aria-label="回到字庫列表" onClick={() => setStep('banks')}><ArrowLeft size={22}/></button>
            : <span className="vp-head-space"/>}
          <h2>{step === 'groups' ? (current?.level || current?.label || '自訂字庫') : '選擇字庫'}</h2>
          <button type="button" className="calm-icon" aria-label="關閉" onClick={close}><X size={22}/></button>
        </header>
        {step === 'banks' && <div className="vp-tabs" role="group" aria-label="字庫類型">
          <button type="button" aria-pressed={tab === 'levels'} onClick={() => setTab('levels')}>程度</button>
          <button type="button" aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>我的教材</button>
        </div>}
        <div className="vp-list">
          {step === 'banks' && tab === 'levels' && (levels.length
            ? levels.map(p => <Row key={p.id} title={p.level} detail={`${p.count} 字 · 已學會 ${p.learned}`} value={p.learned} max={p.count} selected={p.id === presetId} disabled={loading} onClick={() => chooseBank(p)}/>)
            : <p className="vp-status">分級字庫暫時無法載入，請重新整理再試。</p>)}
          {step === 'banks' && tab === 'mine' && <>
            {banks.map(bankRow)}
            {presetId === 'custom' && <Row title="已匯入字庫" detail={`${words.length} 字`} selected onClick={() => (chapters.length > 1 ? setStep('groups') : close())}/>}
          </>}
          {step === 'groups' && <>
            {BANK_NOTES[presetId] && <p className="vp-status">{BANK_NOTES[presetId]}</p>}
            <Row title="全部" detail={`${words.length} 字`} selected={chapterKey === 'all'} onClick={() => chooseGroup('all')}/>
            {chapters.map(c => {
              const { practised = 0, review = 0 } = progress.get(c.key) || {};
              return <Row key={c.key} title={c.label} detail={`${c.count} 字 · 已練 ${practised}${review ? ` · 待複習 ${review}` : ''}`} value={practised} max={c.count} selected={chapterKey === c.key} onClick={() => chooseGroup(c.key)}/>;
            })}
          </>}
          {loading && <p role="status" className="vp-status">正在載入字庫…</p>}
          {error && <p role="alert" className="vp-status vp-error">{error}</p>}
        </div>
      </div>
    </dialog>
  </section>;
}
