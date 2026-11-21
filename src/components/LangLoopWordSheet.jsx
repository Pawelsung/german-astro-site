import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BottomSheet } from './lesson/BottomSheet.jsx';
import SpeakButton from './lesson/SpeakButton.jsx';
import { lookupWord, saveWord } from '../lib/langloopClient';
import { addToReview, loadLevelDetails, loadWordMatcher } from '../lib/reviewBridge.js';

// The word card for a tapped or suggested word, shared by the listening and writing pages.
// A word in the site's word list is shown from it for free; any other word is looked up through
// LangLoop (one small AI call, cached there) and can be saved to LangLoop's 生字本.
export default function LangLoopWordSheet({ ref, user, speak }) {
  const sheet = useRef(null);
  const [target, setTarget] = useState(null);
  const [state, setState] = useState({ phase: 'idle' });

  useImperativeHandle(ref, () => ({
    open(word, sentence = '', projectId = null) {
      setTarget({ word, sentence, projectId });
      sheet.current?.open();
    }
  }), []);

  useEffect(() => {
    if (!target) return undefined;
    let alive = true;
    setState({ phase: 'loading' });
    (async () => {
      const match = await loadWordMatcher();
      const row = match(target.word.replace(/^(der|die|das)\s+/i, ''));
      if (!alive) return;
      if (!row) { setState({ phase: 'unknown' }); return; }
      const details = await loadLevelDetails([row[3]]);
      if (!alive) return;
      const [plural, meaning, example, exampleZh] = details[row[0]] || [];
      setState({ phase: 'lexicon', id: row[0], article: row[1], lemma: row[2], level: row[3], plural, meaning, example, exampleZh });
    })().catch(() => { if (alive) setState({ phase: 'unknown' }); });
    return () => { alive = false; };
  }, [target]);

  async function addLexicon() {
    setState(prev => ({ ...prev, busy: true }));
    const added = await addToReview([state.id]).catch(() => -1);
    setState(prev => ({ ...prev, busy: false, saved: added < 0 ? 'error' : 'review' }));
  }

  async function lookUp() {
    setState({ phase: 'looking' });
    try {
      const entry = await lookupWord(user, target.word, target.sentence);
      setState({ phase: 'entry', entry });
    } catch (error) {
      setState({ phase: 'failed', message: error.message });
    }
  }

  async function saveEntry() {
    setState(prev => ({ ...prev, busy: true }));
    try {
      const saved = await saveWord(user, state.entry, target.sentence, target.projectId);
      const lexiconId = saved?.lexiconId || state.entry.lexiconId;
      if (lexiconId) await addToReview([lexiconId]);
      setState(prev => ({ ...prev, busy: false, saved: lexiconId ? 'review' : 'notebook' }));
    } catch (error) {
      setState(prev => ({ ...prev, busy: false, saved: 'error', message: error.message }));
    }
  }

  const savedNote = {
    review: '已加進複習，今天就會出現。',
    notebook: '已存進 LangLoop 生字本。這個字網站的字庫還沒有，暫時不會出現在複習裡。',
    error: state.message || '儲存失敗，請再試一次。'
  }[state.saved];

  return <BottomSheet ref={sheet} title={target?.word || '單字'}>
    <div className="listen-word-card" aria-live="polite">
      {(state.phase === 'loading' || state.phase === 'looking') && <p className="calm-loading">{state.phase === 'looking' ? '查詢中…' : '找字中…'}</p>}

      {state.phase === 'lexicon' && <>
        <div className="listen-word-head">
          <h3 lang="de">{state.article ? `${state.article} ` : ''}{state.lemma}</h3>
          <SpeakButton onSpeak={() => speak(`${state.article ? `${state.article} ` : ''}${state.lemma}`)}/>
        </div>
        <p className="calm-hint">{state.level}{state.plural ? ` · 複數 ${state.plural}` : ''}</p>
        <p>{state.meaning}</p>
        {state.example && <p className="calm-hint" lang="de">{state.example}{state.exampleZh ? `（${state.exampleZh}）` : ''}</p>}
        {savedNote ? <p role="status" className="calm-hint">{savedNote}</p>
          : <button type="button" className="calm-primary" disabled={state.busy} onClick={addLexicon}>{state.busy ? '加入中…' : '加進複習'}</button>}
      </>}

      {state.phase === 'unknown' && <>
        <p>網站的字庫裡找不到「<span lang="de">{target?.word}</span>」。可以請 LangLoop 查這個字，查過的字會存起來，下次不用再查。</p>
        <button type="button" className="calm-primary" onClick={lookUp}>用 LangLoop 查字</button>
      </>}

      {state.phase === 'entry' && <>
        <div className="listen-word-head">
          <h3 lang="de">{state.entry.article ? `${state.entry.article} ` : ''}{state.entry.lemma}</h3>
          <SpeakButton onSpeak={() => speak(`${state.entry.article ? `${state.entry.article} ` : ''}${state.entry.lemma}`)}/>
        </div>
        {state.entry.level && <p className="calm-hint">{state.entry.level}{state.entry.plural ? ` · 複數 ${state.entry.plural}` : ''}</p>}
        <p>{state.entry.meaning}</p>
        {state.entry.contextMeaning && <p className="calm-hint">在這句裡：{state.entry.contextMeaning}</p>}
        {state.entry.grammarNote && <p className="calm-hint">{state.entry.grammarNote}</p>}
        {savedNote ? <p role="status" className="calm-hint">{savedNote}</p>
          : <button type="button" className="calm-primary" disabled={state.busy} onClick={saveEntry}>{state.busy ? '儲存中…' : '存起來'}</button>}
      </>}

      {state.phase === 'failed' && <>
        <p role="alert">{state.message}</p>
        <button type="button" className="calm-secondary" onClick={lookUp}>再試一次</button>
      </>}
    </div>
  </BottomSheet>;
}
