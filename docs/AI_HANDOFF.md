# AI 接力工作說明（German Astro Site）

> 給下一位接手的 AI／開發者。每次工作結束都要更新這份檔案：在「進度紀錄」最上方加一筆，並同步調整「下一步」。

## 專案快速概覽

- 網站：德語學習工作台，正式站 https://german-astro-site.web.app/（Firebase Hosting，`firebase.json` 指向 `dist`）
- 技術：Astro 7 + React 19（練習元件都是 `client:only="react"`；首頁 `LearningDashboard` 是 `client:load`，先 SSR 再於 useEffect 讀 localStorage，避免 hydration 不一致）+ Tailwind 4 + Firebase（選用的雲端同步）
- 指令：`npm run dev`（本機 4321）、`npm run build`、`npm test`（node test，20 個測試）
- 頁面：`src/pages/lesson1-wort.astro`～`lesson6-adjective-declension.astro`，共用外框 `src/components/LessonShell.astro`
- 練習元件：
  - 第 1 課 `VocabularyTrainer.jsx`（字卡／冠詞／聽寫／詞性／字典）
  - 第 2 課 `VerbWithPreposition.jsx`（字卡、測驗 `Quiz`、列表）
  - 第 3 課 `IrregularVerbTrainer.jsx`（字卡、拼寫、助動詞 haben/sein、情態動詞）
  - 第 4 課 `KasusQuestTrainer.jsx`
  - 第 5 課 `ConnectorTrainer.jsx`
  - 第 6 課 `AdjectiveDeclensionTrainer.jsx`
- 首頁：`src/pages/index.astro` 在建置時計算各課題數，再傳給 `LearningDashboard.jsx`（今日任務、統計、課程卡片）
- 登入：`UserAccount.jsx`；進度儲存：`src/lib/progressStorage.ts`；每日作答與上次課程：`src/lib/dailyActivity.mjs`

## 重要慣例與陷阱

- **深色模式是用 `global.css` 覆寫 Tailwind class 做的**（`.dark .bg-emerald-50 {...}` 等），不是 Tailwind 的 `dark:` 變體。新增任何淺色背景、`-900` 文字色或 `hover:bg-*` 時，必須在 `global.css` 補對應的 `.dark` 覆寫，否則深色模式下會出現「深字配深底」看不到的問題。
- 動畫一律寫成 `global.css` 的共用 class（`fx-*`），並且受 `prefers-reduced-motion` 規則保護。
- 答題回饋請使用共用模組 `src/lib/answerFeedback.js`，不要在各元件重寫。
- Git：2026-10-24 已將累積的未提交工作依主題拆成 6 個 commit（見下方進度紀錄），目前工作區乾淨。之後請維持「一個主題一個 commit」，push／deploy 前先和使用者確認。

## 共用答題回饋模組 `src/lib/answerFeedback.js`

| 匯出 | 用途 |
| --- | --- |
| `answerCue(correct)` | 記錄今日作答（`dailyActivity.recordAnswer`），播放 WebAudio 合成音效（答對兩聲上揚、答錯一聲低音），答錯時在手機輕震。**新題型務必呼叫它，首頁的每日目標才會計數** |
| `useRevealOnShow(key)` | 回傳 ref；`key` 變成 truthy 時，若元素不在畫面內就平滑捲動到可見 |
| `useAnswerShortcuts({ options, answered, onSelect, onNext, enabled })` | 未作答時 `1`–`9` 選答案；作答後 `Enter`／`→` 下一題。焦點在輸入框時不觸發 |
| `SOUND_STORAGE_KEY` / `isSoundEnabled()` | 音效開關，localStorage key 為 `gw-sound-enabled`（預設開） |

答案按鈕需要加 `data-answer-option`，讓 Enter 在按鈕有焦點時仍能前往下一題。

CSS class（`src/styles/global.css` 檔尾）：
- `fx-correct`（放大加綠光）、`fx-wrong`（左右搖晃）、`fx-enter`（回饋卡淡入上滑）、`fx-question`（換題淡入，搭配 `key={current.id}`）
- `kbd-hint`（鍵盤提示小標，觸控裝置自動隱藏）
- `sound-toggle`、`lesson-skeleton`（載入骨架）

## 長期升級藍圖（2026-10-24 與使用者討論，尚未開工）

目標：從「題庫翻頁」變成「學 → 練 → 用 → 複習」的互動學習旅程。原則上執行時不產生額外費用：全部在前端完成，圖像用自製 SVG 或開源圖示（如 OpenMoji），語音用已產生的 Google TTS 音檔。

- **A. 視覺化文法（最優先；冠詞顏色和格位圖解已完成）**
  - 全站統一的冠詞顏色：der 藍、die 紅、das 綠、複數紫
  - 格位句子圖解：用顏色標出句子角色，動詞用箭頭指向受詞
  - 形容詞字尾變化表做成可點的熱圖
  - 語序做成拖拉的句框（Satzklammer）
  - 雙向介系詞做成 Wo／Wohin 拖放情境圖
- **B. 新題型**：拖拉排序、配對、克漏字即時提示、聽寫（自然人聲）、跟讀（Web Speech 語音辨識，僅 Chrome）
- **C. 圖像化單字**：名詞配圖示；第 7 課 Wohnen 做成房間情境圖，可點各個熱點
- **D. 情境對話**：分支式小劇情（看醫生、找房子），有音檔，選擇回應
- **E. 跨課複習**：統一 SRS 的今日複習佇列、弱點地圖、每輪結算畫面
- **F. 遊戲化**：XP、等級地圖、徽章、連對 combo、限時挑戰
- **G. PWA**：可安裝、離線使用（快取音檔）

建議順序：A1 冠詞顏色 → E 結算與今日複習 → A 圖解 → B → C/D → F/G。

## 進度紀錄

### 2026-10-24：第 1 課新增「中→德」與「填空」（已 commit，未部署）
- 純邏輯放在 `src/lib/vocabPractice.mjs`（測試在 `tests/vocabPractice.test.mjs`）：
  - `findClozeTarget`：在例句中找出該字或它的變化形，例如 gewundert、eingestiegen、可分動詞的 stimme。B1 字庫約 97% 的字可以出填空題
  - `productionAnswer`：名詞要求連同冠詞作答
  - `checkTyped`：比對答案，並分辨缺冠詞、冠詞錯、大小寫、變音、反身動詞少 sich 等情況，給出針對性的提示（`MISS_REASONS`）
- `filterVocabulary` 在 cloze 模式只會挑出找得到挖空位置的字。
- UI：模式列改為「字卡、中→德、填空、冠詞、聽寫、詞性、字典」；手機上可橫向捲動（記得 `.vocab-workspace > * { min-width: 0 }`，否則整張卡片會被撐寬）。
- 提示只顯示「第一個字母＋長度」，不會透露冠詞。有實體鍵盤的裝置會自動聚焦輸入框，手機則不會（避免鍵盤彈出造成版面跳動）。

### 2026-10-24：統一「學習／練習／複習」三個入口（已部署）
- 新增 `src/components/LessonModes.jsx`，放在 LessonShell 概念卡上方，六課共用：
  - 學習：展開並捲動到 `#concept-card`
  - 練習：捲動到 `#practice`（練習區）；在複習模式時改為回到全部題目
  - 複習：連到 `?review=1`，並顯示待複習數量徽章；數量來源和首頁相同（`getLearningSummary`）
- 六個 trainer 原本就支援 `isReviewRequested()`，所以不需要修改 trainer。
- 用 `client:only` 加上同尺寸的 fallback 佔位，載入時版面不會跳動。
- 驗證：在第 4 課實測，點「複習」後只出現 7 題錯題，入口列顯示「複習中・還有 7 題」；手機深色版排版正常。部署後在正式站以不帶快取的網址確認六課都有 3 個入口，練習區也正常載入。
- 注意：快取修正上線前一小時內開過的頁面，瀏覽器可能仍留著舊 HTML 而顯示空白，重新整理即可，之後會自行恢復。

### 2026-10-24：快取設定修正（已部署）
- 問題：Firebase 預設對 HTML 快取 1 小時。部署後，瀏覽器會沿用舊 HTML，而舊 HTML 指向已被刪除的舊 `_astro/*.js`，導致頁面空白（404）。
- 修正：在 `firebase.json` 加上 headers——全站預設 `no-cache`（每次重新驗證，靠 ETag 判斷，成本很低）；`/_astro/**` 和 `/audio/de-charon/**` 的檔名帶有雜湊，設為 `immutable` 並快取一年。
- 修正前一小時內開過網站的裝置，可能還要再重新整理一次；之後的部署不會再發生這個問題。

### 2026-10-24：第二批——概念卡與每輪結算（已部署）
- **概念卡** `src/components/ConceptCard.astro`：每課練習區上方有一張「1 分鐘重點」卡（`<details id="concept-card">`）
  - 第 1 課：冠詞顏色、字尾猜性別
  - 第 2 課：動詞＋介系詞公式、Akk 與 Dat 的常見搭配
  - 第 3 課：9 組母音變化、haben 或 sein
  - 第 4 課：格位角色、冠詞表、介系詞分組
  - 第 5 課：四種語序的動詞位置圖
  - 第 6 課：字尾表與三條規則
  - 第一次造訪時展開，之後預設收合。用 `is:inline` script 在第一次繪製前處理收合，避免版面跳動；記錄的 key 為 `gw-concept-seen-l1`～`l6`
  - 課程對應方式：`LessonShell` 依網址在 `lessonLinks` 中的順序產生 `conceptKey`（`l1`～`l6`）
- **每輪結算**
  - `src/lib/roundTracker.mjs` 是純邏輯，測試在 `tests/roundTracker.test.mjs`
  - `answerFeedback.js` 每頁共用一個 tracker；`answerCue(correct, label)` 的第二個參數是**正確答案文字**，會列在結算的錯題清單中。六課都已傳入 label
  - `RoundSummary.jsx` 放在 LessonShell 頁首，顯示「本輪 n/10」的小進度條；第 10 題答完約 1.2 秒後跳出結算視窗，內容包含正確率環、今日作答數、連續天數、錯題清單，以及「再來一輪」「看重點卡」「回首頁」三個按鈕
  - 結算視窗開啟時（`[data-round-summary]`），各課的鍵盤快捷鍵都會暫停
- 驗證：31 個測試全數通過。在瀏覽器中測過第 4 課桌面版完整流程：連續答 10 題、跳出結算、點「看重點卡」會展開並捲動到概念卡、再次造訪時自動收合。也測過第 5 課和第 3 課的手機深色版，表格沒有溢出。

### 2026-10-24：全部內容正確性檢視與修正（已部署）
- 逐條檢查六課題庫和三個字庫，報告在 `docs/content-review-2026-10-24.md`，共修正約 80 處。
- 第 6 課產生器加入名詞與形容詞相容表（`NOUN_ADJECTIVES`）和各句型的名詞白名單（`allowedNounIds`）。**新增名詞或形容詞時，必須同時更新相容表**，否則不會產生題目。
- 第 5 課改錯題支援 `acceptedAnswers`，可列出其他正確寫法。
- `npm run audio` 會自動刪除已不存在文字的音檔。
- 字庫修正透過 JSON 結構套用到 `public/vocab/` 的所有副本，以及 `單字/` 原始檔（縮排 2 格，結尾換行維持各檔原樣）。
- 待辦：補上中文例句翻譯（隱藏版 87 句、A1–B1 449 句、第 3 課 160 句）。

### 2026-10-24：第一批 bug 與答案錯判修正（已部署）
對應 `docs/lesson-review-2026-10-24.md` 的「第一批」：
1. 第 1 課：翻面卡內的 details 不再觸發翻面；詞性題改成每個字固定 4 個選項（以 wordKey 當種子洗牌），並排除和答案部分重疊的選項
2. 第 2 課：新增 `src/lib/prepositionBlank.mjs`，可處理 ü、縮寫（am／vom／beim／zur…）、da- 和 wo- 複合詞；50 題全部能挖空（`tests/prepositionBlank.test.mjs`）。作答後會顯示「am = an + dem」這類說明。有兩種正確介系詞的動詞，不會再把另一個正確答案放進干擾選項
3. 第 3 課：情態動詞選項改用 `useMemo`，不再每次重新渲染就洗牌
4. 第 4 課：作答前隱藏格位徽章，線索中的格位名稱換成「？」；線索的英文術語翻成中文（`triggerText`）
5. 第 5 課：改錯題改為寬鬆比對（忽略大小寫、標點和空白）；改寫題和造句題與範例不同時，改成自評：並列顯示你的答案和範例，由使用者選擇「我的寫法也正確」或「我寫錯了」
6. 字卡跳動修正一併部署
- 驗證：29 個測試全部通過。在瀏覽器中測過第 1、2、4、5 課；第 3 課只確認建置成功。
- 下一步：內容正確性檢視（已完成，見下一則紀錄）。

### 2026-10-24：語音狀態不再推擠版面
- 使用者回報：按喇叭時出現「正在播放德語發音…」，字卡會往下跳。
- `useGermanSpeech` 現在會過濾「正在播放」和「正在準備」這類進度訊息，只保留錯誤提示；錯誤提示改成固定在畫面底部的 `.speech-toast`，不占版面（第 1～3 課都已套用）。
- 第 1 課「已載入字庫」的提示也改成 toast，4 秒後消失時不會讓卡片往上跳。
- 新增任何狀態訊息時，請一律使用 toast，不要插在內容區塊之間。

### 2026-10-24：各課內容檢視
- 使用者反映：介面變好看了，但課程內容和使用體驗仍然不好。逐課檢視的結果寫在 `docs/lesson-review-2026-10-24.md`，包含問題證據和三批修正順序。
- 最優先處理：第一批的 6 個 bug 和答案錯判問題，例如第 2 課有 20% 的填空題答案直接露出、第 4 課引導模式在作答前洩漏答案。

### 2026-10-24：推上 GitHub 並部署正式站
- 已 push 到 `origin/main`（GitHub Pawelsung/german-astro-site），並部署到 https://german-astro-site.web.app/ （只部署 Hosting，Firestore rules 未變動）。
- 本機沒有全域安裝 firebase CLI，部署指令是：`npx -y firebase-tools@14 deploy --only hosting --project german-astro-site --non-interactive`（CLI 已用 gtt.pawel@gmail.com 登入）。部署前務必先執行 `npm run build`。
- 部署後已驗證：手機尺寸首頁正常；音檔 manifest 2,838 筆，mp3 回應 200、audio/mpeg。
- 待使用者在實體手機上測試：iPhone 播放音檔、3D 翻卡、滑動評分、格位圖解。

### 2026-10-24：視覺化文法——冠詞顏色與格位句子圖解（已部署）
- **顏色系統**（`global.css` 的 `--g-*` 與 `--case-*` token，也有深色版本）
  - 性別：der 藍、die 紅、das 綠、複數紫，class 為 `g-der`、`g-die`、`g-das`、`g-pl`，小圓點用 `g-dot`
  - 格位：Nominativ 琥珀、Akkusativ 青、Dativ 洋紅，刻意不和性別撞色；徽章 class 為 `case-tone-*`，圖解用 `case-*`
  - 共用 helper：`src/lib/grammarColors.mjs`（`genderKey`、`splitArticle`）
- **第 1 課**
  - 字卡正面上緣有性別色條，冠詞文字也上色
  - 冠詞題的 der／die／das 按鈕各自上色，並附圖例
  - 字典列表的冠詞上色
- **第 4 課**
  - 答題後的回饋卡改用 `CaseDiagram.jsx`：目標詞用格位色框標出，觸發的動詞或介系詞用曲線箭頭指向目標；關係代名詞用虛線連回先行詞；目標詞旁有性別圓點，下方有圖例
  - 題目上的格位徽章改用新的格位色，「目標詞」前面加性別圓點
- **第 6 課**：題目上的名詞 chip 依冠詞上色
- **`src/lib/caseDiagram.mjs`**：從題庫既有欄位推導圖解，不需改題庫
  - 116 題中有 107 題能產生圖解；另外 9 題是介系詞分類，沒有句子
  - 能找到觸發詞的有 91 題；`reflexive + body part` 沒有單一觸發詞，屬於正常情況
  - 測試在 `tests/caseDiagram.test.mjs`，目前全部 27 個測試通過
- 已知限制：句子換行、觸發詞和目標分在不同行時，箭頭會從文字上方穿過。之後可改成在不同行時改用底線加編號的標示方式。
- 驗證：在瀏覽器中測過第 4 課（桌面淺色主詞題、Akk 動詞題，以及手機深色關係子句題），還有第 1 課冠詞題與字卡的顏色。

### 2026-10-24：Google 自然人聲（已部署）
- 人聲：`de-DE-Chirp3-HD-Charon`（男聲），由使用者試聽後選定。
- `npm run audio`（`tools/generate-audio.mjs`）會收集第 1～3 課所有 `speak()` 的文字，共 2,838 段、約 55,000 字元，產生到 `public/audio/de-charon/*.mp3`（約 24MB），對照表在 `public/audio/manifest.json`。
- 腳本採增量產生；遇到 429 會自動退避重試（Chirp 3 HD 有每分鐘配額）。
- `germanSpeech.mjs`：沒有手動選人聲時，優先播放 mp3；沒有對應音檔或播放失敗時，退回 `speechSynthesis`。`audioKey()` 是腳本和播放器共用的文字正規化函式。
- 語速：0.9 對應原速，其他語速用 `playbackRate` 等比換算。
- 驗證：22 個測試全數通過。在瀏覽器中按第 1 課的喇叭，確認播放 `/audio/de-charon/*.mp3`（200、audio/mpeg）。iPhone 實機尚未測試。

### 2026-10-24：第二階段「介面改版」（已部署）

完成項目：
1. **首頁重做**（`LearningDashboard.jsx`、`index.astro`）
   - 上方是「今日任務」主卡：問候語、每日目標環（10 題）、連續天數 🔥 和近 7 天作答量
   - 主按鈕的優先順序：先導向待複習的課，其次是上次的課，最後是從單字開始；另附「或繼續上次」連結
   - 三個統計小卡：待複習、已收藏、今日正確率
   - 6 張課程卡片放在同一個格狀區塊，各有進度條（已練／總題數）、待複習徽章，滑鼠移上時會浮起
   - 頁首改成精簡的 sticky 列，手機上登入只顯示「登入」
2. **每日活動紀錄**（`src/lib/dailyActivity.mjs`，測試在 `tests/activity.test.mjs`）
   - localStorage key 為 `gw-daily-activity-v1`，保留 60 天；上次造訪的課記在 `gw-last-lesson-v1`，由 `LessonShell` 寫入
   - **目前只存在本機，尚未加入 Firebase 同步**
3. **第 1 課字卡**改成 3D 翻面卡：點一下或按 Space 翻面；向右滑或按 `2` 表示「記住了」，向左滑或按 `1` 表示「還不熟」，下方也有兩個對應按鈕。評分會寫入 errors／attempts 並計入每日目標。
4. **手機版面**
   - 課程頁頁首變精簡：返回只顯示「首頁」、音效只顯示圖示、隱藏課程說明
   - 第 1 課「我的單字課程」在手機上可收合，只顯示目前教材和課次
   - 載入訊息 4 秒後自動消失；右下角主題按鈕縮小
5. 答錯震動改為使用者點過頁面後才觸發，避免 console 錯誤。

驗證方式：`npm run build` 成功，`npm test` 20/20 通過。在本機瀏覽器測過：
- 首頁：桌面淺色、桌面深色、手機深色，數字（今日題數、連續天數、正確率、上次課程）有正確更新
- 第 1 課手機版：翻面、拖曳滑動評分、收合選單
- 第 4 課手機版頁首
- 首頁 console 沒有 hydration 警告

未驗證：實體手機的觸控滑動手感、iOS Safari 的 3D 翻面效果、淺色模式下的第 1 課字卡。

### 2026-10-24：整理 Git 歷史（未 push、未部署）

先前約兩週的修改（Astro 升級、進度同步、單字工作台、第一階段互動）都混在工作區裡，現已依主題拆成以下 commit，依序建立在 `21bccb3` 之後：
1. `Upgrade to Astro 7 and patch Firestore dependency`：package.json、package-lock.json、astro.config.mjs
2. `Add source vocabulary and lesson data files`：`單字/`、`擴充資料/` 的原始資料（`A1-B1 part1.json` 仍依 .gitignore 不收錄）
3. `Unify progress tracking, review routing and German speech`：progressStorage、hooks、germanSpeech、首頁儀表板、帳號同步、第 2–6 課的進度與語音修正，以及 progress／speech 測試
4. `Replace lesson 1 iframe with native vocabulary trainer`：VocabularyTrainer、vocabulary.mjs、舊 iframe 轉址、共用課程導覽列、單字樣式，以及 vocabulary 測試
5. `Document the October upgrade validation`：docs/upgrade-validation.md
6. `Add answer feedback motion, sounds and shortcuts`：第一階段互動，以及這份交接文件

每個 commit 都另外在 worktree 中單獨建置並跑過測試。

### 2026-10-24：第一階段「讓作答有手感」（已完成，未部署）

完成項目：
1. **修正 Bug**：深色模式答對後，正確選項的文字消失。原因是 `text-emerald-900`、`text-rose-900` 等沒有深色覆寫。已在 `global.css` 補上 `-900` 文字色、green/red/cyan 色系，以及所有 `hover:bg-*` 的深色覆寫（之前 hover 會變成淺底）。
2. **答對／答錯動畫與音效**：第 1～6 課的選擇題都已接上 `answerCue`。答對時正確選項放大並發綠光，答錯時選錯的選項會搖晃並標紅。第 1 課冠詞和詞性模式原本作答後完全不標示對錯，現在也會標示。第 2 課測驗原本不標出使用者選錯的選項，已補上。
3. **回饋自動進入視線**：回饋卡出現時，若在畫面外會自動捲動過去，連同下方的「下一題」一起顯示（`scroll-mb-24`）。
4. **鍵盤快捷鍵**：
   - 第 1、2、4、6 課：數字鍵選答案；第 1、2、4、5、6 課：Enter 前往下一題
   - 第 1 課字卡：Space 翻面，←／→ 切換卡片
   - 第 3 課沿用原本的 ←／→／Space
5. **載入骨架**：新增 `LessonSkeleton.astro`，用 `slot="fallback"` 放進 6 個 lesson 頁，取代原本 2～3 秒的空白。
6. **音效開關**：位在 `LessonShell.astro` 右上角登入按鈕旁，用 🔊／🔇 切換。

驗證方式：`npm run build` 成功，`npm test` 17/17 通過。在本機 dev server、深色模式、1280×860 的瀏覽器中實測第 1～4 課的作答、快捷鍵、自動捲動與音效開關；第 5、6 課只確認頁面能載入、沒有錯誤，尚未逐題點擊。
未驗證：實際音效聽感、實體手機的震動與觸控、淺色模式逐頁目視、第 5 課詞塊排序題的動畫手感。

## 下一步（建議順序）

### 介面（使用者目前最在意）
- [x] 每輪 10 題的結算（2026-10-24 完成）
- [x] 六課統一三個入口（2026-10-24 完成）
- [ ] 第 2～6 課在手機上的篩選列和設定區，比照第 1 課改成可收合
- [ ] 第 2、3 課的字卡也改用 3D 翻面加滑動（目前只有第 1 課有）
- [ ] 每日活動 `gw-daily-activity-v1` 加入 Firebase 同步（`collectLocalProgress`／`mergeRemoteProgress`）

### 自然人聲（Google Cloud TTS）
- 已完成，見進度紀錄。之後**新增或修改任何會被 `speak()` 唸出的文字**（單字、例句、動詞形態）時，都要執行 `npm run audio`。腳本只會補產生缺少的音檔；可以先用 `npm run audio -- --dry-run` 看要產生幾個、共多少字元。
- [ ] 如果新增了會呼叫 `speak()` 的課程或欄位，記得把它加進 `tools/generate-audio.mjs` 的 `collectTexts()`

### 先前稽核留下、尚未處理的問題（見 `../german-site-audit/report.html`）
- [ ] 首頁「學習建議」導向錯誤的課程（應依待複習資料決定）
- [ ] 第 1 課錯題紀錄和首頁統計不一致
