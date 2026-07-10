# Mine-family core reference

Shared content for the four-member mine family (`mine-verify-cover` incl. its `mine-from-spec`
mode, `mine-verify-repo`, `mine-reference-model`). Each sibling SKILL.md replaces its restated copy
of the sections below with a short load-bearing pointer to this file, plus ONLY its own per-skill
deltas. This file has no frontmatter — it is a reference, not a skill, and is never Skill-tool
loaded directly.

## The mine family

| Mine | Unit | Ground truth | Gate | Output |
|------|------|-------------|------|--------|
| `mine-verify-cover` | one class | code | mutants | rules KB + gated suite |
| `mine-from-spec` (mode) | one spec | spec text | skeptic-vs-text | spec-rules |
| `mine-verify-repo` | one repo (debts) | git metrics + code | hotspot rank + re-execution | `docs/tech-debt/{area}.md` |
| `mine-reference-model` | one reference repo (virtues) | reference source | skeptic re-execution (invented-virtue kill) | `docs/reference-model.md` in the consuming repo |

The family invariant is unchanged across all four: bounded unit -> clean-room miners -> consolidate
-> skeptic verify -> graded/verified registry. What changes per member is the unit, the ground
truth, and the failure mode the gate kills.

## Execution topology (who runs what)

This method is **multi-agent by design** (parallel clean-room miners, then a fresh skeptic) and
**a subagent cannot orchestrate it** — subagents have no Workflow/agent/parallel primitives, and a
subagent spawning further agents is the ADR-21 breach vector. So:

- The **orchestrator is the session that owns spawning** — the team lead in team mode; the main
  session (PO or architect persona) in standalone mode.
- The orchestrator runs the run as **staged background agents**, exactly like pipeline stages: the
  clean-room miners/extractors in parallel (background), then on their completion a
  consolidate+skeptic agent (background).
- Miner and skeptic stages spawn as **`general-purpose` agents** carrying the run's stage prompts —
  they are method stages, not pipeline roles (no pipeline `subagent_type`, no custom names).
- "Launch the run" always means "orchestrate its stages" — never "delegate the whole run to one
  background agent": a single agent cannot preserve miner/skeptic independence.

**Per-skill staging (the delta each sibling keeps):**
- `mine-verify-cover` / `mine-from-spec` mode — clean-room miners in parallel, then
  consolidate+skeptic; stages interleave with plan-authoring (planning never blocks on the run).
- `mine-verify-repo` — the metric agent runs first, then the per-area miners in parallel, then
  consolidate+skeptic.
- `mine-reference-model` — five dimension extractors in parallel (default), then ONE
  consolidate+skeptic (Entry-6 sizing note: one consolidate+skeptic held at roughly 145 findings on
  the debt-mine pilot; a virtues run yields far fewer rows, so this is comfortably bounded).

## Marginal-budget rail + report-on-halt

- **Budget cap** — halt when the run's **marginal** spend exceeds the ceiling. `budget.spent()` is
  the shared session pool, NOT the run's cost; **capture the start** spend and gate on the delta, or
  a run fired late in a long session trips on the session's prior spend.
- **Report on halt** — every stop writes a report naming the stop reason. Never silently exit green.

Each sibling keeps its own skill-specific prohibitions list (the AC-anchored "four prohibitions"
glance list) — this rail is the shared mechanism, not the full safety-rails section.

## Skeptic protocol

- The skeptic **RUNS** each finding's/pattern's evidence command and compares output to the claim —
  re-reasoning without execution is forbidden in the stage prompt AND structurally checked: a
  verdict row must carry the re-execution output excerpt, and the orchestrator **drops any verdict
  without one** (a prompt-only obligation gets a real enforcement).
- Verdict grammar: **CONFIRMED / WRONG / IMPRECISE** (IMPRECISE = the phenomenon exists, the stated
  scope/number is off — a corrected statement is required).
- **The vacuous-evidence check (harvested pilot lesson)** — the skeptic also validates that an
  evidence command CAN fail: a zero-hit/absence claim whose grep is structurally unable to match
  (the pilot's `Services[\\/]\K…` kill — sibling-relative paths never contained the literal) is
  WRONG, not CONFIRMED; re-prove with a command that would fire on a real violation.
- **The merged-row audit note (harvested pilot lesson)** — when consolidation merges overlapping
  findings, the surviving row records what was merged (`Merged from: {ids}`), the pilot's working
  pattern.

`mine-verify-cover`'s code-arm Verify stage is a **different mechanism** (mutation-gated code
re-check, not this must-RUN protocol) and is not a consumer of this section; `mine-from-spec`'s
distinct `verified | ambiguous` grammar likewise stays in `mine-verify-cover` untouched.

## Fact/judgment doctrine

A rule, finding, or pattern whose claim cannot be phrased as a reproducible check (a grep, a metric
threshold, a re-executable command, a dependency-direction query on the graph) is a **judgment, not
a fact** — it never earns a CONFIRMED verdict of its own. An unreproducible claim may ride along
only as a note attached to a fact (a repo mine's `lens-note`, a class mine's KB context) — never as
a standalone confirmed entry. Each skill's own row schema (the finding/rule/pattern fields) stays
defined in that skill.

## Registry invariants + refresh outcome grammar

**Invariants**, carried unchanged from ADR-43/45/49: per-row provenance, `last_verified`, rows are
**never deleted** (disposition/verdict flips, the record stays), every write
**appends a changelog entry**, a re-run against unchanged input is **idempotent**. Each skill's own
artifact schema/path (`docs/business-rules/`, `docs/tech-debt/{area}.md`, `docs/reference-model.md`)
stays defined in that skill.

**Refresh outcome grammar** (run 2+, re-verify existing rows against the git delta since
`last_verified`):
- **resolved** — the evidence command no longer reproduces -> disposition `resolved` + re-stamped
  `last_verified`.
- **still-active** — no field change except the re-stamped `last_verified`.
- **superseded** — restructuring moved the problem -> the old row's disposition flips to
  `superseded` (kept, never deleted), a fresh row is mined citing the old row's id in its
  provenance.

Each skill keeps its own refresh **triggers** and disposition/verdict vocabulary; this is the
shared grammar the triggers map onto.

## Kickoff checklist (new-target runs, B4)

Before launching any mine-family run on a **NEW target** (a repo or class it hasn't scanned
before), confirm all four up front:

1. **Tool preflight confirmed** — the target's toolchain (test runner, mutation tool, Code
   Maat/lizard, or the metric-layer preflight) is verified present, or the documented fallback is
   consciously accepted.
2. **Expected survival rate stated up front** — a rough mined->confirmed expectation, so a run
   that comes back far off that number gets a second look before the registry is trusted.
3. **stop-budget set** — the marginal-spend ceiling this run halts at (see the budget rail above).
4. **Run-report location named** — where the run's report (areas scanned/skipped, survival rate,
   registry delta) will land, before the run starts.

**Wired-but-advisory:** each sibling skill carries one pointer line at its run-launch area ("on a
NEW target, walk this checklist first") — discipline without an enforced gate.
