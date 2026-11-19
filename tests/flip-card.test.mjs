import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const jsx = readFileSync('src/components/lesson/FlipCard.jsx', 'utf8');
const css = readFileSync('src/styles/global.css', 'utf8');

test('both mounted faces share a stable grid with Safari backface protection', () => {
  for (const face of ['front', 'back']) {
    assert.match(jsx, new RegExp(`className="calm-card lc-flip-face lc-flip-${face}"`));
  }
  const faceRule = css.match(/\.lc-flip-face \{([^}]+)\}/)[1];
  assert.match(faceRule, /grid-area: 1 \/ 1/);
  assert.match(faceRule, /backface-visibility: hidden/);
  assert.match(faceRule, /-webkit-backface-visibility: hidden/);
  assert.match(css, /\.lc-flip-inner \{[^}]*transform-style: preserve-3d;[^}]*transition: transform var\(--motion-300\) var\(--ease-out\)/);
  assert.match(css, /\.lc-flip-back \{ transform: rotateY\(180deg\); \}/);
  assert.doesNotMatch(css, /\.lc-flip-back \{[^}]*animation:/);
  assert.doesNotMatch(jsx, /revealed \?[^\n]*\{back\}/);
});

test('inactive faces are inaccessible and the shared controls are outside the rotation', () => {
  assert.match(jsx, /lc-flip-front" aria-hidden=\{revealed\} inert=\{revealed\}/);
  assert.match(jsx, /lc-flip-back" aria-hidden=\{!revealed\} inert=\{!revealed\}/);
  assert.equal((jsx.match(/\{actions\}/g) || []).length, 1);
  assert.ok(jsx.indexOf('{actions}') < jsx.indexOf('className="lc-flip-inner"'));
  assert.match(jsx, /aria-pressed=\{revealed\}/);
  assert.match(jsx, /if \(!seen.current\) \{ seen.current = true; onFirstReveal\?\.\(\); \}/);
  assert.match(jsx, /revealed && footer \? footer/);
});

test('reduced motion removes rotation and explicitly selects the visible face without collapsing layout', () => {
  const reduced = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.lc-flip \.lc-flip-inner, \.lc-flip \.lc-flip-face \{ transform: none; transition: none; \}/);
  assert.match(reduced, /\[aria-hidden="true"\] \{ visibility: hidden; pointer-events: none; \}/);
  assert.match(reduced, /\[aria-hidden="false"\] \{ visibility: visible; \}/);
  assert.doesNotMatch(reduced, /display: none/);
});

test('tag and action row fades out only while the card turns', () => {
  const jsx = readFileSync(new URL('../src/components/lesson/FlipCard.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(jsx, /is-turning/);
  assert.match(jsx, /onTransitionEnd=/);
  assert.match(css, /\.lc-flip\.is-turning \.lc-flip-top \{ opacity: 0;/);
  const reduced = css.slice(css.lastIndexOf('.lc-flip .lc-flip-inner, .lc-flip .lc-flip-face'));
  assert.match(reduced.slice(0, 400), /\.lc-flip\.is-turning \.lc-flip-top \{ opacity: 1; \}/);
});
