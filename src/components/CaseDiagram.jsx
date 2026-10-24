import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { analyzeCaseSentence, CASE_KEYS } from '../lib/caseDiagram.mjs';
import { GENDER_LABELS } from '../lib/grammarColors.mjs';

const CASE_HINTS = { Nominativ: '主格・誰？', Akkusativ: '受格・誰／什麼？', Dativ: '與格・給誰？', Genitiv: '屬格・誰的？' };
const shortCase = (text) => text.replace(/Akkusativ/g, 'Akk').replace(/Dativ/g, 'Dat').replace(/Nominativ/g, 'Nom');

// Groups tokens into chunks so a multi-word target ("den Mann") gets one box and one label.
function buildChunks(model) {
  const roleOf = (i) => {
    const target = model.targets.findIndex((t) => i >= t.start && i <= t.end);
    if (target >= 0) return `t${target}`;
    if (model.antecedent && i >= model.antecedent.start && i <= model.antecedent.end) return 'ante';
    if (model.trigger?.index === i) return 'trig';
    return null;
  };
  const chunks = [];
  model.tokens.forEach((token, i) => {
    const role = roleOf(i);
    const last = chunks.at(-1);
    if (role && last?.role === role) last.words.push(token);
    else chunks.push({ role, words: [token], key: `${i}` });
  });
  return chunks;
}

export default function CaseDiagram({ exercise }) {
  const model = useMemo(() => analyzeCaseSentence(exercise), [exercise]);
  const box = useRef(null);
  const nodes = useRef({});
  const [paths, setPaths] = useState([]);

  useLayoutEffect(() => {
    if (!model || !box.current) return undefined;
    const measure = () => {
      const origin = box.current.getBoundingClientRect();
      const point = (role) => {
        const rect = nodes.current[role]?.getBoundingClientRect();
        return rect ? { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top } : null;
      };
      const curve = (a, b) => {
        const peak = Math.min(a.y, b.y) - 28;
        return `M ${a.x} ${a.y - 2} C ${a.x} ${peak}, ${b.x} ${peak}, ${b.x} ${b.y - 4}`;
      };
      const next = [];
      const target = point('t0');
      const trigger = point('trig');
      const antecedent = point('ante');
      if (trigger && target) next.push({ id: 'trig', d: curve(trigger, target), dashed: false });
      if (antecedent && target) next.push({ id: 'ante', d: curve(target, antecedent), dashed: true });
      setPaths(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [model]);

  if (!model) return null;
  const chunks = buildChunks(model);
  const cases = [...new Set(model.targets.map((t) => t.caseName))].filter((name) => CASE_KEYS[name]);

  return (
    <figure className="case-diagram" aria-label="格位句子圖解">
      <div className="cd-sentence" ref={box} lang="de">
        <svg className="cd-arrows" aria-hidden="true">
          <defs>
            <marker id="cd-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="cd-head" />
            </marker>
          </defs>
          {paths.map((path) => (
            <path key={path.id} d={path.d} pathLength="1" className={path.dashed ? 'cd-link' : 'cd-arrow'} markerEnd={path.dashed ? undefined : 'url(#cd-head)'} />
          ))}
        </svg>
        {chunks.map((chunk) => {
          if (!chunk.role) return <span key={chunk.key} className="cd-word">{chunk.words.join(' ')}</span>;
          const ref = (node) => { nodes.current[chunk.role] = node; };
          if (chunk.role === 'trig') {
            return (
              <span key={chunk.key} ref={ref} className={`cd-chunk cd-trigger cd-${model.trigger.kind}`}>
                <span className="cd-text">{chunk.words.join(' ')}</span>
                <span className="cd-tag">{model.trigger.kind === 'prep' ? '介系詞' : '動詞'} · {shortCase(model.trigger.label)}</span>
              </span>
            );
          }
          if (chunk.role === 'ante') {
            return (
              <span key={chunk.key} ref={ref} className="cd-chunk cd-antecedent">
                <span className="cd-text">{chunk.words.join(' ')}</span>
                <span className="cd-tag">被指代的名詞</span>
              </span>
            );
          }
          const target = model.targets[Number(chunk.role.slice(1))];
          const caseKey = CASE_KEYS[target.caseName] || 'other';
          return (
            <span key={chunk.key} ref={ref} className={`cd-chunk cd-target case-${caseKey}`} style={{ animationDelay: `${Number(chunk.role.slice(1)) * 120}ms` }}>
              <span className="cd-text">{chunk.words.join(' ')}</span>
              <span className="cd-tag">
                {target.gender && <i className={`g-dot g-${target.gender}`} title={GENDER_LABELS[target.gender]} />}
                {target.caseName}{model.targets.length === 1 && model.subject ? ' · 主詞' : ''}
              </span>
            </span>
          );
        })}
      </div>
      <figcaption className="cd-legend">
        {cases.map((name) => (
          <span key={name}><i className={`cd-swatch case-${CASE_KEYS[name]}`} />{name} {CASE_HINTS[name]}</span>
        ))}
        {model.trigger && <span><i className="cd-swatch cd-swatch-arrow" />箭頭：決定格位的{model.trigger.kind === 'prep' ? '介系詞' : '動詞'}</span>}
        {model.antecedent && <span><i className="cd-swatch cd-swatch-link" />虛線：關係代名詞指回的名詞</span>}
      </figcaption>
    </figure>
  );
}
