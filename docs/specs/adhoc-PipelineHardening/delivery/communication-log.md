# Communication Log — adhoc-PipelineHardening

Team mode: **Standard + Codex**. Branch: `main`. Review mode: **critic** (a critic plan-review already exists).

Resume state at launch: plan written, critic plan-review verdict = **CHANGES** (2 MAJOR), implementation not started. Dirty tree is in-scope (already-in-tree work bundled by this feature per plan).

| # | Time | From | To | Type | Message | Problem / Note |
|---|------|------|-----|------|---------|----------------|
| 1 | t0 | team-lead | architect | dispatch | `Analyze adhoc-PipelineHardening.` (Phase 1) | Resume: revise plan to clear the 2 MAJOR plan-review findings |

**Resume (new session, t1).** Comm log above was stale — only the t0 dispatch was logged. Recovered actual state from artifacts + prior-session transcript (`6632d5e0`, `59e93a8b`): the architect **revised the plan** (`plan.md` mtime 14:34, after this log's 12:53) and folded the critic's findings into a `## Plan Review (critic — resolved)` section dispositioning **MAJOR-1 (M4 dropped consumer-grep)**, **MAJOR-2 (M5 dead Codex anchor)**, and 3 MINORs. The revision was **self-verified by full re-read**, but **no independent critic re-review** of the revised plan occurred. Review mode = critic → the revision needs an independent critic pass before approval (authoring ≠ review). `.pipeline-state` had been cleared (no stale lock); set to `critic:review`.

| 2 | t1 | team-lead | critic | dispatch | Re-review revised `plan.md` vs brief `docs/pipeline-hardening-findings.md`; confirm MAJOR-1 + MAJOR-2 genuinely closed, no new gaps | Independent review pass on the architect-revised plan |
| 3 | t2 | critic | team-lead | verdict | **APPROVED**. MAJOR-1 CLOSED (single `review.md`, labeled Done-Check/Code-Review sections; team-lead section-targets `Missing` grep — plan 213-216). MAJOR-2 CLOSED (Step 6 creates Codex dispatch subsection — plan 300-311). MINORs: none open. New gaps: none blocking | Critic's first two returns were terse with no verdict; recovered on a 3rd spawn instructed to emit the verdict as its final message (a real return-surfacing friction — candidate lesson for M6/Step 7) |

**Plan APPROVED (t2).** Review mode = critic; independent re-review passed with no open findings → auto-approved per Plan Approval (no user ask). Two **advisory, non-blocking** imprecisions the critic flagged for awareness (the developer can correct in passing — not a CHANGES): (a) Step 2 142-143 deny reason says "addresses the team-lead" but a deny actually reaches the acting developer subagent (recovery still holds — mirrors invariant-3 idiom); (b) Step 5 287 "the pipeline diagram" reference points at the ASCII block but the relevant Pipeline Sequence is at team-lead.md:200 (findable by description).

| 4 | t3 | team-lead | developer | dispatch | `Analyze adhoc-PipelineHardening.` (Phase 1 — analyze & stop) | `.pipeline-state` = `developer:analyze` so the gate arms the analyze-collapse block |
