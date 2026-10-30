# German Astro Site — Codex working rules

## Repository context
- Read `README.md` and `docs/AI_HANDOFF.md` before complex work. The current code is source of truth when historic notes conflict.
- Technology: Astro 7, React 19, Tailwind 4, Firebase optional cloud sync; lesson1–lesson7. `src/lib/answerFeedback.js` is the shared answer feedback path; `src/lib/progressStorage.ts` owns progress keys.
- Preserve learner data, valid alternative German answers, and dark-mode behavior. For new UI classes, inspect `src/styles/global.css` dark overrides and reduced-motion support.

## Explicit multi-agent audit request
When the user asks to audit/review the German learning website or to activate the German audit team:
1. Read `docs/German-Audit-Team.md`. Use the **main Codex thread as the operational director** (you may consult `audit_director` for synthesis). Spawn the eight named specialists concurrently when available: `german_linguist`, `lexicon_auditor`, `learning_scientist`, `assessment_designer`, `ux_specialist`, `frontend_architect`, `firebase_security`, `qa_engineer`.
2. First round is READ-ONLY: no application/database/data changes, no remote write calls, no deployments and no generated artifacts in tracked paths. The descriptions in TOML are behavioral instructions, **not** an enforced read-only sandbox. Select a read-only permission mode on the parent turn before delegating.
3. Wait for all eight reports (or state explicitly which could not run). Reconcile overlapping claims, mark CONFIRMED/SUSPECTED/NOT VERIFIED, and synthesize P0–P3 findings with file:line evidence. Only propose fixes; seek separate authorization for implementation/deployment.
4. Do not silently start eight reviewers on routine small development tasks; use delegation only for explicitly requested audits or when justified by scope.

## Any implementation work
Keep changes small and independently testable. Do not publish, push to production branches, change Firestore rules, alter learner progress, or deploy without user approval. Record verification performed; avoid saying all German text is correct based only on automated tests.
