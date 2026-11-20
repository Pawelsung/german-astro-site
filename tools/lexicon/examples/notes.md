# 主字庫例句備註

已依獨立德文校對表 batch-01～05 修正，共保留 441 句；仍待使用者抽查，不產生音檔、不部署。

## 4 筆可疑詞條的處理（2026-11-19）

使用者請 Claude Code 自行判斷合理寫法，例句在 `batch-06.json`，已經獨立德文校對：

- `der-kunstwerkladen` → 改名 `der-kunstladen`（der Kunstladen，複數 die Kunstläden），釋義「藝術品店」。
- `das-bildmodell`：保留詞形，釋義改為「（AI）圖像生成模型」。德文較常說 KI-Bildgenerator，但詞形來自原始筆記，C1 保留。
- `die-sonderkraefte` → 改名 `die-spezialkraefte`（只用複數），釋義「特種部隊；（警方的）特勤人員」。
- `das-bauarbeitsgeraet` → 改名 `das-baugeraet`（das Baugerät，複數 die Baugeräte），釋義「施工機具」。

改名都透過 `corrections.rename`，舊 id 寫進 `redirects.json`，學習進度不會遺失。

`bedingt` 採 batch-05 校對版本（銀行的有條件承諾），覆蓋 batch-03 的建議。`das-karamell` 透過 corrections.rename 改為 `der-karamell`，例句使用新 id。

自動測試只檢查資料、用字與標點；獨立語言校對已完成，使用者抽查尚未完成。

## 9 筆無法辨識的筆記詞條（2026-11-19）

依 `原始筆記逐頁辨識.md` 的前後行推測，已經 german-reviewer 校對。參考書籍資料夾裡的 Menschen、Schritte 是掃描檔，無法搜尋文字；文法書可搜尋，sich auseinandersetzen mit + D、gerettet、früher gehen 都有出現。

| 筆記原字 | 推測 | 處理 |
| --- | --- | --- |
| Putzhilfer | die Putzhilfe | 新增（drafts/notes-recovered.json） |
| nord adj | nördlich von | 新增，和既有 südlich von 對稱 |
| Frumgung | die Umgebung（低信心；也可能是 Entfernung） | 字庫已有，不新增 |
| im Wandeln | im Wandel／der Wandel | 新增 der Wandel |
| sammen gesmaaelt | sammeln – gesammelt（低信心；也可能是 zusammen gesammelt） | 字庫已有 sammeln，不新增 |
| auseinanderstellen | sich auseinandersetzen | 新增，釋義含「和人爭論」 |
| test geredt | gerettet（低信心；可能是 fast gerettet） | 字庫已有 retten，不新增 |
| Sonnenunteraufgang | Sonnenaufgang／Sonnenuntergang 寫在一起 | 兩個字庫都有，不新增 |
| früher gegen müssen | früher gehen müssen | 新增片語 |

使用者 2026-11-20 確認：3 筆低信心（Frumgung、sammen gesmaaelt、test geredt）想不起原意，不新增、不再追查。
