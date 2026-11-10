import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import SpeakButton from './SpeakButton.jsx';
import { useAnswerShortcuts, useRevealOnShow } from '../../lib/answerFeedback';
import { shuffle } from '../../lib/lessonRound.mjs';

// One multiple-choice question. Mount with a new key per question: options are shuffled once on mount.
export default function ChoiceCard({ tag, level, hint, prompt, options, answer, wide, optionLang = 'de', formatOption = option => option, actions, solved, solvedLang = 'de', translation, explain, extra, wrongTitle, onChoose, onNext, onPrev, onSkip, onSpeak, isLast }) {
  const [order] = useState(() => shuffle(options));
  const [picked, setPicked] = useState(null);
  const correct = picked === answer;

  function choose(option) {
    if (picked) return;
    setPicked(option);
    onChoose(option, option === answer);
  }

  useAnswerShortcuts({ options: order, answered: !!picked, onSelect: choose, onNext });
  const feedbackRef = useRevealOnShow(picked);
  // Once answered, only the right answer and the learner's pick stay, which leaves room for the explanation.
  const shown = picked ? order.filter(option => option === answer || option === picked) : order;

  return <div className="lc fx-question">
    <div className="lc-prompt">
      <div className="lc-top">
        <p className="lc-tags">{tag && <span>{tag}</span>}{level && <span>{level}</span>}</p>
        {actions && <div className="lc-actions">{actions}</div>}
      </div>
      {hint && !picked && <p className="lc-hint">{hint}</p>}
      <div className="lc-body">{prompt(picked)}</div>
    </div>
    <div className={`lc-options${wide ? ' is-wide' : ''}`}>
      {shown.map((option, index) => {
        const state = !picked ? 'open' : option === answer ? 'right' : 'wrong';
        return <button key={option} type="button" data-answer-option data-state={state} disabled={!!picked} lang={optionLang} onClick={() => choose(option)}
          className={`lc-option${state === 'right' ? ' fx-correct' : state === 'wrong' ? ' fx-wrong' : ''}`}>
          {!picked && index < 9 && <span className="kbd-hint" aria-hidden="true">{index + 1}</span>}
          <span>{formatOption(option)}</span>
        </button>;
      })}
    </div>
    {picked ? <div ref={feedbackRef} role="status" className="lc-feedback fx-enter" data-correct={correct}>
      <p className="lc-verdict">{correct ? <CheckCircle size={20}/> : <XCircle size={20}/>}{correct ? '答對了' : wrongTitle}</p>
      {solved && <p className="lc-solved" lang={solvedLang}>
        {onSpeak && <SpeakButton small label="再聽一次" onSpeak={onSpeak}/>}
        <span>{solved}</span>
      </p>}
      {translation && <p className="lc-note">{translation}</p>}
      {explain && <p className="lc-note">{explain}</p>}
      {extra}
      <button type="button" className="calm-primary" onClick={onNext}>{isLast ? '看結果' : '下一題'}<span className="kbd-hint" aria-hidden="true">Enter</span></button>
    </div> : <div className="lc-nav">
      {onPrev && <button type="button" className="calm-link" onClick={onPrev}>上一題</button>}
      {onSkip && <button type="button" className="calm-link" onClick={onSkip}>跳過</button>}
    </div>}
  </div>;
}
