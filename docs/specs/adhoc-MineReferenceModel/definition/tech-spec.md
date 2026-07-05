# Tech-Spec — mine-reference-model (v1): reference-repo virtue extraction → portability-graded reference model

**Status: Ready**
**Branch:** technical (ADR-27 — architect owns the definition).
**Proposal provenance:** `docs/plugin-feedback/omni-1.22.0-2026-07-05.md` Entry 8 (in
`D:\Omnishelf\omnishelf_flutter_app` — the mine-verify-repo pilot repo), ratified by owner directive
2026-07-05 ("Build a new skill … mine-reference-model — the 'what to copy' arm of the mine family").
ADR extracted as **ADR-50** — this spec is where the design is explored; the ADR is the durable
record (one authoritative source; on drift, supersede).
**Design donors:** (a) the hand-built miniature
`D:/omnishelf/app_flutter/docs/proposals/architecture-review/dotnet-reference.md` (2026-05-31) — a
working example of the target artifact: verified-in-code pattern table, "rule it reveals" framing,
portability mapping, files-read evidence list; (b) `mine-verify-repo` (SKILL.md + ADR-46..49) — the
family invariants; (c) the pilot's Entry-6 scale datapoint (one consolidate+skeptic holds at ~145
findings). The designated live donor run (the Flutter program's ad-hoc reference-model extraction)
has **not run yet** — per owner decision 2026-07-05 the skill ships first and that run becomes the
pilot (AC-5).

**Implementation vehicle:** a new stack-neutral skill `plugins/nexus/skills/mine-reference-model/`
in this repo. No stack adapter needed for v1 — both stages are read-only source analysis (greps +
reads), no toolchain.

## What it is

The **fourth mine**. `mine-verify-repo` extracts what is *wrong* with a repo; nothing formalizes
extracting what is *right* from a designated reference repo. This skill scans ONE reference
repository for its **virtues** — the deliberate, code-verified pattern choices worth copying — and
writes a **portability-graded reference model** into the consuming repo.

| Mine | Unit | Ground truth | Gate | Output |
|------|------|-------------|------|--------|
| `mine-verify-cover` | one class | code | mutants | rules KB + gated suite |
| `mine-from-spec` (mode) | one spec | spec text | skeptic-vs-text | spec-rules |
| `mine-verify-repo` | one repo (debts) | git metrics + code | hotspot rank + re-execution | `docs/tech-debt/{area}.md` |
| **`mine-reference-model`** | **one reference repo (virtues)** | **reference source** | **skeptic re-execution (invented-virtue kill)** | **`docs/reference-model.md` in the consuming repo** |

The family invariant is unchanged: bounded unit → clean-room extraction → consolidate → skeptic
verify → graded registry. What changes is the failure mode the gate kills: the debt mine kills
*false positives* (~80% in raw LLM audits); this mine kills **flattery** — virtues the model
projects onto a repo it has been told is exemplary. An unverified virtue in the adjudication
reference is worse than a false debt finding: it silently legitimizes `by-design` dispositions.

**Primary consumer:** `mine-verify-repo` **C5 triage** — a `by-design` disposition cites a
reference-model row as its adjudication reference. The artifact is an **additional formal source**
of C5's "reference model", alongside the repo's own ADRs/conventions (ADR-47's existing referent) —
never a replacement for them; `no-reference-model` fires only when **no reference model of any
kind** is available (no ADRs, no conventions, no `docs/reference-model.md`). Secondary consumers: the refactoring roadmap's style guide, and the
**cross-stack translation dictionary** (reference-stack idiom → consuming-stack idiom).

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

Execution topology inherits the **semantics** of `mine-verify-cover`'s "Execution topology (who
runs what)": the session that owns spawning orchestrates; stages run as staged background
`general-purpose` agents (extractors in parallel, then one consolidate+skeptic); the orchestrator
has no filesystem — agents do all I/O. Default sizing is **small**: five extractors + one
consolidate+skeptic. The Entry-6 datapoint (one consolidate+skeptic at ~145 findings) bounds this
comfortably — a virtues run yields far fewer rows.

## Contracts

### R1 — Inputs & scope

- **Reference repo path** (required; read-only — the skill never edits it).
- **Consuming repo + stack tag** (required — the portability target; the output lands here).
- **Dimension list** (default five: layering, module boundaries, error handling, DI, testing
  strategy; overridable per run — e.g. add "state management" for a frontend reference).
- **Optional seed docs** (a prior hand-built reference doc): seed rows are **input hypotheses**,
  re-verified by the skeptic like any mined pattern — never trusted on age or authorship.
- **Cost rail:** per-dimension pattern cap (run parameter, default small) — a reference model is a
  yardstick, not an inventory; ten load-bearing patterns beat fifty observations.

### R2 — Pattern schema (the fact/judgment split, applied)

One row per pattern: `id` (dimension-scoped, stable), `dimension`, statement (**CHOICE +
RULE-IT-REVEALS** prose — what the reference repo does, and the judgment it encodes), **evidence =
{ reproducible command, file:line excerpt }**, `verdict`, **`portability`**
(`portable | adapt | not-portable`) + translation note, provenance (reference repo + commit sha +
run id), `last_verified`.

- **Pattern existence is the FACT** — skeptic-gated, must-reproduce (R3).
- **Portability is a JUDGMENT** (ADR-47): agent-drafted, marked advisory, and human-confirmed at
  the point of *use* — when a triage decision or roadmap step cites the row — not by a new
  adjudication gate inside this skill. This preserves the ADR-47 split without adding a human
  bottleneck to every run.
- **Negative claims carry their zero.** A pattern asserting absence ("no repository interface
  exists — one impl never earns an interface") must embed the grep that returns zero hits as its
  evidence command; the skeptic re-runs it and confirms the zero. An absence claim without a
  trace is a judgment, not a fact (the seed doc's "grep: zero" is the donor example).

### R3 — Verify gate (invented-virtue kill)

- The skeptic **RUNS** each pattern's evidence command against the reference source — reasoning-only
  verdicts are forbidden in the stage prompt AND structurally enforced: a verdict row without its
  re-execution output excerpt is **dropped by the orchestrator** (inherited unchanged from
  mine-verify-repo C3).
- Verdict grammar: **CONFIRMED / WRONG / IMPRECISE**. WRONG here means **invented virtue** — the
  flattery failure mode this gate exists for; the run report logs each with the refuting output.
  IMPRECISE = the pattern exists but the stated scope is off (e.g. "all services skip the App
  layer" when only the simple ones do) — a corrected statement is required.
- Extractors are clean-room per dimension and are **not told the repo is exemplary** — the stage
  prompt asks "what pattern choices does this repo make, and what rule does each encode", not
  "list this repo's best practices". Framing is half the flattery defense; the skeptic is the
  other half.

### R4 — Output artifact & species

`docs/reference-model.md` in the **consuming** repo — the third registry species alongside
`docs/business-rules/` (ADR-45) and `docs/tech-debt/` (ADR-49), single flat file for v1 (one
designated reference repo; a `docs/reference-model/{repo}.md` split is the named seam if a second
reference repo ever arrives — not built now).

Registry invariants carried unchanged from ADR-43/45/49: per-row provenance + `last_verified`,
rows never deleted (verdict/portability flips, the record stays), append-only changelog,
idempotent re-runs. Sections: per-dimension pattern tables → the **translation dictionary**
(reference-stack mechanism → consuming-stack mechanism, built **only from CONFIRMED rows**) →
files-read evidence list → run report block (patterns mined/confirmed/killed, the survival rate).

**Refresh (run 2+):** re-verify each row against the reference repo's git delta since
`last_verified` — same outcome grammar as the sibling (still-active = re-stamp; a pattern the
reference repo abandoned = verdict flip recorded, row kept; restructuring = fresh row citing the
old id).

### R5 — Consumption seam

- `mine-verify-repo` C5: a `by-design` disposition cites `reference-model.md` row ids as its
  adjudication reference — an additional formal source alongside the repo's own ADRs/conventions,
  never a redefinition of C5's referent; `no-reference-model` fires only when no reference model
  of any kind is available. (Cross-reference edit in the sibling is in scope — AC-3.)
- The ad-hoc refactoring lane: roadmap style guide + translation dictionary.
- **Not** a consumer: `improve-skills` — the "generate project skills from patterns" stage from
  Entry 8 is explicitly out of scope for v1 (that pipeline exists informally in the pilot repo;
  formalizing it is a separate proposal if the pilot proves the demand).

### R6 — Cost & safety rails

- **Read-only on both repos** — the only write is `docs/reference-model.md` (+ its changelog) in
  the consuming repo. No agent edits reference or consuming source.
- **No metric layer — a deliberate asymmetry with ADR-48.** Virtues are structural choices, not
  churn concentrations; git-history hotspot ranking finds where code *hurts*, not where judgment
  *shows*. Prioritization comes from the dimension list + per-dimension cap instead. (If a future
  slice wants "is this pattern load-bearing or vestigial?", change-frequency of the pattern's
  files is the named seam — not built now.)
- **Budget cap on marginal session spend** (same rule as sibling C6: gate on the delta, never the
  shared-pool absolute). **Report on halt; never silently green.**
- **Forbidden:** skeptic reasoning-only verdicts; deleting rows; patterns without a reproducible
  evidence command; telling extractors the repo is exemplary.

## Acceptance criteria

- **AC-1** — the skill ships stack-neutral in `plugins/nexus/skills/mine-reference-model/`,
  lint-green (`skill-lint.mjs`), `evaluate-skill`-gated, released as a nexus **MINOR** bump.
- **AC-2** — binding prompt obligations grep-checkable in SKILL.md: (a) the skeptic prompt forbids
  reasoning-only verdicts + states the drop-without-excerpt enforcement; (b) the extractor prompt
  framing avoids "best practices" phrasing (clean-room, not flattery-primed); (c) the
  negative-claim rule (absence needs its zero-hit command).
- **AC-3** — sibling cross-references land: `mine-verify-repo` SKILL.md (family enumeration "third
  mine" → four-mine table or equivalent, C5/`no-reference-model` names this skill as the producer,
  relationship-table row) and `mine-verify-cover` SKILL.md (relationship-table row).
- **AC-4** — ADR-50 recorded in `docs/architecture/README.md` (contents list + section).
- **AC-5** *(operator-owed, post-release)* — the pilot: reference repo `D:/src/dotnet-microservices`
  → consuming repo `D:\Omnishelf\omnishelf_flutter_app`, producing the `reference-model.md` its
  triage step (the Flutter program's Step 10) consumes. Survival rate + friction captured; skill
  defects flow back as plugin feedback, not silent local fixes.

## Out of scope (v1)

- The **skill-generation second stage** (Entry 8's "generate/refresh project skills from
  patterns") — `improve-skills` owns skill scaffolding; a separate proposal if demand proves out.
- **Multi-reference-repo merge** — one designated reference repo per run; the per-repo file split
  is the named seam.
- **A metric layer** on the reference repo (see R6 asymmetry note).
- **Security patterns** as a dimension — same deferral as the sibling (`/security-review`).
- Any refactor execution or source edit in either repo.
