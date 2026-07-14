---
name: mine-verify-repo
description: Discover, verify, and triage the technical debt of ONE repository — a deterministic bot-filtered git-history metric layer ranks hotspot areas, clean-room miners extract fact-shaped findings per graphify area across four lenses, a fresh skeptic re-executes each finding's evidence before it counts, and confirmed findings are written to a docs/tech-debt triage registry that feeds the ad-hoc refactoring lane. Stack-neutral method, free tooling only (git log, Code Maat, lizard). Use when you need a trustworthy, code-grounded refactoring backlog for a whole repo — not for a single class (that is mine-verify-cover) or a single spec (mine-from-spec).
user-invocable: true
---

# Mine→Verify→Registry (repo scope)

Point this at ONE repository. It produces a **technical-debt triage registry** —
`docs/tech-debt/{area}.md` in the target repo — grounded in two things nothing else here combines:

1. A **deterministic hotspot layer** — bot-filtered git-history metrics (churn, minor-contributor
   ownership, change coupling, churn×complexity) that rank WHERE the debt concentrates, computed
   before any agent reasons.
2. A **must-reproduce finding set** — per-area clean-room miners extract fact-shaped findings; a
   fresh skeptic RE-EXECUTES each finding's evidence command before it is allowed into the registry.

It **reverse-engineers** where a repo actually hurts — it documents debt the metrics + code exhibit,
not debt one imagines. It never edits production source, and a finding that cannot be phrased as a
reproducible check never reaches the registry as a fact.

This is the debt-mining sibling of the mine family — this skill scans ONE REPO decomposed into
graphify areas (ground truth: deterministic git/complexity metrics + must-reproduce evidence; gate:
hotspot ranking) to find WHERE a repo hurts. Read
`../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family table and
the shared invariant (bounded unit → clean-room miners → consensus → skeptic verify → graded
registry) all eight members follow.

**First slice = Metric→Mine→Verify→Registry only.** Cover/mutation at repo scale, auto-generated
refactoring plans, the security lens, and cross-model critic execution are out of scope — see
`## What this skill does NOT do`.

## The pipeline

```
Metrics     deterministic layer, computed BEFORE any miner runs: bot-filter -> churn / complexity /
            ownership / coupling tables + the hotspot ranking (free tooling: git log, Code Maat, lizard)
Scope       graphify areas ∩ hotspot top-N -> the scan list; plus ONE global structure-graph pass
Mine        per-area clean-room miners × 4 lenses (code-quality, architecture, performance,
            test-coverage) — consume the metric tables + source; every finding fact-shaped
Consolidate merge per-area findings, dedup cross-lens, attach the computed hotspot priority
Verify      a fresh skeptic RE-EXECUTES each finding's evidence -> CONFIRMED / WRONG / IMPRECISE;
            severity recalibration (devil's-advocate pass); cross-model critic seam (slice 2)
Registry    write docs/tech-debt/{area}.md rows in the TARGET repo (registry invariants, ADR-43/45/49)
Triage      by-design adjudication (architect + owner) against the reference model -> disposition
Refresh     (run 2+) re-verify existing rows against the git delta: resolved / still-active / superseded
```

The metric layer's command runbook — the bot filter, the exact `git log` / Code Maat / lizard
invocations, the hotspot filter, the within-repo calibration note, and the tool-availability
preflight — lives in `references/metric-layer.md`. Miners receive its OUTPUT tables; they never
recompute a metric (see `## Binding prompt obligations`).

### The four lenses

Each per-area miner runs four lenses, one clean-room pass each:

- **code-quality** — complexity, duplication, long methods, primitive obsession, dead code.
- **architecture** — leaky boundaries, misplaced logic, anemic aggregates, cross-slice coupling
  (source-semantic; the graph-visible subset is the global pass below).
- **performance** — N+1 access, unbounded loads, needless allocation on hot paths.
- **test-coverage** — untested branches on high-churn code, assertion-free tests, missing boundary
  cases.

Everything a lens finds must be **fact-shaped** (C2): a SYMBOL + CONDITION statement backed by a
reproducible command. A lens observation that cannot be re-executed rides only as a `lens-note`
attached to a fact — never as a fact of its own.

### The global structure-graph pass

Exactly ONE miner runs against the structure graph (graphify), not source, looking for the
graph-visible smells only — the **global-pass catalog**:

- **layering violations** — a lower layer referencing a higher one.
- **dependency-direction violations** — cycles, references against the declared flow.
- **god nodes / hub classes** — community-bridging nodes with outsized degree.

Donor look-for material: `improve-architecture`'s Structural Health bullets — that skill's discovery
phase is superseded here (ADR-46). Anything requiring source semantics belongs to the per-area
lenses, not this pass.

### Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating
— the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background
`general-purpose` agents, "launch = orchestrate stages") is defined there. This skill's own staging:
the metric agent runs first, then the per-area miners in parallel, then a consolidate+skeptic
agent. The orchestrator has no filesystem — agents do all I/O, *including running the metric
commands*.

**On a NEW target, walk the core §kickoff checklist first** (tool preflight, expected survival rate,
stop-budget, run-report location) before launching a run.

## Contracts

### C1 — Metric layer (deterministic; agents consume, never estimate)

Computed first, by an agent running the documented commands in `references/metric-layer.md`. Miners
receive the OUTPUT tables and are **forbidden** (stated in every stage prompt) from estimating any
metric a table provides.

- **Bot filter — mandatory first step.** Exclude bot authors before any churn computation (research:
  73.9% of hotspot commits in one 91-repo corpus were bot-generated). The filter list is a per-repo
  config; the run report logs how many commits were excluded.
- **Signals** (validated lineage, strongest first): minor-contributor **ownership**, **relative
  churn** (normalized by size + temporal extent), **churn×complexity hotspots** (complexity via
  lizard or an equivalent free tool), **change coupling** (secondary signal).
- **Hotspot filter:** modification count > μ+3σ **AND** > 1 change/month of project lifetime —
  either alone over-fires. Calibrate within-repo; never carry thresholds across repos.
- **Tooling is free by contract:** `git log --numstat`-family commands + Code Maat (GPLv3) + lizard.
  The exact runbook and the tool-availability preflight (with its documented fallback) live in
  `references/metric-layer.md`.
- **Degrade honestly:** on a repo where a signal is uninformative (single-maintainer → ownership
  carries nothing), the run report says so and the ranking drops that column — never a silent zero.

### C2 — Finding schema (fact-shaped or it does not exist)

One row per finding: `id` (area-scoped, stable), `area`, `lens`, statement (SYMBOL + CONDITION
prose — line numbers are evidence fields, never identity), **evidence = { reproducible command,
excerpt }**, `severity` (initial, recalibrated at Verify), `hotspot-priority` (computed, never
agent-assigned), `status` (`mined → verified → triaged`), `disposition`
(`accepted | by-design | deferred | resolved | superseded`), `last_verified`, provenance (run id +
commit sha; a row spawned by a `superseded` predecessor cites the old row's id here).

Read `../mine-verify-cover/references/mine-family-core.md` §Fact/judgment doctrine — an unreproducible
claim is a judgment, not a fact, and may ride along only as a `lens-note` attached to a fact here.

### C3 — Verify gate (empirical must-reproduce)

Read `../mine-verify-cover/references/mine-family-core.md` §Skeptic protocol for the must-RUN /
drop-without-excerpt enforcement and the CONFIRMED/WRONG/IMPRECISE verdict grammar this gate uses
unchanged. This skill's own deltas:

- **Severity recalibration:** the skeptic's second obligation — challenge each CONFIRMED finding's
  severity downward-by-default (directional support that an adversarial pass corrects LLM severity
  inflation; treated as a lead, not an established figure).
- **Cross-model critic seam (slice 2):** the Verify stage accepts an optional external critic verdict
  column (e.g. Codex) — named now so adding it later touches no schema.
- Only CONFIRMED (or corrected-IMPRECISE) findings reach the registry. WRONG findings are logged in
  the run report with the refuting output — the mined→confirmed survival rate is a first-class run
  metric (the pilot's precision measurement).

### C4 — Registry (`docs/tech-debt/{area}.md`, own species — ADR-49)

- Lives in the **target repo**, a sibling species to `docs/business-rules/` (ADR-45): per-area flat
  files, never inside `docs/kb/`.
- Invariants: read `../mine-verify-cover/references/mine-family-core.md` §Registry invariants +
  refresh outcome grammar (provenance, `last_verified`, never-deleted, append-only changelog,
  idempotent re-runs).
- **Judgment lives in the disposition, not the finding:** `by-design` rows carry the adjudication
  reference (an ADR/convention cited, or a `docs/reference-model.md` row produced by
  `mine-reference-model` — an additional formal source alongside the repo's own ADRs/conventions; or
  `no-reference-model` when no reference model of any kind exists and the generic catalog was the
  only basis).
- Consumers: the ad-hoc lane (`accepted` → backlog row → `adhoc-*` slug), and the M2 composition —
  before executing an accepted refactor, run `mine-verify-cover` on the affected classes (suite-green
  + floor re-clear across the refactor). M2 presupposes an existing gated suite: an uncovered class
  runs **M1 (Create) first** to build the safety net, then M2 across the refactor.

### C5 — Triage & refresh

- **Triage is human-adjudicated** (architect + owner), against the repo's reference model (ADRs,
  conventions, or a `docs/reference-model.md` produced by `mine-reference-model` — an additional
  formal source, never a replacement; degrade to the generic catalog with the affected rows flagged
  `no-reference-model` only when no reference model of any kind exists).
  Never automated — the "anemic by design" counterexample is why. The dispositions, defined once:
  - `accepted` — a real debt to fix; flows to the ad-hoc lane.
  - `by-design` — the phenomenon is real but intended; carries the adjudication reference.
  - `deferred` — real, not now.
  - `resolved` — the evidence command no longer reproduces (set at refresh).
  - `superseded` — restructuring moved the problem; the old row is kept, a fresh row cites its id.
- **Refresh (run 2+):** re-verify each existing row against the git delta since its `last_verified`.
  The three outcomes map onto C2 fields — no extra state; read
  `../mine-verify-cover/references/mine-family-core.md` §Registry invariants + refresh outcome
  grammar for the resolved/still-active/superseded definitions. Rows are never deleted. Borrowed
  from the confirm-or-refute protocol of docs-update.

### C6 — Cost & safety rails

- **Hotspot-first ordering caps spend:** scan the top-N hot areas (N is a run parameter; default
  small).
- **Budget cap + report on halt:** read `../mine-verify-cover/references/mine-family-core.md`
  §Marginal-budget rail. This skill's run report additionally states: areas scanned/skipped, bot
  commits filtered, the survival rate, the registry delta, and every degraded signal.
- **Forbidden:** miners estimating metrics; the skeptic reasoning without re-execution; any agent
  editing production source; registry rows deleted.

## Binding prompt obligations (grep-checkable)

These are load-bearing prompt clauses, verifiable by grep in this file (AC-3):

- **Every miner stage prompt forbids estimating a metric a table provides.** The miner is handed the
  C1 output tables and instructed: estimating churn, complexity, ownership, or coupling is
  **forbidden** — cite the table value or state the metric is unavailable.
- **The skeptic stage prompt forbids reasoning-only verdicts.** The skeptic must RUN each finding's
  evidence command; a verdict reached by re-reasoning without execution is **forbidden**.
- **Structural enforcement, not just a prompt request:** a verdict row that does not carry its
  re-execution output excerpt is **dropped by the orchestrator** — the prompt obligation has an
  enforcement that runs every pass, so a skeptic who skips execution loses the finding rather than
  smuggling an unverified verdict through.

## Safety rails

The safety floor is **C6 — Cost & safety rails** above; it is the single source and nothing here
overrides it. The load-bearing invariants at a glance:

- **Metric-first, hotspot-bounded** — the deterministic layer runs before any agent reasons and only
  the top-N hot areas are scanned (C6): the objective layer both prioritizes and caps cost.
- **Marginal budget cap + report-on-halt** — gate on the spend delta, never the shared-pool absolute;
  every stop writes a report and never exits silently green (C6).
- **The four prohibitions** — no estimating metrics, no verifying by re-reasoning without execution,
  no editing production source, no deleting registry rows (C6). These are the method's hard floor.

## What this skill does NOT do

- Provide a test toolchain or run Cover/mutation at repo scale — that is `mine-verify-cover` (paired
  with a stack adapter). Repo-scale Cover is out of scope for this slice.
- Mine the rules of a single class or a single spec — that is `mine-verify-cover` (code arm) and its
  `mine-from-spec` mode. This skill's unit is a graphify area + one global structure pass.
- Auto-generate a refactoring plan or execute any refactor — findings feed the ad-hoc lane, where a
  human decides. No agent edits production source.
- The **security lens** — deferred to `/security-review` (owner call); the four lenses above do not
  include security.
- Run the cross-model critic — the Verify stage only reserves the seam (slice 2); it does not execute
  an external critic yet.
- Assign hotspot priority or severity by agent judgment — priority is computed from the metric layer;
  severity is initial-then-skeptic-recalibrated, never a free-floating agent number.

## Relationship to other skills

See `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family
table (all eight members) and how this skill's C4/C5 composes with each (M2 safety net via
`mine-verify-cover`; `mine-reference-model`'s `docs/reference-model.md` rows as the C5 adjudication
reference, above).

| Skill | Relationship |
|-------|-------------|
| `improve-architecture` | its discovery phase is superseded here (ADR-46); its Structural Health catalog remains donor look-for material for the architecture lens + the global pass. Its architect→backlog flow for already-known items is untouched. |
| `graphify` | the structure-graph engine — supplies the areas (scope) and the graph the single global pass reads (layering, direction, god nodes). |
| `kb-entry-schema` | the registry's non-row context sections; the row grammar is C2 above. |
