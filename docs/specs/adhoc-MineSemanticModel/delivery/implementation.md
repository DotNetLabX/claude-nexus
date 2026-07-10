# mine-semantic-model — the Fifth Mine — Implementation

**Status:** Steps 1–4 COMPLETE and verified. Step 5 (release) BLOCKED — see `## Deviations from
Plan` and `questions.md` Q2. This file is written now (not held for the footer) so the architect's
Step 1 done-check has full visibility into what shipped and what's pending.

## Per-Step Disposition

| Step | Description | Disposition |
|------|-------------|-------------|
| 1 | Lift the 7 probe templates byte-for-byte | **Implemented** — `cp` (no shell redirection), AC-2/AC-10 executed and passing. Two pre-existing inline comments in the copied SQL leak tokens that AC-6/AC-9's tech-spec-literal (whole-folder) wording would flag — see `questions.md` Q1; not a Step 1 defect (byte-for-byte fidelity is the explicit instruction). |
| 2 | Generalize the 3 references + author `project-profile.md` | **Implemented** — all 4 reference files authored; AC-4/AC-5/AC-6/AC-9(references half)/AC-10(references half) executed and passing. |
| 3 | Author SKILL.md, then follow evaluate-skill | **Implemented** — SKILL.md authored; `evaluate-skill` invoked (visible in `.claude/audit/skill-invocations.log`, entry `{"skill":"evaluate-skill","agent":"developer","token":"done"}`); findings doc `docs/skill-evals/2026-07-10-mine-semantic-model.md` written; one Medium finding (F1, `AC-N` citation collision) fixed in this pass before Step 4. AC-1/AC-7/AC-9(SKILL.md half) executed and passing. |
| 4 | Register the fifth family member (5 edits, incl. member-count sweep) | **Implemented** — all 5 edits applied to `mine-family-core.md` + the 2 sibling SKILL.md member-count edits. AC-3 executed and passing (all sub-checks, including the member-count sweep and the DO-NOT-TOUCH verification). |
| 5 | Release (sequenced bump + CHANGELOG + gen-omni) | **Deviated (blocked, valid reason)** — the Step-5 sequencing gate (`git diff --quiet HEAD -- plugins/nexus/.claude-plugin/plugin.json`) flipped from GREEN (at hand-off) to RED mid-implementation: a concurrent, uncommitted sibling change (apparently slug `adhoc-ArchitectFastLane`) bumped `plugin.json` to 1.29.0 and touched `CHANGELOG.md`/`agents/solo.md`/`agents/team-lead.md`/`commands/solo.md`/`commands/team-lead.md`/`rules/agents-workflow.md` — none of which this slug touches. Per CLAUDE.md's double-bump rule ("never bump over an uncommitted sibling bump ... team-lead/operator-owned ordering") and the plan's own Step-5 text, this ordering is not developer-resolved. **Not run.** See `questions.md` Q2 for full evidence and recommendation (OPERATOR/TEAM-LEAD ACTION REQUIRED: hold until the sibling commits, then re-run the gate + bump). |

## AC-1..AC-10 — Executed Results

All commands run from the repo root (`D:\src\claude-plugins\nexus`) immediately before this
write-up (final consolidated re-run, not assembled from memory).

### AC-1 (skill exists, family-wired)
```
$ grep -n "user-invocable: true\|disable-model-invocation: true" plugins/nexus/skills/mine-semantic-model/SKILL.md
4:user-invocable: true
5:disable-model-invocation: true

$ grep -c "mine-family-core" plugins/nexus/skills/mine-semantic-model/SKILL.md
4
```
**PASS** — frontmatter flags present; 4 ≥ 3 `mine-family-core` pointer hits (intro, Fact/judgment
doctrine, Marginal-budget rail, Kickoff checklist — all using the sibling
`../mine-verify-cover/references/mine-family-core.md` shape).

### AC-2 (probe preamble, portable BR1)
```
$ grep -l "SET TRANSACTION READ ONLY" plugins/nexus/skills/mine-semantic-model/probes/*.sql | wc -l
7
$ grep -l "statement_timeout" plugins/nexus/skills/mine-semantic-model/probes/*.sql | wc -l
7
$ grep -inE '^\s*(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE|GRANT)' plugins/nexus/skills/mine-semantic-model/probes/*.sql
(no output — grep exit 1)
```
**PASS** — all 7 files carry both markers; zero write-keyword hits.

### AC-3 (family membership)
```
$ grep -n "five-member" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
3:Shared content for the five-member mine family (...)
$ grep -n "four-member" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
(no output — exit 1)
$ grep -n "mine-semantic-model.*one datasource area" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
17:| `mine-semantic-model` | one datasource area | live schema + read-only data probes | probe re-execution + KB grounding + operator interview | semantic-model bundle + provenance ledger |
$ grep -n "operator-in-loop" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
48:  **operator-in-loop** (the family's one in-loop human gate — never delegable as one background
$ grep -n "origin enum is its verdict grammar" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
81:refutation legs + interview provenance — its origin enum is its verdict grammar) and is not a
$ grep -rnE 'all four members|across all four' plugins/nexus/skills/
(no output — exit 1)
$ grep -rc "all five" plugins/nexus/skills/ | grep -v ':0'
plugins/nexus/skills/mine-reference-model/SKILL.md:1
plugins/nexus/skills/mine-semantic-model/SKILL.md:1
plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md:1
plugins/nexus/skills/mine-verify-repo/SKILL.md:1
$ grep -n "confirm all four up front" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
116:before), confirm all four up front:
```
**PASS** — `five-member` present, `four-member` 0 hits, family-table row present, `operator-in-loop`
present, carve-out signature present, member-count sweep 0 hits, `all five` = 4 hits (≥3; the 4th is
this skill's own `SKILL.md` "Relationship to the mine family" section, a bonus consistency, not
double-counted against the required 3 loci), DO-NOT-TOUCH line 109-area (now line 116 after the
core file's insertions) is untouched and still reads "confirm all four up front."

### AC-4 (profile template keyword sweep)
```
"bundle": 6
"provenance": 5
"validation gate": 2
"read-only role": 3
"large-table policy": 2
"KB hub": 2
"runner": 8
"baseline origin": 2
```
**PASS** — all 8 required keywords ≥1 hit in `references/project-profile.md`.

### AC-5 (credential hygiene)
```
$ grep -rniE 'Password\s*=|pwd\s*=|postgres(ql)?://\S+:\S+@' plugins/nexus/skills/mine-semantic-model/
(no output — exit 1)
```
**PASS** — 0 hits over the whole shipped folder, including the worked example.

### AC-6 (KG-token scoping, extended)
```
$ grep -rlE 'laurentiu_read|kg_seed|kg_god_ro|seed/db/|omnishelf-docs|analytics_report|analytics_events|retail_chain_id|fmcg_platform' plugins/nexus/skills/mine-semantic-model/
plugins/nexus/skills/mine-semantic-model/probes/cardinality.sql
plugins/nexus/skills/mine-semantic-model/probes/orphan-fk-fanout.sql
plugins/nexus/skills/mine-semantic-model/references/project-profile.md
```
**PASS for all authored files** (`references/*.md` — the 3 generalized references are 0-hit; only
`project-profile.md` carries KG tokens, exactly as designed). **FLAGGED for `probes/*.sql`** — the
tech-spec's literal wording ("lists at most one file") is not met because 2 probe files carry
pre-existing inline comments naming KG's large-table/column names
(`cardinality.sql:4-5`, `orphan-fk-fanout.sql:16`). This is the Step-1-vs-AC-6 tension documented in
`questions.md` Q1 — not edited (Step 1 forbids editing the SQL), not silently passed.

### AC-7 (Phase 0)
```
$ grep -n "Phase 0" plugins/nexus/skills/mine-semantic-model/SKILL.md
27:## Phase 0 — Resolve the project profile
$ grep -n "never silently defaulted" plugins/nexus/skills/mine-semantic-model/SKILL.md
38:**A missing profile is never silently defaulted** — Phase 1 never starts against assumed values;
```
**PASS** — the exact signature phrase is present.

### AC-8 (release)
**NOT RUN** — blocked by the Step-5 sequencing gate (see Step 5 disposition above and
`questions.md` Q2).

### AC-9 (stack-anchor sweep)
```
$ grep -rnE '\.cs\b|\.ps1\b|\bdotnet\b|DataPool|QueryLoad|\bF[0-9]{2}\b' plugins/nexus/skills/mine-semantic-model --include=*.md --include=*.sql | grep -v "references/project-profile.md"
plugins/nexus/skills/mine-semantic-model/probes/orphan-fk-fanout.sql:8:-- child scope has zero non-null FK values (caught live during the F52 Step 6 dry-run against the
plugins/nexus/skills/mine-semantic-model/SKILL.md:14:(tracked there as feature `F38`) that survived spec -> plan undetected — a column that verifiably
plugins/nexus/skills/mine-semantic-model/SKILL.md:15:never existed in the live schema. `F38` is the one feature-id this file carries; every other
```
**PASS for SKILL.md** — the only hits are the two `F38` lines inside the labeled "Origin (KG pilot)"
section, exactly the one sanctioned exception. **PASS for all 3 generalized references**
(`probe-catalog.md`, `interview-protocol.md`, `output-contract.md` — 0 hits each, verified
separately during Step 2). **FLAGGED for `probes/orphan-fk-fanout.sql`** — one pre-existing `F52`
token in an inline review-cycle comment, same Step-1-vs-AC-9 tension as AC-6 above, same
`questions.md` Q1.

### AC-10 (BOM, every shipped file)
```
SKILL.md: 2d2d2d                          (---, frontmatter fence)
references/interview-protocol.md: 232049  (# I)
references/output-contract.md: 23204f     (# O)
references/probe-catalog.md: 232050       (# P)
references/project-profile.md: 232050     (# P)
probes/cardinality.sql: 2d2d20            (-- )
probes/cross-column-implication.sql: 2d2d20
probes/date-coverage.sql: 2d2d20
probes/null-rate.sql: 2d2d20
probes/orphan-fk-fanout.sql: 2d2d20
probes/usage-heat.sql: 2d2d20
probes/value-distribution.sql: 2d2d20
```
**PASS** — no file starts with `EF BB BF`; every shipped file confirmed BOM-free.

## Test Suite Results

```
$ node --test tests/lint/*.test.mjs
ℹ tests 47 / pass 47 / fail 0

$ node --test tests/unit/*.test.mjs
ℹ tests 462 / pass 462 / fail 0

$ node scripts/selfcheck.mjs
[PASS] tests (lint + unit) — 0 failing
[PASS] gen-commands drift — in sync
[FAIL] gen-omni --check — omni twin drifted — run gen-omni
[PASS] bump-plugin --check — bump present (or no shipped change)
[PASS] spec-diff inline-copy sync — 7 lib/workflow pair(s) in sync
[INFO] salience report — informational — never fails the run
selfcheck: 4/5 passed (1 failing)
```
The `gen-omni --check` failure is expected and correct at this point in the sequence — the plan
runs `gen-omni.mjs` AFTER the bump (Step 5), which is blocked (see above). This is not a regression;
re-run `selfcheck.mjs` after Step 5 completes.

## evaluate-skill Outcome

Invoked per Step 3's mandatory post-authoring gate. Findings doc:
`docs/skill-evals/2026-07-10-mine-semantic-model.md`. Verdict: **ACCEPT (fix-then-accept)**.

- **F1 (Medium)** — inherited KG-internal `AC-N` numeric citations (8 occurrences across 4 files)
  collided with this promotion's own tech-spec `AC-N` numbering (different meanings for the same
  numbers — e.g. the skill's internal `AC-6` meant "idempotence", the tech-spec's `AC-6` means
  "KG-token scoping"). **Fixed in this pass** — all 8 replaced with plain-prose descriptions;
  re-verified 0 `AC-\d+` hits remain; `skill-lint.mjs` still exits 0.
- **F2 (Low)** — external-system claims (EXPLAIN JSON shape, `pg_stat_user_tables` semantics)
  inherited from the KG pilot, not independently re-verified this pass. Correctly out of scope per
  the tech-spec's Definition Review (rules lifted verbatim from an already-piloted, twice-reviewed
  source).
- **F3 (Low)** — 3 W4 nested-reference lint warnings (`project-profile.md`→`probe-catalog.md`,
  `interview-protocol.md`↔`output-contract.md`). Accepted as-is — genuine two-node pointers, not a
  chain; flattening would duplicate content and increase drift risk.
- **F4 (Low)** — the "does NOT do" scope fence names lanes, not sibling skills by name (the
  adjacency is covered in "Relationship to the mine family" instead). Routed as a carry-over for a
  future cross-family consolidating pass, not a defect in this promotion.

Audit trail confirmation: `.claude/audit/skill-invocations.log` tail —
`{"ts":"2026-07-10T19:28:40.467Z","agent":"developer","skill":"evaluate-skill","token":"done","session":"133567f3-c1ca-417e-ae0f-f294c3db9426"}`.

## Files Created

- `plugins/nexus/skills/mine-semantic-model/SKILL.md` — the fifth mine's method file: Phase 0
  (project-profile resolution), the five phases, three run modes, datasource surface/channel,
  datasource seam, the BR1-BR13 obligations table (profile-parameterized), detailed Procedure,
  scope fence, and the family-pointer section. Sole sanctioned stack token: `F38`, inside the
  labeled "Origin (KG pilot)" intro section.
- `plugins/nexus/skills/mine-semantic-model/references/probe-catalog.md` — the 7 probe classes,
  BR1 preamble/postamble, parameters, EXPLAIN cost gate, large-table policy (genericized shape
  taxonomy), the new anchor-free "runner contract" subsection, and a generic "Running a probe"
  invocation shape (the KG `run-probe.cs` worked example moved to `project-profile.md`).
- `plugins/nexus/skills/mine-semantic-model/references/interview-protocol.md` — near-verbatim lift;
  `provenance.json` → the profile's ledger path; the `seed/db/generation-rules/interview.md` cite
  → "the KG pilot run"; `analytics_reports.status` example → `orders.status`.
- `plugins/nexus/skills/mine-semantic-model/references/output-contract.md` — ledger schema
  (`carried(F38)` → `carried({baseline})` throughout), single-primary-origin doctrine, run-report
  template (paths profile-parameterized), KB-hub write-back carve-out.
- `plugins/nexus/skills/mine-semantic-model/references/project-profile.md` — **new**: the 10-item
  profile template + KG's complete filled profile as the sole worked example (the only shipped file
  where KG tokens are permitted).
- `plugins/nexus/skills/mine-semantic-model/probes/cardinality.sql`,
  `null-rate.sql`, `value-distribution.sql`, `orphan-fk-fanout.sql`, `date-coverage.sql`,
  `cross-column-implication.sql`, `usage-heat.sql` — byte-for-byte copies (`cp`) from
  `D:\src\knowledge-gateway\.claude\skills\mine-semantic-model\probes\`.
- `docs/skill-evals/2026-07-10-mine-semantic-model.md` — the evaluate-skill findings doc.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — 5 edits: (1) intro
  "four-member" → "five-member" + member enumeration; (2) family table +1 row
  (`mine-semantic-model`); (3) invariant sentence "all four" → "all five"; (4) §Execution topology
  +1 per-skill staging bullet (operator-in-loop delta); (5) §Skeptic protocol +1 carve-out sentence
  (`origin enum is its verdict grammar`). DO-NOT-TOUCH line ("confirm all four up front", now at
  line 116 after the insertions) verified untouched.
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — line 29: "all four members follow" → "all
  five members follow"; also updated the adjacent, now-stale "full 4-row family table" → "full
  5-row family table" on the same line (same-line accuracy fix directly caused by the mandated
  edit — see Key Decisions).
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — line 27: "all four members follow" → "all
  five members follow".

## Key Decisions

- **Dropped internal KG spec-artifact citations not covered by the plan's explicit "keep BR
  numbering" decision.** `SR-\d+` and `Decision D\d` labels were left as-is (near-verbatim,
  harmless, don't collide with anything in this repo), but "Decision D2"/"plan-critic B9" style
  in-package-authoring citations in `probe-catalog.md` were dropped as dangling references to a
  document that doesn't ship (only the BR-id and content survive) — narrower than the AC-N fix
  (F1) but the same underlying judgment: don't carry forward citations to documents this package
  doesn't include.
- **Fixed a pre-existing "Six probe classes" miscount.** The KG original's `probe-catalog.md` opens
  "Six probe classes" while its own table lists all 7 — corrected to "Seven probe classes" in the
  shipped version rather than propagating the source's own inconsistency.
- **Corrected the six-file/seven-family construct-map framing.** KG's original text said "the six
  construct families... seven families total, matching the bundle's seven files" — internally
  inconsistent (6 files, not 7, since `entity-graph.json` yields two families). The worked example
  in `project-profile.md` states it accurately: "six JSON files mapping to seven construct
  families."
- **Phase 1's schema-reconciliation step has no dedicated profile item.** The tech-spec's 10-item
  profile list has no line for KG's `seed/db/reference/schema-columns.csv` reconciliation source.
  Generalized Phase 1 step 2 to "reconcile against any project-maintained schema-reference
  snapshot, if one exists (optional)" — preserves the mechanism for projects that have one, doesn't
  invent a mandatory 11th profile item the tech-spec didn't specify.
- **`## Datasource seam (Postgres today)` placed after the datasource surface/channel section** —
  plan left position unspecified ("new, short"); grouped for topical adjacency.
- **evaluate-skill's one Medium finding (F1) was fixed directly in the dev-repo source**, not
  routed to a portable feedback file — the skill's ADR-1 shipped/local channel split applies to
  fixing an ALREADY-SHIPPED cached plugin from a consuming project; this is the plugin's own
  source repo, mid-authoring, in the same implementation round the file was created in.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: (none)` — mechanical byte-copy + grep verification only |
| 2 | None | plan: `Skill: (none)` — generalization authoring; flagged in the plan and in `lessons.md` (Architect Lessons) as a skill-authoring gap: no skill-authoring/promote-skill skill exists yet |
| 3 | `evaluate-skill` | Invoked via the Skill tool after SKILL.md was authored, per plan's "Follow evaluate-skill (as post-authoring gate)". Findings doc + fix applied before Step 4. Audit-log entry confirmed above. |
| 4 | None | plan: `Skill: (none)` — mechanical, targeted edits to `mine-family-core.md` + 2 sibling files |
| 5 | `release-plugin` | **Not invoked** — Step 5 is blocked before the release-plugin flow could run (sequencing gate red). Will be invoked when Step 5 resumes. |

TDD column: all steps `TDD: no` per the plan (doc/skill artifacts, no executable code ships) — no
deviation.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Step 1's byte-for-byte probe mandate vs. AC-6/AC-9's literal whole-folder wording | Medium | architect | `questions.md` Q1 — `cardinality.sql:4-5`, `orphan-fk-fanout.sql:8,16` carry pre-existing KG tokens/feature-ids the tech-spec's literal AC-6/AC-9 wording would flag; the plan's own per-step Satisfies lines never claim AC-6/AC-9 for Step 1, so this is proceeding under the plan's implicit scoping, not a silent pass | Needs architect adjudication: amend AC-6/AC-9's tech-spec wording with an explicit `probes/*.sql` exclusion (mirroring the existing `project-profile.md` exclusion), or direct a different resolution |
| Step 5 blocked by a concurrent uncommitted sibling plugin.json bump | High (blocks release only) | team-lead/architect | `questions.md` Q2 — `git diff HEAD -- plugins/nexus/.claude-plugin/plugin.json` shows 1.28.0→1.29.0 uncommitted, from an unrelated slug (`adhoc-ArchitectFastLane`, inferred from touched files) | OPERATOR/TEAM-LEAD ACTION REQUIRED — hold Step 5 until the sibling commits, then re-run the sequencing gate + bump per the plan (Follow release-plugin: `--dry-run` then `--minor`) |
| evaluate-skill F4 — scope fence doesn't name sibling mine-family skills by name | Low | architect | `docs/skill-evals/2026-07-10-mine-semantic-model.md` F4 | Deferred — polish beyond the plan's specified content for this step; candidate for a future cross-family consolidating pass |

## Deviations from Plan

1. **Step 5 not executed** — see disposition table and `questions.md` Q2. This is a live,
   correctly-caught sequencing hazard (the exact gate the plan specifies flipped red between
   hand-off and execution), not a developer choice. OPERATOR/TEAM-LEAD ACTION REQUIRED per the
   plan's own "team-lead/operator-owned ordering" language.
2. **AC-6/AC-9 report a literal-wording gap on 2 of 7 probe files** — documented and executed
   honestly rather than silently narrowed or silently failed; see `questions.md` Q1. No SQL was
   edited (Step 1 forbids it).
3. **One evaluate-skill Medium finding (F1) was fixed before Step 4**, per the plan's explicit
   instruction to "fold its findings before Step 4" — 8 dangling/colliding `AC-N` citations removed
   from the shipped body text across `SKILL.md`, `probe-catalog.md`, `interview-protocol.md`,
   `output-contract.md`.
4. **Minor accuracy fixes beyond the plan's literal text, all same-line/same-file as a mandated
   edit or a directly-caused staleness**: `probe-catalog.md`'s "Six probe classes" → "Seven probe
   classes"; `output-contract.md`'s six-file/seven-family framing corrected in the worked example;
   `mine-reference-model/SKILL.md`'s now-stale "4-row family table" → "5-row" on the same line as
   the mandated "all five members" edit. None change any AC-checked content; all documented here
   rather than silently made.

## KB Changes

None — this slug ships no `docs/kb/` entries (dev-repo skill estate; tech-spec confirms "None" under
KB Impact).

*Status: IN PROGRESS — Step 5 blocked pending team-lead/operator action on the concurrent sibling
bump (questions.md Q2). Steps 1-4 are complete, verified, and test-green. Re-run `selfcheck.mjs`
after Step 5 completes to confirm 5/5.*
