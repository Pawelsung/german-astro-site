# 協作指南（Codex、Claude Code 共用）

這個專案由使用者和多個 AI 工具一起維護。不管你是哪個工具，開始前都先讀這份，再讀 `docs/AI_HANDOFF.md`（專案概況、慣例、進度紀錄）。

## 開工前

1. 執行 `git status` 和 `git log --oneline -5`，也用 `git worktree list` 看有沒有其他工作分支。
2. 讀 `docs/AI_HANDOFF.md` 最上方的進度紀錄，確認別的工具做到哪裡。
3. 如果要動的檔案在別的分支或工作目錄有未提交的改動，先告訴使用者，不要覆蓋。

## 協作規則

- 同一份檔案同一時間只由一個工具修改。需要同時工作時，各自用自己的分支或 worktree。
- 一個主題一個 commit。只有使用者要求時才 commit。
- `git push`、`firebase deploy`、資料庫變更，都要先問過使用者。
- `git stash` 是所有 worktree 共用的，不要用沒有標記的 `git stash` 或 `git stash pop`。
- 收工前在 `docs/AI_HANDOFF.md` 的「進度紀錄」最上方加一筆：做了什麼、驗證了什麼、還沒做什麼。下一個工具只能靠這份文件接手。
- 程式慣例（深色模式覆寫、`answerFeedback.js`、`fx-*` 動畫）寫在 `docs/AI_HANDOFF.md`，請照做。

## 固定限制

- 執行時不產生額外費用：Firebase 維持免費的 Spark 方案，不用 Cloud Functions，排程放在 GitHub Actions 這類外部免費服務。
- 既有使用者的學習進度不可遺失，改儲存格式一定要有遷移方案和測試。
- 釋義和例句必須自己撰寫，不可抄錄歌德學院字表或教科書。

## 角色

角色的完整指示放在 `.claude/agents/`。Codex 沒有這套代理機制，要擔任某個角色時，直接讀對應檔案並照著做（忽略開頭的 `tools`、`model` 設定）。

| 角色 | 檔案 | 工作 |
| --- | --- | --- |
| 分級 | `.claude/agents/lexicon-grader.md` | 替字庫詞條標程度、主題、類型 |
| 撰寫 | `.claude/agents/content-writer.md` | 補單字、寫分級短文（只寫草稿） |
| 德文校對 | `.claude/agents/german-reviewer.md` | 獨立校對，只回報 |
| 規劃 | `.claude/agents/product-planner.md` | 功能規格與階段，只回報 |
| 介面檢查 | `.claude/agents/ux-reviewer.md` | 實際操作網站，只回報 |
| 上線檢查 | `.claude/agents/release-checker.md` | 測試、建置、慣例，只回報 |

內容和校對不要由同一個角色、同一次工作完成：寫的人不校對自己的內容。

- 內容流程：撰寫 → 德文校對 → 使用者抽查 → 上線。
- 功能流程：規劃 → 使用者確認 → 實作 → 介面檢查 → 上線檢查 → 問過使用者才部署。

## 主字庫工作（進行中）

| 路徑 | 內容 |
| --- | --- |
| `tools/lexicon/build-lexicon.mjs` | 合併 `public/vocab` 的各字庫，輸出主字庫草稿 |
| `src/data/lexicon/` | 主字庫草稿和清單（網站還沒有使用） |
| `tools/lexicon/RUBRIC.md` | 分級規則 |
| `tools/lexicon/batches/`、`tags/` | 分級的輸入與輸出，一批 250 個詞條 |
| `tools/lexicon/check-tags.mjs` | 檢查分級結果，改完一定要跑 |

重新執行 `build-lexicon.mjs` 可能改變詞條和批次的對應，分級期間不要重新產生 `batches/`。

目標：A1、A2、B1 完整，B2 收一部分；已學會的低程度字仍要定期抽考。
