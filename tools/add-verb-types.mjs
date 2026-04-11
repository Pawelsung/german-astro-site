import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/data/irregular-verbs.ts');

const source = fs.readFileSync(filePath, 'utf8');

const mixedIds = new Set([
  'bringen',
  'denken',
  'haben',
  'kennen',
  'nennen',
  'rennen',
  'senden',
  'wissen',
  'wenden',
  'werden'
]);

const specialIds = new Set([
  'sein',
  'haben',
  'werden'
]);

function inferType(block) {
  const idMatch = block.match(/id:\s*"([^"]+)"/);
  const praeteritumMatch = block.match(/praeteritum:\s*"([^"]+)"/);
  const groupMatch = block.match(/group:\s*"([^"]+)"/);

  const id = idMatch?.[1] ?? '';
  const praeteritum = praeteritumMatch?.[1] ?? '';
  const group = groupMatch?.[1] ?? '';

  if (group === 'modal') return 'modal';
  if (specialIds.has(id)) return 'special';
  if (mixedIds.has(id)) return 'mixed';

  const lowerPraet = praeteritum.toLowerCase();

  if (
    lowerPraet.endsWith('te') ||
    lowerPraet.endsWith('tte')
  ) {
    return 'mixed';
  }

  return 'strong';
}

const updated = source.replace(/\{[\s\S]*?\n  \}/g, (block) => {
  if (/type:\s*"/.test(block)) return block;

  const type = inferType(block);

  return block.replace(
    /(level:\s*"[^"]+",)/,
    `$1\n    type: "${type}",`
  );
});

fs.writeFileSync(filePath, updated, 'utf8');

console.log('✅ 已完成：src/data/irregular-verbs.ts 加入 type 欄位');
