// Shared answer feedback for all trainers: daily activity logging, short synthesized sounds, light haptics,
// keeping the explanation in view, and number/Enter keyboard shortcuts.
import { useEffect, useRef } from 'react';
import { recordAnswer } from './dailyActivity.mjs';

export const SOUND_STORAGE_KEY = 'gw-sound-enabled';

let audioContext = null;

export function isSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function tone(ctx, { frequency, start, duration, type = 'sine', volume = 0.12 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playAnswerSound(correct) {
  if (typeof window === 'undefined' || !isSoundEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    if (correct) {
      tone(audioContext, { frequency: 880, start: now, duration: 0.12 });
      tone(audioContext, { frequency: 1318.5, start: now + 0.09, duration: 0.18 });
    } else {
      tone(audioContext, { frequency: 196, start: now, duration: 0.22, type: 'triangle', volume: 0.16 });
    }
  } catch {
    // Audio is optional; ignore browsers that block it.
  }
}

export function answerCue(correct) {
  recordAnswer(correct);
  playAnswerSound(correct);
  // Browsers block vibrate until the user has tapped the page.
  if (!correct && typeof navigator !== 'undefined' && navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) {
    try { navigator.vibrate(60); } catch { /* unsupported */ }
  }
}

// Scrolls a freshly shown feedback panel into view only when it is (partly) off screen.
export function revealElement(node) {
  if (!node || typeof window === 'undefined') return;
  requestAnimationFrame(() => {
    const rect = node.getBoundingClientRect();
    const margin = 16;
    if (rect.top >= margin && rect.bottom <= window.innerHeight - margin) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
}

// Returns a ref callback that reveals the element whenever `key` changes to a truthy value.
export function useRevealOnShow(key) {
  const nodeRef = useRef(null);
  useEffect(() => {
    if (key) revealElement(nodeRef.current);
  }, [key]);
  return nodeRef;
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

// 1–9 picks an option while unanswered; Enter / → goes to the next question once answered.
export function useAnswerShortcuts({ options = [], answered, onSelect, onNext, enabled = true }) {
  const latest = useRef({});
  latest.current = { options, answered, onSelect, onNext };

  useEffect(() => {
    if (!enabled) return undefined;
    const handler = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const { options: opts, answered: done, onSelect: select, onNext: goNext } = latest.current;
      if (!done && /^[1-9]$/.test(event.key)) {
        const option = opts[Number(event.key) - 1];
        if (option !== undefined) {
          event.preventDefault();
          select?.(option);
        }
        return;
      }
      if (done && (event.key === 'Enter' || event.key === 'ArrowRight')) {
        // Let Enter activate other focused buttons; answer options are already spent.
        if (event.key === 'Enter' && event.target?.tagName === 'BUTTON' && !event.target.hasAttribute('data-answer-option')) return;
        event.preventDefault();
        goNext?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
