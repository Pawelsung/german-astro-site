import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Settings, Volume2 } from 'lucide-react';
import { useGermanSpeech } from '../hooks/useGermanSpeech';
import { answerCue } from '../lib/answerFeedback';
import { genderKey } from '../lib/grammarColors.mjs';
import { POS_LABELS } from '../lib/vocabulary.mjs';
import { readJSON, writeJSON } from '../lib/progressStorage';
import { RATINGS, DEFAULT_DAILY_GOAL, dayNumber, decodeReview, emptyRecord, markArticleWrong, mergeReview, rateWord } from '../lib/reviewStore.mjs';
import {
  EXTRA_BATCH, LEVELS, TODAY_KEY, advanceToday, buildDailyQueue, currentItem, newTodayState, pickPlacement,
  pickWeeklyCheck, placementPassed, rateQueueItem, reconcileToday, weeklyCheckDue, withBaseline, withDayDone, withoutBaseline
} from '../lib/reviewQueue.mjs';
import { loadLevelDetails, loadLexicon, migrateLessonProgress, readStoredReview, saveReview } from '../lib/reviewBridge.js';

const LEVEL_CHOICES = LEVELS.slice(0, 4);
const GOAL_CHOICES = [5, 10, 15, 20, 25, 30, 40, 50];

const RATING_BUTTONS = [
  { rating: RATINGS.DONT_KNOW, label: '不會', tone: 'miss' },
  { rating: RATINGS.UNSURE, label: '有點印象', tone: 'unsure' },
  { rating: RATINGS.KNOW, label: '會了', tone: 'know' }
];

function PageFrame({ left, center, right, children }) {
  return (
    <div className="calm-page">
      <header className="calm-bar">
        <div className="calm-bar-side">{left}</div>
        <div className="calm-bar-center">{center}</div>
        <div className="calm-bar-side calm-bar-end">{right}</div>
      </header>
      <main className="calm-main">{children}</main>
    </div>
  );
}

const BackHome = () => <a className="calm-icon" href="/" aria-label="回首頁"><ArrowLeft size={22} /></a>;

function Notice({ title, body, children }) {
  return (
    <div className="calm-notice fx-enter">
      <h1>{title}</h1>
      {body && <p>{body}</p>}
      <div className="calm-stack">{children}</div>
    </div>
  );
}

function ChoiceGrid({ value, options, onChange, format = String }) {
  return (
    <div className="calm-choices">
      {options.map(option => (
        <button key={option} type="button" className={option === value ? 'is-on' : ''} aria-pressed={option === value} onClick={() => onChange(option)}>
          {format(option)}
        </button>
      ))}
    </div>
  );
}

function WordCard({ row, detail, revealed, onReveal, speak }) {
  const [, article, word, level, , pos] = row;
  const [plural, meaning, exampleDe, exampleZh, verb] = detail || ['', '', '', '', 0];
  const gender = genderKey(article);
  const say = text => event => { event.stopPropagation(); speak(text); };
  return (
    <div
      className={`calm-card ${revealed ? 'is-revealed' : ''}`} role="button" tabIndex={0}
      aria-label={revealed ? undefined : '點一下看意思'}
      onClick={onReveal}
      onKeyDown={event => { if (!revealed && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); onReveal(); } }}
    >
      <button type="button" className="calm-icon calm-card-sound" aria-label="播放發音" onClick={say(word)}><Volume2 size={22} /></button>
      <div className="calm-word-block">
        {revealed && article && <span className="calm-article fx-enter" data-gender={gender || undefined}>{article}</span>}
        <h1 className="calm-word" lang="de">{word}</h1>
      </div>
      {revealed ? (
        <div className="calm-answer fx-enter">
          <p className="calm-meaning">{meaning}</p>
          <p className="calm-tags">
            <span>{POS_LABELS[pos] || pos}</span><span>{level}</span>
            {plural && <span lang="de">{plural}</span>}
          </p>
          {verb ? <p className="calm-forms" lang="de">{verb.filter(Boolean).join(' · ')}</p> : null}
        </div>
      ) : <p className="calm-hint">點一下看意思</p>}
      {exampleDe && (
        <div className="calm-example">
          <p lang="de">{exampleDe}
            <button type="button" className="calm-icon calm-inline-sound" aria-label="播放例句" onClick={say(exampleDe)}><Volume2 size={16} /></button>
          </p>
          {revealed && exampleZh && <p className="calm-example-zh fx-enter">{exampleZh}</p>}
        </div>
      )}
    </div>
  );
}

function Settings_({ review, onSave, onRetest, onUndoBaseline, onClose }) {
  const settings = review.settings;
  return (
    <PageFrame left={<button type="button" className="calm-icon" aria-label="返回" onClick={onClose}><ArrowLeft size={22} /></button>} center="設定">
      <div className="calm-settings fx-enter">
        <section>
          <h2>每日目標</h2>
          <p>達到目標就算完成，想多做可以繼續。</p>
          <ChoiceGrid value={settings.dailyGoal} options={GOAL_CHOICES} format={n => `${n} 字`} onChange={dailyGoal => onSave({ dailyGoal })} />
        </section>
        <section>
          <h2>我的程度</h2>
          <p>新字主要從這個程度挑選，也會加入少量高一級的字。</p>
          <ChoiceGrid value={settings.level} options={LEVEL_CHOICES} onChange={level => onSave({ level })} />
        </section>
        <section>
          <h2>A1–A2 的字</h2>
          {settings.baseline
            ? <><p>已標記為學會，只會偶爾抽考。</p><button type="button" className="calm-secondary" onClick={onUndoBaseline}>取消標記</button></>
            : <><p>做一次快速檢測，太簡單的字就不用再出現。</p><button type="button" className="calm-secondary" onClick={onRetest}>開始檢測</button></>}
        </section>
      </div>
    </PageFrame>
  );
}

const readToday = today => {
  const stored = readJSON(TODAY_KEY, null);
  return stored?.day === today && Array.isArray(stored.items) ? stored : null;
};

export default function ReviewApp() {
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [state, setState] = useState(null);
  const [details, setDetails] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [articleNoted, setArticleNoted] = useState(false);
  const [placement, setPlacement] = useState({ ids: [], index: 0, known: 0, missed: [] });
  const [version, setVersion] = useState(0);
  const lexicon = useRef(null);
  const review = useRef(decodeReview(null));
  const today = useRef(dayNumber()).current;
  const { speak } = useGermanSpeech();

  const persistReview = useCallback(() => {
    // The cloud copy may have landed in storage after this page loaded; saving must not drop it.
    review.current = mergeReview(review.current, decodeReview(readStoredReview()));
    saveReview(review.current);
    setVersion(v => v + 1);
  }, []);
  const persistState = useCallback(next => { setState(next); writeJSON(TODAY_KEY, next); }, []);
  const updateSettings = useCallback(patch => {
    review.current.settings = { ...review.current.settings, ...patch, t: Date.now() };
    persistReview();
  }, [persistReview]);

  const ensureDetails = useCallback(async items => {
    const levels = [...new Set(items.map(it => lexicon.current.rows.get(it.id)?.[3]).filter(Boolean))];
    const loaded = await loadLevelDetails(levels);
    setDetails(prev => ({ ...prev, ...loaded }));
  }, []);

  const extendQueue = useCallback(async (base, count) => {
    const exclude = new Set(base.items.map(it => it.id));
    const { items, slot } = buildDailyQueue({
      pool: lexicon.current.pool, review: review.current, today, goal: count, exclude, slot: review.current.settings.slot || 0
    });
    if (!items.length) return null;
    await ensureDetails([...base.items.slice(base.pos), ...items]);
    review.current.settings = { ...review.current.settings, slot, t: Date.now() };
    persistReview();
    return { ...base, items: [...base.items, ...items] };
  }, [ensureDetails, persistReview, today]);

  const startSession = useCallback(async () => {
    const goal = review.current.settings.dailyGoal || DEFAULT_DAILY_GOAL;
    let current = reconcileToday(readToday(today) || newTodayState(today, goal), review.current, today);
    current = { ...current, goal };
    const needed = goal - current.done - (current.items.length - current.pos);
    if (needed > 0) current = (await extendQueue(current, needed)) || current;
    else await ensureDetails(current.items.slice(current.pos));
    persistState(current);
    setRevealed(false);
    setArticleNoted(false);
    setPhase(currentItem(current) ? 'session' : 'done');
  }, [ensureDetails, extendQueue, persistState, today]);

  const beginPlacement = useCallback(async () => {
    const ids = pickPlacement({ pool: lexicon.current.pool, review: review.current, seed: today });
    await loadLevelDetails(['A2']).then(loaded => setDetails(prev => ({ ...prev, ...loaded })));
    setPlacement({ ids, index: 0, known: 0, missed: [] });
    setRevealed(false);
    setPhase(ids.length ? 'placement' : 'done');
  }, [today]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await migrateLessonProgress();
        lexicon.current = await loadLexicon();
        review.current = decodeReview(readStoredReview());
        if (!alive) return;
        if (!review.current.settings.level) setPhase('level');
        else await startSession();
      } catch (e) {
        console.error(e);
        if (alive) { setError('字庫載入失敗，請確認網路後重新整理。'); setPhase('error'); }
      }
    })();
    return () => { alive = false; };
  }, [startSession]);

  // Another device's work arrives a moment after this page has already started.
  const live = useRef({});
  live.current = { phase, state };
  useEffect(() => {
    const onCloudUpdate = event => {
      if (event.detail?.key || !lexicon.current) return;
      review.current = mergeReview(review.current, decodeReview(readStoredReview()));
      setVersion(v => v + 1);
      const { phase: now, state: shown } = live.current;
      const changed = shown && reconcileToday(shown, review.current, today) !== shown;
      if ((now === 'level' && review.current.settings.level) || (['session', 'done'].includes(now) && changed)) startSession();
    };
    window.addEventListener('learning-progress-updated', onCloudUpdate);
    return () => window.removeEventListener('learning-progress-updated', onCloudUpdate);
  }, [startSession, today]);

  const item = state ? currentItem(state) : null;

  const rate = useCallback(async rating => {
    if (!item || !revealed) return;
    const next = advanceToday(state, rating);
    if (!item.repeat) {
      review.current.words[item.id] = rateQueueItem(item, review.current.words[item.id], rating);
      if (next.done !== state.done) review.current.settings = withDayDone(review.current.settings, today, next.done, Date.now());
      persistReview();
    }
    const [, article, word] = lexicon.current.rows.get(item.id);
    // Only 會了 makes a sound: not knowing a word here is information, not a failure.
    answerCue(rating !== RATINGS.DONT_KNOW, `${article ? `${article} ` : ''}${word}`, { silent: rating !== RATINGS.KNOW });
    persistState(next);
    setRevealed(false);
    setArticleNoted(false);
    if (!currentItem(next)) setPhase('done');
  }, [item, persistReview, persistState, revealed, state, today]);

  const noteArticle = useCallback(() => {
    if (!item || articleNoted) return;
    review.current.words[item.id] = markArticleWrong(review.current.words[item.id] || emptyRecord());
    persistReview();
    setArticleNoted(true);
  }, [articleNoted, item, persistReview]);

  const answerPlacement = useCallback(known => {
    setRevealed(false);
    setPlacement(prev => {
      const id = prev.ids[prev.index];
      const next = { ...prev, index: prev.index + 1, known: prev.known + (known ? 1 : 0), missed: known ? prev.missed : [...prev.missed, id] };
      if (next.index >= next.ids.length) setPhase('placement-result');
      return next;
    });
  }, []);

  const finishPlacement = useCallback(async markKnown => {
    for (const id of placement.missed) {
      if (!review.current.words[id]) review.current.words[id] = rateWord(id, undefined, RATINGS.DONT_KNOW, { today });
    }
    review.current.settings = {
      ...(markKnown ? withBaseline(review.current.settings, today, Date.now()) : { ...review.current.settings, placedAt: today, t: Date.now() })
    };
    persistReview();
    await startSession();
  }, [persistReview, placement.missed, startSession, today]);

  const moreWords = useCallback(async () => {
    const extended = await extendQueue(state, EXTRA_BATCH);
    if (!extended) { setPhase('empty'); return; }
    persistState(extended);
    setRevealed(false);
    setPhase('session');
  }, [extendQueue, persistState, state]);

  const startWeekly = useCallback(async () => {
    const exclude = new Set(state.items.map(it => it.id));
    const items = pickWeeklyCheck({ pool: lexicon.current.pool, review: review.current, today, exclude });
    updateSettings({ weeklyDone: today });
    if (!items.length) return;
    await ensureDetails(items);
    persistState({ ...state, items: [...state.items, ...items] });
    setRevealed(false);
    setPhase('session');
  }, [ensureDetails, persistState, state, today, updateSettings]);

  useEffect(() => {
    if (phase !== 'session') return undefined;
    const onKey = event => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!revealed && event.key === ' ') { event.preventDefault(); setRevealed(true); return; }
      const button = RATING_BUTTONS[Number(event.key) - 1];
      if (revealed && button) rate(button.rating);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, rate, revealed]);

  const settings = review.current.settings;
  const gear = <button type="button" className="calm-icon" aria-label="設定" onClick={() => setPhase('settings')}><Settings size={21} /></button>;

  if (phase === 'loading') return <PageFrame left={<BackHome />}><p className="calm-loading">準備今天的字…</p></PageFrame>;
  if (phase === 'error') return <PageFrame left={<BackHome />}><Notice title="暫時打不開" body={error} /></PageFrame>;

  if (phase === 'settings') {
    return (
      <Settings_
        key={version} review={review.current} onSave={updateSettings} onClose={startSession} onRetest={beginPlacement}
        onUndoBaseline={() => { review.current.settings = withoutBaseline(review.current.settings, Date.now()); persistReview(); }}
      />
    );
  }

  if (phase === 'level') {
    return (
      <PageFrame left={<BackHome />}>
        <Notice title="你現在大約在哪個程度？" body="新字會主要從這個程度挑選，之後隨時可以改。">
          <ChoiceGrid value={settings.level} options={LEVEL_CHOICES} onChange={level => updateSettings({ level })} />
          {settings.level && (
            <button type="button" className="calm-primary" onClick={() => (LEVELS.indexOf(settings.level) >= 2 ? setPhase('placement-offer') : startSession())}>下一步</button>
          )}
        </Notice>
      </PageFrame>
    );
  }

  if (phase === 'placement-offer') {
    return (
      <PageFrame left={<BackHome />}>
        <Notice title="要先檢測 A2 的字嗎？" body="約 40 個字，只要判斷認不認識。大多認識的話，A1 和 A2 就只會偶爾抽考。">
          <button type="button" className="calm-primary" onClick={beginPlacement}>開始檢測</button>
          <button type="button" className="calm-secondary" onClick={startSession}>先跳過</button>
        </Notice>
      </PageFrame>
    );
  }

  if (phase === 'placement') {
    const id = placement.ids[placement.index];
    const row = lexicon.current.rows.get(id);
    return (
      <PageFrame left={<BackHome />} center={`${placement.index + 1} / ${placement.ids.length}`}>
        <div className="calm-session">
          <WordCard row={row} detail={details[id]} revealed={revealed} onReveal={() => setRevealed(true)} speak={speak} />
          <div className="calm-actions calm-actions-two">
            <button type="button" className="calm-rate" data-tone="miss" onClick={() => answerPlacement(false)}>不認識</button>
            <button type="button" className="calm-rate" data-tone="know" onClick={() => answerPlacement(true)}>認識</button>
          </div>
        </div>
      </PageFrame>
    );
  }

  if (phase === 'placement-result') {
    const passed = placementPassed(placement.known, placement.ids.length);
    return (
      <PageFrame left={<BackHome />}>
        <Notice
          title={`認識 ${placement.known} / ${placement.ids.length} 個字`}
          body={passed ? '基礎很穩。要把 A1 和 A2 標記為學會嗎？之後只會偶爾抽考，也可以在設定裡取消。' : '不認識的字已經放進複習，會從這些字開始。'}
        >
          {passed && <button type="button" className="calm-primary" onClick={() => finishPlacement(true)}>標記為學會</button>}
          <button type="button" className={passed ? 'calm-secondary' : 'calm-primary'} onClick={() => finishPlacement(false)}>{passed ? '先不要' : '開始複習'}</button>
        </Notice>
      </PageFrame>
    );
  }

  if (phase === 'empty') {
    return <PageFrame left={<BackHome />} right={gear}><Notice title="今天沒有更多字了" body="到期的字和新字都做完了。"><a className="calm-primary" href="/">回首頁</a></Notice></PageFrame>;
  }

  if (phase === 'done') {
    const reached = state && state.done >= state.goal;
    const weekly = weeklyCheckDue(settings, today);
    return (
      <PageFrame left={<BackHome />} right={gear}>
        <Notice
          title={reached ? '今天完成了' : '先到這裡'}
          body={`今天已經複習 ${state?.done || 0} 個字${reached ? `，達成 ${state.goal} 字目標。` : '。'}`}
        >
          <button type="button" className="calm-primary" onClick={moreWords}>再做 {EXTRA_BATCH} 個</button>
          {weekly && <button type="button" className="calm-secondary" onClick={startWeekly}>每週抽考舊字</button>}
          <a className="calm-link" href="/">回首頁</a>
        </Notice>
      </PageFrame>
    );
  }

  const row = lexicon.current.rows.get(item.id);
  const total = Math.max(state.goal, state.done + state.items.slice(state.pos).filter(it => !it.repeat && it.kind !== 'weekly').length);
  return (
    <PageFrame left={<BackHome />} center={item.kind === 'weekly' ? '每週抽考' : `${Math.min(state.done + 1, total)} / ${total}`} right={gear}>
      <div className="calm-progress" aria-hidden="true"><span style={{ width: `${Math.min(100, (state.done / total) * 100)}%` }} /></div>
      <div className="calm-session">
        <WordCard key={`${item.id}-${state.pos}`} row={row} detail={details[item.id]} revealed={revealed} onReveal={() => setRevealed(true)} speak={speak} />
        {revealed ? (
          <div className="calm-answer-actions fx-enter">
            {row[1] && genderKey(row[1]) && (
              <button type="button" className="calm-link" disabled={articleNoted} onClick={noteArticle}>{articleNoted ? '已記下冠詞' : '冠詞沒想對'}</button>
            )}
            <div className="calm-actions">
              {RATING_BUTTONS.map((button, index) => (
                <button key={button.rating} type="button" className="calm-rate" data-tone={button.tone} onClick={() => rate(button.rating)}>
                  {button.label}<kbd className="kbd-hint">{index + 1}</kbd>
                </button>
              ))}
            </div>
          </div>
        ) : <div className="calm-actions-spacer" />}
      </div>
    </PageFrame>
  );
}
