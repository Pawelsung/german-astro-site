import React, { useImperativeHandle, useRef, useState } from 'react';
import { BottomSheet, PickerRow } from './BottomSheet.jsx';
import { SOUND_STORAGE_KEY, isSoundEnabled } from '../../lib/answerFeedback';
import { LESSON_LINKS } from '../../lib/lessonLinks.mjs';

export const openConcept = () => document.getElementById('lesson-concept')?.showModal();

// The ⋯ sheet: records, the lesson's own panels, sound and the other lessons.
// panels: [{ id, title, render({ item, selection, setFilters, close }) }]
export function LessonMenu({ ref, records = [], panels = [], panelArgs }) {
  const sheet = useRef(null);
  const [panelId, setPanelId] = useState(null);
  const [sound, setSound] = useState(isSoundEnabled);
  const panel = panels.find(item => item.id === panelId);
  const here = window.location.pathname.replace(/\/$/, '');

  useImperativeHandle(ref, () => ({
    open(id = null) { setPanelId(id); sheet.current?.open(); },
    close() { sheet.current?.close(); }
  }), []);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    try { localStorage.setItem(SOUND_STORAGE_KEY, String(next)); } catch { /* the choice lasts for this page only */ }
  }

  function showConcept() {
    sheet.current?.close();
    openConcept();
  }

  return <BottomSheet ref={sheet} title={panel?.title || '更多選項'} onBack={panel ? () => setPanelId(null) : undefined}>
    <div className="picker-list">
      {panel ? panel.render({ ...panelArgs, close: () => setPanelId(null) }) : <>
        {records.length > 0 && <dl className="lf-records">{records.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <PickerRow title="看 1 分鐘重點" onClick={showConcept}/>
        {panels.map(item => <PickerRow key={item.id} title={item.title} onClick={() => setPanelId(item.id)}/>)}
        <PickerRow title={`答題音效：${sound ? '開' : '關'}`} onClick={toggleSound}/>
        <p className="picker-status">換一課</p>
        <nav className="lf-lessons" aria-label="切換學習主題">
          {LESSON_LINKS.map(([href, label]) => <a key={href} href={href} aria-current={here === href.replace(/\/$/, '') ? 'page' : undefined}>{label}</a>)}
        </nav>
        <a className="calm-link" href="/">回首頁</a>
      </>}
    </div>
  </BottomSheet>;
}
