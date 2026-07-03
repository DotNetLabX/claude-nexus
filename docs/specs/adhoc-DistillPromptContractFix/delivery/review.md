# Distill-Prompt Contract Fix — Review

## Step 1 — Done-Check

**Pre-commitment predictions (before reading implementation.md):** (1) Step 3 bump would be the
highest-risk disposition — plan mandates MINOR→1.17.0 but the resolution was Option A (documented under
1.16.1); likely Superseded, not Missing. (2) Step 2's `improve-skills` non-re-invocation would need
verification against the authoritative skill-log. (3) Step 6 behavioral smoke test is owner-run/out of
scope but plan-marked "blocking" — must surface as owner-owed, not silently pass.

Verified against **live source at HEAD** (repo now at nexus 1.20.0), the two Option A commits
(`00a1725` code, `49a864f` ADR-34 + CHANGELOG), and `.claude/audit/skill-invocations.log`.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Rewrite `SKILL.md` to the contract | **Implemented** | Live `plugins/nexus/skills/distill-prompt/SKILL.md` at HEAD reflects the full contract: `description` reads as the *conversation→reusable-prompt* job (not the sharpener); 7-stage body with the **inverted cardinal rule** (STRIP every run-specific data value, stage 4); inseparable-datum rule; **prose-only** (no `{placeholder}` — deferred, owner D1); never-invent (stage 6); stage-7 **strip** self-verify worded as an in-prompt *mitigation*; Output shape = title + ONE reusable prompt + "Stripped / Still-ambiguous" note; `## Scope` + `## What this skill does NOT do` fence the promotion/storage pipeline and name **`learner`** + **`improve-skills`** as adjacent owners *with distinct discriminators*. Closed 4-key frontmatter, no BOM. `improve-skills` + `claude-api` present in the skill-log (session `902d923b`, token `developer:implement`). |
| 2 — Re-eval against the CORRECT job statement | **Implemented** (sanctioned deviation) | New eval `docs/skill-evals/2026-06-20-distill-prompt-contractfix.md` (166 lines) exists; stale `2026-06-20-distill-prompt.md` carries a `Status: SUPERSEDED` banner (supersede-don't-delete). `evaluate-skill` present in the skill-log. **Deviation (valid):** `improve-skills` not re-invoked *in* Step 2 — the re-eval surfaced no CRITICAL/HIGH/MEDIUM to fold (one keep-as-is LOW). The plan's own Step-2 text anticipates this ("Fold **any** CRIT/HIGH … **or waived with reason in implementation.md**"). `improve-skills` ran in Step 1; both appear in the log across the two skill-mapped steps. |
| 3 — Bump the plugin + sync the twin | **Superseded** | Plan mandated `--minor` → **1.17.0**. Owner/team-lead **Option A** decision superseded it: distill-prompt is **documented under the existing 1.16.1** (CHANGELOG.md lines 250–256, "Also in 1.16.1 — distill-prompt rewritten"), **no separate 1.17.0 bump** — its code landed in the 1.16.1 release tree. Recorded in commit `49a864f` and `communication-log.md`. `gen-omni` twin rode with the release. Repo has since advanced to 1.20.0. Valid supersession by owner decision (the classifier-denied `--minor` in implementation.md was resolved *upward* to Option A, not by the developer). |
| 4 — Update the skill-backlog entry | **Implemented** | `docs/skill-backlog.md`: a `## Skills Fixed` entry for `distill-prompt` (Type: Fix; Source: adhoc-DistillPromptContractFix; Date: 2026-06-20) is present; the stale `## Skills Created` entry carries the one-line forward-marker ("Superseded by the Fixed entry below … original build drifted from contract"). |
| 5 — Terminal gate: lint + selfcheck | **Implemented** | `node …/skill-lint.mjs plugins/nexus/skills/distill-prompt` → **exit 0 at HEAD** (re-run this pass). Frontmatter = exactly the 4 keys, `description` ≫ the `>= 20` floor, no BOM. The transient selfcheck `gen-commands`/`gen-omni` FAILs noted in implementation.md were the known HEAD-based sweep false-positive + the then-blocked Step-3 `gen-omni`; both resolved once the feature committed clean (repo now at 1.20.0). |
| 6 — Behavioral acceptance (owner-run smoke test) | **N/A — operator-owed (OPEN gate)** | Owner-run and **explicitly out of this done-check's scope** (team-lead direction). `implementation.md` `## Behavioral Acceptance` is a **pending stub** — no verbatim `/nexus:distill-prompt` output recorded — so the three behavioral conditions (zero surviving run-specific data values; converged approach intact/re-usable; title + Stripped-note present) **cannot be verified here**. Operator-owed by construction (an interactive smoke test is not a developer-runnable automated gate). Surfaced below as the remaining open gate; not a Fail. |

**Companion action (architect-owned, not a developer step):** ADR-34 extraction — **DONE.**
`docs/architecture/README.md` index (line 52) + body (line 844): *"Distillation is a portable nexus
skill — the pure compaction mechanism only"* (Accepted, adhoc-DistillPromptContractFix). This is the
durable fix against re-drift (the root cause was that the boundary was never recorded as an ADR).

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, not the self-report).**
Developer run = session `902d923b-605d-4f70-8085-2baa8a78c856`, token `developer:implement`
(2026-06-20 17:57–18:02). All non-`None` plan mappings fired: `improve-skills` (Step 1, 17:57),
`claude-api` (Step 1 grounding, 17:57), `evaluate-skill` (Step 2, 18:00), `release-plugin` (Step 3,
18:02). `## Skills Used` self-report is corroborated by the log (no fabrication — nothing self-reported
is absent from the log); the `## Skills Used` section is present (structural gate met). PASS.

**Verdict: PASS** — all developer-executable steps Implemented (Steps 1, 2, 4, 5), Superseded with a
valid owner decision (Step 3), or N/A/operator-owed (Step 6). **One open gate remains, owner-owed and
out of done-check scope:** the Step-6 behavioral smoke test — the *only* check that proves the skill's
one job (strip every run-specific data value) actually *fires* rather than merely being *stated*. The
form gates prove the skill is well-formed; they do not prove it does its job. The pipeline should not
read this Step-1 PASS as full feature closure until the owner runs `/nexus:distill-prompt` on a real
transcript and the three conditions are confirmed from the recorded output.

*Status: COMPLETE — architect, 2026-07-03*

## Step 2 — Code Review

## Reviewed By
reviewer (Step 2, cycle 1/3), code-grounded against live HEAD (repo at nexus 1.20.0; feature code
shipped under 1.16.1 per Option A). Per task scope: plan Step 3 supersession (Option A, no 1.17.0
bump) and Step 6 (owner-run behavioral smoke test) are not re-litigated/not in scope here.

## Verdict: APPROVED

## Pre-commitment Predictions
Before reading code, expected: (1) the rewritten `SKILL.md` would faithfully invert the cardinal
rule and the no-overlap discriminators would hold up against live `learner.md`/`improve-skills`
text — **confirmed clean**. (2) The Option-A version resolution (fold into 1.16.1, no 1.17.0) would
be the highest-risk area for **stale downstream text** left over from the original 1.17.0-targeted
plan — **confirmed true**: found two live mentions of the abandoned "1.17.0" bump that were never
corrected after Option A was decided (see Findings). (3) Expected the mechanical gates
(skill-lint/frontmatter/selfcheck) to be green given the architect's done-check already ran them —
**confirmed**, re-ran fresh this session, all green on today's actually-clean tree.

## Findings

### [MEDIUM] Stale "bump 1.16.1 → 1.17.0" claim in the Skills Fixed entry
**File:** `docs/skill-backlog.md:53`
**Origin:** design
**Issue:** The entry's last sentence reads "Plugin bump 1.16.1 → 1.17.0 (MINOR, owner-decided;
behavior reversal, days-old skill, no adopters)." This is now factually wrong: per the Option-A
resolution (`docs/specs/adhoc-DistillPromptContractFix/delivery/communication-log.md` row 13 —
"User chose **Option A** — document distill-prompt under 1.16.1, **no phantom 1.17.0**"), no
separate 1.17.0 bump ever happened for this feature. Confirmed against git history: 1.16.1 is
`808604c` (adhoc-SectionAddressableReads, distill-prompt's rewrite commit `00a1725` is its
ancestor); 1.17.0 is the unrelated `5945c20` (adhoc-PRReviewTail). `plugins/nexus/CHANGELOG.md`
correctly documents distill-prompt under the existing `## [1.16.1]` entry (lines 250–255) with no
1.17.0 mention. This entry was written at Step 4 (commit `00a1725`) while the plan's original
1.17.0 mandate still held; the later Option-A resolution (commit `49a864f`) updated CHANGELOG.md and
ADR-34 but never circled back to correct this line, leaving a factually incorrect version claim live
in a durable audit-trail doc.
**Fix:** Replace the sentence with something like "Shipped inside the existing 1.16.1 release tree
(Option A, no separate bump — see CHANGELOG `[1.16.1]`)."
**Confidence:** 92/100

### [MEDIUM] ADR-34 Tradeoffs paragraph still claims a "1.15.0 → 1.17.0" version change
**File:** `docs/architecture/README.md:854`
**Origin:** design
**Issue:** "The 1.15.0 → 1.17.0 behavior change is a reversal (keep-values → strip-values, prompt →
conversation), shipped as **MINOR not MAJOR**…" — self-contradicts the very commit that wrote it.
`git show 49a864f` shows this ADR-34 text and the CHANGELOG's 1.16.1 entry (which says "no separate
version bump") were added in the **same commit**, whose own message states "distill-prompt's
contract-fix code shipped in 1.16.1 … so no separate version bump: document it under the existing
1.16.1 entry." The Tradeoffs sentence was never updated to match, so the one durable design record
explicitly extracted to prevent future re-drift on this exact skill now carries an internally
inconsistent fact about when/how its own behavior change shipped — a future agent auditing "what
version introduced the strip-values reversal" would get 1.17.0 from this ADR and the correct 1.16.1
from the CHANGELOG two files apart.
**Fix:** Reword to: "…is a reversal (keep-values → strip-values, prompt → conversation), shipped
inside the existing 1.16.1 release tree (Option A — no separate bump; the plugin `version` is
plugin-wide and the skill was days old with no adopters) rather than MAJOR…" — drop the "1.17.0"
token entirely.
**Confidence:** 95/100

Both findings above share one root cause (the Option-A resolution commit `49a864f` propagated the
"no 1.17.0" fact to two files but missed a third and left a self-contradiction in a fourth location
within itself) — recommend fixing both in one pass. Neither blocks the skill's shipped behavior:
`plugins/nexus/skills/distill-prompt/SKILL.md` itself carries no version numbers and is unaffected.

## Positive Observations
- **Plan conformance on the one developer-owned content step (Step 1) is exact.** Read the live
  `plugins/nexus/skills/distill-prompt/SKILL.md` in full: all 7 stages present with the plan's exact
  discipline — inverted cardinal rule named explicitly (stage 4), the inseparable-datum rule (stage
  4), prose-only/no-placeholder stated, never-invent (stage 6), stage-7 strip self-verify correctly
  worded as **mitigation, not enforcement** (matches the critic's MED-1 fix). Output shape = title +
  ONE prompt + Stripped/Still-ambiguous note, exactly as specified. `## Arguments` documents the
  source-agnostic transcript input + the "adapting logs is the caller's job" line. `## Scope` / `##
  What this skill does NOT do` fence the entire promotion/storage pipeline and name both `learner`
  and `improve-skills` with the two **distinct** discriminators the plan mandated.
- **No-overlap claims independently re-verified against live source, not just the eval's word for
  it.** Grepped `plugins/nexus/agents/learner.md` (recurrence tracking + classification + promotion
  to system files — confirmed) and `plugins/nexus/skills/improve-skills/SKILL.md` ("registered,
  lint-clean" durable skill authoring — confirmed). Both discriminators stated in `SKILL.md` and the
  contract-fix eval hold up against the live text they cite.
- **Supersede-don't-delete correctly applied twice.** `docs/skill-evals/2026-06-20-distill-prompt.md`
  carries a clear `Status: SUPERSEDED` banner pointing at the new eval; the stale `## Skills Created`
  entry in `docs/skill-backlog.md:34` carries the required forward-marker. Neither was deleted.
- **Carry-over findings from implementation.md re-verified, not rubber-stamped:**
  - "Step 3 bump blocked by permission classifier" (HIGH) — **confirmed resolved.** Verified via
    `git log` that 1.16.1 (`808604c`) is the release tree distill-prompt's rewrite commit
    (`00a1725`) landed under, and via `communication-log.md` row 13 that Option A (fold-in, no
    1.17.0) was the deliberate resolution, not a workaround.
  - "gen-commands / gen-omni selfcheck FAILs pre-existing" (LOW) — **confirmed resolved.** Fresh
    `node scripts/selfcheck.mjs` this session: 5/5 PASS (gen-commands drift: in sync; gen-omni
    --check: twin in sync). The dirty-tree entanglement the developer flagged is gone now that the
    tree is clean.
- **Mechanical gates re-run fresh this session** (not trusted from the done-check's numbers), all
  green — see Evidence.

## Gaps
- **Step 6 (behavioral smoke test) is still an open stub** — `implementation.md`'s `## Behavioral
  Acceptance` section has no recorded `/nexus:distill-prompt` output yet. Out of this review's scope
  per the task brief (owner-run), but flagged so it isn't lost: the mechanical gates (skill-lint,
  frontmatter, selfcheck) prove the skill is well-formed; only the Step 6 smoke test proves the
  skill's one job (stripping every run-specific data value) actually fires. Not a review blocker.
- No unit-test coverage exists or is expected — this is a prose recipe skill; the plan's own Testing
  Strategy names the mechanical gates + owner smoke test as the coverage. Consistent with sibling
  skills (`research`, `evaluate-skill`).

## Open Questions
_(none — all findings scored ≥80 confidence and are listed above)_

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| skill-lint | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/distill-prompt` | `OK    distill-prompt` (exit 0) |
| Frontmatter unit tests | pass (4/4) | `node --test tests/lint/frontmatter.test.mjs` | 4 pass, 0 fail — incl. "every skill (both plugins) has valid frontmatter" (closed 4-key set + `>=20` description floor) |
| Repo-wide selfcheck | pass (5/5) | `node scripts/selfcheck.mjs` | `[PASS] tests (lint + unit)`, `[PASS] gen-commands drift`, `[PASS] gen-omni --check`, `[PASS] bump-plugin --check`, `[PASS] spec-diff inline-copy sync` — `selfcheck: 5/5 passed` (tree clean at HEAD, 1.20.0) |
| Live-source no-overlap check | pass | `Grep` on `plugins/nexus/agents/learner.md` and `plugins/nexus/skills/improve-skills/SKILL.md` | Confirms the discriminators `SKILL.md`/eval state (recurrence/approval-gate/shared-source for learner; registered/lint-gated/durable for improve-skills) |
| Version-history reconciliation | fail (2 stale refs found) | `git log --oneline -- plugins/nexus/.claude-plugin/plugin.json`; `git show 49a864f` | Confirms 1.16.1 = `808604c`, 1.17.0 = unrelated `5945c20` (adhoc-PRReviewTail); surfaces the two MEDIUM findings above |

*Status: COMPLETE — reviewer, 2026-07-03*
