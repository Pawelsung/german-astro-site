// Browser glue between lesson 1 and the review record. The lexicon index is fetched only here,
// so pages that never practise vocabulary do not pay for it.
import indexUrl from '../data/lexicon/site/index.json?url';
import a1Url from '../data/lexicon/site/A1.json?url';
import a2Url from '../data/lexicon/site/A2.json?url';
import b1Url from '../data/lexicon/site/B1.json?url';
import b2Url from '../data/lexicon/site/B2.json?url';
import c1Url from '../data/lexicon/site/C1.json?url';
import { PROGRESS_KEYS, readJSON, writeJSON } from './progressStorage';
import { applyLessonAnswer, decodeReview, encodeReview, mergeReview } from './reviewStore.mjs';
import { buildResolver, migrateLegacyWords } from './reviewMigrate.mjs';

const ARCHIVE_KEY = 'german-vocabulary-library-v1';
const DETAIL_URLS = { A1: a1Url, A2: a2Url, B1: b1Url, B2: b2Url, C1: c1Url };
const details = new Map();
let resolver = null;
let indexRows = null;
let loading = null;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

function loadIndex() {
  if (indexRows) return Promise.resolve(indexRows);
  loading ||= fetchJson(indexUrl)
    .then(rows => { indexRows = rows; resolver = buildResolver(rows); return rows; })
    .finally(() => { loading = null; });
  return loading;
}

const loadResolver = () => loadIndex().then(() => resolver);

export async function loadLexicon() {
  const rows = await loadIndex();
  return {
    rows: new Map(rows.map(row => [row[0], row])),
    pool: rows.filter(row => row[6]).map(row => ({ id: row[0], level: row[3] }))
  };
}

export async function loadLevelDetails(levels) {
  await Promise.all(levels.filter(level => !details.has(level)).map(async level => { details.set(level, await fetchJson(DETAIL_URLS[level])); }));
  return Object.assign({}, ...levels.map(level => details.get(level)));
}

export const readStoredReview = () => readJSON(PROGRESS_KEYS.review, null);

// writeJSON reports failure by event only, so a save is confirmed by reading it back.
export function saveReview(review) {
  const encoded = encodeReview(review);
  writeJSON(PROGRESS_KEYS.review, encoded);
  return readStoredReview()?.words === encoded.words;
}

export async function migrateLessonProgress() {
  const resolve = await loadResolver();
  const result = migrateLegacyWords({
    currentWords: readJSON(PROGRESS_KEYS.lesson1Words, []),
    archive: readJSON(ARCHIVE_KEY, {}),
    review: decodeReview(readStoredReview()),
    resolve
  });
  const saved = result.addedWords || result.addedStars ? saveReview(result.review) : true;
  return { ...result, saved };
}

// Practice before the index has loaded is not lost: the migration picks it up on the next visit.
export function recordLessonPractice(word, outcome) {
  const id = resolver?.(word);
  if (!id) return;
  const review = decodeReview(readStoredReview());
  const next = applyLessonAnswer(id, review.words[id], outcome);
  if (!next || next === review.words[id]) return;
  review.words[id] = next;
  saveReview(review);
}

export function mergeImportedReview(stored) {
  return saveReview(mergeReview(decodeReview(readStoredReview()), decodeReview(stored)));
}
