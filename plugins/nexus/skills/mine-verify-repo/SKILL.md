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

This is the third mine. `mine-verify-cover` scans ONE class (ground truth: code; gate: mutants);
`mine-from-spec` scans ONE spec (ground truth: spec text; gate: skeptic-vs-text);
`mine-reference-model` scans ONE reference repo for its *virtues* (ground truth: reference source;
gate: skeptic re-execution — the invented-virtue kill). This skill scans ONE REPO decomposed into
graphify areas (ground truth: deterministic git/complexity metrics + must-reproduce evidence; gate:
hotspot ranking). The invariant is unchanged across the family: bounded unit → clean-room miners →
consensus → skeptic verify → graded registry.

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

This method inherits the **semantics** of `mine-verify-cover`'s "Execution topology (who runs what)"
run-in heading: it is multi-agent by design (parallel clean-room miners, then a fresh skeptic) and a
subagent cannot orchestrate it — subagents have no spawn/parallel primitives, and a subagent
spawning further agents is the ADR-21 breach vector.

- The **orchestrator is the session that owns spawning** — the team lead in team mode; the main
  session (architect persona) in standalone mode.
- It runs the stages as **staged background `general-purpose` agents**: the metric agent, then the
  per-area miners in parallel, then a consolidate+skeptic agent — these are method stages, not
  pipeline roles (no pipeline `subagent_type`, no custom names).
- The **orchestrator has no filesystem** — agents do all I/O, *including running the metric
  commands*. "Launch the run" always means "orchestrate its stages", never "hand the whole run to
  one background agent": a single agent cannot preserve miner/skeptic independence.

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

A finding whose claim cannot be phrased as a reproducible check (a grep, a metric threshold, a
dependency-direction query on the graph) is a **judgment, not a fact** — it may ride along only as a
`lens-note` attached to a fact, and it never gets a CONFIRMED verdict of its own.

### C3 — Verify gate (empirical must-reproduce)

- The skeptic **RUNS** each finding's evidence command and compares output to the claim —
  re-reasoning without execution is forbidden in the stage prompt AND structurally checked: a verdict
  row must carry the re-execution output excerpt, and the orchestrator **drops any verdict without
  one** (a prompt-only obligation gets a real enforcement).
- Verdict grammar reused from the mine family: **CONFIRMED / WRONG / IMPRECISE** (IMPRECISE = the
  phenomenon exists, the stated scope/number is off — a corrected statement is required).
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
- Invariants carried unchanged from ADR-43/45: per-row provenance, `last_verified`, rows are **never
  deleted** (disposition flips, the record stays), an append-only changelog, idempotent re-runs.
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
  The three outcomes map onto C2 fields — no extra state:
  - **resolved** — evidence command no longer reproduces → `disposition: resolved` + re-stamped
    `last_verified`.
  - **still-active** — no field change except the re-stamped `last_verified`.
  - **superseded** — restructuring moved the problem → old row `disposition: superseded`, a fresh
    finding row mined with the old row's id in its provenance.
  Rows are never deleted. Borrowed from the confirm-or-refute protocol of docs-update.

### C6 — Cost & safety rails

- **Hotspot-first ordering caps spend:** scan the top-N hot areas (N is a run parameter; default
  small).
- **Budget cap** on marginal session spend — capture the start-spend and gate on the delta.
  `budget.spent()` is the shared session pool, not the run's cost; a run fired late in a long session
  trips on the session's prior spend otherwise.
- **Report on halt; never silently green.** Every run writes a report: areas scanned/skipped, bot
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

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | the single-class sibling — finds WHAT rules a class enforces and gates them with mutants. This skill finds WHERE to refactor; the two compose via M2 (run Cover as the safety net across an accepted refactor; M1 first if the class is uncovered). |
| `improve-architecture` | its discovery phase is superseded here (ADR-46); its Structural Health catalog remains donor look-for material for the architecture lens + the global pass. Its architect→backlog flow for already-known items is untouched. |
| `graphify` | the structure-graph engine — supplies the areas (scope) and the graph the single global pass reads (layering, direction, god nodes). |
| `kb-entry-schema` | the registry's non-row context sections; the row grammar is C2 above. |
| `mine-from-spec` (a mode of `mine-verify-cover`) | the spec arm of the mine family — same clean-room miner + skeptic shape, spec text as ground truth instead of git metrics. |
| `mine-reference-model` | the reference-repo sibling — the "what to copy" arm to this skill's "what to fix". It mines a designated reference repo's **virtues** (not debts) into `docs/reference-model.md`; **C5 triage** consumes those rows as the by-design adjudication reference (an additional formal source alongside the repo's own ADRs/conventions), plus its cross-stack translation dictionary. |
