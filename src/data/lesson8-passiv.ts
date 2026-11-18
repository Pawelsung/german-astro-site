// Original A2–B1 practice. options[0] is the answer; ChoiceCard shuffles options.
export type PassivStage = 'forms' | 'transform' | 'past' | 'perfect' | 'modal' | 'agent' | 'state';
export interface PassivExercise {
  id: string; stage: PassivStage; level: 'A2' | 'B1';
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
  }
];
