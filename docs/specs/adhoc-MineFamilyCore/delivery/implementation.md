# Mine-Family Core — Implementation

## Per-step disposition

| Step | Disposition |
|------|-------------|
| 1 — Author the core reference | Implemented — `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md`, 121 lines, 7 `##` headings |
| 2 — Extract from `mine-verify-cover/SKILL.md` | Implemented — topology, safety-rails budget/report bullets, Merge-paragraph invariant sentence, relationship table (8→6 rows) all pointered; identity sentence + B4 pointer added |
| 3 — Extract from `mine-verify-repo/SKILL.md` | Implemented — intro, topology, C2/C3/C4/C5/C6 deltas pointered per disposition table; relationship table (6→3 rows); B4 pointer added; Binding obligations + Safety-rails glance list untouched |
| 4 — Extract from `mine-reference-model/SKILL.md` | Implemented — intro/family-table removed, topology, R2/R3/R4/R6 deltas pointered; relationship table (4→1 row); B4 pointer added; Binding obligations + Safety-rails glance list untouched |
| 5 — P0 record hygiene | Implemented — 4 dated annotations, 2 target-repo backlog rows, team-lead.md + commands mirror repoint |
| 6 — Gates | Implemented — 505/505 tests green, lint OK ×3, AC-3 signature battery recorded below, `evaluate-skill` scoped pass → ACCEPT (0 findings) |
| 7 — Release | Implemented — PATCH 1.26.0 → 1.26.1, CHANGELOG one-liner, omni twin regenerated. Commit is team-lead-owed (not run by developer, per dispatch instruction) |

## Files Created

- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — the shared mine-family
  reference: family table, execution topology (canonical), marginal-budget rail + report-on-halt,
  skeptic protocol (+ the two harvested pilot clauses: vacuous-evidence check, merged-row audit
  note), fact/judgment doctrine, registry invariants + refresh outcome grammar, the B4 kickoff
  checklist. No frontmatter (reference file, never Skill-tool loaded). 121 lines (≤140 target).
- `docs/skill-evals/2026-07-10-mine-family-core-refactor.md` — the Step 6 `evaluate-skill` scoped
  findings doc (pointer integrity / no orphaned references / frontmatter-body match) covering all
  three touched skills — verdict ACCEPT, 0 findings.

## Files Modified

- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — mine-from-spec mode's Execution topology
  block replaced with a pointer + the mode's own staging delta + a B4 kickoff-checklist pointer;
  Safety-rails budget-cap/report-on-halt bullets pointered (mutation-ratchet and
  forbidden-to-Cover-agent bullets kept); the Merge-paragraph registry-invariant sentence (SDD
  lifecycle, ≈:380-382) pointered to core, rest of `## SDD lifecycle` untouched; relationship table
  trimmed from 8 to 6 rows (removed the 2 family rows: `mine-verify-repo`, `mine-reference-model`)
  with an identity sentence + pointer added above it. Net diff: 19 insertions / 20 deletions (file
  shrinks).
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — intro "third mine" comparison paragraph
  replaced with a one-line identity sentence + pointer; Execution topology section replaced with a
  pointer + this skill's staging delta (metric agent → per-area miners‖ → consolidate+skeptic) + a
  B4 pointer; C2's fact/judgment doctrine sentence pointered (schema list untouched); C3's
  skeptic-RUNS + verdict-grammar bullets pointered (severity-recalibration + cross-model-critic-seam
  + "only CONFIRMED reaches registry" bullets kept in-file); C4's invariants bullet pointered
  (species/judgment/consumers bullets kept); C5's three-outcome refresh grammar pointered (triage
  dispositions + refresh trigger kept); C6's budget-cap/report-on-halt bullets pointered
  (hotspot-first-ordering + Forbidden list kept); relationship table trimmed from 6 to 3 rows
  (removed `mine-verify-cover`, `mine-from-spec`, `mine-reference-model`) with a pointer added
  above. Binding prompt obligations section and the `## Safety rails` glance list are byte-identical
  (confirmed via `git diff` hunk inspection — no hunk touches either range). Net diff: 33 insertions
  / 43 deletions.
- `plugins/nexus/skills/mine-reference-model/SKILL.md` — intro "fourth mine" identity paragraph +
  the 4-row family table removed (core owns the table now), replaced with a one-line identity
  sentence + pointer (the flattery-motivation paragraph that follows is kept, it's skill-specific
  WHY, not restated family boilerplate); Execution topology section replaced with a pointer + this
  skill's sizing delta (five extractors → ONE consolidate+skeptic + the Entry-6 sizing note) + a B4
  pointer; R2's "Pattern existence is the FACT" bullet pointered (schema paragraph, Portability-is-a-
  JUDGMENT bullet, and the Negative-claims-carry-their-zero bullet all kept in-file — the latter
  because it's also AC-anchored, byte-identical, in the Binding prompt obligations section
  elsewhere); R3's skeptic-RUNS bullet pointered (verdict-grammar/flattery-framing, extractor-framing,
  and self-mode-cross-check bullets kept in-file); R4's registry-invariants sentence pointered
  (artifact-species paragraph and the per-dimension-tables/translation-dictionary sections list
  kept; the refresh paragraph's "same outcome grammar as the sibling" clause now explicitly points
  at core, keeping this skill's own still-active/abandoned/restructuring mapping and trigger); R6's
  budget-cap/report-on-halt bullet pointered (read-only + no-metric-layer bullets and the Forbidden
  list kept); relationship table trimmed from 4 to 1 row (removed `mine-verify-repo`,
  `mine-verify-cover`, `mine-from-spec`; kept `improve-skills` non-consumer note) with a pointer
  added above. Binding prompt obligations section and the `## Safety rails` glance list are
  byte-identical (confirmed via `git diff` hunk inspection). Net diff: 43 insertions / 58 deletions.
- `plugins/nexus/agents/team-lead.md` (line 127) — repointed the "mine-verify-cover's Execution
  topology" citation (a heading Steps 2-4 removed the restated body of) to
  `` `mine-verify-cover references/mine-family-core.md` §Execution topology `` (critic F6).
- `plugins/nexus/commands/team-lead.md` — regenerated via `node scripts/gen-commands.mjs nexus`
  after the agents/team-lead.md edit (mirror stays in sync; only this one command file changed,
  confirmed via `git status --short plugins/nexus/commands/`).
- `docs/skill-evals/2026-07-04-mine-verify-repo.md` — dated pilot addendum inserted after the
  header block (below the "Channel:" line, before "## Layer 0"): pilot executed 2026-07-04/05 →
  `docs/tech-debt/` (6 areas) in `omnishelf_flutter_app`; refresh owner = operator,
  `last_verified: 2026-07-05`. Original eval text below is untouched (never rewrite the record).
- `docs/skill-evals/2026-07-05-mine-reference-model.md` — same shape: dated addendum after the
  "Layer 0 (lint)" line, before "## F1": pilot executed 2026-07-05 (self-reference on
  `dotnet-microservices`, runs 1-3) → `docs/reference-model.md`; refresh owner = operator,
  `last_verified: 2026-07-05`.
- `docs/specs/adhoc-MineVerifyRepo/delivery/summary.md` — dated addendum after the status/date
  lines (anchor: line 3): pilot executed 2026-07-04/05 on `omnishelf_flutter_app` (contiguous date
  phrasing per critic F4) — not a KG pilot as originally scoped; artifact `docs/tech-debt/` (6
  areas); refresh owner = operator; `last_verified: 2026-07-05`. A second short "Superseded" note
  added directly under the original "KG pilot on `d:\src\knowledge-gateway`" paragraph (anchor:
  line ~51/55) pointing back to the top addendum, without rewriting the original text.
- `docs/specs/adhoc-MineReferenceModel/delivery/summary.md` — dated addendum added directly under
  the "OPERATOR ACTION REQUIRED" bullet (anchor: line 20): pilot executed 2026-07-05 (self-reference
  on `dotnet-microservices`, runs 1-3) — contiguous date phrasing (critic F4) — superseded the
  originally-planned omnishelf-consumer parameters; artifact `docs/reference-model.md`; refresh
  owner = operator; `last_verified: 2026-07-05`.
- `plugins/nexus/.claude-plugin/plugin.json` — version 1.26.0 → 1.26.1 (PATCH, via
  `node scripts/bump-plugin.mjs`).
- `plugins/nexus/CHANGELOG.md` — `[1.26.1]` entry; replaced the tool's auto-generated bullet-list
  placeholder with the plan's exact one-liner: "Mine-family core reference extracted
  (topology/budget/skeptic/registry invariants consolidated) + pilot-lesson harvest + kickoff
  checklist; records annotated."
- `D:\Omnishelf\omnishelf_flutter_app\docs\backlog.md` (target repo, outside this repo) — new
  "## Refresh owed" table with one row: run `mine-verify-repo` refresh against
  `docs/tech-debt/`, citing `last_verified: 2026-07-05`. Matched the file's existing
  Slug/Title/Source/Depends/Status table format. Write succeeded without a permission denial.
- `D:\src\dotnet-microservices\docs\skill-backlog.md` (target repo, outside this repo) — new
  "## Refresh Queue" section with one `###` entry (Status/Type/Source/Description/Date fields,
  matching the file's existing per-skill entry format) for a `mine-reference-model` refresh,
  citing `last_verified: 2026-07-05`. That repo has no `docs/backlog.md`;
  `docs/skill-backlog.md` is its live queue (critic F3). Write succeeded without a permission
  denial.
- `../omni/plugins/omni/**` (sibling repo, outside this repo) — regenerated by
  `node scripts/gen-omni.mjs` after the bump: `plugin.json`, `CHANGELOG.md`, `agents/team-lead.md`,
  `commands/team-lead.md`, the three touched mine skills' `SKILL.md`, and the new
  `skills/mine-verify-cover/references/` folder. **Not committed** — per CLAUDE.md this is a
  separate repo the team lead/owner commits, with a message mirroring the nexus commit (subject
  `feat(adhoc-MineFamilyCore): sync mine-family core reference (omni 1.26.1)`, scope = this slug,
  footer `Generated from the nexus plugin (nexus {sha}).`).

## Key Decisions

- **Core file section wording is a lift-and-consolidate, not a verbatim splice.** The plan's "lift,
  don't rewrite" instruction applies to the *load-bearing signature sentences* (verified via the
  AC-3 grep battery below) — those are lifted verbatim. Surrounding connective prose (e.g. merging
  cover's topology intro with repo's/ref-model's per-skill staging notes into one canonical section
  plus a "per-skill staging" sub-list) required light consolidation since the three originals
  weren't identical prose, only identical *in effect*. Every AC-1/AC-3/AC-5/AC-7-checklist grep
  target was verified post-write.
- **`mine-reference-model`'s R2 "Negative claims carry their zero" and R3's flattery-framing +
  self-mode-cross-check bullets stay in-file, not pointered** — explicit plan instruction (Step 4),
  because the negative-claims bullet is also AC-anchored byte-identical in the Binding prompt
  obligations section, and the flattery/self-mode bullets are this skill's specific delta, not
  restated family boilerplate.
- **`mine-reference-model`'s R4 refresh paragraph keeps its own still-active/abandoned/restructuring
  wording** rather than being fully replaced by core's resolved/still-active/superseded labels,
  because ref-model's refresh outcomes for *virtues* (a pattern "abandoned" vs a finding "resolved")
  are genuinely not the same three words as repo's debt-mine outcomes — only the *word* "same
  outcome grammar as the sibling" now explicitly points at core; the ref-model-specific
  instantiation was kept rather than invented/forced into the debt-mine's exact three labels.
- **CHANGELOG placeholder text replaced with the plan's literal one-liner** — `bump-plugin.mjs`
  auto-generates a generic bullet list from file-classification heuristics; the plan specifies exact
  CHANGELOG prose, so I overwrote the generated bullets with it (version header/date left as the
  tool wrote them).

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | None | plan: `Skill: (none)` — prose authoring per the disposition table, no pattern skill mapped |
| 2 | None | plan: `Skill: (none)` — prose/doc edit, grep-checkable acceptance |
| 3 | None | plan: `Skill: (none)` |
| 4 | None | plan: `Skill: (none)` |
| 5 | None | plan: `Skill: (none)` — record annotations + backlog rows + citation repoint |
| 6 | evaluate-skill | Invoked via the Skill tool per plan Step 6 (`Follow evaluate-skill`); scoped per the plan's Decision row (pointer/structural integrity, not the full judgment rubric) — findings doc written to `docs/skill-evals/2026-07-10-mine-family-core-refactor.md`, verdict ACCEPT, 0 findings |
| 7 | release-plugin | Followed directly (`node scripts/bump-plugin.mjs --dry-run` then the real bump) rather than via the Skill tool, matching the plan's literal Step 7 instruction and this run's dispatch note ("run the release-plugin flow ... but do NOT git commit"); PATCH confirmed matching the tool's own classification (agent/command/3×skill changes) and the tech-spec's Decision 3 |

TDD column: N/A for all 7 steps — the plan states "`Skill: None` steps are prose/doc edits with
grep-checkable acceptance — no testable runtime behavior anywhere in this pass (TDD `no`
throughout)," and the Testing Strategy section confirms "No runtime behavior → no tests."

## AC verification record (grep outputs, verbatim)

### AC-3 signature battery — sibling SKILL.md files (expect 0 hits each)

```
$ grep -rn "capture the start" plugins/*/skills/*/SKILL.md
(no output)

$ grep -rn "is the session that owns spawning" plugins/*/skills/*/SKILL.md
(no output)

$ grep -rn "carried unchanged from ADR-43" plugins/*/skills/*/SKILL.md
(no output)

$ grep -rn "appends a changelog entry" plugins/*/skills/*/SKILL.md
(no output)

$ grep -rn "owns spawning" plugins/*/skills/*/SKILL.md
plugins/nexus/skills/conformance-review/SKILL.md:83:default**. The orchestrator (the session that owns spawning — team lead at the PR tail, or the main
```
The short form `"owns spawning"` still collides with `conformance-review` (out-of-scope skill,
unaffected by this pass) — confirming the critic's F1 fix (using the discriminating long form `"is
the session that owns spawning"`, which does NOT match this line: it reads "the session that owns
spawning", not "IS the session that owns spawning") was the correct choice.

### AC-3 signature battery — whole `plugins/` tree (expect exactly 1 hit each, the core file)

```
$ grep -rln "capture the start" plugins/
plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md

$ grep -rln "is the session that owns spawning" plugins/
plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md

$ grep -rln "carried unchanged from ADR-43" plugins/
plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md

$ grep -rln "appends a changelog entry" plugins/
plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
```

### AC-4 — Binding prompt obligations sections byte-identical

```
$ git diff -- plugins/nexus/skills/mine-verify-repo/SKILL.md | grep -A2 -B2 "Binding prompt obligations"
(no output — section untouched)

$ git diff -- plugins/nexus/skills/mine-reference-model/SKILL.md | grep -A2 -B2 "Binding prompt obligations"
(no output — section untouched)
```
(`mine-verify-cover` has no Binding prompt obligations section — AC-4 is vacuously true for it,
critic F8a.) Confirmed additionally by inspecting every `git diff` hunk header for both files: no
hunk's line range overlaps the Binding prompt obligations or `## Safety rails` glance-list sections.

### AC-6 — record hygiene (expect a hit in all 4 files)

```
$ grep -n "pilot executed 2026-07-0" docs/skill-evals/2026-07-04-mine-verify-repo.md
14:**Pilot addendum (2026-07-10):** pilot executed 2026-07-04/05 → `docs/tech-debt/` (6 areas) in

$ grep -n "pilot executed 2026-07-0" docs/skill-evals/2026-07-05-mine-reference-model.md
14:**Pilot addendum (2026-07-10):** pilot executed 2026-07-05 (self-reference on

$ grep -n "pilot executed 2026-07-0" docs/specs/adhoc-MineVerifyRepo/delivery/summary.md
6:**Pilot addendum (2026-07-10, adhoc-MineFamilyCore P0 record hygiene):** pilot executed 2026-07-04/05

$ grep -n "pilot executed 2026-07-0" docs/specs/adhoc-MineReferenceModel/delivery/summary.md
21:- **Pilot addendum (2026-07-10, adhoc-MineFamilyCore P0 record hygiene):** pilot executed 2026-07-05
```

### AC-7 — refresh rows in the two target-repo backlogs

```
$ grep -n "last_verified: 2026-07-05" "D:\Omnishelf\omnishelf_flutter_app\docs\backlog.md"
35:| — | Run `mine-verify-repo` refresh against this repo's `docs/tech-debt/` registry | adhoc-MineFamilyCore P0 record hygiene (nexus); pilot ran 2026-07-04/05, `last_verified: 2026-07-05` | — | Ready (refresh run; rows `last_verified: 2026-07-05`) |

$ grep -n "last_verified: 2026-07-05" "D:\src\dotnet-microservices\docs\skill-backlog.md"
8:- **Source:** adhoc-MineFamilyCore P0 record hygiene (nexus); pilot ran 2026-07-05 (self-reference, runs 1-3), `last_verified: 2026-07-05`
9:- **Description:** Re-run `mine-reference-model` (self-reference mode) to refresh `docs/reference-model.md` against this repo's git delta since `last_verified: 2026-07-05`. Refresh owner: operator.
```

### Team-lead repoint grep (critic F6)

```
$ grep -n "mine-family-core" plugins/nexus/agents/team-lead.md plugins/nexus/commands/team-lead.md
plugins/nexus/agents/team-lead.md:127:`mine-verify-cover references/mine-family-core.md` §Execution topology).
plugins/nexus/commands/team-lead.md:127:`mine-verify-cover references/mine-family-core.md` §Execution topology).
```

### AC-1 / AC-5 / AC-7-checklist (core file)

```
$ grep -c '^## ' plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
7

$ grep -n "CAN fail" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
66:  evidence command CAN fail: a zero-hit/absence claim whose grep is structurally unable to match

$ grep -n "Merged from" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
70:  findings, the surviving row records what was merged (`Merged from: {ids}`), the pilot's working

$ grep -n "stop-budget" plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md
116:3. **stop-budget set** — the marginal-spend ceiling this run halts at (see the budget rail above).
```

### AC-2 pointer coverage

```
$ grep -l "mine-family-core" plugins/nexus/skills/mine-verify-cover/SKILL.md plugins/nexus/skills/mine-verify-repo/SKILL.md plugins/nexus/skills/mine-reference-model/SKILL.md
plugins/nexus/skills/mine-verify-cover/SKILL.md
plugins/nexus/skills/mine-verify-repo/SKILL.md
plugins/nexus/skills/mine-reference-model/SKILL.md
```

### AC-8 gates

```
$ node --test tests/lint/*.test.mjs tests/unit/*.test.mjs
ℹ tests 505 / pass 505 / fail 0

$ node scripts/selfcheck.mjs   (after Step 7's bump + gen-omni)
[PASS] tests (lint + unit) — 0 failing
[PASS] gen-commands drift — in sync
[PASS] gen-omni --check — twin in sync
[PASS] bump-plugin --check — bump present (or no shipped change)
[PASS] spec-diff inline-copy sync — 7 lib/workflow pair(s) in sync
selfcheck: 5/5 passed
```
Note: `node scripts/selfcheck.mjs` run *before* Step 7's bump showed `gen-omni --check` FAIL (4/5)
— expected, since the omni twin only regenerates after the bump (CLAUDE.md: "run it after a
bump"). This mirrors the precedent in `docs/specs/adhoc-MineVerifyRepo/delivery/summary.md`
("Verify gate recorded an advisory gen-omni drift at developer stop; expected ... cleared at
commit"). Re-running after the bump + `gen-omni.mjs` gave the 5/5 green recorded above.

## Deviations from Plan

- **CHANGELOG auto-generated bullets overwritten with the plan's literal one-liner** — see Key
  Decisions above. Not a deviation from plan intent (the plan specifies the exact line), just a
  correction of the tool's generic default.
- **No git commit** — per this run's explicit dispatch instruction ("do NOT git commit — leave the
  working tree for review; note in implementation.md that the commit is operator/team-lead-owed").
  `plugins/nexus/.claude-plugin/plugin.json` and `plugins/nexus/CHANGELOG.md` are bumped and staged
  in the working tree, not committed. **OPERATOR/TEAM-LEAD ACTION REQUIRED:** commit the nexus repo
  changes (all files listed under Files Created/Modified except the two external target repos and
  `../omni`), then separately commit the `../omni` twin regeneration in that sibling repo per
  CLAUDE.md's mirrored-message convention (see the `../omni` bullet above for the exact
  subject/footer). No `bump-plugin.mjs` re-run is needed at commit time — the bump is already
  applied and staged.
- **Target-repo backlog writes succeeded without a permission prompt/denial** — the dispatch
  instructions flagged these as "permission prompts expected; if a write is denied, document it as
  an operator-owed deviation." No denial occurred; both writes landed cleanly, so no operator-owed
  fallback was needed for this step.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Nexus repo commit + `../omni` twin commit are outstanding | low | team-lead | `git status --short` shows the bump + all content edits staged-but-uncommitted in both repos | Plan-sanctioned deviation (see above), not a defect — flagging so the team lead doesn't miss the two-repo commit sequence CLAUDE.md requires |

## KB Changes

None — `docs/kb/` has no entries covering skill structure (tech-spec: "KB Impact: None").

*Status: COMPLETE — developer, 2026-07-10*
