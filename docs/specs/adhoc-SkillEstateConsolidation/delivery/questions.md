# Skill Estate Consolidation — Questions

## Q1: Step 7 target ADR number — ADR-50 is already taken
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (blocks Step 7)
**File:** `docs/architecture/README.md`

**Context:** Step 7 instructs "the next free number is **ADR-50** (index ends at ADR-49; ADR-24's
PROPOSED row is the format precedent)." That premise was true when the plan was written (2026-07-07),
but ADR-50 has since landed in the register:
- `README.md:68` (index) — `- ADR-50 — mine-reference-model is the fourth mine … *(Accepted — adhoc-MineReferenceModel, 2026-07-05)*`
- `README.md:1226` (body) — `## ADR-50 — mine-reference-model is the fourth mine … — Accepted`

The highest ADR row is now **ADR-50 (Accepted)**, not ADR-49. Authoring the D3 register rule as
ADR-50 would collide with an existing Accepted ADR (duplicate number, two bodies).

**Question:** Retarget Step 7 to **ADR-51** (next genuinely-free number)? All other Step 7 mechanics
hold — the ADR-24 PROPOSED row precedent (`README.md:42-ish`, verified present) still applies for the
`*(PROPOSED — owner ratifies)*` marker; only the number changes.

**Recommendation:** Yes — author the D3 register rule as **ADR-51**, PROPOSED. Update Step 7's number
and its acceptance grep (`grep PROPOSED on the new row → 1 hit` is unaffected).
**Confidence:** high — grep-verified: ADR-50 is an Accepted ADR from the adhoc-MineReferenceModel pass;
ADR-51 is unused. Purely a stale-number correction, no design impact.

### Answer
**Yes — retarget Step 7 to ADR-51, PROPOSED.** Architect-verified live in this worktree (2026-07-07):
- ADR-50 is **Accepted** — index `docs/architecture/README.md:68` and body `:1226`
  (`mine-reference-model … adhoc-MineReferenceModel, 2026-07-05`). The plan's "index ends at ADR-49 / ADR-50
  free" premise was stale (the critic's "checked clean: ADR-50 free" was already wrong when written — ADR-50
  landed 2026-07-05, before the 2026-07-07 plan).
- No ADR-51 exists — it is the next genuinely-free number.
- ADR-24's PROPOSED precedent is still at `README.md:42` (index) / `:664` (body), so the `*(PROPOSED — owner
  ratifies)*` marker and the acceptance grep (`PROPOSED` on the new row → 1 hit) are unaffected.

**Plan amended:** Step 7 heading + body and Skill-Mapping row 7 now read ADR-51; the stale premise is
annotated inline, and a "Post-review corrections" note was added to the Plan Review section so no reader
trusts the superseded "ADR-50 free" line.

---

## Q2: Precondition — working on the `adhoc-SkillEstateConsolidation` worktree branch, not `main`
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (blocks Step 1 — binding precondition)

**Context:** The binding precondition (critic F7) says: "This pass starts from a clean checkout of
`main` … verify `git branch --show-current` = `main` before Step 1." Actual environment:
- This session runs in a **dedicated worktree** `D:\src\claude-plugins\nexus-skillwt` on branch
  **`adhoc-SkillEstateConsolidation`** (base commit `02d4707`), separate from the `nexus` worktree
  which still sits on the concurrent `adhoc-MineVerifyPhpAdapter` pipeline.
- `git status` is **clean** except this pass's own untracked `delivery/communication-log.md` — no
  foreign dirty files.

So F7's *intent* (start clean, isolated from the concurrent pipeline's dirty communication-logs) is
satisfied by the worktree isolation — arguably better than working on `main` directly. But the literal
`= main` check fails.

**Question:** Confirm I should proceed on this clean `adhoc-SkillEstateConsolidation` worktree branch
(the team-lead-provisioned isolation), treating the precondition's "= main" as satisfied-in-spirit by a
clean branch cut from main and isolated from the concurrent session?

**Recommendation:** Proceed here. The worktree is the correct isolation the precondition wanted; the
"= main" wording predates the dedicated-worktree setup. Do NOT switch branches or touch the `nexus`
worktree.
**Confidence:** high — clean tree, isolated from the concurrent pipeline, dedicated feature branch;
this is the standard worktree pattern for this repo (`nexus-cppwt`, `nexus-skillwt` both exist).

### Answer
**Proceed here — the owner chose worktree isolation, and it satisfies F7's intent in spirit.** This is the
owner's decision (relayed by the team lead), not the architect's to reverse; and it is architect-verified:
- Branch `adhoc-SkillEstateConsolidation`, HEAD `02d4707` (the plan commit); parent `a86e842` = the `main`
  tip (nexus 1.25.0), and `git merge-base --is-ancestor a86e842 HEAD` confirms `a86e842` IS an ancestor —
  i.e. this worktree is cut cleanly from `main` with only the plan commit on top.
- `git status` clean except this pass's own untracked `delivery/` files — no foreign dirty files, fully
  isolated from the concurrent `adhoc-MineVerifyPhpAdapter` pipeline in the sibling `nexus` worktree.

F7's isolation intent (clean start, no concurrent-pipeline dirty logs) is met — worktree isolation is
stronger than working on `main` directly. The literal `git branch --show-current = main` check is satisfied
in spirit. **Do NOT** switch branches or touch the `nexus` worktree; never commit on its branch.

**Plan amended:** the Precondition bullet now records the sanctioned worktree isolation, so the Step-1
done-check resolves "branch ≠ main" as a pre-sanctioned variant in one line rather than flagging a deviation.

---

## Q3: Step 9 §14 acceptance grep is vacuous (recurs the F1 bug class)
**From:** developer
**To:** architect
**Status:** Answered
**Step:** Phase 1 analysis (affects Step 9 acceptance, non-blocking for Steps 1–8)
**File:** `D:\src\dotnet-microservices\docs\architecture-reference.md`

**Context:** Step 9's acceptance says: grep `architecture-reference.md` for
`What exists: 13 project-local skills` … → 0 hits. But the live text (line 1032) is markdown-bolded:
`**What exists:** 13 project-local skills under ` — so the literal string `What exists: 13
project-local skills` matches **0 times already, before any rewrite** (verified: literal grep → 0;
regex `What exists.*13 project-local skills` → 1). A gate that is 0 both before and after the edit
proves nothing — this is the same vacuous-grep class that critic finding F1 was raised to fix.

**Question:** Tighten the Step 9 §14 acceptance grep to match the live bolded claim so it's a real
before/after gate?

**Recommendation:** Change the acceptance to a regex that matches the live text, e.g.
`grep -E 'What exists.*13 project-local skills'` — expect **1 hit before** the §14 rewrite and **0
after**, plus the existing "supersession line naming the Step-8 version → 1 hit". Same correction
applies to the "repo-exact design paragraph" clause (grep the actual phrase, e.g.
`phased, variant-aware, and repo-exact`, which is present at line 1034). I can execute this at Step 9
without a plan edit, but flagging so the plan's gate is corrected too.
**Confidence:** high — verified by direct grep of both string forms against the live file.

### Answer
**Yes — tighten the Step 9 §14 acceptance to real before/after gates.** Architect-verified against the live
`D:\src\dotnet-microservices\docs\architecture-reference.md` (2026-07-07):
- literal `What exists: 13 project-local skills` → **0 hits** (the live text is bolded `**What exists:**` at
  line 1032) — a gate that reads 0 both before and after proves nothing: the same vacuous-grep class F1 was
  raised to fix.
- `grep -E 'What exists.*13 project-local skills'` → **1 hit** (line 1032) — a real "1 before → 0 after"
  gate for the §14 rewrite.
- `grep -E 'phased, variant-aware, and repo-exact'` → **1 hit** (the "opinionated shape" design paragraph,
  line 1034) — the correct target for the "repo-exact design paragraph" clause; also "1 before → 0 after".

**Plan amended:** Step 9's Accept line now specifies both regex gates as explicit before/after counts, plus
the unchanged "supersession line naming the Step-8 version → 1 hit". You may execute exactly these greps at
Step 9 — the plan gate now matches, so the done-check is deterministic.
