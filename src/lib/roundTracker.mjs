// Groups answers into rounds of ROUND_SIZE; when a round fills up, onComplete receives its summary.
export const ROUND_SIZE = 10;

export function createRoundTracker(onComplete, size = ROUND_SIZE) {
  let round = 1;
  let items = [];
  return {
    record(correct, label = '') {
      items.push({ correct: !!correct, label: String(label || '').trim() });
      if (items.length < size) return null;
      const summary = {
        round,
        total: items.length,
        correct: items.filter((item) => item.correct).length,
        mistakes: items.filter((item) => !item.correct && item.label).map((item) => item.label)
      };
      round += 1;
      items = [];
      onComplete?.(summary);
      return summary;
    },
    progress: () => ({ round, answered: items.length, size })
  };
}
