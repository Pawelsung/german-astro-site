import fs from 'node:fs';

const sourcePath = '擴充資料/lesson5_connectors_question_bank.json';
const targetPath = 'src/data/connectors-question-bank.json';

const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const extraConnectors = [
  ['oder', 'oder', '或者', 'A1', 'coordinating', 'normal_v2', 'Möchtest du Tee oder trinkst du lieber Kaffee?', '你要茶，還是比較想喝咖啡？', '選擇關係，不改語序。', []],
  ['dass', 'dass', '說明、引出內容', 'A2', 'subordinating', 'verb_final', 'Ich weiß, dass Deutsch Zeit braucht.', '我知道德文需要時間。', '常接在 wissen, sagen, glauben, hoffen 後面。', ['weil', 'ob']],
  ['da', 'da', '因為、既然', 'B1', 'subordinating', 'verb_final', 'Da ich heute müde bin, lerne ich nur kurz.', '既然我今天累了，我只短暫學一下。', '比 weil 書面或背景原因感更強；子句動詞最後。', ['weil', 'denn']],
  ['deswegen', 'deswegen', '所以、因此', 'A2', 'connector_adverb', 'inversion_v2', 'Ich habe morgen eine Prüfung. Deswegen wiederhole ich die Regeln.', '我明天有考試，所以我複習規則。', '連接副詞，句首後倒裝。', ['deshalb', 'weil']],
  ['darum', 'darum', '所以、因此', 'B1', 'connector_adverb', 'inversion_v2', 'Der Satz ist lang. Darum markiere ich zuerst das Verb.', '句子很長，所以我先標出動詞。', '口語常見，功能接近 deshalb。', ['deshalb', 'deswegen']],
  ['jedoch', 'jedoch', '然而、但是', 'B1', 'connector_adverb', 'inversion_v2', 'Die Regel ist einfach. Jedoch machen viele Lernende denselben Fehler.', '規則很簡單，然而很多學習者犯同樣的錯。', '較正式；句首時要倒裝。', ['aber', 'trotzdem']],
  ['dennoch', 'dennoch', '儘管如此、然而仍然', 'B1', 'connector_adverb', 'inversion_v2', 'Die Aufgabe ist schwer. Dennoch versuche ich es.', '題目很難，儘管如此我還是試試。', '功能接近 trotzdem，語氣較書面。', ['trotzdem', 'obwohl']],
  ['bevor', 'bevor', '在……之前', 'A2', 'subordinating', 'verb_final', 'Bevor ich antworte, lese ich den Satz noch einmal.', '我回答前，再讀一次句子。', '時間子句，動詞最後。', ['nachdem']],
  ['nachdem', 'nachdem', '在……之後', 'B1', 'subordinating', 'verb_final', 'Nachdem ich die Regel verstanden habe, übe ich Beispiele.', '我理解規則後，練習例句。', '常搭配完成式或時間先後。', ['bevor']],
  ['während', 'während', '當……期間；而', 'B1', 'subordinating', 'verb_final', 'Während ich koche, höre ich deutsche Podcasts.', '我煮飯時聽德文 podcast。', '可表示同時發生，也可表示對比。', ['wenn', 'als']],
  ['seitdem', 'seitdem', '自從……以來', 'B1', 'subordinating', 'verb_final', 'Seitdem ich jeden Tag lese, verstehe ich schneller.', '自從我每天閱讀後，理解更快。', '表示從過去某點到現在的持續影響。', ['seit']],
  ['bis', 'bis', '直到', 'A2', 'subordinating', 'verb_final', 'Ich warte, bis der Kurs beginnt.', '我等到課程開始。', '指出動作持續到某個時間點。', []],
  ['sobald', 'sobald', '一……就……', 'B1', 'subordinating', 'verb_final', 'Sobald ich Zeit habe, wiederhole ich die Karten.', '我一有時間就複習卡片。', '時間條件很明確，子句動詞最後。', ['wenn']],
  ['falls', 'falls', '萬一、如果', 'B1', 'subordinating', 'verb_final', 'Falls du unsicher bist, prüfe zuerst die Verbposition.', '如果你不確定，先檢查動詞位置。', '比 wenn 更像假設或備案。', ['wenn', 'ob']],
  ['sofern', 'sofern', '只要、前提是', 'B2', 'subordinating', 'verb_final', 'Du kannst den Satz umbauen, sofern die Bedeutung gleich bleibt.', '只要意思不變，你可以重組句子。', '較正式，表示條件限制。', ['falls', 'wenn']],
  ['indem', 'indem', '藉由、透過', 'B1', 'subordinating', 'verb_final', 'Ich lerne Konnektoren, indem ich eigene Sätze schreibe.', '我透過自己寫句子學連接詞。', '表示方法或手段。', []],
  ['ohne_zu', 'ohne ... zu', '沒有……就……', 'B1', 'infinitive_construction', 'zu_infinitive', 'Er antwortet, ohne lange nachzudenken.', '他沒有想很久就回答。', '主詞相同時用 ohne ... zu。', ['ohne dass']],
  ['anstatt_zu', 'anstatt ... zu', '不……而是……', 'B1', 'infinitive_construction', 'zu_infinitive', 'Sie schreibt Beispiele, anstatt nur Regeln zu lesen.', '她寫例句，而不是只讀規則。', '主詞相同時用 anstatt ... zu。', ['sondern']],
  ['sowohl_als_auch', 'sowohl ... als auch', '既……又……', 'B1', 'paired_connector', 'depends_on_pattern', 'Er übt sowohl Grammatik als auch Aussprache.', '他既練文法也練發音。', '並列兩個同等項目。', ['nicht nur ... sondern auch']],
  ['entweder_oder', 'entweder ... oder', '不是……就是……', 'B1', 'paired_connector', 'depends_on_pattern', 'Entweder übe ich heute Satzbau oder ich wiederhole Vokabeln.', '我今天不是練句構，就是複習單字。', '二選一。', []],
  ['weder_noch', 'weder ... noch', '既不……也不……', 'B1', 'paired_connector', 'depends_on_pattern', 'Der Satz ist weder natürlich noch korrekt.', '這句子既不自然也不正確。', '否定兩個項目；動詞仍依句子結構變化。', []],
  ['zwar_aber', 'zwar ... aber', '雖然……但是……', 'B1', 'paired_connector', 'depends_on_pattern', 'Die Regel ist zwar kurz, aber sie ist wichtig.', '這規則雖然短，但是重要。', '承認前半，重點落在 aber 後面。', ['obwohl', 'trotzdem']],
  ['einerseits_andererseits', 'einerseits ... andererseits', '一方面……另一方面……', 'B2', 'paired_connector', 'depends_on_pattern', 'Einerseits ist Deutsch logisch, andererseits braucht es viel Übung.', '德文一方面很有邏輯，另一方面需要大量練習。', '用來平衡兩個觀點。', []]
].map(([id, word, meaningZh, level, syntaxType, verbPosition, exampleDe, exampleZh, usageNoteZh, confusableWith]) => ({
  id,
  word,
  meaningZh,
  level,
  syntaxType,
  verbPosition,
  exampleDe,
  exampleZh,
  usageNoteZh,
  confusableWith
}));

const optionsSyntax = [
  { id: 'coordinating', textZh: '並列連接詞：不改語序' },
  { id: 'connector_adverb', textZh: '連接副詞：後面主句倒裝' },
  { id: 'subordinating', textZh: '子句連接詞：動詞放最後' },
  { id: 'infinitive_construction', textZh: '不定詞結構：zu + 原形' },
  { id: 'paired_connector', textZh: '成對連接詞' }
];

const extraQuestions = [
  { id: 'lc5-q020', type: 'classify_syntax', moduleId: 'm1-overview', level: 'A2', promptZh: '「denn」通常屬於哪一種語序類型？', promptDe: 'denn', options: optionsSyntax, answer: 'coordinating', explanationZh: 'denn 表示原因，但後面仍是主句語序，不把動詞推到句尾。' },
  { id: 'lc5-q021', type: 'classify_syntax', moduleId: 'm1-overview', level: 'B1', promptZh: '「jedoch」放句首時通常屬於哪一種語序類型？', promptDe: 'jedoch', options: optionsSyntax, answer: 'connector_adverb', explanationZh: 'jedoch 作連接副詞放第一位時，後面變位動詞要在第二位。' },
  { id: 'lc5-q022', type: 'classify_syntax', moduleId: 'm1-overview', level: 'B1', promptZh: '「ohne ... zu」屬於哪一種結構？', promptDe: 'ohne ... zu', options: optionsSyntax, answer: 'infinitive_construction', explanationZh: 'ohne ... zu 是不定詞結構，後面接 zu + 動詞原形。' },
  { id: 'lc5-q023', type: 'choose_connector', moduleId: 'm2-reason-result', level: 'A2', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: 'Ich gehe früh schlafen, ___ ich morgen früh aufstehen muss.', options: [{ id: 'weil', text: 'weil' }, { id: 'deshalb', text: 'deshalb' }, { id: 'trotzdem', text: 'trotzdem' }, { id: 'oder', text: 'oder' }], answer: 'weil', explanationZh: '後半句提供原因，而且 muss 在子句句尾。' },
  { id: 'lc5-q024', type: 'choose_connector', moduleId: 'm2-reason-result', level: 'A2', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: 'Ich muss morgen früh aufstehen, ___ gehe ich heute früh schlafen.', options: [{ id: 'denn', text: 'denn' }, { id: 'deshalb', text: 'deshalb' }, { id: 'weil', text: 'weil' }, { id: 'obwohl', text: 'obwohl' }], answer: 'deshalb', explanationZh: '前句是原因，後句是結果；deshalb 句首後要倒裝。' },
  { id: 'lc5-q025', type: 'choose_connector', moduleId: 'm2-reason-result', level: 'B1', promptZh: '請選出最自然的書面原因連接詞。', sentenceWithBlank: '___ die Anmeldung geschlossen ist, können wir keine neuen Teilnehmer aufnehmen.', options: [{ id: 'Da', text: 'Da' }, { id: 'Denn', text: 'Denn' }, { id: 'Deshalb', text: 'Deshalb' }, { id: 'Trotzdem', text: 'Trotzdem' }], answer: 'Da', explanationZh: 'Da 可放句首帶出背景原因，子句動詞 ist 放最後。' },
  { id: 'lc5-q026', type: 'choose_connector', moduleId: 'm3-contrast-concession', level: 'A2', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: 'Ich möchte mitkommen, ___ ich habe keine Zeit.', options: [{ id: 'aber', text: 'aber' }, { id: 'sondern', text: 'sondern' }, { id: 'weil', text: 'weil' }, { id: 'deshalb', text: 'deshalb' }], answer: 'aber', explanationZh: '這是一般轉折，aber 不改語序。' },
  { id: 'lc5-q027', type: 'choose_connector', moduleId: 'm3-contrast-concession', level: 'A2', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: 'Das ist nicht ein Fehler, ___ eine Variante.', options: [{ id: 'aber', text: 'aber' }, { id: 'sondern', text: 'sondern' }, { id: 'obwohl', text: 'obwohl' }, { id: 'trotzdem', text: 'trotzdem' }], answer: 'sondern', explanationZh: '前面有否定 nicht，後面修正內容，用 sondern。' },
  { id: 'lc5-q028', type: 'choose_connector', moduleId: 'm3-contrast-concession', level: 'B1', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: 'Die Regel ist bekannt. ___ wird sie oft vergessen.', options: [{ id: 'Jedoch', text: 'Jedoch' }, { id: 'Aber', text: 'Aber' }, { id: 'Weil', text: 'Weil' }, { id: 'Sondern', text: 'Sondern' }], answer: 'Jedoch', explanationZh: 'jedoch 放句首時作連接副詞，後面 wird sie 倒裝。' },
  { id: 'lc5-q029', type: 'choose_connector', moduleId: 'm4-time', level: 'A2', promptZh: '請選出最適合的時間連接詞。', sentenceWithBlank: '___ ich nach Hause komme, mache ich die Hausaufgaben.', options: [{ id: 'Wenn', text: 'Wenn' }, { id: 'Als', text: 'Als' }, { id: 'Ob', text: 'Ob' }, { id: 'Denn', text: 'Denn' }], answer: 'Wenn', explanationZh: '現在或未來的條件/時間用 wenn。' },
  { id: 'lc5-q030', type: 'choose_connector', moduleId: 'm4-time', level: 'A2', promptZh: '請選出最適合的時間連接詞。', sentenceWithBlank: '___ ich antworte, lese ich den Satz genau.', options: [{ id: 'Bevor', text: 'Bevor' }, { id: 'Nachdem', text: 'Nachdem' }, { id: 'Deshalb', text: 'Deshalb' }, { id: 'Sondern', text: 'Sondern' }], answer: 'Bevor', explanationZh: '先讀句子，再回答；回答之前用 bevor。' },
  { id: 'lc5-q031', type: 'choose_connector', moduleId: 'm4-time', level: 'B1', promptZh: '請選出最適合的時間連接詞。', sentenceWithBlank: '___ ich die Erklärung gelesen habe, verstehe ich den Satz besser.', options: [{ id: 'Nachdem', text: 'Nachdem' }, { id: 'Bevor', text: 'Bevor' }, { id: 'Obwohl', text: 'Obwohl' }, { id: 'Oder', text: 'Oder' }], answer: 'Nachdem', explanationZh: '先讀解釋，之後更理解，用 nachdem。' },
  { id: 'lc5-q032', type: 'choose_connector', moduleId: 'm5-purpose-condition-method', level: 'B1', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: 'Ich verbessere meinen Satz, ___ ich die Verbposition prüfe.', options: [{ id: 'indem', text: 'indem' }, { id: 'damit', text: 'damit' }, { id: 'obwohl', text: 'obwohl' }, { id: 'sondern', text: 'sondern' }], answer: 'indem', explanationZh: '後半句說明方法：藉由檢查動詞位置。' },
  { id: 'lc5-q033', type: 'choose_connector', moduleId: 'm5-purpose-condition-method', level: 'B1', promptZh: '請選出最適合的連接詞。', sentenceWithBlank: '___ du Zeit hast, können wir zusammen üben.', options: [{ id: 'Falls', text: 'Falls' }, { id: 'Denn', text: 'Denn' }, { id: 'Trotzdem', text: 'Trotzdem' }, { id: 'Sondern', text: 'Sondern' }], answer: 'Falls', explanationZh: 'falls 表示假設條件，子句動詞放最後。' },
  { id: 'lc5-q034', type: 'choose_connector', moduleId: 'm5-purpose-condition-method', level: 'B1', promptZh: '請選出最適合的不定詞結構。', sentenceWithBlank: 'Sie macht Notizen, ___ die Regel zu vergessen.', options: [{ id: 'ohne', text: 'ohne' }, { id: 'damit', text: 'damit' }, { id: 'weil', text: 'weil' }, { id: 'denn', text: 'denn' }], answer: 'ohne', explanationZh: 'ohne ... zu 表示「沒有……就……」，主詞相同時可用不定詞結構。' },
  { id: 'lc5-q035', type: 'order_words', moduleId: 'm3-contrast-concession', level: 'A2', promptZh: '請把詞塊排成正確句子。', tokens: ['Obwohl', 'es', 'regnet', 'gehe', 'ich', 'raus'], answer: ['Obwohl', 'es', 'regnet', 'gehe', 'ich', 'raus'], answerText: 'Obwohl es regnet, gehe ich raus.', explanationZh: 'obwohl 子句在前，regnet 在子句句尾；後面主句 gehe ich 倒裝。' },
  { id: 'lc5-q036', type: 'order_words', moduleId: 'm4-time', level: 'A2', promptZh: '請把詞塊排成正確句子。', tokens: ['Wenn', 'ich', 'Zeit', 'habe', 'lerne', 'ich', 'Deutsch'], answer: ['Wenn', 'ich', 'Zeit', 'habe', 'lerne', 'ich', 'Deutsch'], answerText: 'Wenn ich Zeit habe, lerne ich Deutsch.', explanationZh: 'wenn 子句動詞 habe 放最後；子句在前時，主句動詞 lerne 接著出現。' },
  { id: 'lc5-q037', type: 'order_words', moduleId: 'm5-purpose-condition-method', level: 'A2', promptZh: '請把詞塊排成正確句子。', tokens: ['um', 'besser', 'zu', 'sprechen'], answer: ['um', 'besser', 'zu', 'sprechen'], answerText: 'um besser zu sprechen.', explanationZh: 'um ... zu 後面接動詞原形，zu 放在動詞前。' },
  { id: 'lc5-q038', type: 'error_correction', moduleId: 'm2-reason-result', level: 'A2', promptZh: '請找出錯誤並改正。', wrongSentence: 'Ich bin krank, denn ich zu Hause bleibe.', answer: 'Ich bin krank, denn ich bleibe zu Hause.', explanationZh: 'denn 後面維持主句語序：ich bleibe，不是動詞句尾。' },
  { id: 'lc5-q039', type: 'error_correction', moduleId: 'm3-contrast-concession', level: 'B1', promptZh: '請找出錯誤並改正。', wrongSentence: 'Jedoch sie versteht die Regel nicht.', answer: 'Jedoch versteht sie die Regel nicht.', explanationZh: 'jedoch 放句首佔第一位，變位動詞 versteht 要在第二位。' },
  { id: 'lc5-q040', type: 'error_correction', moduleId: 'm4-time', level: 'B1', promptZh: '請找出錯誤並改正。', wrongSentence: 'Bevor ich antworte, ich lese den Satz.', answer: 'Bevor ich antworte, lese ich den Satz.', explanationZh: '子句放句首時，後面主句要倒裝：lese ich。' },
  { id: 'lc5-q041', type: 'error_correction', moduleId: 'm5-purpose-condition-method', level: 'A2', promptZh: '請找出錯誤並改正。', wrongSentence: 'Ich lerne Deutsch, damit in Deutschland zu arbeiten.', answer: 'Ich lerne Deutsch, um in Deutschland zu arbeiten.', explanationZh: '主詞相同時用 um ... zu；damit 後面需要完整子句。' },
  { id: 'lc5-q042', type: 'transform_sentence', moduleId: 'm2-reason-result', level: 'A2', promptZh: '請用「denn」改寫句子。', sourceSentence: 'Ich bleibe zu Hause, weil ich krank bin.', targetPattern: 'denn', sampleAnswer: 'Ich bleibe zu Hause, denn ich bin krank.', explanationZh: 'denn 表原因但後面是主句語序：ich bin krank。' },
  { id: 'lc5-q043', type: 'transform_sentence', moduleId: 'm4-time', level: 'B1', promptZh: '請用「nachdem」合併句子。', sourceSentence: 'Ich habe die Regel gelesen. Ich mache die Übung.', targetPattern: 'nachdem', sampleAnswer: 'Nachdem ich die Regel gelesen habe, mache ich die Übung.', explanationZh: 'nachdem 子句表先發生的事，完成式助動詞 habe 放句尾。' },
  { id: 'lc5-q044', type: 'transform_sentence', moduleId: 'm5-purpose-condition-method', level: 'B1', promptZh: '請用「indem」改寫句子。', sourceSentence: 'Ich markiere das Verb. So finde ich die richtige Satzstellung.', targetPattern: 'indem', sampleAnswer: 'Ich finde die richtige Satzstellung, indem ich das Verb markiere.', explanationZh: 'indem 表示方法：透過標記動詞找出語序。' },
  { id: 'lc5-q045', type: 'sentence_builder', moduleId: 'm6-paired', level: 'B1', promptZh: '請用成對連接詞完成句子。', sourceSentence: 'Grammatik / Aussprache', targetPattern: 'sowohl ... als auch', sampleAnswer: 'Ich übe sowohl Grammatik als auch Aussprache.', explanationZh: 'sowohl ... als auch 連接兩個同等項目。' },
  { id: 'lc5-q046', type: 'choose_connector', moduleId: 'm6-paired', level: 'B1', promptZh: '請選出最適合的成對連接詞。', sentenceWithBlank: '___ ist die Regel wichtig, ___ braucht sie viele Beispiele.', options: [{ id: 'Einerseits...andererseits', text: 'Einerseits ... andererseits' }, { id: 'Weil...deshalb', text: 'Weil ... deshalb' }, { id: 'Obwohl...trotzdem', text: 'Obwohl ... trotzdem' }, { id: 'Nicht...oder', text: 'Nicht ... oder' }], answer: 'Einerseits...andererseits', explanationZh: '這裡平衡兩個觀點，用 einerseits ... andererseits。' },
  { id: 'lc5-q047', type: 'cloze', moduleId: 'm7-mixed-challenge', level: 'B2', promptZh: '請在短文中填入合適的連接詞。', textWithBlanks: '___ ich die Grammatik schon kenne, mache ich Fehler. ___ prüfe ich jeden Satz: zuerst das Verb, ___ die Satzstellung klar wird.', blanks: [{ blankIndex: 1, answer: 'Obwohl', options: ['Obwohl', 'Deshalb', 'Denn', 'Sondern'] }, { blankIndex: 2, answer: 'Deshalb', options: ['Deshalb', 'Weil', 'Als', 'Oder'] }, { blankIndex: 3, answer: 'damit', options: ['damit', 'denn', 'trotzdem', 'aber'] }], fullAnswer: 'Obwohl ich die Grammatik schon kenne, mache ich Fehler. Deshalb prüfe ich jeden Satz: zuerst das Verb, damit die Satzstellung klar wird.', explanationZh: '短文整合讓步、結果與目的。' },
  { id: 'lc5-q048', type: 'choose_connector', moduleId: 'm7-mixed-challenge', level: 'B2', promptZh: '哪一句語序正確？', options: [{ id: 'a', text: 'Obwohl ich müde bin, lerne ich weiter.' }, { id: 'b', text: 'Obwohl ich bin müde, lerne ich weiter.' }, { id: 'c', text: 'Obwohl ich müde bin, ich lerne weiter.' }, { id: 'd', text: 'Obwohl ich müde bin, trotzdem lerne ich weiter.' }], answer: 'a', explanationZh: 'obwohl 子句動詞 bin 在句尾；子句在前時，主句 lerne ich 倒裝；不要再加 trotzdem。' }
];

data.meta.version = '1.1.0';
data.meta.updatedFor = 'writer-analysis-and-practice-mvp';
data.meta.targetPath = targetPath;
data.connectors = [...data.connectors, ...extraConnectors];
data.questions = [...data.questions, ...extraQuestions];

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync(targetPath, `${JSON.stringify(data, null, 2)}\n`);
