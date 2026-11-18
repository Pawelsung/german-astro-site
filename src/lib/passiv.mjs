// Shared by the trainer and the audio collector.
export function solvedText(item) {
  if (item.stage === 'transform') return item.options[0];
  if (item.stage === 'state') return item.sentence;
  return item.sentence.replace('___', item.options[0]);
}
