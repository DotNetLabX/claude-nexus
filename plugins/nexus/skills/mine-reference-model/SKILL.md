---
name: mine-reference-model
description: Extract skeptic-verified virtues from ONE designated reference repository — parallel clean-room extractors read the reference source per dimension (layering, module boundaries, error handling, DI, testing strategy), a fresh skeptic re-executes each pattern's evidence to kill invented virtues, and confirmed patterns are graded for portability to the consuming stack (portable | adapt | not-portable) plus a cross-stack translation dictionary, written to docs/reference-model.md in the consuming repo. Stack-neutral, read-only, no toolchain. Use when you need a code-verified "what to copy" reference model — consumed at mine-verify-repo's C5 triage as the by-design adjudication reference — or the repo itself, self-reference mode, to formalize its own unwritten conventions. Not a debt mine (mine-verify-repo), a class miner (mine-verify-cover), or a spec miner (mine-from-spec).
user-invocable: true
---

# Mine→Verify→Grade (reference-repo scope)

Point this at ONE reference repository. It produces a **portability-graded reference model** —
`docs/reference-model.md` in the CONSUMING repo — that answers a question nothing else here answers:
**what does this well-built repo do that is worth copying, and would it survive the move to my
stack?**

1. A **must-reproduce virtue set** — per-dimension clean-room extractors read the reference source
   and phrase every pattern as a fact (CHOICE + the RULE-IT-REVEALS), backed by a reproducible
   command; a fresh skeptic RE-EXECUTES each command before the pattern is allowed into the registry.
2. A **portability judgment** — each confirmed pattern carries a `portable | adapt | not-portable`
   stamp plus a translation note for the consuming stack, and a **cross-stack translation
   dictionary** is built from the confirmed rows.

It **reverse-engineers** the deliberate pattern choices a repo makes — it documents virtues the code
exhibits, not virtues one wishes it had. It never edits either repo, and a pattern that cannot be
phrased as a reproducible check never reaches the registry as a fact.

This is the **fourth mine** — the reference-repo sibling of the mine family, scanning ONE reference
repo for what is *right* (ground truth: reference source; gate: skeptic re-execution — the
invented-virtue kill). Read `../mine-verify-cover/references/mine-family-core.md` §The mine family
for the full 12-row family table and the shared invariant (bounded unit → clean-room extraction →
consolidate → skeptic verify → graded registry) all twelve members follow.

What changes here is the failure mode the gate kills. The debt mine kills *false positives* —
findings the model imagines. This mine kills **flattery** — virtues the model projects onto a repo
it has been told is exemplary. An unverified virtue in the adjudication reference is worse than a
false debt finding: it silently legitimizes `by-design` dispositions.

## The pipeline

```
Extract     parallel clean-room extractors against the REFERENCE repo source, one per dimension
            (default five: layering, module boundaries, error handling, DI, testing strategy) —
            every pattern fact-shaped: CHOICE + RULE-IT-REVEALS, backed by a reproducible command
Consolidate merge per-dimension patterns, dedup cross-dimension overlaps
Verify      a fresh skeptic RE-EXECUTES each pattern's evidence against the reference source ->
            CONFIRMED / WRONG (invented virtue) / IMPRECISE
Grade       per confirmed pattern: portability stamp for the consuming stack
            (portable | adapt | not-portable) + translation note — a JUDGMENT column
Write       docs/reference-model.md in the CONSUMING repo (registry invariants, ADR-43/45/49
            lineage) incl. the translation dictionary built from confirmed rows only
Refresh     run 2+ re-verifies existing rows against the reference repo's git delta
```

### Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating
— the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background
`general-purpose` agents, "launch = orchestrate stages") is defined there. The orchestrator has no
filesystem — agents do all I/O, including running the extractors' and skeptic's evidence commands.

This skill's own sizing: **five dimension extractors in parallel (default), then ONE
consolidate+skeptic agent.** The pilot-sibling's Entry-6 scale datapoint — one consolidate+skeptic
holding at roughly 145 findings — bounds this comfortably; a virtues run yields far fewer rows.

**On a NEW target, walk the core §kickoff checklist first** (tool preflight, expected survival rate,
stop-budget, run-report location, stage-model-plan) before launching a run.

## Contracts

### R1 — Inputs & scope

- **Reference repo path** (required; read-only — the skill never edits it).
- **Consuming repo + stack tag** (required — the portability target; the output lands here).
- **Dimension list** (default five: layering, module boundaries, error handling, DI, testing
  strategy; overridable per run — e.g. add "state management" for a frontend reference).
- **Optional seed docs** (a prior hand-built reference doc): seed rows are **input hypotheses**,
  re-verified by the skeptic like any mined pattern — never trusted on age or authorship. A seed
  row that fails re-execution is killed exactly like an extractor-mined one.
- **Self-reference mode** (supported): reference repo **=** consuming repo is a valid
  parameterization — extract the repo's own virtues as its self-model (formalizing conventions it
  never wrote down; consumed at its own C5 triage). Portability stamps collapse to `portable`
  (same stack) and the translation dictionary section is omitted — the run report states the mode.
  The skeptic gate does not relax in this mode (see R3's self-mode cross-check) — flattery risk is
  higher, not lower, when a repo grades itself.
- **Cost rail:** per-dimension pattern cap (run parameter, default small) — a reference model is a
  yardstick, not an inventory; ten load-bearing patterns beat fifty observations.

### R2 — Pattern schema (the fact/judgment split, applied)

One row per pattern: `id` (dimension-scoped, stable), `dimension`, statement (**CHOICE +
RULE-IT-REVEALS** prose — what the reference repo does, and the judgment it encodes), **evidence =
{ reproducible command, file:line excerpt }**, `verdict`, **`portability`**
(`portable | adapt | not-portable`) + translation note, provenance (reference repo + commit sha +
run id), `last_verified`.

- **Pattern existence is the FACT** — skeptic-gated, must-reproduce (R3). Read
  `../mine-verify-cover/references/mine-family-core.md` §Fact/judgment doctrine for the shared
  fact/judgment split this schema applies.
- **Portability is a JUDGMENT** (ADR-47): agent-drafted, marked advisory, and human-confirmed at the
  point of *use* — when a triage decision or roadmap step cites the row — not by a new adjudication
  gate inside this skill. This preserves the ADR-47 fact/judgment split without adding a human
  bottleneck to every run.
- **Negative claims carry their zero.** A pattern asserting absence ("no repository interface exists
  — one implementation never earns an interface") must embed the grep that returns zero hits as its
  evidence command; the skeptic re-runs it and confirms the zero. An absence claim without a trace
  is a judgment, not a fact.

### R3 — Verify gate (invented-virtue kill)

- Read `../mine-verify-cover/references/mine-family-core.md` §Skeptic protocol for the must-RUN /
  drop-without-excerpt enforcement this gate uses unchanged.
- Verdict grammar: **CONFIRMED / WRONG / IMPRECISE**. **WRONG here means invented virtue** — the
  flattery failure mode this gate exists for; the run report logs each with the refuting output.
  IMPRECISE = the pattern exists but the stated scope is off (e.g. "all services skip the App layer"
  when only the simple ones do) — a corrected statement is required.
- Extractors are clean-room per dimension and are **not told the repo is exemplary** — the stage
  prompt asks "what pattern choices does this repo make, and what rule does each encode", not "list
  this repo's best practices". Framing is half the flattery defense; the skeptic is the other half.
- **Self-reference mode cross-check.** When reference repo = consuming repo (self-reference mode),
  the skeptic additionally cross-checks each confirmed pattern against the repo's
  `docs/tech-debt/` rows — a contradiction (a claimed virtue refuted by a confirmed debt finding)
  demotes the pattern to IMPRECISE at best, never silently CONFIRMED.

### R4 — Output artifact & species

`docs/reference-model.md` in the **consuming** repo — the third registry species alongside
`docs/business-rules/` (ADR-45) and `docs/tech-debt/` (ADR-49), a single flat file for v1 (one
designated reference repo; a `docs/reference-model/{repo}.md` split is the named seam if a second
reference repo ever arrives — not built now).

Registry invariants: read `../mine-verify-cover/references/mine-family-core.md` §Registry
invariants + refresh outcome grammar (provenance, `last_verified`, never-deleted, append-only
changelog, idempotent re-runs). Sections, in order: per-dimension pattern tables → the
**translation dictionary** (reference-stack mechanism → consuming-stack mechanism, built **only
from CONFIRMED rows**) → files-read evidence list → run report block (patterns
mined/confirmed/killed — the survival rate).

**Refresh (run 2+):** re-verify each row against the reference repo's git delta since
`last_verified` — same outcome grammar as the sibling (core §Registry invariants + refresh outcome
grammar). This skill's mapping: still-active = re-stamp `last_verified`; a pattern the reference
repo abandoned = verdict flip recorded, row kept; restructuring = a fresh row citing the old id in
its provenance. Rows are never deleted.

### R5 — Consumption seam

- `mine-verify-repo` **C5 triage**: a `by-design` disposition cites `reference-model.md` row ids as
  its adjudication reference. The artifact is an **additional formal source** of C5's reference
  model, **alongside** the repo's own ADRs/conventions (ADR-47's existing referent) — never a
  replacement for them; `no-reference-model` fires only when **no reference model of any kind** is
  available (no ADRs, no conventions, no `docs/reference-model.md`).
- The **ad-hoc refactoring lane**: the roadmap's style guide + the translation dictionary.
- `improve-skills` **§Pattern-Pack Seeding**: CONFIRMED `portable`/`adapt` rows (+ the ratified
  charter when present) seed pattern-skill authoring there — the pilot's Entry-8 second stage,
  formalized (F30). This skill mines and grades the rows; `improve-skills` owns the scaffolding —
  this skill still never scaffolds skills.

### R6 — Cost & safety rails

- **Read-only on both repos** — the only write is `docs/reference-model.md` (+ its changelog) in the
  consuming repo. No agent edits reference or consuming source.
- **No metric layer — a deliberate asymmetry with ADR-48.** Virtues are structural choices, not
  churn concentrations; git-history hotspot ranking finds where code *hurts*, not where judgment
  *shows*. Prioritization comes from the dimension list + the per-dimension cap instead. (If a future
  slice wants "is this pattern load-bearing or vestigial?", change-frequency of the pattern's files
  is the named seam — not built now.)
- **Budget cap + report on halt:** read `../mine-verify-cover/references/mine-family-core.md`
  §Marginal-budget rail (same rule as the sibling C6: gate on the delta, never the shared-pool
  absolute).
- **Forbidden:** skeptic reasoning-only verdicts; deleting rows; patterns without a reproducible
  evidence command; telling extractors the repo is exemplary.

## Binding prompt obligations (grep-checkable)

These are load-bearing prompt clauses, verifiable by grep in this file (AC-2):

- **The skeptic stage prompt forbids reasoning-only verdicts.** The skeptic must RUN each pattern's
  evidence command against the reference source; a verdict reached by re-reasoning without execution
  is **forbidden**. **Structural enforcement, not just a prompt request:** a verdict row that does
  not carry its re-execution output excerpt is **dropped by the orchestrator** — the prompt
  obligation has an enforcement that runs every pass, so a skeptic who skips execution loses the
  finding rather than smuggling an unverified virtue through.
- **The extractor stage prompt is clean-room, not flattery-primed.** The extractor prompt asks
  **"what pattern choices does this repo make, and what rule does each encode"** — it must **not**
  prime with "best practices" or "exemplary" framing. Telling an extractor the repo is exemplary is
  the flattery attack this gate exists to stop; the neutral framing is half the defense, the skeptic
  is the other half.
- **A pattern asserting absence embeds its zero-hit command.** A negative claim ("no X exists")
  carries the grep that returns zero hits as its evidence command, and the skeptic re-runs it and
  confirms the zero. An absence claim without a trace is a judgment, not a fact.

## Safety rails

The safety floor is **R6 — Cost & safety rails** above; it is the single source and nothing here
overrides it. The load-bearing invariants at a glance:

- **Read-only + one write** — both repos are read-only; the sole write is `docs/reference-model.md`
  (+ its changelog) in the consuming repo (R6).
- **Flattery defense, two halves** — clean-room extractor framing (never "exemplary") + a skeptic
  that re-executes every pattern's evidence, with the drop-without-excerpt enforcement (R3, and the
  binding obligations above).
- **Marginal budget cap + report-on-halt** — gate on the spend delta, never the shared-pool
  absolute; every stop writes a report and never exits silently green (R6).
- **The four prohibitions** — no skeptic verdict by re-reasoning without execution, no deleting
  registry rows, no pattern without a reproducible evidence command, no telling extractors the repo
  is exemplary (R6). These are the method's hard floor.

## What this skill does NOT do

- Generate or refresh project skills from the mined patterns — the **skill-generation second stage**
  is owned by `improve-skills` §Pattern-Pack Seeding, which seeds pattern-skill authoring from this
  skill's CONFIRMED `portable`/`adapt` rows (F30). This skill mines and grades the rows; it never
  scaffolds skills.
- Merge **multiple reference repos** — one designated reference repo per run; the
  `docs/reference-model/{repo}.md` per-repo split is the named seam, not built now.
- Run a **metric layer** over the reference repo — a deliberate asymmetry with the debt sibling
  (R6): virtues are structural choices, not churn concentrations.
- Mine a **security** dimension — same deferral as the sibling (`/security-review`, owner call); the
  default five dimensions do not include security.
- Execute any refactor or edit any source — the reference model feeds triage and the ad-hoc lane,
  where a human decides. No agent edits either repo's source.

## Relationship to other skills

See `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family
table (all twelve members) and R5 above for how this skill's output composes with
`mine-verify-repo`'s C5 triage.

| Skill | Relationship |
|-------|-------------|
| `improve-skills` | **Consumer** (F30) — its §Pattern-Pack Seeding entry point seeds pattern-skill authoring from this skill's CONFIRMED `portable`/`adapt` rows (+ the ratified charter when present). `improve-skills` owns the scaffolding; this skill mines and grades the rows. |
