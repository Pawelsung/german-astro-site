// src/data/adjective-declension.ts
// Lektion 6｜名詞片語升級：冠詞＋形容詞＋名詞變化
// 目的：提供完整的文法說明、概念卡、題庫資料、答案與中文講解。
// 可直接放入 Astro / React 專案中使用。

export type Gender = "m" | "f" | "n" | "pl";
export type GermanCase = "nominativ" | "akkusativ" | "dativ";
export type ArticleType = "definite" | "indefinite" | "zero";
export type LessonLevel = "A2" | "A2-B1" | "B1";
export type ExerciseMode =
  | "concept"
  | "quick-drill"
  | "case-detective"
  | "dativ-focus"
  | "sentence-upgrade"
  | "error-fix";

export interface LessonMeta {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  estimatedMinutes: number;
  tags: string[];
  description: string;
  goals: string[];
}

export interface GrammarSection {
  id: string;
  title: string;
  level: LessonLevel;
  summary: string;
  keyPoint: string;
  explanation: string[];
  examples: Array<{
    german: string;
    chinese: string;
    note: string;
  }>;
}

export interface ConceptCard {
  id: string;
  title: string;
  focus: string;
  shortRule: string;
  explanation: string;
  examples: Array<{
    german: string;
    chinese: string;
    highlight?: string;
  }>;
  checkQuestion?: {
    prompt: string;
    answer: string;
    explanation: string;
  };
}

export interface LessonNoun {
  id: string;
  article: "der" | "die" | "das";
  noun: string;
  plural: string;
  dativePlural: string;
  gender: Exclude<Gender, "pl">;
  meaning: string;
  level: "A1" | "A2" | "B1";
  tags: string[];
}

export interface LessonAdjective {
  id: string;
  adjective: string;
  meaning: string;
  level: "A1" | "A2" | "B1";
  tags: string[];
}

export interface SentencePattern {
  id: string;
  prefix: string;
  suffix: string;
  caseName: GermanCase;
  articleType: ArticleType;
  meaning: string;
  caseReason: string;
  level: LessonLevel;
  mode: ExerciseMode;
  allowedNounTags?: string[];
  // Explicit noun whitelist; preferred over tags so frames stay meaningful ("Ich lese ein Buch", not "einen Film").
  allowedNounIds?: string[];
}

export interface LessonExercise {
  id: string;
  stage: number;
  mode: ExerciseMode;
  level: LessonLevel;
  prompt: string;
  questionZh: string;
  given?: {
    noun?: string;
    adjective?: string;
    articleType?: ArticleType;
    caseName?: GermanCase;
  };
  options: string[];
  answer: string;
  answerIndex: number;
  explanation: string[];
  miniRule: string;
  tags: string[];
}

export const LESSON6_META: LessonMeta = {
  id: "lesson-6-adjective-declension",
  title: "Lektion 6｜名詞片語升級",
  subtitle: "冠詞＋形容詞＋名詞變化訓練",
  level: "A2-B1",
  estimatedMinutes: 25,
  tags: ["Adjektive", "Deklination", "Kasus", "Nomenphrase"],
  description:
    "從 Film、Stadt、Buch 開始，練習把名詞加上冠詞與形容詞，並依照 Nominativ、Akkusativ、Dativ 選出正確字尾。",
  goals: [
    "看懂 der schöne Film、einen guten Freund、mit einer kleinen Tasche 這類名詞片語。",
    "能判斷定冠詞、不定冠詞與無冠詞三種情境。",
    "能根據句子角色判斷 Nominativ、Akkusativ、Dativ。",
    "能選出正確的形容詞字尾：-e、-en、-er、-es、-em。",
    "能把簡單句升級成更自然、更完整的德文句子。",
  ],
};

export const ADJECTIVE_DECLENSION_GRAMMAR: GrammarSection[] = [
  {
    id: "what-is-noun-phrase",
    title: "1. 什麼是名詞片語？",
    level: "A2",
    summary: "名詞片語就是以名詞為核心，前面加上冠詞、形容詞或其他修飾語。",
    keyPoint: "德文的形容詞放在名詞前面時，通常要加字尾。",
    explanation: [
      "中文可以說「好電影」、「漂亮城市」，形容詞本身通常不太變。",
      "德文不一樣。當形容詞放在名詞前面時，形容詞字尾會跟著冠詞、性別、格位和單複數改變。",
      "所以不是只背 gut = 好，而是要知道 guter、gute、gutes、guten、gutem 什麼時候出現。",
    ],
    examples: [
      {
        german: "ein guter Film",
        chinese: "一部好電影",
        note: "Film 是陽性，Nominativ，不定冠詞 ein 後形容詞用 guter。",
      },
      {
        german: "eine schöne Stadt",
        chinese: "一座美麗的城市",
        note: "Stadt 是陰性，Nominativ，形容詞用 schöne。",
      },
      {
        german: "mit einem guten Freund",
        chinese: "和一位好朋友一起",
        note: "mit 後面接 Dativ，所以 ein Freund 變成 einem guten Freund。",
      },
    ],
  },
  {
    id: "definite-article",
    title: "2. 定冠詞後的形容詞：der schöne Film",
    level: "A2",
    summary: "der / die / das 已經提供很多資訊，所以形容詞字尾通常比較固定，多為 -e 或 -en。",
    keyPoint: "定冠詞講清楚，形容詞比較輕。",
    explanation: [
      "定冠詞 der、die、das、den、dem、der 已經明確顯示名詞的性別與格位。",
      "因此形容詞不需要承擔太多文法資訊，常見字尾是 -e 或 -en。",
      "最基本可以先記：Nominativ 單數多用 -e；Akkusativ 陽性與 Dativ 幾乎都用 -en。",
    ],
    examples: [
      {
        german: "der gute Film",
        chinese: "那部好電影",
        note: "陽性 Nominativ：der + gute + Film。",
      },
      {
        german: "ich sehe den guten Film",
        chinese: "我看那部好電影",
        note: "sehen 後面的 Film 是 Akkusativ；der Film → den Film；形容詞 guten。",
      },
      {
        german: "mit dem guten Freund",
        chinese: "和那位好朋友一起",
        note: "mit + Dativ；der Freund → dem Freund；形容詞 guten。",
      },
    ],
  },
  {
    id: "indefinite-article",
    title: "3. 不定冠詞後的形容詞：ein guter Film",
    level: "A2-B1",
    summary: "ein 有時候沒有明顯字尾，所以形容詞要幫忙補出性別或格位資訊。",
    keyPoint: "ein 沒講清楚時，形容詞要幫忙講清楚。",
    explanation: [
      "der Film 裡的 der 已經告訴我們：陽性、主格。",
      "但 ein Film 的 ein 看不出明顯陽性主格，所以形容詞要補 -er：ein guter Film。",
      "das Buch 的不定冠詞也是 ein，所以中性 Nominativ 要靠形容詞補 -es：ein gutes Buch。",
      "到了 Akkusativ 陽性時，ein Film 會變成 einen Film，形容詞也要用 -en：einen guten Film。",
    ],
    examples: [
      {
        german: "ein guter Film",
        chinese: "一部好電影",
        note: "陽性 Nominativ：ein + guter + Film。",
      },
      {
        german: "ein gutes Buch",
        chinese: "一本好書",
        note: "中性 Nominativ：ein + gutes + Buch。",
      },
      {
        german: "ich lese ein gutes Buch",
        chinese: "我讀一本好書",
        note: "Buch 是中性，Akkusativ 和 Nominativ 同形，所以仍是 ein gutes Buch。",
      },
      {
        german: "ich sehe einen guten Film",
        chinese: "我看一部好電影",
        note: "Film 是陽性；sehen 後面接 Akkusativ，所以 ein guter Film → einen guten Film。",
      },
    ],
  },
  {
    id: "dativ-phrases",
    title: "4. Dativ 高頻片語：mit einem guten Freund",
    level: "A2-B1",
    summary: "mit、aus、bei、nach、von、zu 後面固定接 Dativ，是第六課最值得大量練習的部分。",
    keyPoint: "看到 mit / aus / bei / nach / von / zu，先想到 Dativ。",
    explanation: [
      "Dativ 對 A2-B1 學習者很容易錯，因為冠詞和形容詞都會一起變。",
      "常見介系詞 mit、aus、bei、nach、von、zu 後面固定接 Dativ。",
      "陽性與中性的 ein 會變成 einem，陰性的 eine 會變成 einer。",
      "不定冠詞 Dativ 後的形容詞大多用 -en：mit einem guten Freund、mit einer netten Lehrerin。",
    ],
    examples: [
      {
        german: "mit einem guten Freund",
        chinese: "和一位好朋友一起",
        note: "mit + Dativ；der Freund → einem Freund；形容詞 guten。",
      },
      {
        german: "aus einer kleinen Stadt",
        chinese: "來自一座小城市",
        note: "aus + Dativ；die Stadt → einer Stadt；形容詞 kleinen。",
      },
      {
        german: "nach einem langen Tag",
        chinese: "在漫長的一天之後",
        note: "nach + Dativ；der Tag → einem Tag；形容詞 langen。",
      },
    ],
  },
  {
    id: "zero-article",
    title: "5. 無冠詞形容詞：starker Kaffee",
    level: "B1",
    summary: "沒有冠詞時，形容詞要承擔更多資訊，字尾會比較明顯。",
    keyPoint: "沒有冠詞，形容詞就要自己表達性別與格位。",
    explanation: [
      "無冠詞常出現在不可數名詞、複數泛稱、材料或抽象概念中。",
      "例如：starker Kaffee、gutes Essen、schöne Bilder。",
      "因為前面沒有 der 或 ein 幫忙，所以形容詞字尾會比較明顯。",
      "第一版可以先把無冠詞當作挑戰題，不需要一開始就全部掌握。",
    ],
    examples: [
      {
        german: "starker Kaffee",
        chinese: "濃咖啡",
        note: "Kaffee 是陽性，無冠詞 Nominativ，形容詞用 starker。",
      },
      {
        german: "ich trinke starken Kaffee",
        chinese: "我喝濃咖啡",
        note: "Kaffee 是陽性，trinken 後接 Akkusativ，形容詞用 starken。",
      },
      {
        german: "mit gutem Kaffee",
        chinese: "用／搭配好咖啡",
        note: "mit + Dativ，無冠詞陽性 Dativ，形容詞用 gutem。",
      },
    ],
  },
];

export const LESSON6_CONCEPT_CARDS: ConceptCard[] = [
  {
    id: "card-01-adjective-endings",
    title: "形容詞不是固定不變的",
    focus: "Adjektivendungen",
    shortRule: "形容詞放在名詞前面時，通常要加字尾。",
    explanation:
      "gut 在字典裡是 gut，但放進句子後可能變成 guter、gute、gutes、guten、gutem。這不是亂變，而是受到冠詞、性別和格位影響。",
    examples: [
      { german: "ein guter Film", chinese: "一部好電影", highlight: "guter" },
      { german: "eine gute Serie", chinese: "一部好影集", highlight: "gute" },
      { german: "ein gutes Buch", chinese: "一本好書", highlight: "gutes" },
    ],
    checkQuestion: {
      prompt: "為什麼不是 ein gut Film？",
      answer: "因為 gut 放在名詞 Film 前面時，要加形容詞字尾。",
      explanation: "Film 是陽性，Nominativ，不定冠詞 ein 後形容詞要用 guter，所以是 ein guter Film。",
    },
  },
  {
    id: "card-02-definite",
    title: "定冠詞後：形容詞比較輕",
    focus: "der / die / das + Adjektiv",
    shortRule: "der / die / das 已經講清楚，形容詞多用 -e 或 -en。",
    explanation:
      "定冠詞已經帶有很多文法資訊，所以形容詞不用再承擔太多。你可以先記：der gute Film、die gute Serie、das gute Buch；但 den guten Film、mit dem guten Freund 要用 guten。",
    examples: [
      { german: "der gute Film", chinese: "那部好電影", highlight: "gute" },
      { german: "den guten Film", chinese: "那部好電影，Akkusativ", highlight: "guten" },
      { german: "mit dem guten Freund", chinese: "和那位好朋友一起", highlight: "guten" },
    ],
  },
  {
    id: "card-03-indefinite",
    title: "不定冠詞後：形容詞要補資訊",
    focus: "ein / eine + Adjektiv",
    shortRule: "ein 有時不明顯，所以形容詞要幫忙補出性別。",
    explanation:
      "ein Film 和 ein Buch 的 ein 長得一樣，所以要靠形容詞區分：ein guter Film，但 ein gutes Buch。這就是為什麼不定冠詞後的字尾比定冠詞後更需要小心。",
    examples: [
      { german: "ein guter Film", chinese: "一部好電影", highlight: "guter" },
      { german: "ein gutes Buch", chinese: "一本好書", highlight: "gutes" },
      { german: "eine gute Stadt", chinese: "一座美麗的城市", highlight: "gute" },
    ],
  },
  {
    id: "card-04-akkusativ-masculine",
    title: "陽性 Akkusativ 是高頻錯誤區",
    focus: "der → den / ein → einen",
    shortRule: "陽性名詞當 Akkusativ 時，冠詞和形容詞常一起變成 -en。",
    explanation:
      "Ich sehe ein guter Film 是錯的。sehen 後面的 Film 是 Akkusativ，而且 Film 是陽性，所以要說 einen guten Film。",
    examples: [
      { german: "Ich sehe einen guten Film.", chinese: "我看一部好電影。", highlight: "einen guten" },
      { german: "Ich kaufe einen starken Kaffee.", chinese: "我買一杯濃咖啡。", highlight: "einen starken" },
      { german: "Ich habe einen langen Tag.", chinese: "我有漫長的一天。", highlight: "einen langen" },
    ],
  },
  {
    id: "card-05-dativ-prepositions",
    title: "看到 mit / aus / bei / nach / von / zu，先想 Dativ",
    focus: "Dativ-Präpositionen",
    shortRule: "這些介系詞後面固定接 Dativ。",
    explanation:
      "Dativ 最實用的入口是介系詞。你先不用從抽象定義開始，而是看到 mit、aus、bei、nach、von、zu 就提醒自己：後面要用 Dativ。",
    examples: [
      { german: "mit einem guten Freund", chinese: "和一位好朋友一起", highlight: "einem guten" },
      { german: "aus einer kleinen Stadt", chinese: "來自一座小城市", highlight: "einer kleinen" },
      { german: "nach einem langen Tag", chinese: "在漫長的一天之後", highlight: "einem langen" },
    ],
  },
];

export const LESSON6_NOUNS: LessonNoun[] = [
  { id: "film", article: "der", noun: "Film", plural: "Filme", dativePlural: "Filmen", gender: "m", meaning: "電影", level: "A1", tags: ["movie", "daily", "thing"] },
  { id: "freund", article: "der", noun: "Freund", plural: "Freunde", dativePlural: "Freunden", gender: "m", meaning: "朋友", level: "A1", tags: ["person", "daily"] },
  { id: "kaffee", article: "der", noun: "Kaffee", plural: "Kaffees", dativePlural: "Kaffees", gender: "m", meaning: "咖啡", level: "A1", tags: ["food", "daily"] },
  { id: "tag", article: "der", noun: "Tag", plural: "Tage", dativePlural: "Tagen", gender: "m", meaning: "日子", level: "A1", tags: ["time", "daily"] },
  { id: "stadt", article: "die", noun: "Stadt", plural: "Städte", dativePlural: "Städten", gender: "f", meaning: "城市", level: "A1", tags: ["travel", "place"] },
  { id: "serie", article: "die", noun: "Serie", plural: "Serien", dativePlural: "Serien", gender: "f", meaning: "影集", level: "A1", tags: ["movie", "daily", "thing"] },
  { id: "lehrerin", article: "die", noun: "Lehrerin", plural: "Lehrerinnen", dativePlural: "Lehrerinnen", gender: "f", meaning: "女老師", level: "A1", tags: ["person", "school"] },
  { id: "frage", article: "die", noun: "Frage", plural: "Fragen", dativePlural: "Fragen", gender: "f", meaning: "問題", level: "A1", tags: ["school", "abstract"] },
  { id: "tasche", article: "die", noun: "Tasche", plural: "Taschen", dativePlural: "Taschen", gender: "f", meaning: "包包", level: "A1", tags: ["daily", "thing"] },
  { id: "buch", article: "das", noun: "Buch", plural: "Bücher", dativePlural: "Büchern", gender: "n", meaning: "書", level: "A1", tags: ["school", "thing"] },
  { id: "brot", article: "das", noun: "Brot", plural: "Brote", dativePlural: "Broten", gender: "n", meaning: "麵包", level: "A1", tags: ["food", "daily"] },
  { id: "cafe", article: "das", noun: "Café", plural: "Cafés", dativePlural: "Cafés", gender: "n", meaning: "咖啡館", level: "A1", tags: ["place", "travel", "daily"] },
  { id: "bild", article: "das", noun: "Bild", plural: "Bilder", dativePlural: "Bildern", gender: "n", meaning: "圖畫、照片", level: "A1", tags: ["art", "thing"] },
  { id: "problem", article: "das", noun: "Problem", plural: "Probleme", dativePlural: "Problemen", gender: "n", meaning: "問題、困難", level: "A2", tags: ["abstract", "school"] },
];

export const LESSON6_ADJECTIVES: LessonAdjective[] = [
  { id: "gut", adjective: "gut", meaning: "好的", level: "A1", tags: ["basic", "positive"] },
  { id: "schoen", adjective: "schön", meaning: "美的、漂亮的", level: "A1", tags: ["basic", "positive"] },
  { id: "klein", adjective: "klein", meaning: "小的", level: "A1", tags: ["basic", "size"] },
  { id: "gross", adjective: "groß", meaning: "大的", level: "A1", tags: ["basic", "size"] },
  { id: "interessant", adjective: "interessant", meaning: "有趣的", level: "A2", tags: ["opinion", "movie"] },
  { id: "langweilig", adjective: "langweilig", meaning: "無聊的", level: "A2", tags: ["opinion", "movie"] },
  { id: "neu", adjective: "neu", meaning: "新的", level: "A1", tags: ["basic"] },
  { id: "alt", adjective: "alt", meaning: "舊的、老的", level: "A1", tags: ["basic"] },
  { id: "lang", adjective: "lang", meaning: "長的", level: "A1", tags: ["time", "size"] },
  { id: "wichtig", adjective: "wichtig", meaning: "重要的", level: "A2", tags: ["school", "abstract"] },
  { id: "lecker", adjective: "lecker", meaning: "好吃的", level: "A1", tags: ["food", "positive"] },
  { id: "stark", adjective: "stark", meaning: "強的、濃的", level: "A2", tags: ["food", "body"] },
  { id: "nett", adjective: "nett", meaning: "親切的", level: "A1", tags: ["person", "positive"] },
  { id: "freundlich", adjective: "freundlich", meaning: "友善的", level: "A2", tags: ["person", "positive"] },
  { id: "bekannt", adjective: "bekannt", meaning: "知名的", level: "A2", tags: ["person", "art"] },
  { id: "schwierig", adjective: "schwierig", meaning: "困難的", level: "A2", tags: ["school", "abstract"] },
];

export const LESSON6_PATTERNS: SentencePattern[] = [
  {
    id: "das-ist-nom-indef",
    prefix: "Das ist ",
    suffix: ".",
    caseName: "nominativ",
    articleType: "indefinite",
    meaning: "這是一個……",
    caseReason: "Das ist ... 後面的名詞片語是在說明主詞是什麼，使用 Nominativ。",
    level: "A2",
    mode: "quick-drill",
  },
  {
    id: "subject-nom-def",
    prefix: "",
    suffix: " gefällt mir sehr.",
    caseName: "nominativ",
    articleType: "definite",
    meaning: "我很喜歡那個……",
    caseReason: "句首的名詞片語是主詞，所以使用 Nominativ。",
    level: "A2",
    mode: "quick-drill",
  },
  {
    id: "ich-sehe-akk-indef",
    allowedNounIds: ["film", "freund", "stadt", "serie", "bild", "cafe", "tasche"],
    prefix: "Ich sehe ",
    suffix: ".",
    caseName: "akkusativ",
    articleType: "indefinite",
    meaning: "我看見／我看一個……",
    caseReason: "sehen 後面的受詞通常是 Akkusativ。",
    level: "A2",
    mode: "case-detective",
  },
  {
    id: "ich-kaufe-akk-indef",
    allowedNounIds: ["tasche", "buch", "brot", "kaffee", "bild"],
    prefix: "Ich kaufe ",
    suffix: ".",
    caseName: "akkusativ",
    articleType: "indefinite",
    meaning: "我買一個……",
    caseReason: "kaufen 後面買的東西是直接受詞，使用 Akkusativ。",
    level: "A2",
    mode: "case-detective",
  },
  {
    id: "ich-lese-akk-indef",
    allowedNounIds: ["buch"],
    prefix: "Ich lese ",
    suffix: ".",
    caseName: "akkusativ",
    articleType: "indefinite",
    meaning: "我讀一本……",
    caseReason: "lesen 後面被閱讀的東西是直接受詞，使用 Akkusativ。",
    level: "A2",
    mode: "case-detective",
  },
  {
    id: "mit-dat-indef",
    allowedNounIds: ["freund", "lehrerin"],
    prefix: "Ich gehe mit ",
    suffix: " ins Kino.",
    caseName: "dativ",
    articleType: "indefinite",
    meaning: "我和一位……去電影院。",
    caseReason: "mit 後面固定接 Dativ。",
    level: "A2-B1",
    mode: "dativ-focus",
  },
  {
    id: "aus-dat-indef",
    allowedNounIds: ["stadt"],
    prefix: "Ich komme aus ",
    suffix: ".",
    caseName: "dativ",
    articleType: "indefinite",
    meaning: "我來自一個……",
    caseReason: "aus 後面固定接 Dativ。",
    level: "A2-B1",
    mode: "dativ-focus",
  },
  {
    id: "nach-dat-indef",
    allowedNounIds: ["tag"],
    prefix: "Nach ",
    suffix: " bin ich müde.",
    caseName: "dativ",
    articleType: "indefinite",
    meaning: "在一個……之後，我很累。",
    caseReason: "nach 後面固定接 Dativ。",
    level: "A2-B1",
    mode: "dativ-focus",
  },
  {
    id: "mit-dat-zero",
    allowedNounIds: ["kaffee", "brot"],
    prefix: "Ich frühstücke mit ",
    suffix: ".",
    caseName: "dativ",
    articleType: "zero",
    meaning: "我早餐配……",
    caseReason: "mit 後面固定接 Dativ；本題是無冠詞挑戰題。",
    level: "B1",
    mode: "dativ-focus",
  },
];

const CASE_ZH: Record<GermanCase, string> = {
  nominativ: "Nominativ 主格",
  akkusativ: "Akkusativ 受格",
  dativ: "Dativ 與格",
};

const GENDER_ZH: Record<Gender, string> = {
  m: "陽性",
  f: "陰性",
  n: "中性",
  pl: "複數",
};

const ARTICLE_TYPE_ZH: Record<ArticleType, string> = {
  definite: "定冠詞 der/die/das",
  indefinite: "不定冠詞 ein/eine",
  zero: "無冠詞",
};

const DEFINITE_ARTICLES: Record<GermanCase, Record<Gender, string>> = {
  nominativ: { m: "der", f: "die", n: "das", pl: "die" },
  akkusativ: { m: "den", f: "die", n: "das", pl: "die" },
  dativ: { m: "dem", f: "der", n: "dem", pl: "den" },
};

const INDEFINITE_ARTICLES: Record<GermanCase, Record<Exclude<Gender, "pl">, string>> = {
  nominativ: { m: "ein", f: "eine", n: "ein" },
  akkusativ: { m: "einen", f: "eine", n: "ein" },
  dativ: { m: "einem", f: "einer", n: "einem" },
};

const DEFINITE_ADJ_ENDINGS: Record<GermanCase, Record<Gender, string>> = {
  nominativ: { m: "e", f: "e", n: "e", pl: "en" },
  akkusativ: { m: "en", f: "e", n: "e", pl: "en" },
  dativ: { m: "en", f: "en", n: "en", pl: "en" },
};

const INDEFINITE_ADJ_ENDINGS: Record<GermanCase, Record<Exclude<Gender, "pl">, string>> = {
  nominativ: { m: "er", f: "e", n: "es" },
  akkusativ: { m: "en", f: "e", n: "es" },
  dativ: { m: "en", f: "en", n: "en" },
};

const ZERO_ARTICLE_ADJ_ENDINGS: Record<GermanCase, Record<Gender, string>> = {
  nominativ: { m: "er", f: "e", n: "es", pl: "e" },
  akkusativ: { m: "en", f: "e", n: "es", pl: "e" },
  dativ: { m: "em", f: "er", n: "em", pl: "en" },
};

function getArticle(articleType: ArticleType, gender: Gender, caseName: GermanCase): string {
  if (articleType === "definite") return DEFINITE_ARTICLES[caseName][gender];
  if (articleType === "zero") return "";
  if (gender === "pl") return "";
  return INDEFINITE_ARTICLES[caseName][gender];
}

function getAdjectiveEnding(articleType: ArticleType, gender: Gender, caseName: GermanCase): string {
  if (articleType === "definite") return DEFINITE_ADJ_ENDINGS[caseName][gender];
  if (articleType === "zero") return ZERO_ARTICLE_ADJ_ENDINGS[caseName][gender];
  if (gender === "pl") return ZERO_ARTICLE_ADJ_ENDINGS[caseName].pl;
  return INDEFINITE_ADJ_ENDINGS[caseName][gender];
}

function getNounForm(noun: LessonNoun, gender: Gender, caseName: GermanCase): string {
  if (gender !== "pl") return noun.noun;
  if (caseName === "dativ") return noun.dativePlural;
  return noun.plural;
}

function buildPhrase(params: {
  noun: LessonNoun;
  adjective: LessonAdjective;
  articleType: ArticleType;
  caseName: GermanCase;
  gender?: Gender;
  forceEnding?: string;
  forceArticle?: string;
}): string {
  const gender = params.gender ?? params.noun.gender;
  const article = params.forceArticle ?? getArticle(params.articleType, gender, params.caseName);
  const ending = params.forceEnding ?? getAdjectiveEnding(params.articleType, gender, params.caseName);
  const nounForm = getNounForm(params.noun, gender, params.caseName);
  return [article, `${params.adjective.adjective}${ending}`, nounForm].filter(Boolean).join(" ");
}

function capitalizePhrase(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function formatPhraseForPrompt(pattern: SentencePattern, phrase: string): string {
  return pattern.prefix.length === 0 ? capitalizePhrase(phrase) : phrase;
}

function uniqueOptions(options: string[]): string[] {
  return Array.from(new Set(options)).slice(0, 4);
}

function rotateAnswer(options: string[], seed: string): { options: string[]; answerIndex: number } {
  const clean = uniqueOptions(options);
  const correct = clean[0];
  while (clean.length < 4) clean.push(`${correct} `);
  const shift = seed.length % 4;
  const rotated = [...clean.slice(shift), ...clean.slice(0, shift)];
  return { options: rotated, answerIndex: rotated.indexOf(correct) };
}

function getCommonWrongEndings(articleType: ArticleType, gender: Gender, caseName: GermanCase): string[] {
  const correct = getAdjectiveEnding(articleType, gender, caseName);
  const pool = ["e", "en", "er", "es", "em"];
  return pool.filter((ending) => ending !== correct).slice(0, 3);
}

function makeExplanation(params: {
  noun: LessonNoun;
  adjective: LessonAdjective;
  pattern: SentencePattern;
  answer: string;
  gender?: Gender;
}): string[] {
  const gender = params.gender ?? params.noun.gender;
  const articleLabel = ARTICLE_TYPE_ZH[params.pattern.articleType];
  const ending = getAdjectiveEnding(params.pattern.articleType, gender, params.pattern.caseName);
  const article = getArticle(params.pattern.articleType, gender, params.pattern.caseName);
  const baseArticle = gender === "pl" ? "die" : params.noun.article;

  return [
    `正解：${params.answer}`,
    `先看名詞：${baseArticle} ${gender === "pl" ? params.noun.plural : params.noun.noun}，這裡是${GENDER_ZH[gender]}。`,
    `再看句子：${params.pattern.caseReason}`,
    `所以本題使用 ${CASE_ZH[params.pattern.caseName]}。`,
    `冠詞類型：${articleLabel}。${article ? `這裡的冠詞是 ${article}。` : "這裡沒有冠詞，形容詞要承擔更多文法資訊。"}`,
    `形容詞 ${params.adjective.adjective} 在這裡加字尾 -${ending}，所以答案是：${params.answer}。`,
  ];
}

function buildExercise(params: {
  id: string;
  stage: number;
  pattern: SentencePattern;
  noun: LessonNoun;
  adjective: LessonAdjective;
  mode?: ExerciseMode;
  gender?: Gender;
}): LessonExercise {
  const gender = params.gender ?? params.noun.gender;
  const correct = formatPhraseForPrompt(params.pattern, buildPhrase({
    noun: params.noun,
    adjective: params.adjective,
    articleType: params.pattern.articleType,
    caseName: params.pattern.caseName,
    gender,
  }));

  const wrongEndings = getCommonWrongEndings(params.pattern.articleType, gender, params.pattern.caseName);
  const wrongByEnding = wrongEndings.map((ending) =>
    formatPhraseForPrompt(params.pattern, buildPhrase({
      noun: params.noun,
      adjective: params.adjective,
      articleType: params.pattern.articleType,
      caseName: params.pattern.caseName,
      gender,
      forceEnding: ending,
    }))
  );

  const wrongCase: GermanCase = params.pattern.caseName === "dativ" ? "akkusativ" : "dativ";
  const wrongByCase = formatPhraseForPrompt(params.pattern, buildPhrase({
    noun: params.noun,
    adjective: params.adjective,
    articleType: params.pattern.articleType,
    caseName: wrongCase,
    gender,
  }));

  const { options, answerIndex } = rotateAnswer([correct, wrongByCase, ...wrongByEnding], params.id);

  return {
    id: params.id,
    stage: params.stage,
    mode: params.mode ?? params.pattern.mode,
    level: params.pattern.level,
    prompt: `${params.pattern.prefix}____${params.pattern.suffix}`,
    questionZh: `${params.pattern.meaning}｜請選出正確的「冠詞＋形容詞＋名詞」。`,
    given: {
      noun: `${params.noun.article} ${params.noun.noun}`,
      adjective: `${params.adjective.adjective}（${params.adjective.meaning}）`,
      articleType: params.pattern.articleType,
      caseName: params.pattern.caseName,
    },
    options,
    answer: correct,
    answerIndex,
    explanation: makeExplanation({
      noun: params.noun,
      adjective: params.adjective,
      pattern: params.pattern,
      answer: correct,
      gender,
    }),
    miniRule:
      params.pattern.caseName === "dativ"
        ? "看到 mit / aus / bei / nach / von / zu，要先想到 Dativ。"
        : params.pattern.caseName === "akkusativ"
          ? "直接受詞多半使用 Akkusativ，陽性名詞變化最明顯。"
          : "主詞或 Das ist ... 後面常用 Nominativ。",
    tags: [params.pattern.caseName, params.pattern.articleType, params.noun.gender, params.adjective.id],
  };
}

// Adjectives that make sense with each noun, so generated phrases never read like "ein leckerer Film".
const NOUN_ADJECTIVES: Record<string, string[]> = {
  film: ["gut", "schoen", "interessant", "langweilig", "neu", "alt", "lang", "wichtig", "bekannt"],
  freund: ["gut", "nett", "freundlich", "alt", "neu"],
  kaffee: ["gut", "stark", "lecker"],
  tag: ["gut", "schoen", "lang", "langweilig", "wichtig", "schwierig"],
  stadt: ["schoen", "klein", "gross", "alt", "neu", "interessant", "bekannt", "langweilig"],
  serie: ["gut", "interessant", "langweilig", "neu", "alt", "lang", "bekannt"],
  lehrerin: ["gut", "nett", "freundlich", "neu", "bekannt"],
  frage: ["gut", "wichtig", "interessant", "schwierig", "klein", "neu"],
  tasche: ["schoen", "klein", "gross", "neu", "alt"],
  buch: ["gut", "interessant", "langweilig", "neu", "alt", "wichtig", "bekannt", "schwierig", "schoen", "lang"],
  brot: ["gut", "lecker"],
  cafe: ["schoen", "klein", "gross", "neu", "alt", "gut", "nett", "bekannt"],
  bild: ["schoen", "gross", "klein", "alt", "neu", "bekannt", "interessant"],
  problem: ["gross", "klein", "neu", "alt", "wichtig", "schwierig"],
};

function nounAllowed(pattern: SentencePattern, noun: LessonNoun): boolean {
  if (pattern.allowedNounIds) return pattern.allowedNounIds.includes(noun.id);
  if (!pattern.allowedNounTags) return true;
  return pattern.allowedNounTags.some((tag) => noun.tags.includes(tag));
}

function buildCoreExercises(): LessonExercise[] {
  const exercises: LessonExercise[] = [];

  const stagePlans: Array<{
    stage: number;
    patternIds: string[];
    nounIds: string[];
    adjectiveIds: string[];
    max: number;
    perPatternMax?: number;
  }> = [
    {
      stage: 2,
      patternIds: ["subject-nom-def"],
      nounIds: ["film", "stadt", "buch", "serie", "bild", "cafe"],
      adjectiveIds: ["neu", "schoen", "interessant", "alt", "klein"],
      max: 24,
    },
    {
      stage: 3,
      patternIds: ["das-ist-nom-indef", "ich-sehe-akk-indef", "ich-kaufe-akk-indef", "ich-lese-akk-indef"],
      nounIds: ["film", "freund", "kaffee", "tag", "stadt", "serie", "tasche", "buch", "brot", "bild", "problem"],
      adjectiveIds: ["gut", "schoen", "klein", "gross", "interessant", "langweilig", "neu", "alt", "wichtig", "lecker", "stark", "bekannt"],
      max: 48,
      perPatternMax: 12,
    },
    {
      stage: 4,
      patternIds: ["mit-dat-indef", "aus-dat-indef", "nach-dat-indef"],
      nounIds: ["freund", "lehrerin", "stadt", "cafe", "tag", "problem"],
      adjectiveIds: ["gut", "nett", "freundlich", "klein", "schoen", "lang", "schwierig", "gross", "alt", "langweilig", "bekannt"],
      max: 32,
      perPatternMax: 12,
    },
    {
      stage: 5,
      patternIds: ["mit-dat-zero"],
      nounIds: ["kaffee", "brot"],
      adjectiveIds: ["gut", "stark", "lecker", "alt"],
      max: 12,
    },
  ];

  for (const plan of stagePlans) {
    let count = 0;
    for (const patternId of plan.patternIds) {
      const pattern = LESSON6_PATTERNS.find((item) => item.id === patternId);
      if (!pattern) continue;
      const nouns = plan.nounIds
        .map((id) => LESSON6_NOUNS.find((item) => item.id === id))
        .filter((noun): noun is LessonNoun => !!noun && nounAllowed(pattern, noun));
      // Only meaningful noun + adjective pairs, taken round-robin so one noun does not fill a whole pattern.
      const byNoun = nouns.map((noun) =>
        plan.adjectiveIds
          .filter((id) => (NOUN_ADJECTIVES[noun.id] || []).includes(id))
          .map((id) => LESSON6_ADJECTIVES.find((item) => item.id === id))
          .filter((adjective): adjective is LessonAdjective => !!adjective)
          .map((adjective) => [noun, adjective] as [LessonNoun, LessonAdjective])
      );
      const pairs: Array<[LessonNoun, LessonAdjective]> = [];
      for (let round = 0; byNoun.some((list) => list[round]); round += 1) {
        for (const list of byNoun) if (list[round]) pairs.push(list[round]);
      }
      let patternCount = 0;
      for (const [noun, adjective] of pairs) {
        if (count >= plan.max) break;
        if (plan.perPatternMax && patternCount >= plan.perPatternMax) break;
        exercises.push(
          buildExercise({
            id: `l6-s${plan.stage}-${patternId}-${noun.id}-${adjective.id}`,
            stage: plan.stage,
            pattern,
            noun,
            adjective,
          })
        );
        count++;
        patternCount++;
      }
    }
  }

  return exercises;
}

export const LESSON6_ZERO_ARTICLE_EXERCISES: LessonExercise[] = [
  {
    id: "l6-zero-01",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich trinke ____.",
    questionZh: "請選出正確的無冠詞片語：我喝濃咖啡。",
    given: { noun: "der Kaffee", adjective: "stark（濃的）", articleType: "zero", caseName: "akkusativ" },
    options: ["starken Kaffee", "starker Kaffee", "starkem Kaffee", "starkes Kaffee"],
    answer: "starken Kaffee",
    answerIndex: 0,
    explanation: [
      "正解：starken Kaffee",
      "Kaffee 是 der Kaffee，陽性名詞。",
      "trinken 後面的 Kaffee 是 Akkusativ。",
      "本題沒有冠詞，所以形容詞要承擔格位資訊。",
      "無冠詞陽性 Akkusativ 用 -en，所以是 starken Kaffee。",
    ],
    miniRule: "無冠詞陽性 Akkusativ：starken Kaffee。",
    tags: ["zero", "akkusativ", "m", "food"],
  },
  {
    id: "l6-zero-02",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich esse ____.",
    questionZh: "請選出正確的無冠詞片語：我吃好吃的麵包。",
    given: { noun: "das Brot", adjective: "lecker（好吃的）", articleType: "zero", caseName: "akkusativ" },
    options: ["leckeres Brot", "leckeren Brot", "leckerem Brot", "leckerer Brot"],
    answer: "leckeres Brot",
    answerIndex: 0,
    explanation: [
      "正解：leckeres Brot",
      "Brot 是 das Brot，中性名詞。",
      "essen 後面的 Brot 是 Akkusativ。",
      "中性 Akkusativ 和 Nominativ 形式相同。",
      "無冠詞中性 Akkusativ 用 -es，所以是 leckeres Brot。",
    ],
    miniRule: "無冠詞中性 Akkusativ：leckeres Brot。",
    tags: ["zero", "akkusativ", "n", "food"],
  },
  {
    id: "l6-zero-03",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "____ ist wichtig.",
    questionZh: "請選出正確的無冠詞片語：好咖啡很重要。",
    given: { noun: "der Kaffee", adjective: "gut（好的）", articleType: "zero", caseName: "nominativ" },
    options: ["Guter Kaffee", "Guten Kaffee", "Gutem Kaffee", "Gutes Kaffee"],
    answer: "Guter Kaffee",
    answerIndex: 0,
    explanation: [
      "正解：Guter Kaffee ist wichtig.",
      "Kaffee 是 der Kaffee，陽性名詞。",
      "句首 Kaffee 是主詞，所以使用 Nominativ。",
      "本題沒有冠詞，所以形容詞要表達陽性主格資訊。",
      "無冠詞陽性 Nominativ 用 -er，所以是 guter Kaffee。",
    ],
    miniRule: "無冠詞陽性 Nominativ：guter Kaffee。",
    tags: ["zero", "nominativ", "m", "food"],
  },
  {
    id: "l6-zero-04",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "____ macht mich glücklich.",
    questionZh: "請選出正確的無冠詞片語：好吃的麵包讓我開心。",
    given: { noun: "das Brot", adjective: "lecker（好吃的）", articleType: "zero", caseName: "nominativ" },
    options: ["Leckeres Brot", "Leckeren Brot", "Leckerem Brot", "Leckerer Brot"],
    answer: "Leckeres Brot",
    answerIndex: 0,
    explanation: [
      "正解：Leckeres Brot macht mich glücklich.",
      "Brot 是 das Brot，中性名詞。",
      "句首 Brot 是主詞，所以使用 Nominativ。",
      "無冠詞中性 Nominativ 用 -es。",
      "所以是 leckeres Brot。",
    ],
    miniRule: "無冠詞中性 Nominativ：leckeres Brot。",
    tags: ["zero", "nominativ", "n", "food"],
  },
  {
    id: "l6-zero-05",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich suche ____.",
    questionZh: "請選出正確的無冠詞片語：我找好資料／好材料。",
    given: { noun: "das Material", adjective: "gut（好的）", articleType: "zero", caseName: "akkusativ" },
    options: ["gutes Material", "guten Material", "gutem Material", "guter Material"],
    answer: "gutes Material",
    answerIndex: 0,
    explanation: [
      "正解：gutes Material",
      "Material 是 das Material，中性名詞。",
      "suchen 後面的 Material 是 Akkusativ。",
      "中性 Akkusativ 形式和 Nominativ 一樣。",
      "無冠詞中性 Akkusativ 用 -es，所以是 gutes Material。",
    ],
    miniRule: "無冠詞中性 Akkusativ：gutes Material。",
    tags: ["zero", "akkusativ", "n", "school"],
  },
  {
    id: "l6-zero-06",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich brauche ____.",
    questionZh: "請選出正確的無冠詞片語：我需要更多時間。",
    given: { noun: "die Zeit", adjective: "mehr（更多的）", articleType: "zero", caseName: "akkusativ" },
    options: ["mehr Zeit", "mehre Zeit", "mehren Zeit", "mehrer Zeit"],
    answer: "mehr Zeit",
    answerIndex: 0,
    explanation: [
      "正解：mehr Zeit",
      "Zeit 是 die Zeit，陰性名詞。",
      "brauchen 後面的 Zeit 是 Akkusativ。",
      "mehr 在這個用法中通常不加一般形容詞字尾。",
      "所以自然說法是 mehr Zeit。",
    ],
    miniRule: "mehr Zeit 是固定常用說法。",
    tags: ["zero", "akkusativ", "f", "time"],
  },
  {
    id: "l6-zero-07",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich arbeite mit ____.",
    questionZh: "請選出正確的無冠詞片語：我使用好材料工作。",
    given: { noun: "das Material", adjective: "gut（好的）", articleType: "zero", caseName: "dativ" },
    options: ["gutem Material", "gutes Material", "guten Material", "guter Material"],
    answer: "gutem Material",
    answerIndex: 0,
    explanation: [
      "正解：gutem Material",
      "Material 是 das Material，中性名詞。",
      "mit 後面固定接 Dativ。",
      "本題沒有冠詞，所以形容詞要承擔 Dativ 資訊。",
      "無冠詞中性 Dativ 用 -em，所以是 gutem Material。",
    ],
    miniRule: "無冠詞中性 Dativ：mit gutem Material。",
    tags: ["zero", "dativ", "n", "school"],
  },
  {
    id: "l6-zero-08",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Nach ____ fühle ich mich besser.",
    questionZh: "請選出正確的無冠詞片語：喝完好咖啡後我感覺比較好。",
    given: { noun: "der Kaffee", adjective: "gut（好的）", articleType: "zero", caseName: "dativ" },
    options: ["gutem Kaffee", "guten Kaffee", "guter Kaffee", "gutes Kaffee"],
    answer: "gutem Kaffee",
    answerIndex: 0,
    explanation: [
      "正解：Nach gutem Kaffee fühle ich mich besser.",
      "Kaffee 是 der Kaffee，陽性名詞。",
      "nach 後面固定接 Dativ。",
      "本題沒有冠詞，所以形容詞要表達陽性 Dativ。",
      "無冠詞陽性 Dativ 用 -em，所以是 gutem Kaffee。",
    ],
    miniRule: "無冠詞陽性 Dativ：nach gutem Kaffee。",
    tags: ["zero", "dativ", "m", "food"],
  },
  {
    id: "l6-zero-09",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Mit ____ kann ich besser lernen.",
    questionZh: "請選出正確的無冠詞複數片語：用好書我可以學得更好。",
    given: { noun: "die Bücher", adjective: "gut（好的）", articleType: "zero", caseName: "dativ" },
    options: ["guten Büchern", "gute Bücher", "gutem Büchern", "guter Bücher"],
    answer: "guten Büchern",
    answerIndex: 0,
    explanation: [
      "正解：Mit guten Büchern kann ich besser lernen.",
      "單數可數名詞（ein Buch）不能省略冠詞，所以這裡用複數 Bücher。",
      "mit 後面固定接 Dativ。",
      "無冠詞複數 Dativ：形容詞用 -en，名詞再加 -n：guten Büchern。",
    ],
    miniRule: "無冠詞複數 Dativ：guten Büchern（形容詞 -en，名詞 -n）。",
    tags: ["zero", "dativ", "pl", "school"],
  },
  {
    id: "l6-zero-10",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich interessiere mich für ____.",
    questionZh: "請選出正確的無冠詞片語：我對現代藝術有興趣。",
    given: { noun: "die Kunst", adjective: "modern（現代的）", articleType: "zero", caseName: "akkusativ" },
    options: ["moderne Kunst", "modernen Kunst", "moderner Kunst", "modernem Kunst"],
    answer: "moderne Kunst",
    answerIndex: 0,
    explanation: [
      "正解：moderne Kunst",
      "Kunst 是 die Kunst，陰性名詞。",
      "für 後面接 Akkusativ。",
      "陰性 Akkusativ 和 Nominativ 形式相同。",
      "無冠詞陰性 Akkusativ 用 -e，所以是 moderne Kunst。",
    ],
    miniRule: "無冠詞陰性 Akkusativ：moderne Kunst。",
    tags: ["zero", "akkusativ", "f", "art"],
  },
  {
    id: "l6-zero-11",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "____ ist schwer zu verstehen.",
    questionZh: "請選出正確的無冠詞片語：德文文法很難理解。",
    given: { noun: "die Grammatik", adjective: "deutsch（德文的）", articleType: "zero", caseName: "nominativ" },
    options: ["Deutsche Grammatik", "Deutschen Grammatik", "Deutscher Grammatik", "Deutschem Grammatik"],
    answer: "Deutsche Grammatik",
    answerIndex: 0,
    explanation: [
      "正解：Deutsche Grammatik ist schwer zu verstehen.",
      "Grammatik 是 die Grammatik，陰性名詞。",
      "句首 Grammatik 是主詞，所以使用 Nominativ。",
      "無冠詞陰性 Nominativ 用 -e。",
      "所以是 deutsche Grammatik。",
    ],
    miniRule: "無冠詞陰性 Nominativ：deutsche Grammatik。",
    tags: ["zero", "nominativ", "f", "grammar"],
  },
  {
    id: "l6-zero-12",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich habe ____ gesehen.",
    questionZh: "請選出正確的無冠詞複數片語：我看過美麗的照片。",
    given: { noun: "die Bilder", adjective: "schön（美的）", articleType: "zero", caseName: "akkusativ" },
    options: ["schöne Bilder", "schönen Bilder", "schönem Bilder", "schöner Bilder"],
    answer: "schöne Bilder",
    answerIndex: 0,
    explanation: [
      "正解：schöne Bilder",
      "Bilder 是複數名詞。",
      "sehen 後面的 Bilder 是 Akkusativ。",
      "複數無冠詞 Akkusativ 的形容詞用 -e。",
      "所以是 schöne Bilder。",
    ],
    miniRule: "無冠詞複數 Akkusativ：schöne Bilder。",
    tags: ["zero", "akkusativ", "pl", "art"],
  },
  {
    id: "l6-zero-13",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Mit ____ kann man Geschichten erzählen.",
    questionZh: "請選出正確的無冠詞複數片語：用美麗的照片可以說故事。",
    given: { noun: "die Bilder", adjective: "schön（美的）", articleType: "zero", caseName: "dativ" },
    options: ["schönen Bildern", "schöne Bilder", "schönem Bildern", "schöner Bilder"],
    answer: "schönen Bildern",
    answerIndex: 0,
    explanation: [
      "正解：Mit schönen Bildern kann man Geschichten erzählen.",
      "Bilder 是複數名詞。",
      "mit 後面固定接 Dativ。",
      "無冠詞複數 Dativ 的形容詞用 -en。",
      "許多複數名詞在 Dativ 還要加 -n，所以 Bilder → Bildern。",
    ],
    miniRule: "複數 Dativ：schönen Bildern。",
    tags: ["zero", "dativ", "pl", "art"],
  },
  {
    id: "l6-zero-14",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "____ helfen beim Lernen.",
    questionZh: "請選出正確的無冠詞複數片語：好問題有助於學習。",
    given: { noun: "die Fragen", adjective: "gut（好的）", articleType: "zero", caseName: "nominativ" },
    options: ["Gute Fragen", "Guten Fragen", "Guter Fragen", "Gutem Fragen"],
    answer: "Gute Fragen",
    answerIndex: 0,
    explanation: [
      "正解：Gute Fragen helfen beim Lernen.",
      "Fragen 是複數名詞。",
      "句首 Fragen 是主詞，所以使用 Nominativ。",
      "無冠詞複數 Nominativ 的形容詞用 -e。",
      "所以是 gute Fragen。",
    ],
    miniRule: "無冠詞複數 Nominativ：gute Fragen。",
    tags: ["zero", "nominativ", "pl", "school"],
  },
  {
    id: "l6-zero-15",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich habe ____ gestellt.",
    questionZh: "請選出正確的無冠詞複數片語：我問了重要的問題。",
    given: { noun: "die Fragen", adjective: "wichtig（重要的）", articleType: "zero", caseName: "akkusativ" },
    options: ["wichtige Fragen", "wichtigen Fragen", "wichtiger Fragen", "wichtigem Fragen"],
    answer: "wichtige Fragen",
    answerIndex: 0,
    explanation: [
      "正解：wichtige Fragen",
      "Fragen 是複數名詞。",
      "stellen 在這裡的受詞是 Fragen，所以使用 Akkusativ。",
      "無冠詞複數 Akkusativ 的形容詞用 -e。",
      "所以是 wichtige Fragen。",
    ],
    miniRule: "無冠詞複數 Akkusativ：wichtige Fragen。",
    tags: ["zero", "akkusativ", "pl", "school"],
  },
  {
    id: "l6-zero-16",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Mit ____ lernt man besser.",
    questionZh: "請選出正確的無冠詞複數片語：用好問題可以學得更好。",
    given: { noun: "die Fragen", adjective: "gut（好的）", articleType: "zero", caseName: "dativ" },
    options: ["guten Fragen", "gute Fragen", "gutem Fragen", "guter Fragen"],
    answer: "guten Fragen",
    answerIndex: 0,
    explanation: [
      "正解：Mit guten Fragen lernt man besser.",
      "Fragen 是複數名詞。",
      "mit 後面固定接 Dativ。",
      "無冠詞複數 Dativ 的形容詞用 -en。",
      "Fragen 本身複數已經是 -n 結尾，所以不需要再額外加 n。",
    ],
    miniRule: "無冠詞複數 Dativ：guten Fragen。",
    tags: ["zero", "dativ", "pl", "school"],
  },
  {
    id: "l6-zero-17",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich mag ____.",
    questionZh: "請選出正確的無冠詞片語：我喜歡現代藝術。",
    given: { noun: "die Kunst", adjective: "modern（現代的）", articleType: "zero", caseName: "akkusativ" },
    options: ["moderne Kunst", "modernen Kunst", "moderner Kunst", "modernem Kunst"],
    answer: "moderne Kunst",
    answerIndex: 0,
    explanation: [
      "正解：moderne Kunst",
      "Kunst 是 die Kunst，陰性名詞。",
      "mögen 後面接 Akkusativ。",
      "陰性 Akkusativ 和 Nominativ 一樣。",
      "無冠詞陰性用 -e，所以是 moderne Kunst。",
    ],
    miniRule: "無冠詞陰性 Akkusativ：moderne Kunst。",
    tags: ["zero", "akkusativ", "f", "art"],
  },
  {
    id: "l6-zero-18",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich trinke ____ nicht gern.",
    questionZh: "請選出正確的無冠詞片語：我不太喜歡喝苦咖啡。",
    given: { noun: "der Kaffee", adjective: "bitter（苦的）", articleType: "zero", caseName: "akkusativ" },
    options: ["bitteren Kaffee", "bitterer Kaffee", "bitterem Kaffee", "bitteres Kaffee"],
    answer: "bitteren Kaffee",
    answerIndex: 0,
    explanation: [
      "正解：bitteren Kaffee",
      "Kaffee 是 der Kaffee，陽性名詞。",
      "trinken 後面的 Kaffee 是 Akkusativ。",
      "本題無冠詞，陽性 Akkusativ 的形容詞用 -en。",
      "所以是 bitteren Kaffee。",
    ],
    miniRule: "無冠詞陽性 Akkusativ：bitteren Kaffee。",
    tags: ["zero", "akkusativ", "m", "food"],
  },
  {
    id: "l6-zero-19",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "____ schmeckt gut.",
    questionZh: "請選出正確的無冠詞片語：新鮮麵包很好吃。",
    given: { noun: "das Brot", adjective: "frisch（新鮮的）", articleType: "zero", caseName: "nominativ" },
    options: ["Frisches Brot", "Frischen Brot", "Frischem Brot", "Frischer Brot"],
    answer: "Frisches Brot",
    answerIndex: 0,
    explanation: [
      "正解：Frisches Brot schmeckt gut.",
      "Brot 是 das Brot，中性名詞。",
      "句首 Brot 是主詞，所以使用 Nominativ。",
      "無冠詞中性 Nominativ 用 -es。",
      "所以是 frisches Brot。",
    ],
    miniRule: "無冠詞中性 Nominativ：frisches Brot。",
    tags: ["zero", "nominativ", "n", "food"],
  },
  {
    id: "l6-zero-20",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich koche gern mit ____.",
    questionZh: "請選出正確的無冠詞片語：我喜歡用新鮮食材料理。",
    given: { noun: "die Zutaten", adjective: "frisch（新鮮的）", articleType: "zero", caseName: "dativ" },
    options: ["frischen Zutaten", "frische Zutaten", "frischer Zutaten", "frischem Zutaten"],
    answer: "frischen Zutaten",
    answerIndex: 0,
    explanation: [
      "正解：frischen Zutaten",
      "Zutaten 是複數名詞。",
      "mit 後面固定接 Dativ。",
      "無冠詞複數 Dativ 的形容詞用 -en。",
      "所以是 frischen Zutaten。",
    ],
    miniRule: "無冠詞複數 Dativ：frischen Zutaten。",
    tags: ["zero", "dativ", "pl", "food"],
  },
  {
    id: "l6-zero-21",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich brauche ____ für den Unterricht.",
    questionZh: "請選出正確的無冠詞片語：我上課需要清楚的例子。",
    given: { noun: "die Beispiele", adjective: "klar（清楚的）", articleType: "zero", caseName: "akkusativ" },
    options: ["klare Beispiele", "klaren Beispiele", "klarem Beispiele", "klarer Beispiele"],
    answer: "klare Beispiele",
    answerIndex: 0,
    explanation: [
      "正解：klare Beispiele",
      "Beispiele 是複數名詞。",
      "brauchen 後面的 Beispiele 是 Akkusativ。",
      "無冠詞複數 Akkusativ 的形容詞用 -e。",
      "所以是 klare Beispiele。",
    ],
    miniRule: "無冠詞複數 Akkusativ：klare Beispiele。",
    tags: ["zero", "akkusativ", "pl", "school"],
  },
  {
    id: "l6-zero-22",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "____ sind hilfreich.",
    questionZh: "請選出正確的無冠詞片語：清楚的例子很有幫助。",
    given: { noun: "die Beispiele", adjective: "klar（清楚的）", articleType: "zero", caseName: "nominativ" },
    options: ["Klare Beispiele", "Klaren Beispiele", "Klarem Beispiele", "Klarer Beispiele"],
    answer: "Klare Beispiele",
    answerIndex: 0,
    explanation: [
      "正解：Klare Beispiele sind hilfreich.",
      "Beispiele 是複數名詞。",
      "句首 Beispiele 是主詞，所以使用 Nominativ。",
      "無冠詞複數 Nominativ 的形容詞用 -e。",
      "所以是 klare Beispiele。",
    ],
    miniRule: "無冠詞複數 Nominativ：klare Beispiele。",
    tags: ["zero", "nominativ", "pl", "school"],
  },
  {
    id: "l6-zero-23",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Mit ____ kann man besser erklären.",
    questionZh: "請選出正確的無冠詞片語：用清楚的例子可以解釋得更好。",
    given: { noun: "die Beispiele", adjective: "klar（清楚的）", articleType: "zero", caseName: "dativ" },
    options: ["klaren Beispielen", "klare Beispiele", "klarem Beispielen", "klarer Beispiele"],
    answer: "klaren Beispielen",
    answerIndex: 0,
    explanation: [
      "正解：Mit klaren Beispielen kann man besser erklären.",
      "Beispiele 是複數名詞。",
      "mit 後面固定接 Dativ。",
      "無冠詞複數 Dativ 的形容詞用 -en。",
      "複數 Dativ 名詞通常也要加 -n，所以 Beispiele → Beispielen。",
    ],
    miniRule: "複數 Dativ：klaren Beispielen。",
    tags: ["zero", "dativ", "pl", "school"],
  },
  {
    id: "l6-zero-24",
    stage: 5,
    mode: "quick-drill",
    level: "B1",
    prompt: "Ich höre gern ____.",
    questionZh: "請選出正確的無冠詞片語：我喜歡聽安靜的音樂。",
    given: { noun: "die Musik", adjective: "ruhig（安靜的）", articleType: "zero", caseName: "akkusativ" },
    options: ["ruhige Musik", "ruhigen Musik", "ruhiger Musik", "ruhigem Musik"],
    answer: "ruhige Musik",
    answerIndex: 0,
    explanation: [
      "正解：ruhige Musik",
      "Musik 是 die Musik，陰性名詞。",
      "hören 後面的 Musik 是 Akkusativ。",
      "陰性 Akkusativ 和 Nominativ 一樣。",
      "無冠詞陰性用 -e，所以是 ruhige Musik。",
    ],
    miniRule: "無冠詞陰性 Akkusativ：ruhige Musik。",
    tags: ["zero", "akkusativ", "f", "daily"],
  },
];

export const LESSON6_ERROR_FIX_EXERCISES: LessonExercise[] = [
  {
    id: "l6-error-01",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Ich sehe ein gute Film.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich sehe einen guten Film.", "Ich sehe ein guter Film.", "Ich sehe einem guten Film.", "Ich sehe eine gute Film."],
    answer: "Ich sehe einen guten Film.",
    answerIndex: 0,
    explanation: [
      "正解：Ich sehe einen guten Film.",
      "Film 是 der Film，陽性名詞。",
      "sehen 後面的 Film 是直接受詞，所以使用 Akkusativ。",
      "陽性 Akkusativ：ein Film → einen Film。",
      "不定冠詞後的形容詞在陽性 Akkusativ 用 -en，所以是 guten。",
    ],
    miniRule: "陽性 Akkusativ 是高頻錯誤：ein guter Film → einen guten Film。",
    tags: ["akkusativ", "indefinite", "m", "error-fix"],
  },
  {
    id: "l6-error-02",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Das ist ein gut Buch.",
    questionZh: "請修正錯誤句子。",
    options: ["Das ist ein gutes Buch.", "Das ist eine gute Buch.", "Das ist einen guten Buch.", "Das ist einem guten Buch."],
    answer: "Das ist ein gutes Buch.",
    answerIndex: 0,
    explanation: [
      "正解：Das ist ein gutes Buch.",
      "Buch 是 das Buch，中性名詞。",
      "Das ist ... 後面用 Nominativ。",
      "中性 Nominativ 的不定冠詞是 ein。",
      "因為 ein 本身沒有明顯中性字尾，所以形容詞要補 -es：gutes。",
    ],
    miniRule: "中性 Nominativ：ein gutes Buch。",
    tags: ["nominativ", "indefinite", "n", "error-fix"],
  },
  {
    id: "l6-error-03",
    stage: 5,
    mode: "error-fix",
    level: "A2-B1",
    prompt: "Ich gehe mit einen guten Freund ins Kino.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich gehe mit einem guten Freund ins Kino.", "Ich gehe mit ein guter Freund ins Kino.", "Ich gehe mit einen guter Freund ins Kino.", "Ich gehe mit eine gute Freund ins Kino."],
    answer: "Ich gehe mit einem guten Freund ins Kino.",
    answerIndex: 0,
    explanation: [
      "正解：Ich gehe mit einem guten Freund ins Kino.",
      "Freund 是 der Freund，陽性名詞。",
      "mit 後面固定接 Dativ。",
      "陽性 Dativ：ein Freund → einem Freund。",
      "Dativ 中不定冠詞後的形容詞用 -en，所以是 guten。",
    ],
    miniRule: "mit + Dativ：mit einem guten Freund。",
    tags: ["dativ", "indefinite", "m", "error-fix"],
  },
  {
    id: "l6-error-04",
    stage: 5,
    mode: "error-fix",
    level: "A2-B1",
    prompt: "Ich komme aus eine kleine Stadt.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich komme aus einer kleinen Stadt.", "Ich komme aus eine kleine Stadt.", "Ich komme aus einen kleinen Stadt.", "Ich komme aus ein kleiner Stadt."],
    answer: "Ich komme aus einer kleinen Stadt.",
    answerIndex: 0,
    explanation: [
      "正解：Ich komme aus einer kleinen Stadt.",
      "Stadt 是 die Stadt，陰性名詞。",
      "aus 後面固定接 Dativ。",
      "陰性 Dativ：eine Stadt → einer Stadt。",
      "Dativ 中形容詞用 -en，所以是 kleinen。",
    ],
    miniRule: "aus + Dativ：aus einer kleinen Stadt。",
    tags: ["dativ", "indefinite", "f", "error-fix"],
  },
  {
    id: "l6-error-05",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Ich lese einen interessantes Buch.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich lese ein interessantes Buch.", "Ich lese einen interessanten Buch.", "Ich lese einem interessanten Buch.", "Ich lese eine interessante Buch."],
    answer: "Ich lese ein interessantes Buch.",
    answerIndex: 0,
    explanation: [
      "正解：Ich lese ein interessantes Buch.",
      "Buch 是 das Buch，中性名詞。",
      "lesen 後面是 Akkusativ，但中性 Akkusativ 和 Nominativ 形式相同。",
      "所以仍然是 ein Buch，不是 einen Buch。",
      "不定冠詞中性後形容詞用 -es：interessantes。",
    ],
    miniRule: "中性 Akkusativ 不變：ein interessantes Buch。",
    tags: ["akkusativ", "indefinite", "n", "error-fix"],
  },
  {
    id: "l6-error-06",
    stage: 5,
    mode: "error-fix",
    level: "A2-B1",
    prompt: "Nach ein langer Tag bin ich müde.",
    questionZh: "請修正錯誤句子。",
    options: ["Nach einem langen Tag bin ich müde.", "Nach einen langen Tag bin ich müde.", "Nach ein langer Tag bin ich müde.", "Nach eine lange Tag bin ich müde."],
    answer: "Nach einem langen Tag bin ich müde.",
    answerIndex: 0,
    explanation: [
      "正解：Nach einem langen Tag bin ich müde.",
      "Tag 是 der Tag，陽性名詞。",
      "nach 後面固定接 Dativ。",
      "陽性 Dativ：ein Tag → einem Tag。",
      "Dativ 中形容詞用 -en，所以是 langen。",
    ],
    miniRule: "nach + Dativ：nach einem langen Tag。",
    tags: ["dativ", "indefinite", "m", "error-fix"],
  },
  {
    id: "l6-error-07",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Die schön Stadt ist sehr alt.",
    questionZh: "請修正錯誤句子。",
    options: ["Die schöne Stadt ist sehr alt.", "Der schöne Stadt ist sehr alt.", "Die schönen Stadt ist sehr alt.", "Das schöne Stadt ist sehr alt."],
    answer: "Die schöne Stadt ist sehr alt.",
    answerIndex: 0,
    explanation: [
      "正解：Die schöne Stadt ist sehr alt.",
      "Stadt 是 die Stadt，陰性名詞。",
      "句首名詞片語是主詞，所以用 Nominativ。",
      "定冠詞陰性 Nominativ 是 die。",
      "定冠詞後形容詞在這裡用 -e：schöne。",
    ],
    miniRule: "die schöne Stadt。",
    tags: ["nominativ", "definite", "f", "error-fix"],
  },
  {
    id: "l6-error-08",
    stage: 5,
    mode: "error-fix",
    level: "A2-B1",
    prompt: "Ich spreche mit die nette Lehrerin.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich spreche mit der netten Lehrerin.", "Ich spreche mit die nette Lehrerin.", "Ich spreche mit den netten Lehrerin.", "Ich spreche mit das nette Lehrerin."],
    answer: "Ich spreche mit der netten Lehrerin.",
    answerIndex: 0,
    explanation: [
      "正解：Ich spreche mit der netten Lehrerin.",
      "Lehrerin 是 die Lehrerin，陰性名詞。",
      "mit 後面固定接 Dativ。",
      "定冠詞陰性 Dativ 是 der。",
      "定冠詞 Dativ 後的形容詞用 -en，所以是 netten。",
    ],
    miniRule: "mit der netten Lehrerin。",
    tags: ["dativ", "definite", "f", "error-fix"],
  },
  {
    id: "l6-error-09",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Ich kaufe ein starken Kaffee.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich kaufe einen starken Kaffee.", "Ich kaufe ein starker Kaffee.", "Ich kaufe einem starken Kaffee.", "Ich kaufe eine starke Kaffee."],
    answer: "Ich kaufe einen starken Kaffee.",
    answerIndex: 0,
    explanation: ["正解：Ich kaufe einen starken Kaffee.", "Kaffee 是 der Kaffee，陽性名詞。", "kaufen 後面的 Kaffee 是 Akkusativ。", "陽性 Akkusativ：ein Kaffee → einen Kaffee。", "形容詞用 -en，所以是 starken。"],
    miniRule: "陽性 Akkusativ：einen starken Kaffee。",
    tags: ["akkusativ", "indefinite", "m", "error-fix"],
  },
  {
    id: "l6-error-10",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Das ist eine schönes Tasche.",
    questionZh: "請修正錯誤句子。",
    options: ["Das ist eine schöne Tasche.", "Das ist ein schönes Tasche.", "Das ist einen schönen Tasche.", "Das ist einer schönen Tasche."],
    answer: "Das ist eine schöne Tasche.",
    answerIndex: 0,
    explanation: ["正解：Das ist eine schöne Tasche.", "Tasche 是 die Tasche，陰性名詞。", "Das ist ... 後面用 Nominativ。", "陰性 Nominativ 的不定冠詞是 eine。", "形容詞用 -e，所以是 schöne。"],
    miniRule: "陰性 Nominativ：eine schöne Tasche。",
    tags: ["nominativ", "indefinite", "f", "error-fix"],
  },
  {
    id: "l6-error-11",
    stage: 5,
    mode: "error-fix",
    level: "A2-B1",
    prompt: "Ich komme aus einem kleine Stadt.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich komme aus einer kleinen Stadt.", "Ich komme aus eine kleine Stadt.", "Ich komme aus einem kleinen Stadt.", "Ich komme aus einen kleinen Stadt."],
    answer: "Ich komme aus einer kleinen Stadt.",
    answerIndex: 0,
    explanation: ["正解：Ich komme aus einer kleinen Stadt.", "Stadt 是 die Stadt，陰性名詞。", "aus 後面固定接 Dativ。", "陰性 Dativ 的不定冠詞是 einer。", "Dativ 形容詞用 -en，所以是 kleinen。"],
    miniRule: "aus einer kleinen Stadt。",
    tags: ["dativ", "indefinite", "f", "error-fix"],
  },
  {
    id: "l6-error-12",
    stage: 5,
    mode: "error-fix",
    level: "A2-B1",
    prompt: "Nach einen langen Tag bin ich müde.",
    questionZh: "請修正錯誤句子。",
    options: ["Nach einem langen Tag bin ich müde.", "Nach einen langen Tag bin ich müde.", "Nach ein langer Tag bin ich müde.", "Nach einer langen Tag bin ich müde."],
    answer: "Nach einem langen Tag bin ich müde.",
    answerIndex: 0,
    explanation: ["正解：Nach einem langen Tag bin ich müde.", "Tag 是 der Tag，陽性名詞。", "nach 後面固定接 Dativ。", "陽性 Dativ 的不定冠詞是 einem。", "Dativ 形容詞用 -en，所以是 langen。"],
    miniRule: "nach einem langen Tag。",
    tags: ["dativ", "indefinite", "m", "error-fix"],
  },
  {
    id: "l6-error-13",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Der interessant Film ist gut.",
    questionZh: "請修正錯誤句子。",
    options: ["Der interessante Film ist gut.", "Der interessanten Film ist gut.", "Den interessanten Film ist gut.", "Das interessante Film ist gut."],
    answer: "Der interessante Film ist gut.",
    answerIndex: 0,
    explanation: ["正解：Der interessante Film ist gut.", "Film 是 der Film，陽性名詞。", "句首 Film 是主詞，所以用 Nominativ。", "定冠詞陽性 Nominativ 是 der。", "定冠詞後形容詞用 -e，所以是 interessante。"],
    miniRule: "der interessante Film。",
    tags: ["nominativ", "definite", "m", "error-fix"],
  },
  {
    id: "l6-error-14",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Ich sehe der interessante Film.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich sehe den interessanten Film.", "Ich sehe der interessante Film.", "Ich sehe dem interessanten Film.", "Ich sehe das interessante Film."],
    answer: "Ich sehe den interessanten Film.",
    answerIndex: 0,
    explanation: ["正解：Ich sehe den interessanten Film.", "Film 是 der Film，陽性名詞。", "sehen 後面的 Film 是 Akkusativ。", "定冠詞陽性 Akkusativ 是 den。", "定冠詞後形容詞用 -en，所以是 interessanten。"],
    miniRule: "den interessanten Film。",
    tags: ["akkusativ", "definite", "m", "error-fix"],
  },
  {
    id: "l6-error-15",
    stage: 5,
    mode: "error-fix",
    level: "A2",
    prompt: "Ich lese eine gutes Buch.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich lese ein gutes Buch.", "Ich lese einen guten Buch.", "Ich lese eine gute Buch.", "Ich lese einem guten Buch."],
    answer: "Ich lese ein gutes Buch.",
    answerIndex: 0,
    explanation: ["正解：Ich lese ein gutes Buch.", "Buch 是 das Buch，中性名詞。", "lesen 後面的 Buch 是 Akkusativ。", "中性 Akkusativ 和 Nominativ 一樣，冠詞是 ein。", "形容詞用 -es，所以是 gutes。"],
    miniRule: "ein gutes Buch。",
    tags: ["akkusativ", "indefinite", "n", "error-fix"],
  },
  {
    id: "l6-error-16",
    stage: 5,
    mode: "error-fix",
    level: "B1",
    prompt: "Ich trinke starker Kaffee.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich trinke starken Kaffee.", "Ich trinke starker Kaffee.", "Ich trinke starkem Kaffee.", "Ich trinke starkes Kaffee."],
    answer: "Ich trinke starken Kaffee.",
    answerIndex: 0,
    explanation: ["正解：Ich trinke starken Kaffee.", "Kaffee 是 der Kaffee，陽性名詞。", "trinken 後面的 Kaffee 是 Akkusativ。", "本題沒有冠詞，所以形容詞要承擔格位資訊。", "無冠詞陽性 Akkusativ 用 -en，所以是 starken。"],
    miniRule: "無冠詞陽性 Akkusativ：starken Kaffee。",
    tags: ["zero", "akkusativ", "m", "error-fix"],
  },
  {
    id: "l6-error-17",
    stage: 5,
    mode: "error-fix",
    level: "B1",
    prompt: "Mit gute Fragen lernt man besser.",
    questionZh: "請修正錯誤句子。",
    options: ["Mit guten Fragen lernt man besser.", "Mit gute Fragen lernt man besser.", "Mit gutem Fragen lernt man besser.", "Mit guter Fragen lernt man besser."],
    answer: "Mit guten Fragen lernt man besser.",
    answerIndex: 0,
    explanation: ["正解：Mit guten Fragen lernt man besser.", "Fragen 是複數名詞。", "mit 後面固定接 Dativ。", "無冠詞複數 Dativ 的形容詞用 -en。", "Fragen 已經以 -n 結尾，不需要再加名詞 n。"],
    miniRule: "無冠詞複數 Dativ：guten Fragen。",
    tags: ["zero", "dativ", "pl", "error-fix"],
  },
  {
    id: "l6-error-18",
    stage: 5,
    mode: "error-fix",
    level: "B1",
    prompt: "Ich habe schönen Bilder gesehen.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich habe schöne Bilder gesehen.", "Ich habe schönen Bilder gesehen.", "Ich habe schönem Bilder gesehen.", "Ich habe schöner Bilder gesehen."],
    answer: "Ich habe schöne Bilder gesehen.",
    answerIndex: 0,
    explanation: ["正解：Ich habe schöne Bilder gesehen.", "Bilder 是複數名詞。", "sehen 的受詞是 Bilder，所以使用 Akkusativ。", "無冠詞複數 Akkusativ 的形容詞用 -e。", "所以是 schöne Bilder。"],
    miniRule: "無冠詞複數 Akkusativ：schöne Bilder。",
    tags: ["zero", "akkusativ", "pl", "error-fix"],
  },
  {
    id: "l6-error-19",
    stage: 5,
    mode: "error-fix",
    level: "B1",
    prompt: "Ich interessiere mich für moderner Kunst.",
    questionZh: "請修正錯誤句子。",
    options: ["Ich interessiere mich für moderne Kunst.", "Ich interessiere mich für moderner Kunst.", "Ich interessiere mich für modernen Kunst.", "Ich interessiere mich für modernem Kunst."],
    answer: "Ich interessiere mich für moderne Kunst.",
    answerIndex: 0,
    explanation: ["正解：Ich interessiere mich für moderne Kunst.", "Kunst 是 die Kunst，陰性名詞。", "für 後面接 Akkusativ。", "陰性 Akkusativ 和 Nominativ 同形。", "無冠詞陰性用 -e，所以是 moderne Kunst。"],
    miniRule: "für moderne Kunst。",
    tags: ["zero", "akkusativ", "f", "error-fix"],
  },
  {
    id: "l6-error-20",
    stage: 5,
    mode: "error-fix",
    level: "B1",
    prompt: "Mit klaren Beispiele kann man besser erklären.",
    questionZh: "請修正錯誤句子。",
    options: ["Mit klaren Beispielen kann man besser erklären.", "Mit klare Beispiele kann man besser erklären.", "Mit klarem Beispiele kann man besser erklären.", "Mit klarer Beispiele kann man besser erklären."],
    answer: "Mit klaren Beispielen kann man besser erklären.",
    answerIndex: 0,
    explanation: ["正解：Mit klaren Beispielen kann man besser erklären.", "Beispiele 是複數名詞。", "mit 後面固定接 Dativ。", "無冠詞複數 Dativ 的形容詞用 -en。", "複數 Dativ 名詞通常也要加 -n，所以 Beispiele → Beispielen。"],
    miniRule: "複數 Dativ：klaren Beispielen。",
    tags: ["zero", "dativ", "pl", "error-fix"],
  },
];

export const LESSON6_SENTENCE_UPGRADE_EXERCISES: LessonExercise[] = [
  {
    id: "l6-upgrade-01",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Ich sehe einen Film.｜加入形容詞 interessant。",
    questionZh: "把句子升級成「我看一部有趣的電影」。",
    options: ["Ich sehe einen interessanten Film.", "Ich sehe ein interessanter Film.", "Ich sehe einem interessanten Film.", "Ich sehe eine interessante Film."],
    answer: "Ich sehe einen interessanten Film.",
    answerIndex: 0,
    explanation: [
      "正解：Ich sehe einen interessanten Film.",
      "Film 是 der Film，陽性。",
      "sehen 後面接 Akkusativ。",
      "陽性 Akkusativ：ein Film → einen Film。",
      "形容詞 interessant 在這裡用 -en：interessanten。",
    ],
    miniRule: "Ich sehe einen interessanten Film.",
    tags: ["sentence-upgrade", "akkusativ", "movie"],
  },
  {
    id: "l6-upgrade-02",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Ich lese ein Buch.｜加入形容詞 wichtig。",
    questionZh: "把句子升級成「我讀一本重要的書」。",
    options: ["Ich lese ein wichtiges Buch.", "Ich lese einen wichtigen Buch.", "Ich lese ein wichtige Buch.", "Ich lese einem wichtigen Buch."],
    answer: "Ich lese ein wichtiges Buch.",
    answerIndex: 0,
    explanation: [
      "正解：Ich lese ein wichtiges Buch.",
      "Buch 是 das Buch，中性。",
      "lesen 後面是 Akkusativ，但中性 Akkusativ 形式和 Nominativ 一樣。",
      "所以冠詞還是 ein。",
      "不定冠詞中性形容詞用 -es：wichtiges。",
    ],
    miniRule: "中性：ein wichtiges Buch。",
    tags: ["sentence-upgrade", "akkusativ", "school"],
  },
  {
    id: "l6-upgrade-03",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2-B1",
    prompt: "Ich komme aus einer Stadt.｜加入形容詞 klein。",
    questionZh: "把句子升級成「我來自一座小城市」。",
    options: ["Ich komme aus einer kleinen Stadt.", "Ich komme aus eine kleine Stadt.", "Ich komme aus einen kleinen Stadt.", "Ich komme aus ein kleiner Stadt."],
    answer: "Ich komme aus einer kleinen Stadt.",
    answerIndex: 0,
    explanation: [
      "正解：Ich komme aus einer kleinen Stadt.",
      "Stadt 是 die Stadt，陰性。",
      "aus 後面固定接 Dativ。",
      "陰性 Dativ：eine Stadt → einer Stadt。",
      "Dativ 中形容詞用 -en：kleinen。",
    ],
    miniRule: "aus einer kleinen Stadt。",
    tags: ["sentence-upgrade", "dativ", "travel"],
  },
  {
    id: "l6-upgrade-04",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2-B1",
    prompt: "Ich gehe mit einem Freund ins Kino.｜加入形容詞 gut。",
    questionZh: "把句子升級成「我和一位好朋友去電影院」。",
    options: ["Ich gehe mit einem guten Freund ins Kino.", "Ich gehe mit einen guten Freund ins Kino.", "Ich gehe mit ein guter Freund ins Kino.", "Ich gehe mit eine gute Freund ins Kino."],
    answer: "Ich gehe mit einem guten Freund ins Kino.",
    answerIndex: 0,
    explanation: [
      "正解：Ich gehe mit einem guten Freund ins Kino.",
      "Freund 是 der Freund，陽性。",
      "mit 後面固定接 Dativ。",
      "陽性 Dativ：ein Freund → einem Freund。",
      "Dativ 中形容詞用 -en：guten。",
    ],
    miniRule: "mit einem guten Freund。",
    tags: ["sentence-upgrade", "dativ", "daily"],
  },
  {
    id: "l6-upgrade-05",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Das ist eine Serie.｜加入形容詞 langweilig。",
    questionZh: "把句子升級成「這是一部無聊的影集」。",
    options: ["Das ist eine langweilige Serie.", "Das ist ein langweiliges Serie.", "Das ist einen langweiligen Serie.", "Das ist einer langweiligen Serie."],
    answer: "Das ist eine langweilige Serie.",
    answerIndex: 0,
    explanation: [
      "正解：Das ist eine langweilige Serie.",
      "Serie 是 die Serie，陰性。",
      "Das ist ... 後面用 Nominativ。",
      "陰性 Nominativ 不定冠詞是 eine。",
      "形容詞用 -e：langweilige。",
    ],
    miniRule: "eine langweilige Serie。",
    tags: ["sentence-upgrade", "nominativ", "movie"],
  },
  {
    id: "l6-upgrade-06",
    stage: 5,
    mode: "sentence-upgrade",
    level: "B1",
    prompt: "Ich trinke Kaffee.｜加入形容詞 stark，使用無冠詞。",
    questionZh: "把句子升級成「我喝濃咖啡」。",
    options: ["Ich trinke starken Kaffee.", "Ich trinke starker Kaffee.", "Ich trinke starkem Kaffee.", "Ich trinke starkes Kaffee."],
    answer: "Ich trinke starken Kaffee.",
    answerIndex: 0,
    explanation: [
      "正解：Ich trinke starken Kaffee.",
      "Kaffee 是 der Kaffee，陽性。",
      "trinken 後面是 Akkusativ。",
      "本題使用無冠詞，所以形容詞要承擔格位資訊。",
      "無冠詞陽性 Akkusativ 用 -en：starken Kaffee。",
    ],
    miniRule: "無冠詞陽性 Akkusativ：starken Kaffee。",
    tags: ["sentence-upgrade", "zero", "akkusativ", "food"],
  },
  {
    id: "l6-upgrade-07",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Das ist ein Café.｜加入形容詞 schön。",
    questionZh: "把句子升級成「這是一間漂亮的咖啡館」。",
    options: ["Das ist ein schönes Café.", "Das ist einen schönen Café.", "Das ist eine schöne Café.", "Das ist einem schönen Café."],
    answer: "Das ist ein schönes Café.",
    answerIndex: 0,
    explanation: ["正解：Das ist ein schönes Café.", "Café 是 das Café，中性。", "Das ist ... 後面用 Nominativ。", "中性不定冠詞是 ein。", "形容詞用 -es，所以是 schönes。"],
    miniRule: "ein schönes Café。",
    tags: ["sentence-upgrade", "nominativ", "n"],
  },
  {
    id: "l6-upgrade-08",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Ich kaufe eine Tasche.｜加入形容詞 neu。",
    questionZh: "把句子升級成「我買一個新包包」。",
    options: ["Ich kaufe eine neue Tasche.", "Ich kaufe ein neues Tasche.", "Ich kaufe einen neuen Tasche.", "Ich kaufe einer neuen Tasche."],
    answer: "Ich kaufe eine neue Tasche.",
    answerIndex: 0,
    explanation: ["正解：Ich kaufe eine neue Tasche.", "Tasche 是 die Tasche，陰性。", "kaufen 後面是 Akkusativ。", "陰性 Akkusativ 和 Nominativ 一樣：eine Tasche。", "形容詞用 -e，所以是 neue。"],
    miniRule: "eine neue Tasche。",
    tags: ["sentence-upgrade", "akkusativ", "f"],
  },
  {
    id: "l6-upgrade-09",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Ich habe eine Frage.｜加入形容詞 wichtig。",
    questionZh: "把句子升級成「我有一個重要問題」。",
    options: ["Ich habe eine wichtige Frage.", "Ich habe ein wichtiges Frage.", "Ich habe einen wichtigen Frage.", "Ich habe einer wichtigen Frage."],
    answer: "Ich habe eine wichtige Frage.",
    answerIndex: 0,
    explanation: ["正解：Ich habe eine wichtige Frage.", "Frage 是 die Frage，陰性。", "haben 後面是 Akkusativ。", "陰性 Akkusativ 和 Nominativ 一樣。", "形容詞用 -e，所以是 wichtige。"],
    miniRule: "eine wichtige Frage。",
    tags: ["sentence-upgrade", "akkusativ", "f"],
  },
  {
    id: "l6-upgrade-10",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2-B1",
    prompt: "Ich spreche mit einer Lehrerin.｜加入形容詞 nett。",
    questionZh: "把句子升級成「我和一位親切的女老師說話」。",
    options: ["Ich spreche mit einer netten Lehrerin.", "Ich spreche mit eine nette Lehrerin.", "Ich spreche mit einen netten Lehrerin.", "Ich spreche mit einem netten Lehrerin."],
    answer: "Ich spreche mit einer netten Lehrerin.",
    answerIndex: 0,
    explanation: ["正解：Ich spreche mit einer netten Lehrerin.", "Lehrerin 是 die Lehrerin，陰性。", "mit 後面固定接 Dativ。", "陰性 Dativ：eine Lehrerin → einer Lehrerin。", "Dativ 形容詞用 -en，所以是 netten。"],
    miniRule: "mit einer netten Lehrerin。",
    tags: ["sentence-upgrade", "dativ", "f"],
  },
  {
    id: "l6-upgrade-11",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2-B1",
    prompt: "Nach einem Tag bin ich müde.｜加入形容詞 lang。",
    questionZh: "把句子升級成「漫長的一天後，我很累」。",
    options: ["Nach einem langen Tag bin ich müde.", "Nach einen langen Tag bin ich müde.", "Nach ein langer Tag bin ich müde.", "Nach einer langen Tag bin ich müde."],
    answer: "Nach einem langen Tag bin ich müde.",
    answerIndex: 0,
    explanation: ["正解：Nach einem langen Tag bin ich müde.", "Tag 是 der Tag，陽性。", "nach 後面固定接 Dativ。", "陽性 Dativ：ein Tag → einem Tag。", "形容詞用 -en，所以是 langen。"],
    miniRule: "nach einem langen Tag。",
    tags: ["sentence-upgrade", "dativ", "m"],
  },
  {
    id: "l6-upgrade-12",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Der Film ist spannend.｜加入形容詞 neu。",
    questionZh: "把句子升級成「那部新電影很精彩」。",
    options: ["Der neue Film ist spannend.", "Der neuen Film ist spannend.", "Den neuen Film ist spannend.", "Dem neuen Film ist spannend."],
    answer: "Der neue Film ist spannend.",
    answerIndex: 0,
    explanation: ["正解：Der neue Film ist spannend.", "Film 是 der Film，陽性。", "句首 Film 是主詞，用 Nominativ。", "定冠詞陽性 Nominativ 是 der。", "形容詞用 -e，所以是 neue。"],
    miniRule: "der neue Film。",
    tags: ["sentence-upgrade", "nominativ", "definite"],
  },
  {
    id: "l6-upgrade-13",
    stage: 5,
    mode: "sentence-upgrade",
    level: "A2",
    prompt: "Ich sehe den Film.｜加入形容詞 neu。",
    questionZh: "把句子升級成「我看那部新電影」。",
    options: ["Ich sehe den neuen Film.", "Ich sehe der neue Film.", "Ich sehe dem neuen Film.", "Ich sehe das neue Film."],
    answer: "Ich sehe den neuen Film.",
    answerIndex: 0,
    explanation: ["正解：Ich sehe den neuen Film.", "Film 是 der Film，陽性。", "sehen 後面接 Akkusativ。", "定冠詞陽性 Akkusativ 是 den。", "形容詞用 -en，所以是 neuen。"],
    miniRule: "den neuen Film。",
    tags: ["sentence-upgrade", "akkusativ", "definite"],
  },
  {
    id: "l6-upgrade-14",
    stage: 5,
    mode: "sentence-upgrade",
    level: "B1",
    prompt: "Ich habe Bilder gesehen.｜加入形容詞 schön，使用複數無冠詞。",
    questionZh: "把句子升級成「我看過美麗的照片」。",
    options: ["Ich habe schöne Bilder gesehen.", "Ich habe schönen Bilder gesehen.", "Ich habe schönem Bilder gesehen.", "Ich habe schöner Bilder gesehen."],
    answer: "Ich habe schöne Bilder gesehen.",
    answerIndex: 0,
    explanation: ["正解：Ich habe schöne Bilder gesehen.", "Bilder 是複數名詞。", "sehen 的受詞是 Bilder，所以用 Akkusativ。", "無冠詞複數 Akkusativ 形容詞用 -e。", "所以是 schöne Bilder。"],
    miniRule: "無冠詞複數 Akkusativ：schöne Bilder。",
    tags: ["sentence-upgrade", "zero", "plural"],
  },
  {
    id: "l6-upgrade-15",
    stage: 5,
    mode: "sentence-upgrade",
    level: "B1",
    prompt: "Mit Bildern kann man Geschichten erzählen.｜加入形容詞 schön，使用複數 Dativ。",
    questionZh: "把句子升級成「用美麗的照片可以說故事」。",
    options: ["Mit schönen Bildern kann man Geschichten erzählen.", "Mit schöne Bilder kann man Geschichten erzählen.", "Mit schönem Bildern kann man Geschichten erzählen.", "Mit schöner Bilder kann man Geschichten erzählen."],
    answer: "Mit schönen Bildern kann man Geschichten erzählen.",
    answerIndex: 0,
    explanation: ["正解：Mit schönen Bildern kann man Geschichten erzählen.", "Bilder 是複數名詞。", "mit 後面固定接 Dativ。", "複數無冠詞 Dativ 形容詞用 -en。", "Dativ 複數名詞加 -n：Bildern。"],
    miniRule: "複數 Dativ：schönen Bildern。",
    tags: ["sentence-upgrade", "zero", "dativ", "plural"],
  },
  {
    id: "l6-upgrade-16",
    stage: 5,
    mode: "sentence-upgrade",
    level: "B1",
    prompt: "Fragen helfen beim Lernen.｜加入形容詞 gut，使用複數無冠詞。",
    questionZh: "把句子升級成「好問題有助於學習」。",
    options: ["Gute Fragen helfen beim Lernen.", "Guten Fragen helfen beim Lernen.", "Gutem Fragen helfen beim Lernen.", "Guter Fragen helfen beim Lernen."],
    answer: "Gute Fragen helfen beim Lernen.",
    answerIndex: 0,
    explanation: ["正解：Gute Fragen helfen beim Lernen.", "Fragen 是複數名詞。", "句首 Fragen 是主詞，所以用 Nominativ。", "無冠詞複數 Nominativ 形容詞用 -e。", "所以是 gute Fragen。"],
    miniRule: "無冠詞複數 Nominativ：gute Fragen。",
    tags: ["sentence-upgrade", "zero", "plural"],
  },
  {
    id: "l6-upgrade-17",
    stage: 5,
    mode: "sentence-upgrade",
    level: "B1",
    prompt: "Ich brauche Beispiele.｜加入形容詞 klar，使用複數無冠詞。",
    questionZh: "把句子升級成「我需要清楚的例子」。",
    options: ["Ich brauche klare Beispiele.", "Ich brauche klaren Beispiele.", "Ich brauche klarem Beispiele.", "Ich brauche klarer Beispiele."],
    answer: "Ich brauche klare Beispiele.",
    answerIndex: 0,
    explanation: ["正解：Ich brauche klare Beispiele.", "Beispiele 是複數名詞。", "brauchen 後面接 Akkusativ。", "無冠詞複數 Akkusativ 形容詞用 -e。", "所以是 klare Beispiele。"],
    miniRule: "無冠詞複數 Akkusativ：klare Beispiele。",
    tags: ["sentence-upgrade", "zero", "plural"],
  },
  {
    id: "l6-upgrade-18",
    stage: 5,
    mode: "sentence-upgrade",
    level: "B1",
    prompt: "Ich höre Musik.｜加入形容詞 ruhig，使用無冠詞。",
    questionZh: "把句子升級成「我聽安靜的音樂」。",
    options: ["Ich höre ruhige Musik.", "Ich höre ruhigen Musik.", "Ich höre ruhiger Musik.", "Ich höre ruhigem Musik."],
    answer: "Ich höre ruhige Musik.",
    answerIndex: 0,
    explanation: ["正解：Ich höre ruhige Musik.", "Musik 是 die Musik，陰性名詞。", "hören 後面的 Musik 是 Akkusativ。", "陰性 Akkusativ 和 Nominativ 同形。", "無冠詞陰性用 -e，所以是 ruhige Musik。"],
    miniRule: "無冠詞陰性 Akkusativ：ruhige Musik。",
    tags: ["sentence-upgrade", "zero", "f"],
  },
];

export const LESSON6_DECLENSION_TABLES = {
  definite: {
    title: "定冠詞後形容詞字尾",
    note: "der/die/das 已經講清楚，所以形容詞多用 -e 或 -en。",
    rows: [
      { caseName: "Nominativ", masculine: "der gute Film", feminine: "die gute Stadt", neuter: "das gute Buch", plural: "die guten Filme" },
      { caseName: "Akkusativ", masculine: "den guten Film", feminine: "die gute Stadt", neuter: "das gute Buch", plural: "die guten Filme" },
      { caseName: "Dativ", masculine: "dem guten Film", feminine: "der guten Stadt", neuter: "dem guten Buch", plural: "den guten Filmen" },
    ],
  },
  indefinite: {
    title: "不定冠詞後形容詞字尾",
    note: "ein 有時不明顯，所以形容詞要補資訊。",
    rows: [
      { caseName: "Nominativ", masculine: "ein guter Film", feminine: "eine gute Stadt", neuter: "ein gutes Buch", plural: "—" },
      { caseName: "Akkusativ", masculine: "einen guten Film", feminine: "eine gute Stadt", neuter: "ein gutes Buch", plural: "—" },
      { caseName: "Dativ", masculine: "einem guten Film", feminine: "einer guten Stadt", neuter: "einem guten Buch", plural: "—" },
    ],
  },
  zero: {
    title: "無冠詞形容詞字尾",
    note: "沒有冠詞時，形容詞要承擔最多資訊。可作為 B1 挑戰題。",
    rows: [
      { caseName: "Nominativ", masculine: "guter Kaffee", feminine: "gute Musik", neuter: "gutes Essen", plural: "gute Filme" },
      { caseName: "Akkusativ", masculine: "guten Kaffee", feminine: "gute Musik", neuter: "gutes Essen", plural: "gute Filme" },
      { caseName: "Dativ", masculine: "gutem Kaffee", feminine: "guter Musik", neuter: "gutem Essen", plural: "guten Filmen" },
    ],
  },
};

export const LESSON6_STUDY_FLOW = [
  {
    step: 1,
    title: "概念暖身",
    minutes: 4,
    description: "看 5 張概念卡，知道形容詞為什麼會有字尾。",
    modes: ["concept"],
  },
  {
    step: 2,
    title: "定冠詞與不定冠詞快速練習",
    minutes: 6,
    description: "先練 der gute Film / ein guter Film / ein gutes Buch。",
    modes: ["quick-drill"],
  },
  {
    step: 3,
    title: "格位偵探",
    minutes: 6,
    description: "從句子角色判斷 Nominativ、Akkusativ、Dativ。",
    modes: ["case-detective"],
  },
  {
    step: 4,
    title: "Dativ 介系詞特訓",
    minutes: 5,
    description: "集中練 mit、aus、nach 等常用 Dativ 結構。",
    modes: ["dativ-focus"],
  },
  {
    step: 5,
    title: "句子升級與錯誤修正",
    minutes: 4,
    description: "把簡單句加上形容詞，並診斷常見錯誤。",
    modes: ["sentence-upgrade", "error-fix"],
  },
];

export const LESSON6_COMMON_MISTAKES = [
  {
    wrong: "Ich sehe ein gute Film.",
    correct: "Ich sehe einen guten Film.",
    reason: "Film 是陽性；sehen 後接 Akkusativ；ein guter Film 要變成 einen guten Film。",
  },
  {
    wrong: "Das ist ein gut Buch.",
    correct: "Das ist ein gutes Buch.",
    reason: "Buch 是中性；不定冠詞 ein 後形容詞要補 -es。",
  },
  {
    wrong: "mit einen guten Freund",
    correct: "mit einem guten Freund",
    reason: "mit 後面固定接 Dativ；陽性 Dativ 是 einem。",
  },
  {
    wrong: "aus eine kleine Stadt",
    correct: "aus einer kleinen Stadt",
    reason: "aus 後面固定接 Dativ；陰性 Dativ 是 einer，形容詞用 kleinen。",
  },
  {
    wrong: "Ich lese einen gutes Buch.",
    correct: "Ich lese ein gutes Buch.",
    reason: "Buch 是中性；中性 Akkusativ 和 Nominativ 同形，不用 einen。",
  },
];

export const LESSON6_EXERCISES: LessonExercise[] = [
  ...buildCoreExercises(),
  ...LESSON6_ZERO_ARTICLE_EXERCISES,
  ...LESSON6_ERROR_FIX_EXERCISES,
  ...LESSON6_SENTENCE_UPGRADE_EXERCISES,
];

export function getLesson6ExercisesByMode(mode: ExerciseMode): LessonExercise[] {
  return LESSON6_EXERCISES.filter((exercise) => exercise.mode === mode);
}

export function getLesson6ExercisesByStage(stage: number): LessonExercise[] {
  return LESSON6_EXERCISES.filter((exercise) => exercise.stage === stage);
}

export function getLesson6Summary() {
  return {
    meta: LESSON6_META,
    grammarSections: ADJECTIVE_DECLENSION_GRAMMAR.length,
    conceptCards: LESSON6_CONCEPT_CARDS.length,
    nouns: LESSON6_NOUNS.length,
    adjectives: LESSON6_ADJECTIVES.length,
    patterns: LESSON6_PATTERNS.length,
    exercises: LESSON6_EXERCISES.length,
    modes: Array.from(new Set(LESSON6_EXERCISES.map((exercise) => exercise.mode))),
  };
}

export default {
  meta: LESSON6_META,
  grammar: ADJECTIVE_DECLENSION_GRAMMAR,
  conceptCards: LESSON6_CONCEPT_CARDS,
  nouns: LESSON6_NOUNS,
  adjectives: LESSON6_ADJECTIVES,
  patterns: LESSON6_PATTERNS,
  declensionTables: LESSON6_DECLENSION_TABLES,
  studyFlow: LESSON6_STUDY_FLOW,
  commonMistakes: LESSON6_COMMON_MISTAKES,
  exercises: LESSON6_EXERCISES,
  getExercisesByMode: getLesson6ExercisesByMode,
  getExercisesByStage: getLesson6ExercisesByStage,
  getSummary: getLesson6Summary,
};
