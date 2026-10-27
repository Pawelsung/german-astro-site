// Lesson 7: Konjunktiv II (B1). Form drills are generated from KONJUNKTIV_VERBS in src/lib/konjunktiv.mjs;
// the usage exercises below are hand-written. options[0] is always the answer (the trainer shuffles them).

export type KonjunktivStage = 'polite' | 'wish' | 'advice' | 'condition' | 'transform' | 'function' | 'advanced';

export interface KonjunktivExercise {
  id: string;
  stage: KonjunktivStage;
  level: 'A2' | 'B1' | 'B1+';
  // Indicative situation the item starts from (polite and transform items).
  fact?: string;
  // Sentence with one ___ blank; for function items the whole sentence, without a blank.
  sentence?: string;
  options: string[];
  trans: string;
  explain: string;
}

export const FUNCTIONS = ['禮貌請求', '願望', '建議', '非現實條件'];

export const STAGES: { id: KonjunktivStage | 'forms'; label: string; hint: string }[] = [
  { id: 'forms', label: '形式', hint: '選出正確的 Konjunktiv II 形式' },
  { id: 'polite', label: '禮貌請求', hint: '把句子改成更客氣的說法' },
  { id: 'wish', label: '願望', hint: '表達「要是……就好了」' },
  { id: 'advice', label: '建議', hint: '給別人建議' },
  { id: 'condition', label: '非現實條件', hint: 'Wenn …, würde …：現在不是真的' },
  { id: 'transform', label: '改寫句子', hint: '把事實或命令句改寫成 Konjunktiv II' },
  { id: 'function', label: '用途判斷', hint: '這句 Konjunktiv II 在做什麼？' },
  { id: 'advanced', label: '進階', hint: '過去的非現實、als ob（B1+）' }
];

export const konjunktivExercises: KonjunktivExercise[] = [
  // Polite requests: the indicative version is grammatical, so the task is explicitly "make it more polite".
  { id: 'p1', stage: 'polite', level: 'A2', fact: 'Kannst du mir helfen?', sentence: '___ du mir bitte helfen?', options: ['Könntest', 'Kannst', 'Konntest', 'Könnte'], trans: '你可以幫我一下嗎？', explain: 'können → könnte；du 的字尾 -est：könntest。Konntest 沒有變音，是過去式。' },
  { id: 'p2', stage: 'polite', level: 'A2', fact: 'Haben Sie einen Moment Zeit?', sentence: '___ Sie einen Moment Zeit?', options: ['Hätten', 'Haben', 'Hatten', 'Hättet'], trans: '您有一點時間嗎？', explain: 'haben → hätte；Sie 用 hätten。Hatten 是過去式，Hättet 是 ihr 的形式。' },
  { id: 'p3', stage: 'polite', level: 'A2', fact: 'Ich will einen Kaffee.', sentence: 'Ich ___ gern einen Kaffee.', options: ['hätte', 'habe', 'hatte', 'würde'], trans: '我想要一杯咖啡。', explain: '點餐時常用 Ich hätte gern …（也可以說 Ich möchte …）。würde 後面一定要有不定式。' },
  { id: 'p4', stage: 'polite', level: 'A2', fact: 'Mach bitte das Fenster zu!', sentence: '___ du bitte das Fenster zumachen?', options: ['Würdest', 'Wirst', 'Wurdest', 'Würde'], trans: '你可以把窗戶關上嗎？', explain: '命令句改成 würde + 不定式就變得客氣；du 用 würdest。' },
  { id: 'p5', stage: 'polite', level: 'B1', fact: 'Darf ich Sie etwas fragen?', sentence: '___ ich Sie etwas fragen?', options: ['Dürfte', 'Durfte', 'Darf', 'Dürften'], trans: '我可以問您一件事嗎？', explain: 'dürfen → dürfte，比 Darf ich 更客氣。ich 的形式沒有 -n。' },
  { id: 'p6', stage: 'polite', level: 'B1', fact: 'Ist es möglich, den Termin zu verschieben?', sentence: '___ es möglich, den Termin zu verschieben?', options: ['Wäre', 'Ist', 'War', 'Würde'], trans: '有可能把約定的時間改一下嗎？', explain: 'sein → wäre。Wäre es möglich, … 是很常用的客氣問法。' },
  { id: 'p7', stage: 'polite', level: 'A2', fact: 'Können Sie mir sagen, wie spät es ist?', sentence: '___ Sie mir sagen, wie spät es ist?', options: ['Könnten', 'Können', 'Konnten', 'Könntest'], trans: '您可以告訴我現在幾點嗎？', explain: 'Sie 用 könnten；Könntest 是 du 的形式。' },
  { id: 'p8', stage: 'polite', level: 'B1', fact: 'Komm doch mit!', sentence: 'Es ___ schön, wenn du mitkommen könntest.', options: ['wäre', 'ist', 'war', 'würde'], trans: '如果你能一起來就太好了。', explain: 'Es wäre schön, wenn … 是委婉的邀請；主句和 wenn 子句都用 Konjunktiv II。' },

  // Wishes
  { id: 'w1', stage: 'wish', level: 'A2', fact: 'Ich habe keine Zeit.', sentence: 'Wenn ich doch mehr Zeit ___!', options: ['hätte', 'habe', 'hatte', 'wäre'], trans: '要是我有更多時間就好了！', explain: '願望句 Wenn … doch／nur …!，動詞放句尾，用 Konjunktiv II：hätte。' },
  { id: 'w2', stage: 'wish', level: 'A2', fact: 'Ich bin nicht reich.', sentence: 'Ich ___ gern reich.', options: ['wäre', 'bin', 'war', 'hätte'], trans: '我真希望自己有錢。', explain: 'Ich wäre gern … 表示願望；reich 是形容詞，搭配 sein → wäre。' },
  { id: 'w3', stage: 'wish', level: 'B1', fact: 'Ich kann nicht singen.', sentence: 'Wenn ich nur singen ___!', options: ['könnte', 'kann', 'konnte', 'könntest'], trans: '要是我會唱歌就好了！', explain: 'können → könnte，放在句尾。ich 沒有 -st。' },
  { id: 'w4', stage: 'wish', level: 'B1', fact: 'Es regnet.', sentence: 'Wenn es doch nicht regnen ___!', options: ['würde', 'wird', 'wurde', 'wäre'], trans: '要是沒下雨就好了！', explain: '一般動詞（regnen）的 Konjunktiv II 用 würde + 不定式。' },
  { id: 'w5', stage: 'wish', level: 'B1', fact: 'Du bist nicht hier.', sentence: 'Ich wünschte, du ___ hier.', options: ['wärst', 'bist', 'warst', 'wäre'], trans: '我真希望你在這裡。', explain: 'Ich wünschte, … 後面用 Konjunktiv II；du → wärst。' },
  { id: 'w6', stage: 'wish', level: 'B1+', fact: 'Ich weiß die Antwort nicht.', sentence: 'Wenn ich nur die Antwort ___!', options: ['wüsste', 'weiß', 'wusste', 'würde'], trans: '要是我知道答案就好了！', explain: 'wissen → wüsste（wusste 加變音）。這是少數常直接用 Konjunktiv II 形式的一般動詞。' },
  { id: 'w7', stage: 'wish', level: 'A2', fact: 'Wir haben keinen Garten.', sentence: 'Wir ___ so gern einen Garten.', options: ['hätten', 'haben', 'hatten', 'wären'], trans: '我們好想要有一個花園。', explain: '「擁有」用 haben → hätten；wir 的字尾 -en。' },

  // Advice
  { id: 'r1', stage: 'advice', level: 'A2', sentence: 'An deiner Stelle ___ ich zum Arzt gehen.', options: ['würde', 'werde', 'wurde', 'wäre'], trans: '如果我是你，我會去看醫生。', explain: 'An deiner Stelle würde ich … 是給建議的固定說法。' },
  { id: 'r2', stage: 'advice', level: 'A2', sentence: 'Du ___ mehr Wasser trinken.', options: ['solltest', 'sollst', 'sollen', 'sollte'], trans: '你應該多喝水。', explain: 'solltest 是建議；sollst 表示「別人要求你」。sollte 的形式和過去式一樣，靠上下文判斷。' },
  { id: 'r3', stage: 'advice', level: 'B1', sentence: 'Wenn ich du ___, würde ich das Angebot annehmen.', options: ['wäre', 'bin', 'war', 'hätte'], trans: '如果我是你，我會接受這個提議。', explain: 'Wenn ich du wäre, … 是另一種給建議的說法，用 sein → wäre。' },
  { id: 'r4', stage: 'advice', level: 'B1', sentence: 'Ihr ___ früher losfahren, sonst steht ihr im Stau.', options: ['solltet', 'sollt', 'solltest', 'würdet'], trans: '你們應該早點出發，不然會塞車。', explain: 'ihr → solltet（建議）；sollt 是現在式，表示被要求。' },
  { id: 'r5', stage: 'advice', level: 'B1', sentence: 'Es wäre besser, wenn du heute zu Hause bleiben ___.', options: ['würdest', 'wirst', 'wurdest', 'würde'], trans: '你今天待在家會比較好。', explain: '主句已經是 Es wäre besser，wenn 子句也要用 Konjunktiv II：bleiben würdest。' },

  // Unreal conditions (present)
  { id: 'i1', stage: 'condition', level: 'A2', sentence: 'Wenn ich Zeit ___, würde ich dich besuchen.', options: ['hätte', 'habe', 'hatte', 'hättest'], trans: '如果我有時間，我就會去看你。（但我沒時間）', explain: '非現實條件：wenn 子句 hätte，主句 würde + 不定式。' },
  { id: 'i2', stage: 'condition', level: 'A2', sentence: 'Wenn es nicht so kalt ___, würden wir schwimmen gehen.', options: ['wäre', 'ist', 'war', 'würde'], trans: '如果沒那麼冷，我們就會去游泳。', explain: 'sein → wäre。用 ist 就變成真實條件「如果不冷（可能發生）」。' },
  { id: 'i3', stage: 'condition', level: 'A2', sentence: 'Wenn ich mehr Geld hätte, ___ ich eine größere Wohnung mieten.', options: ['würde', 'werde', 'wurde', 'hätte'], trans: '如果我有更多錢，我就會租大一點的公寓。', explain: '主句用 würde + 不定式（mieten 放句尾）。' },
  { id: 'i4', stage: 'condition', level: 'B1', sentence: 'Wenn du mehr lernen ___, würdest du die Prüfung bestehen.', options: ['würdest', 'wirst', 'wurdest', 'würde'], trans: '如果你多唸一點書，就會通過考試。', explain: 'wenn 子句也可以用 würde + 不定式；du → würdest，放在子句最後。' },
  { id: 'i5', stage: 'condition', level: 'B1', sentence: 'Wenn wir ein Auto hätten, ___ wir am Wochenende ans Meer fahren.', options: ['könnten', 'können', 'konnten', 'könnte'], trans: '如果我們有車，週末就可以去海邊。', explain: '情態動詞直接用 Konjunktiv II 形式：können → könnten。' },
  { id: 'i6', stage: 'condition', level: 'B1', sentence: 'Was ___ du machen, wenn du im Lotto gewinnen würdest?', options: ['würdest', 'wirst', 'wurdest', 'hättest'], trans: '如果你中了樂透，你會做什麼？', explain: '問非現實的情況：Was würdest du machen, wenn …?' },
  { id: 'i7', stage: 'condition', level: 'B1', sentence: 'Wenn ich besser Deutsch sprechen ___, würde ich in Deutschland arbeiten.', options: ['könnte', 'kann', 'konnte', 'könntest'], trans: '如果我德文說得更好，我就會去德國工作。', explain: '「能夠」用 können → könnte，放在 wenn 子句句尾。' },
  { id: 'i8', stage: 'condition', level: 'A2', sentence: 'Ich ___ dir gern helfen, aber ich habe keine Zeit.', options: ['würde', 'werde', 'wurde', 'hätte'], trans: '我很想幫你，可惜沒時間。', explain: 'Ich würde gern …, aber … 表示「想做但做不到」。' },
  { id: 'i9', stage: 'condition', level: 'B1+', sentence: 'Wenn der Bus pünktlich ___, wären wir schon da.', options: ['käme', 'kommt', 'kam', 'würde'], trans: '如果公車準時來，我們早就到了。', explain: 'kommen → käme（kam 加變音）。也可以說 kommen würde，但這裡只有一個空格。' },
  { id: 'i10', stage: 'condition', level: 'B1', sentence: 'Wenn ich du wäre, ___ ich mir keine Sorgen machen.', options: ['würde', 'werde', 'wäre', 'wurde'], trans: '如果我是你，我就不會擔心。', explain: '主句 würde + 不定式；machen 放在句尾。' },

  // Rewriting facts as unreal conditions: watch the negation and the verb form.
  { id: 't1', stage: 'transform', level: 'A2', fact: 'Ich habe kein Auto. Ich fahre nicht ans Meer.', options: ['Wenn ich ein Auto hätte, würde ich ans Meer fahren.', 'Wenn ich kein Auto hätte, würde ich ans Meer fahren.', 'Wenn ich ein Auto habe, fahre ich ans Meer.', 'Wenn ich ein Auto hätte, würde ich ans Meer gefahren.'], trans: '如果我有車，我就會去海邊。', explain: '事實是否定（kein Auto），非現實句要反過來變成肯定（ein Auto）；動詞用 hätte／würde + 不定式。' },
  { id: 't2', stage: 'transform', level: 'B1', fact: 'Es regnet. Wir gehen nicht spazieren.', options: ['Wenn es nicht regnen würde, würden wir spazieren gehen.', 'Wenn es regnen würde, würden wir nicht spazieren gehen.', 'Wenn es nicht regnet, gehen wir spazieren.', 'Wenn es nicht regnen würde, würden wir nicht spazieren gehen.'], trans: '如果沒下雨，我們就會去散步。', explain: '兩個部分都要反過來：regnet → nicht regnen würde，nicht spazieren → spazieren。' },
  { id: 't3', stage: 'transform', level: 'A2', fact: 'Ich bin krank. Ich kann nicht zur Party kommen.', options: ['Wenn ich nicht krank wäre, könnte ich zur Party kommen.', 'Wenn ich krank wäre, könnte ich zur Party kommen.', 'Wenn ich nicht krank bin, kann ich zur Party kommen.', 'Wenn ich nicht krank wäre, könnte ich nicht zur Party kommen.'], trans: '如果我沒生病，就可以去派對。', explain: 'bin → wäre，kann → könnte，肯定和否定互換。' },
  { id: 't4', stage: 'transform', level: 'B1', fact: 'Er spricht kein Deutsch. Er versteht den Film nicht.', options: ['Wenn er Deutsch sprechen würde, würde er den Film verstehen.', 'Wenn er kein Deutsch sprechen würde, würde er den Film verstehen.', 'Wenn er Deutsch spricht, versteht er den Film.', 'Wenn er Deutsch sprechen würde, würde er den Film nicht verstehen.'], trans: '如果他會說德文，就看得懂這部電影。', explain: '一般動詞用 würde + 不定式；kein Deutsch → Deutsch，nicht verstehen → verstehen。' },
  { id: 't5', stage: 'transform', level: 'A2', fact: 'Wir haben keine Zeit. Wir besuchen dich nicht.', options: ['Wenn wir Zeit hätten, würden wir dich besuchen.', 'Wenn wir Zeit hätten, würden wir dich besucht.', 'Wenn wir Zeit haben, besuchen wir dich.', 'Wenn wir keine Zeit hätten, würden wir dich besuchen.'], trans: '如果我們有時間，就會去看你。', explain: 'würde 後面接不定式 besuchen，不是過去分詞 besucht。' },
  { id: 't6', stage: 'transform', level: 'B1', fact: 'Der Laden ist geschlossen. Ich kann kein Brot kaufen.', options: ['Wenn der Laden geöffnet wäre, könnte ich Brot kaufen.', 'Wenn der Laden geschlossen wäre, könnte ich Brot kaufen.', 'Wenn der Laden geöffnet ist, kann ich Brot kaufen.', 'Wenn der Laden geöffnet wäre, könnte ich kein Brot kaufen.'], trans: '如果店有開，我就可以買麵包。', explain: '把事實反過來：geschlossen → geöffnet，kein Brot → Brot。' },
  { id: 't7', stage: 'transform', level: 'B1+', fact: 'Ich habe den Wecker nicht gehört. Ich bin zu spät gekommen.', options: ['Wenn ich den Wecker gehört hätte, wäre ich nicht zu spät gekommen.', 'Wenn ich den Wecker gehört hätte, hätte ich nicht zu spät gekommen.', 'Wenn ich den Wecker gehört wäre, wäre ich nicht zu spät gekommen.', 'Wenn ich den Wecker hören würde, würde ich nicht zu spät kommen.'], trans: '如果我有聽到鬧鐘，就不會遲到了。', explain: '過去的事用 hätte／wäre + 過去分詞；助動詞跟著 Perfekt：hat gehört → hätte gehört，ist gekommen → wäre gekommen。' },
  { id: 't8', stage: 'transform', level: 'B1+', fact: 'Du hast mir nicht geholfen. Ich habe es nicht geschafft.', options: ['Wenn du mir geholfen hättest, hätte ich es geschafft.', 'Wenn du mir geholfen wärst, hätte ich es geschafft.', 'Wenn du mir nicht geholfen hättest, hätte ich es geschafft.', 'Wenn du mir hilfst, schaffe ich es.'], trans: '如果你有幫我，我就成功了。', explain: 'helfen 的 Perfekt 用 haben：hat geholfen → hättest geholfen。' },
  { id: 't9', stage: 'transform', level: 'A2', fact: 'Gib mir das Salz!', options: ['Könntest du mir bitte das Salz geben?', 'Kannst du mir das Salz gegeben?', 'Konntest du mir bitte das Salz geben?', 'Könntest du mir bitte das Salz gibst?'], trans: '可以請你把鹽遞給我嗎？', explain: '客氣請求：Könntest du … + 不定式（geben）放句尾。' },
  { id: 't10', stage: 'transform', level: 'A2', fact: 'Ruf mich morgen an!', options: ['Würdest du mich morgen anrufen?', 'Würdest du mich morgen anrufst?', 'Wurdest du mich morgen anrufen?', 'Wirst du mich morgen anrufen?'], trans: '你明天可以打電話給我嗎？', explain: 'würdest + 不定式 anrufen；Wirst du … 是問未來，不是客氣請求。' },

  // What is the sentence doing?
  { id: 'f1', stage: 'function', level: 'A2', sentence: 'Könnten Sie mir bitte helfen?', options: ['禮貌請求', '願望', '建議', '非現實條件'], trans: '您可以幫我嗎？', explain: 'Könnten Sie … ? 是客氣地請別人做事。' },
  { id: 'f2', stage: 'function', level: 'A2', sentence: 'Wenn ich doch mehr Zeit hätte!', options: ['願望', '禮貌請求', '建議', '非現實條件'], trans: '要是我有更多時間就好了！', explain: 'Wenn … doch …! 只有 wenn 子句、沒有主句，是願望。' },
  { id: 'f3', stage: 'function', level: 'A2', sentence: 'An deiner Stelle würde ich das nicht machen.', options: ['建議', '願望', '禮貌請求', '非現實條件'], trans: '如果我是你，我不會這樣做。', explain: 'An deiner Stelle … 是給建議。' },
  { id: 'f4', stage: 'function', level: 'A2', sentence: 'Wenn ich reich wäre, würde ich um die Welt reisen.', options: ['非現實條件', '願望', '建議', '禮貌請求'], trans: '如果我有錢，我就會環遊世界。', explain: 'wenn 子句加主句，說的是現在不成立的情況。' },
  { id: 'f5', stage: 'function', level: 'A2', sentence: 'Du solltest mehr Sport machen.', options: ['建議', '禮貌請求', '願望', '非現實條件'], trans: '你應該多運動。', explain: 'solltest 是給建議。' },
  { id: 'f6', stage: 'function', level: 'A2', sentence: 'Ich hätte gern ein Glas Wasser.', options: ['禮貌請求', '願望', '建議', '非現實條件'], trans: '我想要一杯水。', explain: '點餐或購物時的 Ich hätte gern … 是客氣地提出要求。' },
  { id: 'f7', stage: 'function', level: 'A2', sentence: 'Ich wäre jetzt so gern am Meer!', options: ['願望', '禮貌請求', '建議', '非現實條件'], trans: '我現在好想在海邊！', explain: 'Ich wäre so gern … 表達無法實現的願望。' },
  { id: 'f8', stage: 'function', level: 'B1', sentence: 'Wenn es nicht regnen würde, könnten wir grillen.', options: ['非現實條件', '願望', '建議', '禮貌請求'], trans: '如果沒下雨，我們就可以烤肉。', explain: '有條件（wenn）也有結果（könnten wir …），是非現實條件。' },
  { id: 'f9', stage: 'function', level: 'A2', sentence: 'Würden Sie bitte das Fenster schließen?', options: ['禮貌請求', '建議', '願望', '非現實條件'], trans: '可以請您關上窗戶嗎？', explain: 'Würden Sie bitte … ? 是客氣的請求。' },
  { id: 'f10', stage: 'function', level: 'B1', sentence: 'Es wäre besser, wenn du früher ins Bett gehen würdest.', options: ['建議', '非現實條件', '願望', '禮貌請求'], trans: '你早點睡會比較好。', explain: 'Es wäre besser, wenn … 是委婉的建議。' },

  // Past unreal conditions and als ob (B1+)
  { id: 'v1', stage: 'advanced', level: 'B1+', sentence: 'Wenn ich früher aufgestanden ___, hätte ich den Zug nicht verpasst.', options: ['wäre', 'hätte', 'war', 'würde'], trans: '如果我早點起床，就不會錯過火車了。', explain: '過去的非現實：hätte／wäre + 過去分詞。aufstehen 的 Perfekt 用 sein → wäre aufgestanden。' },
  { id: 'v2', stage: 'advanced', level: 'B1+', sentence: 'Wenn du mich gefragt ___, hätte ich dir geholfen.', options: ['hättest', 'wärst', 'hattest', 'würdest'], trans: '如果你有問我，我就會幫你了。', explain: 'fragen 的 Perfekt 用 haben → hättest gefragt。' },
  { id: 'v3', stage: 'advanced', level: 'B1+', sentence: 'Wenn wir das gewusst hätten, ___ wir nicht gekommen.', options: ['wären', 'hätten', 'waren', 'würden'], trans: '如果我們早知道，就不會來了。', explain: 'kommen 的 Perfekt 用 sein → wären gekommen。' },
  { id: 'v4', stage: 'advanced', level: 'B1+', sentence: 'Wenn sie den Zug genommen ___, wäre sie pünktlich gewesen.', options: ['hätte', 'wäre', 'hatte', 'würde'], trans: '如果她搭了火車，就會準時到了。', explain: 'nehmen 的 Perfekt 用 haben → hätte genommen。' },
  { id: 'v5', stage: 'advanced', level: 'B1+', sentence: 'Wenn es gestern nicht geregnet hätte, ___ wir gegrillt.', options: ['hätten', 'wären', 'hatten', 'würden'], trans: '如果昨天沒下雨，我們就烤肉了。', explain: 'grillen 的 Perfekt 用 haben → hätten gegrillt。' },
  { id: 'v6', stage: 'advanced', level: 'B1+', sentence: 'Ohne deine Hilfe ___ ich das nicht geschafft.', options: ['hätte', 'wäre', 'würde', 'wurde'], trans: '沒有你的幫忙，我是做不到的。', explain: 'Ohne … hätte ich … 表示「要不是有……」；schaffen 用 haben。' },
  { id: 'a1', stage: 'advanced', level: 'B1+', sentence: 'Er tut so, als ___ er krank.', options: ['wäre', 'ist', 'war', 'hätte'], trans: '他裝作生病的樣子。', explain: 'als + 動詞直接接在後面時一定用 Konjunktiv II：als wäre er krank（= als ob er krank wäre）。' },
  { id: 'a2', stage: 'advanced', level: 'B1+', sentence: 'Du siehst aus, als ___ du nicht geschlafen.', options: ['hättest', 'hast', 'hattest', 'wärst'], trans: '你看起來像是沒睡覺。', explain: 'schlafen 的 Perfekt 用 haben → als hättest du nicht geschlafen。' }
];
