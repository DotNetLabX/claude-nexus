# Distill-Prompt — Contract Fix — Implementation

Rewrites the shipped `distill-prompt` skill (1.16.x) to its real graduated-proposal contract:
*conversation/transcript → ONE reusable prompt + title*, **STRIP run-specific data / KEEP converged
intent** (inverting the prior verbose-prompt-sharpener's lossless/keep-values cardinal rule).
Scope this run: Steps 1–5. Step 6 (behavioral smoke test) is owner-run — recorded as pending below.

## Files Created
- _(none — this pass rewrites and supersedes existing artifacts)_

## Files Modified
- `plugins/nexus/skills/distill-prompt/SKILL.md` — **Step 1.** Whole-skill reframe (supersede in
  place, not additive patching) to the graduated-proposal contract. Closed 4-key frontmatter kept
  (`name`/`description`/`user-invocable`/`disable-model-invocation`), `name: distill-prompt`,
  `disable-model-invocation: true`. Rewrote `description` to the conversation→reusable-prompt job
  (transcript in; ONE reusable prompt + title out; strip run-specific data / keep converged intent;
  source-agnostic; human-invoked, never auto-saved) — replacing the old verbose-prompt-sharpener
  wording (the drift). Body: kept the 7-stage discipline and the never-invent / no-disk rules;
  **inverted the cardinal rule** from lossless/keep-values to **STRIP every run-specific data value /
  KEEP the converged intent+approach** (stage 4), added the **inseparable-datum rule** (generalize the
  role, flag the literal), made it **prose-only** (no `{placeholder}`/`[placeholder]` — deferred per
  owner D1), and inverted the stage-7 self-check to a **strip** re-read worded as an in-prompt
  mitigation (not enforcement). Output shape is now title + ONE reusable prompt + "Stripped /
  Still-ambiguous" note. `## Scope` and `## What this skill does NOT do` fence out the entire
  promotion/storage pipeline and name **`learner`** (no recurrence threshold/approval gate/shared
  source — they compose) and **`improve-skills`** (distill output is ephemeral/in-conversation/no-disk/
  unregistered/un-lint-gated vs improve-skills' durable, stored, lint-gated SKILL.md) as the adjacent
  owners with explicit discriminators. UTF-8, no BOM (ADR-23), via Write tool (dev-repo carve-out,
  ADR-1).

## Key Decisions
- **Examples in the grounding section are generalized-shape-only.** The old skill's "Examples carried
  through when the original supplied them" became "Examples carried through *only as generalized
  shapes*; never carry a run's literal example data forward" — a run's literal example data is itself a
  run-specific data value, so carrying it would violate the stage-4 cardinal rule. Not spelled out in
  the plan; follows directly from the strip contract.
- **`description` is 489 chars** (well over the `>= 20` floor at `frontmatter.test.mjs:43`) — long
  enough to read unambiguously as the conversation→reusable-prompt job, which the plan made the
  load-bearing fix (the drift was a description/body that read as a prompt-sharpener).
- **Step 2 did not re-invoke `improve-skills`.** The re-eval surfaced no CRITICAL/HIGH/MEDIUM to fold;
  a consolidating pass with nothing to consolidate is theater (AP-adjacent). Documented as a sanctioned
  deviation below.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | improve-skills, claude-api | improve-skills (dev-repo carve-out, "For Existing Skills" whole-skill reframe; skill-lint is the done-condition). claude-api invoked to ground the reusable-prompt target structure (clear/direct, role/context, explicit output format) — surfaced as an invokable skill, no fallback needed. TDD: no (prose recipe). |
| 2 | evaluate-skill | Re-eval against the corrected conversation→reusable-prompt job statement (rubric Layers 0–4 + overlays); ACCEPT, no CRIT/HIGH/MED. `improve-skills` NOT re-invoked in Step 2 — nothing to fold (see Deviations); it ran in Step 1, so both skills appear in the log across the two skill-mapped steps. TDD: no. |

### Step 2 — Re-eval against the corrected job statement
- `docs/skill-evals/2026-06-20-distill-prompt-contractfix.md` — **NEW.** Re-evaluated the rewritten skill
  against the conversation→reusable-prompt job statement. Verdict **ACCEPT**; no CRIT/HIGH/MED; one LOW
  (deliberate consistent emphasis of the cardinal rule + no-disk fence, single normative owner —
  keep-as-is). The **named no-overlap check** ran as two explicit sub-checks against live source: **vs
  `learner`** (read `learner.md` — post-pipeline consolidation w/ recurrence threshold + approval gate +
  writes shared source, vs distill's single-shot transform; they compose) → CLEAN; **vs `improve-skills`**
  (more confusable — both emit reusable instruction text — fenced on ephemeral/in-conversation/no-disk/
  unregistered/un-lint-gated vs durable/stored/lint-gated SKILL.md) → CLEAN. The **Layer-2.2 stage-7
  re-read weight** was re-derived in the *strip* direction (strip fails unsafe where keep failed safe) →
  resolved: correct shape for a prose skill, named as a mitigation, backstopped by the blocking owner
  smoke test (Step 6).
- `docs/skill-evals/2026-06-20-distill-prompt.md` — **MODIFIED.** Added a `Status: SUPERSEDED` banner
  (wrong job statement; points to the contract-fix eval). Supersede-don't-delete.

### Step 3 — Bump the plugin + sync the twin — BLOCKED (permission denial; awaiting team-lead)
- `release-plugin` invoked (ADR-9 flow loaded). `node scripts/bump-plugin.mjs --dry-run` ran clean:
  detects the `distill-prompt` skill change (plus the pre-existing user-approved 19-file sweep bundled
  in the same working tree), proposes PATCH **1.16.1 → 1.16.2** against the working-tree base.
- Verified the version base: **HEAD plugin.json = 1.16.0**; **working-tree = 1.16.1** (the pending
  SectionAddressableReads bump, intentionally uncommitted per coordination note). So `--minor` from
  base 1.16.1 yields **1.17.0** — exactly the plan's owner-decided target.
- **`node scripts/bump-plugin.mjs --minor` was DENIED by the auto-mode permission classifier**, which
  read the coordination note ("don't touch the pending plugin.json/CHANGELOG bump; team lead owns it")
  as forbidding any plugin.json/CHANGELOG edit, and read MINOR as an unauthorized escalation. Both reads
  are mechanically incorrect for this action (see the explanation in my handback): Step 3 of the binding
  plan *requires* editing those two files, the bump stacks on top of the pending 1.16.1 to 1.17.0 (it
  does not touch/commit the 1.16.1 entry), and MINOR is the plan's owner-recorded decision (Open
  Decisions — RESOLVED 2026-06-20), not mine. I did **not** work around the denial. **Step 3 (and the
  `gen-omni` + `--check` substeps that follow it) is blocked pending the team lead's go-ahead to run
  `node scripts/bump-plugin.mjs --minor` (→ 1.17.0), then `node scripts/gen-omni.mjs` +
  `node scripts/gen-omni.mjs --check`.**

### Step 4 — Update the skill-backlog entry — DONE
- `docs/skill-backlog.md` — **MODIFIED.** Added a `## Skills Fixed` entry for `distill-prompt`
  (Type: Fix; Source: adhoc-DistillPromptContractFix; Date: 2026-06-20) describing the contract
  correction — conversation→reusable-prompt, strip run-specific data / keep converged intent,
  prose-only, inseparable-datum rule, the `learner` / `improve-skills` boundary, the bump to 1.17.0, and
  the re-eval ACCEPT verdict. Added a one-line **forward-marker** to the existing `## Skills Created`
  entry ("Superseded by the Fixed entry below … original build drifted from contract") so the stale
  prompt-sharpener description cannot be read as current — mirrors the eval's `Status: superseded`
  treatment.

### Step 5 — Terminal gate: lint + selfcheck — distill-prompt-scoped checks GREEN
Per the run's coordination note, the meaningful Step-5 checks are the **distill-prompt-scoped** ones;
repo-wide drift from the pending 19-file sweep is pre-existing/expected.
- **`node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus/skills/distill-prompt`
  → exit 0.** ✓
- **`node --test tests/lint/frontmatter.test.mjs` → 4/4 pass.** ✓ Includes "every skill (both plugins)
  has valid frontmatter" (the closed-4-key-set + `>= 20` description-floor layer that covers
  distill-prompt) and "every agent has a generated command" (confirms no agent file changed → Step 3's
  no-`gen-commands` precondition holds for this feature).
- **`node scripts/selfcheck.mjs` → 2/4 (the load-bearing tests gate PASSES).** `[PASS] tests (lint +
  unit)` (the deterministic gate for the skill — frontmatter + shipped-skill lint dogfood, green);
  `[PASS] bump-plugin --check` (a bump is present). The two `[FAIL]`s are **pre-existing / expected,
  not introduced by this feature**:
  - `[FAIL] gen-commands drift` — from the user-approved sweep that edited agent files
    (architect/critic/po/reviewer). The **known git-HEAD-based false-positive at the developer's stop**
    (MEMORY: gen-commands selfcheck pre-commit false-positive) — resolves at the team-lead commit. My
    change touched **no** agent file.
  - `[FAIL] gen-omni --check` — twin drifted from the pending sweep's `plugins/**` changes **and**
    because Step 3's `gen-omni` is blocked (the bump it follows was denied). Resolves once Step 3 runs.

## Behavioral Acceptance (Step 6) — PENDING (owner-run)
Step 6 is the **blocking owner-run smoke test**: invoke `/nexus:distill-prompt` on a real multi-turn
data-analysis transcript containing literal figures, dates, and SKU/brand names, and record the emitted
output **verbatim here**. The done-check then verifies from that recorded output that (a) **zero**
run-specific data values survived (each generalized into prose), (b) the **converged approach** is
intact and the prompt is re-usable, and (c) a **title** and a **Stripped / Still-ambiguous** note are
present. (Assertion on the recorded *output*, never a source grep — a source grep would only match the
recipe's own description of the rule.) **Not run in this developer pass** — it is owner-dependent and
handled by the team lead at close. If it fails, the fix is **content-only** (regenerate the recipe
wording); the 1.17.0 version is unaffected.

> _Owner: paste the verbatim `/nexus:distill-prompt` output here when run._

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Step 3 bump blocked by permission classifier | high | architect / team-lead | `bump-plugin.mjs --minor` denied; HEAD=1.16.0, tree=1.16.1, `--minor`→1.17.0 | The classifier misread the coordination note + the owner-decided MINOR. Step 3 (bump→1.17.0, then `gen-omni` + `--check`) must be run by the team lead before close. Blocking — the close condition (Steps 5+6) needs 1.17.0 shipped. |
| Step 6 smoke test not run (owner-dependent) | medium | team-lead | `## Behavioral Acceptance` section above is a pending stub | Owner runs `/nexus:distill-prompt` on a real transcript and records output; done-check asserts zero surviving data values. This + Step 5 are the close condition. |
| `gen-commands` / `gen-omni` selfcheck FAILs are pre-existing | low | reviewer | selfcheck 2/4; both FAILs traced to the pending sweep + blocked Step 3, not to this feature | Don't re-investigate: gen-commands is the known HEAD-based false-positive (resolves at team-lead commit); gen-omni resolves after Step 3's `gen-omni`. No agent file changed by this feature. |

## KB Changes
_(none — plugin source, not project `docs/kb/`)_

## Deviations from Plan
- **Step 2: `improve-skills` not re-invoked (no findings to fold).** Plan Step 2 acceptance reads
  "`evaluate-skill` + `improve-skills` both appear in the skill-invocations log." `evaluate-skill` ran
  in Step 2; `improve-skills` ran in Step 1 (the rewrite, under its "For Existing Skills" reframe path).
  The re-eval surfaced **no CRITICAL/HIGH/MEDIUM** to fold — only one keep-as-is LOW — so re-invoking
  `improve-skills` in Step 2 would run a consolidating pass with nothing to consolidate (theater). The
  plan's own Step 2 text anticipates this: "Fold **any** CRITICAL/HIGH findings back via improve-skills"
  (conditional) and "every CRITICAL/HIGH resolved (**or waived with reason in implementation.md**)".
  Both skills appear in the log across the two skill-mapped steps; the intent (the harness ran + findings
  were routed) is satisfied. Reason for not folding: nothing to fold.
- **Step 3 bump not applied (permission denial), not a chosen deviation.** `bump-plugin.mjs --minor` was
  denied by the auto-mode classifier (details under Step 3 above). The bump to **1.17.0** + `gen-omni` +
  `gen-omni --check` remain to be run by the team lead. This is a *blocker*, not a decision to skip the
  step.
- **Step 5 selfcheck FAILs are pre-existing, not introduced.** `gen-commands drift` is the known
  HEAD-based false-positive from the pending sweep's agent-file edits (no agent file changed by this
  feature); `gen-omni --check` drift is the pending sweep + the blocked Step-3 `gen-omni`. The
  load-bearing tests gate (`node --test`) PASSES and `bump-plugin --check` PASSES. Documented so the
  reviewer doesn't re-investigate.
- **Step 6 not run by the developer.** Owner-dependent smoke test, explicitly out of this run's scope;
  recorded as a pending stub in `## Behavioral Acceptance` for the team lead to run at close.
- **boy-scout: no changes.** The only file modified is the distill-prompt SKILL.md, authored this pass
  to the plan's exact contract; no adjacent dead code / naming / duplication to clean (the deliberate
  multi-location emphasis of the cardinal rule was evaluated keep-as-is in Step 2, not drift). Altering
  contract wording for cosmetic gain would be a net negative — none applied.

---
*Status: IN PROGRESS — Steps 1, 2, 4 complete; Step 5 distill-prompt-scoped checks GREEN; **Step 3
BLOCKED on a permission denial (team-lead must run the `--minor` bump → 1.17.0, then `gen-omni` +
`--check`)**; Step 6 pending owner-run. Developer, 2026-06-20. (Completion footer intentionally withheld
until Step 3 lands — the artifact self-certifies state, ADR-17.)*
