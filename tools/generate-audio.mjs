// Pre-generates natural German audio with Google Cloud Text-to-Speech for every text the site speaks.
// Usage: node --experimental-strip-types tools/generate-audio.mjs [--dry-run] [--limit N]
// Reads GOOGLE_TTS_API_KEY from the environment or .env. Only missing files are generated, so re-runs are cheap;
// clips for texts that no longer exist are deleted.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioKey } from '../src/lib/germanSpeech.mjs';
import { normalizeVocabulary } from '../src/lib/vocabulary.mjs';
import { verbPrepositions } from '../src/data/verb-prepositions.ts';
import { irregularVerbs } from '../src/data/irregular-verbs.ts';
import { woDaPractice } from '../src/data/wo-da-practice.ts';
import { fillWoDa, woDaAnswer } from '../src/lib/woDa.mjs';
import { konjunktivExercises } from '../src/data/lesson7-konjunktiv.ts';
import { fillBlank, formExercises, formPhrase } from '../src/lib/konjunktiv.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const VOICE = 'de-DE-Chirp3-HD-Charon';
const OUT_DIR = join(ROOT, 'public/audio/de-charon');
const MANIFEST = join(ROOT, 'public/audio/manifest.json');
const CONCURRENCY = 4;
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;

function collectTexts() {
  const texts = new Set();
  const add = (value) => { const key = audioKey(value); if (key) texts.add(key); };

  // Lesson 1: every bundled vocabulary file (speak() uses the bare word and the example).
  const vocabDir = join(ROOT, 'public/vocab');
  for (const file of readdirSync(vocabDir).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
    for (const word of normalizeVocabulary(JSON.parse(readFileSync(join(vocabDir, file), 'utf8')))) {
      add(word.word);
      add(word.example);
    }
  }

  // Lesson 2: verbs, examples and the spoken quiz feedback.
  for (const item of verbPrepositions) { add(item.verb); add(item.example); }
  add('Richtig!');
  add('Das ist ein Test für die Aussprache.');
  for (const answer of new Set(['Akkusativ', 'Dativ', ...verbPrepositions.map((item) => item.prep)])) add(`Falsch. Die Antwort ist ${answer}`);
  // wo/da mode reads the completed sentence after each answer.
  const entries = new Map(verbPrepositions.map((item) => [item.id, item]));
  for (const item of woDaPractice) add(fillWoDa(item, woDaAnswer(item, entries.get(item.entryId))));

  // Lesson 7: the solved form or sentence read after each answer (same rule as solvedText in KonjunktivTrainer).
  for (const item of formExercises()) add(formPhrase(item));
  for (const item of konjunktivExercises) {
    if (item.stage === 'transform') add(item.options[0]);
    else if (item.stage === 'function') add(item.sentence);
    else add(fillBlank(item.sentence, item.options[0]));
  }

  // Lesson 3: forms, participle (speak(splitPerfekt(perfekt).participle)) and examples.
  for (const verb of irregularVerbs) {
    add(verb.infinitive); add(verb.praeteritum); add(verb.perfekt); add(verb.example);
    add(String(verb.perfekt || '').split(' ').slice(1).join(' ') || verb.perfekt);
  }
  return [...texts];
}

function readApiKey() {
  if (process.env.GOOGLE_TTS_API_KEY) return process.env.GOOGLE_TTS_API_KEY.trim();
  const envFile = join(ROOT, '.env');
  if (!existsSync(envFile)) return '';
  const line = readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('GOOGLE_TTS_API_KEY='));
  return line ? line.slice('GOOGLE_TTS_API_KEY='.length).trim() : '';
}

const fileName = (text) => `${createHash('sha1').update(`${VOICE}|${text}`).digest('hex').slice(0, 16)}.mp3`;

async function synthesize(text, apiKey, attempt = 1) {
  // Key goes in a header, never the URL, so it cannot leak into logs or error messages.
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    body: JSON.stringify({ input: { text }, voice: { languageCode: 'de-DE', name: VOICE }, audioConfig: { audioEncoding: 'MP3' } })
  });
  // Chirp 3 HD has a per-minute quota, so back off for up to a minute before giving up.
  if ((response.status === 429 || response.status >= 500) && attempt < 7) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(60000, 2000 * 2 ** attempt)));
    return synthesize(text, apiKey, attempt + 1);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${data.error?.status || ''} ${data.error?.message || ''}`.trim());
  return Buffer.from(data.audioContent, 'base64');
}

const texts = collectTexts();
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { voice: VOICE, files: {} };
if (manifest.voice !== VOICE) { manifest.voice = VOICE; manifest.files = {}; }
// Drop clips whose text no longer appears on the site (e.g. after an example sentence was corrected).
const current = new Set(texts);
const stale = Object.keys(manifest.files).filter((text) => !current.has(text));
if (stale.length && !dryRun) {
  for (const text of stale) {
    const file = join(OUT_DIR, manifest.files[text]);
    if (existsSync(file)) rmSync(file);
    delete manifest.files[text];
  }
  writeFileSync(MANIFEST, `${JSON.stringify({ voice: VOICE, files: Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b))) }, null, 0)}\n`);
}
if (stale.length) console.log(`${stale.length} stale clips ${dryRun ? 'would be removed' : 'removed'}`);
const missing = texts.filter((text) => !manifest.files[text] || !existsSync(join(OUT_DIR, manifest.files[text]))).slice(0, limit);
const chars = missing.reduce((sum, text) => sum + text.length, 0);
console.log(`${texts.length} texts total, ${missing.length} to generate (${chars} characters), voice ${VOICE}`);
if (dryRun || missing.length === 0) process.exit(0);

const apiKey = readApiKey();
if (!apiKey) { console.error('Missing GOOGLE_TTS_API_KEY (set it in .env).'); process.exit(1); }
mkdirSync(OUT_DIR, { recursive: true });

const saveManifest = () => {
  const files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify({ voice: VOICE, files }, null, 0)}\n`);
};
let done = 0;
const failures = [];
const queue = [...missing];
async function worker() {
  while (queue.length) {
    const text = queue.shift();
    try {
      const name = fileName(text);
      writeFileSync(join(OUT_DIR, name), await synthesize(text, apiKey));
      manifest.files[text] = name;
    } catch (error) {
      failures.push(`${text}: ${error.message}`);
    }
    done += 1;
    if (done % 50 === 0) { saveManifest(); console.log(`${done}/${missing.length}`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
saveManifest();
console.log(`Done: ${done - failures.length} generated, ${failures.length} failed.`);
if (failures.length) { console.log(failures.slice(0, 10).join('\n')); process.exitCode = 1; }
