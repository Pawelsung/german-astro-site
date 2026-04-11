import React, { useState, useEffect, useCallback } from 'react';

// 預設名詞庫
const nounDatabase = [
  { article: "der", word: "Apfel", meaning: "蘋果" },
  { article: "die", word: "Banane", meaning: "香蕉" },
  { article: "das", word: "Brot", meaning: "麵包" },
  { article: "der", word: "Hund", meaning: "狗" },
  { article: "die", word: "Katze", meaning: "貓" },
  { article: "das", word: "Haus", meaning: "房子" },
  { article: "der", word: "Baum", meaning: "樹" },
  { article: "die", word: "Stadt", meaning: "城市" },
  { article: "das", word: "Buch", meaning: "書" },
  { article: "der", word: "Tisch", meaning: "桌子" }
];

const articleTheme = {
  der: {
    badge: "bg-blue-600 text-white",
    card: "bg-blue-50 border-blue-100",
    button: "border-blue-100 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 text-blue-600"
  },
  die: {
    badge: "bg-rose-500 text-white",
    card: "bg-rose-50 border-rose-100",
    button: "border-rose-100 hover:border-rose-400 hover:bg-rose-50 active:bg-rose-100 text-rose-500"
  },
  das: {
    badge: "bg-emerald-600 text-white",
    card: "bg-emerald-50 border-emerald-100",
    button: "border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100 text-emerald-600"
  }
};

export default function NounChallengeApp() {
  const [currentWord, setCurrentWord] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const speakWord = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'de-DE';
    ut.rate = 0.9;
    window.speechSynthesis.speak(ut);
  }, []);

  const nextWord = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * nounDatabase.length);
    setCurrentWord(nounDatabase[randomIndex]);
    setFeedback(null);
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    nextWord();
  }, [nextWord]);

  const handleGuess = (guessedArticle) => {
    if (!currentWord || isAnimating) return;
    setIsAnimating(true);

    const isCorrect = guessedArticle === currentWord.article;

    if (isCorrect) {
      speakWord(`${currentWord.article} ${currentWord.word}`);
      setScore((s) => s + 10);
      setStreak((s) => s + 1);
      setFeedback({ type: 'success', text: 'Richtig! (+10)' });
      setTimeout(nextWord, 900);
    } else {
      setStreak(0);
      setFeedback({
        type: 'error',
        text: `Falsch! 正確是：${currentWord.article.toUpperCase()}`
      });
      setTimeout(nextWord, 1500);
    }
  };

  if (!currentWord) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center font-bold text-slate-400">
        題目準備中...
      </div>
    );
  }

  const theme = articleTheme[currentWord.article] || articleTheme.das;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-8">
      {/* 頂部資訊 */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">分數</p>
          <p className="text-4xl font-black text-slate-800">{score}</p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">連擊</p>
          <p className={`text-4xl font-black ${streak > 2 ? 'text-orange-500' : 'text-slate-800'}`}>
            {streak > 0 ? `${streak} ✖` : '-'}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">發音</p>
            <p className="text-lg font-black text-slate-800">德語朗讀</p>
          </div>
          <button
            onClick={() => speakWord(currentWord.word)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95"
          >
            🔊
          </button>
        </div>
      </div>

      {/* 主卡片 */}
      <div className={`rounded-[3rem] border shadow-xl overflow-hidden ${theme.card}`}>
        <div className="min-h-[420px] md:min-h-[520px] lg:min-h-[580px] flex flex-col justify-center items-center px-6 py-10 md:px-10 text-center relative">
          <div className={`mb-8 rounded-full px-6 py-2 text-lg font-black uppercase shadow-sm ${theme.badge}`}>
            {currentWord.article}
          </div>

          {feedback ? (
            <div className={feedback.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}>
              <div className="mb-4 text-3xl md:text-4xl font-black">{feedback.text}</div>
              <div className="text-6xl md:text-7xl font-black opacity-30 tracking-tight">
                {currentWord.word}
              </div>
              <div className="mt-4 text-xl md:text-2xl font-bold text-slate-400">
                {currentWord.meaning}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-800">
                {currentWord.word}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-slate-400">
                {currentWord.meaning}
              </div>
            </div>
          )}

          <div className="mt-12 text-sm md:text-base font-black text-slate-400">
            選擇正確冠詞
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="border-t border-white/60 bg-white/70 px-4 py-5 md:px-8 md:py-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button
              onClick={() => handleGuess('der')}
              disabled={isAnimating}
              className={`rounded-[1.75rem] border-2 bg-white py-5 md:py-7 text-3xl md:text-4xl font-black shadow-sm transition-all disabled:opacity-50 ${articleTheme.der.button}`}
            >
              der
            </button>

            <button
              onClick={() => handleGuess('die')}
              disabled={isAnimating}
              className={`rounded-[1.75rem] border-2 bg-white py-5 md:py-7 text-3xl md:text-4xl font-black shadow-sm transition-all disabled:opacity-50 ${articleTheme.die.button}`}
            >
              die
            </button>

            <button
              onClick={() => handleGuess('das')}
              disabled={isAnimating}
              className={`rounded-[1.75rem] border-2 bg-white py-5 md:py-7 text-3xl md:text-4xl font-black shadow-sm transition-all disabled:opacity-50 ${articleTheme.das.button}`}
            >
              das
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}