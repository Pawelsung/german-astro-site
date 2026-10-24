# Lesson 4 Kasus Quest V2 開發 Prompt

請使用 `lesson4_kasus_quest_data_v2.json` 建立 German Astro learning site 的 Lesson 4。

## 這版和 MVP 的差別

這不是 47 題示範題庫，而是第二版正式開發資料。

目前題庫總數：116 題。

各程度題數：
{
  "A1": 22,
  "A2": 42,
  "B1": 52
}

各題型題數：
{
  "article-builder": 13,
  "case-detective": 6,
  "pronoun-switch": 10,
  "verb-case-trainer": 15,
  "preposition-map": 18,
  "relative-pronoun-case": 16,
  "reflexive-choice": 10,
  "boss-challenge": 10,
  "preposition-classify": 9,
  "sentence-repair": 9
}

## Lesson 4 定位

課名：Kasus Quest｜Wer? Wen? Wem?

目標：讓 B1 初學者從 A1 開始複習格位，逐步升級到 B1。
核心不是背表格，而是建立格位推理流程：

1. 找動詞、介系詞或關係子句線索
2. 問 Wer? / Wen? / Wem? / Wo? / Wohin?
3. 判斷 Nominativ / Akkusativ / Dativ
4. 選正確冠詞、代名詞、關係代名詞或反身代名詞
5. 顯示中文解釋與完整句

## 必做頁面與元件

建議新增：

- `src/pages/lesson4-kasus.astro`
- `src/components/KasusQuestTrainer.jsx`
- `src/data/lesson4-kasus-quest-data.json`

## 必做功能

1. Level filter：A1 / A2 / B1 / All
2. Mode filter：
   - case-detective
   - article-builder
   - pronoun-switch
   - verb-case-trainer
   - preposition-map
   - preposition-classify
   - relative-pronoun-case
   - reflexive-choice
   - sentence-repair
   - boss-challenge
3. Practice style：
   - Guided Mode：顯示 trigger / questionWord / case
   - Detective Mode：可按提示才顯示
   - Challenge Mode：完全不顯示提示
4. 題目卡片
5. 選項按鈕
6. 答題後顯示：
   - answer
   - fullSentence
   - case
   - questionWord
   - trigger
   - explanationZh
7. Mistake Case File：
   - 依 mistakeTypes 分類錯題
   - 可重新練習錯題
8. Favorites / Weak Items：
   - 收藏
   - 不熟
9. 統計：
   - answered count
   - correct count
   - accuracy
   - mistakes count
10. Reference Panel：
   - caseGuide
   - definiteArticle
   - indefiniteArticle
   - personalPronouns
   - relativePronouns
   - reflexivePronouns
11. Learning Path：
   - Level 0 格位急救站
   - Level 1 A1
   - Level 2 A2
   - Level 3 A2+ 介系詞
   - Level 4 B1 關係代名詞
   - Level 5 B1 反身代名詞
   - Boss 綜合破案

## UI 設計

請做成現代、清爽、有一點偵探任務感的學習工具，不要幼稚遊戲風。

建議配色：
- Nominativ：藍色
- Akkusativ：橘色
- Dativ：綠色
- Genitiv：紫色
- 錯誤：柔和紅
- 成功：柔和綠

每題以 chip 顯示：
- level
- mode
- case
- questionWord
- trigger

## 題型注意事項

### preposition-classify
這類題目的 options 是：
- Akkusativ Zone
- Dativ Zone
- Two-way Zone

### sentence-repair
這類題目的 options 是完整句子，不是單字。
答對後要顯示為什麼原句錯。

### boss-challenge
這類題目的 answer 可能是 `meinem / das` 這種組合答案。
UI 不一定要拆成多個 blank，第一版可以當作單一選項處理。

## 開發要求

- 不要破壞 Lesson 1-3
- 資料和 UI 邏輯分離
- 題目篩選後若沒有資料，要顯示友善訊息
- 手機版可操作
- 卡片高度盡量穩定
- Reference Panel 可折疊
- Build 必須通過
- 每題中文解釋必須完整保留

## 最終回報

完成後請回報：
1. 新增檔案
2. 修改檔案
3. Lesson 4 路由
4. 如何把 Lesson 4 加到首頁或導航
5. build/test 結果
6. 下一步可擴充建議
