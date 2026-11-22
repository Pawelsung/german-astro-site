// Original A2–B2 practice (49 items from 2026-11-18, 93 added 2026-11-22). options[0] is the answer; ChoiceCard shuffles options.
export type PassivStage = 'forms' | 'transform' | 'past' | 'perfect' | 'modal' | 'agent' | 'state'
  | 'clause' | 'alternatives' | 'subjunctive' | 'modal-past' | 'participle';
export interface PassivExercise {
  id: string; stage: PassivStage; level: 'A2' | 'B1' | 'B2';
  sentence?: string; fact?: string; options: string[]; trans: string; explain: string;
}
export const STAGES: { id: PassivStage; label: string; hint: string }[] = [
  {
    "id": "forms",
    "label": "現在式形式",
    "hint": "用 werden 現在式＋過去分詞，描述動作被執行"
  },
  {
    "id": "transform",
    "label": "主動改被動",
    "hint": "保持現在式，把受詞改成主詞；省略施事者"
  },
  {
    "id": "past",
    "label": "過去式",
    "hint": "本階段指定 Präteritum：wurde／wurden＋過去分詞"
  },
  {
    "id": "perfect",
    "label": "完成式",
    "hint": "本階段指定 Perfekt：sein＋過去分詞＋worden"
  },
  {
    "id": "modal",
    "label": "情態動詞",
    "hint": "情態動詞變位，句尾用過去分詞＋werden"
  },
  {
    "id": "agent",
    "label": "von／durch",
    "hint": "依提示區分執行者與造成結果的原因；注意格位"
  },
  {
    "id": "state",
    "label": "狀態與過程",
    "hint": "判斷句子描述結果狀態，還是動作的執行過程"
  },
  {
    "id": "clause",
    "label": "從句裡的被動",
    "hint": "從句中變位動詞放句尾：過去分詞＋wird／wurde，完成式為 … worden ist，情態動詞為 … werden muss"
  },
  {
    "id": "alternatives",
    "label": "被動的替代說法",
    "hint": "用 man、sich lassen＋不定式、sein＋zu＋不定式或 -bar 形容詞改寫原句，意思不變"
  },
  {
    "id": "subjunctive",
    "label": "虛擬式被動",
    "hint": "Konjunktiv II：würde＋過去分詞＋werden；過去用 wäre＋過去分詞＋worden；情態動詞用 müsste／könnte＋過去分詞＋werden，過去用 hätte＋過去分詞＋werden＋müssen"
  },
  {
    "id": "modal-past",
    "label": "情態動詞的過去被動",
    "hint": "過去式 musste＋過去分詞＋werden；完成式 hat＋過去分詞＋werden müssen；從句中 hat 放在整組動詞最前面"
  },
  {
    "id": "participle",
    "label": "分詞當形容詞",
    "hint": "名詞前的過去分詞表示已被完成，zu＋現在分詞表示必須或可以被…；依格位加形容詞詞尾"
  }
];

export const passivExercises: PassivExercise[] = [
  {
    "id": "forms-1",
    "stage": "forms",
    "level": "A2",
    "options": [
      "werde",
      "wirst",
      "wird",
      "werden"
    ],
    "trans": "我今天接受檢查。",
    "explain": "ich 搭配 werde；untersucht 是 untersuchen 的過去分詞。",
    "sentence": "Ich ___ heute untersucht."
  },
  {
    "id": "forms-2",
    "stage": "forms",
    "level": "A2",
    "options": [
      "wirst",
      "wird",
      "werde",
      "werdet"
    ],
    "trans": "有人在入口迎接你。",
    "explain": "du 用 wirst，不能用第三人稱 wird。",
    "sentence": "Du ___ am Eingang begrüßt."
  },
  {
    "id": "forms-3",
    "stage": "forms",
    "level": "A2",
    "options": [
      "wird",
      "werden",
      "werdet",
      "wirst"
    ],
    "trans": "腳踏車正在維修。",
    "explain": "單數主詞 das Fahrrad 用 wird；reparieren 的過去分詞沒有 ge-。",
    "sentence": "Das Fahrrad ___ gerade repariert."
  },
  {
    "id": "forms-4",
    "stage": "forms",
    "level": "A2",
    "options": [
      "werden",
      "werdet",
      "wird",
      "wirst"
    ],
    "trans": "有人載我們去車站。",
    "explain": "wir 用 werden；bringen 的過去分詞是 gebracht。",
    "sentence": "Wir ___ zum Bahnhof gebracht."
  },
  {
    "id": "forms-5",
    "stage": "forms",
    "level": "A2",
    "options": [
      "werdet",
      "werden",
      "wird",
      "wirst"
    ],
    "trans": "明天有人來接你們。",
    "explain": "ihr 用 werdet；abholen 的過去分詞是 abgeholt。",
    "sentence": "Ihr ___ morgen abgeholt."
  },
  {
    "id": "forms-6",
    "stage": "forms",
    "level": "A2",
    "options": [
      "werden",
      "wird",
      "werdet",
      "werde"
    ],
    "trans": "客人們在院子裡被拍照。",
    "explain": "複數 die Gäste 用 werden；fotografiert 不加 ge-。",
    "sentence": "Die Gäste ___ im Hof fotografiert."
  },
  {
    "id": "forms-7",
    "stage": "forms",
    "level": "A2",
    "options": [
      "gekocht",
      "gekochte",
      "gekochen",
      "kocht"
    ],
    "trans": "湯是現煮的。",
    "explain": "被動現在式用 wird＋過去分詞 gekocht，gekochte 是形容詞變化形式，不能放在這裡。",
    "sentence": "Die Suppe wird frisch ___."
  },
  {
    "id": "transform-1",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Das Gemüse wird geschnitten.",
      "Das Gemüse werden geschnitten.",
      "Das Gemüse hat geschnitten.",
      "Das Gemüse wird geschnitten worden."
    ],
    "trans": "有人在切菜。",
    "explain": "主動句的受詞變成主詞：Das Gemüse；現在式用 wird＋geschnitten。原本的施事者依題目要求省略。",
    "fact": "Die Köchin schneidet das Gemüse."
  },
  {
    "id": "transform-2",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Die Tür wird geöffnet.",
      "Die Tür werden geöffnet.",
      "Die Tür hat geöffnet.",
      "Die Tür wird geöffnet worden."
    ],
    "trans": "門被打開。",
    "explain": "主動句的受詞變成主詞：Die Tür；現在式用 wird＋geöffnet。原本的施事者依題目要求省略。",
    "fact": "Der Fahrer öffnet die Tür."
  },
  {
    "id": "transform-3",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Die Pakete werden geliefert.",
      "Die Pakete wird geliefert.",
      "Die Pakete hat geliefert.",
      "Die Pakete werden geliefert worden."
    ],
    "trans": "包裹會被送來。",
    "explain": "主動句的受詞變成主詞：Die Pakete；現在式用 werden＋geliefert。原本的施事者依題目要求省略。",
    "fact": "Die Firma liefert die Pakete."
  },
  {
    "id": "transform-4",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Die Regel wird erklärt.",
      "Die Regel werden erklärt.",
      "Die Regel hat erklärt.",
      "Die Regel wird erklärt worden."
    ],
    "trans": "規則被說明。",
    "explain": "主動句的受詞變成主詞：Die Regel；現在式用 wird＋erklärt。原本的施事者依題目要求省略。",
    "fact": "Der Lehrer erklärt die Regel."
  },
  {
    "id": "transform-5",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Die Blumen werden gegossen.",
      "Die Blumen wird gegossen.",
      "Die Blumen hat gegossen.",
      "Die Blumen werden gegossen worden."
    ],
    "trans": "有人替花澆水。",
    "explain": "主動句的受詞變成主詞：Die Blumen；現在式用 werden＋gegossen。原本的施事者依題目要求省略。",
    "fact": "Die Nachbarin gießt die Blumen."
  },
  {
    "id": "transform-6",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Der Drucker wird geprüft.",
      "Der Drucker werden geprüft.",
      "Der Drucker hat geprüft.",
      "Der Drucker wird geprüft worden."
    ],
    "trans": "印表機接受檢查。",
    "explain": "主動句的受詞變成主詞：Der Drucker；現在式用 wird＋geprüft。原本的施事者依題目要求省略。",
    "fact": "Der Techniker prüft den Drucker."
  },
  {
    "id": "transform-7",
    "stage": "transform",
    "level": "B1",
    "options": [
      "Der Patient wird untersucht.",
      "Der Patient werden untersucht.",
      "Der Patient hat untersucht.",
      "Der Patient wird untersucht worden."
    ],
    "trans": "病人接受檢查。",
    "explain": "主動句的受詞變成主詞：Der Patient；現在式用 wird＋untersucht。原本的施事者依題目要求省略。",
    "fact": "Die Ärztin untersucht den Patienten."
  },
  {
    "id": "past-1",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurde",
      "wurden",
      "geworden",
      "hat"
    ],
    "trans": "信寄出了。",
    "explain": "Präteritum 被動用 wurde＋verschickt。單數主詞用 wurde；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Der Brief ___ verschickt."
  },
  {
    "id": "past-2",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurden",
      "wurde",
      "geworden",
      "haben"
    ],
    "trans": "窗戶擦過了。",
    "explain": "Präteritum 被動用 wurden＋geputzt。複數主詞用 wurden；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Die Fenster ___ geputzt."
  },
  {
    "id": "past-3",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurde",
      "wurden",
      "geworden",
      "hat"
    ],
    "trans": "房子賣掉了。",
    "explain": "Präteritum 被動用 wurde＋verkauft。單數主詞用 wurde；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Das Haus ___ verkauft."
  },
  {
    "id": "past-4",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurden",
      "wurde",
      "geworden",
      "haben"
    ],
    "trans": "車票都查過了。",
    "explain": "Präteritum 被動用 wurden＋kontrolliert。複數主詞用 wurden；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Die Tickets ___ kontrolliert."
  },
  {
    "id": "past-5",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurde",
      "wurden",
      "geworden",
      "hat"
    ],
    "trans": "有人問了我。",
    "explain": "Präteritum 被動用 wurde＋gefragt。單數主詞用 wurde；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Ich ___ gefragt."
  },
  {
    "id": "past-6",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurden",
      "wurde",
      "geworden",
      "haben"
    ],
    "trans": "我們受邀了。",
    "explain": "Präteritum 被動用 wurden＋eingeladen。複數主詞用 wurden；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Wir ___ eingeladen."
  },
  {
    "id": "past-7",
    "stage": "past",
    "level": "B1",
    "options": [
      "wurde",
      "wurden",
      "geworden",
      "hat"
    ],
    "trans": "道路被封閉了。",
    "explain": "Präteritum 被動用 wurde＋gesperrt。單數主詞用 wurde；geworden 是過去分詞，不能單獨作為這裡的變位助動詞。",
    "sentence": "Die Straße ___ gesperrt."
  },
  {
    "id": "perfect-1",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "ist bestellt worden",
      "ist bestellt geworden",
      "hat bestellt worden",
      "ist bestellt werden"
    ],
    "trans": "餐點已經點好了。",
    "explain": "完成式被動：ist＋bestellt＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Das Essen ___."
  },
  {
    "id": "perfect-2",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "sind geliefert worden",
      "sind geliefert geworden",
      "haben geliefert worden",
      "sind geliefert werden"
    ],
    "trans": "椅子已經送到了。",
    "explain": "完成式被動：sind＋geliefert＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Die Stühle ___."
  },
  {
    "id": "perfect-3",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "bin informiert worden",
      "bin informiert geworden",
      "hat informiert worden",
      "bin informiert werden"
    ],
    "trans": "我已經接獲通知了。",
    "explain": "完成式被動：bin＋informiert＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Ich ___."
  },
  {
    "id": "perfect-4",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "bist gewarnt worden",
      "bist gewarnt geworden",
      "hat gewarnt worden",
      "bist gewarnt werden"
    ],
    "trans": "你已經受到警告了。",
    "explain": "完成式被動：bist＋gewarnt＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Du ___."
  },
  {
    "id": "perfect-5",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "sind abgeholt worden",
      "sind abgeholt geworden",
      "haben abgeholt worden",
      "sind abgeholt werden"
    ],
    "trans": "我們已經被接走了。",
    "explain": "完成式被動：sind＋abgeholt＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Wir ___."
  },
  {
    "id": "perfect-6",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "seid eingeladen worden",
      "seid eingeladen geworden",
      "haben eingeladen worden",
      "seid eingeladen werden"
    ],
    "trans": "你們已經受邀了。",
    "explain": "完成式被動：seid＋eingeladen＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Ihr ___."
  },
  {
    "id": "perfect-7",
    "stage": "perfect",
    "level": "B1",
    "options": [
      "ist gefunden worden",
      "ist gefunden geworden",
      "hat gefunden worden",
      "ist gefunden werden"
    ],
    "trans": "鑰匙已經被找到了。",
    "explain": "完成式被動：ist＋gefunden＋worden。這裡的 werden 是被動助動詞，過去分詞用 worden；geworden 用在「變成」。",
    "sentence": "Der Schlüssel ___."
  },
  {
    "id": "modal-1",
    "stage": "modal",
    "level": "B1",
    "options": [
      "unterschrieben",
      "unterschreiben",
      "unterschreibt",
      "geunterschrieben"
    ],
    "trans": "申請書今天必須簽名。",
    "explain": "情態動詞後面用被動不定式：unterschrieben werden。",
    "sentence": "Der Antrag muss heute ___ werden."
  },
  {
    "id": "modal-2",
    "stage": "modal",
    "level": "B1",
    "options": [
      "muss",
      "müssen",
      "musst",
      "müsst"
    ],
    "trans": "帳單必須在星期五以前繳清。",
    "explain": "單數 die Rechnung 搭配 muss；句尾是 bezahlt werden。",
    "sentence": "Die Rechnung ___ bis Freitag bezahlt werden."
  },
  {
    "id": "modal-3",
    "stage": "modal",
    "level": "B1",
    "options": [
      "werden",
      "worden",
      "geworden",
      "wird"
    ],
    "trans": "上課時手機必須關機。",
    "explain": "情態動詞後面用被動不定式：müssen＋ausgeschaltet werden；wird 是變位形式，不能放在這裡。worden 用於完成式（含過去完成式）。",
    "sentence": "Die Handys müssen im Kurs ausgeschaltet ___."
  },
  {
    "id": "modal-4",
    "stage": "modal",
    "level": "B1",
    "options": [
      "geöffnet",
      "öffnen",
      "öffnet",
      "geöffnen"
    ],
    "trans": "這扇窗戶不可以打開。",
    "explain": "darf nicht 表示禁止；被動不定式是 geöffnet werden。",
    "sentence": "Das Fenster darf nicht ___ werden."
  },
  {
    "id": "modal-5",
    "stage": "modal",
    "level": "B1",
    "options": [
      "abgestellt",
      "abstellen",
      "abstellt",
      "geabstellt"
    ],
    "trans": "腳踏車可以停在這裡。",
    "explain": "abstellen 是可分動詞，過去分詞 abgestellt；後面接 werden。",
    "sentence": "Die Fahrräder können hier ___ werden."
  },
  {
    "id": "modal-6",
    "stage": "modal",
    "level": "B1",
    "options": [
      "bestätigt",
      "bestätigen",
      "gebestätigt",
      "bestätigte"
    ],
    "trans": "預約時間明天要確認。",
    "explain": "bestätigen 的 be- 不加 ge-：bestätigt werden。",
    "sentence": "Der Termin soll morgen ___ werden."
  },
  {
    "id": "modal-7",
    "stage": "modal",
    "level": "B1",
    "options": [
      "können",
      "kann",
      "könnt",
      "kannst"
    ],
    "trans": "這些題目可以一起解。",
    "explain": "複數 die Aufgaben 用 können；句尾 gelöst werden。",
    "sentence": "Die Aufgaben ___ gemeinsam gelöst werden."
  },
  {
    "id": "agent-1",
    "stage": "agent",
    "level": "B1",
    "options": [
      "von meiner Schwester",
      "von meine Schwester",
      "durch meiner Schwester",
      "von meinen Schwester"
    ],
    "trans": "這幅畫由我姊姊來畫。",
    "explain": "畫畫的人是直接執行者，用 von＋Dativ：meiner Schwester。durch 搭配 Akkusativ。",
    "sentence": "Das Bild wird ___ gemalt."
  },
  {
    "id": "agent-2",
    "stage": "agent",
    "level": "B1",
    "options": [
      "vom Gastgeber",
      "von den Gastgeber",
      "durch dem Gastgeber",
      "vom Gastgebern"
    ],
    "trans": "客人由主人迎接。",
    "explain": "直接執行者用 von＋Dativ；von dem 縮寫成 vom。",
    "sentence": "Die Gäste werden ___ begrüßt."
  },
  {
    "id": "agent-3",
    "stage": "agent",
    "level": "B1",
    "options": [
      "von den Kollegen",
      "von die Kollegen",
      "durch dem Kollegen",
      "von der Kollegen"
    ],
    "trans": "報告由同事們撰寫。",
    "explain": "本題練習以 von 表示執行者：von＋Dativ 複數 den Kollegen。durch 則要求 Akkusativ，不能接 dem Kollegen。",
    "sentence": "Der Bericht wird ___ geschrieben."
  },
  {
    "id": "agent-4",
    "stage": "agent",
    "level": "B1",
    "options": [
      "durch den starken Regen",
      "durch dem starken Regen",
      "von den starken Regen",
      "durch der starke Regen"
    ],
    "trans": "地下室因為大雨淹水了。",
    "explain": "本題練習用 durch 表示造成結果的原因；durch 後面用 Akkusativ：den starken Regen。",
    "sentence": "Der Keller wurde ___ überflutet."
  },
  {
    "id": "agent-5",
    "stage": "agent",
    "level": "B1",
    "options": [
      "durch einen Sturm",
      "durch einem Sturm",
      "von einen Sturm",
      "durch eines Sturms"
    ],
    "trans": "屋頂因暴風雨受損。",
    "explain": "durch＋Akkusativ 表示原因：einen Sturm。某些語境也能用 von einem Sturm，但它不在本題選項中。",
    "sentence": "Das Dach wurde ___ beschädigt."
  },
  {
    "id": "agent-6",
    "stage": "agent",
    "level": "B1",
    "options": [
      "durch einen Sensor",
      "durch einem Sensor",
      "von einen Sensor",
      "durch eines Sensors"
    ],
    "trans": "警報由感應器觸發。",
    "explain": "感應器是觸發警報的媒介，用 durch＋Akkusativ：einen Sensor；durch einem Sensor 與 durch eines Sensors 的格位錯誤，von 則須接 Dativ，不能用 einen Sensor。",
    "sentence": "Der Alarm wird ___ ausgelöst."
  },
  {
    "id": "agent-7",
    "stage": "agent",
    "level": "B1",
    "options": [
      "von einer Ärztin",
      "von eine Ärztin",
      "durch einer Ärztin",
      "von einen Ärztin"
    ],
    "trans": "病人由一位女醫師檢查。",
    "explain": "執行檢查的人用 von＋Dativ：einer Ärztin。",
    "sentence": "Der Patient wird ___ untersucht."
  },
  {
    "id": "state-1",
    "stage": "state",
    "level": "B1",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "門是開著的。",
    "explain": "ist＋geöffnet 描述開門後的狀態，不強調誰正在開門。",
    "sentence": "Die Tür ist geöffnet."
  },
  {
    "id": "state-2",
    "stage": "state",
    "level": "B1",
    "options": [
      "過程被動（Vorgangspassiv）",
      "狀態被動（Zustandspassiv）"
    ],
    "trans": "有人正在開門。",
    "explain": "wird＋geöffnet 強調開門的動作，gerade 表示正在進行。",
    "sentence": "Die Tür wird gerade geöffnet."
  },
  {
    "id": "state-3",
    "stage": "state",
    "level": "B1",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "窗戶是關著的。",
    "explain": "sind＋geschlossen 描述關好的結果狀態。",
    "sentence": "Die Fenster sind geschlossen."
  },
  {
    "id": "state-4",
    "stage": "state",
    "level": "B1",
    "options": [
      "過程被動（Vorgangspassiv）",
      "狀態被動（Zustandspassiv）"
    ],
    "trans": "窗戶每天晚上都會被關上。",
    "explain": "werden＋geschlossen 描述每天反覆執行的動作。過程被動不一定只指此刻正在進行。",
    "sentence": "Die Fenster werden jeden Abend geschlossen."
  },
  {
    "id": "state-5",
    "stage": "state",
    "level": "B1",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "帳單已經繳清了。",
    "explain": "ist＋bezahlt 表示帳單處於已繳清的狀態；完成式動作被動則是 ist bezahlt worden。",
    "sentence": "Die Rechnung ist bezahlt."
  },
  {
    "id": "state-6",
    "stage": "state",
    "level": "B1",
    "options": [
      "過程被動（Vorgangspassiv）",
      "狀態被動（Zustandspassiv）"
    ],
    "trans": "房間正在清潔中。",
    "explain": "wird＋gereinigt 表示清潔的執行過程。",
    "sentence": "Das Zimmer wird gerade gereinigt."
  },
  {
    "id": "state-7",
    "stage": "state",
    "level": "B1",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "腳踏車修好了。",
    "explain": "ist＋repariert 著重修好後的狀態；wird repariert 才是維修的動作。",
    "sentence": "Das Fahrrad ist repariert."
  },
  {
    "id": "forms-8",
    "stage": "forms",
    "level": "A2",
    "sentence": "Das Geschirr ___ nach dem Essen gespült.",
    "options": [
      "wird",
      "werden",
      "wirst",
      "werdet"
    ],
    "trans": "吃完飯後會洗碗。",
    "explain": "單數主詞 das Geschirr 用 wird；spülen 的過去分詞是 gespült。"
  },
  {
    "id": "forms-9",
    "stage": "forms",
    "level": "A2",
    "sentence": "Die Brötchen ___ jeden Morgen frisch gebacken.",
    "options": [
      "werden",
      "wird",
      "werdet",
      "wirst"
    ],
    "trans": "小麵包每天早上現烤。",
    "explain": "複數主詞 die Brötchen 用 werden；backen 的過去分詞是 gebacken。"
  },
  {
    "id": "forms-10",
    "stage": "forms",
    "level": "A2",
    "sentence": "Das Zimmer wird jeden Tag ___.",
    "options": [
      "aufgeräumt",
      "geaufräumt",
      "aufgeräumen",
      "aufräumt"
    ],
    "trans": "房間每天都會整理。",
    "explain": "aufräumen 是可分動詞，ge- 放在前綴和詞幹中間：auf-ge-räumt。"
  },
  {
    "id": "forms-11",
    "stage": "forms",
    "level": "A2",
    "sentence": "Mein Opa ___ morgen operiert.",
    "options": [
      "wird",
      "werden",
      "wirst",
      "werde"
    ],
    "trans": "我爺爺明天要動手術。",
    "explain": "單數主詞 mein Opa 用 wird；operieren 是 -ieren 動詞，過去分詞不加 ge-。"
  },
  {
    "id": "forms-12",
    "stage": "forms",
    "level": "B1",
    "sentence": "Hier ___ nicht geraucht.",
    "options": [
      "wird",
      "werden",
      "wirst",
      "werdet"
    ],
    "trans": "這裡不准抽菸。",
    "explain": "這種被動句沒有主詞，werden 一律用第三人稱單數 wird。"
  },
  {
    "id": "forms-13",
    "stage": "forms",
    "level": "B1",
    "sentence": "Den Kindern ___ bei den Hausaufgaben geholfen.",
    "options": [
      "wird",
      "werden",
      "werdet",
      "wirst"
    ],
    "trans": "孩子們寫功課時有人幫忙。",
    "explain": "helfen 接 Dativ，den Kindern 不是主詞，所以不跟著用複數；沒有主詞時用 wird。"
  },
  {
    "id": "forms-14",
    "stage": "forms",
    "level": "B1",
    "sentence": "Das Treffen wird auf nächste Woche ___.",
    "options": [
      "verschoben",
      "geverschoben",
      "verschiebt",
      "verschobene"
    ],
    "trans": "會議延到下週。",
    "explain": "verschieben 是不規則動詞，ver- 開頭不加 ge-：verschoben。"
  },
  {
    "id": "transform-8",
    "stage": "transform",
    "level": "A2",
    "fact": "Der Kellner bringt den Kaffee.",
    "options": [
      "Der Kaffee wird gebracht.",
      "Den Kaffee wird gebracht.",
      "Der Kaffee werden gebracht.",
      "Der Kaffee hat gebracht."
    ],
    "trans": "有人送咖啡來。",
    "explain": "受詞 den Kaffee 變成主詞，要改成主格 der Kaffee；單數用 wird＋gebracht。"
  },
  {
    "id": "transform-9",
    "stage": "transform",
    "level": "A2",
    "fact": "Mein Bruder wäscht das Auto.",
    "options": [
      "Das Auto wird gewaschen.",
      "Das Auto werden gewaschen.",
      "Das Auto hat gewaschen.",
      "Das Auto wird gewascht."
    ],
    "trans": "車子正在洗。",
    "explain": "das Auto 變成主詞，用 wird；waschen 的過去分詞是不規則的 gewaschen。"
  },
  {
    "id": "transform-10",
    "stage": "transform",
    "level": "A2",
    "fact": "Die Schüler lesen die Texte.",
    "options": [
      "Die Texte werden gelesen.",
      "Die Texte wird gelesen.",
      "Die Texte hat gelesen.",
      "Die Texte werden gelesen worden."
    ],
    "trans": "有人在讀這些課文。",
    "explain": "複數 die Texte 變成主詞，用 werden；lesen 的過去分詞是 gelesen。"
  },
  {
    "id": "transform-11",
    "stage": "transform",
    "level": "A2",
    "fact": "Der Vater weckt die Kinder.",
    "options": [
      "Die Kinder werden geweckt.",
      "Die Kinder wird geweckt.",
      "Die Kinder hat geweckt.",
      "Die Kinder werden geweckt worden."
    ],
    "trans": "孩子們被叫醒。",
    "explain": "複數 die Kinder 變成主詞，用 werden＋geweckt；施事者 der Vater 省略。"
  },
  {
    "id": "transform-12",
    "stage": "transform",
    "level": "B1",
    "fact": "Der Hausmeister schließt die Türen ab.",
    "options": [
      "Die Türen werden abgeschlossen.",
      "Die Türen werden geabschlossen.",
      "Die Türen wird abgeschlossen.",
      "Die Türen werden abgeschlossen worden."
    ],
    "trans": "門都會被鎖上。",
    "explain": "abschließen 是可分動詞：主動句裡 ab 單獨放句尾；被動句用過去分詞 abgeschlossen，前綴和分詞連在一起。"
  },
  {
    "id": "transform-13",
    "stage": "transform",
    "level": "B1",
    "fact": "Die Werkstatt repariert den Motor.",
    "options": [
      "Der Motor wird repariert.",
      "Den Motor wird repariert.",
      "Der Motor wird gerepariert.",
      "Der Motor hat repariert."
    ],
    "trans": "引擎正在修理。",
    "explain": "受詞 den Motor 變成主詞要改主格 der Motor；-ieren 動詞的過去分詞不加 ge-。"
  },
  {
    "id": "transform-14",
    "stage": "transform",
    "level": "B1",
    "fact": "Der Chef lädt die neuen Mitarbeiter morgen ein.",
    "options": [
      "Die neuen Mitarbeiter werden morgen eingeladen.",
      "Die neuen Mitarbeiter wird morgen eingeladen.",
      "Die neuen Mitarbeiter werden morgen eingeladet.",
      "Die neuen Mitarbeiter haben morgen eingeladen."
    ],
    "trans": "新同事明天會受到邀請。",
    "explain": "複數主詞用 werden；einladen 的過去分詞是不規則的 eingeladen，時間副詞 morgen 保留在原位。"
  },
  {
    "id": "past-8",
    "stage": "past",
    "level": "B1",
    "sentence": "Gestern ___ der Geburtstag meiner Schwester gefeiert.",
    "options": [
      "wurde",
      "wurden",
      "geworden",
      "hat"
    ],
    "trans": "昨天替我妹妹慶生。",
    "explain": "主詞 der Geburtstag 是單數，Präteritum 被動用 wurde＋gefeiert；gestern 在句首，主詞放在 wurde 後面。"
  },
  {
    "id": "past-9",
    "stage": "past",
    "level": "B1",
    "sentence": "Die Kinder ___ um acht Uhr ins Bett gebracht.",
    "options": [
      "wurden",
      "wurde",
      "geworden",
      "haben"
    ],
    "trans": "孩子們八點被帶上床睡覺。",
    "explain": "複數主詞 die Kinder 用 wurden；bringen 的過去分詞是 gebracht。"
  },
  {
    "id": "past-10",
    "stage": "past",
    "level": "B1",
    "sentence": "Mein Handy ___ im Zug gefunden.",
    "options": [
      "wurde",
      "wurden",
      "geworden",
      "hat"
    ],
    "trans": "我的手機在火車上被找到了。",
    "explain": "單數主詞 mein Handy 用 wurde；finden 的過去分詞是 gefunden。"
  },
  {
    "id": "past-11",
    "stage": "past",
    "level": "B1",
    "sentence": "Das Konzert wurde gestern ___.",
    "options": [
      "abgesagt",
      "geabsagt",
      "abgesagen",
      "absagt"
    ],
    "trans": "音樂會昨天取消了。",
    "explain": "absagen 是可分動詞，ge- 放在中間：ab-ge-sagt。"
  },
  {
    "id": "past-12",
    "stage": "past",
    "level": "B1",
    "sentence": "Ihr ___ nach dem Unfall von der Polizei befragt.",
    "options": [
      "wurdet",
      "wurden",
      "wurde",
      "wurdest"
    ],
    "trans": "車禍後你們接受了警方的詢問。",
    "explain": "ihr 的 Präteritum 是 wurdet；befragen 的 be- 不加 ge-。"
  },
  {
    "id": "past-13",
    "stage": "past",
    "level": "B1",
    "sentence": "Du ___ gestern zweimal angerufen, aber du warst nicht da.",
    "options": [
      "wurdest",
      "wurde",
      "wurdet",
      "geworden"
    ],
    "trans": "昨天有人打了兩次電話給你，可是你不在。",
    "explain": "du 的 Präteritum 是 wurdest；anrufen 接 Akkusativ，所以能改成以 du 為主詞的被動句。"
  },
  {
    "id": "past-14",
    "stage": "past",
    "level": "B1",
    "sentence": "Der Dieb wurde nach zwei Tagen ___.",
    "options": [
      "festgenommen",
      "festgenehmt",
      "gefestnommen",
      "festnahm"
    ],
    "trans": "小偷兩天後被逮捕了。",
    "explain": "festnehmen 是不規則的可分動詞，過去分詞是 festgenommen。"
  },
  {
    "id": "perfect-8",
    "stage": "perfect",
    "level": "B1",
    "sentence": "Die alte Brücke ist letztes Jahr renoviert ___.",
    "options": [
      "worden",
      "geworden",
      "werden",
      "wurde"
    ],
    "trans": "那座舊橋去年整修過了。",
    "explain": "完成式被動在句尾用 worden；geworden 只用在「變成」的意思。"
  },
  {
    "id": "perfect-9",
    "stage": "perfect",
    "level": "B1",
    "sentence": "Unser Flug ___ gestrichen worden.",
    "options": [
      "ist",
      "hat",
      "wird",
      "wurde"
    ],
    "trans": "我們的班機被取消了。",
    "explain": "完成式被動的助動詞一律是 sein：ist＋過去分詞＋worden。"
  },
  {
    "id": "perfect-10",
    "stage": "perfect",
    "level": "B1",
    "sentence": "Seid ihr schon ___?",
    "options": [
      "geimpft worden",
      "geimpft geworden",
      "impfen worden",
      "geimpft werden"
    ],
    "trans": "你們打過疫苗了嗎？",
    "explain": "問句裡 seid 放句首，句尾是過去分詞 geimpft＋worden。"
  },
  {
    "id": "perfect-11",
    "stage": "perfect",
    "level": "B1",
    "sentence": "In unserer Straße ___ letzte Nacht zwei Autos aufgebrochen worden.",
    "options": [
      "sind",
      "haben",
      "ist",
      "wurden"
    ],
    "trans": "昨晚我們這條街上有兩輛車被撬開了。",
    "explain": "主詞是複數 zwei Autos，所以用 sind；被動完成式不用 haben。"
  },
  {
    "id": "perfect-12",
    "stage": "perfect",
    "level": "B1",
    "sentence": "Mir ist mein Fahrrad gestohlen ___.",
    "options": [
      "worden",
      "geworden",
      "werden",
      "wurden"
    ],
    "trans": "我的腳踏車被偷了。",
    "explain": "完成式被動：ist＋gestohlen＋worden；mir 是 Dativ，表示受害的人。"
  },
  {
    "id": "perfect-13",
    "stage": "perfect",
    "level": "B1",
    "sentence": "Ich bin noch nie so freundlich ___ worden.",
    "options": [
      "bedient",
      "gebedient",
      "bediente",
      "bedienen"
    ],
    "trans": "我從來沒受過這麼親切的服務。",
    "explain": "bedienen 的 be- 不加 ge-，過去分詞是 bedient，再接 worden。"
  },
  {
    "id": "perfect-14",
    "stage": "perfect",
    "level": "B1",
    "sentence": "Ist das Formular schon ___?",
    "options": [
      "ausgefüllt worden",
      "ausgefüllt geworden",
      "geausfüllt worden",
      "ausgefüllt werden"
    ],
    "trans": "表格已經填好了嗎？",
    "explain": "ausfüllen 是可分動詞，過去分詞 ausgefüllt；完成式被動句尾用 worden。"
  },
  {
    "id": "modal-8",
    "stage": "modal",
    "level": "B1",
    "sentence": "Im Museum ___ nicht fotografiert werden.",
    "options": [
      "darf",
      "dürfen",
      "darfst",
      "dürft"
    ],
    "trans": "博物館裡不可以拍照。",
    "explain": "這句沒有主詞，情態動詞用第三人稱單數 darf；句尾是 fotografiert werden。"
  },
  {
    "id": "modal-9",
    "stage": "modal",
    "level": "B1",
    "sentence": "Die Medikamente müssen kühl ___ werden.",
    "options": [
      "gelagert",
      "lagern",
      "gelagern",
      "lagert"
    ],
    "trans": "這些藥必須存放在陰涼的地方。",
    "explain": "情態動詞後接被動不定式：過去分詞 gelagert＋werden。"
  },
  {
    "id": "modal-10",
    "stage": "modal",
    "level": "B1",
    "sentence": "Die Wohnung soll bis Ende Mai ___ werden.",
    "options": [
      "gestrichen",
      "streichen",
      "gestreicht",
      "gestrichet"
    ],
    "trans": "公寓應該在五月底前粉刷好。",
    "explain": "streichen 是不規則動詞，過去分詞是 gestrichen，後面接 werden。"
  },
  {
    "id": "modal-11",
    "stage": "modal",
    "level": "B1",
    "sentence": "Kann das Paket auch am Samstag ___ werden?",
    "options": [
      "zugestellt",
      "zustellt",
      "gezustellt",
      "zugestellen"
    ],
    "trans": "包裹星期六也能送嗎？",
    "explain": "zustellen 是可分動詞，過去分詞 zugestellt；問句裡 kann 放句首，句尾仍是過去分詞＋werden。"
  },
  {
    "id": "modal-12",
    "stage": "modal",
    "level": "B1",
    "sentence": "Alle Teilnehmer ___ vor dem Kurs informiert werden.",
    "options": [
      "sollen",
      "soll",
      "sollt",
      "sollst"
    ],
    "trans": "所有參加者都應該在課程開始前收到通知。",
    "explain": "複數主詞 alle Teilnehmer 用 sollen；句尾是 informiert werden。"
  },
  {
    "id": "modal-13",
    "stage": "modal",
    "level": "B1",
    "sentence": "___ der Hund heute noch gefüttert werden?",
    "options": [
      "Muss",
      "Müssen",
      "Musst",
      "Müsst"
    ],
    "trans": "狗今天還要餵嗎？",
    "explain": "主詞 der Hund 是單數，用 muss；是非問句把情態動詞放句首。"
  },
  {
    "id": "modal-14",
    "stage": "modal",
    "level": "B1",
    "sentence": "Die Plätze können leider nicht ___ werden.",
    "options": [
      "reserviert",
      "reservieren",
      "gereserviert",
      "reservierte"
    ],
    "trans": "很抱歉，座位沒辦法預訂。",
    "explain": "reservieren 是 -ieren 動詞，過去分詞不加 ge-：reserviert werden。"
  },
  {
    "id": "agent-8",
    "stage": "agent",
    "level": "B1",
    "sentence": "Das Rathaus wurde ___ entworfen.",
    "options": [
      "von einem berühmten Architekten",
      "von einen berühmten Architekten",
      "durch einem berühmten Architekten",
      "von einem berühmten Architekt"
    ],
    "trans": "市政廳是由一位知名建築師設計的。",
    "explain": "設計的人是執行者，用 von＋Dativ。Architekt 是弱變化名詞，Dativ 要加 -en。"
  },
  {
    "id": "agent-9",
    "stage": "agent",
    "level": "B1",
    "sentence": "Die Stadt wurde ___ zerstört.",
    "options": [
      "durch ein Erdbeben",
      "durch einem Erdbeben",
      "von ein Erdbeben",
      "durch eines Erdbebens"
    ],
    "trans": "這座城市被地震摧毀了。",
    "explain": "地震是造成結果的原因，本題練習 durch＋Akkusativ：ein Erdbeben（中性名詞）。自然力量也常用 von einem Erdbeben，但不在選項中。"
  },
  {
    "id": "agent-10",
    "stage": "agent",
    "level": "B1",
    "sentence": "Ihre Fragen werden ___ beantwortet.",
    "options": [
      "von unseren Mitarbeitern",
      "von unsere Mitarbeiter",
      "durch unseren Mitarbeitern",
      "von unseren Mitarbeiter"
    ],
    "trans": "您的問題會由我們的員工回答。",
    "explain": "回答的人是執行者，用 von＋Dativ 複數：unseren Mitarbeitern，名詞也要加 -n。"
  },
  {
    "id": "agent-11",
    "stage": "agent",
    "level": "B1",
    "sentence": "Viele Unfälle werden ___ verursacht.",
    "options": [
      "durch zu hohe Geschwindigkeit",
      "durch zu hoher Geschwindigkeit",
      "von zu hohe Geschwindigkeit",
      "durch zu hohen Geschwindigkeit"
    ],
    "trans": "許多車禍是車速過快造成的。",
    "explain": "車速是原因，用 durch＋Akkusativ；沒有冠詞的陰性名詞，形容詞用 hohe。"
  },
  {
    "id": "agent-12",
    "stage": "agent",
    "level": "B1",
    "sentence": "Wir wurden ___ geweckt.",
    "options": [
      "durch den Lärm",
      "durch dem Lärm",
      "von den Lärm",
      "durch der Lärm"
    ],
    "trans": "我們被噪音吵醒了。",
    "explain": "噪音是原因，用 durch＋Akkusativ：den Lärm。von 必須接 Dativ，所以 von den Lärm 不對。口語也常說 vom Lärm geweckt（von＋Dativ）。"
  },
  {
    "id": "agent-13",
    "stage": "agent",
    "level": "B1",
    "sentence": "Das Straßenfest wird jedes Jahr ___ organisiert.",
    "options": [
      "von einem kleinen Verein",
      "von einen kleinen Verein",
      "von einem kleinen Vereins",
      "durch einem kleinen Verein"
    ],
    "trans": "這個街頭慶典每年都由一個小社團籌辦。",
    "explain": "籌辦的單位是執行者，用 von＋Dativ：einem kleinen Verein。"
  },
  {
    "id": "agent-14",
    "stage": "agent",
    "level": "B1",
    "sentence": "Wir wurden ___ über die Änderung informiert.",
    "options": [
      "durch eine E-Mail",
      "durch einer E-Mail",
      "von eine E-Mail",
      "durch eine E-Mails"
    ],
    "trans": "我們透過一封電子郵件得知這項變更。",
    "explain": "電子郵件是傳達消息的媒介，不是執行者，用 durch＋Akkusativ：eine E-Mail。日常也常說 per E-Mail informiert。"
  },
  {
    "id": "state-8",
    "stage": "state",
    "level": "B1",
    "sentence": "Das Geschäft war gestern geschlossen.",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "那家店昨天沒開。",
    "explain": "war＋geschlossen 描述昨天店門關著的狀態，是狀態被動的過去式。"
  },
  {
    "id": "state-9",
    "stage": "state",
    "level": "B1",
    "sentence": "Der Tisch ist schon gedeckt.",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "餐桌已經擺好了。",
    "explain": "ist＋gedeckt 描述擺好之後的結果，不講是誰在擺。"
  },
  {
    "id": "state-10",
    "stage": "state",
    "level": "B1",
    "sentence": "Das Museum wurde 1990 eröffnet.",
    "options": [
      "過程被動（Vorgangspassiv）",
      "狀態被動（Zustandspassiv）"
    ],
    "trans": "博物館在 1990 年開幕。",
    "explain": "wurde＋eröffnet 描述開幕這個動作，是過程被動的過去式。"
  },
  {
    "id": "state-11",
    "stage": "state",
    "level": "B1",
    "sentence": "Die Kartoffeln sind schon geschält worden.",
    "options": [
      "過程被動（Vorgangspassiv）",
      "狀態被動（Zustandspassiv）"
    ],
    "trans": "馬鈴薯已經削好皮了。",
    "explain": "sind＋geschält＋worden 是過程被動的完成式；有 worden，就是在講動作。"
  },
  {
    "id": "state-12",
    "stage": "state",
    "level": "B1",
    "sentence": "Der Parkplatz ist für Kunden reserviert.",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "這個停車位是顧客專用的。",
    "explain": "ist＋reserviert 描述停車位目前的狀態。"
  },
  {
    "id": "state-13",
    "stage": "state",
    "level": "B1",
    "sentence": "In diesem Restaurant wird nur bar bezahlt.",
    "options": [
      "過程被動（Vorgangspassiv）",
      "狀態被動（Zustandspassiv）"
    ],
    "trans": "這家餐廳只收現金。",
    "explain": "wird＋bezahlt 描述付款這個動作的固定做法，是過程被動；本句沒有主詞，werden 用第三人稱單數。"
  },
  {
    "id": "state-14",
    "stage": "state",
    "level": "B1",
    "sentence": "Als wir anriefen, war das Auto schon verkauft.",
    "options": [
      "狀態被動（Zustandspassiv）",
      "過程被動（Vorgangspassiv）"
    ],
    "trans": "我們打電話去的時候，車子已經賣掉了。",
    "explain": "war＋verkauft 描述當時「已經賣掉」的結果狀態；要講賣車的動作，會說 wurde verkauft。"
  },
  {
    "id": "clause-1",
    "stage": "clause",
    "level": "B1",
    "sentence": "Ich glaube, dass das Paket morgen ___.",
    "options": [
      "geliefert wird",
      "wird geliefert",
      "geliefert werden",
      "werden geliefert"
    ],
    "trans": "我想包裹明天會送到。",
    "explain": "dass 從句的變位動詞放句尾：過去分詞在前，wird 在最後。"
  },
  {
    "id": "clause-2",
    "stage": "clause",
    "level": "B1",
    "sentence": "Wir sind froh, dass das Problem endlich ___.",
    "options": [
      "gelöst wurde",
      "wurde gelöst",
      "gelöst wurden",
      "gelöst worden"
    ],
    "trans": "問題終於解決了，我們很高興。",
    "explain": "從句裡 Präteritum 被動的語序是 gelöst＋wurde；單數主詞用 wurde。"
  },
  {
    "id": "clause-3",
    "stage": "clause",
    "level": "B1",
    "sentence": "Weißt du, ob die Party abgesagt ___?",
    "options": [
      "worden ist",
      "ist worden",
      "geworden ist",
      "worden hat"
    ],
    "trans": "你知道派對是不是已經取消了嗎？",
    "explain": "從句裡的完成式被動：過去分詞＋worden＋ist，變位的 ist 放最後。"
  },
  {
    "id": "clause-4",
    "stage": "clause",
    "level": "B1",
    "sentence": "Er ist sauer, weil sein Auto ___.",
    "options": [
      "abgeschleppt worden ist",
      "ist abgeschleppt worden",
      "abgeschleppt geworden ist",
      "abgeschleppt worden hat"
    ],
    "trans": "他很火大，因為他的車被拖吊了。",
    "explain": "weil 從句的變位動詞放句尾：abgeschleppt worden ist；完成式被動用 sein。"
  },
  {
    "id": "clause-5",
    "stage": "clause",
    "level": "B1",
    "sentence": "Der Chef sagt, dass der Bericht bis Freitag ___.",
    "options": [
      "geschrieben werden muss",
      "muss geschrieben werden",
      "geschrieben muss werden",
      "geschrieben worden muss"
    ],
    "trans": "老闆說報告必須在星期五以前寫好。",
    "explain": "從句裡情態動詞放最後：過去分詞＋werden＋muss。"
  },
  {
    "id": "clause-6",
    "stage": "clause",
    "level": "B1",
    "sentence": "Wir übernachten nicht in dem Hotel, das gerade ___.",
    "options": [
      "renoviert wird",
      "wird renoviert",
      "renoviert werden",
      "renoviert worden"
    ],
    "trans": "我們不住那間正在整修的飯店。",
    "explain": "關係子句也是從句，wird 要放在句尾，排在 renoviert 後面。"
  },
  {
    "id": "clause-7",
    "stage": "clause",
    "level": "B1",
    "sentence": "Die Fotos, die auf der Hochzeit ___, sind wunderschön.",
    "options": [
      "gemacht wurden",
      "wurden gemacht",
      "gemacht wurde",
      "gemacht worden"
    ],
    "trans": "婚禮上拍的照片非常漂亮。",
    "explain": "關係代名詞 die 指複數 die Fotos，用 wurden，並放在關係子句最後。"
  },
  {
    "id": "clause-8",
    "stage": "clause",
    "level": "B1",
    "sentence": "Wenn der Knopf ___, geht die Tür auf.",
    "options": [
      "gedrückt wird",
      "wird gedrückt",
      "gedrückt werden",
      "gedrückt worden"
    ],
    "trans": "只要按下按鈕，門就會打開。",
    "explain": "wenn 從句裡變位動詞放句尾：gedrückt wird。"
  },
  {
    "id": "clause-9",
    "stage": "clause",
    "level": "B1",
    "sentence": "Ich frage an der Rezeption, ob das Gepäck hier ___.",
    "options": [
      "abgestellt werden darf",
      "darf abgestellt werden",
      "abgestellt darf werden",
      "abgestellt werden dürfen"
    ],
    "trans": "我去櫃檯問行李能不能放在這裡。",
    "explain": "ob 從句裡情態動詞放最後：abgestellt werden darf；主詞 das Gepäck 是單數。"
  },
  {
    "id": "clause-10",
    "stage": "clause",
    "level": "B1",
    "sentence": "Die Bilder, die aus dem Museum gestohlen ___, sind wieder aufgetaucht.",
    "options": [
      "worden sind",
      "sind worden",
      "worden ist",
      "geworden sind"
    ],
    "trans": "從博物館失竊的畫又重新出現了。",
    "explain": "關係子句裡的完成式被動：gestohlen worden sind；die 指複數 die Bilder，所以用 sind。"
  },
  {
    "id": "alternatives-1",
    "stage": "alternatives",
    "level": "B1",
    "fact": "Hier wird viel Englisch gesprochen.",
    "sentence": "Hier spricht ___ viel Englisch.",
    "options": [
      "man",
      "es",
      "sich",
      "wird"
    ],
    "trans": "這裡很多人說英語。",
    "explain": "不需要說出執行者時，可以用 man＋主動動詞代替被動。"
  },
  {
    "id": "alternatives-2",
    "stage": "alternatives",
    "level": "B1",
    "fact": "Das Fenster kann nicht geöffnet werden.",
    "sentence": "Das Fenster lässt sich nicht ___.",
    "options": [
      "öffnen",
      "geöffnet",
      "öffnet",
      "zu öffnen"
    ],
    "trans": "這扇窗戶打不開。",
    "explain": "sich lassen＋不定式表示「能夠被…」，等於 können＋被動；不定式放句尾，不加 zu。"
  },
  {
    "id": "alternatives-3",
    "stage": "alternatives",
    "level": "B1",
    "fact": "Man kann das Wasser trinken.",
    "sentence": "Das Wasser ist ___.",
    "options": [
      "trinkbar",
      "trinkbare",
      "trinklich",
      "trinkend"
    ],
    "trans": "這水可以喝。",
    "explain": "動詞詞幹＋-bar 表示「可以被…」；放在 sein 後面當述語時不加詞尾。"
  },
  {
    "id": "alternatives-4",
    "stage": "alternatives",
    "level": "B1",
    "fact": "Die Jacke kann in der Maschine gewaschen werden.",
    "sentence": "Die Jacke ___ sich in der Maschine waschen.",
    "options": [
      "lässt",
      "lassen",
      "lasst",
      "hat"
    ],
    "trans": "這件外套可以用洗衣機洗。",
    "explain": "主詞 die Jacke 是單數，用 lässt sich＋不定式 waschen。"
  },
  {
    "id": "alternatives-5",
    "stage": "alternatives",
    "level": "B1",
    "fact": "Früher wurden Briefe mit der Hand geschrieben.",
    "sentence": "Früher schrieb ___ Briefe mit der Hand.",
    "options": [
      "man",
      "es",
      "sich",
      "wurde"
    ],
    "trans": "以前大家都用手寫信。",
    "explain": "man 也能代替過去式的被動，動詞用過去式 schrieb。"
  },
  {
    "id": "alternatives-6",
    "stage": "alternatives",
    "level": "B2",
    "fact": "Die Aufgaben müssen bis morgen erledigt werden.",
    "sentence": "Die Aufgaben sind bis morgen ___.",
    "options": [
      "zu erledigen",
      "erledigen",
      "zu erledigt",
      "erledigt zu werden"
    ],
    "trans": "這些工作必須在明天以前完成。",
    "explain": "sein＋zu＋不定式可以表示「必須被…」，這裡等於 müssen＋被動不定式。"
  },
  {
    "id": "alternatives-7",
    "stage": "alternatives",
    "level": "B2",
    "fact": "Der Lärm kann kaum ertragen werden.",
    "sentence": "Der Lärm ist kaum zu ___.",
    "options": [
      "ertragen",
      "erträgt",
      "ertragen werden",
      "ertrug"
    ],
    "trans": "這噪音簡直讓人受不了。",
    "explain": "sein＋zu＋不定式也可以表示「能夠被…」；zu 後面只接不定式，不再加 werden。"
  },
  {
    "id": "alternatives-8",
    "stage": "alternatives",
    "level": "B2",
    "fact": "Die Mieten in der Innenstadt können kaum bezahlt werden.",
    "sentence": "Die Mieten in der Innenstadt sind fast ___.",
    "options": [
      "unbezahlbar",
      "unbezahlbare",
      "unbezahlend",
      "unbezahlt"
    ],
    "trans": "市中心的房租幾乎付不起。",
    "explain": "un-＋動詞詞幹＋-bar 表示「無法被…」；當述語時不加詞尾。"
  },
  {
    "id": "alternatives-9",
    "stage": "alternatives",
    "level": "B2",
    "fact": "Der Fehler konnte schnell gefunden werden.",
    "sentence": "Der Fehler ___ sich schnell finden.",
    "options": [
      "ließ",
      "ließen",
      "lasste",
      "ließ es"
    ],
    "trans": "錯誤很快就找到了。",
    "explain": "konnte … werden 改寫成 sich lassen 時，lassen 用過去式 ließ；lassen 是不規則動詞。"
  },
  {
    "id": "alternatives-10",
    "stage": "alternatives",
    "level": "B2",
    "fact": "Der Antrag muss bis zum 31. März eingereicht werden.",
    "sentence": "Der Antrag ist bis zum 31. März ___.",
    "options": [
      "einzureichen",
      "zu einreichen",
      "eingereicht zu werden",
      "einreichen zu"
    ],
    "trans": "申請書必須在 3 月 31 日前提交。",
    "explain": "sein＋zu＋不定式表示必須；可分動詞的 zu 放在前綴和詞幹中間：einzureichen。"
  },
  {
    "id": "subjunctive-1",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Das Dach müsste dringend ___ werden.",
    "options": [
      "repariert",
      "reparieren",
      "repariert worden",
      "gerepariert"
    ],
    "trans": "屋頂真的該修了。",
    "explain": "müsste＋過去分詞＋werden 是虛擬式的被動，語氣比 muss 委婉，表示「其實應該被…」。"
  },
  {
    "id": "subjunctive-2",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Ohne deine Hilfe ___ das Projekt nie fertiggestellt worden.",
    "options": [
      "wäre",
      "hätte",
      "würde",
      "wurde"
    ],
    "trans": "沒有你的幫忙，這個專案根本不可能完成。",
    "explain": "過去的非真實情況用 wäre＋過去分詞＋worden；被動完成式的助動詞是 sein，所以用 wäre，不用 hätte。"
  },
  {
    "id": "subjunctive-3",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Ich ___ gern zum Essen eingeladen werden.",
    "options": [
      "würde",
      "wäre",
      "hätte",
      "wurde"
    ],
    "trans": "我很希望有人請我吃飯。",
    "explain": "現在的願望用 würde＋過去分詞＋werden。"
  },
  {
    "id": "subjunctive-4",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Wenn der Fehler früher ___ wäre, hätten wir viel Geld gespart.",
    "options": [
      "entdeckt worden",
      "entdeckt geworden",
      "entdeckt werden",
      "worden entdeckt"
    ],
    "trans": "如果錯誤早點被發現，我們就能省下很多錢。",
    "explain": "wenn 從句裡的過去虛擬式被動：entdeckt worden wäre，wäre 放句尾。"
  },
  {
    "id": "subjunctive-5",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Das hätte früher gesagt werden ___.",
    "options": [
      "müssen",
      "gemusst",
      "gemüsst",
      "müsste"
    ],
    "trans": "這件事早就該說出來了。",
    "explain": "情態動詞的過去虛擬式被動：hätte＋過去分詞＋werden＋müssen。和情態動詞連用時用不定式 müssen，不用 gemusst。"
  },
  {
    "id": "subjunctive-6",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Mit einem besseren Plan ___ viel Zeit gespart werden.",
    "options": [
      "könnte",
      "könnten",
      "könntest",
      "wäre"
    ],
    "trans": "如果計畫好一點，就能省下很多時間。",
    "explain": "主詞 viel Zeit 是單數，用 könnte＋過去分詞＋werden 表示假設情況下的可能。"
  },
  {
    "id": "subjunctive-7",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "Am liebsten würde der Hund den ganzen Tag gestreichelt ___.",
    "options": [
      "werden",
      "worden",
      "wird",
      "würde"
    ],
    "trans": "這隻狗最希望整天都有人摸牠。",
    "explain": "würde 後面接被動不定式：gestreichelt werden；worden 只用在完成式。"
  },
  {
    "id": "subjunctive-8",
    "stage": "subjunctive",
    "level": "B2",
    "sentence": "___ die Musik bitte etwas leiser gestellt werden?",
    "options": [
      "Könnte",
      "Könnten",
      "Wäre",
      "Hätte"
    ],
    "trans": "音樂可以稍微調小聲一點嗎？",
    "explain": "用 könnte＋被動不定式提出客氣的請求；主詞 die Musik 是單數。"
  },
  {
    "id": "modal-past-1",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Der Flug ___ wegen Nebels umgeleitet werden.",
    "options": [
      "musste",
      "mussten",
      "hat",
      "wurde"
    ],
    "trans": "班機因為大霧不得不轉降其他機場。",
    "explain": "情態動詞過去式＋被動不定式：musste＋umgeleitet werden；主詞單數用 musste。"
  },
  {
    "id": "modal-past-2",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Die Kinder konnten rechtzeitig gerettet ___.",
    "options": [
      "werden",
      "worden",
      "wurden",
      "geworden"
    ],
    "trans": "孩子們及時獲救了。",
    "explain": "情態動詞後面用被動不定式 gerettet werden，即使情態動詞是過去式 konnten 也一樣。"
  },
  {
    "id": "modal-past-3",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Das Spiel hat wegen des Regens unterbrochen werden ___.",
    "options": [
      "müssen",
      "gemusst",
      "musste",
      "müsste"
    ],
    "trans": "比賽因為下雨不得不中斷。",
    "explain": "情態動詞的完成式用雙不定式：hat＋unterbrochen werden＋müssen，不用 gemusst。"
  },
  {
    "id": "modal-past-4",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Der alte Baum ___ gefällt werden müssen.",
    "options": [
      "hat",
      "ist",
      "wurde",
      "haben"
    ],
    "trans": "那棵老樹不得不砍掉。",
    "explain": "情態動詞的完成式一律用 haben，即使是被動句也不用 sein；主詞單數用 hat。"
  },
  {
    "id": "modal-past-5",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Es tut mir leid, dass Ihr Termin ___.",
    "options": [
      "hat verschoben werden müssen",
      "verschoben werden müssen hat",
      "hat verschoben worden müssen",
      "verschoben hat werden gemusst"
    ],
    "trans": "很抱歉，您的預約不得不改期。",
    "explain": "從句裡遇到雙不定式時，hat 不放句尾，而是放在整組動詞最前面：hat verschoben werden müssen。"
  },
  {
    "id": "modal-past-6",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Ich verstehe nicht, warum das alte Rathaus abgerissen ___.",
    "options": [
      "werden musste",
      "musste werden",
      "worden musste",
      "wurde müssen"
    ],
    "trans": "我不懂為什麼舊市政廳當初非拆不可。",
    "explain": "從句裡用過去式時，musste 照常放句尾：abgerissen werden musste。"
  },
  {
    "id": "modal-past-7",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Der Bürgermeister erklärt, warum das Schwimmbad ___.",
    "options": [
      "hat geschlossen werden müssen",
      "geschlossen werden müssen hat",
      "hat geschlossen worden müssen",
      "ist geschlossen werden müssen"
    ],
    "trans": "市長說明游泳池為什麼不得不關閉。",
    "explain": "從句裡的情態動詞完成式：hat 放在 geschlossen werden müssen 前面；助動詞用 haben，不用 sein。"
  },
  {
    "id": "modal-past-8",
    "stage": "modal-past",
    "level": "B2",
    "sentence": "Früher ___ im Zug noch geraucht werden.",
    "options": [
      "durfte",
      "durften",
      "darfte",
      "wurde"
    ],
    "trans": "以前在火車上還可以抽菸。",
    "explain": "這句沒有主詞，情態動詞用第三人稱單數；dürfen 的過去式是 durfte，沒有變音。"
  },
  {
    "id": "participle-1",
    "stage": "participle",
    "level": "B2",
    "sentence": "Das ___ Problem ist schwieriger, als wir dachten.",
    "options": [
      "zu lösende",
      "zu lösendes",
      "zu gelöste",
      "lösende zu"
    ],
    "trans": "要解決的問題比我們想的還難。",
    "explain": "zu＋現在分詞表示「必須被…」；das 之後的中性主格形容詞詞尾是 -e。"
  },
  {
    "id": "participle-2",
    "stage": "participle",
    "level": "B2",
    "sentence": "Die erst letzte Woche ___ Heizung funktioniert schon wieder nicht.",
    "options": [
      "reparierte",
      "repariertes",
      "reparierten",
      "reparierend"
    ],
    "trans": "上星期才修好的暖氣又不能用了。",
    "explain": "過去分詞 repariert 當形容詞，表示已被修好；die 之後的陰性主格詞尾是 -e。"
  },
  {
    "id": "participle-3",
    "stage": "participle",
    "level": "B2",
    "sentence": "Sie hat mir einen viel ___ Roman geschenkt.",
    "options": [
      "gelesenen",
      "gelesener",
      "gelesene",
      "lesenden"
    ],
    "trans": "她送了我一本很多人讀過的小說。",
    "explain": "過去分詞 gelesen 表示「被讀過」；einen 之後的陽性受格詞尾是 -en。"
  },
  {
    "id": "participle-4",
    "stage": "participle",
    "level": "B2",
    "sentence": "In der Küche steht ein frisch ___ Kuchen.",
    "options": [
      "gebackener",
      "gebackene",
      "gebackenen",
      "backender"
    ],
    "trans": "廚房裡有一個剛烤好的蛋糕。",
    "explain": "過去分詞 gebacken 當形容詞；ein 之後的陽性主格詞尾是 -er。"
  },
  {
    "id": "participle-5",
    "stage": "participle",
    "level": "B2",
    "sentence": "Bitte beachten Sie die unbedingt ___ Regeln.",
    "options": [
      "einzuhaltenden",
      "einzuhaltende",
      "zu einhaltenden",
      "eingehaltenden"
    ],
    "trans": "請注意這些務必遵守的規定。",
    "explain": "zu＋現在分詞表示必須遵守，可分動詞的 zu 放中間：einzuhaltend；die 之後的複數受格詞尾是 -en。"
  },
  {
    "id": "participle-6",
    "stage": "participle",
    "level": "B2",
    "sentence": "Die Polizei hat das ___ Auto gefunden.",
    "options": [
      "gestohlene",
      "stehlende",
      "gestohlenes",
      "gestohlenen"
    ],
    "trans": "警方找到了那輛被偷的車。",
    "explain": "被偷的車用過去分詞 gestohlen；現在分詞 stehlend 是「正在偷」。das 之後的中性受格詞尾是 -e。"
  },
  {
    "id": "participle-7",
    "stage": "participle",
    "level": "B2",
    "sentence": "Mit dem neu ___ Computer arbeite ich viel schneller.",
    "options": [
      "gekauften",
      "gekaufte",
      "gekauftem",
      "kaufenden"
    ],
    "trans": "用新買的電腦，我工作快多了。",
    "explain": "mit 接 Dativ，dem 之後的形容詞詞尾是 -en：dem neu gekauften Computer。"
  },
  {
    "id": "participle-8",
    "stage": "participle",
    "level": "B2",
    "sentence": "Es gibt noch viele ___ Fragen.",
    "options": [
      "zu klärende",
      "zu klärenden",
      "zu geklärte",
      "klärende zu"
    ],
    "trans": "還有很多問題有待釐清。",
    "explain": "zu＋現在分詞表示「必須被…」；viele 之後沒有冠詞，複數受格用強變化詞尾 -e。"
  }
];
