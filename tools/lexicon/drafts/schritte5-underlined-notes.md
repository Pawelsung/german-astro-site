# Schritte B1.1｜我在課本劃線的字（草稿，待獨立校對）

## 結果

- 新增 `schritte5-underlined.json` **68 筆**：A1 1、A2 16、B1 48、B2 3。釋義與德中例句皆自行撰寫。
- missing 來源還原後補 52 個新詞；known 來源也有子字串誤判，另補 16 個真正缺少的詞（例如 Stimme、reichen、Logis、geraten、Gedanke）。「known」並不代表精確原形已存在。
- 主字庫 4,530 → **4,598**；原有 4,530 筆整筆資料與 ID 均保留；ids.lock 只新增 68 個 ID。沒有修改 Schritte 6 草稿。
- 個人清單 `schritte-b1-1-underlined` 共 **383 個不重複 ID**，每個詞只放在來源第一次出現的課。

| 課次 | 沿用既有課名 | ID 數 |
| --- | --- | ---: |
| Lektion 1 | Glück im Alltag | 86 |
| Lektion 2 | Unterhaltung | 49 |
| Lektion 3 | Gesund bleiben | 113 |
| Lektion 4 | Sprachen | 80 |
| Lektion 5 | Eine Arbeit finden | 52 |
| Lektion 6 | Dienstleistung | 3 |
| 合計 | | 383 |

## 原形、課次與排除方式

- 讀取 repo 外 513 known＋130 missing，共 643 筆。沒有複製 OCR 檔或課文整行到 repo；repo 內僅保存自行撰寫的新詞、整理後的 ID 清單及本說明。
- 還原例：Betreuurig → Betreuung、sucheAn → suchen、Gegenleis／tung → Gegenleistung、kegnen → kennenlernen、Hauptfigureß → Hauptfigur、Mysiker → Musiker、raj nstorming 類 OCR 殘形 → Brainstorming。besser、klüger 分別歸回 gut、klug，不另建比較級詞條。
- 接回跨行的 vergeblich、Tiefstpreis、sich spezialisieren；辨識可分動詞 absperren、verwechseln、teilnehmen。Arbeitsbedin 對應既有 Arbeitsbedingungen，不另造單數新詞。
- 課次以同一份 OCR 的 PAGE 區塊頁尾 LEKTION 為準。這是掃描頁索引，不等於印刷頁碼（例如 PAGE 66 頁尾是 KB 64）。PAGE 11、17 等頁尾缺字或 I/A 誤辨，以相鄰頁的同一課判斷。PAGE 24/36/48/60/72 分別開始課 2/3/4/5/6。
- 來源不只有第 1～4 課：PAGE 60～71 是第 5 課；PAGE 72～83 是第 6 課。PAGE 122 的 beginnen／Mund 歸作業本第 3 課，PAGE 154 的 dankbar 歸作業本第 6 課。第 6 課首次出現的三詞為 Mädchen、verlieren、dankbar。
- 643 筆整理決策：收錄 383、重複原形 45、功能詞 141、其他排除 74。此為字形來源筆數，拆字復原後也算原來源的多筆，並非 643 個不同原形。
- 功能詞：冠詞 der/die/das/ein、代名詞 ich/Sie/was、介系詞 nach/mit/pro、連接詞 und/dass、sein/haben/werden 及其變化、情態動詞、數字與數量詞（含 Fünftel），以及 dann/schon/sehr 等基礎功能用法；不因 OCR 列為 known 就直接收進來。
- 專名：Ellas、Schulze、Kerstin、Sami、Mumbai、Venedig、USA、Siam；機構縮寫 BAMF 及其全名不列個人清單。Chilenin 是一般國籍身分名詞，保留，並非人名或地名。
- 教材／操作雜訊：AUDIO、D32、326E、Präteritum、Perfekt、Gradpartikeln、文法附錄的 Grammatik／wen；明顯題目操作的 ordnen／ankreuzen／Lest 不列清單。
- OCR 碎片：ande/ren、ten/ver、pet/dey、aper/nit、krem/giner、WiefAntwort、könnar/dig/gger、Stabe/zett 等。可接回的詞有接回；無法確定者沒有臆造原形。Cazuela 作為地域菜名，本輪不擴充。
- 大量基礎實詞（例如 kaufen、Kind、Wasser）雖可能有誤抓，無充分證據時仍保留；沒有只留下 B1 以上。antigrün、Verbotsrepublik、Erziehungsdiktatur 是可辨識實詞，也保留並標為 B2，沒有以政治評論詞較難為由刪除。

## 產生流程與網站位置

- `build-lexicon.mjs` 從既有 public 字庫建 `src/data/lexicon/lists.json`；本次沒有重跑它，也沒有重新產生 batches。
- 個人清單的可維護來源是 `tools/lexicon/custom-lists.json`。`apply-tags.mjs` 在既有 lists 後合併個人清單，再套 redirect，產生 `lists.graded.json`；不手改產物。
- `build-site-data.mjs` 同時輸出 site/lists.json 與個人清單的 public/vocab JSON，內容、例句、詞條 ID 都來自主字庫。
- `public/vocab/index.json` 登記清單。第 1 課 `/lesson1-wort/` 的字庫／範圍選單可選「Schritte B1.1｜我在課本劃線的字」，再選各課；沿用現有介面，沒有修改 UI 設計。
- 測試實際 normalize 該 public 字庫、核對選單註冊/count、六課筆數、site row → 主字庫 ID、全清單去重與功能詞排除。這次沒有進行瀏覽器操作或獨立介面審查。

## 待校對／沒把握的地方

- 本次是撰寫角色與工程驗證，沒有兼任獨立德文校對。全部新詞待另一角色／另一次工作校對，再由使用者抽查。
- 請優先檢查 Logis 的搭配與程度、Mindmapping 的教學分級、Gesundheitssprechstunde／Beinmuskulatur／Energiemenge 等透明組合的實用性，以及政治評論三詞的 B2 分級與貶義說明。
- 既有反身詞條 `sich erfüllen` 涵蓋來源中非反身的「實現願望」；遵守既有原形去重規則，清單沿用該 ID，未重寫原詞條。需獨立校對既有詞條是否應補上非反身用法。
- `rechten` 以既有 rechts（右邊）對應；`spannt` 按跨行 entspannt 還原。PAGE 66 的 Bauten 文意與 OCR 不完整，保留可辨識名詞 Bau，待使用者對照紅筆確認。
- 語言名稱 Spanisch／Italienisch 沿用現有 spanisch／italienisch 詞條；沒有另造同形名詞。這是既有庫的涵蓋方式，並非新增內容已完成詞義校訂。
- 不能由文字結果確定每個實詞真的被紅筆劃線；本輪按要求保留可辨識實詞，使用者可對照原書抽查。

## 驗證

- check-drafts：全部 9 份 ✓；apply-tags、build-site-data 成功。
- npm test：158 項，157 通過；唯一 audio-coverage 缺音檔失敗為預期。新增個人清單完整性測試；既有每份 Schritte 一律 7 課的測試改為此清單 6 課。
- 分級練習池固定數更新：A1 846、A2 1292、B1 1870、B2 166。整體池 4,176 筆。
- npm run build：成功，10 頁。
- audio dry-run：共 **11,012 段**，待產生 **931 段／29,179 字元**（包含先前 Schritte 6 尚未產生的音檔，不是本次新增量）。
- 未產生音檔；未 commit、push、部署、stash 或切分支。

## 排除 A1 基本字（2026-11-20）

- 依主字庫 level 移除 108 個 A1 ID：L1 33、L2 13、L3 27、L4 22、L5 12、L6 1。
- 清單由 383 減至 275 IDs：L1 53、L2 36、L3 86、L4 58、L5 40、L6 2；無空分組，A2 以上全部保留。未修改 schritte5-underlined.json，也未刪除主字庫詞條或既有進度 ID。
- 更新 public manifest 的 count／description、各課數量測試，新增總數 275 與清單無 A1 斷言；生成 lists／site／public 字庫。測試 157/158 通過，唯一缺音檔失敗為預期；build 成功。
