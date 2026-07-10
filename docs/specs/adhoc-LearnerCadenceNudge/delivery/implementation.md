# Learner Cadence Nudge — Implementation

## Files Created
- `plugins/nexus/hooks/scripts/learner-cadence.js` — PostToolUse(Write|Edit) advisory nudge. Pure
  `computeNudge(summaryMtimes, stampMtime|null, now)` returns the nudge line or `''`; the guarded
  I/O main scope-filters the written path to `docs/specs/**/delivery/summary.md`, walks docs/specs
  for summary mtimes, reads the `.claude/audit/learner-last-run` stamp mtime (narrow try → `null`
  on ENOENT/parse-fail), and wraps a non-empty line in `{ systemMessage: line }`. Silent below
  threshold and on non-summary writes.
- `tests/unit/learner-cadence.test.mjs` — AC-1 unit tests over the pure fn: ≥5 newer → line; <5 →
  `''`; null stamp → `never` variant counting all; exact-threshold boundary (5 fires / 4 silent).

## Files Modified
- `plugins/nexus/hooks/hooks.json` — appended the `learner-cadence.js` command object
  (`timeout: 10, async: true`) to the **existing** `(PostToolUse, Write|Edit)` group's `hooks`
  array, alongside `register-persona.js` (Step 2). No second `Write|Edit` group — `wiring.test.mjs`
  duplicate-matcher lint stays green.
- `plugins/nexus/agents/learner.md` — added a new final workflow **step 8** ("Stamp the run
  (cadence counter)") after step 7 (Critic review before close). Writes the ISO timestamp to
  `.claude/audit/learner-last-run` (mkdir -p first, overwrite) **only when promotions were actually
  applied** — a STOP-after-classification or approval-withheld run never stamps (critic M1/M2). The
  file's mtime (not its content) drives the nudge count/date (critic L1) (Step 3).
- `plugins/nexus/commands/learner.md` — regenerated via `node scripts/gen-commands.mjs nexus` to
  carry the new step 8 (generated artifact; `git diff --name-only HEAD` confirmed this was the ONLY
  command touched — team-lead.md et al. stayed in sync with HEAD) (Step 3).

## Key Decisions
- **Displayed date format** = ISO `YYYY-MM-DD` from the stamp mtime (`new Date(mtime).toISOString().slice(0,10)`, UTC) — repo-wide convention (Phase-1 self-resolved).
- **Summary-file discovery** = manual recursive walk of `docs/specs/` (mirrors `tests/lint/wiring.test.mjs` `walk()`); collects any `delivery/summary.md` at any depth. Zero deps — no `package.json`/glob dependency added (Phase-1 self-resolved).
- **Scope-filter regex** `(^|\/)docs\/specs\/[^/]+(\/[^/]+)?\/delivery\/summary\.md$` admits both `docs/specs/*/delivery/summary.md` and nested `docs/specs/*/*/delivery/summary.md`; the `(^|\/)` prefix accepts both relative (AC-4 input) and absolute written paths (Phase-1 self-resolved).
- **Pure-fn signature** `computeNudge(summaryMtimes, stampMtime|null, now)` returning the plain line or `''`; the I/O main wraps a non-empty line in the `systemMessage` envelope — keeps AC-1's four cases pure/filesystem-free (Phase-1 self-resolved). `now` is part of the mandated signature (plan Step 1 + handoff); the current line derives its date from the stamp mtime, so `now` is injected-but-reserved (documented in JSDoc; `void now`) for A4's future "days since" registry generalization rather than fabricating logic the plan does not specify.
- **Module style** = CommonJS `.js` (`module.exports = { computeNudge, THRESHOLD }`) mirroring sibling `register-persona.js`/`read-tracker.js`; the `.mjs` test imports the named exports via Node's CJS→ESM interop (verified green). Import-safety via `require.main === module` guard — when the ESM test is the entry point `require.main` is `undefined`, so the I/O main never runs on import (critic M4).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | tdd | Plan Skill Mapping: `(none)` pattern skill, `TDD: yes`. Red (stub → 3 fire/never assertions fail for the right reason) → Green (all 4 pass) → AC-4 dry-fire pass. |
| 2 | None | Plan Skill Mapping: `(none)`, `TDD: no` — wiring-only (one hooks.json entry). |
| 3 | None | Plan Skill Mapping: `(none)`, `TDD: no` — learner.md prose + command regen. |
| 4 | release-plugin | Follow — CLASSIFY (dry-run) done; APPLY + commit deferred to team lead (see Deviations). |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Reserved `now` param in `computeNudge` | low | reviewer | `learner-cadence.js` `void now` + JSDoc | Third param is part of the plan's mandated signature but the current line's date comes from the stamp mtime, so `now` is injected-but-unused (reserved for A4's future "days since" generalization). Documented, not dead-by-accident. |
| Step 4 bump/commit not applied | medium | architect (Step 1) / team lead | `bump-plugin.mjs --dry-run` bundles sibling skills | The release bump+commit is intentionally deferred to the team lead — see Deviations. Steps 1–3 are complete and fully verified; only the version-bump artifact (plugin.json/CHANGELOG) and its commit are pending. |

## Deviations from Plan
- **Step 4 (release bump) — CLASSIFY done, APPLY + commit deferred to the team lead.** The plan's
  Step-4 sequencing gate ("bump only when `plugin.json` == committed HEAD") **literally passes**
  (both are `1.26.1` — MineFamilyCore's bump has since been committed). **But** the working tree now
  holds two *unrelated* sibling slugs' uncommitted nexus changes — `skills/diagnose/SKILL.md` and
  `skills/review-format/SKILL.md` (adhoc-DecisionLog / adhoc-ConclusionGateSemantics). `bump-plugin.mjs`
  classifies the **whole working tree**, so `--dry-run` attributes those two skills to this feature's
  bump (verified: the dry-run lists `skill change (diagnose)` + `skill change (review-format)` under
  the nexus bump). Applying the bump now would (a) muddle this feature's CHANGELOG identity with two
  other slugs' work — the exact H3 hazard the plan's gate names, now manifesting via concurrent sibling
  *changes* rather than a sibling *bump* — and (b) leave an uncommitted bump in a tree shared with two
  in-flight slugs, tripping their double-bump trap. I **cannot** isolate the tree myself (git writes —
  `stash`/`checkout` — are forbidden by hard rule, ADR-18), and **committing + release ordering are
  explicitly team-lead/operator-owned** (plan Step 4 verbatim). So the atomic bump+commit is the team
  lead's to run. **OPERATOR ACTION REQUIRED (team lead):** once the sibling plugin changes are committed
  or staged-isolated, run `node scripts/bump-plugin.mjs --minor` (owner-escalated tier — new capability:
  a deterministic cadence-nudge hook + learner stamp obligation), set the CHANGELOG entry to exactly
  *"learner cadence nudge (PostToolUse hook, systemMessage envelope) + learner run stamp"*, then
  `node scripts/gen-omni.mjs` (+ `--check`) and `claude plugin validate plugins/nexus --strict`, and
  commit the bump together with this feature's files (learner-cadence.js, its test, hooks.json,
  learner.md, commands/learner.md). Helper: `scripts/bump-plugin.mjs` (dry-run output captured above).

*Status: COMPLETE (Steps 1–3 implemented + verified; Step 4 classified, apply/commit handed to team lead) — developer, 2026-07-10*
