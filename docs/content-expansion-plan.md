# 內容擴充規劃（2026-10-26）

本文件比對現有題庫與 B1 檢定（Goethe／telc B1）常見的文法範圍，列出缺口和建議的擴充順序。數量是 2026-10-26 依資料檔統計的結果。

## 現況盤點

| 課 | 現有數量 | 覆蓋情況 | 主要缺口 |
|---|---|---|---|
| 1 單字 | B1.1 460 字、A1–B1 449 字、進階 87 字 | Schritte B1.1 第 1～7 課 | **沒有 B1.2（第 8～14 課）**；約 700 句例句沒有中文翻譯 |
| 2 動詞＋介系詞 | 50 組，13 個介系詞 | 最常見的搭配 | 缺 **vor**（Angst haben vor、warnen vor、schützen vor）、**aus**（bestehen aus）；B1 常見的搭配約有 100 組 |
| 3 不規則動詞 | 160 個（B2／C1 共 43 個） | 強變化動詞的三態 | **可分動詞與字首動詞**（aufstehen、ankommen、verstehen、bekommen）；**Konjunktiv II**（hätte、wäre、würde、könnte） |
| 4 格位 | 116 題 | Akk、Dat、雙向介系詞、關係代名詞、反身代名詞 | **完全沒有 Genitiv**；**n-Deklination**（den Kunden、dem Studenten）；Nominativ 只有 7 題 |
| 5 連接詞 | 171 題，37 個連接詞 | 很完整 | **間接問句**（ob、W-Frage）；nachdem 搭配 Plusquamperfekt；含情態動詞、Perfekt 或可分動詞的句框語序 |
| 6 形容詞字尾 | 154 題，14 個名詞、16 個形容詞 | 不定冠詞（各格位）、無冠詞 | **定冠詞只有 Nominativ**（缺 Akk、Dat）；**沒有複數**；沒有 mein／kein；**沒有 Genitiv**；**沒有比較級和最高級** |

## B1 範圍內完全沒有涵蓋的主題

| 主題 | 為什麼重要 | 建議放在 |
|---|---|---|
| **Passiv**（現在式、過去式、完成式，搭配情態動詞） | B1 閱讀和寫作的必考項目 | 新的第 7 課 |
| **Konjunktiv II**（願望、建議、禮貌請求、非現實條件） | 口說與寫作（Ich würde …、Wenn ich … hätte） | 新的第 8 課，或併入第 3 課 |
| **Plusquamperfekt**、**Futur I** | 搭配 nachdem 和敘事時態 | 第 3 課加入「時態」模式 |
| **Genitiv**（wegen、trotz、während，des／der） | B1 書面語常見 | 第 4 課和第 6 課 |
| **n-Deklination** | 常見錯誤 | 第 4 課 |
| **比較級和最高級**（含形容詞字尾） | 生活中常用 | 第 6 課 |
| **lassen**、**zu + 不定式**（es ist wichtig, … zu …） | B1 句型 | 第 5 課 |

## 技能面（目前只有文法和單字）

| 技能 | 擴充方式 | 可用的現有資源 |
|---|---|---|
| **聽力** | 句子聽寫、聽音選意思 | 已有 Google 自然人聲，新句子執行 `npm run audio` 即可產生音檔 |
| **閱讀** | 短文（150～250 字）加理解題，依 Schritte 各課主題 | — |
| **寫作** | B1 考試的電子郵件題型：道歉、邀請、抱怨，附模板和常用句 | 第 5 課的連接詞 |
| **口說** | Redemittel 句型卡：表達意見、提出建議、贊成或反對 | 字卡元件 |

## 建議擴充順序（工作量只是大概）

1. ✅ 2026-10-26 完成：**第 6 課補足字尾表**（約 1 天）：加入定冠詞 Akk、Dat、複數、mein／kein 和 Genitiv；名詞擴充到 30 個、形容詞到 30 個；產生器已有相容表，只要擴充資料
2. ✅ 2026-10-26 完成：**第 4 課加入 Genitiv 和 n-Deklination**（約 1 天）：約 40 題，沿用格位圖解
3. **第 2 課擴充到 100 組**（約半天）：補 vor、aus 和 B1 常見搭配，加入 wo(r)-／da(r)- 練習
4. **新增 Konjunktiv II 課**（約 2 天）：形式表、願望、建議、禮貌請求、非現實條件句
5. **新增 Passiv 課**（約 2 天）：主動改被動、時態、搭配情態動詞
6. **單字 B1.2（第 8～14 課）**（約 2～3 天，需要使用者提供或確認教材範圍）
7. **聽力與寫作模組**（各約 2 天）

## 擴充內容時的注意事項
- 每批新內容都要依照 `docs/content-review-2026-10-24.md` 的方法逐條檢查，再執行 `npm run audio` 產生音檔
- 第 6 課新增名詞或形容詞時，要同時更新 `NOUN_ADJECTIVES` 相容表和各句型的 `allowedNounIds`
- 新的一課要加入：`LessonShell` 的 `lessonLinks`、`ConceptCard`、`LessonModes` 的 `REVIEW_COUNT`、`progressStorage` 的 summary，以及首頁的 `totals`
