# Learner Cadence Nudge — Review

## Step 1 — Done-Check

Pre-commitment predictions (before reading implementation): (1) Step 4 release deferral — likely a
plan-sanctioned operator-owed `Deviated`, must confirm the deferral condition holds on disk; (2)
skill-log conformance for `tdd` + `release-plugin` scoped to this run vs the concurrent sibling; (3)
integration-surface correctness (hooks.json append into the *existing* Write|Edit group, no
duplicate matcher) — the critic's own systemic note. All three checked below.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Hook script + unit test | Implemented | `plugins/nexus/hooks/scripts/learner-cadence.js` on disk: pure `computeNudge(summaryMtimes, stampMtime\|null, now)`, `THRESHOLD=5`, guarded I/O main (`require.main === module`), `systemMessage` JSON envelope, two-tier error handling (narrow stamp `try`→`null`, outer swallow), scope-filter regex admitting both nesting depths. `tests/unit/learner-cadence.test.mjs` covers all four AC-1 cases. **AC-1 verified green (4/4)**; **AC-4 dry-fire verified** (no-stamp → parseable JSON `systemMessage` with `never` + `consider 'be learner'`; fresh stamp → empty; non-summary path → silent). `Satisfies: AC-1, AC-4` — both exist in tech-spec, both verified behaviorally. |
| 2 — Wire the hook | Implemented | `learner-cadence.js` command object (`timeout:10, async:true`) appended to the **existing** `(PostToolUse, Write\|Edit)` group alongside `register-persona.js` — no duplicate group. **AC-2 verified**: `wiring.test.mjs` green (4/4), incl. "no two hook entries under the same event share a matcher". `Satisfies: AC-2` (exists, verified). |
| 3 — Learner stamp obligation | Implemented | `plugins/nexus/agents/learner.md` carries new final **step 8** ("Stamp the run (cadence counter)") after step 7, apply-only-on-promotion (STOP/withheld runs never stamp), mtime-driven, overwrite. `plugins/nexus/commands/learner.md` regenerated identically. **AC-3 grep verified** in both files. `Satisfies: AC-3` (exists, verified). |
| 4 — Release (sequenced) | Deviated (valid reason) | `release-plugin` invoked in CLASSIFY (dry-run) mode (skill-log confirmed, session 54db1d0c @ 13:27:30). APPLY (bump+commit) deferred to team lead — **plan-sanctioned**: Step 4 verbatim names release/commit ordering as team-lead/operator-owned. Deferral condition **confirmed on the live tree**: `plugin.json == committed HEAD` (both `1.26.1`) AND two concurrent sibling uncommitted changes present (`M skills/diagnose/SKILL.md`, `M skills/review-format/SKILL.md`) that the whole-tree `bump-plugin.mjs` would bundle into this feature's CHANGELOG — the exact H3 hazard the plan's gate guards. Developer cannot isolate the tree (git `stash`/`checkout` forbidden, ADR-18). **Open production gate (operator-owed, team lead):** run `node scripts/bump-plugin.mjs --minor`, CHANGELOG entry *"learner cadence nudge (PostToolUse hook, systemMessage envelope) + learner run stamp"*, then `gen-omni.mjs` + `--check` + `claude plugin validate --strict`, commit the bump atomically with this feature's 5 files. |

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, agent=developer + token=`developer:implement` + session=54db1d0c):** `tdd` @ 13:21:12 satisfies Step 1's `TDD: yes` mapping; `release-plugin` @ 13:27:30 satisfies Step 4's `Follow release-plugin`. Steps 2–3 map no skill (exempt). `## Skills Used` section present; every self-report corroborated by the log; no fabrications. Concurrent sibling's `release-plugin` (session 0b3a9544 @ 13:26:47) correctly excluded by session filter.

**Plan-hygiene (`## Decisions`):** present and non-silent (inherited tech-spec decisions + explicit plan-level `None …` sentence). No finding.

**Verdict: PASS** — Steps 1–3 Implemented and behaviorally verified (AC-1/AC-2/AC-3/AC-4 all green); Step 4 Deviated (valid reason) with the open production gate surfaced as team-lead-owned.

*Status: COMPLETE — architect, 2026-07-10*

## Step 2 — Code Review

## Reviewed By
reviewer

## Verdict: APPROVED

## Pre-commitment Predictions
- **Delivery envelope regression** — expected to re-check that `learner-cadence.js` actually emits
  the `{ systemMessage }` JSON envelope (critic H2) rather than a raw line, since a substring-grep AC
  would pass either way. Found: correct — `JSON.stringify({ systemMessage: line })`, verified by a
  fresh dry-fire that parses stdout as JSON.
- **Wiring duplicate-matcher regression** — expected to check the hook was appended to the existing
  `(PostToolUse, Write|Edit)` group, not a new group (critic H1). Found: correct — single diff hunk
  appends a second array element; `wiring.test.mjs` green (4/4).
- **`now` param dead-code smell** — expected to scrutinize the injected-but-unused third parameter
  of `computeNudge` as a possible leftover. Found: deliberate and documented (`void now` + JSDoc),
  matches the plan's mandated three-arg signature; downgraded from a concern to a confirmed
  non-issue (see Carry-Over Findings below).
- **Step 4 release deferral legitimacy** — expected to independently verify the sequencing-gate
  condition on the live tree rather than trust the developer's narrative. Found: verified —
  `plugin.json` diffs clean against HEAD (1.26.1, matches the MineFamilyCore commit `a4742bf`), and
  `bump-plugin.mjs --dry-run` genuinely bundles the two sibling `skill change (diagnose)` /
  `skill change (review-format)` lines into this feature's PATCH proposal, confirming the hazard the
  developer described.
- **Two-tier error handling for the stamp read** — expected to check the narrow-try/outer-swallow
  split doesn't leak an unhandled exception path. Found: correct — narrow try around `fs.statSync`
  for the stamp only, outer try wraps everything else, unconditional `process.exit(0)` after.

## Findings

No CRITICAL or HIGH findings.

## Carry-Over Findings (from implementation.md — confirmed/refuted)

| Title | Developer Severity | Disposition | Evidence |
|-------|--------------------|-------------|----------|
| Reserved `now` param in `computeNudge` | LOW | **Confirmed, not a defect** | `learner-cadence.js:41-42`: `void now;` with a JSDoc `@param` explaining it's part of the plan's mandated 3-arg signature (plan Step 1: "inputs: list of summary-file mtimes, stamp mtime or `null`, now"), reserved for A4's future "days since" generalization. The current line's date correctly derives from `stampMtime`, not `now`. This is deliberate, documented, plan-conformant reserved-parameter design — not dead code by accident. No action needed. |
| Step 4 bump/commit not applied | MEDIUM | **Confirmed, valid deferral** | Independently re-verified on the live tree (not just re-read from implementation.md): `git diff HEAD -- plugins/nexus/.claude-plugin/plugin.json` is empty (clean, `1.26.1`, matches committed `a4742bf`), and `git status --short` shows two unrelated sibling M lines (`skills/diagnose/SKILL.md`, `skills/review-format/SKILL.md`). Ran `node scripts/bump-plugin.mjs --dry-run` myself: it proposes PATCH `1.26.1 -> 1.26.2` and **does** list `skill change (diagnose)` and `skill change (review-format)` as reasons — confirming those sibling edits would be bundled into this feature's bump/CHANGELOG if applied now. The plan's Step 4 explicitly assigns commit/release ordering to the team lead/operator. This is a legitimate, evidence-backed deferral, not a shortcut. **Action:** team lead to run the bump once the tree is clear of unrelated sibling changes (see implementation.md Deviations for the exact command sequence).

## Positive Observations
- All four AC-1 unit-test cases plus the exact-threshold boundary (5 fires / 4 silent) are present
  and green — matches the plan's explicit boundary-test requirement.
- The pure/I-O split (`computeNudge` vs the guarded `require.main === module` main) is exactly the
  shape the plan mandated for testability, and correctly avoids mirroring `register-persona.js`'s
  unguarded top-level pattern per the plan's explicit warning.
- Delivery envelope, wiring append-not-duplicate, two-tier error handling, and the stamp
  apply-only-on-completed-consolidation rule (learner.md step 8) all trace cleanly to the critic's
  H1-H3/M1-M4/L1-L2 findings folded into the plan — every one independently re-verified in this
  review, not just re-read.
- Generated-artifact hygiene: re-running `node scripts/gen-commands.mjs nexus` reproduces
  `commands/learner.md` byte-for-byte as the only touched command file — no drift.
- Scope-filter regex correctly requires a path boundary before `docs/specs/...` (verified
  `xdocs/specs/.../summary.md` does NOT false-positive) and accepts both spec-folder nesting depths.
- `.claude/audit/` is gitignored, so the runtime stamp artifact is correctly never committed,
  matching the plan's Data Model Changes note.

## Gaps
- No automated test exercises the I/O main (stdin parsing, path scope-filter, stamp-file read,
  envelope wrapping) — by design, per the plan's Testing Strategy ("Manual: the AC-4 dry-fire pair
  ... No live-pipeline test owed"). I independently re-ran all three AC-4 scenarios fresh in this
  review (no-stamp fires with `never`, fresh-stamp silent, non-summary-path silent) rather than
  trusting the architect's dry-fire claim — all three reproduced exactly as documented.
- No test covers a corrupt/unreadable `docs/specs/` tree (e.g., a permission error mid-walk) beyond
  the per-entry try/catch in `walkSummaries` — acceptable given the advisory, swallow-all-by-design
  nature of the hook and the outer catch as a backstop; not a gap worth blocking on (LOW, not filed
  as a finding — confidence in this being a real risk is low given the outer swallow).

## Open Questions
None — no finding scored below the 80-confidence cutoff.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit tests (feature) | pass | `node --test tests/unit/learner-cadence.test.mjs` | 4/4 pass (fires ≥threshold, silent <threshold incl. mixed-age, null-stamp "never", exact boundary 5/4) |
| Wiring lint | pass | `node --test tests/lint/wiring.test.mjs` | 4/4 pass, incl. "no two hook entries under the same event share a matcher" |
| Full unit suite | pass | `node --test tests/unit/*.test.mjs` | 462/462 pass, 0 fail |
| AC-4 dry-fire — no stamp | pass | 5-fixture-file scratch dir, `CLAUDE_PROJECT_DIR=... node learner-cadence.js` via stdin | `{"systemMessage":"Learner cadence: 5 slugs closed since the last learner consolidation (never) — consider 'be learner'."}` |
| AC-4 dry-fire — fresh stamp | pass | same fixture, stamp file written, re-run | empty stdout |
| AC-4 dry-fire — non-summary path | pass | same fixture, `tool_input.file_path` = `plan.md` | empty stdout |
| Generated-artifact drift | pass | `node scripts/gen-commands.mjs nexus`, `git status --short plugins/nexus/commands/` | only `commands/learner.md` modified; matches committed content |
| Step 4 sequencing-gate re-verify | pass | `git diff HEAD -- plugins/nexus/.claude-plugin/plugin.json` (empty); `git status --short` (2 sibling `M skills/*`); `node scripts/bump-plugin.mjs --dry-run` | plugin.json clean at HEAD (1.26.1); dry-run PATCH 1.26.1→1.26.2 lists `skill change (diagnose)` + `skill change (review-format)` as reasons — confirms the bundling hazard |
| hooks.json / learner.md / commands/learner.md diffs | pass | `git diff HEAD -- plugins/nexus/hooks/hooks.json plugins/nexus/agents/learner.md plugins/nexus/commands/learner.md` | minimal, scoped, single-hunk-per-file additions; no scope creep |
| CHANGELOG state | pass | `git diff HEAD -- plugins/nexus/CHANGELOG.md` | empty — correctly untouched, Step 4 deferred |

*Status: COMPLETE — reviewer, 2026-07-10*
