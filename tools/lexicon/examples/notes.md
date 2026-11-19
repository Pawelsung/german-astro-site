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
