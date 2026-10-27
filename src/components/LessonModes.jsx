import React, { useEffect, useState } from 'react';
import { BookOpen, PencilLine, RotateCcw } from 'lucide-react';
import { getLearningSummary, isReviewRequested } from '../lib/progressStorage';

// Items waiting for review per lesson key (l1–l7); every trainer already supports ?review=1.
const REVIEW_COUNT = {
  l1: (s) => s.lesson1ErrorCount,
  l2: (s) => s.lesson2ReviewCount,
  l3: (s) => s.lesson3WrongCount,
  l4: (s) => s.lesson4WrongCount,
  l5: (s) => s.lesson5WrongCount,
  l6: (s) => s.lesson6WrongCount,
  l7: (s) => s.lesson7WrongCount
};

function scrollToId(id) {
  const node = document.getElementById(id);
  if (!node) return;
  if (node.tagName === 'DETAILS') node.open = true;
  node.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Same three entrances on every lesson: learn the rule, practise everything, review mistakes.
export default function LessonModes({ lesson }) {
  const [reviewCount, setReviewCount] = useState(0);
  const reviewing = isReviewRequested();

  useEffect(() => {
    const refresh = () => setReviewCount(REVIEW_COUNT[lesson]?.(getLearningSummary()) || 0);
    refresh();
    window.addEventListener('learning-progress-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('learning-progress-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [lesson]);

  const path = window.location.pathname;
  return (
    <nav className="lesson-modes" aria-label="學習方式">
      <button type="button" className="lesson-mode" onClick={() => scrollToId('concept-card')}>
        <BookOpen size={18} aria-hidden="true" />
        <span><b>學習</b><small>看 1 分鐘重點</small></span>
      </button>
      {reviewing ? (
        <a className="lesson-mode" href={path}>
          <PencilLine size={18} aria-hidden="true" />
          <span><b>練習</b><small>回到全部題目</small></span>
        </a>
      ) : (
        <button type="button" className="lesson-mode is-active" aria-current="true" onClick={() => scrollToId('practice')}>
          <PencilLine size={18} aria-hidden="true" />
          <span><b>練習</b><small>全部題目</small></span>
        </button>
      )}
      {reviewing ? (
        <span className="lesson-mode is-active is-review" aria-current="true">
          <RotateCcw size={18} aria-hidden="true" />
          <span><b>複習中</b><small>{reviewCount ? `還有 ${reviewCount} 題` : '全部複習完了 🎉'}</small></span>
        </span>
      ) : reviewCount > 0 ? (
        <a className="lesson-mode is-review" href={`${path}?review=1`}>
          <RotateCcw size={18} aria-hidden="true" />
          <span><b>複習</b><small>{reviewCount} 題待複習</small></span>
          <i className="lesson-mode-badge">{reviewCount}</i>
        </a>
      ) : (
        <span className="lesson-mode is-disabled" title="答錯的題目會自動加入複習">
          <RotateCcw size={18} aria-hidden="true" />
          <span><b>複習</b><small>目前沒有錯題</small></span>
        </span>
      )}
    </nav>
  );
}
