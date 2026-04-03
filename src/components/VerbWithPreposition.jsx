import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  BookOpen, Brain, GraduationCap, Settings, List, Volume2, RotateCw, 
  CheckCircle, XCircle, Trophy, History, Search, ChevronDown, ChevronUp, 
  Play, Star, Cloud, CloudOff, Calendar
} from 'lucide-react';

/**
 * ------------------------------------------------------------------
 * 1. DATA: 德語動詞資料庫 (50 個常用動詞)
 * ------------------------------------------------------------------
 */
const verbData = [
  { id: 1, verb: "warten", verbTrans: "等待", prep: "auf", case: "A", forms: "wartete / hat gewartet", example: "Ich warte schon eine Ewigkeit auf dich.", exampleTrans: "我已經等你等了大半天了。" },
  { id: 2, verb: "denken", verbTrans: "想/思考", prep: "an", case: "A", forms: "dachte / hat gedacht", example: "Er denkt oft an seine Kindheit in Berlin zurück.", exampleTrans: "他經常回想起他在柏林的童年。" },
  { id: 3, verb: "sich interessieren", verbTrans: "感興趣", prep: "für", case: "A", forms: "interessierte / hat interessiert", example: "Sie interessiert sich sehr für moderne Kunst und Design.", exampleTrans: "她對現代藝術與設計非常感興趣。" },
  { id: 4, verb: "träumen", verbTrans: "夢想", prep: "von", case: "D", forms: "träumte / hat get備註unt", example: "Ich träume von einem eigenen Haus am Meer.", exampleTrans: "我夢想著能擁有一棟海邊的房子。" },
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
  { id: 19, verb: "sich beschweren", verbTrans: "抱怨 (對象)", prep: "bei", case: "D", forms: "beschwerte / hat beschwert", example: "Der Guest beschwerte sich beim Hotelmanager.", exampleTrans: "客人在向飯店經理抱怨。" },
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
  { id: 35, verb: "lachen", verbTrans: "嘲笑/因...而笑", prep: "über", case: "A", forms: "lachte / hat gelacht", example: "Wir have gestern so viel über den Film gelacht.", exampleTrans: "我們昨天看那部電影笑得好開心。" },
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
  { id: 46, verb: "streiten", verbTrans: "爭吵", prep: "mit", case: "D", forms: "stritt / hat getritten", example: "Sie streitet sich ständig mit ihren Geschwistern.", exampleTrans: "她經常跟她的兄弟姊妹吵架。" },
  { id: 47, verb: "sich unterhalten", verbTrans: "聊天", prep: "über", case: "A", forms: "unterhielt / hat unterhalten", example: "Wir have uns stundenlang über Gott und die Welt unterhalten.", exampleTrans: "我們天南地北地聊了好幾個小時。" },
  { id: 48, verb: "sich verlassen", verbTrans: "依賴/信賴", prep: "auf", case: "A", forms: "verließ / hat verlassen", example: "Auf meine besten Freunde kann ich mich zu 100% verlassen.", exampleTrans: "我可以百分之百信賴我最好的朋友。" },
  { id: 49, verb: "sich verlieben", verbTrans: "愛上", prep: "in", case: "A", forms: "verliebte / hat verliebt", example: "Er hat sich auf den ersten Blick in sie verliebt.", exampleTrans: "他對她一見鍾情。" },
  { id: 50, verb: "verzichten", verbTrans: "放棄", prep: "auf", case: "A", forms: "verzichtete / hat verzichtet", example: "Ich versuche, komplett auf Zucker zu verzichten.", exampleTrans: "我正試著完全戒掉糖分。" },
];

/**
 * ------------------------------------------------------------------
 * 2. HOOKS: Speech
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
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = fetchVoices;
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

const Flashcard = ({ card, speak, toggleStar, isStarred, handleSRS, nextCard, prevCard }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => setIsFlipped(false), [card]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto min-h-[420px] mb-4">
      <div className="relative w-full h-[400px] cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`absolute w-full h-full duration-500 preserve-3d transition-all ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border border-amber-100 p-8 flex flex-col items-center justify-center backface-hidden">
            <button onClick={(e) => { e.stopPropagation(); toggleStar(card.id); }} className="absolute top-6 right-6">
                <Star size={32} className={isStarred ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
            </button>
            <div className="text-amber-500 mb-4"><RotateCw size={32} /></div>
            <h2 className="text-5xl font-black text-gray-800 mb-2">{card.verb}</h2>
            <p className="text-2xl text-amber-600 font-bold mb-8">{card.verbTrans}</p>
            <button onClick={(e) => { e.stopPropagation(); speak(card.verb); }} className="p-5 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100"><Volume2 size={32} /></button>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-xl p-6 flex flex-col items-center justify-between [transform:rotateY(180deg)] backface-hidden border-2 border-amber-200">
             <div className="w-full text-center">
                <div className="flex justify-center gap-2 mb-4">
                    <h2 className="text-3xl font-black">{card.verb}</h2>
                    <span className="text-3xl font-black text-amber-600">+ {card.prep}</span>
                </div>
                <div className="inline-block px-6 py-2 rounded-full bg-amber-200 text-amber-900 font-black mb-6">+{card.case === 'A' ? 'Akkusativ' : 'Dativ'}</div>
                <div className="bg-white/60 p-4 rounded-2xl mb-4 text-left">
                    <p className="text-gray-800 font-bold mb-2 leading-relaxed text-lg">{card.example}</p>
                    <p className="text-gray-500 font-medium">{card.exampleTrans}</p>
                </div>
             </div>
             <div className="flex gap-2 w-full">
                <button onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'hard'); nextCard(); }} className="flex-1 py-4 bg-red-100 text-red-700 font-black rounded-2xl">困難</button>
                <button onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'good'); nextCard(); }} className="flex-1 py-4 bg-amber-200 text-amber-800 font-black rounded-2xl">普通</button>
                <button onClick={(e) => { e.stopPropagation(); handleSRS(card.id, 'easy'); nextCard(); }} className="flex-1 py-4 bg-green-100 text-green-700 font-black rounded-2xl">簡單</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Quiz = ({ data, speak, addHistory, userData }) => {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const generateQuestion = useCallback(() => {
    const q = data[Math.floor(Math.random() * data.length)];
    setQuestion(q);
    setAnswered(false);
    const correct = q.prep;
    const others = [...new Set(data.map(d => d.prep))].filter(p => p !== correct).sort(() => 0.5 - Math.random()).slice(0, 3);
    setOptions([correct, ...others].sort(() => 0.5 - Math.random()));
  }, [data]);

  useEffect(() => generateQuestion(), [generateQuestion]);

  const handleAnswer = (opt) => {
    if (answered) return;
    const correct = opt === question.prep;
    setAnswered(true);
    setIsCorrect(correct);
    if (correct) speak("Richtig!");
    addHistory({ verb: question.verb, correct, date: new Date().toISOString() });
  };

  if (!question) return null;

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-amber-100 max-w-md mx-auto text-center">
      <div className="bg-amber-50 py-4 rounded-3xl mb-8"><h2 className="text-4xl font-black text-gray-800">{question.verb}</h2></div>
      <p className="text-gray-500 font-bold mb-8 italic">請選擇正確的介系詞：</p>
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <button key={i} disabled={answered} onClick={() => handleAnswer(opt)} className={`py-6 rounded-3xl border-4 font-black text-xl transition-all ${answered ? (opt === question.prep ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-300') : 'bg-white border-gray-100 hover:border-amber-400 hover:text-amber-600'}`}>{opt}</button>
        ))}
      </div>
      {answered && <button onClick={generateQuestion} className="w-full mt-10 py-5 bg-amber-600 text-white rounded-[30px] font-black shadow-lg shadow-amber-200 active:scale-95 transition-transform">下一題 ➔</button>}
    </div>
  );
};

const SettingsView = ({ voiceData }) => {
    const { voices, selectedVoiceURI, setSelectedVoiceURI, rate, setRate, speak } = voiceData;
    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] shadow-xl space-y-8">
            <h2 className="text-2xl font-black flex items-center gap-2"><Settings className="text-amber-500"/> 設定</h2>
            <div>
                <label className="block font-black text-gray-600 mb-2">語音選擇</label>
                <select value={selectedVoiceURI || ''} onChange={(e) => setSelectedVoiceURI(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold">
                    {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block font-black text-gray-600 mb-2">語速: {rate}x</label>
                <input type="range" min="0.5" max="1.5" step="0.1" value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <button onClick={() => speak("Das ist ein Test.")} className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl font-black">測試聲音</button>
        </div>
    );
}

/**
 * ------------------------------------------------------------------
 * 4. MAIN COMPONENT (Stability Version)
 * ------------------------------------------------------------------
 */
export default function VerbWithPreposition() {
  const [activeTab, setActiveTab] = useState('flashcards');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const speechData = useSpeech();
  const [userData, setUserData] = useState({ starred: [], srs: {}, history: [] });

  const toggleStar = (id) => setUserData(prev => ({ ...prev, starred: prev.starred.includes(id) ? prev.starred.filter(i => i !== id) : [...prev.starred, id] }));
  const handleSRS = (id, rating) => setUserData(prev => ({ ...prev, srs: { ...prev.srs, [id]: { rating, date: Date.now() } } }));
  const addHistory = (record) => setUserData(prev => ({ ...prev, history: [...prev.history, record] }));

  const currentCard = verbData[flashcardIndex] || verbData[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-amber-200 pb-32">
      <header className="bg-amber-600 text-white p-6 shadow-lg mb-8 rounded-b-[40px]">
        <div className="max-w-md mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><GraduationCap/> Verben Trainer</h1>
            <div className="bg-amber-700/30 px-4 py-1 rounded-full text-xs font-black">50動詞</div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4">
        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
                <button onClick={() => setFlashcardIndex(i => (i - 1 + verbData.length) % verbData.length)} className="p-4 bg-white rounded-full shadow-md text-amber-600"><ChevronUp className="-rotate-90"/></button>
                <span className="font-black text-gray-400 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">{flashcardIndex + 1} / {verbData.length}</span>
                <button onClick={() => setFlashcardIndex(i => (i + 1) % verbData.length)} className="p-4 bg-white rounded-full shadow-md text-amber-600"><ChevronDown className="-rotate-90"/></button>
            </div>
            <Flashcard card={currentCard} speak={speechData.speak} isStarred={userData.starred.includes(currentCard.id)} toggleStar={toggleStar} handleSRS={handleSRS} nextCard={() => setFlashcardIndex(i => (i + 1) % verbData.length)} prevCard={() => setFlashcardIndex(i => (i - 1 + verbData.length) % verbData.length)} />
          </div>
        )}
        {activeTab === 'quiz' && <Quiz data={verbData} speak={speechData.speak} addHistory={addHistory} userData={userData} />}
        {activeTab === 'settings' && <SettingsView voiceData={speechData} />}
      </main>

      {/* 底部導覽列 */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[35px] z-50 p-3">
        <div className="flex justify-around items-center">
          {[
            { id: 'flashcards', icon: RotateCw, label: '字卡' },
            { id: 'quiz', icon: Brain, label: '測驗' },
            { id: 'settings', icon: Settings, label: '設定' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${isActive ? 'text-amber-600' : 'text-gray-400'}`}>
                <div className={`p-2 rounded-2xl ${isActive ? 'bg-amber-100' : ''}`}><Icon size={24} strokeWidth={isActive ? 3 : 2} /></div>
                <span className="text-[10px] font-black">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <style>{`
          .perspective-1000 { perspective: 1000px; }
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}