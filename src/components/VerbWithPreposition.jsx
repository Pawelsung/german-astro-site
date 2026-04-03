import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  BookOpen, Brain, GraduationCap, Settings, List, Volume2, RotateCw, 
  CheckCircle, XCircle, Trophy, History, Search, ChevronDown, ChevronUp, 
  Play, Star, Cloud, CloudOff, Calendar
} from 'lucide-react';

// Firebase Imports
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * ------------------------------------------------------------------
 * 0. FIREBASE SETUP (加入防呆機制)
 * ------------------------------------------------------------------
 */
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-german-app';

// 修正 1：檢查是否有設定 API Key，防止 invalid-api-key 導致崩潰閃退
const hasFirebase = Object.keys(firebaseConfig).length > 0 && firebaseConfig.apiKey;

let app, auth, db;
if (hasFirebase) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase Initialization Error:", err);
  }
}

/**
 * ------------------------------------------------------------------
 * 1. DATA: 德語動詞資料庫 (約 50 個常用動詞)
 * ------------------------------------------------------------------
 */
const verbData = [
  { id: 1, verb: "warten", verbTrans: "等待", prep: "auf", case: "A", forms: "wartete / hat gewartet", example: "Ich warte schon eine Ewigkeit auf dich.", exampleTrans: "我已經等你等了大半天了。" },
  { id: 2, verb: "denken", verbTrans: "想/思考", prep: "an", case: "A", forms: "dachte / hat gedacht", example: "Er denkt oft an seine Kindheit in Berlin zurück.", exampleTrans: "他經常回想起他在柏林的童年。" },
  { id: 3, verb: "sich interessieren", verbTrans: "感興趣", prep: "für", case: "A", forms: "interessierte / hat interessiert", example: "Sie interessiert sich sehr für moderne Kunst und Design.", exampleTrans: "她對現代藝術與設計非常感興趣。" },
  { id: 4, verb: "träumen", verbTrans: "夢想", prep: "von", case: "D", forms: "träumte / hat geträumt", example: "Ich träume von einem eigenen Haus am Meer.", exampleTrans: "我夢想著能擁有一棟海邊的房子。" },
  { id: 5, verb: "teilnehmen", verbTrans: "參加", prep: "an", case: "D", forms: "nahm teil / hat teilgenommen", example: "Nimmst du dieses Jahr wieder am Sprachkurs teil?", exampleTrans: "你今年還要再參加語言課程嗎？" },
  { id: 6, verb: "sprechen", verbTrans: "談論 (主題)", prep: "über", case: "A", forms: "sprach / hat gesprochen", example: "Wir müssen unbedingt über das gestrige Meeting sprechen.", exampleTrans: "我們真的必須談談昨天的會議。" },
  { id: 7, verb: "sprechen", verbTrans: "與...交談", prep: "mit", case: "D", forms: "sprach / hat gesprochen", example: "Ich muss dringend mit meinem Chef sprechen.", exampleTrans: "我有急事必須跟我的老闆談談。" },
  { id: 8, verb: "sich freuen", verbTrans: "期待 (未來)", prep: "auf", case: "A", forms: "freute / hat gefreut", example: "Ich freue mich schon riesig auf das Wochenende.", exampleTrans: "我已經超級期待週末的到來。" },
  { id: 9, verb: "sich freuen", verbTrans: "感到高興 (已發生)", prep: "über", case: "A", forms: "freute / hat gefreut", example: "Er hat sich wahnsinnig über dein Geschenk gefreut.", exampleTrans: "他收到你的禮物真是高興極了。" },
  { id: 10, verb: "sich kümmern", verbTrans: "照顧/處理", prep: "um", case: "A", forms: "kümmerte / hat gekümmert", example: "Keine Sorge, ich kümmere mich um die Buchung.", exampleTrans: "別擔心，預訂的事情我來處理。" },
  { id: 11, verb: "abhängen", verbTrans: "視...而定", prep: "von", case: "D", forms: "hing ab / hat abgehangen", example: "Es hängt vom Wetter ab, ob wir heute grillen.", exampleTrans: "這取決於天氣，我們今天是否要烤肉。" },
  { id: 12, verb: "achten", verbTrans: "注意", prep: "auf", case: "A", forms: "achtete / hat geachtet", example: "Achte beim Autofahren immer auf den Verkehr!", exampleTrans: "開車時請隨時注意交通狀況！" },
  { id: 13, verb: "anfangen", verbTrans: "開始", prep: "mit", case: "D", forms: "fing an / hat angefangen", example: "Lass uns sofort mit der Arbeit anfangen.", exampleTrans: "我們立刻開始工作吧。" },
  { id: 14, verb: "sich ärgern", verbTrans: "生氣", prep: "über", case: "A", forms: "ärgerte / hat geärgert", example: "Ich ärgere mich total über diesen dummen Fehler.", exampleTrans: "我對這個愚蠢的錯誤感到非常生氣。" },
  { id: 15, verb: "aufhören", verbTrans: "停止", prep: "mit", case: "D", forms: "hörte auf / hat aufgehört", example: "Hör endlich mit dem Unsinn auf!", exampleTrans: "別再胡鬧了！（停止這毫無意義的事）" },
  { id: 16, verb: "sich bedanken", verbTrans: "感謝 (對象)", prep: "bei", case: "D", forms: "bedankte / hat bedankt", example: "Ich möchte mich bei Ihnen für die tolle Zusammenarbeit bedanken.", exampleTrans: "我想向您感謝這次愉快的合作。" },
  { id: 17, verb: "sich bedanken", verbTrans: "感謝 (原因)", prep: "für", case: "A", forms: "bedankte / hat bedankt", example: "Er bedankte sich für die schnelle Rückmeldung.", exampleTrans: "他感謝（對方）快速的回覆。" },
  { id: 18, verb: "sich beschäftigen", verbTrans: "忙於/探討", prep: "mit", case: "D", forms: "beschäftigte / hat beschäftigt", example: "Der Artikel beschäftigt sich mit den Folgen des Klimawandels.", exampleTrans: "這篇文章探討了氣候變遷的後果。" },
  { id: 19, verb: "sich beschweren", verbTrans: "抱怨 (對象)", prep: "bei", case: "D", forms: "beschwerte / hat beschwert", example: "Der Gast beschwerte sich beim Hotelmanager.", exampleTrans: "客人在向飯店經理抱怨。" },
  { id: 20, verb: "sich beschweren", verbTrans: "抱怨 (原因)", prep: "über", case: "A", forms: "beschwerte / hat beschwert", example: "Viele Kunden beschweren sich über die langen Wartezeiten.", exampleTrans: "許多顧客抱怨漫長的等待時間。" },
  { id: 21, verb: "sich bewerben", verbTrans: "應徵", prep: "um", case: "A", forms: "bewarb / hat beworben", example: "Sie bewirbt sich um eine Stelle als Softwareentwicklerin.", exampleTrans: "她正在應徵一份軟體工程師的工作。" },
  { id: 22, verb: "bitten", verbTrans: "請求", prep: "um", case: "A", forms: "bat / hat gebeten", example: "Darf ich dich um einen großen Gefallen bitten?", exampleTrans: "我可以請你幫個大忙嗎？" },
  { id: 23, verb: "danken", verbTrans: "感謝", prep: "für", case: "A", forms: "dankte / hat gedankt", example: "Wir danken Ihnen für Ihr Verständnis.", exampleTrans: "感謝您的體諒。" },
  { id: 24, verb: "einladen", verbTrans: "邀請", prep: "zu", case: "D", forms: "lud ein / hat eingeladen", example: "Ich würde dich gern zu meiner Geburtstagsparty einladen.", exampleTrans: "我很樂意邀請你來參加我的生日派對。" },
  { id: 25, verb: "sich entscheiden", verbTrans: "決定", prep: "für", case: "A", forms: "entschied / hat entschieden", example: "Wir haben uns endgültig für dieses Modell entschieden.", exampleTrans: "我們最終決定選擇這個型號。" },
  { id: 26, verb: "sich entschuldigen", verbTrans: "道歉 (原因)", prep: "für", case: "A", forms: "entschuldigte / hat entschuldigt", example: "Ich entschuldige mich vielmals für die Unannehmlichkeiten.", exampleTrans: "我為造成的不便深感抱歉。" },
  { id: 27, verb: "sich erinnern", verbTrans: "回憶/記得", prep: "an", case: "A", forms: "erinnerte / hat erinnert", example: "Erinnerst du dich noch an unseren letzten Urlaub in Spanien?", exampleTrans: "你還記得我們上次在西班牙的假期嗎？" },
  { id: 28, verb: "fragen", verbTrans: "詢問", prep: "nach", case: "D", forms: "fragte / hat gefragt", example: "Eine Dame hat nach dir gefragt.", exampleTrans: "剛才有一位女士在找你（詢問你的下落）。" },
  { id: 29, verb: "gehören", verbTrans: "屬於 (群體/類別)", prep: "zu", case: "D", forms: "gehörte / hat gehört", example: "Dieses Thema gehört zu den wichtigsten im Kurs.", exampleTrans: "這個主題是這門課程中最重要的之一。" },
  { id: 30, verb: "sich gewöhnen", verbTrans: "習慣於", prep: "an", case: "A", forms: "gewöhnte / hat gewöhnt", example: "Ich muss mich erst noch an die neuen Arbeitszeiten gewöhnen.", exampleTrans: "我還得適應新的工作時間。" },
  { id: 31, verb: "glauben", verbTrans: "相信", prep: "an", case: "A", forms: "glaubte / hat geglaubt", example: "Glaub an dich selbst, dann schaffst du das!", exampleTrans: "相信你自己，你一定做得到的！" },
  { id: 32, verb: "gratulieren", verbTrans: "祝賀", prep: "zu", case: "D", forms: "gratulierte / hat gratuliert", example: "Wir gratulieren dir herzlich zur bestandenen Prüfung.", exampleTrans: "我們衷心祝賀你通過考試。" },
  { id: 33, verb: "hoffen", verbTrans: "希望", prep: "auf", case: "A", forms: "hoffte / hat gehofft", example: "Wir hoffen auf ein Wunder.", exampleTrans: "我們期盼著奇蹟出現。" },
  { id: 34, verb: "sich konzentrieren", verbTrans: "專注", prep: "auf", case: "A", forms: "konzentrierte / hat konzentriert", example: "Ich muss mich jetzt voll auf mein Studium konzentrieren.", exampleTrans: "我現在必須全神貫注在學業上。" },
  { id: 35, verb: "lachen", verbTrans: "嘲笑/因...而笑", prep: "über", case: "A", forms: "lachte / hat gelacht", example: "Wir haben gestern so viel über den Film gelacht.", exampleTrans: "我們昨天看那部電影笑得好開心。" },
  { id: 36, verb: "leiden", verbTrans: "受...之苦 (病痛)", prep: "an", case: "D", forms: "litt / hat gelitten", example: "Mein Großvater leidet an Diabetes.", exampleTrans: "我爺爺患有糖尿病。" },
  { id: 37, verb: "leiden", verbTrans: "忍受 (環境/情境)", prep: "unter", case: "D", forms: "litt / hat gelitten", example: "Viele Arbeitnehmer leiden unter Stress am Arbeitsplatz.", exampleTrans: "許多上班族深受職場壓力之苦。" },
  { id: 38, verb: "nachdenken", verbTrans: "深思/考慮", prep: "über", case: "A", forms: "dachte nach / hat nachgedacht", example: "Hast du mal darüber nachgedacht, den Job zu wechseln?", exampleTrans: "你有沒有考慮過換工作？" },
  { id: 39, verb: "passen", verbTrans: "適合/搭配", prep: "zu", case: "D", forms: "passte / hat gepasst", example: "Dieser Wein passt hervorragend zu Fleischgerichten.", exampleTrans: "這款酒搭配肉類料理非常合適。" },
  { id: 40, verb: "protestieren", verbTrans: "抗議", prep: "gegen", case: "A", forms: "protestierte / hat protestiert", example: "Tausende Menschen protestieren gegen den Klimawandel.", exampleTrans: "數千名群眾為抗議氣候變遷而上街。" },
  { id: 41, verb: "riechen", verbTrans: "聞起來像", prep: "nach", case: "D", forms: "roch / hat gerochen", example: "Hier riecht es wunderbar nach frischem Brot.", exampleTrans: "這裡聞起來有剛出爐的麵包香。" },
  { id: 42, verb: "schmecken", verbTrans: "有...的味道", prep: "nach", case: "D", forms: "schmeckte / hat geschmeckt", example: "Das Eis schmeckt total nach künstlicher Erdbeere.", exampleTrans: "這冰淇淋吃起來完全是化學草莓的味道。" },
  { id: 43, verb: "sorgen", verbTrans: "帶來/提供/確保", prep: "für", case: "A", forms: "sorgte / hat gesorgt", example: "Die gute Musik sorgt für eine tolle Stimmung auf der Party.", exampleTrans: "好音樂為派對帶來了極佳的氣氛。" },
  { id: 44, verb: "sich sorgen", verbTrans: "擔憂", prep: "um", case: "A", forms: "sorgte / hat gesorgt", example: "Mach dir keine Sorgen um mich, mir geht es gut.", exampleTrans: "別為我擔心，我很好。" },
  { id: 45, verb: "sterben", verbTrans: "死於", prep: "an", case: "D", forms: "starb / ist gestorben", example: "Er ist an den Folgen eines Verkehrsunfalls gestorben.", exampleTrans: "他死於車禍造成的後遺症。" },
  { id: 46, verb: "streiten", verbTrans: "爭吵", prep: "mit", case: "D", forms: "stritt / hat gestritten", example: "Sie streitet sich ständig mit ihren Geschwistern.", exampleTrans: "她經常跟她的兄弟姊妹吵架。" },
  { id: 47, verb: "sich unterhalten", verbTrans: "聊天", prep: "über", case: "A", forms: "unterhielt / hat unterhalten", example: "Wir haben uns stundenlang über Gott und die Welt unterhalten.", exampleTrans: "我們天南地北地聊了好幾個小時。" },
  { id: 48, verb: "sich verlassen", verbTrans: "依賴/信賴", prep: "auf", case: "A", forms: "verließ / hat verlassen", example: "Auf meine besten Freunde kann ich mich zu 100% verlassen.", exampleTrans: "我可以百分之百信賴我最好的朋友。" },
  { id: 49, verb: "sich verlieben", verbTrans: "愛上", prep: "in", case: "A", forms: "verliebte / hat verliebt", example: "Er hat sich auf den ersten Blick in sie verliebt.", exampleTrans: "他對她一見鍾情。" },
  { id: 50, verb: "verzichten", verbTrans: "放棄", prep: "auf", case: "A", forms: "verzichtete / hat verzichtet", example: "Ich versuche, komplett auf Zucker zu verzichten.", exampleTrans: "我正試著完全戒掉糖分。" },
];

/**
 * ------------------------------------------------------------------
 * 2. HOOKS: Speech & Cloud Storage
 * ------------------------------------------------------------------
 */
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

/**
 * ------------------------------------------------------------------
 * 3. COMPONENTS
 * ------------------------------------------------------------------
 */

// --- 3.1 Flashcard Component ---
const Flashcard = ({ card, speak, toggleStar, isStarred, handleSRS, nextCard, prevCard }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) { 
      if (diff > 0) nextCard(); 
      else prevCard(); 
    }
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto min-h-[420px] mb-4">
      <div 
        className="relative w-full min-h-[450px] cursor-pointer group perspective-1000 touch-pan-y"
        onClick={(e) => {
            if (e.target.closest('button')) return;
            setIsFlipped(!isFlipped)
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`absolute w-full h-full duration-500 preserve-3d transition-all ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-lg hover:shadow-xl border border-amber-100 p-6 flex flex-col items-center justify-center backface-hidden transition-shadow">
            <button 
                onClick={(e) => { e.stopPropagation(); toggleStar(card.id); }}
                className="absolute top-4 right-4 p-3 z-10"
            >
                <Star size={28} className={isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
            </button>
            <div className="text-amber-400 mb-6 opacity-50 md:group-hover:opacity-100 transition-opacity">
              <RotateCw size={28} />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3 text-center tracking-tight leading-tight">{card.verb}</h2>
            <p className="text-xl md:text-2xl text-amber-700 font-medium mb-8">{card.verbTrans}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); speak(card.verb); }}
              className="p-5 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95 transition-all mb-4 shadow-sm"
            >
              <Volume2 size={28} />
            </button>
            <span className="text-xs text-gray-400 font-medium mt-auto bg-gray-50 px-4 py-2 rounded-full hidden md:block">
              點擊卡片 或按 空白鍵 (Space) 翻轉
            </span>
            <span className="text-xs text-gray-400 font-medium mt-auto bg-gray-50 px-4 py-2 rounded-full md:hidden">
              點擊卡片翻面 • 左右滑動切換
            </span>
          </div>

          <div className="absolute w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-lg border border-amber-200 p-5 flex flex-col items-center justify-between [transform:rotateY(180deg)] backface-hidden">
            <div className="w-full text-center flex-1 overflow-y-auto hide-scrollbar pb-2">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2 mt-2">
                 <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{card.verb}</h2>
                 <span className="text-2xl md:text-3xl font-extrabold text-amber-600">+ {card.prep}</span>
              </div>
              <div className="inline-block px-4 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold mb-4 shadow-sm">
                + {card.case === 'A' ? 'Akkusativ' : 'Dativ'}
              </div>
              <div className="w-full bg-white/80 backdrop-blur p-3 rounded-2xl shadow-sm border border-amber-100/50 mb-3 text-left">
                <p className="text-amber-600/80 uppercase text-[10px] font-bold tracking-wider mb-1">Perfekt Form</p>
                <p className="text-gray-800 font-medium text-sm md:text-base">{card.forms}</p>
              </div>
              <div className="w-full bg-white/80 backdrop-blur p-3 rounded-2xl shadow-sm border border-amber-100/50 text-left relative">
                <div className="flex justify-between items-start mb-1 gap-2">
                   <p className="text-gray-800 text-sm md:text-base leading-snug font-medium">{card.example}</p>
                   <button 
                    onClick={(e) => { e.stopPropagation(); speak(card.example); }}
                    className="p-2 rounded-xl text-amber-500 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-colors shrink-0"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <p className="text-gray-500 text-xs md:text-sm">{card.exampleTrans}</p>
              </div>
            </div>
            
            <div className="w-full pt-3 mt-1 border-t border-amber-200/50">
              <p className="text-[10px] text-center text-amber-700 font-bold mb-2 tracking-widest uppercase">記憶程度評估</p>
              <div className="flex gap-2 w-full justify-center">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'hard'); nextCard(); }}
                    className="flex-1 py-3 bg-red-100 text-red-700 font-bold rounded-xl text-sm active:scale-95 transition-transform"
                >
                    困難 (1天)
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'good'); nextCard(); }}
                    className="flex-1 py-3 bg-amber-200 text-amber-800 font-bold rounded-xl text-sm active:scale-95 transition-transform"
                >
                    普通 (3天)
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'easy'); nextCard(); }}
                    className="flex-1 py-3 bg-green-100 text-green-700 font-bold rounded-xl text-sm active:scale-95 transition-transform"
                >
                    簡單 (7天)
                </button>
              </div>
            </div>
          </div>

        </div>
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
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-lg border border-amber-100 p-5 md:p-6">
      
      {onlyStarred && quizPool.length < data.length && (
          <div className="mb-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 font-bold">
              <Star size={16} className="fill-amber-500 text-amber-500"/>
              目前為「專屬單字本」測驗模式 ({quizPool.length} 個單字)
          </div>
      )}

      <div className="flex justify-between items-center mb-6 bg-amber-50 p-4 rounded-2xl">
        <div className="flex items-center gap-2 text-amber-700">
          <Trophy size={22} />
          <span className="font-extrabold text-lg">{score} Pts</span>
        </div>
        <div className="flex items-center gap-2 text-orange-600">
          <span className="text-sm font-bold">連勝: {streak}</span>
          <div className="flex gap-1">
            {[...Array(Math.min(streak, 5))].map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {['word', 'sentence', 'case'].map(m => (
            <button 
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-1 ${mode === m ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                {m === 'word' ? '單字模式' : (m === 'sentence' ? '例句填空' : '格位判斷')}
            </button>
        ))}
      </div>

      <div className="text-center mb-8 min-h-[140px] flex flex-col items-center justify-center px-2">
        {mode === 'word' && (
          <>
            <h2 className="text-4xl font-extrabold text-gray-800 mb-2">{question.verb}</h2>
            <p className="text-lg text-amber-700 font-medium">{question.verbTrans}</p>
            {showHint && <p className="mt-4 text-sm text-gray-500 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">提示：{question.example.replace(new RegExp(`\\b${question.prep}\\b`, 'i'), '___')}</p>}
          </>
        )}
        {mode === 'sentence' && (
          <>
            <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
              {question.example.split(new RegExp(`\\b${question.prep}\\b`, 'i')).map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="inline-block w-16 border-b-4 border-amber-400 mx-2 mb-1"></span>}
                </React.Fragment>
              ))}
            </p>
            <p className="text-base text-amber-700 font-medium mt-4 bg-amber-50 px-4 py-1.5 rounded-full inline-block">{question.verb} ({question.verbTrans})</p>
          </>
        )}
        {mode === 'case' && (
          <>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-3">
              {question.verb} <span className="text-amber-600">+ {question.prep}</span>
            </h2>
            <p className="text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-full">後面應該接什麼格位？</p>
          </>
        )}

        {mode === 'word' && !showHint && !answered && (
          <button 
            onClick={() => setShowHint(true)}
            className="mt-6 text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full hover:bg-amber-100"
          >
            💡 顯示提示例句
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map((opt, idx) => {
          let btnClass = "py-5 rounded-2xl border-2 font-bold text-lg transition-all duration-200 active:scale-95 shadow-sm ";
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
        <div className={`p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 mt-6 ${isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            {isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
            <span className="font-extrabold text-lg">
              {isCorrect ? '答對了！非常棒！' : `正確答案: ${mode === 'case' ? (question.case === 'A' ? 'Akkusativ' : 'Dativ') : question.prep}`}
            </span>
          </div>
          <button 
            onClick={generateQuestion}
            className="w-full md:w-auto px-6 py-3 bg-white rounded-xl shadow font-extrabold text-sm border hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 active:scale-95"
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
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 sticky top-20 z-10 flex flex-col gap-3">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
            type="text"
            placeholder="搜尋動詞、意思或介系詞..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold text-gray-500">共 {filteredData.length} 個單字</span>
            <button 
                onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${showOnlyStarred ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
            >
                <Star size={16} className={showOnlyStarred ? "fill-amber-500 text-amber-500" : ""} />
                僅顯示收藏
            </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredData.map(item => {
          const isStarred = userData.starred.includes(item.id);
          const srsData = userData.srs[item.id];
          const nextReview = srsData?.nextReview ? new Date(srsData.nextReview).toLocaleDateString() : '尚未複習';

          return (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1 flex items-start gap-3">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }}
                    className="mt-1 flex-shrink-0"
                >
                    <Star size={22} className={isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                </button>
                <div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="font-extrabold text-lg text-gray-800">{item.verb}</span>
                        <span className="text-amber-600 font-extrabold">+ {item.prep}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold border border-gray-200">+{item.case}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{item.verbTrans}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); speak(item.verb); }}
                  className="p-3 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors hidden md:block"
                >
                  <Volume2 size={20} />
                </button>
                <div className="p-2 text-gray-300">
                  {expandedId === item.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>
            </div>

            {expandedId === item.id && (
              <div className="px-5 pb-5 bg-gradient-to-b from-transparent to-amber-50/30">
                <div className="pt-3 border-t border-gray-100 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                     <div><span className="font-bold text-gray-500">三態: </span><span className="text-gray-800 font-medium">{item.forms}</span></div>
                     <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold flex items-center gap-1"><Calendar size={12}/> 複習: {nextReview}</div>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                     <p className="text-gray-800 mb-1 font-medium">{item.example}</p>
                     <p className="text-gray-500 text-sm mb-3">{item.exampleTrans}</p>
                     <button 
                        onClick={() => speak(item.example)}
                        className="text-sm flex items-center gap-1.5 text-amber-700 font-bold bg-amber-100/50 px-3 py-1.5 rounded-lg w-fit hover:bg-amber-100"
                      >
                        <Volume2 size={16} /> 朗讀例句
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        )})}
        {filteredData.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-400 font-bold text-lg mb-2">空空如也</p>
            <p className="text-sm text-gray-400">沒有找到符合條件的動詞</p>
          </div>
        )}
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
    <div className="w-full max-w-lg mx-auto space-y-6 pb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-lg text-white">
        <div className="flex items-center gap-3 mb-2">
            {user ? <Cloud size={28} className="text-blue-200" /> : <CloudOff size={28} className="text-blue-200" />}
            <h2 className="text-2xl font-extrabold">雲端同步狀態</h2>
        </div>
        <p className="text-blue-100 text-sm font-medium mb-4">
            {user ? `已連線 (ID: ${user.uid.slice(0,6)}...)` : '目前為本地模式 (未偵測到 Firebase)'}
        </p>
        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 flex justify-between items-center">
            <div className="text-center">
                <div className="text-2xl font-black">{userData.starred.length}</div>
                <div className="text-xs text-blue-100 font-bold">收藏單字</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-black">{Object.keys(userData.srs).length}</div>
                <div className="text-xs text-blue-100 font-bold">已複習卡片</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-black">{userData.history.length}</div>
                <div className="text-xs text-blue-100 font-bold">測驗紀錄</div>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-800 mb-5 flex items-center gap-2">
          <Settings size={22} className="text-amber-500" /> 語音設定
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">選擇語音 (德語)</label>
            <div className="relative">
                <select 
                value={selectedVoiceURI || ''}
                onChange={(e) => {
                    setSelectedVoiceURI(e.target.value);
                    speak("Hallo, wie geht es dir?");
                }}
                className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none font-medium appearance-none"
                >
                {voices.length === 0 && <option>系統載入語音中...</option>}
                {voices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                    </option>
                ))}
                </select>
                <ChevronDown className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700">語速</label>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{rate}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" max="1.5" step="0.1" 
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
          
          <button 
            onClick={() => speak("Das ist ein Test für die Aussprache.")}
            className="w-full py-3.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 active:scale-95 transition-all font-bold flex justify-center items-center gap-2"
          >
            <Volume2 size={18} /> 測試發音
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
          <History size={22} className="text-amber-500" /> 近期測驗紀錄
        </h2>
        <div className="space-y-3">
          {userData.history.length === 0 ? (
            <p className="text-gray-400 text-center py-6 font-medium">尚無測驗紀錄，快去測驗看看吧！</p>
          ) : (
            userData.history.slice().reverse().slice(0, 5).map((record, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                   <div className="font-extrabold text-gray-800 mb-1">{record.verb}</div>
                   <div className="text-xs text-gray-500 font-medium">{formatDate(record.date)} • {record.mode === 'case' ? '格位' : (record.mode === 'sentence' ? '填空' : '單字')}</div>
                </div>
                <div className={`font-black text-lg ${record.correct ? 'text-green-500' : 'text-red-400'}`}>
                  {record.correct ? '+10' : '0'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


/**
 * ------------------------------------------------------------------
 * 4. MAIN APP COMPONENT (Integrating Firebase & State)
 * ------------------------------------------------------------------
 */
// 修正 2：為了讓 Astro 能匯入，必須叫做 VerbWithPreposition
export default function VerbWithPreposition() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const speechData = useSpeech();
  const [onlyStarredFlashcards, setOnlyStarredFlashcards] = useState(false);
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
      starred: [], 
      srs: {},     
      history: []  
  });

  useEffect(() => {
    const initAuth = async () => {
      // 若有 Firebase 才執行
      if (!hasFirebase || !auth) return;
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    if (hasFirebase && auth) {
      const unsubscribe = onAuthStateChanged(auth, setUser);
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    // 若有 Firebase 才執行資料庫同步
    if (!hasFirebase || !user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'main');
    
    const unsubscribe = onSnapshot(docRef, (document) => {
        if (document.exists()) {
            const data = document.data();
            setUserData({
                starred: data.starred || [],
                srs: data.srs || {},
                history: data.history || []
            });
        } else {
            setDoc(docRef, userData, { merge: true });
        }
    }, (error) => {
        console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const updateCloudData = async (newData) => {
      const updated = { ...userData, ...newData };
      setUserData(updated); 
      // 若有 Firebase 才上傳雲端
      if (hasFirebase && user && db) {
          try {
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userData', 'main');
            await setDoc(docRef, updated, { merge: true });
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
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans selection:bg-amber-200">
      
      <header className="bg-amber-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <GraduationCap size={28} />
            <h1 className="text-xl font-extrabold tracking-tight">Verben Trainer</h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? <Cloud size={18} className="text-amber-200" title="已連線同步" /> : <CloudOff size={18} className="text-amber-200 opacity-50" title="本地模式" />}
            <div className="text-xs bg-amber-800/50 px-3 py-1.5 rounded-full font-bold">
                {verbData.length} Verben
            </div>
          </div>
        </div>
      </header>

      {/* 修正 3：在 main 加入 pb-32 防止底部選單遮擋內容 */}
      <main className="max-w-4xl mx-auto p-3 md:p-6 min-h-[calc(100vh-140px)] pb-32">
        
        {activeTab === 'flashcards' && currentCard && (
          <div className="flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center mb-6 max-w-md px-2">
              <button onClick={prevCard} className="p-3.5 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-amber-50 active:scale-95 text-amber-600 transition-all"><ChevronDown className="rotate-90" /></button>
              
              <div className="flex flex-col items-center">
                  <span className="text-gray-500 font-black font-mono bg-white px-5 py-2 rounded-full shadow-sm border border-gray-100 text-lg">
                      {flashcardIndex + 1} / {deck.length}
                  </span>
                  {userData.starred.length > 0 && (
                      <button 
                          onClick={() => setOnlyStarredFlashcards(!onlyStarredFlashcards)}
                          className="text-[10px] mt-2 font-bold flex items-center gap-1 text-gray-400 hover:text-amber-500"
                      >
                          <Star size={12} className={onlyStarredFlashcards ? "fill-amber-400 text-amber-400" : ""} /> 
                          {onlyStarredFlashcards ? '顯示全部' : '僅顯示收藏'}
                      </button>
                  )}
              </div>

              <button onClick={nextCard} className="p-3.5 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-amber-50 active:scale-95 text-amber-600 transition-all"><ChevronDown className="-rotate-90" /></button>
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
          <Quiz 
            data={verbData} 
            speak={speechData.speak} 
            addHistory={addHistory} 
            userData={userData}
            onlyStarred={onlyStarredFlashcards} 
          />
        )}

        {activeTab === 'list' && (
          <VerbList 
            data={verbData} 
            speak={speechData.speak} 
            userData={userData}
            toggleStar={toggleStar}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            voiceData={speechData} 
            userData={userData}
            user={user}
          />
        )}

      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden z-50 pb-safe">
        <div className="flex justify-around items-center h-[72px]">
          {['flashcards', 'quiz', 'list', 'settings'].map((tab) => {
              const icons = {
                  'flashcards': RotateCw, 'quiz': Brain, 'list': List, 'settings': Settings
              };
              const labels = {
                  'flashcards': '字卡', 'quiz': '測驗', 'list': '列表', 'settings': '設定'
              };
              const Icon = icons[tab];
              const isActive = activeTab === tab;
              
              return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-amber-600' : 'text-gray-400'}`}>
                      <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-amber-100' : ''}`}>
                          <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={`text-[10px] ${isActive ? 'font-extrabold' : 'font-medium'}`}>{labels[tab]}</span>
                  </button>
              )
          })}
        </div>
      </nav>

      <div className="hidden md:flex fixed left-0 top-0 h-full w-24 flex-col items-center bg-white border-r border-gray-100 pt-24 shadow-sm z-40">
          {['flashcards', 'quiz', 'list', 'settings'].map((tab) => {
              const icons = {
                  'flashcards': RotateCw, 'quiz': Brain, 'list': List, 'settings': Settings
              };
              const Icon = icons[tab];
              const isActive = activeTab === tab;
              
              return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`p-4 mb-3 rounded-2xl transition-all relative group ${isActive ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                      <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                  </button>
              )
          })}
      </div>
      
      <style>{`
          .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
          .perspective-1000 { perspective: 1000px; }
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}