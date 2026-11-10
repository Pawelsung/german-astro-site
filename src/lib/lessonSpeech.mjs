// The German sentence each question reads aloud after it is answered. Shared by the lessons and
// tools/audioTexts.mjs, so every button has a recording. null means there is nothing to read.
const CJK = /[㐀-鿿]/;
const german = text => (text && !CJK.test(text) ? text : null);

// Classification items end in "… Zone", which is a label rather than a sentence.
export const kasusSpeechText = item => (/Zone/.test(item.fullSentence || '') ? null : german(item.fullSentence)?.replace(/\s*→\s*/g, ', ') ?? null);

export function adjectiveSpeechText(item) {
  return german(item.prompt.includes('____') ? item.prompt.replace('____', item.answer) : item.answer) || german(item.answer);
}

function fillConnector(question) {
  const option = question.options.find(entry => entry.id === question.answer);
  // Without a sentence to fill in, the options are whole sentences themselves.
  if (!question.sentenceWithBlank) return german(option?.text);
  const parts = String(option?.text || question.answer).split(/\s*(?:\.\.\.|…|\/)\s*/);
  const pieces = question.sentenceWithBlank.split('___');
  if (pieces.length - 1 !== parts.length) return null;
  return pieces.reduce((text, piece, index) => text + piece + (parts[index] ?? ''), '');
}

export function connectorSpeechText(question) {
  switch (question.type) {
    case 'order_words': return question.answerText;
    case 'transform_sentence':
    case 'sentence_builder': return question.sampleAnswer;
    case 'error_correction': return question.answer;
    case 'cloze': return question.fullAnswer;
    case 'classify_syntax': return german(question.promptDe)?.replace(/\s*\.\.\.\s*/g, ' ') ?? null;
    case 'choose_connector': return fillConnector(question);
    default: return null;
  }
}
