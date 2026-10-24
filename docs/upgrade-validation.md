# 德語學習工具：分課與穩定性升級

日期：2026-10-14。此版本已完成本機建置與測試，並於 2026-10-14 部署至 Firebase Hosting： https://german-astro-site.web.app/ 。

## 完成範圍

- 將舊單字 iframe 改為原生 React 工作台，保留舊網址轉址與既有本機儲存鍵。
- B1 Schritte B1.1 依教材第 1–7 課分類，完整字庫 460 字；各課顯示字數、已練習數及待複習數。
- 保留字卡、冠詞、聽寫、詞性、字典、收藏、語音、JSON 匯入與備份匯出。
- 記住課次、練習模式與位置；切換字庫時在本機保存其他字庫的紀錄。
- 首頁複習入口改為實際有待複習資料的主題；介系詞僅計算已到期的排程。
- 六個練習工具統一即時寫入本機紀錄；答對後清除待複習狀態，同時保留歷史作答計數。
- 不規則動詞複習卡翻面後可以標示「已掌握」，移出待複習。
- 整合帳號同步入口，將形容詞字尾加入同步文件清單；移除練習工具內重複的同步寫入器。
- 六個主題共用導覽；縮減手機版標籤與設定區，增加鍵盤焦點樣式。
- 修正介系詞格位提示、Präteritum / Perfekt 標題及詞性測驗提前顯示答案。
- Astro 升級至 7.3.8、React integration 6.0.6；移除未使用的 MDX integration 和 Vite 7 override。
- 以同主版本的 @grpc/grpc-js 1.14.6 修補 Firestore Node 相依套件，保留 Firebase 12。

框架升級依據：[Astro 7 官方遷移指南](https://docs.astro.build/en/guides/upgrade-to/v7/)。設定 compressHTML: true 保留既有空白處理。

## 自動驗證

- `npm test`：13/13 通過，涵蓋六個複習入口、到期排程、訪客儲存、舊錯題狀態遷移、雲端資料合併、B1 課次、字庫切換、匯入格式及損壞 JSON。
- `npm run build`：七個靜態頁面成功建置。
- `npm audit --omit=dev`：0 vulnerabilities；安裝後完整 npm audit 亦為 0。
- `git diff --check`：通過。

## 瀏覽器驗證

- B1 第 3 課：79 字，冠詞模式 38 字；重新整理保留課次與模式。
- 單字答錯 → 首頁複習 → 答對 → 待複習清空，答案說明保持至使用者按下一題。
- B1 第 3 課收藏 Magen → 切換 A1–B1 字庫 → 切回 B1，收藏仍保留。
- 格位及語序：答錯後首頁連到正確主題及錯題集合，答對後計數歸零。
- 形容詞字尾：作答與錯題紀錄重新整理後保留，答對後待複習歸零。
- 不規則動詞：標示複習 → 首頁進入一張複習卡 → 翻面 → 已掌握 → 移出。
- 介系詞：評估普通後到下一張；重新整理後設定頁保留已複習卡片數。
- 390px 手機版單字頁無水平溢出；桌面版顯示七課卡片與進度。
- 正式建置的預覽頁面 console 無 error / warn。

## 尚未驗證與後續邊界

- 本機未進行真實帳號登入；Firebase 授權網域、已部署 Firestore rules、雙裝置同步衝突及離線重連仍需帳號情境測試。不能將單元測試視為真實雲端同步驗證。
- 字庫切換用的 archive 及上次位置目前僅保存於本機；雲端仍沿用現有作用中字庫同步格式。跨裝置切換不同教材的體驗應列為下一階段資料結構升級。
- 語序自由輸入題仍採預設答案比對，未加入德語語意判分；整份教材內容未經逐題人工語言校對。
- 語音播放依瀏覽器與作業系統的德語人聲而定；尚未測試實體 iOS / Android 裝置。
- 安全掃描反映本次套件公告資料，不等同完整滲透測試。

## 預覽

`npm run preview -- --host 127.0.0.1 --port 4322`

入口：http://127.0.0.1:4322/lesson1-wort/

## 正式發布

- 專案：german-astro-site；執行 `firebase deploy --only hosting --project german-astro-site --non-interactive` 成功。
- 僅發布 Hosting，既有 Firestore rules 未變更。
- 發布前再次通過 13 項測試與七頁建置；發布後瀏覽器確認 B1 七課字庫、換課與形容詞字尾頁載入。

## iPhone Safari 發音修補

- 使用者回報 iPhone / Safari 喇叭無聲。尚未有實體手機遠端偵錯，因此不能把推測因素當作已確定根因。
- 移除介系詞頁的 touchstart 空白語音預熱；播放保持在使用者按鈕事件的同步呼叫中。
- 單字、介系詞及不規則動詞共用語音播放器；保留 utterance 生命週期、點擊時取得最新人聲、預設交由系統選擇德語人聲、恢復暫停佇列並顯示失敗／未啟動提示。
- 介系詞與不規則動詞卡片的隱藏面設為 inert 並隱藏，避免背面攔截點擊；補 Safari backface 樣式。
- 17 項自動測試及正式建置通過；瀏覽器已觀察到動詞和背面例句的 onstart 播放狀態，無 console error / warn。這不等同 iPhone 實機出聲驗證，仍待使用者重試。
- 參考： https://bugs.webkit.org/show_bug.cgi?id=223473 ； https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices 。
