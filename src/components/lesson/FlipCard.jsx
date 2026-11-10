import React, { useEffect, useRef, useState } from 'react';
import { useSwipe } from '../../hooks/useSwipe';

// A card that shows its back on tap. Mount with a new key per card.
export default function FlipCard({ tag, level, actions, front, back, footer, onFirstReveal, onNext, onPrev, isLast }) {
  const [revealed, setRevealed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const seen = useRef(false);
  const swipe = useSwipe({ onDrag: setDragX, onSwipe: direction => { setDragX(0); if (direction === 'left') onNext(); else onPrev?.(); } });

  function flip() {
    if (!seen.current) { seen.current = true; onFirstReveal?.(); }
    setRevealed(value => !value);
  }

  const latest = useRef({});
  latest.current = { flip, onNext, onPrev };
  useEffect(() => {
    const onKey = event => {
      if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || '')) return;
      if (event.key === ' ' && event.target?.tagName !== 'BUTTON') { event.preventDefault(); latest.current.flip(); }
      if (event.key === 'ArrowRight') latest.current.onNext();
      if (event.key === 'ArrowLeft') latest.current.onPrev?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <div className="lc fx-question">
    <div ref={swipe.ref} onClickCapture={swipe.onClickCapture} role="button" tabIndex={0} aria-pressed={revealed} aria-label={revealed ? '翻回正面' : '翻面看答案'}
      className={`calm-card lc-flip${revealed ? ' is-revealed' : ''}`}
      style={{ transform: dragX ? `translateX(${dragX * 0.5}px) rotate(${dragX / 40}deg)` : undefined }}
      onClick={event => { if (!event.target.closest('button, a, summary, details')) flip(); }}
      onKeyDown={event => { if (event.key === 'Enter' && event.target === event.currentTarget) { event.preventDefault(); flip(); } }}>
      <div className="lc-top lc-flip-top">
        <p className="lc-tags">{tag && <span>{tag}</span>}{level && <span>{level}</span>}</p>
        {actions && <div className="lc-actions">{actions}</div>}
      </div>
      {revealed ? back : front}
      {!revealed && <p className="calm-hint">點一下翻面</p>}
    </div>
    {revealed && footer ? footer : <div className="lc-nav">
      {onPrev && <button type="button" className="calm-link" onClick={onPrev}>上一張</button>}
      <button type="button" className="calm-link" onClick={onNext}>{isLast ? '看結果' : revealed ? '下一張' : '跳過'}</button>
    </div>}
  </div>;
}
