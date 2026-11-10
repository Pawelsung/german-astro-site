import React, { useImperativeHandle, useRef } from 'react';
import { ArrowLeft, X } from 'lucide-react';

export function PickerRow({ title, detail, value, max, selected, disabled, onClick }) {
  return <button type="button" className="picker-row" aria-pressed={selected} disabled={disabled} onClick={onClick}>
    <strong>{title}</strong>
    {detail && <span>{detail}</span>}
    {max > 0 && <i className="picker-bar" aria-hidden="true"><b style={{ width: `${Math.round((value / max) * 100)}%` }}/></i>}
  </button>;
}

// A native <dialog> brings focus trapping and Esc for free; on phones it rises from the bottom.
export function BottomSheet({ ref, title, onBack, children }) {
  const dialog = useRef(null);
  useImperativeHandle(ref, () => ({ open: () => dialog.current?.showModal(), close: () => dialog.current?.close() }), []);
  return <dialog ref={dialog} className="picker-sheet" aria-label={title} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
    <div className="picker-panel">
      <header className="picker-head">
        {onBack ? <button type="button" className="calm-icon" aria-label="返回" onClick={onBack}><ArrowLeft size={22}/></button> : <span/>}
        <h2>{title}</h2>
        <button type="button" className="calm-icon" aria-label="關閉" onClick={() => dialog.current?.close()}><X size={22}/></button>
      </header>
      {children}
    </div>
  </dialog>;
}
