# Tech-Spec — mine-verify-repo (v1): repo-scoped Mine→Verify → tech-debt triage registry

**Slug:** adhoc-MineVerifyRepo
**Type:** Technical feature — architect owns the definition (ADR-27). Graduates
`docs/proposals/mine-verify-repo.md` (Ratified 2026-07-04); ADRs extracted as **ADR-46..49** — this
spec is where the design is explored, the ADRs are the durable records (ADR-28: extracted, never
re-authored).
**Status:** **Ready** (2026-07-04) — definition checkpoint held: code-grounded critic pass folded
(REVISE → fixed, see `## Critic Review`); mine-from-spec offered and skipped (owner call — method
obligations, not suite-gateable behavior).
**Evidence base:** `docs/kb/research/repo-technical-evaluation-for-refactoring.md` (deep-research,
23/25 claims 3-vote verified) — load-bearing figures below cite it, they are not re-derived here.
**Implementation vehicle:** a new stack-neutral skill `plugins/nexus/skills/mine-verify-repo/` in the
nexus plugin. **First slice = Mine→Verify→Registry only**, piloted on knowledge-gateway; refactoring
payoff is a measured pilot hypothesis, never a claim.

---

## Context

The third mine. `mine-verify-cover` scans ONE class (ground truth: code; gate: mutants);
`mine-from-spec` scans ONE spec (ground truth: spec text; gate: skeptic-vs-text). This skill scans
ONE REPO decomposed into graphify areas (ground truth: deterministic git/complexity metrics +
must-reproduce evidence; gate: hotspot ranking). The invariant is unchanged: bounded unit →
clean-room miners → consensus → skeptic verify → graded registry. Output feeds the ad-hoc
refactoring lane, which presupposes a triage artifact nothing produces today.

Two research inputs shape everything below — with different evidence weights. **Verified** (3-vote,
primary texts): the practitioner vacuum is real, and the objective layer is git-history metrics
(relative churn, minor-contributor ownership, change coupling), free to compute, provided bot
commits are filtered first. **Unverified leads** (research §5, explicitly flagged "treat as leads,
not established facts"): raw LLM repo audits run ~79–83% false positive, consensus alone does not
fix it, and only an empirical evidence gate does. The must-reproduce design stands on the verified
vacuum plus these directional leads — the leads are cited as leads throughout, never as facts.

## The pipeline

```
Metrics     deterministic layer, computed BEFORE any miner runs: bot-filter → churn / complexity /
            ownership / coupling tables + the hotspot ranking (free tooling — git log, Code Maat, lizard)
Scope       graphify areas ∩ hotspot top-N → the scan list; plus ONE global structure-graph pass
Mine        per-area clean-room miners × 4 lenses (code-quality, architecture, performance,
            test-coverage) — consume the metric tables + source; every finding fact-shaped
Consolidate merge per-area findings, dedup cross-lens, attach computed hotspot priority
Verify      a fresh skeptic RE-EXECUTES each finding's evidence → CONFIRMED / WRONG / IMPRECISE;
            severity recalibration (devil's-advocate pass); cross-model critic seam (slice 2)
Registry    write docs/tech-debt/<area>.md rows in the TARGET repo (registry invariants, ADR-43/45)
Triage      by-design adjudication (architect + owner) against the reference model → disposition
Refresh     (run 2+) re-verify existing rows against the git delta: resolved / still-active / superseded
```

Orchestration topology inherits the **semantics** of `mine-verify-cover`'s "Execution topology (who
runs what)" paragraph (a run-in subheading inside its `## mine-from-spec mode` section): the session
that owns spawning orchestrates staged background `general-purpose` agents; a subagent never
orchestrates; the orchestrator has no filesystem — agents do all I/O, including running the metric
commands.

**Global-pass catalog.** The one structure-graph miner looks for exactly the graph-visible smells:
**layering violations** (a lower layer referencing a higher one), **dependency-direction violations**
(cycles, references against the declared flow), and **god nodes / hub classes** (community-bridging
nodes with outsized degree). Donor look-for material: `improve-architecture`'s Structural Health
bullets. Anything requiring source semantics belongs to the per-area lenses, not this pass.

## Contracts

### C1 — Metric layer (deterministic, agents consume — never estimate)

Computed first, by an agent running documented commands; miners receive the OUTPUT tables and are
**forbidden** (stated in every stage prompt) from estimating any metric a table provides.

- **Bot filter — mandatory first step.** Exclude bot authors before any churn computation (research:
  73.9% of hotspot commits in one corpus were bot-generated). Filter list is per-repo config; the run
  report logs how many commits were excluded.
- **Signals** (validated lineage, strongest first): minor-contributor **ownership**, **relative
  churn** (normalized by size + temporal extent), **churn×complexity hotspots** (complexity via
  lizard or equivalent free tool), **change coupling** (secondary signal).
- **Hotspot filter:** modification count > μ+3σ **AND** >1 change/month of project lifetime — either
  alone over-fires. Calibrate within-repo; never carry thresholds across repos.
- **Tooling is free by contract:** `git log --numstat`-family commands + Code Maat (GPLv3) + lizard.
  The exact command runbook lives in the skill's `references/metric-layer.md`.
- **Degrade honestly:** on a repo where a signal is uninformative (e.g. single-maintainer →
  ownership carries nothing), the run report says so and the ranking drops that column — never a
  silent zero.

### C2 — Finding schema (fact-shaped or it does not exist)

One row per finding: `id` (area-scoped, stable), `area`, `lens`, statement (SYMBOL + CONDITION prose
— line numbers are evidence fields, never identity), **evidence = { reproducible command, excerpt }**,
`severity` (initial, recalibrated at Verify), `hotspot-priority` (computed, never agent-assigned),
`status` (`mined → verified → triaged`), `disposition`
(`accepted | by-design | deferred | resolved | superseded`), `last_verified`, provenance (run id +
commit sha; a row spawned by a `superseded` predecessor cites the old row's id here).

A finding whose claim cannot be phrased as a reproducible check (a grep, a metric threshold, a
dependency-direction query on the graph) is a **judgment, not a fact** — it may ride along only as a
`lens-note` attached to a fact, and it never gets a CONFIRMED verdict of its own.

### C3 — Verify gate (empirical must-reproduce)

- The skeptic **RUNS** each finding's evidence command and compares output to the claim — re-reasoning
  without execution is forbidden in the stage prompt AND structurally checked: a verdict row must
  carry the re-execution output excerpt, and the orchestrator drops any verdict without one
  (prompt-only obligations get an enforcement, per plan rules).
- Verdict grammar reused from the mine family: **CONFIRMED / WRONG / IMPRECISE** (IMPRECISE = the
  phenomenon exists, the stated scope/number is off — corrected statement required).
- **Severity recalibration:** the skeptic's second obligation — challenge each CONFIRMED finding's
  severity downward-by-default (unverified lead, research §5: an adversarial pass corrected LLM
  severity inflation 8/9 — directional support, not an established figure).
- **Cross-model critic seam (slice 2):** the Verify stage accepts an optional external critic verdict
  column (e.g. Codex) — named now so adding it later touches no schema.
- Only CONFIRMED (or corrected-IMPRECISE) findings reach the registry. WRONG findings are logged in
  the run report with the refuting output — the mined→confirmed survival rate is a first-class run
  metric (the pilot's precision measurement).

### C4 — Registry (`docs/tech-debt/<area>.md`, own species — ADR-49)

- Lives in the **target repo**, sibling species to `docs/business-rules/` (ADR-45): per-area flat
  files, never inside `docs/kb/`.
- Invariants carried unchanged from ADR-43/45: per-row provenance, `last_verified`, rows never
  deleted (disposition flips, record stays), append-only changelog, idempotent re-runs.
- **Judgment lives in the disposition, not the finding:** `by-design` rows carry the adjudication
  reference (ADR/convention cited, or `no-reference-model` when the repo has none and the generic
  catalog was the only basis).
- Consumers: the ad-hoc lane (`accepted` → backlog row → `adhoc-*` slug), and the M2 composition —
  before executing an accepted refactor, run `mine-verify-cover` on the affected classes
  (suite-green + floor re-clear across the refactor, ADR-38). M2 presupposes an existing gated
  suite: an uncovered class runs **M1 (Create) first** to build the safety net, then M2 across the
  refactor.

### C5 — Triage & refresh

- **Triage is human-adjudicated** (architect + owner), against the repo's reference model (ADRs,
  conventions; degrade to the generic catalog with rows flagged). Never automated — the fokus
  "anemic by design" lesson is the founding counterexample.
- **Refresh (run 2+):** re-verify each existing row against the git delta since its `last_verified`.
  The three outcomes map onto C2 fields — no extra state: **resolved** (evidence command no longer
  reproduces) → `disposition: resolved` + re-stamped `last_verified`; **still-active** → no field
  change except the re-stamped `last_verified`; **superseded** (restructuring moved the problem) →
  old row `disposition: superseded`, a fresh finding row is mined with the old row's id in its
  provenance. Rows are never deleted (ADR-49). Borrowed from docs-update Phase 5's
  confirm-or-refute protocol.

### C6 — Cost & safety rails

- **Hotspot-first ordering caps spend:** scan top-N hot areas (N is a run parameter; default small).
- **Budget cap** on marginal session spend (capture start-spend, gate on the delta — the shared-pool
  lesson from mine-verify-cover applies verbatim).
- **Report on halt; never silently green.** Every run writes a report: areas scanned/skipped, bot
  commits filtered, survival rate, registry delta, and every degraded signal.
- **Forbidden:** miners estimating metrics; the skeptic reasoning without re-execution; any agent
  editing production source; registry rows deleted.

## Acceptance criteria

- **AC-1** — the skill ships stack-neutral in `plugins/nexus/skills/mine-verify-repo/`
  (SKILL.md + `references/metric-layer.md`), standalone-runnable (no docs-encyclopedia embedding),
  and passes the `evaluate-skill` gate.
- **AC-2** — the metric layer produces a bot-filtered hotspot table on the pilot repo from free
  tooling only; the run report states the bot-exclusion count and any degraded signal.
- **AC-3** — every stage prompt forbids metric estimation by miners and reasoning-only verification
  by the skeptic (grep-checkable in SKILL.md), and the skeptic obligation has its structural
  enforcement (verdict-without-output dropped) stated in the method text.
- **AC-4** — the run report carries the mined→confirmed survival rate; WRONG findings appear with
  their refuting output.
- **AC-5** — registry rows conform to C2 and the ADR-49 invariants; a re-run against an unchanged
  repo is idempotent.
- **AC-6** *(operator-owed — the KG pilot)* — one full run on knowledge-gateway: registry produced,
  triage held with the owner, ≥1 accepted row flows to a KG backlog row, and the payoff baseline is
  captured (hotspot scores + finding set at run date) so a later re-run can measure the delta. A
  PASS on AC-1..5 does **not** prove AC-6 — the pilot is the operator's arm.
- **AC-7** — SKILL.md structurally defines the four lenses, the global pass + its catalog, the triage
  dispositions (C2's enum verbatim), and the refresh protocol — grep-checkable headings/terms.
  (Note: AC-1's `evaluate-skill` gate plus this grep is the ONLY pre-ship check these method sections
  receive; their behavior is first exercised at AC-6.)

## Out of scope (slice 1)

Cover/mutation at repo scale; auto-generated refactoring plans; the **security lens** (deferred —
`/security-review` overlap; owner call 2026-07-04); the docs/render layer (ADR-43 boundary); the
cross-model critic execution (seam only); a stack-adapter seam (extract only when a second stack's
toolchain diverges — the mine-verify-cover rule).

## Critic Review

Code-grounded critic pass 2026-07-04, verdict REVISE (0 BLOCKER / 3 MAJOR / 4 MINOR) — all folded:

- **MAJOR-1** global-pass catalog was proposal-deferred to this spec but missing → added
  (`## The pipeline` → Global-pass catalog).
- **MAJOR-2** refresh states had no home in the C2 schema → `superseded` added to the disposition
  enum; C5 now maps all three refresh outcomes onto C2 fields; ADR-49 aligned.
- **MAJOR-3** unverified research §5 leads were cited as facts → Context and C3 relabeled
  (leads, directional); ADR-47/48 caveated.
- **MINOR-4** metric-tool bringup uncovered → availability check + fallback added to the plan
  (Steps 1 and 4). **MINOR-5** topology cross-reference precision → fixed ("semantics", exact
  location). **MINOR-6** method sections AC-unasserted → AC-7 added with the honest scope note.
  **MINOR-7** M2-composition precondition → M1-first note added to C4.

Confirmed clean by the same pass: C1–C6 ↔ ADR-46..49 coherence, plan AC coverage/ordering, the
plan's Step-2 edit anchors in both sibling skills, and the verified research figures.

## ADRs extracted

- **ADR-46** — mine-verify-repo is the third mine: unit = graphify area + one global structure pass;
  supersedes `improve-architecture`'s discovery phase; security lens deferred to `/security-review`.
- **ADR-47** — the fact/judgment split: facts pass an empirical must-reproduce Verify gate (the
  skeptic re-executes, never re-reasons); judgments are human-adjudicated by-design triage.
- **ADR-48** — the hotspot gate: bot-filtered git-history metrics are the repo mine's objective
  prioritization layer (mutants don't scale to repo scope; agent-estimated likelihood is rejected).
- **ADR-49** — `docs/tech-debt/<area>.md` is the triage-registry species: ADR-43/45 invariants
  carried; feeds the ad-hoc lane; refresh keeps it current.
