# F29-OracleStrengthMiner — Implementation

Architect-led fast lane. Steps 1–5 of `delivery/plan.md`, executed in order. NO git writes
(commit happens at lane close in the main session).

## Files Created
- `plugins/nexus/skills/mine-oracle-strength/SKILL.md` — the twelfth mine. Self-contained
  description of stages 1–6 (blind mutant author → battery → optional reference-pair → survivor
  adjudication → gap-kill → report), explicit D3 stage-model pins on every stage (opus generators /
  fable judge / sonnet mechanical), the D1 per-stack fill table (Dart filled, other stacks
  TBD-at-first-use + promotion rule), the D2 pair stage with the mandatory skip line + three verdict
  forms, the fixed report section grammar (the F28-PROVE seam), family-core pointers (execution
  topology / skeptic protocol / marginal-budget rail / kickoff checklist), inherited
  instrument-integrity (D4), safety-rail four prohibitions, and a Relationship table (mine-verify-cover
  family head, regenerate-unit/F28 consumer). `user-invocable: true`.
- `plugins/nexus/skills/mine-oracle-strength/assets/mutation_battery.py` — the promoted +
  D4-hardened battery runner (see Files Modified rationale / Key Decisions for the port record).

## Files Modified

### Step 3 — Family sweep (12th-mine)
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — header
  `eleven-member`→`twelve-member`; invariant line `all eleven`→`all twelve`; **+1 table row**
  (`mine-oracle-strength` | one gated suite + its subject | the subject source (never the suite) |
  sanity-red-proven gap-kill + instrument-integrity honesty proof | suite-strength report +
  registry annotations); member-list parenthetical gains `mine-oracle-strength` (see Deviations).
- `plugins/nexus/skills/mine-algorithm/SKILL.md` — `11-row`→`12-row`, `all eleven members`→`all twelve members`.
- `plugins/nexus/skills/mine-architecture/SKILL.md` — same two count sweeps (2× "all eleven members"). Positional "eleventh mine" (line 20) untouched.
- `plugins/nexus/skills/mine-design/SKILL.md` — same two count sweeps. Positional "sixth mine" (line 23) untouched.
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — same two count sweeps (2× "all eleven members").
- `plugins/nexus/skills/mine-skill-candidates/SKILL.md` — same two count sweeps.
- `plugins/nexus/skills/mine-verify-flows/SKILL.md` — same two count sweeps (both on line 16).
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — `all eleven members`→`all twelve members` (2×; no `11-row` in this file).
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — Relationship §: `11-row`→`12-row` + `mine-oracle-strength` added to the family-head member list.

### Step 4 — Program doc + ADR register
- `docs/programs/br-anchored-regeneration.md` — §2 line 45 candidate→shipped (F29); §4 line 107
  `Eleven mines`→`Twelve mines`; §4 Gating-row +`mine-oracle-strength`; §7 item 3 candidate→shipped
  (F29). DO-NOT-TOUCH held: §7 line 175 "the eleventh mine shipped" (F16 historic) untouched;
  §5 line 134 (proposal build directive) left as-is (not in plan scope, still accurate).
- `docs/architecture/README.md` — new **ADR-68** (re-verified next-free at edit time: ADR-67
  highest written, ADR-66 claimed-but-unwritten by F15): index line + body mirroring ADR-67's shape
  (Status blockquote / Context / Decision / Why / Tradeoffs / Rejected), Accepted —
  F29-OracleStrengthMiner, 2026-07-22.

## Key Decisions

### Step 1 — SKILL.md authoring
- Followed `mine-architecture/SKILL.md` for the pointer surface and the full-pipeline-inline
  precedent (a consuming repo never sees this dev repo's `docs/specs/`, so the SKILL.md fully
  describes stages 1–6 rather than pointing at the tech-spec). The report section grammar is shown
  as a fenced skeleton (`## Scores / ## Buckets / ## Survivors / ## Gap-Kill / ## Pair /
  ## Registry Annotations`) rather than as live skill headings, so the seam names stay
  grep-findable without polluting the skill's own heading tree.
- Family membership rendered as a **name-and-shape member** (D1/Q1): the runner ships inline with a
  per-stack fill table; the SKILL.md states the promotion rule (abstract to an adapter contract only
  when a second stack's fill diverges in contract shape, not literal command).

### Step 2 — Runner port (Keep / Change / Scrub)
- **Source:** the PINNED `mutation_battery_v3.py` from adhoc-P0-RC-Regeneration (NOT the exact-name
  `mutation_battery.py` / `_v2.py` decoys — those carry zero bucket logic).
- **Keep (verbatim):** exact-string apply with the `count == 1` guard, CRLF find/replace
  normalization, hash-verified restore-in-`finally` (byte-exact or `sys.exit(2)`), incremental JSON
  rewrite after every mutant (`dump_partial`), the mutant manifest format, and the classify() marker
  lists + priority order (Dart fill) — verified against D4, not rebuilt.
- **Change (D4 hardening):**
  - (a) Kill = failing-test-assertion only: `status = "KILLED"` iff `audit_class == "BEHAVIORAL"`;
    every other non-pass buckets into `COMPILE_FAIL | LOAD_CRASH | TIMEOUT`, emitted per-mutant.
    Already the source's behavior — verified live (see Self-Review evidence), kept.
  - (b) Per-pid/GUID scratch: added `tempfile.mkdtemp(prefix="oracle_battery_{pid}_")`, handed to
    the test subprocess via `cwd` + `OSMB_SCRATCH` env so any temp a scored test writes is
    process-isolated (the shared-`/tmp` false-kill race the rule exists for).
  - (c) **No rounding** (the headline fix): the source computed
    `round(100 * behavioral_kills / valid_denominator, 2)` — exactly the 74.59→75 rounding bug the
    instrument-integrity rule names. Replaced with the un-rounded quotient; numerator + denominator
    are emitted so a consumer floors exactly via integers.
  - (d) Whole-tree timeout kill kept (`taskkill /PID /T /F`) + bounded drain, now via a config-
    selectable `tree_kill` (taskkill | killpg) so POSIX has a filled path.
  - (e) Per-stack commands read from a `DEFAULT_CONFIG` block overridable by an optional
    `config.json` argv — test command, marker lists, tree-kill mechanism, drain. Dart filled; this
    is also what an offline dry-run uses to inject a stub test command.
- **Scrub:** censused the source for campaign literals — only comment-level references existed
  (`campaign`, `mutation_battery_v2/v3`, `audit_kill_classifier`; no paths / `omnishelf` / dates /
  numeric fingerprints). Rewrote all comments to reference the skill + the instrument-integrity
  rules generically. Zero-hit forbidden-token gate passes (see Self-Review).

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None — gap = F25 (mine-family-member authoring recipe) | plan Skill Mapping: (none), TDD no; F25 gap logged in lessons |
| 2 | None — gap = F25 (asset-promotion half) | plan Skill Mapping: (none), TDD no; script port, no domain-logic test harness |
| 3 | None — gap = F24 (shipped-skill edit recipe) | plan Skill Mapping: (none), TDD no |
| 4 | None | plan Skill Mapping: (none), TDD no; docs/ADR prose |
| 5 | release-plugin | invoked via Skill tool at Step 5 |

### Step 5 — Release (release-plugin)
- Dry-run reasons list named **only F29 plan-step files** (the 8 swept member SKILL.mds incl.
  mine-verify-cover's SKILL.md + its `references/mine-family-core.md`, plus the new
  mine-oracle-strength) — dispatch-rule-3 gate passed, so the bump proceeded. Read-only `git status`
  confirmed the footprint is exactly the F29 files; the excluded research file
  (`docs/kb/research/spec-representation-and-equivalence-oracles.md`) shows only `??` (untouched).
- Applied `node scripts/bump-plugin.mjs --minor` → **1.41.0 → 1.42.0** (owner escalation: new shipped
  skill = new capability). Rewrote the CHANGELOG stub to describe the twelfth mine + the D4 runner
  hardening + the sweep line ("Family core plus eight member SKILL.mds swept eleven → twelve
  (positional ordinals untouched)"), mirroring the F16 entry's shape.
- **No commit, no tag** (dispatch rule 1 — lane close in the main session owns the commit).
- `plugins/nexus/plugin.json` (1.42.0) and `plugins/nexus/CHANGELOG.md` — bumped by release-plugin.

## Self-Review

**Verdict: PASS** (disclosed self-review — `/code-review` was unavailable for this scope; see below).

- **`/code-review` unavailability (disclosed).** The `review` skill is PR-scoped — it drives
  `gh pr view/diff` and states "local working-tree changes are out of scope." There is no PR (this is
  an uncommitted working diff), so per dispatch rule 5's fallback I ran a disclosed self-review
  against the review-format checklist instead.
- **Real finding folded (correctness, HIGH).** `mutation_battery.py` set `cwd=scratch` on the test
  subprocess for per-pid isolation — this would make a real `flutter test` run from an empty temp dir
  and fail every live run. The dry-run's cwd-agnostic stub hid it. Fixed: temp isolation now routes
  `TMPDIR`/`TEMP`/`TMP` + `OSMB_SCRATCH` at the per-pid dir with cwd left at the project root.
  Re-verified: all three classification cases (SURVIVED/COMPILE_FAIL/BEHAVIORAL) pass, byte-exact
  restore holds, `py_compile` clean.
- **Real finding folded (consistency, prose).** Changing `eleven-member`→`twelve-member` on
  mine-family-core.md's opening sentence left its member-list parenthetical enumerating 11 — added
  `mine-oracle-strength` to it (Deviation 1). Same class in the program doc: `(1.38.0)` version was
  stale under "Twelve mines" (Deviation 2).
- **Prose angles checked (dispatch rule 5).** Internal consistency: SKILL.md pipeline diagram ↔
  stage headers ↔ D3 model-pin table all agree (opus/fable/sonnet). Dangling cross-references: every
  `mine-family-core.md` citation uses the full `../mine-verify-cover/...` path (lint-clean); the one
  bare-backtick citation that tripped E6 was fixed. Dropped guarantees: the D4 instrument-integrity
  rules, the pair-stage 3 verdict forms + mandatory skip line, and the exact-floor/no-rounding rule
  are all present verbatim-equivalent. Directional references: ADR-68 verified next-free at edit
  time; the report section grammar matches the tech-spec seam names exactly. Positional-ordinal
  carve-outs (eleventh/sixth mine, eleven profile inputs, §7 line 175) verified untouched.
- **False positives dismissed.** (a) mine-family-core's "the latter two are name-and-shape members"
  note — **not** inaccurate: mine-oracle-strength is name-and-shape re: its *adapter/runner* but
  DOES adopt the shared *method* contract, so it is correctly placed among the method members and
  "the latter two" still refers to skill-gaps/skill-candidates (which don't adopt the method); left
  as-is (carry-over LOW below for visibility). (b) `regenerate-unit`/F28 named as consumer though not
  yet shipped — an intentional forward reference (F28 built separately per Scope), not a dangling
  file citation; lint does not flag it.
- **Evidence:** lint+unit suite green (`node --test "tests/lint/*.test.mjs" "tests/unit/*.test.mjs"`
  EXIT 0, post-bump); all AC1–AC6 grep contracts pass (bucket ≥3 = 11, forbidden = 0, sweep = 0,
  rows = 12, twelve/ADR-68 present, version 1.42.0); runner dry-run + classifier proofs green.

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `mine-verify-cover/SKILL.md` body 510 lines > 500 (W3 lint WARN) | low | architect | lint WARN, non-blocking (exit 0) | **Pre-existing** — my edit only changed text within lines 504/506, added no line; not caused by F29. A future progressive-disclosure split into `references/` would clear it. |
| "the latter two are name-and-shape members" note doesn't enumerate oracle-strength's adapter-sense name-and-shape nature | low | reviewer | mine-family-core.md member-list parenthetical | Left as-is — the note stays literally accurate (skill-gaps/skill-candidates ARE name-and-shape + don't adopt the method); oracle-strength's distinct flavor is fully covered in its own SKILL.md + the new table row. Flagged for visibility only. |
| Live battery run is operator-owed at first campaign use | low | architect/operator | plan Step 2 "What a PASS does not prove"; SKILL.md Assumptions | Dry-run proves the runner's grammar only; a real audit runs the stack toolchain (not hosted in this dev repo). `Owner: operator` at F28 preflight or first standalone audit. |

## KB Changes
None — `docs/kb/` here is the research pool; the cited entry
(`spec-representation-and-equivalence-oracles.md`) was already current and is the dispatch-excluded
file (untouched).

## Deviations from Plan
1. **mine-family-core.md member-list parenthetical gained `mine-oracle-strength`** (not in the plan's
   enumerated Step-3 edits). Reason: the plan changed `eleven-member`→`twelve-member` on the same
   opening sentence whose parenthetical enumerates the members; leaving 11 names under a "twelve"
   count is the internal inconsistency dispatch rule 5 mandates catching. Placed among the
   method-adopting members (before skill-gaps/skill-candidates) so the "latter two are name-and-shape"
   note stays accurate.
2. **program doc §4 `(1.38.0)` → `(1.42.0)`** (adjacent to the plan's line-107 `Twelve mines` edit,
   not separately enumerated). Reason: "Twelve mines ... shipped in the nexus plugin (1.38.0)" is
   stale — the 12th ships in 1.42.0; the F16 precedent tracked this version to the latest mine.
3. **`mutation_battery.py` per-pid isolation via temp env vars, not `cwd`** — a self-review correctness
   fix (see Self-Review); the plan's D4(b) says "per-pid/GUID scratch paths", which the env-var route
   satisfies without breaking the live test's working directory.
4. **gen-omni twin sync deferred to lane close.** release-plugin step 5 (SYNC TWIN) not run: it writes
   the `../omni` twin and needs a mirrored commit *there*, which the main session owns at lane close
   (dispatch rule 1 / CLAUDE.md). Deferring also avoids a stale twin if review fixes land. No
   `gen-commands` run needed (no `agents/*.md` edited).

*Status: COMPLETE — developer, 2026-07-22*
