# Review — Unattended Autonomy (v1)

**Plan:** `docs/specs/adhoc-UnattendedAutonomy/delivery/plan.md` (APPROVED — critic Mode-2 ACCEPT + Q-D1 amendment)
**Implementation:** `docs/specs/adhoc-UnattendedAutonomy/delivery/implementation.md`

## Step 1 — Done-Check

**Verdict: PASS.** All 9 plan steps landed against the code on disk; no step `Missing`. Verified
file-by-file (not from the implementation report) and **re-ran the suite myself: 214/214 green** under
the canonical `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`. The two known non-blocking
notes (the 1.13.0 version shift, the uncommitted gen-commands drift) are confirmed benign — see below.

| Step | Plan deliverable | Disposition | Evidence (on disk) |
|------|------------------|-------------|--------------------|
| 1 | Red `node:test` units: verdict-written / non-impl-ignored / **unknown-agent→`agent:"unknown"`** / malformed no-op / **raw `doesNotMatch("decision":"block")`** / config-resolution / queue shape | **Landed** | `tests/unit/verify-gate.test.mjs` (179 lines): pass/fail verdict, blocking-vs-non-blocking, round-token keying (`token: developer:implement`), non-impl skip, unknown-agent written record, fail-silent. The block-half uses the raw `doesNotMatch` (LOW-1) and the unknown-agent red is present (HIGH-2). |
| 2 | `verify-gate.js` `SubagentStop` hook + matcher-less `hooks.json`; **mandatory blocking live-verify of `nexus:developer` agent_type**; unknown-agent fallback writes, never skips | **Landed** | `verify-gate.js`: three-way branch (impl→verify+verdict; non-impl→skip; absent/unrecognized→`agent:"unknown"` **written**); `execSync` synchronous; never emits deny/block. `hooks.json:56-62` registers it matcher-less, `timeout:180`. **Live-verify PINNED:** implementation.md §LIVE-VERIFY records the real probe → `agent_type = nexus:developer` (normalizes to `developer` ∈ IMPL_ROLES), CLI 2.1.179, zero repo footprint. |
| 3 | `.claude/verify.json` schema (`commands[]` w/ `run`+`blocking`) + detection fallback; this repo's dogfood set | **Landed** | `.claude/verify.json` = the `node --test` glob + `selfcheck.mjs`, both `blocking:true` (matches AC-1.4). Resolver inline in `verify-gate.js:53-76`: explicit config wins; detection fallback synthesizes the same set from project structure; never throws. |
| 4 | `team-lead.md`: verdict-consumption fork (attended informs / unattended decides); **primary edit = Unattended Mode § defer-to-queue**; token-cap + **loud-inert warning**; `Force-accept` attended-only; **Q-D1 implementation-phase-checkpoint scoping** | **Landed** | `team-lead.md:185-188` consumption fork with the **Q-D1 scoping verbatim** ("act on a `blocking_failed` verdict... only at your own implementation-phase verify checkpoint... never on an intermediate `developer:implement` SubagentStop"); `:408-414` fail-closed→queue evolving `:319`/`:330`; `:411` token cap + loud-inert warning (MED-2); `:412` `Force-accept` unreachable. |
| 5 | `.claude/review-queue/` per-item artifact + `index.md`; resume wired to ADR-19 state | **Landed** | `team-lead.md:385-394` Review Queue § — per-item `{slug}.md` (slug + failing-gate reason + audit pointer + resume instruction), `index.md`, team-lead-owned/runtime-created, **never written by the hook** (AC-3.2); resume via `communication-log.md` Step/Cycle + `.pipeline-state`. |
| 6 | AC-0.3 golden ((a) no deny/no queue; **(b) doc pin + (b') sibling-hooks-still-fire**; (c) advisory exits 0) + **`SubagentStop` CONTRACT entry** | **Landed** | `tests/unit/attended-unchanged.golden.test.mjs` (111 lines): (a) advisory exits 0 / no deny / no review-queue write; (b') `hooks.json` parses + siblings register + fire identically + matcher-less SubagentStop; (c) pass AND fail both exit 0, no block. `platform-contract.test.mjs:45-54` CONTRACT entry: event registration + `agent_type` read + matcher-less wiring (HIGH-1). |
| 7 | Document verify gate + verify.json + review-queue in `agents-workflow.md`; name ADR-30 additive-mode principle | **Landed** | `agents-workflow.md` "Unattended Autonomy (additive mode)" section (implementation.md Files-Modified; documents the substrate + the one consumption fork). |
| 8 | ADR cross-check — ADR-30/31/32 match shipped behavior; no silent rewrite | **Landed** | ADR-30/31/32 intact in `README.md:770/786/802` (bodies unchanged; ADR-33 is the parallel NexusFleetView feature, not a rewrite). Shipped paths (`verify-verdict.json`, `.claude/review-queue/`, never-block) match the ADR text. |
| 9 | MINOR bump + regenerate `nexus` commands + `omni` twin | **Landed** | `plugin.json` = **1.13.0** (MINOR tier preserved — the 1.12.0→1.13.0 shift is the intervening NexusFleetView release, expected note 1); `CHANGELOG.md:4` real feature entry; `commands/team-lead.md` regenerated; `omni` twin rode to 1.13.0 with the `SubagentStop`/`verify-gate.js` entry (implementation.md asserts the round-trip + `gen-omni --check` clean). |

### Verification notes
- **Suite re-run by the done-check (not trusted from the report): 214/214 green.** The new
  `verify-gate.test.mjs` + `attended-unchanged.golden.test.mjs` + the `platform-contract` CONTRACT entry
  all pass; no regression in the pre-existing 177.
- **Q-D1 amendment present and correct.** The implementation-phase-checkpoint scoping (the precision fix
  adjudicated post-approval) is in `team-lead.md:188` exactly as adjudicated — the discriminator is the
  *checkpoint*, not the `.pipeline-state` token (red-authoring shares `developer:implement`). This was
  the one place a wrong implementation would have produced a false-defer; it landed correctly.
- **Sanctioned scope-widening (not a deviation that fails):** the developer added `solo` to `IMPL_ROLES`
  alongside `developer` — both write application source, so both are the verify boundary. Consistent
  with the plan's "the implementation subagent (developer/solo)" intent; tested. Approved.
- **Known non-blocking note 1 — version 1.13.0 not 1.12.0:** the MINOR *tier* and *intent* (new
  capability) the owner set are preserved; the number shifted only because NexusFleetView shipped 1.12.0
  in parallel. No owner decision needed (confirmed by the team-lead). Not a fail.
- **Known non-blocking note 2 — gen-commands "drift" in `selfcheck`:** uncommitted-only — the regen is
  idempotent and in sync; the flag is `git diff --exit-code` over the uncommitted `commands/`. Resolves
  when the team-lead commits (ADR-18: pipeline agents never commit). Not a fail.

### Owner-owed validation (carried forward, not a done-check gate)
The plan's final acceptance — one real `claude -p [UNATTENDED]` run that (a) passes verify → advances
and (b) fails verify → **defers to `.claude/review-queue/`** with a resumable item, then resumes at the
failing phase (ADR-19, not a cold restart) — is an **operator step on the updated install** (needs
`/plugin update` to 1.13.0). The in-session probe validated the platform boundary (the gate's
load-bearing unknown); the end-to-end fail-defer-resume loop is owner-owed. Flagged, not blocking.

**Done-check verdict: PASS → proceed to Step 2 (code review).** Team mode is Standard+Codex, so Step 2
is the nexus reviewer ∥ Codex (round 1).

## Step 2 — Code Review

## Reviewed By
nexus:reviewer (2026-06-16)

## Verdict: APPROVED

## Pre-commitment Predictions
Expected the main risks to be: (1) the `agent_type` normalization silently false-greening on an
unrecognized role, (2) an accidental block path left open, (3) the golden test's advisory-vs-queue
boundary being soft. All three are addressed; the implementation is tighter than expected on (1).

## Findings

No CRITICAL or HIGH findings.

### [LOW] Unknown-branch verdict field accepted loosely in one test
**File:** `tests/unit/verify-gate.test.mjs:124`
**Issue:** The unknown-agent branch in `verify-gate.js:118` writes `verdict: 'skipped'` consistently.
The corresponding test accepts either `'skipped'` OR `'unknown'` via an `||`:
`assert.ok(v.verdict === 'skipped' || v.verdict === 'unknown', …)`. The gate itself is single-valued;
the test's loose acceptance means it would pass on either literal and can't catch a future rename.
**Fix:** Tighten to `assert.equal(v.verdict, 'skipped')` to pin the actual contract.
**Confidence:** MEDIUM

### [LOW] Inner `execSync` timeout is undocumented relative to the hook-level timeout
**File:** `plugins/nexus/hooks/scripts/verify-gate.js:81`
**Issue:** `runCommand` passes `timeout: 120000` (ms) to `execSync`; `hooks.json` grants the hook
`timeout: 180` (seconds). The layering is correct (inner fires first), but the relationship is
implicit. A maintainer extending the verify set to a slow command (> 2 min) could be surprised.
**Fix:** One inline comment on the `execSync` call: `// 120 s inner cap; hooks.json outer is 180 s`.
**Confidence:** MEDIUM

## Positive Observations

- **Three-way branch is the right shape for the false-green guard.** The asymmetry between
  `NONIMPL_ROLES` (explicit skip, no write) and the unknown branch (explicit write of `agent:"unknown"`)
  is precisely correct — a recognized non-impl stop is distinguishable from the impl stop by the team
  lead reading the file, but an unclassifiable stop would be invisible without the written record. The
  plan's risk item for absent/unrecognized roles is fully resolved.
- **Never-block guarantee is belt-and-suspenders.** The header comment explains the ADR-31 rationale
  (spike's 14-fire retry loop), the code never emits `decision`, and both the unit test (raw
  `doesNotMatch`) and the golden test (assertion a) independently pin it. Three layers.
- **`agent_type` normalization is consistent with the existing hook idiom.** The
  `.toLowerCase().split(/[:/]/).pop()` chain mirrors `boundary-detector.js:80` exactly, and the live-
  verify confirmed `nexus:developer` → `developer` ∈ IMPL_ROLES. The normalization is tested by the
  namespaced-type test and permanently tripwired by the CONTRACT entry.
- **The golden test's advisory-vs-queue boundary is sharply asserted.** Test (a) asserts the verdict
  IS written (`existsSync(audit/verify-verdict.json)`) AND the queue is NOT written
  (`!existsSync(.claude/review-queue)`), on a *failing* verify. This pins the exact AC-1.5 / AC-3.2
  boundary with no wiggle.
- **Q-D1 scoping in `team-lead.md:188` is worded with enough specificity to be actionable.** "Act on
  a `blocking_failed` verdict as a defer trigger only at your own implementation-phase verify checkpoint
  (developer handed back `implementation.md` complete) — never on an intermediate `developer:implement`
  `SubagentStop` mid-turn." The token-sharing problem (red-authoring shares `developer:implement`) is
  explicitly named with the reason, giving the team-lead context to not act prematurely.
- **Verdict file is append-only.** Mirroring the read-tracker/skill-tracker audit-append idiom is
  correct — the team lead can read the full round history, and the token field enables per-round
  scoping without a separate index.
- **Detection fallback is cross-platform.** The `PASS`/`FAIL` constants in the test use
  `process.execPath -e "process.exit(N)"` rather than shell builtins. Runs correctly on both Windows
  and POSIX. Correct for the environment.
- **`solo` ∈ IMPL_ROLES is the right call.** Both `developer` and `solo` write application source;
  both are the verify boundary. Excluding `solo` would create a blind spot on small scoped fixes.
  Architect-sanctioned; tested.

## Gaps

- **End-to-end fail-defer-resume path has no automated test.** The unit tests verify the hook writes
  the advisory verdict correctly; they cannot verify the team-lead consuming that verdict and writing a
  queue item. The plan explicitly calls this out as owner-owed live validation. Flagged, not a blocker.
- **`blocking` default (`!== false`) means a missing key is treated as blocking.** `resolveCommands`
  at line 60 defaults `blocking` to `true` when the field is absent from a `verify.json` entry. This
  is the right conservative default, but an absent `blocking` key is not tested. Low risk since the
  dogfood `verify.json` is explicit.

## Open Questions

None. Both LOWs are straightforward fixes; neither changes the gate's behavior.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full suite | **pass** | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 214/214, 0 fail, 0 skip (fresh run) |
| verify-gate unit | pass | subset of above | 13 new tests green, incl. namespaced-type, unknown-agent ×2, deny/block ×2, queue-invariant, malformed, detection-fallback, empty-fallback |
| golden test | pass | subset of above | (a) advisory-no-queue, (b) doc-pin, (b') sibling-hooks-fire, (c) pass+fail exit 0 all green |
| platform-contract entry | pass | subset of above | 3 new CONTRACT checks green (SubagentStop registration, agent_type field, matcher-less wiring) |
| Never-block guarantee | pass | code read | No `decision`, no `permissionDecision`, no deny literal anywhere in `verify-gate.js` stdout path |
| hooks.json parse | pass | golden test (b') | JSON.parse succeeds; all sibling events intact; SubagentStop entry is matcher-less |

*Status: COMPLETE — reviewer, 2026-06-16*
