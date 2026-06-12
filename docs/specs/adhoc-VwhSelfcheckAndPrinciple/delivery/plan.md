# VWH Adoptions — Allocation Principle + Selfcheck Extensions

**Feature Spec:** None (brief: `docs/proposals/vwh-adoptions-2026-06.md` §A1 + §A3 Tier 1 —
owner-triaged 2026-06-12, combined-pass decision recorded there)
**Slug:** `adhoc-VwhSelfcheckAndPrinciple`
**Intent class:** Scoped (1 shipped agent file + 1 architecture doc + dev-repo test/script additions)
**Release tier:** PATCH (default policy — the learner edit refines an existing step; owner may escalate)

## Context

Two accepted adoptions from the VWH evaluation, combined into one pass (owner decision):
**A1** names the allocation principle the system already practices and wires it into the learner's
classification; **A3 Tier 1** extends the existing T1 lint suite (`tests/lint/`) with the wiring
checks the VWH dive identified as genuine gaps — the proposal's original "build a selfcheck" scope
was corrected during Phase 1: a hard-gated suite already exists, so this pass *extends* it.

Phase-1 verified facts the steps rely on:
- The ADR-14 duplicated "Slug / paths / caps" blocks are **byte-identical across all 8 carrier
  agents** (md5-verified — architect's 3-file check extended to all 8 by the critic review) —
  strict equality is the right lint.
- `plugins/nexus/commands/` has 9 files vs 8 agents: `backlog.md` is **hand-authored** (not
  generated from an agent) — the bijection lint must allowlist it.
- `gen-commands.mjs` does not delete orphaned commands — regen+diff alone cannot catch a command
  whose agent was removed; the bijection lint covers that direction.
- Salience measurement (2026-06-12, recorded in `questions.md` Q1): **8 of 19 shipped agent/rule
  files fail even generous ceilings** (worst block: 1034 words, `rules/agents-workflow.md`) →
  salience ships **report-only**; failing ceilings arrive with A2 after declutter calibration.

## Scope

**In scope:** the named principle section (architecture README) + learner locus-question (A1); four
T1/script additions: ADR-14 block-equality lint, hooks duplicate-matcher lint, agents↔commands
bijection lint, salience report script + parse-only lint; a local `selfcheck.mjs` aggregator;
`tests/README.md` documentation; proposal-doc cross-references; one PATCH release.

**Explicitly out of scope:**
- **A2 (declutter skill), A4 (nudges), A5 (decision log), A6 (lessons voice)** — accepted but
  separately sequenced (proposal doc).
- **Salience failing thresholds** — Q1 resolved by measurement: report-only this pass.
- **CI workflow changes** — CI already runs every underlying check; the aggregator is local UX
  only. `.github/workflows/plugin-release-check.yml` is untouched.
- **Evals (T3/T4) and `tests/red/`** — unrelated tiers.
- Any `nexus-dotnet` change.

## Skill Mapping

| Step | Skill | Disposition | Feature-Specific Inputs | Gap? |
|------|-------|-------------|------------------------|------|
| 1 | (none) | — | Exact insertion text below; dev-repo ADR record is exempt from create-architecture-doc canonicalization (its own header note) | Doc edit — no covering skill |
| 2 | (none) | — | Exact before/after text below for `learner.md` step 2 | Agent-prose edit — no covering skill |
| 3 | (none) | — | Block registry: `Slug / paths / caps` extraction pattern; extend `tests/lint/convergence.test.mjs` | Test code — pattern ref: convergence.test.mjs header |
| 4 | (none) | — | Duplicate `(event, matcher)` rule + bijection with `backlog.md` allowlist | Test code — pattern ref: skill-refs.test.mjs |
| 5 | (none) | — | Metrics: bold-line density, max-block words, total words; agents/ + rules/ scope; `--json` flag | Script — no covering skill |
| 6 | (none) | — | Aggregator command list (mirrors CI steps) + `tests/README.md` row | Script — no covering skill |
| 7 | (none) | — | Proposal-doc A1/A3 rows → this slug | Doc-only |
| 8 | release-plugin | Follow | PATCH; regen commands (learner); sync omni; one commit with steps 1–7 | |

Most steps are **None** — dev-repo machinery and the plugin's own prose, for which no generative
skill exists (same honest disposition as adhoc-PipelineHardening). Step 8 Follows `release-plugin`.

## Catalog disposition — every proposal §A3 Tier-1 item, accounted for

The pass "extends, not builds" — this table is the auditable boundary (critic HIGH-3). The
developer implements **only** the NEW rows; "covered" rows must NOT be re-implemented.

| Catalog item (proposal §A3 Tier 1) | Disposition | Where |
|---|---|---|
| #1a agent → non-drifted command | **Covered (existing)** | `frontmatter.test.mjs:51` + CI regen-diff step |
| #1b command → agent (orphan commands) | **NEW** | Step 4.2 |
| #1c skill dirs have well-formed SKILL.md | **Covered (existing)** | `frontmatter.test.mjs:34` |
| #2 frontmatter completeness | **Covered (existing)** | `frontmatter.test.mjs:17` |
| #3 hook command targets resolve | **Covered (existing)** | `frontmatter.test.mjs:64` |
| #3 no duplicate (event, matcher) | **NEW** | Step 4.1 |
| #3 env-var references resolve | **NEW** | Step 4.3 |
| #4 `/skill-name` references resolve | **Covered (existing)** | `skill-refs.test.mjs` (all three tests) |
| #4 agent-name references resolve | **NEW** | Step 4.4 |
| #5 ADR-14 duplicated blocks identical | **NEW** | Step 3 |
| #5 artifact section-names pinned where consumers grep | **Partial / deferred** | Partially exists (`convergence.test.mjs` pins verdict vocab + Carry-Over heading); broader pinning deferred — grown TDAD-style from real drift incidents, or with A2's literal-drift work. Not in this pass. |
| #6 manifest validity (plugin.json ↔ CHANGELOG, omni sync) | **Covered (existing)** | `release.test.mjs:20` + `gen-omni --check` (Step 6 wires it into the aggregator only) |
| #7 salience warnings (non-blocking) | **NEW** | Step 5 (report-only per Q1) |
| test-shape: live repo always passes | **NEW (per lint)** | Steps 3/4/5 Accept criteria |
| test-shape: committed negative tests | **Deviation (deliberate)** | House convention is *uncommitted* induced-failure checks (`tests/README.md`: temp copies only; TDAD: grow from real failures). The VWH committed-fixture pattern is intentionally not adopted; red checks are manual-local in the Accept criteria. |

## Domain Model / Data Model Changes

None.

## Implementation Steps

> **Read-first for the developer:** `docs/proposals/vwh-adoptions-2026-06.md` (§A1, §A3 Tier 1 —
> rationale and check catalog) and `tests/README.md` (house testing conventions: real-tree lint,
> temp-sandbox unit, zero dependencies, `node:test`).

### Step 1 — Name the allocation principle in the architecture record

**File:** `docs/architecture/README.md`
Insert a new section between the `## Platform constraints` section's closing `---` and `## ADR-1`,
and add a Contents entry after the "Platform constraints" Contents line. **Exact anchor (binding —
GitHub's slugger turns the em-dash into a double hyphen):**
`- [The allocation principle — cheapest correct locus](#the-allocation-principle--cheapest-correct-locus)` **Insertion text (binding in content; tighten wording freely,
don't drop a clause):**

```markdown
## The allocation principle — cheapest correct locus

Every behavior lives at one of four loci, ordered by resistance to decay: **deterministic script**
(hooks, lints, CI gates) > **skill / rule text** (load-bearing convention the model can't reliably
re-derive) > **agent prompt** > **model judgment** (the default home — maximally adaptive,
re-derived each run). Place each responsibility at the **cheapest locus that cannot decay**, and
move it in both directions as evidence accumulates:

- **Harden** (judgment → prose → script) only what agents demonstrably keep dropping. The promotion
  ratchet runs *fluid → lessons → prose → gate*; it never promotes on a single data point — the
  learner's 2-occurrence threshold is this rule.
- **Prune** (prose → judgment): every line of agent prose is a standing bet that instruction beats
  fluid judgment there. A bet that stops paying gets deleted — that shifts the responsibility back
  to intelligence, it doesn't destroy it.

ADR-7 (failures must be unreachable) and ADR-23 (the meta-loop ends in a deterministic gate) are
this principle's two hardest instances. Prose that knows it should become a gate says so inline.
(Independently converged with VWH's "golden triangle" — `docs/proposals/vwh-adoptions-2026-06.md` §A1.)
```

Also add a one-line pointer in **ADR-7** and **ADR-23** (e.g. "*An instance of the
[allocation principle](#the-allocation-principle--cheapest-correct-locus).*" as a closing line).
**Accept:** section present; Contents links resolve; both ADR pointers present; no other section
reflowed.

### Step 2 — Learner classifies by locus

**File:** `plugins/nexus/agents/learner.md`
In `## Consolidation Workflow` step 2, change the word "twice" to "three ways" (note: in the
source only "Classify" is bold — "twice" is plain text) and append a third axis. **Before (current line 16):**
> 2. **Classify** each item twice: (a) by target — CLAUDE.md, convention, agent file, rule, or skill; (b) by **channel** — …

**After (binding in content):** keep (a) and (b) verbatim, append:
> ; (c) by **locus** — per the allocation principle (architecture README): should this become a
> **deterministic check** (hook/lint/CI — for what agents keep dropping), **prose** (rule/skill
> text — load-bearing convention), or stay **with judgment** (no promotion)? Prefer the cheapest
> locus that cannot decay; a lesson restating what a gate already enforces is a prune candidate,
> not a promotion.

**Accept:** the classify step carries all three axes; file stays lean (this is a ~6-line growth on
a 55-line file — do not add a new section).

### Step 3 — ADR-14 block-equality lint

**File:** `tests/lint/convergence.test.mjs` (extend — its header already owns ADR-14 drift;
**developer's call** to split into a new file if it reads better).
Add a designated-identical-blocks registry: block name → extraction pattern → carrier files. First
entry: the `**Slug / paths / caps` block (from its heading line through the `- **Cycle caps**`
bullet), carriers = every `plugins/nexus/agents/*.md` that contains the heading. Test asserts all
extracted blocks are **string-identical** (first divergent file named in the failure message).
**Accept:** test green on current tree (Phase 1 verified identity for 3 carriers — the test
determines the full carrier set itself, never a hand-curated list); a deliberate one-character edit
to one carrier (local check, not committed) turns it red naming the file.

### Step 4 — Hook-wiring + agents↔commands bijection lints

**File:** new `tests/lint/wiring.test.mjs` (the existing hooks-exist check lives in
`frontmatter.test.mjs:64` — leave it there; a new file is the cleaner home for these).
1. **Duplicate matcher:** for each plugin's `hooks/hooks.json`, no two entries under the same event
   share an identical `matcher` value (treat absent matcher as `"*"`). **Skip plugins with no
   `hooks/hooks.json` — `nexus-dotnet` ships none** (critic MED-1).
2. **Orphan commands (command → agent direction ONLY):** every `plugins/nexus/commands/{name}.md`
   has a matching `agents/{name}.md`. The forward direction (agent → command) is already asserted
   by `frontmatter.test.mjs:51` — do NOT re-implement it (critic MED-2). **Allowlist (DO-NOT-TOUCH
   carve-out): `commands/backlog.md`** is hand-authored with no agent — assert it stays allowlisted,
   don't delete it.
3. **Env-var references resolve:** every `${user_config.X}` placeholder in a `hooks.json` command
   string corresponds to a declared key in that plugin's `.claude-plugin/plugin.json` `userConfig`
   object (current keys, verified: `security_mode`, `token_audit`).
4. **Agent-name references resolve:** every `subagent_type="X"` string and every `/nexus:X` (or
   `nexus:X` persona/command) reference in `plugins/nexus/{agents,rules,skills}/**/*.md` resolves
   to `agents/X.md` — with an explicit allowlist for platform subagent types that are not nexus
   agents (at minimum `Explore`, `general-purpose`; extend deliberately, named in the test).
**Accept:** all four green on current tree; removing a command file, duplicating a matcher, or
typo'ing a `${user_config.*}` key in a temp copy fails the right assertion (local check).

### Step 5 — Salience report (report-only; Q1)

**Files:** new `scripts/salience-report.mjs`, new `tests/lint/salience.test.mjs`
Script: for every `plugins/nexus/agents/*.md` and `plugins/nexus/rules/*.md`, print one row —
lines, bold-line density (lines containing `**…**` ÷ lines), max-block word count, total words.
**Measurement definition (binding — the Accept numbers depend on it, critic MED-4):** blocks =
spans split on blank lines (`\n\s*\n`); words = whitespace-split tokens (`\S+`), markdown
punctuation counted as part of the token. Human table to stdout; `--json` for tooling. Lint test: script executes,
JSON parses, covers every agent/rule file — **no thresholds** (Q1: 8/19 files fail any sane ceiling
today; ceilings arrive with A2).
**Accept:** report numbers match the Phase-1 measurement for spot-checked files (architect.md
max-block 574; agents-workflow.md 1034); lint green.

### Step 6 — Local selfcheck aggregator + docs

**Files:** new `scripts/selfcheck.mjs`; `tests/README.md` (add a row + command)
One local command that runs, in order, with a PASS/FAIL line per check and nonzero exit on any
failure: (1) `node --test tests/lint tests/unit`; (2) gen-commands drift (regen + `git diff
--exit-code plugins/nexus/commands` — mirrors CI); (3) `gen-omni --check`; (4) `bump-plugin --check
--base origin/main` (base overridable via flag — **developer's call** on flag shape); (5) salience
report (informational, never fails). Scannable summary footer (`selfcheck: N/M passed`).
**Accept:** single command works from repo root on a clean tree; each induced failure mode flips
exactly its own line; `tests/README.md` documents it as dev-repo machinery (never shipped).

### Step 7 — Proposal cross-references

**File:** `docs/proposals/vwh-adoptions-2026-06.md`
Mark §A1 and §A3 Tier 1 as delivered by this slug (one line each: "Delivered:
`adhoc-VwhSelfcheckAndPrinciple`, {date}"). Leave A2/A4–A6 untouched.

### Step 8 — Release (Follow `release-plugin`)

Regenerate commands (`node scripts/gen-commands.mjs nexus` — learner.md changed), sync the omni
twin (`gen-omni`), bump **PATCH**, single commit containing steps 1–7 + bump. CI must pass as-is
(no workflow edits).

## Cross-Service Changes

None.

## Migration Notes

None.

## Testing Strategy

- The pass *is* mostly tests; each new lint's accept criterion includes a local red check
  (deliberate defect → right assertion fires, not committed).
- `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green before commit (the CI gate).
- `scripts/selfcheck.mjs` run end-to-end once on the final tree.
- House conventions hold: real-tree lint assertions, zero dependencies, no package.json,
  temp copies for induced-failure checks only.

## KB Impact

None (dev repo has no `docs/kb/`).

## Open Questions

None — Q1 resolved by measurement (see `questions.md`).

## Plan Review

Critic review (Mode 2, code-grounded, 2026-06-12): **REVISE → fixes folded**. The critic verified
every load-bearing factual claim (script flags, bijection counts, block identity extended to all 8
carriers, hooks matcher state, salience numbers independently reproduced) and confirmed Q1's
resolution sound. Findings and their resolutions:
- **HIGH-3 (root):** the extend/covered/deferred boundary lived outside the plan → the **Catalog
  disposition** table above is the fix; HIGH-1 (agent-name refs) and HIGH-2 (env-var refs) became
  Step 4.4 and 4.3 rather than deferrals (both cheap, closed-set checks).
- **MED-1** skip-if-absent for nexus-dotnet hooks.json → Step 4.1 clause. **MED-2** bijection
  scoped to command→agent only → Step 4.2. **MED-3** exact double-hyphen anchor pinned → Step 1.
  **MED-4** measurement definition pinned → Step 5.
- **LOW-1** carrier count corrected to 8 (Context). **LOW-2** stray bold in the Step 2 quote fixed.
- **Gap notes:** catalog #5's section-name half explicitly deferred (disposition table); the
  committed-negative-test deviation named as deliberate (disposition table, last row).
