# Section-Addressable Reads & Read-Discipline Extension

**Feature Spec:** `docs/specs/adhoc-SectionAddressableReads/definition/spec.md`

## Context

A 3-day live audit (`docs/kb/research/plugin-token-optimization.md`, 2026-06-20) found prompt
caching healthy in KG/SR (92–98%) — the rules block is not the spend. The spend is agents reading
**whole** artifacts/docs when they need a section, ballooning contexts to 150–250K; `nexus:critic`
is the clearest case at 59% cache efficiency. This feature extends **ADR-22 (round-scoped read
discipline)** with a second dimension — *read the section you need*, not just *read once* — and is a
prose/skill/agent change only (no source behaviour, no domain model).

The load-bearing design fact: a spawned subagent sees **only its own agent file** (ADR-2 #2), so the
targeted-read rule must be **duplicated into the heavy-loader agent files** (ADR-14), not only stated
in the shared rule. That is why Step 4 exists.

## Scope

**In:** the canonical Read-Discipline rule, the fixed-heading format skills, the heavy-loader agent
files (critic/reviewer/architect), `kb-navigation`, a minimal measurement harness, an ADR-22
amendment, and the release bump.

**Out (explicit):**
- **Source-file code-map / AST reads** — the deferred follow-up slice (the unverified ~80% claim).
- **The optional size-nudge hook** (`read-tracker.js` firing on a first large read) — deferred per
  the allocation principle: harden to a hook only what agents demonstrably keep dropping; the prose
  rule is new with no decay evidence (promotion ratchet never promotes on one data point). Measure
  first; promote only if it decays.
- **#1 cache-stable injection** — dropped (audit: already optimal).
- **#3 distilled-return contract** — separate slice. *Why deferred:* different axis (return-size, not
  read-size), team-mode only, estimated-not-measured — sequenced behind #2's audit-proven win. Revisit
  after #2 ships + the operator post-measure (see research entry's Recommendation).
- Any lossy compression/truncation of artifacts.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | ADR-22 "Extended" note text | |
| 2 | (none) | — | no | agents-workflow Read Discipline; new bullet + fallbacks | |
| 3 | (none) | — | no | 5 fixed-heading skills + questions-format exclusion; run `skill-lint.mjs` | |
| 4 | (none) | — | no | critic/reviewer/architect insertion points; run `gen-commands.mjs nexus` | |
| 5 | (none) | — | no | kb-navigation step 4 extension | |
| 6 | (none) | — | yes | parser script + pinned fixture + operator procedure | Log to lessons.md |
| 7 | release-plugin | Follow | no | PATCH bump; both plugins touched | |

All edit-prose steps are `Skill: None` — no *pattern* skill covers "edit a rule/agent file." Step 3
edits shipped **skills**, so its acceptance is the ADR-23 form gate (`skill-lint.mjs` exits 0), not a
skill invocation. Step 7 follows `release-plugin` (ADR-9). The all-`None` steps still carry the TDD
column (template rule); only Step 6 produces testable code.

## Domain Model Changes
None — this is a documentation/rule/skill feature.

## Data Model Changes
None.

## Implementation Steps

### Step 1 — Amend ADR-22 with the section-targeting dimension
**Satisfies:** AC1 (records the decision)
- File: `docs/architecture/README.md` (ADR-22, lines 603–616).
- Add an **`**Extended (this release).**`** note (mirror the ADR-23 "Extended" style) stating: the
  read rule gains a *section-targeting* dimension — for a large or multi-section input, read the
  section you need (locate heading → offset/limit) rather than the whole file; non-lossy, whole-read
  fallback preserved. Note it is a two-way-door amendment, not a new ADR (ADR-25).
- Accept: `grep -n "Extended" docs/architecture/README.md` shows the new note under ADR-22; it
  references the locate-then-read pattern and the whole-read fallback.

### Step 2 — Extend the canonical Read-Discipline rule
**Satisfies:** AC1, AC5
- File: `plugins/nexus/rules/agents-workflow.md`, `## Read Discipline (all agents)` (lines 108–118).
- Add ONE bullet after the "Sanctioned re-reads" bullet: for a **large file (> ~400 lines) or a
  known multi-section artifact**, read the section you need — locate the heading (`grep '^#'`), then
  `Read` with `offset/limit` — instead of the whole file. This is *targeting*, not re-reading; it
  composes with the existing "chunked reads = one logical read" exemption.
- State the **fallbacks** (each resolves to a wider/whole read, so nothing is lost): (a) no `^#`
  match → whole-read; (b) ambiguous/duplicate heading → whole-read rather than guess; (c) one
  oversized section → heading-targeting's floor is that section, `offset/limit` within it is the
  escape.
- Accept: the new bullet is present; it names the locate-then-read mechanism AND all three
  fallbacks (AC5's "whole-read remains available"). Keep the section's total length proportionate —
  one added bullet, not a rewrite.

### Step 3 — Document fixed-heading section maps in the format skills
**Satisfies:** AC2
- Files (add a one-line **Section map (targeting index)** listing the artifact's fixed `##` headings,
  as the set agents target):
  - `plugins/nexus/skills/review-format/SKILL.md` — `## Step 1 — Done-Check`, `## Step 2 — Code Review`
  - `plugins/nexus/skills/implementation-format/SKILL.md` — Files Created / Files Modified / Key Decisions / Skills Used / Carry-Over Findings / Deviations from Plan
  - `plugins/nexus/skills/summary-format/SKILL.md` — the 5 fixed headings
  - `plugins/nexus/skills/lessons-format/SKILL.md` — the fixed **per-role** headings. **Caveat
    (critic F2):** target the role heading only — the `### Improvement Proposal` sub-heading repeats
    (it is the spec's own duplicate-heading fallback case), so it is not a targetable anchor.
  - `plugins/nexus/skills/create-implementation-plan/references/plan-template.md` — the 11 fixed headings
- **Note (critic F2 — ratified divergence):** this is **5** skills; spec AC2/§Scope-3 named **4**
  (review/impl/summary/plan). `lessons-format` is added because its per-role top-level set is fixed and
  targetable — an architect-ratified extension consistent with the spec's intent, recorded here so the
  done-check reads it as a decision, not drift.
- **Exclude `questions-format`**: add a one-liner that its headings are runtime-numbered (`## Q{N}`),
  so targeting is by the **grep step alone**, not a documented set. `communication-log.md` is likewise
  out — it has **no format skill** to annotate (one `## Messages` catch-all), so there is nothing to
  document; the grep step + size trigger cover it.
- Accept: each fixed-heading skill has the section-map line (`grep -n "Section map"`); `questions-format`
  states the variable-heading exclusion; **`node scripts/skill-lint.mjs` exits 0** (ADR-23 form gate);
  edits via Write tool, UTF-8 no BOM.

### Step 4 — Duplicate the targeted-read rule into the heavy-loader agent files
**Satisfies:** AC3
- A subagent sees only its own file (ADR-2 #2), so the rule must live in each heavy loader (ADR-14).
  Add a one-line targeted-read pointer at each named insertion point:
  - `plugins/nexus/agents/critic.md` — `## Tool Usage` (≈156–158): the critic loads spec+plan+product
    docs; direct it to read the **sections under review**, not whole files, for large inputs.
  - `plugins/nexus/agents/reviewer.md` — `## Before Reviewing` (≈13–19): same, for large plan/impl/source.
  - `plugins/nexus/agents/architect.md` — `## Read Discipline` (≈104–111): add the section-targeting line
    alongside the existing "read once" rules.
  - `plugins/nexus/agents/po.md` — its Research / Question-Answering reads: the PO is spawned as a
    subagent, **cannot Read source** (`po.md` toolset), and loads large specs + product docs + sibling
    specs — squarely the artifacts this feature targets. **(Added per critic F1 — see Plan Review.)**
- AC3's spec text names critic/reviewer/architect as the illustrative core; the rule applies to **every
  artifact-loading subagent**, so PO is in (solo is *out* — it reads 1–3 files as their author, where a
  whole-read is correct; developer's big reads are source, owned by the deferred code-map slice).
- Each line points to the canonical rule (don't restate it in full — ADR-14 one-line duplication).
- **Regenerate commands:** `node scripts/gen-commands.mjs nexus` (agent edits → commands; CLAUDE.md) —
  this regenerates **all** nexus commands, so the four touched agents' commands ride along.
- Accept: each of the **four** agent files contains the targeted-read line (`grep -n` them); the
  regenerated `plugins/nexus/commands/{critic,reviewer,architect,po}.md` reflect it (git diff shows the
  regen); no hand-edit of generated commands.

### Step 5 — Extend kb-navigation with section-targeted reading
**Satisfies:** AC3
- File: `plugins/nexus/rules/kb-navigation.md`, numbered steps (lines 5–8).
- Extend step 4 ("Only then read the specific source files you need") → "...read the specific
  **section** you need (locate by heading) for a large entry, not the whole file."
- Accept: step 4 names section-targeting; file stays short (it's 19 lines — keep it so).

### Step 6 — Minimal measurement harness (baseline now, post-measure operator-owed)
**Satisfies:** AC4
- Commit the audit parser as a repo dev-tool: `scripts/measure-read-cost.mjs` — read a
  `token-usage.jsonl`, filter by agent + time window, report absolute `cache_creation`, `cache_read`,
  efficiency. **(critic F4)** Port the parsing logic **from
  `plugins/nexus/skills/consumption-report/SKILL.md`** (the source of truth — there is **no** standalone
  `cache-sweep` script to "reuse"; that name is prose only). Dev-repo tooling, **not** shipped to consumers.
- **Pinned fixture (critic F3 — name it, don't say "a fixed pair"):** the critic Mode-2 review of **this
  slice's own** spec+plan — `docs/specs/adhoc-SectionAddressableReads/definition/spec.md` +
  `delivery/plan.md` — a stable, representative heavy-load input.
- **Operator procedure (record verbatim in `implementation.md`):**
  1. Baseline (now, pre-change): `be critic` Mode-2 over the pinned pair, then
     `node scripts/measure-read-cost.mjs .claude/audit/token-usage.jsonl --agent critic --since <run-start-ts>`;
     record the absolute `cache_creation`.
  2. After (post-bump, changes live — needs `/reload-plugins` or `/plugin update`): same two commands;
     success = absolute `cache_creation` drops with no loss of review quality.
  This is an **`OPERATOR ACTION REQUIRED`** measurement (live agent run + reload), pre-authored so the
  done-check reads it `Deviated (valid reason)`, not Missing.
- Accept: `scripts/measure-read-cost.mjs` exists and runs against a real `token-usage.jsonl`
  (TDD: a `tests/unit` case feeding it the existing fixture
  `tests/fixtures/fleet/full/.claude/audit/token-usage.jsonl` and asserting the parsed totals); the
  baseline `cache_creation` figure + both verbatim commands are recorded in `implementation.md`.
  **Note:** AC4's success (the absolute drop) is validated by the operator post-bump, not at done-check —
  the done-check verifies the harness + baseline + recorded procedure exist, not the final delta.

### Step 7 — Release bump (same commit)
**Satisfies:** —
- Run the **`release-plugin`** skill (ADR-9): PATCH bump of `plugins/nexus` (rules/skills/agents
  changed). Bump `plugin.json` + `CHANGELOG.md`, validate, regenerate the omni twin
  (`gen-omni.mjs`), all in the **same commit** as the change.
- Follow `release-plugin`.
- Accept: `plugin.json` version incremented; `CHANGELOG.md` entry present; `claude plugin validate
  plugins/nexus --strict` passes; the bump rides in the implementing commit (not a follow-up).

## Cross-Service Changes
None.

## Migration Notes
None. The only "migration" is the release flow in Step 7 (bump + regen-commands + gen-omni), owned by
`release-plugin`.

## Testing Strategy
- **Repo verify set** (run after the edits): `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`
  + `node scripts/selfcheck.mjs` if present — must stay green. Watch the skill-lint test (every
  shipped skill lints) and the attended-unchanged golden test (rule-content edits should not perturb
  the attended-vs-unattended invariant; if they do, that's a real finding).
- **Step 6 unit:** parser fed the fixture `tests/fixtures/fleet/full/.claude/audit/token-usage.jsonl`
  asserts the computed `cache_creation` / efficiency totals.
- **AC4 in-the-wild (operator, post-bump):** pinned critic replay, diff absolute `cache_creation`.

## KB Impact
No `docs/kb/` *business* entries change. The evidence entry
(`docs/kb/research/plugin-token-optimization.md`) is already updated (the 2026-06-20 audit block) and
needs no further edit. No numbered KB step required.

## Open Questions
None. Resolved at the Phase-1 checkpoint: the size-nudge hook is **deferred** (allocation principle);
plan review is **critic Mode-2**.

## Plan Review

**Critic Mode-2 (2026-06-20) — verdict REVISE → resolved.** No Critical/High; 4 Minor, all folded in.
The critic confirmed the load-bearing calls: ADR-22 amendment (vs new ADR) is sound (two-way door),
the ADR-2/14 agent-file duplication is correct, and the AC2 section-map is not cosmetic.

| AC | Status (post-fix) | Where |
|----|-------------------|-------|
| AC1 | COVERED | Steps 1–2 |
| AC2 | COVERED | Step 3 (set divergence ratified) |
| AC3 | COVERED | Step 4 (+PO) + Step 5 |
| AC4 | COVERED (harness+baseline+procedure; drop is operator-validated post-bump) | Step 6 |
| AC5 | COVERED | Step 2 fallbacks |

Findings & dispositions:
- **F1 (most important) — PO omitted from Step 4.** Fixed: added `po.md` (a heavy-loader subagent that
  loads large specs/product docs); recorded AC3's named set as illustrative, with solo/developer
  exclusions justified.
- **F2 — Step 3 skill set diverged from spec's 4.** Fixed: kept `lessons-format` (fixed per-role set) as
  an architect-ratified extension, with the repeating `### Improvement Proposal` caveat; noted comm-log
  has no skill to annotate.
- **F3 — AC4 fixture unnamed.** Fixed: pinned this slice's own spec+plan as the fixture; both capture
  commands recorded verbatim in the operator procedure.
- **F4 — phantom `cache-sweep` "reuse".** Fixed: Step 6 + Testing now port the parser from
  `consumption-report/SKILL.md` (the real source) and cite the existing fixture log.
