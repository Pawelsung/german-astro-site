# 內容正確性檢視（2026-10-24）

範圍：六課的全部題庫與三個主要字庫，逐條閱讀例句、翻譯、答案與解析，判斷文法、語意、邏輯是否正確。第 6 課另外寫了獨立的形容詞變化程式，重新計算全部 124 題自動產生題的答案。

## 結果總覽

| 課／字庫 | 檢查數量 | 已修正 | 主要問題類型 |
|---|---|---|---|
| 第 2 課 動詞＋介系詞 | 50 | 4 句例句與翻譯，20 個反身動詞形態 | 例句用了別的動詞（zurückdenken、sich Sorgen machen）；反身動詞形態缺 sich |
| 第 3 課 不規則動詞 | 160 | 16 | 例句用了衍生動詞（einladen、angelogen、hingewiesen）；例句和標示的 Perfekt 互相矛盾（reißen、dringen）；意思錯誤（bewogen ≠ bewegt）；過時形式（buk、molk） |
| 第 4 課 格位 | 116 | 1 | 品質很好，只有一處解析混入英文（under/unter） |
| 第 5 課 連接詞 | 171 | 9 | 因果顛倒（q038）；語意不通（q034、q046）；nicht ein → kein；obwohl＋trotzdem 的解析有誤（trotzdem 其實可以放在動詞後面，現在也接受這種寫法） |
| 第 6 課 形容詞字尾 | 178 → 155 | 產生器重寫，另修 1 題手寫題 | 文法全部正確，但產生器會亂配：「leckerer Film」（好吃的電影）、「Ich kaufe einen Freund」（買一個朋友）、「Ich lese einen Film」（讀一部電影）、同義反覆的「Der gute Film ist sehr gut」；單數可數名詞省略冠詞（mit gutem Buch）屬於文法錯誤 |
| 字庫 B1.1（460） | 460 | 8 | 「gute Verbesserung」應為「Gute Besserung」；rechts／links 的例句用了形容詞形式；auf dem Standesamt；Fachleute |
| 字庫 隱藏版進階（87） | 87 | 14 | 冠詞錯（das schlechte Sache）；單複數錯（Staffeln、Tipps、Senioren）；複數漏變音（Aufträge、Rechtsanwälte、Preisnachlässe）；反身動詞缺 sich；例句沒用到該字（kräftigen） |
| 字庫 A1–B1（449） | 449 | 8 | Führerschein bestanden（要通過的是考試）；auf einer Hochzeit eingeladen（應為 zu）；4 句缺逗號；Wirtschaft 的複數；Streit 的複數 |

修正同時套用到 `public/vocab/` 的所有副本，以及 `單字/` 的原始資料。改動過的文字已用 `npm run audio` 重新產生音檔，舊音檔已自動刪除。

## 第 6 課產生器的修正方式
- 新增 `NOUN_ADJECTIVES` 名詞與形容詞相容表，只產生合理的搭配
- 每個句型改用 `allowedNounIds` 白名單：讀 → 只有書，來自 → 只有城市，買 → 物品或食物
- 主詞句型改成「… gefällt mir sehr」；無冠詞句型改成「Ich frühstücke mit …」，只用咖啡、麵包這類不可數名詞
- 名詞改為輪流出現，避免同一個名詞連續佔掉十幾題
- 題數由 178 題變成 155 題（自動產生 101 題，手寫 54 題）。被刪掉的題目在本機的作答紀錄會失效

## 尚未處理（內容缺口，不是錯誤）
- **中文例句翻譯缺漏**：隱藏版進階詞 87 句、A1–B1 字庫 449 句、第 3 課 160 句，都沒有中文翻譯
- 第 5 課有重複題（例如 q003 和 q086、q035 和 q118），排序題有些只是子句片段
- 第 4 課刻意不縮寫的句子（in dem Park、zu dem Arzt），日常語言較常說 im Park、zum Arzt；解析已有說明，所以保留
- 地區差異：stehen、liegen、sitzen 在南德和奧地利常用 sein 構成 Perfekt；fahren、ziehen 依句意可能用 haben（題庫只標一種）

## 方法說明
- 用腳本把每一筆資料攤平成一行，再由人逐行閱讀判斷；第 6 課另外用獨立實作的變化表比對答案
- 沒有請母語者複核；文法判斷依據標準德語（Duden 規範）
