# 規格：德語網站的「聽力」與「寫作與口說」頁

狀態：2026-11-21 使用者決定**先只上線聽力播放**。跟讀錄音在 LangLoop 做；寫作與口說先放著（`/writing` 和相關 API 程式還在，但首頁沒有入口）。聽力入口放在首頁「今日複習」下面，不編成課號（各課進度以課號記錄，插課會打亂進度）。尚未部署。

## 目標

只開德語網站，就能做聽力和跟讀。材料來自 LangLoop，但**只有在 LangLoop 勾選「放到德語網站」的專案**才會出現。

## 範圍

要做：

1. LangLoop 每個專案多一個勾選框「放到德語網站」，預設不勾。
2. 德語網站新增「聽力」頁，列出勾選的專案。
3. 聽力頁的播放器：逐句亮起、點句子回放、單句循環、速度 0.75／0.9／1.0。
4. 點字存進複習。
5. 跟讀錄音對照：錄自己唸一句，和原音輪流播放。

不做（之後再說）：

- 在德語網站上傳音檔、產生語音、轉字幕：仍在 LangLoop 做，聽力頁放一顆「到 LangLoop 新增材料」的按鈕。
- 錄音存檔：錄音只留在瀏覽器記憶體，離開頁面就消失。
- 跟讀檢查（語音辨識比對）、寫作與口說批改：第二階段。

## 誰看得到

和現在的 LangLoop 卡片一樣：只有 LangLoop 允許名單裡的 Google 帳號（目前只有你一個）看得到聽力頁的入口。真正的權限檢查在 LangLoop 伺服器，網站只是把入口藏起來。其他使用者完全不受影響。

## 使用流程

1. 在 LangLoop 新增或打開一個專案，勾選「放到德語網站」。
2. 德語網站首頁的 LangLoop 卡片多一個「聽力練習」連結，進入 `/listening`。
3. 選一個專案，播放、點句、循環、調整速度。
4. 點一個字：
   - 字庫裡有這個字，就直接加進德語網站的複習（免費，不呼叫任何 API）。
   - 字庫裡沒有，就請 LangLoop 查字並存進 LangLoop 生字本（沿用現在的查字功能，查過的字有快取）。
5. 對某一句按「錄音」，唸完後可以播放「原音 → 我的錄音」來比較。

## LangLoop 要改的地方

| 項目 | 內容 |
| --- | --- |
| 資料庫 | migration `008_site_sharing_and_ai_quota.sql`：`projects.show_on_site`（預設不勾）、`ai_usage` 表和 `consume_ai_quota()`（每日次數，以台灣時間計）。2026-11-21 經使用者同意已套用，現有 7 個專案、158 句、8 個生字都保留。 |
| 勾選框 | 只有德文專案的選單會出現「放到德語網站」（`components/ShowOnSiteToggle.tsx`）。 |
| 專案頁 | 勾選框寫入時沿用現有的 `PATCH /api/projects/[id]`（多接受 `showOnSite`）。 |
| 新 API | `GET /api/site/projects`：列出自己帳號、有勾選的專案（標題、長度、語言、建立日期）。 |
| 新 API | `GET /api/site/projects/[id]`：回傳逐句字幕和音檔的 signed URL（1 小時有效）。必須是自己的專案，而且有勾選，否則回 404。 |
| 新 API | `POST /api/site/words/lookup`、`POST /api/site/words`：查字和存字，給網站用（沒有改動 LangLoop 自己的 `/api/words`）。 |
| proxy | `proxy.ts` 讓帶 Bearer 的 `/api/site/*` 和預檢請求通過，每個路由自己驗證 token 和允許名單（`lib/siteProject.ts` 的 `isSiteApiRequest`）。 |
| 跨網域 | 新的 API 只允許 `getPartnerOrigins()` 裡的網址（正式站和本機 4321），沿用 `isPartnerOrigin`。 |
| 測試 | 權限（沒登入、不在名單、別人的專案、沒勾選）各一個測試。 |

## 德語網站要改的地方

| 項目 | 內容 |
| --- | --- |
| 頁面 | `src/pages/listening.astro`，外框照 `review.astro` 的寫法。 |
| 元件 | `src/components/ListeningApp.jsx`：專案清單和播放器。播放邏輯參考 LangLoop 的 `Player.tsx`，但用網站自己的元件、色彩變數和 `fx-*` 動畫重寫，不直接搬程式。 |
| API 呼叫 | 抽出 `src/lib/langloopClient.js`，放 `checkAccess`、`listProjects`、`getProject`、`lookupWord`、`saveWord`。`LangLoopCard.jsx` 也改用它。 |
| 存字 | 字庫有的字，走 `reviewBridge.js` 加進複習（沿用 `importLangLoopWords` 的比對）。 |
| 錄音 | 用瀏覽器的 `MediaRecorder`，第一次錄音時才請求麥克風權限；被拒絕時顯示說明，播放器照常可用。 |
| 首頁 | `LangLoopCard.jsx` 加「聽力練習」連結。 |
| 慣例 | 照 `docs/AI_HANDOFF.md`：只用色彩變數、`answerFeedback.js`、`fx-*` 動畫；手機版和深色模式都要能用。 |

## 費用

- 德語網站：沒有新增費用，仍然是 Firebase Spark 加上靜態網站。
- LangLoop：播放和列表不呼叫 OpenAI。只有點到字庫沒有的字時才查字，而且查過的字有快取。Supabase 和 Vercel 用量很小。

## 實作順序

1. LangLoop：migration 檔、勾選框、新 API、Bearer 支援、測試（先在本機用 `next dev` 驗證）。
2. 問過使用者後，把 migration 套用到 Supabase。
3. 德語網站：`langloopClient.js`、聽力頁、播放器、存字、錄音。
4. 本機兩邊一起跑：LangLoop 開在 3000，德語網站開在 4321，驗證整個流程。
5. 交給介面檢查角色，再交給上線檢查角色。
6. 問過使用者後才部署：LangLoop 部署到 Vercel，德語網站用 `firebase deploy`。LangLoop 要先部署，網站才呼叫得到新的 API。

## 風險

- **signed URL 一小時後失效**：播放器遇到音檔載入錯誤時，重新拿一次網址。
- **iPhone Safari 錄音**：iOS 14.5 以後才支援 `MediaRecorder`，格式也不同（mp4／aac）。要在手機上實測。
- **這個 worktree 的基底比 main 舊**：開始實作前先從最新的 `main` 開分支，避免和其他分支衝突。
- **播放器程式量**：LangLoop 的 `Player.tsx` 有 850 行。第一階段只做上面列出的功能，其他像字幕編輯、匯出都不做。

## 第二階段：寫作與口說（已實作）

- 頁面 `/writing`（`WritingApp.jsx`）：每週一題（自己寫的中文題目，可換題）、選程度、寫 3 到 5 句，或按「用說的」錄音轉文字。
- `POST /api/site/correct`：AI 逐句批改，每個修改附原因和類型（文法、用字、拼字、語序、說法），給正確版和可以學的字。模型 `OPENAI_CORRECTION_MODEL`，預設 gpt-4.1-mini。
- 看完批改後「自己重寫一次」，和正確版對照。可以學的字點「存起來」，走和聽力頁同一張單字卡。
- 聽力頁的跟讀面板可以「檢查發音」：`POST /api/site/speech` 把錄音轉成文字（Whisper，不存檔），網站用 `compareShadowing` 標出沒被辨識的字。
- 每日上限：批改 20 次、語音 40 次，可用環境變數 `SITE_DAILY_CORRECTIONS`、`SITE_DAILY_SPEECH` 調整。

## 第二階段的權限決定

- AI 批改（寫作、用說的寫作、跟讀檢查）只給 LangLoop 允許名單裡的帳號使用，權限在 LangLoop 伺服器檢查，其他使用者看不到入口，也呼叫不到 API。
- 另外加上每日次數上限，沿用 LangLoop 的 `lib/rateLimit.ts`，避免意外用量。

## 已決定

1. 速度 0.75／0.9／1.0。
2. 字庫有的字直接從網站字庫顯示並加進複習（免費）；字庫沒有的字由使用者按「用 LangLoop 查字」才呼叫查字，再存進生字本。
