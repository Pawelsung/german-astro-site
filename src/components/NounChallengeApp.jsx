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

export default function NounChallengeApp() {
  const [currentWord, setCurrentWord] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  const [isAnimating, setIsAnimating] = useState(false);

  // 語音功能
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

  // 初始載入
  useEffect(() => {
    nextWord();
  }, [nextWord]);

  const handleGuess = (guessedArticle) => {
    if (isAnimating) return; 
    setIsAnimating(true);

    const isCorrect = guessedArticle === currentWord.article;

    if (isCorrect) {
      speakWord(currentWord.article + " " + currentWord.word);
      setScore(s => s + 10);
      setStreak(s => s + 1);
      setFeedback({ type: 'success', text: 'Richtig! (+10)' });
      setTimeout(nextWord, 800); 
    } else {
      setStreak(0);
      setFeedback({ 
        type: 'error', 
        text: `Falsch! 正確是: ${currentWord.article.toUpperCase()}` 
      });
      setTimeout(nextWord, 1500); 
    }
  };

  if (!currentWord) return <div className="text-center p-10 font-bold text-slate-400">題目準備中...</div>;

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden font-sans">
      
      {/* 頂部計分板 */}
      <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
        <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">分數</p>
            <p className="text-3xl font-black">{score}</p>
        </div>
        <div className="text-right">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">連擊</p>
            <p className={`text-3xl font-black ${streak > 2 ? 'text-orange-400' : 'text-white'}`}>
              {streak > 0 ? `${streak} ✖` : '-'}
            </p>
        </div>
      </div>

      {/* 題目顯示區 */}
      <div className="p-10 text-center relative min-h-[220px] flex flex-col justify-center items-center">
        <button 
            onClick={() => speakWord(currentWord.word)} 
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 active:scale-90 transition-all text-xl"
        >
            🔊
        </button>
        
        {feedback ? (
          <div className={`animate-in zoom-in duration-200 ${feedback.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
             <div className="text-2xl font-black mb-2">{feedback.text}</div>
             <div className="text-5xl font-black opacity-30">{currentWord.word}</div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight block mb-4">
                {currentWord.word}
             </span>
             <span className="text-xl font-bold text-slate-400 block">
                {currentWord.meaning}
             </span>
          </div>
        )}
      </div>

      {/* 操作按鈕區 */}
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-4">請選擇詞性</p>
        <div className="grid grid-cols-3 gap-3">
            <button 
                onClick={() => handleGuess('der')}
                disabled={isAnimating}
                className="py-6 rounded-[1.5rem] bg-white border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 font-black text-2xl md:text-3xl text-blue-600 shadow-sm transition-all disabled:opacity-50"
            >
                der
            </button>
            <button 
                onClick={() => handleGuess('die')}
                disabled={isAnimating}
                className="py-6 rounded-[1.5rem] bg-white border-2 border-rose-100 hover:border-rose-400 hover:bg-rose-50 active:bg-rose-100 font-black text-2xl md:text-3xl text-rose-500 shadow-sm transition-all disabled:opacity-50"
            >
                die
            </button>
            <button 
                onClick={() => handleGuess('das')}
                disabled={isAnimating}
                className="py-6 rounded-[1.5rem] bg-white border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50 active:bg-emerald-100 font-black text-2xl md:text-3xl text-emerald-600 shadow-sm transition-all disabled:opacity-50"
            >
                das
            </button>
        </div>
      </div>

    </div>
  );
}