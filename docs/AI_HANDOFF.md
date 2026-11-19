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

- 每日活動：本機 `gw-daily-activity-v1` 的 `days`＝本機、`others[deviceId]`＝其他裝置；雲端 `learning/activity.value.devices[deviceId]` 保存各裝置，使用 `gw-device-id-v1` 識別。同裝置同日各欄取 max，顯示跨裝置加總，每台保留最近 60 個日曆日；不可將雲端形狀直接寫進本機 key。

- **顏色一律用色彩變數，深色模式自動切換**（2026-11-11 起，取代舊的 `.dark .bg-*` 覆寫做法）。完整規則見下方「顏色規則」，`tests/design-tokens.test.mjs` 會擋下違規。
- **動態規則（紙本練習簿）**：動畫一律寫成 `global.css` 共用 class（`fx-*`）。時間只用 `--motion-100/150/200/300`，進場用 `--ease-out`、離場用 `--ease-in`；純顏色轉場可用 `ease`，不超過 150ms。只動畫 `transform`／`opacity`，不回彈、不從透明淡入整個容器（動畫沒跑時仍須可見）；答對裝飾偽元素蓋章例外。SVG 格位畫線與進度圓環保留 stroke-dashoffset；骨架循環 1.4s、tooltip 等待 400ms 是有註解的時間例外。`tests/motion-tokens.test.mjs` 檢查時間、曲線、inline transition 與 keyframes。全站 `prefers-reduced-motion` 用 `!important` 縮短元素、偽元素及 inline transition／animation 的 duration 和 delay。
- 換題 `.fx-question` 預設從右 8px 進場；往回由 `.is-back` 設 `--page-enter-x: -8px`（可繼承）。第 2～8 課由 `LessonApp` 的 next／prev 設方向，第 1 課由 `move(delta)`／評分設方向；保持每題的 React key，才會重新播放。
- 答題回饋請使用共用模組 `src/lib/answerFeedback.js`，不要在各元件重寫。
- Git：2026-10-24 已將累積的未提交工作依主題拆成 6 個 commit（見下方進度紀錄），目前工作區乾淨。之後請維持「一個主題一個 commit」，push／deploy 前先和使用者確認。

## 顏色規則（Codex、Claude Code 都要照做）

所有顏色都定義在 `src/styles/global.css` 最上方：淺色值放 `:root`，深色值放 `:root.dark`。元件只用變數，深色模式就會自動正確，不需要再補任何 `.dark` 覆寫。`npm test` 會檢查以下四條，違反就失敗。

1. **元件和頁面只用色彩 class**，不用 Tailwind 的編號色（`bg-sky-100`、`text-slate-500`）或 `bg-white`、`text-white`。
2. **元件裡不寫色碼**（`#xxxxxx`、`rgb()`、`style={{ color: ... }}` 裡的色碼都不行）。
3. **`global.css` 的色碼只能出現在變數那一行**（`--name: value;`），規則裡一律寫 `var(--name)`。半透明用 `color-mix(in srgb, var(--name) 30%, transparent)`。
4. **不要再寫 `.dark .bg-*`、`.dark .text-*` 覆寫。** 深色要不一樣，就在 `:root.dark` 給該變數一個深色值。

### 該用哪個 class

| 用途 | class | 舊寫法（不要再用） |
| --- | --- | --- |
| 卡片、面板底色 | `bg-surface` | `bg-white` |
| 淡底區塊 | `bg-surface-soft` | `bg-slate-50` |
| 更明顯的灰底、膠囊 | `bg-surface-muted` | `bg-slate-100`、`bg-gray-100` |
| 分隔線、外框 | `border-line` | `border-slate-200`、`border-gray-100` |
| 主要文字 | `text-ink` | `text-slate-800`、`text-slate-900` |
| 次要文字 | `text-ink-soft` | `text-slate-600`、`text-slate-700` |
| 說明、提示小字 | `text-ink-muted` | `text-slate-400`、`text-slate-500` |
| 深色按鈕上的字 | `text-on-solid` | `text-white` |
| 彩色淡底（標籤、提示框） | `bg-{色}-soft` | `bg-sky-100`、`bg-emerald-50` |
| 彩色外框 | `border-{色}-line` | `border-sky-200` |
| 彩色文字 | `text-{色}-ink` | `text-sky-700` |
| 彩色進度條、圖示、強調外框 | `bg-{色}-solid`、`text-{色}-solid`、`border-{色}-solid` | `bg-sky-500` |
| 彩色實心按鈕（配 `text-on-solid`） | `bg-{色}-strong` | `bg-amber-600` |

`{色}` 只有七種：`sky`、`indigo`、`violet`、`emerald`、`teal`、`rose`、`amber`（藍系用 sky，綠系用 emerald，紅系用 rose，橘黃系用 amber）。

透明度照常加：`bg-surface/90`、`bg-sky-soft/60`。

### 自訂 CSS 該用哪個變數

- 版面：`--page-bg`、`--surface`、`--surface-soft`、`--surface-muted`、`--border`、`--text`、`--text-muted`、`--text-faint`
- 互動：`--accent-ink`（選中、連結字色）、`--accent-line`（外框、底線）、`--accent-hover`、`--focus-ring`
- 答對、答錯：`--good-*`、`--bad-*`，各有 `strong`、`soft`、`tint`、`line`、`ink`
- 課程頁（安靜版面）：`--calm-*`；冠詞與格位：`--g-der`、`--g-die`、`--g-das`、`--g-pl`、`--case-*`
- 陰影、遮罩：`color-mix(in srgb, var(--shadow) 12%, transparent)`
- LangLoop 深色卡（兩種模式都一樣深）：`--night-*`

### 需要新顏色時

1. 先找上面有沒有能用的。
2. 真的沒有：在 `:root` 和 `:root.dark` **各加一行**，名字寫用途（`--streak-ink`），不要寫色名（`--orange-500`）。
3. 要給 Tailwind class 用，再到 `@theme inline` 加一行 `--color-xxx: var(--xxx);`，就能寫 `bg-xxx`、`text-xxx`。
4. 跑 `npm test`，再用淺色、深色各看一次。

## 共用答題回饋模組 `src/lib/answerFeedback.js`

| 匯出 | 用途 |
| --- | --- |
| `answerCue(correct)` | 記錄今日作答（`dailyActivity.recordAnswer`），播放 WebAudio 合成音效（答對兩聲上揚、答錯一聲低音），答錯時在手機輕震。**新題型務必呼叫它，首頁的每日目標才會計數** |
| `useRevealOnShow(key)` | 回傳 ref；`key` 變成 truthy 時，若元素不在畫面內就平滑捲動到可見 |
| `useAnswerShortcuts({ options, answered, onSelect, onNext, enabled })` | 未作答時 `1`–`9` 選答案；作答後 `Enter`／`→` 下一題。焦點在輸入框時不觸發 |
| `SOUND_STORAGE_KEY` / `isSoundEnabled()` | 音效開關，localStorage key 為 `gw-sound-enabled`（預設開） |

答案按鈕需要加 `data-answer-option`，讓 Enter 在按鈕有焦點時仍能前往下一題。

CSS class（`src/styles/global.css` 檔尾）：
- `fx-correct`（偽元素綠框蓋章 200ms）、`fx-wrong`（4px 短搖頭 200ms）、`fx-enter`（回饋卡上滑 8px，不淡入）、`fx-question`（依方向水平滑入 8px，搭配每題 key）
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

### 2026-11-19 第 2、3 課字卡 3D 翻面（Codex 實作、Claude Code 審查，已部署）

- 限定 `codex-flip-3d` worktree／`codex/flip-3d`。共用 `FlipCard` 外層保留拖曳 transform／200ms 回位，新增 grid inner 以 300ms ease-out rotateY 翻面；兩面同格、各自 calm 卡片外框，高度取兩面較高者，長內容換行且不設定裁切。標籤／actions 只有一份，作為旋轉層外的定位覆蓋層，保持可點與位置固定。
- 點擊、Space、Enter 翻面；左右滑動／方向鍵維持換卡，footer 仍只在背面出現，seen ref 保留首次翻開才 report／markSeen。第 2 課目前程式實際有三個評分按鈕，本次不改評分；滑動不能表達完整評分選項，因此不採第 1 課滑動評分。
- 檢查兩個 Trainer 的 back、VerbForms、SpeakButton：沒有 mount 即朗讀／計數／記錄，故兩面同時 mount；朗讀按鈕只在點擊觸發。第 3 課 AutoSpeak 在正面，現在正面持續 mount，每張卡仍自動朗讀，翻回不再因 remount 重播。隱藏面以 aria-hidden＋inert 排除讀屏與 Tab；正面提示跟著正面翻走，移除背面 fx-reveal。
- reduced-motion 明確移除 inner／face transform，依 aria-hidden 用 visibility 切換，兩面仍參與高度計算。Safari 防護含標準／webkit backface 隱藏，3D 祖先不加 overflow:hidden，操作層不放入旋轉樹。
- 驗證：新增 `tests/flip-card.test.mjs` 三項結構／無障礙／reduced-motion 靜態測試；`npm test` 156 個全過，`npm run build` 成功（10 頁），`git diff --check` 通過。
- Claude Code 審查：原本兩面只有內容高度，卡片在手機上比舊版短一截、下方空白仍可點擊翻面；改成 `.lc-flip` 為直向 flex、`.lc-flip-inner` `flex: 1` 加 `grid-template-rows: minmax(0, 1fr)`，兩面填滿卡片區，和舊版一樣高。本機 375px 實測第 2、3 課：翻面中途 inner 為 rotateY 動畫、結束為 180deg；隱藏面 aria-hidden／inert 正確；收藏按鈕不會觸發翻面；評分後換下一張且回到正面；第 3 課背面長內容沒有被裁切、無橫向捲動；主控台沒有錯誤。
- 還沒做什麼：iPhone Safari 實機的翻面閃爍、VoiceOver 與拖曳手感；reduced-motion 只靠 CSS 與測試，沒有在瀏覽器切換系統設定實測。未 push。

### 2026-11-19 處理 4 個可疑詞條（Claude Code 撰寫、german-reviewer 校對，已部署）

- 使用者請 Claude Code 自行判斷。`corrections.json`：Kunstwerkladen → der Kunstladen、Sonderkräfte → die Spezialkräfte（只用複數）、Bauarbeitsgerät → das Baugerät 三筆改名（舊 id 進 `redirects.json`，進度不遺失）；Bildmodell 保留，釋義改為「（AI）圖像生成模型」。4 句例句放在 `tools/lexicon/examples/batch-06.json`，細節見 `tools/lexicon/examples/notes.md`。
- 獨立校對沒有必須修正；採納 4 項建議（複製畫、fotorealistische Bilder、「生成」、Spezialkräfte 譯為警方特勤人員），並把「只用複數」移出釋義，避免中翻德時洩漏答案。
- 驗證：重新執行 `apply-tags.mjs`、`build-site-data.mjs`；`npm test` 全過；`npm run audio` 產生 7 段（344 字元）。
- 還沒做什麼：使用者抽查。

### 2026-11-19 每日活動跨裝置同步（Codex 實作、Claude Code 審查，已部署）

- 限定 `codex-activity-sync` worktree／`codex/activity-sync`。修改 `dailyActivity.mjs`、`progressStorage.ts`、`UserAccount.jsx`；新增／擴充 `activity.test.mjs`、`activity-sync.test.mjs`。舊 days 直接歸這台裝置，recordAnswer 保留 others；顯示今日／近 7 天／連續天數時跨裝置加總。純函式合併同裝置同日各欄取 max，回補自己的雲端紀錄，忽略壞資料並修剪最近 60 天、移除空裝置。
- collectLocalProgress.activity 一律回傳雲端 devices；上傳前讀 activity 合併、回寫本機 days／others 並通知首頁，再依雲端形狀比較內容／雜湊，沒變不寫。下載也走同一轉換。activity 事件使用既有 700ms 延遲。activity 文件整份替換合併結果，避免 Firestore 深層 merge 留下過期裝置；其他文件原流程不變。
- 額度：相較原流程，每輪最多多讀 activity 1 次、多寫 activity 1 次；沿用既有 progressMeta，不新增另一份 metadata 或即時監聽。上傳活動沒變時不額外讀寫；完整下載多讀 1 次。
- Claude Code 審查後修正兩點：(1) 裝置 id 存不進去（儲存空間滿或被擋）時，`collectLocalProgress().activity` 回傳 null，該輪不上傳活動，不再讓整個同步失敗，也不會用空值蓋掉雲端；(2) 合併允許到「今天＋2 天」的日期，時區較快的裝置（例如在台灣、另一台在德國）記下的「明天」不會被丟掉。各補一個測試。
- 驗證：`npm test` 153 個全過；`npm run build` 成功（10 頁）。本機瀏覽器用測試資料確認：本機 days＋其他裝置 others 加總後連續天數為 3、作答後 days 增加且 others 保留、主控台沒有錯誤。測試涵蓋舊格式、5+6＝11、跨裝置連續天數、冪等／交換律、自己雲端回補、60 天邊界、整台過期、壞資料、轉換／雜湊／事件及同步後繼續作答。
- 歷史補充：2026-11-09 的「連續天數仍分開計算」及舊「目前只存在本機」描述已由本次實作改善，歷史原文保留。
- 還沒做什麼：未使用真實 Firebase 帳號／兩台實機驗證，未 push；換帳號登入時，前一個帳號在這台裝置的 others 會一起帶到新帳號（和各課進度現有行為相同）；未改 rules 或上次課程。沿用先讀後寫流程，兩台恰好同時讀到舊文件再覆寫仍有競態，後續同步可由各台本機紀錄補回，沒有加入會增加讀取次數的 transaction。


### 2026-11-19 全站紙本練習簿動態（Codex 實作、Claude Code 審查，已部署）

- 限定 `codex-motion` worktree／`codex/motion`：新增 4 個時間 token 和進出場曲線，移除 pop／glow／回彈；答對改偽元素綠框蓋章，答錯 4px 短搖頭，選項／評分按鈕壓至 0.98，填空落筆 150ms。回饋卡／toast／重點卡 200ms，底部選單／結算彈窗 300ms，仍只有位移、不從透明開始。
- 第 2～8 課 `LessonApp` 於 begin／next 重設前進、prev 設 `.is-back`，透過 CSS 變數繼承給各題 `.fx-question`；第 1 課 `move(delta)` 接上一個／下一個、左右鍵，評分前進，字卡也加入水平進場。每題既有 key 保留。
- 第 1 課 3D 翻面 300ms、拖曳放開 200ms（離場評分等待也對齊 200ms）；第 2、3 課共用 `FlipCard` 拖曳中無 transition，放開 200ms 回位，背面內容 4px 上滑 150ms。`CaseDiagram` 目標 4px 上滑、畫線 300ms、連線 200ms，逐項延遲用 100ms token 倍數。
- 進度條／圓環統一 300ms（含首頁 inline），首頁課程卡／LangLoop hover 改上浮 2px／150ms 並移除陰影轉場。主題選單開 150ms ease-out／關 100ms ease-in，用 `inert` 管理關閉時的焦點與可及性，避免 visibility 立即隱藏退場。tooltip 100ms，保留 400ms 等待。骨架閃光改為偽元素 transform，保留 1.4s 循環。確認 src 無引用後刪除 `src/lib/flipStyles.mjs`（歷史紀錄提及處保留）。
- 驗證：`npm test` 145 個全過（新增 `motion-tokens.test.mjs` 5 個檢查）；`npm run build` 成功，10 頁；`git diff --check` 通過。reduced-motion 全站 `!important` 涵蓋所有新動畫、偽元素及 inline transition，並補 duration／delay 的靜態檢查。
- Claude Code 審查：讀過全部 diff；本機手機寬度實測第 8 課換題（前進 `fx-page` 8px、按上一題變 `.is-back` −8px）、答對蓋章框、答錯搖頭、回饋卡 200ms，第 2 課字卡翻面背面排版與放開回位，主題選單開關的 `inert`／曲線，主控台無錯誤。之後 commit、`main` 快轉、部署 Hosting。
- 還沒做什麼：未在 iPhone 實機試拖曳手感；深色與 reduced-motion 只靠 CSS 規則與測試，沒有逐頁看。

### 2026-11-19 主字庫缺例句補寫（Codex 撰寫、獨立校對，已部署）

- 背景：課程筆記字庫原本有大量樣板例句（「Im Unterricht lernen wir heute das Wort …」），網站早已排除，所以主字庫有 445 筆沒有例句（其中 307 筆在第 1 課出題範圍）。舊做法（改 `tools/vocab-review/examples.json`）已不適用，改成直接補主字庫。
- 流程：Codex 在 worktree `codex-examples`（分支 `codex/lexicon-examples`）照 `content-writer` 規則撰寫；5 個 `german-reviewer` 各校一批（文法硬錯 1 句，其餘多為翻譯腔、時態、不自然），Codex 依表修正，Claude Code 審查程式與資料差異、代為 commit。使用者指示不必抽查、直接部署。
- 接線：`apply-tags.mjs` 在 corrections（含 rename／merge）之後讀 `tools/lexicon/examples/*.json`（不讀 `todo/`），只補空的 examples；id 不存在、已有例句、空白內容都會丟錯；不清 flag。`corrections.json` 新增 `preserveFlags`。新測試 `tests/lexicon-examples.test.mjs`。之後要補例句就加檔到 `tools/lexicon/examples/`，再跑 `apply-tags.mjs` → `build-site-data.mjs`。
- 結果：441 句例句與音檔（Chirp 3 HD，26,688 字元）。順帶修正 6 筆釋義（das-handwerk、der-lohn、der-brokkoli-auflauf、der-unterrichtsplan、allerheiligen、die-bauchspeicheldruese），`das-karamell` 改名為 `der-karamell`（有 redirect，進度不遺失）。逐欄比對確認主字庫只有這些變動。
- 驗證：140 個測試全過、建置成功；正式站 A1 字庫資料含新例句、新音檔回 200。
- 還沒做什麼：4 筆可能是筆記誤記，**沒有例句，等使用者對照原始筆記**（見 `tools/lexicon/examples/notes.md`）：der-kunstwerkladen（常用 Kunstladen／Kunsthandlung）、das-bildmodell（可能是 AI 圖像生成模型）、die-sonderkraefte（常用 Spezialkräfte）、das-bauarbeitsgeraet（常用 Baugerät）。未在瀏覽器逐字檢視第 1 課的例句顯示。校對另提：das-objekt 釋義排序、der-sonnenstich 用「中暑」、der-knick 程度偏高、der-gleichstrombeschleuniger 過於專門，都未處理。

### 2026-11-18 第 8 課 Passiv（Codex 實作、Claude Code 審查，已部署）

- 分工：Codex CLI 在 worktree `codex-passiv`（分支 `codex/passiv-lesson`）實作，Claude Code 審查程式並操作瀏覽器，`german-reviewer` 獨立校對德文兩輪。
- 新增 `lesson8-passiv.astro`、`PassivTrainer.jsx`、`lesson8-passiv.ts`、`passiv.mjs`（朗讀用的完成句）、`tests/passiv.test.mjs`：A2～B1 原創 49 題，7 階段各 7 題（現在式形式、主動改被動、Präteritum、Perfekt、情態動詞、von／durch、狀態與過程判斷）。結構照抄第 7 課（LessonApp／ChoiceCard），首頁題數、導覽、複習入口、雲端同步、進度摘要都已接上；新 key `german-lesson8-passiv-progress`，既有 key 與格式沒變。
- 德文校對後修正：干擾選項不能靠作答後才出現的 trans／explain 排除，所以 modal-3 的 sein、past-1～7 的 würde／würden、forms-7 的 kochen 都換成明確錯誤的形式；transform-3、agent-6 的翻譯改成和德文一致；8 處翻譯腔改成口語。
- 音檔：新增 49 段 Chirp 3 HD（1,591 字元）。
- 驗證：138 個測試全過、建置 10 頁；本機手機寬度淺色、深色走過作答與回饋；正式站 `/`、`/lesson8-passiv/`、新音檔都回 200，第 8 課頁面主控台沒有錯誤。
- 部署：`main` 快轉到 `codex/passiv-lesson` 後，在主資料夾（有 `.env`）建置，`npx -y firebase-tools@14 deploy --only hosting`。沒有 push。
- Codex 協作注意：`codex exec -s workspace-write` 不能寫 worktree 的 git index，所以 commit 由 Claude Code 代做；worktree 的 `node_modules` 不要用符號連結（Vite 開發伺服器會 403、頁面空白），用 `cp -cR` 複製。
- 還沒做什麼：未在 iPhone 實機試；沒有「完成式＋情態動詞」（hat … werden müssen）題目，若要涵蓋 B1+ 可再補。

### 2026-11-17 第 1 課電腦版練習模式列溢出（Claude Code，已部署）

- 使用者回報：電腦上第 1 課 7 個練習模式按鈕超出欄寬，設定按鈕蓋住「字典」；「匯出備份／匯入 JSON」文字被擠成兩行。
- 原因：calm 版面在電腦上欄寬只有約 530px，但模式按鈕各有 24px 左右內距且不能縮；手機版的修正只在 640px 以下生效。
- 修正：`global.css` 新增 `min-width: 641px` 的 `.calm-page .vocab-tabs`（按鈕平分整列）和 `.vocab-tools`（匯出／匯入按鈕依內容寬、不換行）。
- 驗證：本機 1280px（深色）和 700px（淺色）模式列不溢出、設定按鈕在「字典」右邊、匯出／匯入按鈕單行 44px；375px 手機版維持 4 欄兩排，未受影響。
- 先把 main 的黃色配色等 7 個 commit 合併進來（只有本檔衝突，兩筆紀錄都保留），再快轉 main 到 `6d1dcc1`、建置、`npx -y firebase-tools@14 deploy --only hosting`。
- 驗證：134 個測試通過；建置 9 頁；正式站 1280px 模式列不溢出、設定按鈕在「字典」右邊、匯出／匯入按鈕單行。
- 還沒做什麼：未在使用者自己的電腦瀏覽器確認（若仍看到舊版，請重新整理）。

### 2026-11-12 配色改成柔和版 Reclam 黃（Claude Code，已部署）

- 使用者從配色比較頁選 E（Reclam 黃），要求更柔和。比較頁：claude.ai artifact「德語工作台配色」。
- 做法（都在 `global.css` 的 `--calm-*` 區塊，全站中性色本來就指向它）：
  - 底色暖紙 #f7f3ea、文字暖黑 #2b2722、強調色（文字、焦點框、進度條）赭黃 #7a5a0c，深色模式為 #ebcb6b。
  - 新增 `--calm-fill`（奶油黃 #f3d36b）＋ `--calm-on-fill`、`--calm-fill-line`：主要按鈕、選中的模式／分頁／篩選、評分「記住了」、結算彈窗主按鈕都改用它。
  - 新增 `--calm-card`、`--calm-card-line`：首頁「今日複習」卡改成淡黃卡；`--calm-cta`、`--calm-on-cta`：卡上的按鈕淺色模式為暖黑底黃字，深色模式為黃底暖黑字。
- 冠詞色、答對答錯的紅綠都沒動；黃色是唯一不和冠詞色衝突的色相。
- 驗證：134 個測試通過、建置成功；9 頁加各課入口畫面，淺色、深色對比全部達標；手機寬度截圖確認首頁、第 1、2 課。

### 2026-11-12 字體改成霞鶩文楷 + Atkinson（Claude Code，已部署）

- 使用者從字體比較頁選定「文楷」組合（比較頁：claude.ai artifact「德語工作台字體」）。
- 做法：`Layout.astro` 從 Google Fonts 載入 LXGW WenKai TC（400、700）和 Atkinson Hyperlegible Next（400、700、800）。`global.css` 的 `--font-body` 把 Atkinson 放第一：它沒有中文字，所以中文自動落到霞鶩文楷，所有拉丁字母（德文、數字）都用 Atkinson，不需要逐一標 `lang`。**新增字型時順序不能改。**
- Atkinson 的 0 中間有一條斜線，是為了和 O 區分，屬於刻意的設計。
- 配色還是現行墨綠，使用者還沒決定要不要換成第二輪的 E（Reclam 黃）或 F（作業簿）。
- 驗證：134 個測試通過、建置成功；瀏覽器確認兩套字型都有載入、首頁與第 1 課顯示正常。

### 2026-11-12 全站改用同一套暖色中性色並部署（Claude Code，已部署）

- 使用者回饋：實際使用感覺不出顏色有變。原因：前一輪是把顏色改成變數（結構整理），刻意不改外觀。
- 這次修的是看得出來的問題：課程頁和首頁的「今日複習」卡用暖色（米白／炭灰），首頁其他部分還是冷色（淺色藍白、深色藏青），同一個畫面兩套色系。
- 做法：`:root` 的中性色（`--page-bg`、`--surface`、`--border`、`--text`、`--ink-*`、`--accent-*`、`--focus-ring`）全部指向 `--calm-*`，深色由 calm 的深色值自動切換；原本只在課程頁生效的 `body:has(.calm-page)` 對應刪掉，全站一致。深色 `--calm-muted` #a3a1a8 → #aeacb3（第 5 課提示字對比）。
- 各課的識別色（藍、綠、琥珀、紫、青）沒有變。
- 驗證：134 個測試通過、建置成功；9 頁加各課入口畫面，淺色、深色對比全部達標。
- 另外：使用者同意後，把主資料夾裡沒追蹤的 `audit/`（10 月的截圖和 TTS 試聽檔，沒有任何地方引用）移到垃圾桶（`~/.Trash/german-astro-site-audit-2026-10`）。

### 2026-11-11 VectorLab 與 ui-consistency 檢查與修正（Claude Code，未部署）

- VectorLab（表單、錯誤、空白、載入、鍵盤、點擊面積）修正：
  - 登入、同步錯誤訊息改成使用者看得懂、附下一步的句子；不再顯示 Firebase 原始訊息或代碼（開發用細節留在 console）。手機上首頁頁首的狀態字是隱藏的，所以登入失敗、儲存空間不足改用 `speech-toast` 提示（`UserAccount.jsx` 的 `notify`）。
  - 第 1 課匯入備份失敗不再顯示 JSON 解析的原始錯誤。
  - 結算彈窗：Tab 只在彈窗內循環，關閉後焦點回到原本的位置；背景不再從透明淡入（動畫不跑時會整個看不到）。底部選單 `picker-rise` 同理只做位移。
  - 深淺色選單可按 Esc 關閉，焦點回到按鈕。
  - 圖示按鈕（`.calm-icon`）滑過或鍵盤聚焦時顯示 aria-label 文字提示。
  - 手機點擊面積補到 44px：首頁登入／同步／登出、深淺色按鈕、第 1 課分頁與篩選、收藏、小播放鈕、第 6 課速查分頁。
  - 第 5 課連接詞卡片篩選後沒有結果時，提供「顯示全部語序類型」。
- ui-consistency（課程頁一致性，清單見下）修正：
  - 色彩變數在課程頁（`body:has(.calm-page)`）改指向 calm 色系，取代原本 `.calm-page` 上的同類設定，對話框也一起套用。第 2、3、6 課自己寫的卡片因此和其他課一致；並拿掉卡片陰影。
  - 第 1 課主要按鈕與選中狀態由藍色改為 calm 主色，和其他課相同。
  - 第 2 課動詞列表：展開列原本是可點的 div，鍵盤無法操作，改成按鈕（含 aria-expanded），收藏按鈕補 aria-label；搜尋框不再拿掉焦點框。
  - 10、11px 的小字改成 12px（第 2、6 課、首頁課程卡、LangLoop 卡）。
  - 對比微調：`--calm-bad` #c2344d → #b42d45。
- 課程頁一致性約定（新功能請照做）：外框 `.calm-page`、圖示鈕 `.calm-icon`（要有 aria-label）、主要按鈕 calm 主色、次要連結 `.calm-link`、空白／狀態文字 `.picker-status`、展開卡片 `lc-details`／`lf-card`、朗讀用 `SpeakButton`、提示用 `.speech-toast`、字級不小於 12px、可展開的列用 `<button aria-expanded>`。
- 驗證：134 個測試通過、`npm run build` 成功；9 頁加各課入口畫面，淺色、深色對比全數達標；手機寬度掃過所有按鈕都 ≥ 44px；結算彈窗的 Tab 循環、Esc、焦點返回，與深淺色選單 Esc 都用瀏覽器實測過。
- 還沒做什麼：首頁的 Email 登入表單目前沒有任何地方會顯示（只用到精簡版），沒有改它。

### 2026-11-11 顏色改成色彩變數，深色模式不再靠覆寫（Claude Code，未 commit、未部署）

- 使用者要求：把顏色一次整理好，並寫成 Codex 也能照做的規則。
- 做法：
  - `global.css` 最上方是唯一的色彩來源：`:root` 淺色、`:root.dark` 深色，`@theme inline` 把它們變成 Tailwind class（`bg-surface`、`text-ink-muted`、`bg-sky-soft`⋯）。
  - 8 個元件／頁面的 216 個 Tailwind 編號色（`bg-sky-100`、`text-slate-500`、`bg-white`⋯）全部換成色彩 class；刪掉約 180 條 `.dark .bg-*`、`.dark .text-*` 覆寫；自訂 CSS 的色碼全部改成 `var(--…)`，陰影改 `color-mix(var(--shadow) …)`。
  - 新增 `tests/design-tokens.test.mjs`：元件用編號色、寫色碼、CSS 規則裡寫色碼、再寫 `.dark` 覆寫，`npm test` 都會失敗。
  - 規則寫在本文件「顏色規則」，`AGENTS.md`、`release-checker`、`ux-reviewer` 已同步。
- 視覺上的變化（刻意的）：`text-slate-400` 這類太淡的說明字一律改用 `text-ink-muted`；淺色 `--ink-muted`/`--text-muted` 由 #64748b 調深為 #5b6474；冠詞綠 `--g-das` #16a34a → #15803d、紅 `--g-die` #dc2626 → #b91c1c（淺色），都是為了對比達 4.5:1。amber 實心按鈕改 #b45309（白字對比夠）。
- 驗證：134 個測試通過、`npm run build` 成功。用瀏覽器在 9 個頁面，以及各課開始頁上的每個入口（動詞列表、錯誤紀錄、參考表、文法速查、1 分鐘重點等），淺色和深色各跑一次對比檢查，全部達標。
- 還沒做什麼：sloplint 的 FAIL 48 剩下的都是 `:root.dark` 的變數宣告（工具不認得這種深色區塊，不是問題）；WARN 74 是色票本身取自 Tailwind 預設色，要換整體配色才會消失，屬於設計決定，沒有動。

### 2026-11-11 Hallmark 介面整體檢查與修正（Claude Code，未 commit、未部署）

- 範圍：9 個路由，sloplint（app scope）＋內建瀏覽器實看桌面、手機、深淺色。檢查報告在 worktree `claude/hallmark-detailed-check-ddca47` 的 `.hallmark/audit.md`（未進 git）。
- 已修：
  - 第 1 課結算彈窗：紫藍漸層改成 `--calm-accent`，彈窗不再回彈；「第 N 輪完成」併進標題。
  - 所有進度條（`.calm-progress`、`.today-bar`、`.round-pill-bar`、首頁課程卡）改用 `transform: scaleX`，JSX 傳 `scaleX(比例)`，不再傳 width。**新增進度條請照這個做法。**
  - `transition-all` 改成只轉場 transform、box-shadow（首頁課程卡、LangLoop 卡）。
  - 停用狀態：`.vocab-answers button:disabled`、`.calm-primary:disabled` 改用底色＋字色＋游標，不再只靠透明度。
  - 對比：`.kbd-hint` 改 `--text-muted`；淺色 `--calm-muted` #76747c → #68666e；新增 `--accent-ink`（選中分頁）、`--focus-ring`（焦點框），深色各有一組值。
  - `.fx-enter` 只做位移、不從透明開始，動畫沒跑時內容仍看得到。
  - `html, body` 改 `overflow-x: clip`（原本 hidden，sticky 頁首會失效）。
  - 手機首頁深淺色按鈕移到右下角，頁面底部留空，不再蓋住課程卡。
  - 拿掉字距小標（`UserAccount`、首頁課程卡、LangLoop 卡），課程卡小字由 slate-400 改 slate-500；`h1–h3` 加 `text-wrap: balance`。
  - 刪除沒用的 `Welcome.astro`、`NounChallengeApp.jsx`、`src/assets/astro.svg`、`background.svg`、`.home-hero`、`.home-cta`（使用者同意）。
- 驗證：129 個測試通過，`npm run build` 成功；手機寬度看過首頁、第 1、2 課的淺色和深色，sticky 頁首正常、沒有橫向捲動。sloplint FAIL 從 246 降到 178，剩下的是寫死色碼（48）與已判定保留的項目（文法列表的中間點、動詞三態的破折號）。
- 還沒做什麼：結算彈窗沒有實際答完 10 題看過（只改顏色和動畫）；`global.css` 寫死色碼改成變數、深色覆寫逐步移除，是另一件較大的工作。

### 2026-11-11 LangLoop 生字本排進複習（Claude Code，已部署）

- 使用者需求：在 LangLoop 播放器點不會的單字，看詞性、相關單字、例句並儲存，存下的字要進這裡的複習。
- 做法：LangLoop 把字存在自己的 Supabase（`saved_words`），這裡不給 LangLoop 寫 Firestore 的權限。首頁 `LangLoopCard` 確認是受邀帳號後，呼叫 LangLoop `GET /api/words`（Firebase ID token），`reviewBridge.importFromLangLoop` → `src/lib/langloopWords.mjs` 在本機 review 紀錄裡加星號，並記一次「不會」、當天到期，再由原本的雲端同步帶到其他裝置。**儲存格式沒有改。**
- 規則：只收複習字庫（index 第 7 欄為 1）裡的 id；星號的時間 = LangLoop 儲存時間，用來避免重複匯入，在這裡取消星號後，除非在 LangLoop 重新儲存，否則不會再加回來。
- LangLoop 用的字庫是 `LangLoop/scripts/sync-lexicon.mjs` 從這裡的 `src/data/lexicon/site/` 複製過去的；這裡的字庫改了要在 LangLoop 重跑。
- 驗證：129 個測試通過（新增 `tests/langloop-words.test.mjs`），`npm run build` 成功。
- 還沒做什麼：LangLoop 字庫裡沒有的字還不會進這裡的複習（要收非字庫字才需要改格式）。

### 2026-11-10 第 2、3 課預設測驗與常用入口（Claude Code，已部署）

- 使用者決定：加回第 2 課測驗的積分和連勝（本次開啟頁面內計算，不存檔，和改版前相同）；第 2、3 課開始頁預設選測驗，字卡排最後；第 3 課「錯誤紀錄／需要複習／已收藏」放到開始頁；第 4 課參考表、第 6 課文法速查放到開始頁連結。
- 驗證：123 個測試通過；本機手機寬度確認預設選項、計分、各連結都正常。
- 還沒做什麼：未在 iPhone 實機試用。

### 2026-11-10 第 1～7 課檢查答案外露與測驗入口（Claude Code，已部署）

- 使用者回報：第 2 課字卡正面寫了介系詞（答案），而且找不到測驗。
- 修正：字卡正面的標籤不再顯示介系詞；`LessonApp` 的 filter 加 `onStart`，第 2、3 課的字卡和各種測驗直接列在開始頁，不放進範圍選單，名稱都標明「測驗」。
- 驗證：121 個測試通過；本機手機寬度確認字卡正面沒有答案、切換測驗後題數和題目正確。
- 逐課用腳本掃題庫，比對答案是否在作答前出現。修正：第 5 課排序題的詞塊原本依正確順序顯示（`scrambled`，改版前就有）；第 4 課線索或目標詞含答案時作答前先隱藏（`revealsAnswer`）；第 1 課手機上 7 種練習改成兩排，不再被切掉。
- 驗證：123 個測試通過；本機手機寬度確認第 1 課 7 個按鈕都看得到、第 5 課詞塊已打亂、第 4 課 Nominativ 題目標詞不帶冠詞。
- 未改：第 7 課有 2 題句子後半本來就有同一個字（würdest），屬題目內容；第 4 課關係代名詞題的先行詞本來就在句子裡。
- 待使用者決定：是否加回第 2 課的積分和連勝；開始頁是否預設選測驗。

### 2026-11-10 全站例句語音與播放鍵統一（Claude Code，已部署、已合併 main）

- 做了什麼：所有播放鍵統一用 `components/lesson/SpeakButton.jsx`。第 4、5、6 課原本完全沒有語音，答完可播整句；第 2 課測驗、第 3 課字卡與助動詞／情態動詞、第 1 課字典和答題回饋都補上例句播放。朗讀文字規則在 `lib/lessonSpeech.mjs`，需要錄音的清單在 `tools/audioTexts.mjs`，新增 549 段 Chirp 3 HD 音檔（約 19,500 字元，音檔總量 70 MB）。
- 驗證：121 個測試通過，`tests/audio-coverage.test.mjs` 確認每段朗讀文字都有錄音檔；本機逐課點按播放鍵都走錄音，沒有退回系統語音。
- 新增會朗讀的文字時：改 `audioTexts.mjs`，先 `--dry-run` 再產生，否則覆蓋測試會失敗。
- 還沒做什麼：第 5 課「配對」題（1 題）答案是中德混合，沒有語音；重點卡裡的示範短句沒有播放鍵；未在 iPhone 實機試聽。

### 2026-11-10 第 1～6 課換新外框（Claude Code，已部署）

- 做了什麼：第 6、4、5、2、3 課改用 `LessonApp`，全部題型都保留，進度沿用原本的 key 和格式；第 1 課換外框，內部 7 種練習不變。刪除 `LessonShell`、`LessonModes`、`LessonSkeleton` 和對應樣式。各課詳細做法見 `docs/phase2-lesson-redesign.md`。
- 驗證：119 個測試通過、建置通過；本機手機寬度用腳本走完第 2～6 課各練習方式的整輪（第 2 課字卡、wo/da、例句，第 3 課字卡、拼寫、助動詞、情態動詞，第 4、5、6 課），無橫向捲動、無主控台錯誤，第 5 課的排序、改寫、改錯、自我對照也走過；進度有寫入原本的 key。淺色和深色看過字卡、範圍選單、列表、文法速查。
- 還沒做什麼：未用真實帳號和 iPhone 實機測試；第 2 課的格位判斷、第 5 課的配對和短文填空只走過共用流程，抽到才會測到。

### 2026-11-10 第 7 課換新畫面、共用外框、課程進度上傳合併（Claude Code，已部署）

- 做了什麼：`LessonFrame.astro` 加 `components/lesson/`（`LessonApp`、`ChoiceCard`、`BottomSheet`）；第 7 課改用新外框，進度仍寫在原本的 key，格式不變。`VocabPicker` 改用共用的 `BottomSheet`，樣式前綴由 `.vp-` 改成 `.picker-`。第 2～7 課上傳前先和雲端合併（`mergeLessonValue`），第 2 課歷史紀錄重複合併不會變多。
- 驗證：119 個測試通過、建置通過；本機手機寬度走完整輪 10 題、`?review=1`、鍵盤 1 和 Enter、範圍記憶、「⋯」選單、重點卡，淺色和深色都看過；題目和答案不用捲動。
- 還沒做什麼：第 6、4、5、2、3 課與第 1 課外框，順序見 `docs/phase2-lesson-redesign.md`；未用真實帳號測上傳合併。

### 2026-11-10 規劃第 2～7 課改新風格（Claude Code）

- 做了什麼：規格草案在 `docs/phase2-lesson-redesign.md`，含手機實測數據、步驟和 4 個待使用者決定的事項。沒有改程式。
- 驗證了什麼：實際量過六課手機版的練習區位置、頁面高度和控制項數量，並讀過各課模式與進度格式。
- 還沒做什麼：等使用者確認後才實作。發現第 2～7 課上傳時沒有先和雲端合併，可能跨裝置互相覆蓋，列為步驟 0。

### 2026-11-10 第 1 課加入分級字庫與新選單（Claude Code，已部署）

- 做了什麼：`src/lib/vocabLevels.mjs` 把主字庫轉成第 1 課用的字庫（只收出題池的字：A1 680、A2 648、B1 1100、B2 160），依主題分組，超過 40 字自動切開，B2 整包一組。瀏覽器銜接在 `reviewBridge.js`（`loadLevelPresets`、`loadLevelWords`、`alignSavedWords`）。字庫 id 是 `level-A1` 這種格式，存在 `ui.preset`。
- 介面：`src/components/VocabPicker.jsx` 取代原本三個下拉選單，用原生 `<dialog>` 做底部選單，樣式 `.vp-*` 用 `--calm-*` 色票。舊字庫放在「我的教材」，一份都沒刪。
- 進度：舊字庫和主字庫的中文釋義可能不同，切到分級字庫時用詞條 id 對應舊的錯題與收藏（`alignSavedWords`）。
- 順手修：`.speech-toast` 的動畫蓋掉置中用的 transform，手機上提示會被切掉，改用 `margin-inline: auto` 置中。
- 驗證：110 個測試通過；本機手機寬度、深色模式實際操作選程度、選主題、7 種練習都有字。
- 還沒做什麼：未用真實帳號測；第 2～7 課改新風格（使用者已要求，要先規劃、確認再做）。

### 2026-11-09 修正跨裝置同步（Claude Code，已部署）

- 使用者實測跨裝置沒有同步。查出四個原因並修正：
  1. 今日完成字數只存在各裝置，現在放進複習紀錄的 `settings.dayDone`（`withDayDone`、`doneToday`，合併時取較新的一天、同一天取較大值）。
  2. 上傳會整份覆蓋雲端，另一台的字可能被蓋掉；`syncLocalProgress` 現在先讀雲端、用 `mergeReviewValues` 合併再寫。
  3. `/review` 載入後才收到雲端資料時，評分會用舊資料蓋回去；`persistReview` 改為先合併，並監聽沒有 `detail.key` 的 `learning-progress-updated`，用 `reconcileToday` 移除別台評過的字。
  4. 同一分頁 10 分鐘內不下載、分頁回到前景也不下載；改成每次先讀 `progressMeta.updatedAt`（1 次讀取），有變才整包下載，回到前景時也檢查（間隔至少 30 秒）。
- 驗證：103 個測試通過、建置通過；本機用測試資料模擬雲端資料晚到，完成數、佇列和評分後的紀錄都正確。
- 還沒做什麼：未用真實帳號實測；連續天數（`gw-daily-activity-v1`）仍是各裝置分開計算。

### 2026-11-09 第 1 階段部署到正式站（Claude Code）

- 做了什麼：使用者決定直接上正式站。從 `claude/xian-kai-qi-7924bf`（`d859a98`）建置，只部署 Hosting（`firebase deploy --only hosting`）。`firestore.rules` 已涵蓋 `users/{uid}/learning/review`，規則沒有改。
- 驗證了什麼：100 個測試通過；線上 `/`、`/review/`、字庫 JSON、音檔 manifest 都回 200，線上 `/review/` 和本次建置內容相同，頁面打得開且主控台沒有錯誤；TTS 金鑰沒有進 `dist`。
- 還沒做什麼：真實帳號的雲端同步尚未實測；iPhone 實際手感未測；步驟 11（清單）未做。
- 注意：
  - 正式站比 `main` 新。這個分支還沒合併，**從 `main` 建置部署會把正式站蓋回舊版**。
  - worktree 沒有 `.env`，直接建置會讓登入失效。部署前要帶入主目錄 `.env` 的 `PUBLIC_FIREBASE_*`，並確認 `dist` 裡有 authDomain。
  - `firebase` 不在 PATH，用 `npx firebase-tools`。

### 2026-11-09：統一複習第 1 階段，步驟 1、2、4、5、6（未 commit、未部署）
- 規格與使用者確認的決定在 `docs/phase1-unified-review.md`。每日字數由使用者自訂，達標後可以繼續做。
- 詞條 id 由 `src/data/lexicon/ids.lock` 鎖定；`tools/lexicon/build-site-data.mjs` 產生瀏覽器用的 `src/data/lexicon/site/`。改字庫後要依序執行 `apply-tags.mjs`、`build-site-data.mjs`。
- 複習紀錄核心 `src/lib/reviewStore.mjs`（key `gw-review-v1`），遷移 `reviewMigrate.mjs`，瀏覽器銜接 `reviewBridge.js`，第 1 課已雙寫。
- `UserAccount.jsx` 改為只寫有變動的文件、複習紀錄延遲 5 秒並在離開頁面時送出、同一分頁 10 分鐘內不重複下載（`cloudSync.mjs`）。
- 驗證：`npm test` 100 通過、`npm run build` 通過；本機瀏覽器用測試資料走過遷移、雙寫、程度設定、檢測、複習、繼續做、每週抽考、手機寬度與深淺色。**雲端同步只有單元測試，沒有用真實帳號實測。**
- 之後完成步驟 3、7、8、9、10：`src/pages/review.astro`、`src/components/ReviewApp.jsx`、`src/lib/reviewQueue.mjs`（每日佇列、檢測、每週抽考），首頁改成「今天」卡片。新畫面的樣式在 `global.css` 檔尾的 `.calm-*`、`.today-*`，淺色與深色都用 `--calm-*` 變數。
- 尚未做：步驟 11 清單；第 2 階段的今日一句、每日短文、底部字卡。

### 2026-11-09：主字庫合併與分級（未 commit、未上線，網站尚未使用）
- 新增 `AGENTS.md`（Codex 與 Claude Code 共用的協作指南）、`CLAUDE.md`（指向 AGENTS.md）、`.claude/agents/` 六個角色定義。
- `tools/lexicon/build-lexicon.mjs` 把 `public/vocab` 的 8 個字庫合併成主字庫草稿，2236 筆，輸出在 `src/data/lexicon/`。
- 全部詞條已依 `tools/lexicon/RUBRIC.md` 分級（`tools/lexicon/tags/`），`check-tags.mjs` 全數通過；`apply-tags.mjs` 產生 `lexicon.graded.json`、`coverage-report.md`、`flags.md`。Schritte B1.1 官方字表被標成 B2 以上的字一律校正回 B1。
- `tools/lexicon/corrections.json` 記錄合併、釋義、詞性與程度修正；`tools/lexicon/drafts/` 是新增的 802 個 A1–B1 單字，已由獨立校對修正，`apply-tags.mjs` 會全部併入 `lexicon.graded.json`。
- 尚未做：使用者抽查（`tools/lexicon/sample-review.md`）、`flags.md` 剩餘標註、新字音檔、B2 補字、網站改用主字庫。程度是 AI 判斷，沒有和官方字表逐字比對。
- 下一階段（第 1 階段）：統一複習；已學會的低程度字仍要定期抽考。

### 2026-10-29：首頁新增 LangLoop 受邀課程卡
- `src/components/LangLoopCard.jsx`：登入後向 LangLoop 的 `GET /api/auth/access`（帶 Firebase ID token）確認帳號是否在 LangLoop 允許名單，是的話才在「全部課程」最後顯示深色卡片。點卡片會用表單 POST 把 ID token 送到 LangLoop 的 `/api/auth/handoff`，直接以登入狀態進入 LangLoop（token 不放網址）。
- 允許名單只在 LangLoop 維護（Vercel env `LANGLOOP_OWNER_EMAIL` 與 Supabase 表 `allowed_users`），這邊不另存。LangLoop 只接受 `german-astro-site.web.app`／`.firebaseapp.com` 這兩個來源；若德文網站換網域，要在 LangLoop 設 `LANGLOOP_PARTNER_ORIGINS`。
- LangLoop 網址可用 `PUBLIC_LANGLOOP_URL` 覆寫，預設 https://langloop-three.vercel.app。卡片樣式是 `global.css` 檔尾的 `.langloop-card*`，淺色和深色模式都是同一個深色卡片。

### 2026-10-28：字庫改名為「課程筆記」（已部署）
- 使用者要求改名：檔案 `public/vocab/course-notes.json`（id `course-notes`）、完整版 `單字/課程筆記單字_完整修正版.json`，介面與 index 標籤改為「課程筆記」。
- 音檔：`npm run audio -- --dry-run` 顯示 5257 筆文字全部已有音檔（0 筆待產生）。`npm test` 52 通過，本機確認切換到新名稱的字庫可正常載入 1495 字。

### 2026-10-28：第 1 課新增「課程筆記單字」字庫（1495 筆，已部署）
- 來源：使用者提供的兩份 JSON（`完整單字總整理_新版校訂補充.json`、`…_同格式_全1504詞條.json`）。逐筆比對後，「新版校訂補充」完整包含舊版且沒有遺失任何欄位，所以只用新版。
- 修正腳本 `tools/vocab-review/fix.py`（資料：同資料夾的 `examples.json` 159 句新例句、`plurals.txt` 360 個複數）。用法：`python3 -I tools/vocab-review/fix.py <新版原始檔> tools/vocab-review/examples.json <完整修正版> public/vocab/course-notes.json <log.json>`。原始 `translationZh` 不動，清理後的釋義另存 `meaning`（`normalizeVocabulary` 優先用 `meaning`）；每筆改動記在 `review.siteFixes`。
- 輸出：
  - `單字/課程筆記單字_完整修正版.json`：完整 1504 筆，保留來源、頻率、review 等所有欄位
  - `public/vocab/course-notes.json`：網站用精簡版 1495 筆（去掉 9 筆無法辨識的待確認詞條），依出現次數分 ★★★／★★／★／初次收錄 4 組
- 主要修正：英文術語 7 筆改成德文（kinetic sculpture → die kinetische Skulptur 等）；補冠詞（die Mathe）；8 個動詞缺完成式／助動詞（fahren、wandern 補 sein，hängen 分及物／不及物等）；passieren 的現在式表原本六人稱都填 es passiert；詞性修正（obwohl、falls → 連接詞）；中文釋義修正 10 筆（gleich、mal、Franken「法蘭克」→ 瑞士法郎等）；101 筆釋義去掉重複詞段、「（複數 X）」與「原文 der 應校正」這類校訂註記（避免在中→德模式洩漏答案）；359 個名詞補上複數、14 個不常用複數移除（Kleidungen 等）。
- 例句：原檔有 699 句樣板句（「Im Kurs sprechen wir heute über …」「Im Unterricht lernen wir heute das Wort …」）。★★／★ 組的 159 句已改寫成真正的情境例句；**初次收錄組還有 540 句樣板句，網站版先不顯示例句**（完整版仍保留並有 fieldOrigins 標記）。
- 介面：`VocabularyTrainer.jsx`「程度／教材」多一個「課程筆記 · 依出現頻率」（`LEVEL_PRESETS`）；`POS_LABELS` 補代名詞、冠詞類、語氣詞、數詞、縮合詞；`chaptersFor` 對分組檔保留檔案中的組別順序（`groupOrder`），Schritte 仍是 1–7 課。
- 驗證：新增測試（組別順序、詞性都有中文標籤、釋義沒有校訂註記、冠詞與複數格式、沒有樣板例句），`npm test` 52 通過；本機瀏覽器確認可切換到新字庫並顯示 1495 字。
- 已 push 並部署；正式站確認 index.json 有新字庫、course-notes.json 與本機一致。音檔新增 2142 個（`npm run audio`）。
- 未驗證：內容沒有逐字對照原始手寫筆記與詞典；新例句與複數是人工撰寫，未經母語者校對。

### 2026-10-27：新課內容複核與修正（已部署）
- 使用者已授權部署；修正 commit `c94d14b` 已 push 到 main，Firebase Hosting 正式站發布成功。HTTP 核對第 4／7 課 HTML、頁面引用的 7 個 JS、audio manifest 與 3 個新 MP3，均 200 且與本機 dist 位元組一致；未新增瀏覽器互動驗收。
- 詳見 `docs/content-review-2026-10-27.md`：第 7 課逐題複核，並閱讀第 2／4／6 課新增內容。
- 確認修正 gehen 的 du／ihr Konjunktiv II：gingest／ginget；原測試也寫錯，已先確認修正參考表會抓到失敗，再修產生器，補齊全部 13 動詞的形式表測試。
- 修正 als 必須用 KII、KII 一律代表不可能等過度絕對的說明；改寫題明示時間與相反情境，r4 換掉易歧義干擾選項，i9 改成明確現在假設，v6 翻譯補過去時間。
- 第 4 課 Genitiv 介系詞題改正 Wessen? 提示，部分題明示要求 Genitiv 書面語。
- `npm test` 51 通過、`npm run build` 成功；3 個修正文字音檔已補產並更新 manifest。未做本輪瀏覽器逐題或母語教師驗收。
- 第 6 課實際 305 題（243 生成＋62 手寫）；舊紀錄的 284 題不符現況。

### 2026-10-27：新增第 7 課 Konjunktiv II（已部署）
- 已 push 並部署；正式站確認 `/lesson7-konjunktiv/` 顯示「0 / 136」、課程列有「假設」、概念卡有內容、首頁出現第 7 課卡片。
- 新頁面 `/lesson7-konjunktiv/`（`src/pages/lesson7-konjunktiv.astro`，主題色 emerald，課程列標籤「假設」），共 136 題：
  - **形式**（78 題，由程式產生）：`src/lib/konjunktiv.mjs` 的 `KONJUNKTIV_VERBS` 13 個動詞 × 6 個人稱（sein、haben、werden、können、müssen、dürfen、sollen、wollen、mögen，加上 B1+ 的 wissen、kommen、gehen、geben）。錯誤選項是同人稱的過去式（hatte）和其他人稱；sollen／wollen 與過去式同形，不會拿過去式當錯誤選項。
  - **用法**（58 題，手寫）：`src/data/lesson7-konjunktiv.ts`，分成禮貌請求 8、願望 7、建議 5、非現實條件 10、改寫句子 10、用途判斷 10、進階（過去的非現實、als + Konjunktiv II）8。`options[0]` 一律是答案，畫面上會打亂。
  - 改寫句子的錯誤選項針對常見錯誤：否定沒對調、真實條件句、würde + 過去分詞、Perfekt 助動詞選錯。
- 元件 `src/components/KonjunktivTrainer.jsx`：範圍按鈕一列可橫向捲動、作答後顯示完整句子＋中文＋說明並朗讀、錯題進複習（`needsReview`）、`?review=1` 只出錯題。
- 串接：`PROGRESS_KEYS.lesson7`（`german-lesson7-konjunktiv-progress`）、`getLearningSummary` 的 `lesson7AnsweredCount／lesson7WrongCount`、`getReviewAction`、`collectLocalProgress／mergeRemoteProgress`、`UserAccount` 的 `PROGRESS_DOCS`（Firestore 規則允許 `learning/` 下任何文件，不用改）、`LessonModes`（l7）、`LearningDashboard`（case 7）、`LessonShell` 的 `lessonLinks`、首頁 `totals`、`ConceptCard`（l7：形式表、四種用法、小陷阱）。
- 音檔：`tools/generate-audio.mjs` 收進每題作答後朗讀的文字，新增 135 個音檔。
- 驗證：新增 `tests/konjunktiv.test.mjs`（形式和過去式對照手寫的變化表、每題四個不重複選項、同形的人稱不會被當成錯誤選項、手寫題格式），`npm test` 51 個通過；`npm run build` 成功；本機手機尺寸（深色）和桌面（淺色）實際作答，確認形式、改寫、用途判斷三種畫面、錯題進複習、`?review=1`、首頁卡片「已練 3 / 136、2 待複習」。測試後已清掉本機的第 7 課紀錄。未在 iPhone 上試。
- 之後可做：Konjunktiv II 的打字練習（目前只有選擇題）；更多過去式非現實句；把 `docs/content-review-2026-10-24.md` 的方法套用到這 58 題再檢查一次。

### 2026-10-27：第 2 課新增「wo/da 代換」測驗模式（已部署）
- 已 push 並部署。部署後在正式站發現第 27 題「Ein eigenes Haus? ___ träume ich schon lange.」選項是小寫 davon：`isSentenceStart` 原本只看空格是否在最前面，改成空格在 . ? ! 之後也算句首，新增測試確認每句填好後都以大寫開頭，重產該句音檔後再部署一次；正式站確認選項變成 Davon／Darvon／Von es／Darauf。
- 測驗多了第四個模式「wo/da 代換」，三種題型：
  - **問事物**（18 題）：___ wartest du? – Auf den Bus. → Worauf
  - **代替事物**（17 題）：Ich warte schon seit einer Stunde ___. → darauf（含 Das hängt davon ab, ob … 這種指向後面子句的用法）
  - **問人**（15 題）：___ wartest du? – Auf meinen Bruder. → Auf wen（Akk 用 wen、Dat 用 wem）
- 題目是手寫的：`src/data/wo-da-practice.ts` 只存句子、中文和 `entryId`（指向 `verb-prepositions.ts`），答案由 `src/lib/woDa.mjs` 依該組的介系詞和格位推出，所以不會和第 2 課資料對不上。
- 錯誤選項針對常見錯誤：少了 r（Woauf）或多了 r（Wormit）、事物和人搞混（Worauf ↔ Auf wen）、wen／wem 格位錯、「auf es」。問句題都附上回答（– Auf den Bus.），用來判斷是問事物還是問人。
- 作答後顯示完整句子、中文、「動詞 介系詞 + 格位」和規則說明，並朗讀整句（`tools/generate-audio.mjs` 已收這 50 句，音檔已產生）。
- 「只看收藏」時，wo/da 題目也只出收藏的動詞（沒有就出全部）。
- 手機上四個模式按鈕改成一列四格（原本第四個會被擠出畫面）。
- 概念卡「小陷阱」補上 wo(r)-／da(r)- 和「問人用介系詞＋wen／wem」。
- 驗證：新增 `tests/woDa.test.mjs`（形式規則、每題一個空格、四個選項且只有一個正確、問句題的回答以同一個介系詞開頭），`npm test` 46 個通過；`npm run build` 成功；本機手機尺寸實際作答確認畫面和回饋。未在 iPhone 上試。
- 之後可做：把 wo/da 題目也接上錯題複習（目前只記入作答紀錄 `addHistory`，不進 `?review=1`）。

### 2026-10-27：手機上收合篩選列（已部署）
- 已 push 並部署；正式站 375 寬確認第 3 課「篩選與語音」、第 5 課「篩選」收合按鈕都有出現。
- 先在 375×812 量過六課：第 1、2、4、6 課原本就已收合（第 2 課設定在底部分頁、第 4 課「篩選與紀錄」、第 6 課「篩選、錯題與文法速查」），真正擠的是第 3 課（約 260px）和第 5 課（約 450px）。
- 第 3 課 `IrregularVerbTrainer.jsx`：四個模式按鈕排成一列；等級、搜尋、篩選、語音在手機上收進「篩選與語音」按鈕（`showTools`，只在 `md` 以下作用），按鈕上顯示目前等級、搜尋字和篩選數。展開中的篩選或語音面板在收合時也一起隱藏（`max-md:hidden`）。
- 第 5 課 `ConnectorTrainer.jsx`：手機上隱藏四格統計，五個模式按鈕排成一列，三個下拉選單收進「篩選」按鈕，按鈕上顯示模組、等級、語序類型、答對數和錯題數。桌面版不變。
- 順手修的深色模式問題：
  - 第 6 課題目卡外框在深色模式是米白色（缺 `dark:` 類別），已補上，和第 2、4 課一致
  - 第 3 課篩選面板「選中」狀態用 `bg-slate-800`，在深色模式看不出來，改成淺色（`dark:bg-slate-200`）
- 驗證：`npm test` 42 個通過、`npm run build` 成功；本機 375×812 深色模式截圖確認第 3、5 課題目在第一屏、展開／收合正常；1280 寬淺色模式確認桌面版不變。未在 iPhone 上試。
- 注意：本機畫面底部那排半露的圖示是 Astro dev toolbar，正式站沒有。

### 2026-10-27：重新檢查舊稽核留下的問題（已部署）
- 端對端實測（本機 dev server）：
  - 第 1 課按「還不熟」後，`deutschLernkartenDB_vPro` 的錯題數、課次列表的「待複習」、LessonModes 徽章、首頁卡片都一致（5 題）
  - 首頁「複習」主按鈕導向第一個有錯題的課（`getReviewAction`），不會再導到 0 題的課
  - 各課 `?review=1` 實際出現的題數和首頁數字一致：第 1 課 5、第 2 課 1、第 3 課 1、第 4 課 8、第 6 課 1，合計 16
  - 結論：`report.html` 的兩個 P1（首頁導流錯誤、第 1 課紀錄不一致）在首頁改版時已經修好，下一步清單已勾掉
- 順手修的小問題：
  - 第 4 課沒作答時「正確率」顯示「—」而不是 0%（第 6 課原本就是這樣）
  - 第 2 課「已收藏」篩選按鈕、第 3 課 `FilterChip` 加上 `aria-pressed`
- 其他稽核項目已確認早就處理：第 2 課背面分列 Präteritum／Perfekt、第 4 課線索已翻成中文（subject → 主詞）並遮住格位、主控台沒有錯誤。
- 驗證：`npm test` 42 個通過、`npm run build` 成功、本機確認 aria-pressed 有出現。未在 iPhone 上試。

### 2026-10-26：第 2 課擴充到 104 組（已部署）
- 已 push 並部署；正式站確認字卡顯示「1 / 104」、概念卡有 bestehen aus，新音檔回應 200 audio/mpeg。
- `src/data/verb-prepositions.ts`：新增 id 51～104，共 54 組。補上 **vor**（Angst haben、sich fürchten、warnen、schützen）、**aus**（bestehen），以及 B1 常見搭配：
  - 反身動詞：sich informieren／vorbereiten／erkundigen／verabschieden／erholen 等
  - 「形容詞＋sein」：stolz／neidisch／gespannt auf、zufrieden／einverstanden mit
  - Lust haben auf、es geht um、es handelt sich um
- 同一動詞有第二個介系詞的組合：sich bewerben bei、sich entschuldigen bei、denken über、streiten über、halten von／für。測驗出選項時會排除同一動詞的其他正確介系詞，所以不會誤判。
- 概念卡 l2 的 Dativ 欄加入 Angst haben vor、bestehen aus，「小陷阱」補上 aus 和 vor 都接 Dativ。
- 已執行 `npm run audio`，新增 94 個音檔。
- 驗證：
  - `npm test` 全部 42 個測試通過（`prepositionBlank.test.mjs` 確認每個例句都只挖一個空）
  - 另用腳本檢查：沒有重複的（動詞, 介系詞）組合；挖空後其餘句子裡不會再出現同一個介系詞而洩漏答案
  - `npm run build` 成功；本機瀏覽器確認字卡顯示「1 / 104」，單字測驗和例句填空都會出新題目，概念卡有新內容
- 未驗證：格位判斷模式只抽查程式邏輯（沿用 `case` 欄位），沒有逐題點過；也還沒在真的 iPhone 上試。

### 2026-10-26：第 4 課擴充 Genitiv 與 n-Deklination（已部署）
- 題數 116 → 155，新增兩個模式：
  - `genitiv`（17 題）：所有關係；wegen、während、trotz、statt、innerhalb；Wessen?；認格位
  - `n-deklination`（18 題）：Akk／Dat／Gen、Nominativ 對照題、Herr 和 Name 特例、辨認題
  - 另有 4 題 `sentence-repair`，例如「wegen dem Regen」改成書面語，以及漏加 -n 的修正
- 資料：`modes`、`mistakeTypes`（`n-declension-error`）、`caseGuide` 的 Genitiv 說明、`learningPath` 新增 Level 6；元件中的 `MODE_LABELS`、`MODE_GUIDES`、`MISTAKE_LABELS` 也一併更新。
- `caseDiagram.mjs`：
  - 介系詞清單加入 Genitiv 介系詞
  - 名詞比對允許加了字尾的形式（Bruders、Studenten）
  - 題目設 `diagram: false` 時不畫圖解（辨認題使用）
- 概念卡加入 Gen 列、Genitiv 介系詞，以及「④ n-Deklination」。
- 新增 `tests/lesson4.test.mjs`，檢查：
  - 選項不重複，且包含答案
  - 單一空格題把答案填回去後與 `fullSentence` 完全相同（全部 155 題）
  - n-Deklination 名詞在 Nominativ 以外都有 -n
  - Genitiv 的陽性和中性名詞有 -(e)s

### 2026-10-26：第 6 課擴充（已部署）
- 題數：154 → 284（自動產生 243 題，手寫 41 題）；名詞 14 → 30 個，形容詞 16 → 32 個。
- 新增 4 個階段：
  - 6：定冠詞 Akk／Dat
  - 7：複數（定冠詞，以及無冠詞的 Nom／Akk）
  - 8：mein／kein（各格位，含複數）
  - 9：Genitiv（定冠詞、所有格冠詞、wegen、trotz＋無冠詞）
- 文法引擎：
  - `GermanCase` 加上 `genitiv`；`ArticleType` 加上 `possessive`、`negative`
  - 名詞有 `genitive` 欄位（des Films）；形容詞有 `stem` 欄位（teuer → teur-、dunkel → dunkl-）
  - 句型可設 `number: "pl"`、`allowedAdjectiveIds`、`excludeAdjectiveIds`，用來排除語意不通的組合，例如「Wegen des schönen Wetters …」
- **`tests/lesson6.test.mjs` 用一套獨立撰寫的變化表重新計算所有自動產生題的答案**，並檢查選項不重複。新增名詞、形容詞或句型後務必執行 `npm test`。
- 我逐條讀過新產生的句子，排除了「Ich helfe dem interessanten Mann」這類語意不自然的句子。
- 文法速查新增「mein／kein」分頁，各表也補上 Genitiv 列；學習路徑新增 Step 6「Genitiv 特訓」；概念卡補上 Genitiv 列和 mein／kein 的規則。
- 第 6 課沒有語音，不需要產生音檔。

### 2026-10-26：內容擴充規劃
- 依 B1 範圍盤點各課缺口，寫在 `docs/content-expansion-plan.md`。最大的缺口：第 6 課的定冠詞 Akk／Dat、複數和 Genitiv；整個 Genitiv 和 n-Deklination；Konjunktiv II 和 Passiv 完全沒有涵蓋；單字缺 B1.2；沒有聽力和寫作練習。
- 尚未開始實作，等使用者選定優先順序。

### 2026-10-24：修正手機字卡無法滑動／翻面（已部署）
- 使用者回報：手機上字卡滑不動、也翻不了面。
- **根本原因**：iOS Safari 只支援 `touch-action: auto` 和 `manipulation`，**不支援 `pan-y`**。第 1 課字卡原本用 pointer events 處理滑動，手指一橫移，Safari 就把它當成頁面捲動並送出 `pointercancel`，導致滑動失效；點擊時手指只要稍微移動也會被取消，所以翻不了面。
- **修正**：新增共用 hook `src/hooks/useSwipe.js`
  - 改用原生 touch 事件，`touchmove` 設為 `{ passive: false }`；一旦判斷是水平拖曳就 `preventDefault()`，垂直拖曳則照常捲動頁面
  - 翻面改用 click 事件；滑動結束後會吞掉瀏覽器補送的 click，避免滑動時誤翻面
  - 起點在 button、a、input、summary、details 上的拖曳會被忽略
- 套用範圍：第 1 課（滑動評分）、第 2 課和第 3 課（**新增**左右滑動換卡，拖曳時卡片會跟著手指移動）。第 4～6 課沒有翻面字卡。
- 第 2、3 課的 3D 翻轉從 Tailwind 任意值 class 改成 inline style（`src/lib/flipStyles.mjs`），避免被其他樣式覆蓋。
- **測試陷阱**：Browser pane 在背景執行時會凍結 CSS transition，計算出的 transform 會停在起始值，看起來像「翻面後空白」。驗證翻面時要先注入 `*{transition:none!important}`。
- 驗證：用 TouchEvent 模擬點擊、垂直拖曳、水平滑動，第 1～3 課都通過：點擊會翻面、背面可以點回來、水平滑動會 `preventDefault` 並換卡、垂直拖曳不會被攔、滑動後不會誤翻面。**尚未在實體 iPhone 上確認。**

### 2026-10-24：第 1 課新增「中→德」與「填空」（已部署）
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

### 內容擴充（見 `docs/content-expansion-plan.md`）
- [x] 第 6 課、第 4 課、第 2 課擴充（2026-10-26）
- [x] 第 2 課加入 wo(r)-／da(r)- 練習（2026-10-27）
- [x] 新增 Konjunktiv II 課（2026-10-27，第 7 課）
- [x] 新增 Passiv 課（2026-11-18，第 8 課 49 題；待獨立校對、介面檢查與音檔）
- [ ] 單字 B1.2（需要使用者確認教材範圍）
- [x] 主字庫缺例句補寫（2026-11-19，441 句已部署）
- [x] 4 個可疑詞條（Kunstwerkladen、Bildmodell、Sonderkräfte、Bauarbeitsgerät）已處理並補例句（2026-11-19）
- [ ] 9 筆無法辨識的筆記詞條（Putzhilfer、Frumgung、Sonnenunteraufgang 等）需使用者對照原始筆記確認

### 介面（使用者目前最在意）
- [ ] `codex/motion` 紙本練習簿動態已實作並通過測試／建置；待瀏覽器介面檢查（本輪沙盒禁止本機 server），確認後才部署。
- [x] 每輪 10 題的結算（2026-10-24 完成）
- [x] 六課統一三個入口（2026-10-24 完成）
- [x] 第 2～6 課在手機上的篩選列和設定區改成可收合（2026-10-27，實際只需改第 3、5 課）
- [x] 第 2、3 課的字卡已改用 3D 翻面；滑動維持上一張／下一張，不做滑動評分，因第 2 課有多個評分等級，左右兩種手勢無法完整表達。
- [x] 每日活動 `gw-daily-activity-v1` 加入 Firebase 同步（`collectLocalProgress`／`mergeRemoteProgress`）

### 自然人聲（Google Cloud TTS）
- 已完成，見進度紀錄。之後**新增或修改任何會被 `speak()` 唸出的文字**（單字、例句、動詞形態）時，都要執行 `npm run audio`。腳本只會補產生缺少的音檔；可以先用 `npm run audio -- --dry-run` 看要產生幾個、共多少字元。
- [ ] 如果新增了會呼叫 `speak()` 的課程或欄位，記得把它加進 `tools/generate-audio.mjs` 的 `collectTexts()`

### 先前稽核留下、尚未處理的問題（見 `../german-site-audit/report.html`）
- [x] 首頁「學習建議」導向錯誤的課程（應依待複習資料決定）（2026-10-27 實測確認已修好）
- [x] 第 1 課錯題紀錄和首頁統計不一致（2026-10-27 實測確認已修好）
