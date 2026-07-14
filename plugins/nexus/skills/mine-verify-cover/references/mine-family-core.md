# Mine-family core reference

Shared content for the eight-member mine family (`mine-verify-cover` incl. its `mine-from-spec`
mode, `mine-verify-repo`, `mine-reference-model`, `mine-semantic-model`, `mine-design`, `mine-algorithm`, `mine-verify-flows`). Each sibling SKILL.md replaces its restated copy
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
| `mine-semantic-model` (ships in nexus-analytics) | one datasource area | live schema + read-only data probes | probe re-execution + KB grounding + operator interview | semantic-model bundle + provenance ledger |
| `mine-design` | one class/function | complexity census (cause-classified branches) | two-tier judge (grounding kill, then pairwise) | design-brief |
| `mine-algorithm` | one algorithm-shaped unit | BR registry (conformance oracle) | row-by-row deviation classification + deviation-triggered row re-grounding | algorithm-brief |
| `mine-verify-flows` | one app's user flows | routes/screens/blocs + on-device output documents | sabotage check + twice-green golden gate | flow registry + golden-gated flow tests |

The family invariant is unchanged across all eight: bounded unit -> clean-room miners -> consolidate
-> skeptic verify -> graded/verified registry. What changes per member is the unit, the ground
truth, and the failure mode the gate kills.

## Routing boundary — algorithm-shaped vs rule/mapping-shaped

The two prescription siblings — `mine-design` (prescribes *structure*: patterns/principles) and
`mine-algorithm` (prescribes *computation*: canonical algorithms) — split one unit population along
a single boundary that is **authored here once** and cited, never restated per skill:

- A unit is **algorithm-shaped** when it is an implementation of a computational problem — its
  inputs, outputs, and objective function are abstractable from the code (an assignment, a
  clustering, a sequence alignment, a budgeted selection). These route to `mine-algorithm`.
- A unit is **rule/mapping-shaped** when its complexity is braided business rules, type/config
  forks, format mapping, or defensive plumbing — structure to be redesigned, not a named algorithm
  to be recognized. These stay with `mine-design`.

`mine-design`'s stage-1 census is the routing point: an algorithm-shaped unit it encounters is
handed to `mine-algorithm`; `mine-algorithm` hands a unit whose complexity turns out to be
rule/mapping-shaped back to `mine-design`. The two are not mutually exclusive on a mixed unit — a
class can carry a rule-shaped shell around an algorithm-shaped core, and each sibling prescribes for
its own portion.

**On drift, supersede this section — never fork the definition into a skill.** This paragraph is the
single owner of the boundary; a sibling that needs to state it points here.

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

**Chunked writes for a large artifact.** A stage agent producing a large output — a high-branch
census, a big rule KB, a whole-repo triage registry — **appends it incrementally, per section or
per cause-group, rather than composing the entire artifact in one write.** A single oversized write
risks output truncation near the ~64k output ceiling, and because the orchestrator holds no
filesystem it cannot re-assemble a truncated write — so the writing agent owns the chunking.

**Per-skill staging (the delta each sibling keeps):**
- `mine-verify-cover` / `mine-from-spec` mode — clean-room miners in parallel, then
  consolidate+skeptic; stages interleave with plan-authoring (planning never blocks on the run).
- `mine-verify-repo` — the metric agent runs first, then the per-area miners in parallel, then
  consolidate+skeptic.
- `mine-reference-model` — five dimension extractors in parallel (default), then ONE
  consolidate+skeptic (Entry-6 sizing note: one consolidate+skeptic held at roughly 145 findings on
  the debt-mine pilot; a virtues run yields far fewer rows, so this is comfortably bounded).
- `mine-semantic-model` (ships in nexus-analytics) — phases run sequentially in the main session;
  the Phase-4 interview is **operator-in-loop** (the family's one in-loop human gate — never
  delegable as one background run); probe batches (Phase 2) may background between interview
  points.
- `mine-verify-flows` — 3 clean-room flow miners in parallel, then consolidate+skeptic, then the
  Cover agent per selected flow; the orchestrator computes the sabotage gate from raw runner
  output (the golden-bless hop is the flow family's human-in-loop point).

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
`mine-semantic-model`'s gate is likewise a different mechanism (probe re-execution + Audit-mode
refutation legs + interview provenance — its origin enum is its verdict grammar) and is not a
consumer of this must-RUN protocol section. `mine-verify-flows`' Verify stage is a **code
re-trace for reachability** — it reuses the CONFIRMED/WRONG/IMPRECISE verdict grammar but a
reachability verdict is a code-reading claim, not a runnable evidence command, so it is not a
consumer of the command-re-execution must-RUN enforcement either (the same treatment the code-arm
gets).

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
