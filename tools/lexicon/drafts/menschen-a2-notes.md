# Menschen A2 候選字篩選與撰寫紀錄

2026-11-20，Codex 擔任撰寫角色；此為草稿，尚未獨立德文校對、使用者抽查或部署。

## 範圍與方法

只讀取 repo 外的 OCR 候選清單，未複製原清單進 repo。311 筆逐筆分類：收錄 247、排除 64；收錄程度 A1 29、A2 157、B1 61。以日常實用性選字，並非完整重建教材字表或宣稱官方考試分級。

比對本次新增前的 `lexicon.graded.json` 的 word／variants，並額外比對 `lexicon.draft.json`。比對移除冠詞、開頭 sich、可分符號 •／·、空白與連字號，統一大小寫及 ä/ae、ö/oe、ü/ue、ß/ss。收錄項目無正規化重複。相近詞或不同衍生詞不自動視為同一詞（例如 Huhn／Hähnchen、Einkaufsliste／Einkaufszettel）。

釋義與德中例句由本次自行撰寫；未取用教材例句。以最常見的日常意思為主，動詞補四個變化欄位與必要說明。只透過使用者指定腳本產生 src/data 資料，未修改舊詞 id 或學習進度格式。

## 排除明細（每筆僅計一類）

### 專有名詞、品牌、地名或特定景點：5 筆

Audi、Bodensee、Inntal、Rheinfahrt、Richter-Fenster

### OCR 殘字、截斷或無法可靠還原：7 筆

Aus-alt-mach-neu-、Bauch-Beine-、en、dei、Römisch-Germanische、he、suchtrl

### 還原後主字庫已有：3 筆

spricht、lemen、uro

### 文法術語：1 筆

Adjektivdeklination

### 較專門、低優先、地域用語或過度情境化：48 筆

Kassette、an•dünsten、Arbeitsvorgang、barock、Bauteil、Bergkräutertee、Börek、Bratensoße、Brauhaus、Brotkorb、Buchdrucker、Buchdruckerin、Bundesministerium、Bürogemeinschaft、Bussi、Computeranimation、dazugießen、Deckenlicht、Designmöbelhändler、Deutschstunde、Einrad、Einrichtungstipp、emigrieren、goldrichtig、Männerarbeit、Marathonlauf、Mittelalterfest、mütterlicherseits、Nachfolgemodell、Naturliebhaber、quaken、Revolution、Rinderfilet、Risotto、Rodel、Romantiker、Rudern、rundum、Sachtext、Schauspielhaus、Schlemmen、Schlittenfahrt、Segelschiff、Segelsport-Event、Soda、urban、Wahrheitsspiel、Waschfrau

低優先類不代表所有詞都超過 B1；例如 Brotkorb、Deutschstunde、Deckenlicht 可由已知成分理解，Kassette 媒介較舊，Börek／Risotto 是特定菜名，Bussi／Rodel 地域性較強。本批採保守的補缺優先順序，暫不另建條目。

## OCR 與詞形處理

- Ol → Öl：收錄，依食用油的常用義，不列可數的油品種類。
- gartnern → gärtnern：收錄。
- hinte → hinten：依字形推測缺末尾 n，收錄；需校對者確認原掃描。
- spricht → sprechen：現在式還原成原形後，主字庫已有，排除。
- lemen → lernen：rn 被讀為 m；還原後已有，排除。
- uro → Euro：推測缺開頭 E；主字庫已有，不新增。
- aus•schließen → ausschließen、ein•weichen → einweichen、runter•laden → runterladen：移除可分標記後收錄，動詞 note 標示可分。
- an•dünsten → andünsten：可確定移除可分標記，但偏烹調細節，本批排除。
- OCR plural 的縮寫、頁碼與錯誤符號未直接沿用；草稿另寫完整詞形。
- en、dei、he、suchtrl 與截斷的 Aus-alt-mach-neu-、Bauch-Beine-、Römisch-Germanische 不擅自補成新詞。

## 待獨立校對／沒把握的項目

- hinte → hinten 的還原缺少原掃描佐證；uro → Euro 也只作去重用的推測。
- Pfund：德國市場常指半公斤，英制磅不同；草稿以購物用法為主，請確認是否符合收錄範圍。
- Lehre、Realschule、Privatsender、Einsparung、Engagement、gärtnern 的 A2／B1 邊界與優先性可再由分級／校對角色決定，本次標 B1（其餘見 JSON）。
- worauf、woraus 暫標 adverb；請確認專案是否希望另以 phrase 表示疑問代副詞。
- Arbeitsbedingungen、Rückenschmerzen 為只用複數的詞條，word 與 plural 相同；Kenntnis 的實用例句採 Kenntnisse。
- joggen、trocknen 的助動詞有用法差異，草稿例句與 verb／note 配合；winken 採 hat gewinkt 並註記另一形式。
- 所有 247 筆均尚待另一位德文校對者審閱；本次只做撰寫與結構／建置驗證，不充當獨立校對。

## 驗證

- `node tools/lexicon/check-drafts.mjs menschen-a2.json`：247 筆 ✓。
- `node tools/lexicon/apply-tags.mjs`、`node tools/lexicon/build-site-data.mjs`：成功，主字庫 3264 筆，練習池 2842 筆。
- 各程度練習數：A1 709、A2 808、B1 1161、B2 162；測試固定數字同步更新。
- `npm test`：157 項中 156 通過；唯一失敗為 audio-coverage 缺新增音檔，符合任務預期。
- `npm run build`：成功，10 頁。
- `npm run audio -- --dry-run`：總計 8362 段文字，待產生 490 段、12749 字元；未產生音檔。
- 311 筆候選的收錄／排除分配與新增前主字庫正規化去重斷言通過。

## 校對結果（2026-11-22，german-reviewer 兩位分半獨立校對，Claude Code 套用）

- 247 筆全查：must fix 1（Werkstatt 原釋義「工作坊」在台灣指研習活動，改「修理廠；修車廠；工坊」）、should fix 12、optional 16，全部 29 條套用。
- 重點：Pfund 改「半公斤；英鎊」；Hähnchen 與 Hühnerfleisch、Punkt 與 Note、Gaststätte 與 Lokal／Kneipe 的釋義區隔；Gegenteil 例句改成 A2 程度；restlos 詞性改 adjective；nachts 改「在夜裡；夜間」；medium 改「五分熟的」。
- Kenntnis 與既有的 Kenntnisse（只用複數）重複：為了不影響已存的複習進度，不刪 id，改教單數用法 zur Kenntnis nehmen（知悉；了解）。
- 未採納（留給分級或使用者決定）：程度微調建議（Zigarette、Packung、Spaziergang、Anfänger 可能 A2；Notarzt、Notaufnahme、Allee 可能 B1；restlos 可能 B2；prima 可能 A1 等）、damit 另立副詞詞條、Schlüsselbund 的 das 變體。
- 驗證：check-drafts ✓、apply-tags／build-site-data 成功，4,598 個 id 不變；新例句音檔 6 段；npm test 173 全過。
