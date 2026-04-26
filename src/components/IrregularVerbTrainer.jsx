import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { irregularVerbs } from '../data/irregular-verbs';
import { getFirebaseServices } from '../lib/firebase';

const STORAGE_KEY = 'irregular-verbs-trainer-v3';

const MODES = {
  FLASHCARD: 'flashcard',
  TYPING: 'typing',
  HABEN_SEIN: 'habenSein',
  LIST: 'list',
  WRONG: 'wrong',
  HARD: 'hard',
  STARRED: 'starred',
  MODAL: 'modal'
};

const CARD_ORDER = {
  SEQUENTIAL: 'sequential',
  RANDOM: 'random'
};

function shuffle(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function normalizeText(value = '') {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitPerfekt(perfekt = '') {
  const parts = perfekt.split(' ');
  if (parts.length < 2) {
    return { aux: '', participle: perfekt };
  }
  return {
    aux: parts[0],
    participle: parts.slice(1).join(' ')
  };
}

function loadProgress() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent('learning-progress-updated'));
}

function mergeProgress(local = {}, remote = {}) {
  return { ...remote, ...local };
}

function stripEndingForCompare(word = '') {
  const lower = word.toLowerCase();
  if (lower.endsWith('en')) return lower.slice(0, -2);
  if (lower.endsWith('n')) return lower.slice(0, -1);
  if (lower.endsWith('et')) return lower.slice(0, -2);
  if (lower.endsWith('t')) return lower.slice(0, -1);
  return lower;
}

function firstVowelGroup(word = '') {
  const match = word.match(/ie|ei|au|äu|eu|[aäeéiíoöuü]/i);
  return match ? match[0] : '';
}

function highlightChangedVowel(baseWord = '', targetWord = '') {
  if (!targetWord) return targetWord;

  const baseStem = stripEndingForCompare(baseWord);
  const targetStem = stripEndingForCompare(targetWord);

  const baseVowel = firstVowelGroup(baseStem);
  const targetVowel = firstVowelGroup(targetStem);

  if (!targetVowel) return targetWord;

  const shouldHighlight =
    baseVowel &&
    targetVowel &&
    baseVowel.toLowerCase() !== targetVowel.toLowerCase();

  if (!shouldHighlight) return targetWord;

  const index = targetWord.toLowerCase().indexOf(targetVowel.toLowerCase());
  if (index === -1) return targetWord;

  return (
    <>
      {targetWord.slice(0, index)}
      <span className="font-black text-rose-600 underline decoration-2 underline-offset-4">
        {targetWord.slice(index, index + targetVowel.length)}
      </span>
      {targetWord.slice(index + targetVowel.length)}
    </>
  );
}

function renderPerfektWithAuxHighlight(perfekt = '') {
  if (!perfekt) return perfekt;

  const { aux, participle } = splitPerfekt(perfekt);

  const auxClass =
    aux === 'ist'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-sky-100 text-sky-700 border-sky-200';

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={`px-2 py-0.5 rounded-lg border text-sm font-black ${auxClass}`}>
        {aux}
      </span>
      <span>{participle}</span>
    </span>
  );
}

function getTypeMeta(type) {
  const map = {
    strong: {
      label: '強變化',
      cls: 'bg-rose-100 text-rose-700 border-rose-200'
    },
    mixed: {
      label: '混合變化',
      cls: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    modal: {
      label: '情態動詞',
      cls: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    special: {
      label: '特殊核心',
      cls: 'bg-violet-100 text-violet-700 border-violet-200'
    }
  };

  return map[type] || {
    label: '未分類',
    cls: 'bg-slate-100 text-slate-700 border-slate-200'
  };
}

function inferAuxHint(verb) {
  if (verb?.auxiliary === 'ist') {
    return {
      label: 'Perfekt 用 sein',
      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
  }

  if (verb?.auxiliary === 'hat') {
    return {
      label: 'Perfekt 用 haben',
      cls: 'bg-sky-100 text-sky-700 border-sky-200'
    };
  }

  return null;
}

function deriveLearningState(item = {}) {
  const seen = item.seenCount || 0;
  const correct = item.correctCount || 0;
  const wrong = item.wrongCount || 0;
  const hard = !!item.isHard;

  if (correct >= 5 && wrong <= 1 && !hard) {
    return { label: '已熟記', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }

  if (hard || wrong >= 3) {
    return { label: '待加強', cls: 'bg-rose-100 text-rose-600 border-rose-200' };
  }

  if (seen > 0) {
    return { label: '學習中', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  }

  return { label: '未開始', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function getModeTone(mode) {
  if (mode === MODES.MODAL) return 'indigo';
  if (mode === MODES.WRONG || mode === MODES.HARD || mode === MODES.STARRED) return 'rose';
  return 'amber';
}

function getModeLabel(mode) {
  return {
    flashcard: '字卡',
    typing: '三態拼寫',
    habenSein: 'haben / sein',
    modal: '情態專練',
    list: '列表',
    wrong: '錯題',
    hard: '不熟',
    starred: '收藏'
  }[mode];
}

function getToneClasses(tone) {
  if (tone === 'rose') {
    return {
      outer: 'border-rose-200',
      inner: 'border-rose-100 bg-rose-50/80',
      next: 'bg-rose-500 text-white',
      nav: 'bg-white/95 border-rose-200 text-rose-600'
    };
  }

  if (tone === 'indigo') {
    return {
      outer: 'border-indigo-200',
      inner: 'border-indigo-100 bg-indigo-50/70',
      next: 'bg-indigo-600 text-white',
      nav: 'bg-white/95 border-indigo-200 text-indigo-600'
    };
  }

  return {
    outer: 'border-slate-200',
    inner: 'border-amber-100 bg-amber-50/80',
    next: 'bg-amber-600 text-white',
    nav: 'bg-white/95 border-slate-200 text-slate-700'
  };
}

function AudioPill({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center"
      aria-label={label}
      title={label}
      type="button"
    >
      🔊
    </button>
  );
}

function MainModeButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-black border transition-all ${
        active
          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function FilterChip({ active, onClick, children, activeClass }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-black border transition-all ${
        active
          ? activeClass
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function ActionToggle({ active, onClick, activeClass, inactiveClass, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-black border transition-all ${
        active ? activeClass : inactiveClass
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function SideNavButton({ direction, onClick, label, tone = 'amber' }) {
  const isPrev = direction === 'prev';
  const toneClass = getToneClasses(tone).nav;

  return (
    <button
      onClick={onClick}
      type="button"
      aria-label={label}
      title={label}
      className={`absolute top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center
        w-14 h-14 rounded-full border shadow-sm hover:bg-white active:scale-95 transition-all
        ${toneClass}
        ${isPrev ? '-left-7' : '-right-7'}`}
    >
      <span className="text-2xl font-black">{isPrev ? '←' : '→'}</span>
    </button>
  );
}

function MetaPills({
  currentLearningState,
  currentTypeMeta,
  currentAuxHint,
  currentVerb,
  currentIndex,
  deckLength
}) {
  if (!currentVerb) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {currentLearningState && (
        <span className={`px-2.5 py-1 rounded-full text-xs font-black border opacity-80 ${currentLearningState.cls}`}>
          {currentLearningState.label}
        </span>
      )}

      {currentTypeMeta && (
        <span className={`px-2.5 py-1 rounded-full text-xs font-black border opacity-80 ${currentTypeMeta.cls}`}>
          {currentTypeMeta.label}
        </span>
      )}

      {currentAuxHint && (
        <span className={`px-2.5 py-1 rounded-full text-xs font-black border opacity-80 ${currentAuxHint.cls}`}>
          {currentAuxHint.label}
        </span>
      )}

      <span className="px-2.5 py-1 rounded-full text-xs font-black border bg-white text-amber-600 border-amber-200 opacity-80">
        {currentVerb.level}
      </span>

      <span className="px-2.5 py-1 rounded-full text-xs font-black border bg-slate-100 text-slate-600 border-slate-200 opacity-80">
        {currentIndex + 1} / {deckLength}
      </span>
    </div>
  );
}

function FixedCardFrame({
  tone = 'amber',
  children,
  topRight,
  onPrev,
  onNext
}) {
  const toneStyles = getToneClasses(tone);

  return (
    <div className="space-y-4">
      <div className="relative px-0 md:px-8">
        <SideNavButton direction="prev" onClick={onPrev} label="上一個" tone={tone} />
        <SideNavButton direction="next" onClick={onNext} label="下一個" tone={tone} />

        <div className={`bg-white rounded-[32px] shadow-sm border ${toneStyles.outer} p-3.5 md:p-4`}>
          <div className="relative">
            {topRight && <div className="absolute right-3 top-3 z-10 flex gap-2">{topRight}</div>}

            <div
              className={`min-h-[520px] rounded-[28px] border ${toneStyles.inner} flex flex-col justify-center px-6 py-12 md:px-10`}
            >
              {children}
            </div>

            <div className="mt-4 flex justify-between gap-3 md:hidden">
              <button
                onClick={onPrev}
                className="flex-1 px-5 py-3 rounded-2xl bg-white border border-slate-200 font-black"
                type="button"
              >
                ↶ 復原
              </button>

              <button
                onClick={onNext}
                className={`flex-1 px-5 py-3 rounded-2xl font-black ${toneStyles.next}`}
                type="button"
              >
                重做 ↷
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashcardLikeMode({
  tone,
  currentVerb,
  currentStats,
  onToggleStar,
  onToggleHard,
  onFlip,
  onPrev,
  onNext,
  showBack,
  speak,
  frontBadge
}) {
  return (
    <FixedCardFrame
      tone={tone}
      onPrev={onPrev}
      onNext={onNext}
      topRight={
        <>
          <ActionToggle
            active={currentStats?.starred}
            onClick={() => onToggleStar(currentVerb.id)}
            activeClass="bg-yellow-500 text-white border-yellow-500"
            inactiveClass="bg-white/90 text-slate-700 border-slate-200 hover:bg-white"
          >
            ⭐ 收藏
          </ActionToggle>

          <ActionToggle
            active={currentStats?.hard}
            onClick={() => onToggleHard(currentVerb.id)}
            activeClass="bg-orange-500 text-white border-orange-500"
            inactiveClass="bg-white/90 text-slate-700 border-slate-200 hover:bg-white"
          >
            🔥 不熟
          </ActionToggle>
        </>
      }
    >
      <div onClick={onFlip} className="cursor-pointer w-full max-w-3xl mx-auto">
        {!showBack ? (
          <div className="min-h-[420px] flex flex-col justify-center items-center text-center">
            {frontBadge && (
              <div className="mb-3 flex justify-center">
                <span className="px-3 py-1 rounded-full bg-white text-rose-500 text-sm font-black border border-rose-200">
                  {frontBadge}
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
              <div className="text-6xl md:text-7xl font-black leading-none">
                {currentVerb.infinitive}
              </div>
              <AudioPill
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentVerb.infinitive);
                }}
                label="播放動詞發音"
              />
            </div>

            <div className="text-xl md:text-2xl text-slate-500 font-bold mb-2">
              {currentVerb.meaningZh}
            </div>

            <div className="text-sm text-slate-400 font-bold mt-6">
              點一下翻面看變化
            </div>
          </div>
        ) : (
          <div className="min-h-[420px] flex flex-col justify-center">
            <div className="grid sm:grid-cols-2 gap-4 text-left auto-rows-fr">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 min-h-[112px]">
                <div className="text-xs font-black text-slate-400 mb-2">Infinitiv</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-black">{currentVerb.infinitive}</div>
                  <AudioPill
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentVerb.infinitive);
                    }}
                    label="播放動詞發音"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 min-h-[112px]">
                <div className="text-xs font-black text-slate-400 mb-2">3. Person</div>
                <div className="text-2xl font-black">
                  {highlightChangedVowel(currentVerb.infinitive, currentVerb.present3rd)}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 min-h-[112px]">
                <div className="text-xs font-black text-slate-400 mb-2">Präteritum</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-black">
                    {highlightChangedVowel(currentVerb.infinitive, currentVerb.praeteritum)}
                  </div>
                  <AudioPill
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentVerb.praeteritum);
                    }}
                    label="播放過去式發音"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 min-h-[112px]">
                <div className="text-xs font-black text-slate-400 mb-2">Perfekt</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-black">
                    {renderPerfektWithAuxHighlight(currentVerb.perfekt)}
                  </div>
                  <AudioPill
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentVerb.perfekt);
                    }}
                    label="播放完成式發音"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-100 text-left min-h-[116px] flex items-start">
              <div className="w-full">
                <div className="text-xs font-black text-slate-400 mb-2">例句</div>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-lg font-bold flex-1">{currentVerb.example}</div>
                  <AudioPill
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentVerb.example);
                    }}
                    label="播放例句發音"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FixedCardFrame>
  );
}

export default function IrregularVerbTrainer() {
  const [mode, setMode] = useState(MODES.FLASHCARD);
  const [level, setLevel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBack, setShowBack] = useState(false);
  const [progress, setProgress] = useState({});
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [cardOrder, setCardOrder] = useState(CARD_ORDER.SEQUENTIAL);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [auxFilter, setAuxFilter] = useState('ALL');

  const [typingPraeteritum, setTypingPraeteritum] = useState('');
  const [typingPerfekt, setTypingPerfekt] = useState('');
  const [typingFeedback, setTypingFeedback] = useState(null);

  const [auxAnswer, setAuxAnswer] = useState('');
  const [auxFeedback, setAuxFeedback] = useState(null);

  const [modalAnswer, setModalAnswer] = useState('');
  const [modalFeedback, setModalFeedback] = useState(null);

  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1.0);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return;

    const unsubscribe = onAuthStateChanged(services.auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services || !user) return;

    const docRef = doc(services.db, 'users', user.uid, 'learning', 'progress');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const remoteLesson3 = snapshot.exists() ? snapshot.data().lesson3 : null;
      if (!remoteLesson3) {
        setDoc(docRef, { lesson3: progress, updatedAt: new Date().toISOString() }, { merge: true });
        return;
      }

      setProgress((current) => {
        const merged = mergeProgress(current, remoteLesson3);
        saveProgress(merged);
        return merged;
      });
    });

    return () => unsubscribe();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services || !user) return;

    const docRef = doc(services.db, 'users', user.uid, 'learning', 'progress');
    setDoc(docRef, { lesson3: progress, updatedAt: new Date().toISOString() }, { merge: true }).catch(
      console.error
    );
  }, [progress, user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const germanVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith('de'));

      setVoices(germanVoices);

      if (!voiceURI && germanVoices.length > 0) {
        setVoiceURI(germanVoices[0].voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voiceURI]);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (!deck.length) return;

      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTypingField = tag === 'input' || tag === 'textarea';

      if (e.key === 'ArrowLeft' && !isTypingField) {
        e.preventDefault();
        prevCard();
      }

      if (e.key === 'ArrowRight' && !isTypingField) {
        e.preventDefault();
        nextCard();
      }

      if (
        e.key === ' ' &&
        !isTypingField &&
        (mode === MODES.FLASHCARD ||
          mode === MODES.WRONG ||
          mode === MODES.HARD ||
          mode === MODES.STARRED)
      ) {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [deck.length, mode, showBack, currentIndex]);

  function speak(text) {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = rate;
    utterance.pitch = pitch;

    const selectedVoice = voices.find((voice) => voice.voiceURI === voiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;

    window.speechSynthesis.speak(utterance);
  }

  const filteredByLevel = useMemo(() => {
    if (level === 'ALL') return irregularVerbs;
    return irregularVerbs.filter((verb) => verb.level === level);
  }, [level]);

  const filteredByType = useMemo(() => {
    if (typeFilter === 'ALL') return filteredByLevel;
    return filteredByLevel.filter((verb) => verb.type === typeFilter);
  }, [filteredByLevel, typeFilter]);

  const filteredByAux = useMemo(() => {
    if (auxFilter === 'ALL') return filteredByType;
    return filteredByType.filter((verb) => verb.auxiliary === auxFilter);
  }, [filteredByType, auxFilter]);

  const wrongList = useMemo(() => {
    return filteredByAux.filter((verb) => (progress[verb.id]?.wrongCount || 0) > 0);
  }, [filteredByAux, progress]);

  const hardList = useMemo(() => {
    return filteredByAux.filter((verb) => progress[verb.id]?.isHard);
  }, [filteredByAux, progress]);

  const starredList = useMemo(() => {
    return filteredByAux.filter((verb) => progress[verb.id]?.starred);
  }, [filteredByAux, progress]);

  const modalList = useMemo(() => {
    return filteredByAux.filter((verb) => verb.type === 'modal');
  }, [filteredByAux]);

  const visibleList = useMemo(() => {
    let base = filteredByAux;

    if (mode === MODES.WRONG) base = wrongList;
    if (mode === MODES.HARD) base = hardList;
    if (mode === MODES.STARRED) base = starredList;
    if (mode === MODES.MODAL) base = modalList;

    if (!search.trim()) return base;

    const q = normalizeText(search);

    return base.filter((verb) => {
      const haystack = [
        verb.infinitive,
        verb.present3rd,
        verb.praeteritum,
        verb.perfekt,
        verb.meaningZh,
        verb.level,
        verb.group || '',
        verb.type || ''
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [filteredByAux, wrongList, hardList, starredList, modalList, search, mode]);

  useEffect(() => {
    let nextDeck = visibleList;

    const shouldShuffle =
      mode === MODES.TYPING ||
      mode === MODES.HABEN_SEIN ||
      mode === MODES.MODAL ||
      mode === MODES.WRONG ||
      mode === MODES.HARD ||
      (mode === MODES.FLASHCARD && cardOrder === CARD_ORDER.RANDOM);

    if (shouldShuffle) {
      nextDeck = shuffle(visibleList);
    }

    setDeck(nextDeck);
    setCurrentIndex(0);
    setShowBack(false);
    setTypingPraeteritum('');
    setTypingPerfekt('');
    setTypingFeedback(null);
    setAuxAnswer('');
    setAuxFeedback(null);
    setModalAnswer('');
    setModalFeedback(null);
  }, [visibleList, mode, cardOrder]);

  const currentVerb = deck[currentIndex] || null;

  useEffect(() => {
    if (!autoSpeak || !currentVerb) return;
    const t = setTimeout(() => {
      speak(currentVerb.infinitive);
    }, 180);
    return () => clearTimeout(t);
  }, [currentVerb, autoSpeak]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateItemProgress(verbId, updater) {
    setProgress((prev) => {
      const current = prev[verbId] || {};
      return {
        ...prev,
        [verbId]: updater(current)
      };
    });
  }

  function markSeen(verbId) {
    updateItemProgress(verbId, (current) => ({
      ...current,
      seenCount: (current.seenCount || 0) + 1
    }));
  }

  function markCorrect(verbId) {
    updateItemProgress(verbId, (current) => ({
      ...current,
      correctCount: (current.correctCount || 0) + 1
    }));
  }

  function markWrong(verbId) {
    updateItemProgress(verbId, (current) => ({
      ...current,
      wrongCount: (current.wrongCount || 0) + 1,
      isHard: true
    }));
  }

  function toggleStar(verbId) {
    updateItemProgress(verbId, (current) => ({
      ...current,
      starred: !current.starred
    }));
  }

  function toggleHard(verbId) {
    updateItemProgress(verbId, (current) => ({
      ...current,
      isHard: !current.isHard
    }));
  }

  function resetCardUI() {
    setShowBack(false);
    setTypingPraeteritum('');
    setTypingPerfekt('');
    setTypingFeedback(null);
    setAuxAnswer('');
    setAuxFeedback(null);
    setModalAnswer('');
    setModalFeedback(null);
  }

  function nextCard() {
    if (!deck.length) return;
    setCurrentIndex((prev) => (prev + 1) % deck.length);
    resetCardUI();
  }

  function prevCard() {
    if (!deck.length) return;
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    resetCardUI();
  }

  function handleFlip() {
    if (!currentVerb) return;
    if (!showBack) markSeen(currentVerb.id);
    setShowBack((prev) => !prev);
  }

  function handleTypingSubmit(e) {
    e.preventDefault();
    if (!currentVerb) return;

    const praeteritumOk =
      normalizeText(typingPraeteritum) === normalizeText(currentVerb.praeteritum);
    const perfektOk =
      normalizeText(typingPerfekt) === normalizeText(currentVerb.perfekt);

    const ok = praeteritumOk && perfektOk;

    if (ok) {
      markCorrect(currentVerb.id);
      setTypingFeedback({
        type: 'success',
        text: '答對了！'
      });
      setTimeout(() => nextCard(), 900);
    } else {
      markWrong(currentVerb.id);
      setTypingFeedback({
        type: 'error',
        text: `正確答案：${currentVerb.praeteritum} / ${currentVerb.perfekt}`
      });
    }
  }

  function handleAuxAnswer(answer) {
    if (!currentVerb) return;
    setAuxAnswer(answer);

    if (answer === currentVerb.auxiliary) {
      markCorrect(currentVerb.id);
      setAuxFeedback({
        type: 'success',
        text: `答對了：${currentVerb.perfekt}`
      });
      setTimeout(() => nextCard(), 900);
    } else {
      markWrong(currentVerb.id);
      setAuxFeedback({
        type: 'error',
        text: `錯了，正確是 ${currentVerb.auxiliary} → ${currentVerb.perfekt}`
      });
    }
  }

  function handleModalSubmit(answer) {
    if (!currentVerb) return;
    setModalAnswer(answer);

    if (answer === currentVerb.present3rd) {
      markCorrect(currentVerb.id);
      setModalFeedback({
        type: 'success',
        text: `答對了：${currentVerb.infinitive} → ${currentVerb.present3rd}`
      });
      setTimeout(() => nextCard(), 900);
    } else {
      markWrong(currentVerb.id);
      setModalFeedback({
        type: 'error',
        text: `錯了，正確是 ${currentVerb.present3rd}；Präteritum 是 ${currentVerb.praeteritum}`
      });
    }
  }

  function generateModalOptions(verb) {
    const core = ['darf', 'kann', 'mag', 'muss', 'soll', 'will'];
    const set = new Set([verb.present3rd]);

    while (set.size < 4) {
      const random = core[Math.floor(Math.random() * core.length)];
      set.add(random);
    }

    return shuffle([...set]);
  }

  function renderStats(verb) {
    const item = progress[verb.id] || {};
    return {
      seen: item.seenCount || 0,
      correct: item.correctCount || 0,
      wrong: item.wrongCount || 0,
      starred: !!item.starred,
      hard: !!item.isHard
    };
  }

  const currentStats = currentVerb ? renderStats(currentVerb) : null;
  const currentTypeMeta = currentVerb ? getTypeMeta(currentVerb.type) : null;
  const currentAuxHint = currentVerb ? inferAuxHint(currentVerb) : null;
  const currentLearningState = currentVerb ? deriveLearningState(progress[currentVerb.id]) : null;
  const modalOptions = currentVerb && mode === MODES.MODAL ? generateModalOptions(currentVerb) : [];

  const advancedCount =
    (mode === MODES.MODAL ? 1 : 0) +
    (mode === MODES.WRONG ? 1 : 0) +
    (mode === MODES.HARD ? 1 : 0) +
    (mode === MODES.STARRED ? 1 : 0) +
    (typeFilter !== 'ALL' ? 1 : 0) +
    (auxFilter !== 'ALL' ? 1 : 0) +
    (mode === MODES.FLASHCARD && cardOrder === CARD_ORDER.RANDOM ? 1 : 0);

  return (
    <div className="text-slate-800">
      <div className="mb-3">
        <div className="text-sm font-black text-amber-600 mb-1">Lektion 3</div>
        <h1 className="text-3xl md:text-4xl font-black leading-tight">🇩🇪 不規則動詞特訓</h1>
      </div>

      <div className="mb-4 rounded-[22px] bg-white shadow-sm border border-slate-200 p-3.5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <MainModeButton active={mode === MODES.FLASHCARD} onClick={() => setMode(MODES.FLASHCARD)}>
              📖 字卡
            </MainModeButton>
            <MainModeButton active={mode === MODES.TYPING} onClick={() => setMode(MODES.TYPING)}>
              ✍️ 三態拼寫
            </MainModeButton>
            <MainModeButton active={mode === MODES.HABEN_SEIN} onClick={() => setMode(MODES.HABEN_SEIN)}>
              ⚡ haben / sein
            </MainModeButton>
            <MainModeButton active={mode === MODES.LIST} onClick={() => setMode(MODES.LIST)}>
              📚 列表
            </MainModeButton>
          </div>

          <div className="grid lg:grid-cols-[150px_1fr_auto_auto] gap-2.5">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold outline-none"
            >
              <option value="ALL">全部等級</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋動詞、中文、時態..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold outline-none"
            />

            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-black border transition-all whitespace-nowrap ${
                showAdvancedFilters
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              type="button"
            >
              篩選{advancedCount > 0 ? ` (${advancedCount})` : ''}
            </button>

            <button
              onClick={() => setShowAudioPanel((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-black border transition-all whitespace-nowrap ${
                showAudioPanel
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              type="button"
            >
              🔊 語音
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400">
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500">
              模式：{getModeLabel(mode)}
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500">
              ← / → 切換
            </span>
            {(mode === MODES.FLASHCARD ||
              mode === MODES.WRONG ||
              mode === MODES.HARD ||
              mode === MODES.STARRED) && (
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500">
                Space 翻卡
              </span>
            )}
            {mode === MODES.TYPING && (
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500">
                Enter 送出
              </span>
            )}
          </div>

          {showAdvancedFilters && (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3.5 space-y-4">
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  專項與清單
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={mode === MODES.MODAL}
                    onClick={() => setMode(MODES.MODAL)}
                    activeClass="bg-indigo-600 text-white border-indigo-600"
                  >
                    🧩 情態專練
                  </FilterChip>
                  <FilterChip
                    active={mode === MODES.WRONG}
                    onClick={() => setMode(MODES.WRONG)}
                    activeClass="bg-rose-500 text-white border-rose-500"
                  >
                    ⚠️ 錯題
                  </FilterChip>
                  <FilterChip
                    active={mode === MODES.HARD}
                    onClick={() => setMode(MODES.HARD)}
                    activeClass="bg-orange-500 text-white border-orange-500"
                  >
                    🔥 不熟
                  </FilterChip>
                  <FilterChip
                    active={mode === MODES.STARRED}
                    onClick={() => setMode(MODES.STARRED)}
                    activeClass="bg-yellow-500 text-white border-yellow-500"
                  >
                    ⭐ 收藏
                  </FilterChip>
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  類型篩選
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={typeFilter === 'ALL'}
                    onClick={() => setTypeFilter('ALL')}
                    activeClass="bg-slate-800 text-white border-slate-800"
                  >
                    全部類型
                  </FilterChip>
                  <FilterChip
                    active={typeFilter === 'strong'}
                    onClick={() => setTypeFilter('strong')}
                    activeClass="bg-rose-500 text-white border-rose-500"
                  >
                    強變化
                  </FilterChip>
                  <FilterChip
                    active={typeFilter === 'mixed'}
                    onClick={() => setTypeFilter('mixed')}
                    activeClass="bg-orange-500 text-white border-orange-500"
                  >
                    混合變化
                  </FilterChip>
                  <FilterChip
                    active={typeFilter === 'modal'}
                    onClick={() => setTypeFilter('modal')}
                    activeClass="bg-indigo-600 text-white border-indigo-600"
                  >
                    情態動詞
                  </FilterChip>
                  <FilterChip
                    active={typeFilter === 'special'}
                    onClick={() => setTypeFilter('special')}
                    activeClass="bg-violet-600 text-white border-violet-600"
                  >
                    特殊核心
                  </FilterChip>
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  助動詞篩選
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={auxFilter === 'ALL'}
                    onClick={() => setAuxFilter('ALL')}
                    activeClass="bg-slate-800 text-white border-slate-800"
                  >
                    全部助動詞
                  </FilterChip>
                  <FilterChip
                    active={auxFilter === 'hat'}
                    onClick={() => setAuxFilter('hat')}
                    activeClass="bg-sky-500 text-white border-sky-500"
                  >
                    Perfekt 用 haben
                  </FilterChip>
                  <FilterChip
                    active={auxFilter === 'ist'}
                    onClick={() => setAuxFilter('ist')}
                    activeClass="bg-emerald-500 text-white border-emerald-500"
                  >
                    Perfekt 用 sein
                  </FilterChip>
                </div>
              </div>

              {mode === MODES.FLASHCARD && (
                <div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                    字卡順序
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      active={cardOrder === CARD_ORDER.SEQUENTIAL}
                      onClick={() => setCardOrder(CARD_ORDER.SEQUENTIAL)}
                      activeClass="bg-slate-800 text-white border-slate-800"
                    >
                      依序字卡
                    </FilterChip>
                    <FilterChip
                      active={cardOrder === CARD_ORDER.RANDOM}
                      onClick={() => setCardOrder(CARD_ORDER.RANDOM)}
                      activeClass="bg-slate-800 text-white border-slate-800"
                    >
                      隨機字卡
                    </FilterChip>
                  </div>
                </div>
              )}
            </div>
          )}

          {showAudioPanel && (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-sm font-black text-slate-500 mb-4">德語語音設定</div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">德語人聲</label>
                  <select
                    value={voiceURI}
                    onChange={(e) => setVoiceURI(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold outline-none"
                  >
                    {voices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    語速 {rate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.3"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2">
                    音高 {pitch.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 font-black text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoSpeak}
                      onChange={(e) => setAutoSpeak(e.target.checked)}
                    />
                    自動播放
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!currentVerb && (
        <div className="bg-white rounded-[30px] p-10 text-center shadow-sm border border-slate-200">
          <div className="text-5xl mb-4">📭</div>
          <div className="text-2xl font-black mb-2">目前沒有資料</div>
          <p className="text-slate-500 font-medium">請切換等級、搜尋條件，或調整進階篩選。</p>
        </div>
      )}

      {currentVerb && mode !== MODES.LIST && (
        <MetaPills
          currentLearningState={currentLearningState}
          currentTypeMeta={currentTypeMeta}
          currentAuxHint={currentAuxHint}
          currentVerb={currentVerb}
          currentIndex={currentIndex}
          deckLength={deck.length}
        />
      )}

      {currentVerb && mode === MODES.FLASHCARD && (
        <FlashcardLikeMode
          tone="amber"
          currentVerb={currentVerb}
          currentStats={currentStats}
          onToggleStar={toggleStar}
          onToggleHard={toggleHard}
          onFlip={handleFlip}
          onPrev={prevCard}
          onNext={nextCard}
          showBack={showBack}
          speak={speak}
        />
      )}

      {(mode === MODES.WRONG || mode === MODES.HARD || mode === MODES.STARRED) && currentVerb && (
        <FlashcardLikeMode
          tone="rose"
          currentVerb={currentVerb}
          currentStats={currentStats}
          onToggleStar={toggleStar}
          onToggleHard={toggleHard}
          onFlip={handleFlip}
          onPrev={prevCard}
          onNext={nextCard}
          showBack={showBack}
          speak={speak}
          frontBadge={mode === MODES.WRONG ? '錯題重練' : mode === MODES.HARD ? '不熟清單' : '收藏清單'}
        />
      )}

      {currentVerb && mode === MODES.TYPING && (
        <div className="space-y-4">
          <FixedCardFrame tone={getModeTone(mode)} onPrev={prevCard} onNext={nextCard}>
            <div className="w-full max-w-2xl mx-auto min-h-[420px] flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
                  <div className="text-5xl font-black">{currentVerb.infinitive}</div>
                  <AudioPill onClick={() => speak(currentVerb.infinitive)} label="播放動詞發音" />
                </div>

                <div className="text-xl font-bold text-slate-500">{currentVerb.meaningZh}</div>
              </div>

              <form onSubmit={handleTypingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2">Präteritum</label>
                  <input
                    value={typingPraeteritum}
                    onChange={(e) => setTypingPraeteritum(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold outline-none"
                    placeholder="請輸入過去式"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2">Perfekt</label>
                  <input
                    value={typingPerfekt}
                    onChange={(e) => setTypingPerfekt(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold outline-none"
                    placeholder="請輸入完成式"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-lg"
                >
                  檢查答案
                </button>
              </form>
            </div>
          </FixedCardFrame>

          {typingFeedback && (
            <div
              className={`rounded-2xl px-5 py-4 font-black ${
                typingFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {typingFeedback.text}
            </div>
          )}
        </div>
      )}

      {currentVerb && mode === MODES.HABEN_SEIN && (
        <div className="space-y-4">
          <FixedCardFrame tone={getModeTone(mode)} onPrev={prevCard} onNext={nextCard}>
            <div className="w-full max-w-2xl mx-auto min-h-[420px] flex flex-col justify-center text-center">
              <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
                <div className="text-5xl font-black">{currentVerb.infinitive}</div>
                <AudioPill onClick={() => speak(currentVerb.infinitive)} label="播放動詞發音" />
              </div>

              <div className="text-xl font-bold text-slate-500 mb-6">{currentVerb.meaningZh}</div>

              <div className="text-sm font-black text-slate-400 mb-2">
                請選擇 Perfekt 要用的 Hilfsverb
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
                <div className="text-lg font-black text-slate-600">
                  {splitPerfekt(currentVerb.perfekt).participle}
                </div>
                <AudioPill
                  onClick={() => speak(splitPerfekt(currentVerb.perfekt).participle)}
                  label="播放分詞發音"
                />
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleAuxAnswer('hat')}
                  className={`px-8 py-4 rounded-2xl font-black text-xl border ${
                    auxAnswer === 'hat'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                  type="button"
                >
                  hat
                </button>
                <button
                  onClick={() => handleAuxAnswer('ist')}
                  className={`px-8 py-4 rounded-2xl font-black text-xl border ${
                    auxAnswer === 'ist'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                  type="button"
                >
                  ist
                </button>
              </div>
            </div>
          </FixedCardFrame>

          {auxFeedback && (
            <div
              className={`rounded-2xl px-5 py-4 font-black ${
                auxFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {auxFeedback.text}
            </div>
          )}
        </div>
      )}

      {currentVerb && mode === MODES.MODAL && (
        <div className="space-y-4">
          <FixedCardFrame tone={getModeTone(mode)} onPrev={prevCard} onNext={nextCard}>
            <div className="w-full max-w-3xl mx-auto min-h-[420px] flex flex-col justify-center text-center">
              <div className="mb-3 px-3 py-1 rounded-full inline-block self-center bg-indigo-50 text-indigo-600 text-sm font-black border border-indigo-200">
                情態動詞專練
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
                <div className="text-5xl font-black">{currentVerb.infinitive}</div>
                <AudioPill onClick={() => speak(currentVerb.infinitive)} label="播放動詞發音" />
              </div>

              <div className="text-xl font-bold text-slate-500 mb-2">{currentVerb.meaningZh}</div>
              <div className="text-sm text-slate-400 font-black mb-8">請選第三人稱現在式</div>

              <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full">
                {modalOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleModalSubmit(option)}
                    className={`px-6 py-4 rounded-2xl font-black text-xl border ${
                      modalAnswer === option
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-4 text-left">
                <div className="bg-white rounded-2xl p-4 border border-slate-100">
                  <div className="text-xs font-black text-slate-400 mb-2">Präteritum</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-xl">{currentVerb.praeteritum}</div>
                    <AudioPill onClick={() => speak(currentVerb.praeteritum)} label="播放過去式發音" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100">
                  <div className="text-xs font-black text-slate-400 mb-2">Perfekt</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-xl">{currentVerb.perfekt}</div>
                    <AudioPill onClick={() => speak(currentVerb.perfekt)} label="播放完成式發音" />
                  </div>
                </div>
              </div>
            </div>
          </FixedCardFrame>

          {modalFeedback && (
            <div
              className={`rounded-2xl px-5 py-4 font-black ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {modalFeedback.text}
            </div>
          )}
        </div>
      )}

      {mode === MODES.LIST && (
        <div className="grid gap-4">
          {visibleList.map((verb) => {
            const stats = renderStats(verb);
            const typeMeta = getTypeMeta(verb.type);
            const auxHint = inferAuxHint(verb);
            const learningState = deriveLearningState(progress[verb.id]);

            return (
              <div
                key={verb.id}
                className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="text-2xl font-black">{verb.infinitive}</div>
                      <AudioPill onClick={() => speak(verb.infinitive)} label="播放動詞發音" />

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-black border border-amber-200">
                          {verb.level}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-black border ${learningState.cls}`}>
                          {learningState.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-black border ${typeMeta.cls}`}>
                          {typeMeta.label}
                        </span>
                        {auxHint && (
                          <span className={`px-3 py-1 rounded-full text-sm font-black border ${auxHint.cls}`}>
                            {auxHint.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">3. Person</div>
                        <div className="font-black">
                          {highlightChangedVowel(verb.infinitive, verb.present3rd)}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">Präteritum</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black">
                            {highlightChangedVowel(verb.infinitive, verb.praeteritum)}
                          </div>
                          <AudioPill onClick={() => speak(verb.praeteritum)} label="播放過去式發音" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">Perfekt</div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-black">{renderPerfektWithAuxHighlight(verb.perfekt)}</div>
                          <AudioPill onClick={() => speak(verb.perfekt)} label="播放完成式發音" />
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <div className="text-xs font-black text-slate-400 mb-1">中文</div>
                        <div className="font-black">{verb.meaningZh}</div>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-50 rounded-2xl p-3">
                      <div className="text-xs font-black text-slate-400 mb-2">例句</div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-slate-600 font-medium flex-1">{verb.example}</div>
                        <AudioPill onClick={() => speak(verb.example)} label="播放例句發音" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[220px] bg-slate-50 rounded-2xl p-4">
                    <div className="text-sm font-black text-slate-500 mb-2">學習紀錄</div>
                    <div className="text-sm font-bold text-slate-700">看過：{stats.seen}</div>
                    <div className="text-sm font-bold text-slate-700">答對：{stats.correct}</div>
                    <div className="text-sm font-bold text-slate-700">答錯：{stats.wrong}</div>
                    <div className="text-sm font-bold text-slate-700">收藏：{stats.starred ? '是' : '否'}</div>
                    <div className="text-sm font-bold text-slate-700">不熟：{stats.hard ? '是' : '否'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
