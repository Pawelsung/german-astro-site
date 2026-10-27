# 新增課程內容複核（2026-10-27）

## 結論與範圍

本輪確認有教學內容錯誤，已修正，並經使用者授權 push 與部署。修正 commit：`c94d14b`。

- 已閱讀 Claude 留下的 `lesson-review-2026-10-24.md`、`content-review-2026-10-24.md` 及交接紀錄。舊紀錄指出的錯誤例句、不合理配句、答案誤判是實質問題，不能用當時建置或測試通過來否定。
- 第 7 課：逐條閱讀 58 題手寫題的句子、選項、中文、解析，以及形式產生器和概念卡；形式測試現涵蓋全部 13 個動詞、78 個人稱形式。
- 第 2 課：閱讀 54 組新增搭配（id 51–104）及全部 50 題 wo/da；本輪未發現可明確判定的新文法答案錯誤。
- 第 4 課：閱讀 39 題新增 Genitiv／n-Deklination 及解析；答案未發現新的明確錯誤，但題幹與疑問詞提示需修正。
- 第 6 課：閱讀產生器的名詞／形容詞限制，以及第 6–9 階段 151 題完整生成句；未發現新的明確變格答案錯誤。自動測試另重新計算全部 243 題生成題的變格。
- 交接文件曾記第 6 課共 284 題，但目前原始碼實際為 305 題（243 生成＋62 手寫）。這是文件數量不符，不等於多出的題目有文法錯誤。

## 確認問題與修正

| 位置 | 原問題 | 本輪處理 |
|---|---|---|
| 第 7 課形式 `gehen` 的 du／ihr | 把直陳過去式 gingst／gingt 當作 Konjunktiv II，測試參考表也抄入同一錯誤 | 改成 gingest／ginget；先修參考表，確認測試確實失敗，再修產生器 |
| 第 7 課 a1 | 「als 後一定用 Konjunktiv II」錯把常用形式說成唯一合法形式 | 說明也可用 Konjunktiv I：als sei er krank；題目明示本課練習 Konjunktiv II |
| 第 7 課標題、condition 提示、f4、f7 | 把 Konjunktiv II 一概解釋成已確定不成立／無法實現 | 補上可能假設（Potentialis）與目前願望不等於永遠不可能的區別 |
| 第 7 課 r5 | 說 wenn 子句「也要」用 Konjunktiv II，過度概括 | 改為本題指定形式；說明 Es wäre besser, wenn du … bleibst 亦可成立 |
| 第 7 課改寫題 | 有些干擾選項文法成立，但不符相反情境或原時間；僅寫「正確句子」容易誤導 | 明示保持原時間、改寫成相反情境；命令句則要求客氣的 Konjunktiv II 請求 |
| 第 7 課 r4 | würdet 也是 Konjunktiv II，放入建議題作干擾易混入另一種假設讀法 | 換成不適用於此句的 wäret |
| 第 7 課 i9 | 公車「準時來」配「早就到了」缺少明確時間線，容易把當前與過去假設混在一起 | 改為一致的現在假設：Wenn der Bus immer pünktlich käme, müssten wir nicht so lange warten.（清晰度改善，原句不直接定為文法錯誤） |
| 第 7 課 w4、p3、t10、v6 | 說明過度簡化，或中文沒有清楚表達過去時間 | 補出 regnete 與過去式同形、限制 würde 的說明到本題句型、區分 Wirst／Würdest，以及明示 v6 是當時已完成的事 |
| 第 4 課新增 Genitiv 介系詞題 | wegen／während／trotz／innerhalb／statt 的提示都寫 Wessen?，混淆「誰的」與介系詞片語的實際意義 | 分別改為 Weswegen?／Wann?／Trotz welchen Umstands?／Innerhalb welcher Zeit?／Statt welcher Sache? |
| 第 4 課 gen-008／011／013／018 | 選項含口語 Dativ，題目只寫「正確答案」 | 明示要求 Genitiv 的標準書面語寫法，避免把口語形式一律當成文法不存在 |

## 外部依據

- [Duden：gehen 完整變化表](https://www.duden.de/konjugation/gehen)：Konjunktiv II 的 du gingest／ihr ginget。
- [Duden：Konjunktiv I oder II?](https://www.duden.de/sprachwissen/sprachratgeber/konjunktiv-1-oder-2)：Konjunktiv I 也用於非現實比較；Konjunktiv II 包括可能假設。
- [IDS grammis：Konjunktiv II](https://grammis.ids-mannheim.de/terminologie/401)：Irrealis、Potentialis 與 würde 替代形式。
- [IDS grammis：Konditionalgefüge](https://grammis.ids-mannheim.de/systematische-grammatik/997)：條件與結果的語氣及 würde 結構。

## 驗證證據與限制

- `npm test`：51 通過、0 失敗。這只能支持測試涵蓋的性質，不能替代例句語意與可接受答案審查。
- `npm run build`：8 個頁面建置成功。
- `npm run audio`：3 個修正文字的新音檔全部產生成功；移除 3 個過時音檔並更新 manifest。
- 本輪沒有逐題瀏覽器點選、沒有聽完全部音檔，沒有母語教師複核，也沒有重新逐條審完所有舊課／全部單字。不能宣稱全站零錯誤。

## 我先前驗證不足之處

1. 把結構完整、程式能跑與內容正確混為一談。
2. 所謂獨立手寫參考表，仍可能重複同一個語言判斷錯誤；本次 gehen 就是證據。變格表需附外部依據。
3. 只驗正解，沒有充分問「干擾選項是否在另一語境也能成立」。今後題幹必須交代時間、目的與指定語體。
4. 自動配句即使變格正確也可能語意不通；需要閱讀實際產出的完整句，不能只讀模板或抽樣。
5. 把便於入門的簡化規則寫成「一定／全部」，會教出錯誤概念。應明確標示本題限制與語言規則的差別。

## 部署確認

使用者於 2026-10-27 授權部署。Firebase Hosting 正式站發布成功；HTTP 核對第 4／7 課 HTML、頁面引用的 7 個 JS、audio manifest 與 3 個新 MP3，均回傳 200，內容與本機 dist 位元組一致。本次部署後未新增瀏覽器互動驗收。
