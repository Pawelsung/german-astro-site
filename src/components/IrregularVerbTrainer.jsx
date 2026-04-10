import React, { useEffect, useMemo, useState } from 'react';
import { irregularVerbs } from '../data/irregular-verbs';

const STORAGE_KEY = 'irregular-verbs-trainer-v2';

const MODES = {
  FLASHCARD: 'flashcard',
  TYPING: 'typing',
  HABEN_SEIN: 'habenSein',
  MODAL: 'modal',
  LIST: 'list',
  WRONG: 'wrong',
  HARD: 'hard',
  STARRED: 'starred'
};

function shuffle(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitPerfekt(perfekt) {
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
}

export default function IrregularVerbTrainer() {
  const [mode, setMode] = useState(MODES.FLASHCARD);
  const [level, setLevel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBack, setShowBack] = useState(false);
  const [progress, setProgress] = useState({});
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

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

  const wrongList = useMemo(() => {
    return filteredByLevel.filter((verb) => (progress[verb.id]?.wrongCount || 0) > 0);
  }, [filteredByLevel, progress]);

  const hardList = useMemo(() => {
    return filteredByLevel.filter((verb) => progress[verb.id]?.isHard);
  }, [filteredByLevel, progress]);

  const starredList = useMemo(() => {
    return filteredByLevel.filter((verb) => progress[verb.id]?.starred);
  }, [filteredByLevel, progress]);

  const modalList = useMemo(() => {
    return filteredByLevel.filter((verb) => verb.group === 'modal');
  }, [filteredByLevel]);

  const visibleList = useMemo(() => {
    let base = filteredByLevel;

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
        verb.group || ''
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [filteredByLevel, wrongList, hardList, starredList, modalList, search, mode]);

  useEffect(() => {
    let nextDeck = visibleList;

    if (
      mode === MODES.TYPING ||
      mode === MODES.HABEN_SEIN ||
      mode === MODES.MODAL ||
      mode === MODES.WRONG ||
      mode === MODES.HARD
    ) {
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
  }, [visibleList, mode]);

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

  function nextCard() {
    if (!deck.length) return;
    setCurrentIndex((prev) => (prev + 1) % deck.length);
    setShowBack(false);
    setTypingPraeteritum('');
    setTypingPerfekt('');
    setTypingFeedback(null);
    setAuxAnswer('');
    setAuxFeedback(null);
    setModalAnswer('');
    setModalFeedback(null);
  }

  function prevCard() {
    if (!deck.length) return;
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    setShowBack(false);
    setTypingPraeteritum('');
    setTypingPerfekt('');
    setTypingFeedback(null);
    setAuxAnswer('');
    setAuxFeedback(null);
    setModalAnswer('');
    setModalFeedback(null);
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
  const modalOptions = currentVerb && mode === MODES.MODAL ? generateModalOptions(currentVerb) : [];

  const modeLabel = {
    flashcard: '字卡',
    typing: '三態拼寫',
    habenSein: 'haben / sein',
    modal: '情態動詞',
    list: '列表',
    wrong: '錯題重練',
    hard: '不熟清單',
    starred: '收藏清單'
  }[mode];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 rounded-[36px] bg-white shadow-sm border border-amber-100 p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-sm font-black text-amber-600 mb-2">Lektion 3</div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">
                🇩🇪 不規則動詞特訓
              </h1>
              <p className="text-slate-500 mt-3 font-medium leading-relaxed">
                練習 Infinitiv、第三人稱現在式、Präteritum、Perfekt、haben / sein，
                並額外加入情態動詞、語音、不熟與收藏。
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-amber-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-amber-600 mb-1">題庫數量</div>
                <div className="text-2xl font-black">{visibleList.length}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-slate-500 mb-1">目前模式</div>
                <div className="text-2xl font-black">{modeLabel}</div>
              </div>
              <div className="bg-rose-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-rose-500 mb-1">錯題數</div>
                <div className="text-2xl font-black">{wrongList.length}</div>
              </div>
              <div className="bg-indigo-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-indigo-500 mb-1">情態動詞</div>
                <div className="text-2xl font-black">{modalList.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setMode(MODES.FLASHCARD)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.FLASHCARD
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              📖 字卡
            </button>

            <button
              onClick={() => setMode(MODES.TYPING)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.TYPING
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              ✍️ 三態拼寫
            </button>

            <button
              onClick={() => setMode(MODES.HABEN_SEIN)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.HABEN_SEIN
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              ⚡ haben / sein
            </button>

            <button
              onClick={() => setMode(MODES.MODAL)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.MODAL
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              🧩 情態動詞
            </button>

            <button
              onClick={() => setMode(MODES.LIST)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.LIST
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              📚 列表
            </button>

            <button
              onClick={() => setMode(MODES.WRONG)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.WRONG
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              ⚠️ 錯題
            </button>

            <button
              onClick={() => setMode(MODES.HARD)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.HARD
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              🔥 不熟
            </button>

            <button
              onClick={() => setMode(MODES.STARRED)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.STARRED
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              ⭐ 收藏
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold outline-none"
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
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold outline-none"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] p-4 flex flex-col gap-4">
            <div className="text-sm font-black text-slate-500">🔊 德語語音設定</div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-2">德語人聲</label>
                <select
                  value={voiceURI}
                  onChange={(e) => setVoiceURI(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 font-bold outline-none"
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
        </div>

        {!currentVerb && (
          <div className="bg-white rounded-[32px] p-10 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-2xl font-black mb-2">目前沒有資料</div>
            <p className="text-slate-500 font-medium">
              請切換等級、搜尋條件，或先累積一些錯題／不熟／收藏。
            </p>
          </div>
        )}

        {currentVerb && (
          <div className="mb-5 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => toggleStar(currentVerb.id)}
              className={`px-4 py-2 rounded-full font-black border ${
                currentStats?.starred
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              ⭐ 收藏
            </button>

            <button
              onClick={() => toggleHard(currentVerb.id)}
              className={`px-4 py-2 rounded-full font-black border ${
                currentStats?.hard
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              🔥 不熟
            </button>

            <button
              onClick={() => speak(currentVerb.infinitive)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 font-black text-slate-700"
            >
              🔊 念動詞
            </button>

            <button
              onClick={() => speak(currentVerb.praeteritum)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 font-black text-slate-700"
            >
              🔊 念過去式
            </button>

            <button
              onClick={() => speak(currentVerb.perfekt)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 font-black text-slate-700"
            >
              🔊 念完成式
            </button>

            <button
              onClick={() => speak(currentVerb.example)}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 font-black text-slate-700"
            >
              🔊 念例句
            </button>
          </div>
        )}

        {currentVerb && mode === MODES.FLASHCARD && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-slate-200 p-6 md:p-8">
              <div
                onClick={handleFlip}
                className="cursor-pointer min-h-[380px] rounded-[28px] border-2 border-amber-100 bg-amber-50 flex flex-col justify-center items-center text-center p-8"
              >
                {!showBack ? (
                  <>
                    <div className="mb-3 flex flex-wrap justify-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white text-amber-600 text-sm font-black border border-amber-200">
                        {currentVerb.level}
                      </span>
                      {currentVerb.group === 'modal' && (
                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm font-black border border-indigo-200">
                          Modalverb
                        </span>
                      )}
                    </div>

                    <div className="text-5xl md:text-6xl font-black mb-4">
                      {currentVerb.infinitive}
                    </div>
                    <div className="text-lg md:text-xl text-slate-500 font-bold mb-2">
                      {currentVerb.meaningZh}
                    </div>
                    <div className="text-sm text-slate-400 font-bold mt-6">
                      點一下翻面看變化
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-2xl">
                    <div className="grid sm:grid-cols-2 gap-4 text-left">
                      <div className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black text-slate-400 mb-2">Infinitiv</div>
                        <div className="text-2xl font-black">{currentVerb.infinitive}</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black text-slate-400 mb-2">3. Person</div>
                        <div className="text-2xl font-black">{currentVerb.present3rd}</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black text-slate-400 mb-2">Präteritum</div>
                        <div className="text-2xl font-black">{currentVerb.praeteritum}</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black text-slate-400 mb-2">Perfekt</div>
                        <div className="text-2xl font-black">{currentVerb.perfekt}</div>
                      </div>
                    </div>

                    <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-100 text-left">
                      <div className="text-xs font-black text-slate-400 mb-2">例句</div>
                      <div className="text-lg font-bold">{currentVerb.example}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevCard}
                className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-black"
              >
                ← 上一個
              </button>
              <div className="px-4 py-2 rounded-full bg-slate-100 font-black text-slate-700">
                {currentIndex + 1} / {deck.length}
              </div>
              <button
                onClick={nextCard}
                className="px-5 py-3 rounded-2xl bg-amber-600 text-white font-black"
              >
                下一個 →
              </button>
            </div>
          </div>
        )}

        {currentVerb && mode === MODES.TYPING && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-slate-200 p-6 md:p-8">
              <div className="text-center mb-8">
                <div className="mb-3 px-3 py-1 rounded-full inline-block bg-amber-50 text-amber-600 text-sm font-black border border-amber-200">
                  {currentVerb.level}
                </div>
                <div className="text-5xl font-black mb-3">{currentVerb.infinitive}</div>
                <div className="text-xl font-bold text-slate-500">{currentVerb.meaningZh}</div>
              </div>

              <form onSubmit={handleTypingSubmit} className="space-y-4 max-w-2xl mx-auto">
                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2">
                    Präteritum
                  </label>
                  <input
                    value={typingPraeteritum}
                    onChange={(e) => setTypingPraeteritum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold outline-none"
                    placeholder="請輸入過去式"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-500 mb-2">
                    Perfekt
                  </label>
                  <input
                    value={typingPerfekt}
                    onChange={(e) => setTypingPerfekt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xl font-bold outline-none"
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

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevCard}
                className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-black"
              >
                ← 上一題
              </button>
              <div className="px-4 py-2 rounded-full bg-slate-100 font-black text-slate-700">
                {currentIndex + 1} / {deck.length}
              </div>
              <button
                onClick={nextCard}
                className="px-5 py-3 rounded-2xl bg-amber-600 text-white font-black"
              >
                下一題 →
              </button>
            </div>
          </div>
        )}

        {currentVerb && mode === MODES.HABEN_SEIN && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-slate-200 p-6 md:p-8 text-center">
              <div className="mb-3 px-3 py-1 rounded-full inline-block bg-amber-50 text-amber-600 text-sm font-black border border-amber-200">
                {currentVerb.level}
              </div>
              <div className="text-5xl font-black mb-3">{currentVerb.infinitive}</div>
              <div className="text-xl font-bold text-slate-500 mb-6">{currentVerb.meaningZh}</div>

              <div className="text-sm font-black text-slate-400 mb-2">
                請選擇 Perfekt 要用的 Hilfsverb
              </div>
              <div className="text-lg font-black text-slate-600 mb-3">
                {splitPerfekt(currentVerb.perfekt).participle}
              </div>

              <button
                onClick={() => speak(splitPerfekt(currentVerb.perfekt).participle)}
                className="mb-6 px-4 py-2 rounded-full bg-slate-100 font-black text-slate-700"
              >
                🔊 念分詞
              </button>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleAuxAnswer('hat')}
                  className={`px-8 py-4 rounded-2xl font-black text-xl border ${
                    auxAnswer === 'hat'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
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
                >
                  ist
                </button>
              </div>
            </div>

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

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevCard}
                className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-black"
              >
                ← 上一題
              </button>
              <div className="px-4 py-2 rounded-full bg-slate-100 font-black text-slate-700">
                {currentIndex + 1} / {deck.length}
              </div>
              <button
                onClick={nextCard}
                className="px-5 py-3 rounded-2xl bg-amber-600 text-white font-black"
              >
                下一題 →
              </button>
            </div>
          </div>
        )}

        {currentVerb && mode === MODES.MODAL && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-indigo-200 p-6 md:p-8 text-center">
              <div className="mb-3 px-3 py-1 rounded-full inline-block bg-indigo-50 text-indigo-600 text-sm font-black border border-indigo-200">
                Modalverb
              </div>
              <div className="text-5xl font-black mb-3">{currentVerb.infinitive}</div>
              <div className="text-xl font-bold text-slate-500 mb-2">{currentVerb.meaningZh}</div>
              <div className="text-sm text-slate-400 font-black mb-8">
                請選第三人稱現在式
              </div>

              <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {modalOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleModalSubmit(option)}
                    className={`px-6 py-4 rounded-2xl font-black text-xl border ${
                      modalAnswer === option
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-xs font-black text-slate-400 mb-2">Präteritum</div>
                  <div className="font-black text-xl">{currentVerb.praeteritum}</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-xs font-black text-slate-400 mb-2">Perfekt</div>
                  <div className="font-black text-xl">{currentVerb.perfekt}</div>
                </div>
              </div>
            </div>

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

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevCard}
                className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-black"
              >
                ← 上一題
              </button>
              <div className="px-4 py-2 rounded-full bg-slate-100 font-black text-slate-700">
                {currentIndex + 1} / {deck.length}
              </div>
              <button
                onClick={nextCard}
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black"
              >
                下一題 →
              </button>
            </div>
          </div>
        )}

        {mode === MODES.LIST && (
          <div className="grid gap-4">
            {visibleList.map((verb) => {
              const stats = renderStats(verb);
              return (
                <div
                  key={verb.id}
                  className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className="text-2xl font-black">{verb.infinitive}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-black border border-amber-200">
                            {verb.level}
                          </span>
                          {verb.group === 'modal' && (
                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-black border border-indigo-200">
                              Modalverb
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <div className="text-xs font-black text-slate-400 mb-1">3. Person</div>
                          <div className="font-black">{verb.present3rd}</div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <div className="text-xs font-black text-slate-400 mb-1">Präteritum</div>
                          <div className="font-black">{verb.praeteritum}</div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <div className="text-xs font-black text-slate-400 mb-1">Perfekt</div>
                          <div className="font-black">{verb.perfekt}</div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <div className="text-xs font-black text-slate-400 mb-1">中文</div>
                          <div className="font-black">{verb.meaningZh}</div>
                        </div>
                      </div>

                      <div className="mt-4 text-slate-600 font-medium">
                        例句：{verb.example}
                      </div>
                    </div>

                    <div className="min-w-[220px] bg-rose-50 rounded-2xl p-4">
                      <div className="text-sm font-black text-rose-500 mb-2">學習紀錄</div>
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

        {(mode === MODES.WRONG || mode === MODES.HARD || mode === MODES.STARRED) && currentVerb && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-rose-200 p-6 md:p-8">
              <div
                onClick={handleFlip}
                className="cursor-pointer min-h-[380px] rounded-[28px] border-2 border-rose-100 bg-rose-50 flex flex-col justify-center items-center text-center p-8"
              >
                {!showBack ? (
                  <>
                    <div className="mb-3 px-3 py-1 rounded-full bg-white text-rose-500 text-sm font-black border border-rose-200">
                      {mode === MODES.WRONG ? '錯題重練' : mode === MODES.HARD ? '不熟清單' : '收藏清單'}
                    </div>
                    <div className="text-5xl md:text-6xl font-black mb-4">
                      {currentVerb.infinitive}
                    </div>
                    <div className="text-lg md:text-xl text-slate-500 font-bold mb-2">
                      {currentVerb.meaningZh}
                    </div>
                    <div className="text-sm text-slate-400 font-bold mt-6">
                      點一下翻面看答案
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-2xl">
                    <div className="grid sm:grid-cols-2 gap-4 text-left">
                      <div className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black text-slate-400 mb-2">3. Person</div>
                        <div className="text-2xl font-black">{currentVerb.present3rd}</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black text-slate-400 mb-2">Präteritum</div>
                        <div className="text-2xl font-black">{currentVerb.praeteritum}</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100 sm:col-span-2">
                        <div className="text-xs font-black text-slate-400 mb-2">Perfekt</div>
                        <div className="text-2xl font-black">{currentVerb.perfekt}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevCard}
                className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-black"
              >
                ← 上一個
              </button>
              <div className="px-4 py-2 rounded-full bg-rose-100 font-black text-rose-600">
                {currentIndex + 1} / {deck.length}
              </div>
              <button
                onClick={nextCard}
                className="px-5 py-3 rounded-2xl bg-rose-500 text-white font-black"
              >
                下一個 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}