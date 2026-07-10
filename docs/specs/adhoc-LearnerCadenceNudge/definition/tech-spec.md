# Tech-Spec — Learner Cadence Nudge

**Status:** Ready
**Branch:** technical (ADR-27 — architect-owned definition; no product "what")
**Provenance:** `docs/proposals/mine-family-next-wave-2026-07.md` P6 (Ratified 2026-07-10, owner) —
the trigger-only adoption from VWH's auto-learn loop. Parity analysis and the explicit
non-adoption list live in the proposal; this spec covers only what ships.
**Plan:** `docs/specs/adhoc-LearnerCadenceNudge/delivery/plan.md`

## Problem

The learner process works (owner-confirmed) but is memory-triggered: it runs when the owner
remembers. Evidence: the last consolidation was `adhoc-LearnerConsolidation` (2026-06-30); in the
10 days since, 10+ slugs closed, each appending lessons that nobody consolidated. VWH paid for this
exact failure shape once (a convention-triggered skeptic fired 0/7 times) and fixed the **trigger**,
not the process. This spec ships the trigger: a deterministic, silent-when-clean nudge that rides an
existing mandatory touchpoint — the pipeline-close `summary.md` write.

## Design

**Mechanism — a deterministic PostToolUse hook, not prose.** A prose line in the team-lead close
protocol would recreate the disease it cures (a rule someone must remember). The nudge is a hook
script (`plugins/nexus/hooks/scripts/learner-cadence.js`) wired in the plugin's `hooks.json` on
`PostToolUse` / `Write|Edit`, async, following the `register-persona.js` wiring shape. This is the
A4 primary-locus pattern (`docs/proposals/vwh-adoptions-2026-06.md` — Stop/PostToolUse-time
deterministic checks, "the system fires it; the agent only responds"); when A4's nudge registry
ships, this script folds in as its first row.

**Behavior contract:**

1. **Scope filter:** the hook exits silently unless the written file path matches
   `docs/specs/*/delivery/summary.md` (any nesting: also `docs/specs/*/*/delivery/summary.md`).
   `summary.md` is written once per pipeline close (team lead) — the natural cadence point.
2. **Count:** number of `docs/specs/**/delivery/summary.md` files with mtime newer than the stamp
   file `.claude/audit/learner-last-run` (the count includes the summary just written).
3. **Threshold:** count ≥ 5 → emit exactly one nudge line, **delivered via the repo's proven hook
   envelope: `process.stdout.write(JSON.stringify({ systemMessage: line }))`** (the read-tracker.js
   / boundary-detector.js delivery shape — a raw stdout line has no in-repo precedent for reaching
   the session and would fire into the void; critic H2). The line:
   `Learner cadence: {N} slugs closed since the last learner consolidation ({date|never}) — consider 'be learner'.`
   Below threshold → **no output at all** (silent-when-clean, the no-cry-wolf invariant).
4. **Missing stamp** (repo where the learner has never run, or pre-existing repos): treated as
   "never consolidated" — count ALL summary files; the emitted line says `never` for the date. This
   is correct, not noisy: a repo with ≥5 closed slugs and no learner run is exactly the state the
   nudge exists for, and the line fires at most once per pipeline close. **A missing stamp is a
   normal `null` input read in a narrow try (ENOENT/parse-fail → null), never a swallowed failure**
   (critic M3 — a whole-body swallow would make the flagship never-consolidated case inert).
5. **The stamp:** the learner agent writes the ISO timestamp to `.claude/audit/learner-last-run`
   (`mkdir -p` the dir first; overwrite) — as a **new final workflow step 8, after step 7 (Critic
   review before close)**, and **ONLY when promotions were actually applied**: a
   STOP-after-classification or approval-withheld run never stamps (critic M1/M2 — an aborted run
   must not silently reset the cadence counter). The stamp's **mtime** drives both the count and
   the displayed date; the ISO content is informational-only (critic L1).
6. **Never blocks, never gates.** Advisory output only; no exit-code signaling; unexpected failures
   inside the script are swallowed (a broken nudge must never break a pipeline close) — but see #4:
   the missing-stamp path is data, not failure. Async, timeout 10s. The script's I/O main is
   guarded so importing the exported pure function in tests triggers no stdin handler or
   `process.exit` (critic M4).

## Decisions (extracted; ADR-25 — two-way door, no standalone ADR)

| Decision | Why | Rejected |
|---|---|---|
| Hook locus, not close-protocol prose | prose obligations decay; the whole point is removing a memory dependency | team-lead doc line (fallback only if the hook proves unreliable) |
| Threshold fixed at 5, constant in script | one less knob; matches proposal default; trivially editable later | `user_config` plumbing (over-engineering for a one-line advisory) |
| Stamp file in `.claude/audit/` | established audit-artifact home (`skill-invocations.log` etc.), exists in consuming repos | git-log heuristics (fragile in consuming repos with different commit conventions) |
| Missing stamp ⇒ count all + `never` wording | a never-consolidated repo with a real backlog is not "clean" | suppressing until first learner run (hides the exact state that matters) |
| `systemMessage` envelope, not a raw line (critic H2) | the only delivery shape with in-repo precedent for reaching the session; the audience is the acting session's context (the team lead at close), not a terminal watcher | raw stdout (no precedent; likely inert). Residual: envelope delivery to a *background-subagent* team lead is unverified (read-tracker's own note) — accepted for the pilot |
| Sequenced release: bump only when `plugin.json` == committed HEAD (critic H3) | the tree currently holds a sibling slug's uncommitted bump; CLAUDE.md's double-bump rule | co-releasing both slugs under one bump (muddles two features' CHANGELOG identity) |
| Stamp mtime drives count AND display; ISO content informational (critic L1) | one source of truth, no dual-input plumbing in the pure fn | reading the ISO content for display (adds an input for a cosmetic difference) |

## Acceptance criteria

- **AC-1** (unit, mechanism): the counting function, given a summary-file list + stamp mtime,
  returns the over-threshold line for ≥5 newer files, empty string for <5, and the `never` variant
  for a null stamp — asserted in `tests/unit/learner-cadence.test.mjs` (repo CI glob picks
  `tests/unit/*.test.mjs` up with no wiring).
- **AC-2** (wiring, lint-aware): the `learner-cadence.js` command object is **appended to the
  EXISTING `(PostToolUse, Write|Edit)` group's `hooks` array** (critic H1 — a second `Write|Edit`
  group fails `tests/lint/wiring.test.mjs`'s duplicate-matcher assertion); grep `learner-cadence`
  hits `hooks.json` with `"async": true`, AND `wiring.test.mjs` stays green.
- **AC-3** (grep, stamp obligation): `plugins/nexus/agents/learner.md` contains the literal path
  `.claude/audit/learner-last-run`; `commands/learner.md` regenerated in the same commit.
- **AC-4** (dry-fire, delivery-shape asserted — critic H2's false-green fixed): piping a fabricated
  PostToolUse JSON (a `summary.md` write path) into the script in a fixture dir with ≥5 summaries
  and no stamp emits stdout that **parses as JSON with a `systemMessage` field** containing
  `consider 'be learner'` and the `never` variant; with a fresh stamp, stdout is **empty** (not an
  empty envelope).

## Out of scope

- The A4 nudge registry itself (this ships one nudge; the registry generalizes later and absorbs it).
- Any change to the learner's consolidation logic, thresholds, or promotion rules (parity — see
  proposal P6's non-adoption list).
- Nudges for other touchpoints (review.md, implementation.md) — A4's backlog.

## Definition review

Self cross-check (standalone, two-way door, no shared/external artifacts beyond the plugin's own
files — the code-grounded-critic mandate does not trip; the hook wiring shape was verified against
the live `hooks.json` and the test-glob claim against the repo CI convention). `mine-from-spec`:
default-skip — one boundary rule (≥5) does not clear the rule-shaped-behavior bar.
