# Learner Cadence Nudge

**Feature Spec:** `docs/specs/adhoc-LearnerCadenceNudge/definition/tech-spec.md` (technical branch;
no product spec.md — the tech-spec + proposal P6 are the binding definition)

## Context

The learner is memory-triggered; lessons accumulate silently between runs (10+ slugs since
2026-06-30). Ship a deterministic, silent-when-clean PostToolUse nudge riding the `summary.md`
close write, plus the learner-side stamp it counts against. Impacted surface: the nexus plugin's
hooks + the learner agent doc.

## Scope

In scope: one hook script + unit test, `hooks.json` wiring, the learner stamp obligation, plugin
release. Out of scope: the A4 nudge registry, learner-process changes, other touchpoints.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | yes | hook script + pure counting fn; paths below | hook-authoring skill gap — log to lessons.md |
| 2 | (none) | — | no | one hooks.json entry | |
| 3 | (none) | — | no | learner.md stamp paragraph + command regen | |
| 4 | release-plugin | Follow | no | recommend `--minor` (new capability) | |

**Disposition rules:** see plan-template. `Skill: None` never waives the TDD column.

## Domain Model Changes

None.

## Data Model Changes

None. New runtime artifact (not committed): `.claude/audit/learner-last-run` (ISO timestamp,
overwritten per learner run).

## Implementation Steps

### Step 1 — Hook script + unit test

Create `plugins/nexus/hooks/scripts/learner-cadence.js`.

- Structure it so the decision logic is a **pure exported function** (inputs: list of summary-file
  mtimes, stamp mtime or `null`, now; output: the nudge line or `''`) and the main body only does
  I/O: parse the PostToolUse JSON from stdin, scope-filter the written path
  (`docs/specs/**/delivery/summary.md`, any spec-folder nesting), glob the summary files, read the
  stamp `.claude/audit/learner-last-run`, print the pure function's result.
- Threshold: constant `5`. Nudge line (exact shape):
  `Learner cadence: {N} slugs closed since the last learner consolidation ({date-from-stamp-mtime}|never) — consider 'be learner'.`
  **Delivery (critic H2): `process.stdout.write(JSON.stringify({ systemMessage: line }))`** —
  mirror `read-tracker.js:79`, never a raw line. Below threshold or non-matching path: **no output
  at all** (not an empty envelope).
- **Error handling is two-tier (critic M3):** the stamp read is a NARROW try mapping
  ENOENT/parse-fail → `null` (which feeds the `never` path — a missing stamp is data, not
  failure); only genuinely unexpected errors hit the outer swallow (empty output, exit 0 — the
  nudge must never break a close).
- **Import-safety (critic M4):** the I/O main is guarded (CommonJS `require.main === module` or
  the ESM equivalent per the sibling scripts' module style) so the test's import of the pure fn
  triggers no stdin handler and no `process.exit` — register-persona.js runs both at top level;
  mirror its stdin/field shape (`tool_input.file_path`, verified) but NOT its unguarded top level.
- Unit test `tests/unit/learner-cadence.test.mjs` against the pure function: ≥5 newer → line; <5 →
  `''`; null stamp → `never` variant; and the exact-threshold boundary (5 → fires; 4 → silent).
  Follow the existing test conventions in `tests/unit/cover-gates.test.mjs` (same runner, same
  glob — no CI wiring needed).

Acceptance: AC-1 (unit test green via `node --test tests/unit/*.test.mjs`); AC-4 dry-fire — from a
scratch fixture dir with 5 fabricated `docs/specs/s{1..5}/delivery/summary.md` files and no stamp,
`echo '{"tool_input":{"file_path":"docs/specs/s5/delivery/summary.md"}}' | node .../learner-cadence.js`
emits stdout that **parses as JSON with a `systemMessage`** containing `consider 'be learner'` and
`never`; after writing a fresh stamp, stdout is **empty**.
Satisfies: AC-1, AC-4

### Step 2 — Wire the hook

Modify `plugins/nexus/hooks/hooks.json`: **append the command object
`{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/learner-cadence.js\"", "timeout": 10, "async": true }`
to the EXISTING `(PostToolUse, Write|Edit)` group's `hooks` array** — alongside
`register-persona.js`, exactly as the `SessionStart` group already runs two commands. **Never add
a second `Write|Edit` group: `tests/lint/wiring.test.mjs` fails on a duplicate `(event, matcher)`
(critic H1).** Both hooks self-filter by path, so co-location is safe. Depends on Step 1.

Acceptance: AC-2 — `grep -n "learner-cadence" plugins/nexus/hooks/hooks.json` hits inside the
existing `Write|Edit` group with `"async": true`, AND `node --test tests/lint/wiring.test.mjs`
stays green.
Satisfies: AC-2

### Step 3 — Learner stamp obligation

Modify `plugins/nexus/agents/learner.md`: add a **new final workflow step 8, after step 7 (Critic
review before close)** — no "end-of-run bookkeeping" section exists (critic M1). Content: once
promotions were **actually applied** (a completed consolidation — a STOP-after-classification or
approval-withheld run never stamps, critic M2), `mkdir -p .claude/audit` and write the current ISO
timestamp to `.claude/audit/learner-last-run` (overwrite; the content is informational — the nudge
uses the file's mtime, critic L1). Then regenerate the command:
`node scripts/gen-commands.mjs nexus` (same commit).

Acceptance: AC-3 grep — `.claude/audit/learner-last-run` present in both
`plugins/nexus/agents/learner.md` and the regenerated `plugins/nexus/commands/learner.md`; the new
step is numbered 8 and follows step 7.
Satisfies: AC-3

### Step 4 — Release (sequenced)

Follow release-plugin. **Sequencing gate (critic H3): run the bump ONLY when
`plugins/nexus/.claude-plugin/plugin.json` equals committed HEAD** — the tree currently holds
adhoc-MineFamilyCore's uncommitted 1.26.1 bump, and CLAUDE.md's double-bump rule forbids bumping
over an uncommitted sibling bump (team-lead/operator-owned ordering). Then one bump run; recommend
`--minor` (new capability — owner escalation per policy; the tool proposes PATCH). CHANGELOG
entry: one line, "learner cadence nudge (PostToolUse hook, systemMessage envelope) + learner run
stamp". Commit the bump with the change.

Acceptance: `plugin.json` version bumped once, from a clean (== HEAD) baseline; CHANGELOG updated;
CI `plugin-release-check` green.

## Cross-Service Changes

None.

## Migration Notes

Pre-existing repos without a stamp intentionally fire the `never` variant once ≥5 summaries exist
(tech-spec Decision 4) — no backfill. **Expected first fire in THIS repo (critic L2): the message
will read `Learner cadence: 44 slugs closed since the last learner consolidation (never) — …`** —
44 summary.md files exist today and the 2026-06-30 consolidation predates the stamp mechanism.
That is by-design, not a bug; the count and date normalize after the first stamped learner run.

## Testing Strategy

Unit: the pure counting/threshold function (all four AC-1 cases). Manual: the AC-4 dry-fire pair
(no-stamp fires / fresh-stamp silent). No live-pipeline test owed — the hook is advisory and
swallow-all by design.

## KB Impact

None (dev-repo + plugin infrastructure; no `docs/kb/` entries exist for hooks).

## Decisions

Inherited from the tech-spec's decision table (hook locus; threshold 5 constant; stamp in
`.claude/audit/`; missing-stamp = `never` variant) — recorded there, not re-decided here.
Plan-level: `None — no additional self-resolved calls met the disclosure bar`.

## Open Questions

None.

## Plan Review

Code-grounded critic (Mode 2): **GO-with-fixes, 3 HIGH** — findings persisted to
`delivery/review-critic.md`, all folded: H1 → append to the existing `Write|Edit` hooks array
(never a second group — `wiring.test.mjs` duplicate-matcher lint); H2 → delivery pinned to the
`systemMessage` JSON envelope (raw stdout had zero in-repo delivery precedent — the nudge would
have shipped green and fired into the void; AC-4's false-green substring grep replaced with a
parse-and-assert); H3 → release sequenced behind the sibling slug's uncommitted bump (CLAUDE.md
double-bump rule); M1 → stamp anchored as new learner workflow step 8; M2 → stamp only on
completed consolidations (STOP/classification-only runs never stamp); M3 → two-tier error handling
(missing stamp is data → `never` path, not a swallowed failure); M4 → guarded I/O main so the test
import triggers no `process.exit`; L1 → mtime drives count and display, ISO content informational;
L2 → expected first-fire (44/never) documented in Migration Notes. Critic verified TRUE: the
`tool_input.file_path` stdin field, the CI test-glob auto-pickup, all three signature greps
virgin, and no learner.md collision with adhoc-DecisionLog (different regions, both additive).
Systemic note adopted as a lesson: integration surfaces (delivery envelope, wiring lint, release
coordination) need their own verification pass — "an entry exists in hooks.json" is not "adding a
sibling is safe".
