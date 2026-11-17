// Colour rules for the whole site. Read docs/AI_HANDOFF.md, "顏色規則", before changing colours.
// 1. Components and pages use token classes (bg-surface, text-ink-muted, bg-sky-soft ...),
//    never Tailwind's numbered palette (bg-sky-100, text-slate-500) or bg-white/text-white.
// 2. Components never write hex or rgb() colours; colours live in src/styles/global.css tokens.
// 3. global.css writes hex/rgb() only on token lines (`--name: value;`). Rules use var(--name).
// 4. Dark mode comes from the :root.dark token values. No `.dark .bg-*` / `.dark .text-*` overrides.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE_DIRS = ['src/components', 'src/pages', 'src/layouts'];
const CSS = 'src/styles/global.css';

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(jsx|tsx|astro)$/.test(name)) out.push(full);
    }
  };
  SOURCE_DIRS.filter((d) => fs.existsSync(d)).forEach(walk);
  return out;
}

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const UTIL = 'bg|text|border(?:-[trblxy])?|ring|ring-offset|outline|divide|from|via|to|fill|stroke|shadow|accent|caret|decoration|placeholder';
const NUMBERED = new RegExp(`(?<![\\w-])(?:[a-z-]+:)*(?:${UTIL})-(?:${PALETTE})-\\d{2,3}(?:\\/\\d+)?(?![\\w-])`, 'g');
const WHITE_BLACK = new RegExp(`(?<![\\w-])(?:[a-z-]+:)*(?:${UTIL})-(?:white|black)(?:\\/\\d+)?(?![\\w-])`, 'g');
const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/g;

function findings(regex) {
  const hits = [];
  for (const file of sourceFiles()) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(regex)) hits.push(`${file}:${i + 1} ${m[0]}`);
    });
  }
  return hits;
}

test('components use colour tokens, not the numbered Tailwind palette', () => {
  const hits = [...findings(NUMBERED), ...findings(WHITE_BLACK)];
  assert.deepEqual(hits, [], `Replace with token classes (bg-surface, text-ink, bg-sky-soft, text-on-solid ...):\n${hits.join('\n')}`);
});

test('components do not write colour values', () => {
  const hits = findings(LITERAL);
  assert.deepEqual(hits, [], `Add a token in global.css and use it:\n${hits.join('\n')}`);
});

test('global.css writes colour values only on token lines', () => {
  const hits = [];
  fs.readFileSync(CSS, 'utf8').split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    if (/[^-]\b(white|black)\b\s*;/.test(line) || line.match(LITERAL)) hits.push(`${CSS}:${i + 1} ${trimmed.slice(0, 90)}`);
  });
  assert.deepEqual(hits, [], `Move the value into a token:\n${hits.join('\n')}`);
});

test('dark mode comes from tokens, not utility overrides', () => {
  const css = fs.readFileSync(CSS, 'utf8');
  const overrides = css.match(/\.dark \.(?:[a-z-]+\\:)*(?:bg|text|border|ring|from|to)-(?:white|black|[a-z]+-\d{2,3})/g) || [];
  assert.deepEqual(overrides, [], 'Give the token a dark value in :root.dark instead of overriding a Tailwind class');
});

test('every hue token has a light and a dark value', () => {
  const css = fs.readFileSync(CSS, 'utf8');
  const block = (selector) => {
    const start = css.indexOf(`${selector} {`);
    return css.slice(start, css.indexOf('\n}', start));
  };
  const light = block(':root');
  const dark = block(':root.dark');
  for (const hue of ['sky', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'amber']) {
    for (const part of ['soft', 'line', 'ink']) {
      assert.ok(light.includes(`--${hue}-${part}:`), `light --${hue}-${part}`);
      assert.ok(dark.includes(`--${hue}-${part}:`), `dark --${hue}-${part}`);
    }
  }
});
