// wo(r)- / da(r)- practice for lesson 2. entryId points at verb-prepositions.ts; the answer is
// derived from that entry's preposition and case (src/lib/woDa.mjs), so only the sentence is stored.
// kind: "wo" asks about a thing, "da" refers back to a thing, "person" asks about a person.

export interface WoDaItem {
  id: number;
  entryId: number;
  kind: 'wo' | 'da' | 'person';
  sentence: string;
  trans: string;
}

export const woDaPractice: WoDaItem[] = [
  // wo(r)-: asking about a thing
  { id: 1, entryId: 1, kind: 'wo', sentence: '___ wartest du? – Auf den Bus.', trans: '你在等什麼？——等公車。' },
  { id: 2, entryId: 3, kind: 'wo', sentence: '___ interessierst du dich? – Für Musik.', trans: '你對什麼有興趣？——音樂。' },
  { id: 3, entryId: 4, kind: 'wo', sentence: '___ träumst du? – Von einer Reise nach Japan.', trans: '你夢想著什麼？——去日本旅行。' },
  { id: 4, entryId: 6, kind: 'wo', sentence: '___ habt ihr gesprochen? – Über den Urlaub.', trans: '你們聊了什麼？——聊假期。' },
  { id: 5, entryId: 13, kind: 'wo', sentence: '___ fangen wir an? – Mit der Grammatik.', trans: '我們從什麼開始？——從文法開始。' },
  { id: 6, entryId: 14, kind: 'wo', sentence: '___ ärgerst du dich? – Über den Lärm.', trans: '你在氣什麼？——氣那些噪音。' },
  { id: 7, entryId: 27, kind: 'wo', sentence: '___ erinnerst du dich noch? – An unseren ersten Urlaub.', trans: '你還記得什麼？——我們第一次的假期。' },
  { id: 8, entryId: 28, kind: 'wo', sentence: '___ hat er gefragt? – Nach dem Preis.', trans: '他問了什麼？——問價格。' },
  { id: 9, entryId: 40, kind: 'wo', sentence: '___ protestieren die Leute? – Gegen die neuen Steuern.', trans: '大家在抗議什麼？——抗議新的稅。' },
  { id: 10, entryId: 51, kind: 'wo', sentence: '___ hast du Angst? – Vor Gewittern.', trans: '你怕什麼？——怕雷雨。' },
  { id: 11, entryId: 55, kind: 'wo', sentence: '___ besteht der Kuchen? – Aus Mehl, Eiern und Zucker.', trans: '這個蛋糕是用什麼做的？——麵粉、雞蛋和糖。' },
  { id: 12, entryId: 37, kind: 'wo', sentence: '___ leidet sie? – Unter dem Stress bei der Arbeit.', trans: '她為什麼所苦？——工作壓力。' },
  { id: 13, entryId: 83, kind: 'wo', sentence: '___ geht es in dem Buch? – Um eine Familie in Berlin.', trans: '這本書在講什麼？——柏林的一個家庭。' },
  { id: 14, entryId: 104, kind: 'wo', sentence: '___ hast du Lust? – Auf eine Pizza.', trans: '你想吃什麼？——披薩。' },
  { id: 15, entryId: 24, kind: 'wo', sentence: '___ hat sie dich eingeladen? – Zu ihrer Geburtstagsparty.', trans: '她邀請你參加什麼？——她的生日派對。' },
  { id: 16, entryId: 71, kind: 'wo', sentence: '___ arbeitest du gerade? – An meiner Masterarbeit.', trans: '你現在在做什麼？——我的碩士論文。' },
  { id: 17, entryId: 80, kind: 'wo', sentence: '___ hast du nicht gerechnet? – Mit so viel Regen.', trans: '你沒料到什麼？——會下這麼多雨。' },
  { id: 18, entryId: 10, kind: 'wo', sentence: '___ muss ich mich noch kümmern? – Um die Tickets.', trans: '我還得處理什麼？——票的事。' },

  // da(r)-: referring back to a thing (or forward to a clause)
  { id: 19, entryId: 1, kind: 'da', sentence: 'Der Bus kommt nicht. Ich warte schon seit einer Stunde ___.', trans: '公車還沒來，我已經等一個小時了。' },
  { id: 20, entryId: 8, kind: 'da', sentence: 'Nächste Woche haben wir Urlaub. Ich freue mich schon ___.', trans: '下週我們放假，我已經很期待了。' },
  { id: 21, entryId: 27, kind: 'da', sentence: 'Das war ein schöner Abend. Ich erinnere mich gern ___.', trans: '那是個美好的夜晚，我很喜歡回想起它。' },
  { id: 22, entryId: 3, kind: 'da', sentence: 'Politik? Nein, ich interessiere mich nicht ___.', trans: '政治？不，我對它沒興趣。' },
  { id: 23, entryId: 6, kind: 'da', sentence: 'Das Problem ist wichtig. Wir müssen ___ sprechen.', trans: '這個問題很重要，我們必須談一談。' },
  { id: 24, entryId: 10, kind: 'da', sentence: 'Die Rechnung? Keine Sorge, ich kümmere mich ___.', trans: '帳單？別擔心，我會處理。' },
  { id: 25, entryId: 15, kind: 'da', sentence: 'Rauchen ist ungesund. Hör endlich ___ auf!', trans: '抽菸不健康，你快戒掉吧！' },
  { id: 26, entryId: 11, kind: 'da', sentence: 'Kommst du mit? – Das hängt ___ ab, ob ich Zeit habe.', trans: '你要一起來嗎？——要看我有沒有時間。' },
  { id: 27, entryId: 4, kind: 'da', sentence: 'Ein eigenes Haus? ___ träume ich schon lange.', trans: '自己的房子？我已經夢想很久了。' },
  { id: 28, entryId: 51, kind: 'da', sentence: 'Die Prüfung ist schwer, aber ich habe keine Angst ___.', trans: '考試很難，但我不害怕。' },
  { id: 29, entryId: 25, kind: 'da', sentence: 'Das blaue Auto war billiger, deshalb haben wir uns ___ entschieden.', trans: '藍色那台車比較便宜，所以我們選了它。' },
  { id: 30, entryId: 30, kind: 'da', sentence: 'Das Wetter hier ist kalt, aber ich habe mich schon ___ gewöhnt.', trans: '這裡天氣很冷，但我已經習慣了。' },
  { id: 31, entryId: 38, kind: 'da', sentence: 'Das ist eine gute Frage. Ich muss ___ nachdenken.', trans: '這是個好問題，我得想一想。' },
  { id: 32, entryId: 102, kind: 'da', sentence: 'Morgen kommt das Ergebnis. Ich bin sehr gespannt ___.', trans: '結果明天出來，我很好奇。' },
  { id: 33, entryId: 69, kind: 'da', sentence: 'Ich habe meinen Schlüssel verloren und suche schon lange ___.', trans: '我把鑰匙弄丟了，已經找了很久。' },
  { id: 34, entryId: 40, kind: 'da', sentence: 'Die Stadt will den Park schließen. Viele Bürger protestieren ___.', trans: '市政府想關閉公園，很多市民在抗議。' },
  { id: 35, entryId: 13, kind: 'da', sentence: 'Der Kurs ist neu. Wir fangen morgen ___ an.', trans: '這門課是新的，我們明天開始上。' },

  // person: preposition + wen (Akk) / wem (Dat)
  { id: 36, entryId: 1, kind: 'person', sentence: '___ wartest du? – Auf meinen Bruder.', trans: '你在等誰？——等我哥哥。' },
  { id: 37, entryId: 7, kind: 'person', sentence: '___ hast du gerade gesprochen? – Mit meiner Chefin.', trans: '你剛剛在跟誰說話？——跟我的老闆。' },
  { id: 38, entryId: 2, kind: 'person', sentence: '___ denkst du? – An meine Mutter.', trans: '你在想誰？——想我媽媽。' },
  { id: 39, entryId: 4, kind: 'person', sentence: '___ hast du geträumt? – Von dir!', trans: '你夢到誰了？——夢到你！' },
  { id: 40, entryId: 10, kind: 'person', sentence: '___ kümmert sich die Krankenschwester? – Um die Patienten.', trans: '護理師在照顧誰？——照顧病人。' },
  { id: 41, entryId: 16, kind: 'person', sentence: '___ möchtest du dich bedanken? – Bei meinen Nachbarn.', trans: '你想向誰道謝？——向我的鄰居。' },
  { id: 42, entryId: 51, kind: 'person', sentence: '___ hast du Angst? – Vor meinem neuen Chef.', trans: '你怕誰？——怕我的新老闆。' },
  { id: 43, entryId: 49, kind: 'person', sentence: '___ hat er sich verliebt? – In seine Kollegin.', trans: '他愛上誰了？——他的同事。' },
  { id: 44, entryId: 65, kind: 'person', sentence: '___ hat sie sich getrennt? – Von ihrem Freund.', trans: '她和誰分手了？——她男朋友。' },
  { id: 45, entryId: 100, kind: 'person', sentence: '___ bist du stolz? – Auf meine Kinder.', trans: '你以誰為傲？——我的孩子們。' },
  { id: 46, entryId: 14, kind: 'person', sentence: '___ ärgerst du dich? – Über meinen Kollegen.', trans: '你在氣誰？——氣我的同事。' },
  { id: 47, entryId: 78, kind: 'person', sentence: '___ telefonierst du so lange? – Mit meiner Oma.', trans: '你跟誰講電話講這麼久？——跟我奶奶。' },
  { id: 48, entryId: 48, kind: 'person', sentence: '___ kann man sich hier verlassen? – Auf Frau Weber.', trans: '這裡可以信賴誰？——韋伯女士。' },
  { id: 49, entryId: 28, kind: 'person', sentence: '___ hat der Mann gefragt? – Nach dir.', trans: '那個男人問起誰？——問起你。' },
  { id: 50, entryId: 94, kind: 'person', sentence: '___ soll ich mich wenden? – An den Hausmeister.', trans: '我該找誰？——找管理員。' }
];
