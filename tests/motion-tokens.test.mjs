import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync('src/styles/global.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// Walk balanced CSS blocks, including nested media queries and keyframes.
function blocks(source, parents = []) {
  const result = [];
  let start = 0;
  while (start < source.length) {
    const open = source.indexOf('{', start);
    if (open < 0) break;
    let end = open + 1, depth = 1;
    while (depth && end < source.length) {
      if (source[end] === '{') depth++;
      if (source[end] === '}') depth--;
      end++;
    }
    assert.equal(depth, 0, 'balanced CSS');
    const selector = source.slice(start, open).trim();
    const body = source.slice(open + 1, end - 1);
    const context = [...parents, selector];
    if (body.includes('{')) result.push(...blocks(body, context));
    else result.push({ context, body });
    start = end;
  }
  return result;
}
const rules = blocks(css);
const timeLiteral = /(?<![\w-])(?:\d*\.)?\d+(?:ms|s)\b/g;

test('global motion durations and delays use motion tokens, with narrow documented exceptions', () => {
  for (const { context, body } of rules) {
    for (const [, property, value] of body.matchAll(/(?:^|;)\s*((?:transition|animation)(?:-[\w-]+)?)\s*:\s*([^;]+)/g)) {
      for (const [literal] of value.matchAll(timeLiteral)) {
        const selector = context.at(-1);
        const shimmer = selector === '.lesson-skeleton .sk::after' && property === 'animation' && /^fx-shimmer 1\.4s linear infinite$/.test(value.trim()) && literal === '1.4s';
        const tooltip = selector === '.calm-icon[aria-label]:hover::after' && property === 'transition-delay' && literal === '400ms';
        const reduced = context.includes('@media (prefers-reduced-motion: reduce)') && ['animation-duration', 'transition-duration', 'animation-delay', 'transition-delay'].includes(property) && literal === '.01ms';
        assert.ok(shimmer || tooltip || reduced, `${context.join(' > ')}: ${property}: ${value}`);
      }
    }
  }
  for (const duration of [100, 150, 200, 300]) assert.ok(css.includes(`--motion-${duration}: ${duration}ms;`));
});

test('motion curves never overshoot', () => {
  for (const [, values] of css.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
    const points = values.split(',').map(Number);
    assert.ok(points.length === 4 && points.every(Number.isFinite));
    assert.ok(points[1] >= 0 && points[1] <= 1 && points[3] >= 0 && points[3] <= 1, values);
  }
});

function components(dir = 'src/components') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? components(file) : /\.(?:jsx?|tsx?|astro)$/.test(file) ? [file] : [];
  });
}
test('component inline transitions use motion tokens instead of literal times', () => {
  for (const file of components()) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\btransition\s*:\s*(['"`])([\s\S]*?)\1/g)) {
      const value = match[2];
      assert.equal(value.match(timeLiteral), null, `${file}: ${value}`);
      assert.ok(value === 'none' || value.includes('var(--motion-'), `${file}: ${value}`);
    }
  }
});

test('keyframes only animate transform or opacity, except SVG diagram drawing', () => {
  for (const { context, body } of rules) {
    const keyframe = context.find(selector => selector.startsWith('@keyframes '));
    if (!keyframe) continue;
    for (const [, property] of body.matchAll(/(?:^|;)\s*([\w-]+)\s*:/g)) {
      assert.ok(['transform', 'opacity'].includes(property) || (keyframe === '@keyframes cd-draw' && property === 'stroke-dashoffset'), `${keyframe}: ${property}`);
    }
  }
});

test('reduced motion covers elements, pseudo-elements and inline transitions', () => {
  const policy = rules.find(rule => rule.context.includes('@media (prefers-reduced-motion: reduce)') && rule.context.at(-1).includes('*::after'));
  assert.ok(policy);
  for (const property of ['animation-duration', 'transition-duration', 'animation-delay', 'transition-delay']) {
    assert.match(policy.body, new RegExp(`${property}: \\.01ms !important`));
  }
});
