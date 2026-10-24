import { useEffect, useRef } from 'react';

// Horizontal swipe for flashcards that also works on iPhone.
// iOS Safari ignores `touch-action: pan-y`, so a sideways drag would otherwise start a page scroll and
// cancel the gesture. Here native touch listeners call preventDefault once the drag is clearly horizontal,
// while vertical drags still scroll the page. Taps are left to the normal click event.
const LOCK_DISTANCE = 8;

export function useSwipe({ onSwipe, onDrag, threshold = 70 } = {}) {
  const ref = useRef(null);
  const handlers = useRef({});
  const suppressClick = useRef(false);
  handlers.current = { onSwipe, onDrag };

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let start = null;

    const begin = (x, y) => { start = { x, y, axis: null }; };
    const move = (x, y, event) => {
      if (!start) return;
      const dx = x - start.x;
      const dy = y - start.y;
      if (!start.axis) {
        if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
        start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (start.axis !== 'x') return;
      if (event.cancelable) event.preventDefault();
      handlers.current.onDrag?.(dx);
    };
    const end = (x) => {
      if (!start) return;
      const { axis, x: startX } = start;
      start = null;
      if (axis !== 'x') return;
      // The browser fires a click after a drag on some devices; ignore it so a swipe never flips the card.
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 350);
      const dx = x - startX;
      if (Math.abs(dx) >= threshold) handlers.current.onSwipe?.(dx > 0 ? 'right' : 'left');
      else handlers.current.onDrag?.(0);
    };
    const cancel = () => {
      if (start?.axis === 'x') handlers.current.onDrag?.(0);
      start = null;
    };

    const ignore = (event) => event.target.closest?.('button, a, input, select, textarea, summary, details');
    const onTouchStart = (event) => {
      if (event.touches.length !== 1 || ignore(event)) return;
      begin(event.touches[0].clientX, event.touches[0].clientY);
    };
    const onTouchMove = (event) => move(event.touches[0].clientX, event.touches[0].clientY, event);
    const onTouchEnd = (event) => end(event.changedTouches[0].clientX);

    // Mouse drag for desktop testing; touch pointers are handled by the touch listeners above.
    const onMouseDown = (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || ignore(event)) return;
      begin(event.clientX, event.clientY);
      const onMoveWindow = (moveEvent) => move(moveEvent.clientX, moveEvent.clientY, moveEvent);
      const onUpWindow = (upEvent) => {
        window.removeEventListener('pointermove', onMoveWindow);
        window.removeEventListener('pointerup', onUpWindow);
        end(upEvent.clientX);
      };
      window.addEventListener('pointermove', onMoveWindow);
      window.addEventListener('pointerup', onUpWindow);
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', cancel);
    element.addEventListener('pointerdown', onMouseDown);
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', cancel);
      element.removeEventListener('pointerdown', onMouseDown);
    };
  }, [threshold]);

  // Spread onto the swipe element: drops the click that some browsers send after a drag.
  const onClickCapture = (event) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.stopPropagation();
    event.preventDefault();
  };

  return { ref, onClickCapture };
}
