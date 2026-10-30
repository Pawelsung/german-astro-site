# German Astro Site — Nine-agent audit team

**Configured agents:** one coordinator (`audit_director`) plus eight specialist roles (see below). These TOML files make custom roles available to Codex; they do **not** create a permanently running process, enforce permissions, or launch agents by themselves.

## How to start in Codex

1. Open the repository in a current Codex client and trust the project. Ensure the branch containing `.codex/` and `AGENTS.md` is checked out.
2. Set the **parent session permissions to read-only** before the first audit; subagents inherit parent sandbox/approval rules.
3. In the main Codex thread, send:

> 對本專案執行德文學習網站第一輪完整稽核。請依 AGENTS.md 和 docs/German-Audit-Team.md，將主對話作為總指揮，平行啟動 german_linguist、lexicon_auditor、learning_scientist、assessment_designer、ux_specialist、frontend_architect、firebase_security、qa_engineer 八位代理人。請確認各代理人實際啟動並等待完成；只讀不修改任何程式、字庫、題庫、Firestore 或正式資料。逐位輸出報告並交叉驗證，最後統整一份 P0–P3 改善計畫；沒有執行的測試必須註明。

4. Use the Codex subagents/thread panel (or CLI `/subagents`) to inspect actual status. Configuration presence **does not** prove execution. If any role cannot spawn, report the blocker and complete only the available reviews. The ninth role `audit_director` exists for explicit synthesis/delegation sessions; the eight parallel workers plus main coordinator is the recommended topology.

## Role map

| Role | Responsibility | Focus files |
| --- | --- | --- |
| `audit_director` | scope, delegation, cross-validation, final P0–P3 triage | README, docs, all specialist reports |
| `german_linguist` | grammatical correctness / meaning / CEFR | src/data, src/lib/konjunktiv.mjs, lesson content, word packs |
| `lexicon_auditor` | vocabulary dataset consistency / examples / audio | public/vocab, 單字, tools/vocab-review |
| `learning_scientist` | retrieval, spacing, transfer, READ → RETRIEVE → USE | LessonModes, LearningDashboard, progress mechanisms |
| `assessment_designer` | key validity, distractors, answer acceptance | trainers, question banks, answerFeedback, tests |
| `ux_specialist` | flow, mobile, access, dark mode | pages, components, global.css |
| `frontend_architect` | Astro/React correctness and maintainability | src/components, src/hooks, src/lib, package.json |
| `firebase_security` | identity, rules, sync / user-data isolation | firestore.rules, firebase.json, firebase.ts, UserAccount, progressStorage |
| `qa_engineer` | regression matrix, coverage, repro | tests, pages, major flows |

## Evidence schema — required for every substantive finding

- **ID / owner:** e.g. `LANG-01`, `SEC-02` (unique within an agent).
- **Status:** `CONFIRMED` (current source or observed reproduction), `SUSPECTED`, or `NOT VERIFIED` (insufficient access/evidence).
- **Priority:** `P0` = active data exposure/loss or critical learning corruption; `P1` = incorrect instructional content, broad misgrading, broken core workflow; `P2` = material pedagogical or usability problem; `P3` = quality / future enhancement. Never mark P0 without strong evidence.
- **Evidence:** exact repository path and line range or stable question/word ID; for observed behavior list environment, steps, expected vs actual. Historical audits are hypotheses, not current evidence.
- **Impact & scope:** affected learners, routes, formats, and known limitations.
- **Proposed action:** smallest defensible fix, owner, acceptance tests, residual risk.
- **Confidence:** high/medium/low; label source-only UI reviews and unrun tests.

Suggested report outline for each specialist: scope inspected; confirmed findings with evidence; suspected/unverified risks; counterexamples and exclusions; prioritized actions; checks actually run and not run. No invented counts, citations or browser tests.

## Workflow & ownership

**Stage 1 — isolated evidence gathering (parallel):** specialists read different concerns; zero application/data writes. If code execution is restricted, do static inspection and mark runtime unknown. Use the existing `docs/content-review-2026-10-27.md`, `docs/lesson-review-2026-10-24.md` and `docs/AI_HANDOFF.md` as historical leads.

**Stage 2 — cross-validation (coordinator):** language × assessment for alternate answers; lexicon × language for examples; learning × UX for task completion; frontend × security × QA for progress synchronization and regression. Explicitly resolve disputed findings and de-duplicate issues. If validation cannot be completed, retain uncertainty.

**Stage 3 — synthesis (coordinator):** one executive summary, count of actual completed agents, evidence-linked P0–P3 backlog, implementation owner, acceptance criteria, sequencing and risk/rollback notes. Do not merge or deploy changes. Ask for approval before a new implementation phase.

## Safety limits

- No Firebase production writes, authentication using personal credentials, deployment, progress resets, secret exposure, account switching against real users, or external write calls.
- No automatic fixes in the audit phase; no simultaneous editing by specialist agents. Even running `npm run build` could write `dist`, and `npm test` may create temporary output: do not claim a purely read-only audit if such commands change the workspace.
- Read-only behavior in agent instructions is not a security boundary; parent permissions must enforce it.
- Deployed site verification and browser testing require actual access and a written test record; code inspection alone is not live validation.

## Deliverables

- Eight specialist audit reports (if actually run).
- One consolidated director report with a prioritized backlog, reproduction evidence and missing-verification register.
- After explicit approval only: a small-batch implementation plan and regression checklist, with application changes separate from audit configuration.
