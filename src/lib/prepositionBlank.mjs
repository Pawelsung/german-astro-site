// Finds the preposition to blank out in an example sentence. Handles umlauts (über, für),
// which a plain \b regex misses, contractions such as am / vom / beim / zur, and da-compounds (darüber).
const CONTRACTIONS = {
  an: { am: 'an + dem', ans: 'an + das' },
  von: { vom: 'von + dem' },
  bei: { beim: 'bei + dem' },
  zu: { zum: 'zu + dem', zur: 'zu + der' },
  in: { im: 'in + dem', ins: 'in + das' },
  auf: { aufs: 'auf + das' },
  für: { fürs: 'für + das' },
  über: { übers: 'über + das' },
  um: { ums: 'um + das' }
};

export function blankPreposition(sentence, prep) {
  const key = String(prep).toLowerCase();
  const contractions = CONTRACTIONS[key] || {};
  const forms = [key, ...Object.keys(contractions)].sort((a, b) => b.length - a.length);
  const text = String(sentence);
  const match = new RegExp(`(?<!\\p{L})(${forms.join('|')})(?!\\p{L})`, 'iu').exec(text);
  if (match) {
    const found = match[0];
    const expansion = contractions[found.toLowerCase()] || null;
    return { before: text.slice(0, match.index), after: text.slice(match.index + found.length), found, contraction: expansion ? { form: found, expansion } : null };
  }
  // da-/wo-compounds (darüber, worauf): blank only the preposition part, keep "dar___" visible.
  const compound = new RegExp(`(?<!\\p{L})(da|dar|wo|wor)(${key})(?!\\p{L})`, 'iu').exec(text);
  if (!compound) return null;
  const start = compound.index + compound[1].length;
  return {
    before: text.slice(0, start),
    after: text.slice(start + compound[2].length),
    found: compound[2],
    contraction: { form: compound[0], expansion: `${compound[1].toLowerCase()} + ${key}（代名副詞）` }
  };
}
