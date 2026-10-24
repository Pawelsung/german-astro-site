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

## 進度紀錄

### 2026-10-24：第二階段「介面改版」（已 commit，未 push、未部署）

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
- [ ] 每輪 10 題後顯示結算畫面（答對率、答錯清單、再來一輪），做成共用元件，掛在 `answerCue` 的計數上
- [ ] 第 2～6 課在手機上的篩選列和設定區，比照第 1 課改成可收合
- [ ] 第 2、3 課的字卡也改用 3D 翻面加滑動（目前只有第 1 課有）
- [ ] 每日活動 `gw-daily-activity-v1` 加入 Firebase 同步（`collectLocalProgress`／`mergeRemoteProgress`）

### 自然人聲（使用者已選定 Google Cloud TTS 免費額度）
- [ ] 使用者需要先建立 GCP 專案、啟用 Text-to-Speech API、綁定帳單，並建立服務帳戶金鑰。**金鑰不能進 repo**，請放 `.env` 或本機路徑。
- [ ] 寫一支 `tools/generate-audio.mjs`：從各課資料取出所有單字和例句，去重後在本機一次呼叫 TTS，產生 mp3 放到 `public/audio/<hash>.mp3`，並輸出對照表 `public/audio/manifest.json`。建議用 `de-DE` Neural2 或 WaveNet 人聲；每月免費額度約 100 萬字元，足夠一次產生全部。
- [ ] `src/lib/germanSpeech.mjs`：有音檔時優先播放音檔，沒有才退回 `speechSynthesis`
- [ ] 新增單字時重新執行腳本，只產生缺少的音檔

### 先前稽核留下、尚未處理的問題（見 `../german-site-audit/report.html`）
- [ ] 首頁「學習建議」導向錯誤的課程（應依待複習資料決定）
- [ ] 第 1 課錯題紀錄和首頁統計不一致
