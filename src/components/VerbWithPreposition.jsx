import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Brain, Settings, List, Volume2, RotateCw, 
  CheckCircle, XCircle, Trophy, Search, ChevronDown, ChevronUp, 
  Play, Star, Cloud, CloudOff, Calendar
} from 'lucide-react';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { verbPrepositions } from '../data/verb-prepositions';
import { getFirebaseServices } from '../lib/firebase';
import { loadLesson2Progress, saveLesson2Progress } from '../lib/progressStorage';

const verbData = verbPrepositions;

const useSpeech = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null);
  const [rate, setRate] = useState(0.9);

  useEffect(() => {
    const fetchVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      const allVoices = window.speechSynthesis.getVoices();
      const germanVoices = allVoices.filter(v => v.lang.startsWith('de'));
      setVoices(germanVoices);
      if (germanVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(germanVoices[0].voiceURI);
      }
    };

    fetchVoices();
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
    
    const handleFirstTouch = () => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(utterance);
        window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('touchstart', handleFirstTouch);
    return () => window.removeEventListener('touchstart', handleFirstTouch);
  }, [selectedVoiceURI]);

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = rate;
    
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  return { voices, selectedVoiceURI, setSelectedVoiceURI, rate, setRate, speak };
};

// --- 3.1 Flashcard Component ---
const Flashcard = ({ card, speak, toggleStar, isStarred, handleSRS, nextCard, prevCard }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto mb-4">
      <div className="relative w-full px-0 md:px-6">
        <button
          onClick={prevCard}
          className="absolute left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl border border-amber-200 bg-white/95 text-2xl font-black text-amber-600 shadow-sm hover:bg-amber-50 active:scale-95 md:flex"
          type="button"
          aria-label="上一張"
          title="上一張"
        >
          ←
        </button>
        <button
          onClick={nextCard}
          className="absolute right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl border border-amber-200 bg-white/95 text-2xl font-black text-amber-600 shadow-sm hover:bg-amber-50 active:scale-95 md:flex"
          type="button"
          aria-label="下一張"
          title="下一張"
        >
          →
        </button>
      <div 
        className="relative w-full min-h-[390px] sm:min-h-[460px] md:min-h-[520px] cursor-pointer group perspective-1000 touch-pan-y"
      >
        <div className={`absolute w-full h-full duration-500 preserve-3d transition-all ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          <div
            className="absolute w-full h-full bg-white rounded-[32px] shadow-sm border border-amber-100 p-5 md:p-8 flex flex-col items-center justify-center backface-hidden transition-shadow"
            onClick={(e) => {
              if (e.target.closest('button')) return;
              setIsFlipped(true);
            }}
          >
            <button
                onClick={(e) => { e.stopPropagation(); toggleStar(card.id); }}
                className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl z-10 bg-white/80 border border-amber-100 shadow-sm"
            >
                <Star size={24} className={isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
            </button>
            <div className="text-amber-400 mb-4 opacity-50 md:group-hover:opacity-100 transition-opacity">
              <RotateCw size={28} />
            </div>
            <h2 className="text-[clamp(2rem,12vw,4.5rem)] font-extrabold text-gray-800 mb-3 text-center tracking-tight leading-tight px-2 break-words max-w-full">{card.verb}</h2>
            <p className="text-base sm:text-xl md:text-2xl text-amber-700 font-medium mb-6 break-words text-center">{card.verbTrans}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); speak(card.verb); }}
              className="p-4 sm:p-5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95 transition-all mb-4 shadow-sm"
            >
              <Volume2 size={24} className="sm:w-7 sm:h-7" />
            </button>
            <span className="text-[11px] text-gray-400 font-medium mt-auto bg-gray-50 px-3 py-1.5 rounded-full">
              點擊翻面
            </span>
          </div>

          <div
            className="absolute w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-[32px] shadow-sm border border-amber-200 p-4 sm:p-5 md:p-8 flex flex-col items-center justify-between [transform:rotateY(180deg)] backface-hidden overflow-hidden"
            onClick={(e) => {
              if (e.target.closest('button') || e.target.closest('[data-no-flip]')) return;
              setIsFlipped(false);
            }}
          >
            <div className="w-full text-center flex-1 overflow-y-auto hide-scrollbar pb-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-2 mt-2">
                 <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">{card.verb}</h2>
                 <span className="text-lg sm:text-2xl md:text-3xl font-extrabold text-amber-600">+ {card.prep}</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-[10px] sm:text-xs font-bold mb-3 shadow-sm">
                + {card.case === 'A' ? 'Akkusativ' : 'Dativ'}
              </div>
              <div className="w-full bg-white/80 backdrop-blur p-2.5 sm:p-3 rounded-2xl shadow-sm border border-amber-100/50 mb-2.5 text-left">
                <p className="text-amber-600/80 uppercase text-[9px] sm:text-[10px] font-bold tracking-wider mb-1">Perfekt Form</p>
                <p className="text-gray-800 font-medium text-sm sm:text-base break-words">{card.forms}</p>
              </div>
              <div className="w-full bg-white/80 backdrop-blur p-2.5 sm:p-3 rounded-2xl shadow-sm border border-amber-100/50 text-left relative">
                <div className="flex justify-between items-start mb-1 gap-2">
                   <p className="text-gray-800 text-sm sm:text-base leading-snug font-medium break-words min-w-0">{card.example}</p>
                   <button 
                    onClick={(e) => { e.stopPropagation(); speak(card.example); }}
                    className="p-1.5 sm:p-2 rounded-xl text-amber-500 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-colors shrink-0"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">{card.exampleTrans}</p>
              </div>
            </div>
            
            <div
              className="w-full pt-2 sm:pt-3 mt-1 border-t border-amber-200/50 shrink-0"
              data-no-flip
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[9px] sm:text-[10px] text-center text-amber-700 font-bold mb-1.5 sm:mb-2 tracking-widest uppercase">記憶程度評估</p>
              <div className="flex gap-1.5 sm:gap-2 w-full justify-center">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'hard'); nextCard(); }}
                    className="flex-1 py-2 sm:py-3 bg-red-100 text-red-700 font-bold rounded-xl text-xs sm:text-sm active:scale-95 transition-transform"
                >
                    困難(1天)
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'good'); nextCard(); }}
                    className="flex-1 py-2 sm:py-3 bg-amber-200 text-amber-800 font-bold rounded-xl text-xs sm:text-sm active:scale-95 transition-transform"
                >
                    普通(3天)
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'easy'); nextCard(); }}
                    className="flex-1 py-2 sm:py-3 bg-green-100 text-green-700 font-bold rounded-xl text-xs sm:text-sm active:scale-95 transition-transform"
                >
                    簡單(7天)
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 w-full md:hidden">
        <button
          onClick={prevCard}
          className="rounded-2xl bg-white border border-amber-100 px-4 py-3 text-sm font-black text-amber-700 shadow-sm active:scale-95"
          type="button"
        >
          ← 上一張
        </button>
        <button
          onClick={nextCard}
          className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white shadow-sm active:scale-95"
          type="button"
        >
          下一張 →
        </button>
      </div>
    </div>
  );
};

// --- 3.2 Quiz Component ---
const Quiz = ({ data, speak, addHistory, userData, onlyStarred }) => {
  const [mode, setMode] = useState('word');
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const quizPool = useMemo(() => {
    let pool = data;
    if (onlyStarred) {
        pool = data.filter(d => userData.starred.includes(d.id));
    }
    return pool.length > 0 ? pool : data; 
  }, [data, userData.starred, onlyStarred]);

  const generateQuestion = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * quizPool.length);
    const q = quizPool[randomIdx];
    setQuestion(q);
    setAnswered(false);
    setIsCorrect(false);
    setShowHint(false);

    let correctOpt = "";
    let distractors = [];

    if (mode === 'case') {
      correctOpt = q.case === 'A' ? 'Akkusativ' : 'Dativ';
      setOptions(['Akkusativ', 'Dativ']);
    } else {
      correctOpt = q.prep;
      const allPreps = [...new Set(data.map(d => d.prep))];
      const wrongPreps = allPreps.filter(p => p !== correctOpt);
      distractors = wrongPreps.sort(() => 0.5 - Math.random()).slice(0, 3);
      setOptions([correctOpt, ...distractors].sort(() => 0.5 - Math.random()));
    }
  }, [quizPool, mode, data]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const handleAnswer = (opt) => {
    if (answered) return;
    
    let correct = false;
    if (mode === 'case') {
      correct = (opt === 'Akkusativ' && question.case === 'A') || (opt === 'Dativ' && question.case === 'D');
    } else {
      correct = opt === question.prep;
    }

    setAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
      speak("Richtig!");
    } else {
      setStreak(0);
      speak(`Falsch. Die Antwort ist ${mode === 'case' ? (question.case === 'A' ? 'Akkusativ' : 'Dativ') : question.prep}`);
    }
    
    addHistory({
      mode,
      score: correct ? 10 : 0,
      verb: question.verb,
      correct: correct,
      date: new Date().toISOString()
    });
  };

  if (!question) return <div className="p-8 text-center text-gray-500">準備測驗中...</div>;

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-lg border border-amber-100 p-4 sm:p-5 md:p-6">
      
      {onlyStarred && quizPool.length < data.length && (
          <div className="mb-4 bg-amber-100 text-amber-800 px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 font-bold text-center">
              <Star size={16} className="fill-amber-500 text-amber-500 shrink-0"/>
              <span>專屬單字本 ({quizPool.length} 個單字)</span>
          </div>
      )}

      <div className="flex justify-between items-center mb-5 bg-amber-50 p-3 sm:p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 sm:gap-2 text-amber-700">
          <Trophy size={20} className="sm:w-6 sm:h-6" />
          <span className="font-extrabold text-base sm:text-lg">{score} Pts</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-orange-600">
          <span className="text-xs sm:text-sm font-bold">連勝: {streak}</span>
          <div className="flex gap-1">
            {[...Array(Math.min(streak, 5))].map((_, i) => (
                <div key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 shadow-sm" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {['word', 'sentence', 'case'].map(m => (
            <button 
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-1 ${mode === m ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                {m === 'word' ? '單字模式' : (m === 'sentence' ? '例句填空' : '格位判斷')}
            </button>
        ))}
      </div>

      <div className="text-center mb-6 min-h-[110px] sm:min-h-[120px] flex flex-col items-center justify-center px-1 min-w-0">
        {mode === 'word' && (
          <>
            <h2 className="text-[clamp(1.9rem,11vw,2.75rem)] sm:text-4xl font-extrabold text-gray-800 mb-2 break-words max-w-full">{question.verb}</h2>
            <p className="text-base sm:text-lg text-amber-700 font-medium break-words">{question.verbTrans}</p>
            {showHint && <p className="mt-4 text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">提示：{question.example.replace(new RegExp(`\\b${question.prep}\\b`, 'i'), '___')}</p>}
          </>
        )}
        {mode === 'sentence' && (
          <>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 leading-relaxed break-words">
              {question.example.split(new RegExp(`\\b${question.prep}\\b`, 'i')).map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="inline-block w-12 sm:w-16 border-b-4 border-amber-400 mx-1 sm:mx-2 mb-1"></span>}
                </React.Fragment>
              ))}
            </p>
            <p className="text-sm sm:text-base text-amber-700 font-medium mt-4 bg-amber-50 px-3 sm:px-4 py-1.5 rounded-full inline-block">{question.verb} ({question.verbTrans})</p>
          </>
        )}
        {mode === 'case' && (
          <>
            <h2 className="text-[clamp(1.5rem,8vw,2.5rem)] md:text-4xl font-extrabold text-gray-800 mb-3 break-words">
              {question.verb} <span className="text-amber-600">+ {question.prep}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-full">後面應該接什麼格位？</p>
          </>
        )}

        {mode === 'word' && !showHint && !answered && (
          <button 
            onClick={() => setShowHint(true)}
            className="mt-5 text-xs sm:text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full hover:bg-amber-100"
          >
            💡 顯示提示例句
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
        {options.map((opt, idx) => {
          let btnClass = "py-4 sm:py-5 rounded-2xl border-2 font-bold text-base sm:text-lg transition-all duration-200 active:scale-95 shadow-sm ";
          if (answered) {
            const isThisCorrect = mode === 'case' 
              ? ((opt === 'Akkusativ' && question.case === 'A') || (opt === 'Dativ' && question.case === 'D'))
              : (opt === question.prep);
            
            if (isThisCorrect) {
              btnClass += "bg-green-100 border-green-500 text-green-700 scale-[1.02] shadow-md";
            } else if (opt === (mode === 'case' ? (question.case === 'A' ? 'Akkusativ' : 'Dativ') : question.prep)) {
               btnClass += "bg-green-100 border-green-500 text-green-700";
            } else {
               btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
            }
          } else {
            btnClass += "bg-white border-gray-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 text-gray-700";
          }

          return (
            <button key={idx} disabled={answered} onClick={() => handleAnswer(opt)} className={btnClass}>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className={`p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 mt-5 ${isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {isCorrect ? <CheckCircle size={20} className="sm:w-6 sm:h-6" /> : <XCircle size={20} className="sm:w-6 sm:h-6" />}
            <span className="font-extrabold text-sm sm:text-base">
              {isCorrect ? '答對了！非常棒！' : `正確答案: ${mode === 'case' ? (question.case === 'A' ? 'Akkusativ' : 'Dativ') : question.prep}`}
            </span>
          </div>
          <button 
            onClick={generateQuestion}
            className="w-full md:w-auto px-5 py-2.5 sm:py-3 bg-white rounded-xl shadow font-extrabold text-sm border hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            下一題 <Play size={16} className="fill-current" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- 3.3 List View Component ---
const VerbList = ({ data, speak, userData, toggleStar }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.verb.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.verbTrans.includes(searchTerm) ||
                          item.prep.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStar = showOnlyStarred ? userData.starred.includes(item.id) : true;
      return matchSearch && matchStar;
    });
  }, [data, searchTerm, showOnlyStarred, userData.starred]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-4">
      <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100 mb-5 sticky top-2 z-10 flex flex-col gap-3">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input 
            type="text"
            placeholder="搜尋動詞或意思..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm sm:text-base font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center justify-between px-1 sm:px-2">
            <span className="text-xs sm:text-sm font-bold text-gray-500">共 {filteredData.length} 個</span>
            <button 
                onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${showOnlyStarred ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
            >
                <Star size={14} className={showOnlyStarred ? "fill-amber-500 text-amber-500" : ""} />
                收藏
            </button>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {filteredData.map(item => {
          const isStarred = userData.starred.includes(item.id);
          const srsData = userData.srs[item.id];
          const nextReview = srsData?.nextReview ? new Date(srsData.nextReview).toLocaleDateString() : '尚未複習';

          return (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="p-3.5 sm:p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1 flex items-start gap-2 sm:gap-3">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                    className="mt-0.5 sm:mt-1 flex-shrink-0"
                >
                    <Star size={20} className={isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                </button>
                <div>
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-1">
                        <span className="font-extrabold text-base sm:text-lg text-gray-800">{item.verb}</span>
                        <span className="text-amber-600 font-extrabold text-sm sm:text-base">+ {item.prep}</span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold border border-gray-200">+{item.case}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{item.verbTrans}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); speak(item.verb); }}
                  className="p-2 sm:p-3 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors"
                >
                  <Volume2 size={18} />
                </button>
                <div className="p-1 sm:p-2 text-gray-300">
                  {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {expandedId === item.id && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 bg-gradient-to-b from-transparent to-amber-50/30">
                <div className="pt-2 sm:pt-3 border-t border-gray-100 space-y-2.5 sm:space-y-3">
                   <div className="flex justify-between items-center text-[10px] sm:text-xs">
                     <div><span className="font-bold text-gray-500">三態: </span><span className="text-gray-800 font-medium">{item.forms}</span></div>
                     <div className="bg-blue-50 text-blue-700 px-1.5 py-1 rounded font-bold flex items-center gap-1"><Calendar size={10}/> 複習: {nextReview}</div>
                   </div>
                   <div className="bg-white p-3 sm:p-4 rounded-xl border border-amber-100 shadow-sm">
                     <p className="text-gray-800 mb-1 font-medium text-sm sm:text-base">{item.example}</p>
                     <p className="text-gray-500 text-xs sm:text-sm mb-3">{item.exampleTrans}</p>
                     <button 
                        onClick={() => speak(item.example)}
                        className="text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 text-amber-700 font-bold bg-amber-100/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg w-fit hover:bg-amber-100"
                      >
                        <Volume2 size={14} /> 朗讀例句
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

// --- 3.4 Settings & Cloud Sync Component ---
const SettingsView = ({ voiceData, userData, user }) => {
  const { voices, selectedVoiceURI, setSelectedVoiceURI, rate, setRate, speak } = voiceData;

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('zh-TW', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 sm:space-y-6 pb-6 px-1">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 sm:p-6 rounded-3xl shadow-lg text-white">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
            {user ? <Cloud size={24} className="text-blue-200" /> : <CloudOff size={24} className="text-blue-200" />}
            <h2 className="text-xl sm:text-2xl font-extrabold">雲端同步狀態</h2>
        </div>
        <p className="text-blue-100 text-xs sm:text-sm font-medium mb-4">
            {user ? `已連線 (ID: ${user.uid.slice(0,6)}...)` : '目前為本地模式'}
        </p>
        <div className="bg-white/20 backdrop-blur rounded-2xl p-3 sm:p-4 flex justify-between items-center">
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-black">{userData.starred.length}</div>
                <div className="text-[10px] sm:text-xs text-blue-100 font-bold">收藏單字</div>
            </div>
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-black">{Object.keys(userData.srs).length}</div>
                <div className="text-[10px] sm:text-xs text-blue-100 font-bold">已複習卡片</div>
            </div>
            <div className="text-center">
                <div className="text-xl sm:text-2xl font-black">{userData.history.length}</div>
                <div className="text-[10px] sm:text-xs text-blue-100 font-bold">測驗紀錄</div>
            </div>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 mb-4 sm:mb-5 flex items-center gap-2">
          <Settings size={20} className="text-amber-500" /> 語音設定
        </h2>
        
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">選擇語音 (德語)</label>
            <div className="relative">
                <select 
                value={selectedVoiceURI || ''}
                onChange={(e) => {
                    setSelectedVoiceURI(e.target.value);
                    speak("Hallo, wie geht es dir?");
                }}
                className="w-full p-3 sm:p-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm sm:text-base font-medium appearance-none"
                >
                {voices.length === 0 && <option>系統載入語音中...</option>}
                {voices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                    </option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 sm:right-4 top-3.5 sm:top-4 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs sm:text-sm font-bold text-gray-700">語速</label>
                <span className="text-xs sm:text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{rate}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" max="1.5" step="0.1" 
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
          
          <button 
            onClick={() => speak("Das ist ein Test für die Aussprache.")}
            className="w-full py-3 sm:py-3.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 active:scale-95 transition-all text-sm sm:text-base font-bold flex justify-center items-center gap-2"
          >
            <Volume2 size={18} /> 測試發音
          </button>
        </div>
      </div>
    </div>
  );
};


export default function VerbWithPreposition() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const speechData = useSpeech();
  const [onlyStarredFlashcards, setOnlyStarredFlashcards] = useState(false);
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(loadLesson2Progress);

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
    
    const unsubscribe = onSnapshot(docRef, (document) => {
        if (document.exists()) {
            const data = document.data();
            if (data.lesson2) {
              setUserData(data.lesson2);
              saveLesson2Progress(data.lesson2);
            }
        } else {
            setDoc(docRef, { lesson2: userData, updatedAt: new Date().toISOString() }, { merge: true });
        }
    }, (error) => {
        console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCloudData = async (newData) => {
      const updated = { ...userData, ...newData };
      setUserData(updated);
      saveLesson2Progress(updated);

      const services = getFirebaseServices();
      if (services && user) {
          try {
            const docRef = doc(services.db, 'users', user.uid, 'learning', 'progress');
            await setDoc(docRef, { lesson2: updated, updatedAt: new Date().toISOString() }, { merge: true });
          } catch(e) { console.error(e) }
      }
  };

  const toggleStar = (verbId) => {
      const isStarred = userData.starred.includes(verbId);
      const newStarred = isStarred 
        ? userData.starred.filter(id => id !== verbId)
        : [...userData.starred, verbId];
      updateCloudData({ starred: newStarred });
  };

  const addHistory = (record) => {
      updateCloudData({ history: [...userData.history, record] });
  };

  const handleSRS = (verbId, rating) => {
      const now = Date.now();
      let currentInterval = userData.srs[verbId]?.interval || 0;
      let nextInterval = 0;

      if (rating === 'hard') {
          nextInterval = 1; 
      } else if (rating === 'good') {
          nextInterval = currentInterval === 0 ? 3 : currentInterval * 2;
      } else if (rating === 'easy') {
          nextInterval = currentInterval === 0 ? 7 : currentInterval * 3;
      }

      const nextReviewDate = now + (nextInterval * 24 * 60 * 60 * 1000);
      
      const newSrs = { 
          ...userData.srs, 
          [verbId]: { interval: nextInterval, nextReview: nextReviewDate } 
      };
      updateCloudData({ srs: newSrs });
  };

  const deck = useMemo(() => {
      if (onlyStarredFlashcards && userData.starred.length > 0) {
          return verbData.filter(v => userData.starred.includes(v.id));
      }
      return verbData;
  }, [onlyStarredFlashcards, userData.starred]);

  useEffect(() => {
      if (flashcardIndex >= deck.length) setFlashcardIndex(0);
  }, [deck, flashcardIndex]);

  const currentCard = deck[flashcardIndex] || deck[0];
  const nextCard = useCallback(() => setFlashcardIndex((i) => (i + 1) % deck.length), [deck.length]);
  const prevCard = useCallback(() => setFlashcardIndex((i) => (i - 1 + deck.length) % deck.length), [deck.length]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (activeTab !== 'flashcards') return;
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab, nextCard, prevCard]);

  return (
    <div className="w-full relative pb-24 md:pb-8 text-gray-800 font-sans selection:bg-amber-200">

      {/* 電腦版/平板版專用的頂部工具列 */}
      <div className="hidden md:grid grid-cols-4 gap-2 mb-3 rounded-[20px] bg-white shadow-sm border border-slate-200 p-3">
        {['flashcards', 'quiz', 'list', 'settings'].map((tab) => {
              const icons = { 'flashcards': RotateCw, 'quiz': Brain, 'list': List, 'settings': Settings };
              const labels = { 'flashcards': '字卡', 'quiz': '測驗', 'list': '列表', 'settings': '設定' };
              const Icon = icons[tab];
              const isActive = activeTab === tab;
              
              return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`min-h-10 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl font-black text-sm border transition-all ${isActive ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      {labels[tab]}
                  </button>
              )
          })}
      </div>

      <main className="w-full">
        
        {activeTab === 'flashcards' && currentCard && (
          <div className="flex flex-col items-center">
            
            <div className="w-full flex justify-center items-center mb-3 max-w-3xl px-1">
              <div className="flex flex-col items-center">
                  <span className="text-gray-500 font-black font-mono bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-base sm:text-lg">
                      {flashcardIndex + 1} / {deck.length}
                  </span>
                  {userData.starred.length > 0 && (
                      <button 
                          onClick={() => setOnlyStarredFlashcards(!onlyStarredFlashcards)}
                          className="text-[10px] sm:text-xs mt-1.5 font-bold flex items-center gap-1 text-gray-400 hover:text-amber-500"
                      >
                          <Star size={12} className={onlyStarredFlashcards ? "fill-amber-400 text-amber-400" : ""} /> 
                          {onlyStarredFlashcards ? '顯示全部' : '僅顯示收藏'}
                      </button>
                  )}
              </div>
            </div>
            
            <Flashcard 
                card={currentCard} 
                speak={speechData.speak} 
                isStarred={userData.starred.includes(currentCard.id)}
                toggleStar={toggleStar}
                handleSRS={handleSRS}
                nextCard={nextCard}
                prevCard={prevCard}
            />
          </div>
        )}

        {activeTab === 'quiz' && (
          <Quiz data={verbData} speak={speechData.speak} addHistory={addHistory} userData={userData} onlyStarred={onlyStarredFlashcards} />
        )}

        {activeTab === 'list' && (
          <VerbList data={verbData} speak={speechData.speak} userData={userData} toggleStar={toggleStar} />
        )}

        {activeTab === 'settings' && (
          <SettingsView voiceData={speechData} userData={userData} user={user} />
        )}

      </main>

      {/* 手機版底部導覽列 (改為 fixed 貼合手機最底部，不會因為內容長度而亂跑) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden z-50 pb-safe">
        <div className="flex justify-around items-center h-[72px]">
          {['flashcards', 'quiz', 'list', 'settings'].map((tab) => {
              const icons = { 'flashcards': RotateCw, 'quiz': Brain, 'list': List, 'settings': Settings };
              const labels = { 'flashcards': '字卡', 'quiz': '測驗', 'list': '列表', 'settings': '設定' };
              const Icon = icons[tab];
              const isActive = activeTab === tab;
              
              return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-amber-600' : 'text-gray-400 hover:text-amber-400'}`}>
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all ${isActive ? 'scale-110' : ''}`} />
                      <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-medium'}`}>{labels[tab]}</span>
                  </button>
              )
          })}
        </div>
      </nav>
      
      <style>{`
          .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
          .perspective-1000 { perspective: 1000px; }
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
