// wo(r)- / da(r)- compounds and "preposition + wen/wem" questions for lesson 2.

const startsWithVowel = (prep) => /^[aeiouäöü]/i.test(prep);
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export const woForm = (prep) => `wo${startsWithVowel(prep) ? 'r' : ''}${prep}`;
export const daForm = (prep) => `da${startsWithVowel(prep) ? 'r' : ''}${prep}`;
export const personForm = (prep, kasus) => `${prep} ${kasus === 'A' ? 'wen' : 'wem'}`;

// The classic slip: "woauf" without r, or "wormit" with an r that does not belong.
const rSlip = (prefix, prep) => `${prefix}${startsWithVowel(prep) ? '' : 'r'}${prep}`;

export const isSentenceStart = (sentence) => sentence.trimStart().startsWith('___');

// Form the blank expects: thing question (wo-), reference back (da-), or person question.
export function woDaAnswer(item, entry) {
  const raw = item.kind === 'wo' ? woForm(entry.prep) : item.kind === 'da' ? daForm(entry.prep) : personForm(entry.prep, entry.case);
  return isSentenceStart(item.sentence) ? capitalize(raw) : raw;
}

// Four options: the answer plus the mistakes this item type invites.
export function woDaOptions(item, entry, otherPreps = []) {
  const { prep } = entry;
  const other = otherPreps.find((p) => p !== prep && woForm(p) !== woForm(prep)) || (prep === 'mit' ? 'für' : 'mit');
  const wrongCase = entry.case === 'A' ? 'D' : 'A';
  const raw = {
    wo: [woForm(prep), rSlip('wo', prep), personForm(prep, entry.case), woForm(other)],
    da: [daForm(prep), rSlip('da', prep), `${prep} es`, daForm(other)],
    person: [personForm(prep, entry.case), personForm(prep, wrongCase), woForm(prep), personForm(other, entry.case)]
  }[item.kind];
  const start = isSentenceStart(item.sentence);
  return [...new Set(raw.map((option) => (start ? capitalize(option) : option)))];
}

export const fillWoDa = (item, answer) => item.sentence.replace('___', answer);

export const WO_DA_RULES = {
  wo: '問「事物」：wo + 介系詞；介系詞以母音開頭時中間加 r（wo + r + auf = worauf）。',
  da: '代替前面說過的「事物」或後面的子句：da + 介系詞；母音開頭一樣加 r（da + r + auf = darauf）。',
  person: '問「人」不能用 wo-，要用「介系詞 + wen（Akk）／wem（Dat）」，格位跟著介系詞搭配走。'
};

export const WO_DA_KIND_LABEL = { wo: '問事物', da: '代替事物', person: '問人' };
