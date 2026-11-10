// Rounds of questions for the lesson screens. Pure functions, so the rules can be tested without a browser.
import { ROUND_SIZE } from './roundTracker.mjs';

export function shuffle(list, random = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Works through a shuffled pool so nothing repeats until every item has been seen.
export function takeRound(queue, pool, { size = ROUND_SIZE, random = Math.random } = {}) {
  const available = new Set(pool);
  const remaining = queue.filter(item => available.has(item));
  const round = remaining.slice(0, size);
  let rest = remaining.slice(size);
  if (round.length < size) {
    const refill = shuffle(pool.filter(item => !round.includes(item)), random);
    const needed = size - round.length;
    round.push(...refill.slice(0, needed));
    rest = refill.slice(needed);
  }
  return { round, queue: rest };
}

export const emptySelection = filters => Object.fromEntries(filters.map(filter => [filter.id, filter.options[0].id]));

// Keeps a saved choice only while that option still exists.
export function cleanSelection(saved, filters) {
  return Object.fromEntries(filters.map(filter => [filter.id, filter.options.some(option => option.id === saved?.[filter.id]) ? saved[filter.id] : filter.options[0].id]));
}

// A shuffled copy that is never in the original order, because the original order is the answer.
export function scrambled(list, random = Math.random) {
  if (new Set(list).size < 2) return [...list];
  let result;
  do { result = shuffle(list, random); } while (result.every((item, index) => item === list[index]));
  return result;
}

// True when a hint shown before answering already contains the answer as a whole word.
export function revealsAnswer(hint, answer) {
  if (!hint || !answer) return false;
  const escaped = String(answer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, 'iu').test(hint);
}

export function roundVerdict(correct, total) {
  const ratio = correct / total;
  if (ratio === 1) return '滿分！太厲害了 🎉';
  if (ratio >= 0.8) return '很棒，繼續保持！';
  if (ratio >= 0.5) return '不錯！把錯的再看一次會更穩。';
  return '先看一下重點卡，再來一輪會更順。';
}

// The stored shape for one answered question in lessons that track answered/correct/wrong per item.
export function nextChoiceRecord(before = {}, correct, now = new Date().toISOString()) {
  return {
    ...before,
    answered: true,
    correct: (before.correct || 0) + Number(correct),
    wrong: (before.wrong || 0) + Number(!correct),
    lastCorrect: correct,
    needsReview: !correct,
    updatedAt: now
  };
}
