import React, { useEffect, useMemo, useState } from 'react';
import { irregularVerbs } from '../data/irregular-verbs';

const STORAGE_KEY = 'irregular-verbs-trainer-v1';

const MODES = {
  FLASHCARD: 'flashcard',
  TYPING: 'typing',
  AUX: 'aux',
  LIST: 'list',
  WRONG: 'wrong'
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
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
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

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const filteredByLevel = useMemo(() => {
    if (level === 'ALL') return irregularVerbs;
    return irregularVerbs.filter((verb) => verb.level === level);
  }, [level]);

  const wrongList = useMemo(() => {
    return filteredByLevel.filter((verb) => (progress[verb.id]?.wrongCount || 0) > 0);
  }, [filteredByLevel, progress]);

  const visibleList = useMemo(() => {
    const base =
      mode === MODES.WRONG
        ? wrongList
        : filteredByLevel;

    if (!search.trim()) return base;

    const q = normalizeText(search);
    return base.filter((verb) => {
      const haystack = [
        verb.infinitive,
        verb.present3rd,
        verb.praeteritum,
        verb.perfekt,
        verb.meaningZh,
        verb.level
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filteredByLevel, wrongList, search, mode]);

  useEffect(() => {
    let nextDeck = visibleList;

    if (mode === MODES.TYPING || mode === MODES.AUX) {
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
  }, [visibleList, mode]);

  const currentVerb = deck[currentIndex] || null;

  function markSeen(verbId) {
    setProgress((prev) => ({
      ...prev,
      [verbId]: {
        ...(prev[verbId] || {}),
        seenCount: (prev[verbId]?.seenCount || 0) + 1
      }
    }));
  }

  function markCorrect(verbId) {
    setProgress((prev) => ({
      ...prev,
      [verbId]: {
        ...(prev[verbId] || {}),
        correctCount: (prev[verbId]?.correctCount || 0) + 1
      }
    }));
  }

  function markWrong(verbId) {
    setProgress((prev) => ({
      ...prev,
      [verbId]: {
        ...(prev[verbId] || {}),
        wrongCount: (prev[verbId]?.wrongCount || 0) + 1
      }
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

  function renderStats(verb) {
    const item = progress[verb.id] || {};
    return {
      seen: item.seenCount || 0,
      correct: item.correctCount || 0,
      wrong: item.wrongCount || 0
    };
  }

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
                練習 Infinitiv、第三人稱現在式、Präteritum、Perfekt 與 haben / sein。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-amber-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-amber-600 mb-1">題庫數量</div>
                <div className="text-2xl font-black">{visibleList.length}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-slate-500 mb-1">目前模式</div>
                <div className="text-2xl font-black">
                  {{
                    flashcard: '字卡',
                    typing: '拼寫測驗',
                    aux: 'haben / sein',
                    list: '列表',
                    wrong: '錯題重練'
                  }[mode]}
                </div>
              </div>
              <div className="bg-rose-50 rounded-2xl px-4 py-3">
                <div className="text-xs font-black text-rose-500 mb-1">錯題數</div>
                <div className="text-2xl font-black">{wrongList.length}</div>
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
              ✍️ 拼寫測驗
            </button>
            <button
              onClick={() => setMode(MODES.AUX)}
              className={`px-4 py-2 rounded-full font-black border ${
                mode === MODES.AUX
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              ⚡ haben / sein
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
              ⚠️ 錯題重練
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
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋動詞、中文、時態..."
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold outline-none"
            />
          </div>
        </div>

        {!currentVerb && (
          <div className="bg-white rounded-[32px] p-10 text-center shadow-sm border border-slate-200">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-2xl font-black mb-2">目前沒有資料</div>
            <p className="text-slate-500 font-medium">
              請切換等級、搜尋條件，或先累積一些錯題。
            </p>
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
                    <div className="mb-3 px-3 py-1 rounded-full bg-white text-amber-600 text-sm font-black border border-amber-200">
                      {currentVerb.level}
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

        {currentVerb && mode === MODES.AUX && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-slate-200 p-6 md:p-8 text-center">
              <div className="mb-3 px-3 py-1 rounded-full inline-block bg-amber-50 text-amber-600 text-sm font-black border border-amber-200">
                {currentVerb.level}
              </div>
              <div className="text-5xl font-black mb-3">{currentVerb.infinitive}</div>
              <div className="text-xl font-bold text-slate-500 mb-8">{currentVerb.meaningZh}</div>

             <div className="text-sm font-black text-slate-400 mb-2">
                請選擇 Perfekt 要用的 Hilfsverb
            </div>
            <div className="text-lg font-black text-slate-600 mb-6">
                {splitPerfekt(currentVerb.perfekt).participle}
            </div>

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
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-black border border-amber-200">
                          {verb.level}
                        </span>
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

                    <div className="min-w-[180px] bg-rose-50 rounded-2xl p-4">
                      <div className="text-sm font-black text-rose-500 mb-2">學習紀錄</div>
                      <div className="text-sm font-bold text-slate-700">看過：{stats.seen}</div>
                      <div className="text-sm font-bold text-slate-700">答對：{stats.correct}</div>
                      <div className="text-sm font-bold text-slate-700">答錯：{stats.wrong}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === MODES.WRONG && currentVerb && (
          <div className="space-y-5">
            <div className="bg-white rounded-[36px] shadow-sm border border-rose-200 p-6 md:p-8">
              <div
                onClick={handleFlip}
                className="cursor-pointer min-h-[380px] rounded-[28px] border-2 border-rose-100 bg-rose-50 flex flex-col justify-center items-center text-center p-8"
              >
                {!showBack ? (
                  <>
                    <div className="mb-3 px-3 py-1 rounded-full bg-white text-rose-500 text-sm font-black border border-rose-200">
                      錯題重練
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