---
name: regenerate-unit
description: Regenerate one unit — or one cluster — from its mined, mutation-gated business-rule registry into a human-designed better shape, behind fail-closed preflight gates and a hidden-oracle bounded repair loop, ending in a GO/NO-GO regeneration report. The program's wave inner loop, validated 5× by hand (RC/FSD/RG/p0c/p0d, repairs trending 1→1→1→0). Consumes the mines' outputs (registry, S2 suite-strength audit, design census, anti-pattern list); its PROVE stage invokes mine-oracle-strength, never re-implements it. Use to run the wave inner loop, regenerate a unit or a cluster from its registry, produce a GO/NO-GO regeneration report, or resolve a cluster rule→target-home mapping. Not a mine-family member — it consumes verified registries and produces regenerated code behind gates.
user-invocable: true
---

# Regenerate → Prove → Adopt (one unit, or one cluster)

Point this at ONE unit (or one **cluster** in cluster mode) whose behavior is already mined and
mutation-gated. It answers the production question a rewrite must answer safely: **can this unit be
regenerated into the owner's better shape without losing a single verified behavior?** The machine
never designs — it regenerates from rules alone, into a shape the owner chose, behind gates that
would rather HALT than lose behavior, and hands back a **GO/NO-GO report with a standalone adoption
question**. The governing directive is the program's: **better, never a copy** — the equivalence
gates protect behavior, they never mandate structural closeness.

Field-validated **5× by hand** — RC / FSD / RG / p0c / p0d, repairs trending **1→1→1→0** (the
declared-ambiguity obligation turned the last registry miss into a pre-flagged fix). Every repair
ever traced to **registry under-specification**, never generation weakness: generation is not the
bottleneck — registry completeness and oracle strength are. This skill codifies that loop. Program
provenance: `docs/programs/br-anchored-regeneration.md` §2–§3 (the stack-independent core loop).

**NOT a mine-family member.** It consumes the mines' outputs — the verified `mine-verify-cover`
registry, the `mine-oracle-strength` (F29) suite-strength audit, the `mine-design` Stage-1 census,
the `mine-skill-candidates` anti-pattern list — and produces regenerated code behind gates. It
mines nothing itself.

## Assumptions (declared up front)

- **The unit is already mined and mutation-gated.** This loop regenerates a unit whose rules exist
  and whose suite is mutation-proven; it does not bootstrap rules (that is `mine-verify-cover`) and
  it never designs the target shape (that is the owner's). A unit with no gated registry is out of
  scope — HALT at preflight with that reason.
- **One unit — or one cluster — per run.** The unit is a single class/function and its registry, or
  a set of units the target design merges/splits/re-homes together (cluster mode below).
- **The target shape is an owner input, not a derivation.** Design intent arrives as the owner's
  shape directive plus the evidence inputs (census, charter, anti-pattern list); this skill never
  invents architecture.
- **A live regeneration is operator-owed at campaign use.** The skill text and its gate contracts
  are shipped and dry-provable, but a real run spawns clean-room generators and runs the stack
  toolchain against a campaign suite — that arm is `Owner: operator` at first campaign use (the
  fix-shelf pilot / a standalone unit run). No live regeneration runs in this dev repo.

## The pipeline

```
Stage 1  Preflight             (gates, fail-closed)        — four hard gates before anything runs
Stage 2  Contract pack         (assembly,   model: sonnet) — class + byte-exact ctor + signatures + shape directive
Stage 3  Clean-room generation (generator,  model: opus)   — spawned/background; from rules alone, target file forbidden
Stage 4  Hidden-oracle + repair (judge,     model: fable)  — bounded ≤3 loop; registry-gap vs generation-slip
Stage 5  PROVE                 (invokes mine-oracle-strength) — fresh blind battery → adjudication → gap-kill
Stage 6  Report + adoption     (mechanical, model: sonnet) — GO/NO-GO, N-way shape table, standalone adoption
```

Every stage dispatch carries an **explicit `model:` override** — never session-inherit (§Stage-model
pins). The **asymmetry rule** holds throughout: verification never runs below generation.

## Stage 1 — Preflight (four hard gates, all fail-closed)

Nothing generates until all four pass or record an explicit declared gap. A failed hard precondition
HALTs the run with a named reason — never a silent proceed.

1. **BR registry exists and is mutation-gated** — else HALT, routing to `mine-verify-cover` (the
   registry must be built and gated first; everything downstream joins on it). **Registry freshness**
   is part of this gate: the rows are re-stamped against current source via `mine-verify-cover`'s
   **run-2 refresh mode** — re-verify each citation, re-stamp `last_verified`; the rules and tests
   themselves stay. A registry mined against stale source is not a trustworthy oracle.
2. **Oracle strength (D1)** — the suite has survived a `mine-oracle-strength` (F29) blind-battery
   audit **on an integrity-proven instrument**, or the run **schedules that audit as its own battery
   stage** (Stage 5 PROVE). Instrument honesty is F29's territory: this skill **asserts the
   attestation, never re-implements the checks** — no kill-attribution logic, no battery runner
   lives here.
3. **Golden-seam check (G2)** — consult the campaign's golden-seam catalog (the `docs/golden-seam-catalog.md`
   species — a **campaign-owned instance**, never authored here). A unit **absent from the catalog,
   or catalogued as seamless**, is recorded in the report as a **declared gate gap — never silent**.
   The required catalog row shape and seam taxonomy are the live campaign instance's; see
   §Golden-seam catalog contract for the columns this gate reads.
4. **Perf-delta audit (G3)** — prior perf-wave changes that are invisible to the behavior tests are
   carried as **owner-sanctioned lines in the shape directive** (they are intended deltas, not
   regressions). The run records a **before/after perf bench line** at this gate — the W5
   snapshot-once precedent — so a perf change is measured, not assumed.

## Stage 2 — Contract pack (assembly, `model: sonnet`)

Assemble the generator's brief: the **class name + byte-exact constructor + public signatures with
their defaults + the owner's shape directive**. Deliberately **NO import list** — linkage discovery
is one of the measured signals of the loop; handing the imports over would mask it.

**Shape-directive inputs** (design intent enters HERE, at generation time — never as post-generation
refactoring; owner ruling 2026-07-20, evidenced by the byte-identical v3 pass that was proven
redundant and discarded):

- **(a)** the `mine-design` **Stage-1 census** where one exists — **evidence only**; the prescriptive
  designer/judge stages of `mine-design` are NOT part of regeneration.
- **(b)** the ratified **conventions charter** (F27) when present — a directive input, not optional
  styling.
- **(c)** the **anti-pattern / do-not-regenerate list** (`mine-skill-candidates`) — what NOT to carry
  forward.
- **(d)** prior **perf-wave deltas** — the owner-sanctioned G3 lines.

## Stage 3 — Clean-room generation (generator, `model: opus`, spawned/background)

The generator writes the unit **from the rules alone**. Its read boundary is the instrument's
hardest defense:

- **Forbidden:** the target file in ANY form **including git history**, all test trees, and every
  design brief / spec / tech-debt doc / proposal. (Seeing the old code makes a copy; the whole point
  is *better, never a copy*.)
- **Allowed:** the registry, the entities/models/contracts/core, sibling usecases.
- **Registry semantics:** **active rows only**; **bug-preserve rows implemented verbatim** (a
  preserved bug is a verified behavior). A row's optional `precondition:` field is the rule's
  **input-assumption contract**, binding on the generator the same way the rule statement is.
- **MANDATORY outputs** (each one a measured honesty signal):
  - a **files-read honesty list** — exactly what the generator read;
  - a **declared-ambiguities list** — what the registry under-specifies (**empty is suspicious** —
    a clean registry against real code almost always leaves at least one genuine ambiguity);
  - a **rule-coverage self-check** — every active row mapped to its implementing function.
- **Analyzer-clean at the project baseline**; the generator **runs no tests** (proving is Stage 5's
  job, blind).

## Stage 4 — Hidden-oracle run + bounded repair loop (≤3) (judge, `model: fable`)

Run the unit's gated suite against the regenerated code — the oracle the generator never saw. Each
failure is **adjudicated**, never blindly patched:

- **registry-gap** — the registry itself was under-specified. Correct the registry with a **dated
  annotation**, and relay **the fact — never the old code** — to the generator. (This is the loop's
  feedback into the mining method: every registry-gap is a mining improvement.)
- **generation-slip** — the registry was right and the generation missed it. Issue a targeted repair
  instruction.

The loop is **bounded at ≤3 rounds**. More rounds than that → **NO-GO with findings** — a unit that
will not converge in three is telling you the registry or the shape is wrong, not that it needs a
fourth patch.

## Stage 5 — PROVE (invokes `mine-oracle-strength`)

Prove the regenerated suite is actually strong, blind. This stage **invokes** `mine-oracle-strength`
(F29) — a fresh blind battery → survivor adjudication → sanity-red-proven gap-kill — and **consumes
its report seam**. F28 **invokes, never re-implements**: suite-strength measurement is single-homed
in F29. The consumed seam sections (grep-stable at the F29 skill level):

```
## Scores
## Buckets
## Survivors
## Gap-Kill
## Pair
## Registry Annotations
```

Plus, at this gate: a **full-project analyze at baseline** (analyzer-clean), **shape metrics
(lizard)** for the comparison table, and the **G3 before/after perf bench line**.

## Stage 6 — Report + adoption checkpoint (mechanical, `model: sonnet`)

Assemble the terminal artifact — the **GO/NO-GO regeneration report** (§The report artifact). It
carries the verdict, the **N-way shape table** (legacy vs regenerated, lines + CCN via lizard), the
**residuals** (unresolved ambiguities, including the **unpinned-log-text ambiguity class**), the
**registry-gap findings** (the dated corrections made in the repair loop), and the **declared gate
gaps** (golden-seam absent/seamless, oracle-audit-scheduled, etc.).

**Adoption is a standalone owner question — never bundled with any other approval** (binding
2026-07-20 lesson; the same rule governs integration-branch operations). A GO is a *recommendation to
the owner*, not an adoption; the report ends by putting the adoption question on its own.

## Cluster mode (G1 — the fix-shelf pilot's need)

When the run targets a **cluster** — units the target design merges, splits, or re-homes together —
one extra gate fires **before generation**: the **rule→target-home mapping check**.

- **Every legacy registry row from EVERY cluster unit** must map to a **named home in the target
  design** (target unit + function), **or** carry an **explicit disposition** (`retired — owner-ruled`
  with a dated annotation).
- **Orphaned registries** — a unit the target design **dissolves** — require explicit dispositions
  for their rows; a dissolved unit is not permission to drop its behaviors silently.
- **Fail-closed:** an **unmapped row HALTs the run before generation.** No regeneration begins with a
  behavior that has no home.

Wave-model context: **waves are cut by the *target* architecture** — the re-shape-vs-in-place-chunk
doctrine (method-v2, ratified). Not everything re-homes; the cluster is whatever the target design
groups.

## Calibration ledger (mechanism + seed)

The **calibration ledger** grows per run: post-generation findings become **directive lines for the
next run** — **never applied passes** on the current output (design intent enters at generation time,
Stage 2, not as a post-hoc refactor). The ledger ships **seeded** with the four ratified rulings
(proposal §S1, election-worksheet AS-4):

1. **consts for filesystem/sentinel literals** — no bare magic paths or sentinels.
2. **centralize ≥3-repeated resolution shapes** — a resolution repeated three or more times is
   extracted once.
3. **the +15–20% code-growth budget** — measured in **CODE lines, comments excluded**; plumbing must
   **earn its signatures back** (growth beyond the budget must pay for itself).
4. **the structure lines** — config/accumulator split in context records; **assembly separate from
   I/O**; **exhaustive switch for enum dispatch**.

**Campaign ledgers extend this seed** — a campaign's instance adds its own directive lines and lives
in the campaign-owned tree (campaign #2's sits beside its conventions charter, `docs/conventions/`);
the skill names where the instance lives, it never authors the campaign instance here (D2).

## Stage-model pins (owner-ratified 2026-07-22)

**Explicit `model:` override on every dispatch — never session-inherit** (supersedes the S1
proposal's budget-era all-sonnet line). Capability is spent where the campaigns proved failure
lives — registry completeness and adjudication — never on generation glamour.

| Stage | Class | `model:` |
|-------|-------|----------|
| 1 — Preflight (gates + run-2 freshness refresh) | mechanical | **sonnet** |
| 2 — Contract pack | mechanical assembly | **sonnet** |
| 3 — Clean-room generation | generator | **opus** |
| 4 — Hidden-oracle repair adjudication | judge | **fable** |
| 5 — PROVE | invokes `mine-oracle-strength` (its own pins) | — |
| 6 — Report | mechanical | **sonnet** |

The **asymmetry rule (binding):** verification never runs below generation — the repair judge
(fable) is never below the generator (opus) whose output it adjudicates.

## Golden-seam catalog contract (G2 — the row shape this preflight reads)

The golden-seam catalog is a **campaign-owned species** (D3): the skill defines the row shape it
consumes and reads the live instance at preflight; it **never authors the catalog**. The live
campaign #2 instance (`docs/golden-seam-catalog.md`) is the shape precedent — its columns:

| Column | Meaning |
|--------|---------|
| `unit` | the catalogued unit |
| `layer` | architectural layer (core / cross / data / domain / …) |
| `registry` | the unit's business-rule registry path |
| `rules` | rule count |
| `gated` | mutation-gated? |
| `seam` | the seam kind (taxonomy below) |
| `byte-comparable?` | whether the seam yields a byte-comparable oracle (yes / partial / no, with the reason) |
| `wave-scope` | which wave/pilot the unit belongs to |

**Seam taxonomy:** `either-serialize` (a `Future<Either<Failure, T>>` or bare serializable `T` with
`toJson` → serialize-compare pin) · `flow-golden:{flow}` (a filesystem output pinned by an
integration-test JSON golden) · `file-write` (an fs write with no golden) · `none` (void / UI / pure
scalar — may still be behavior-pinned by its rules suite). A unit whose row is `seam = none` or is
absent from the catalog is the **declared gate gap** Stage 1 records. (The catalog is campaign-owned
and moves — read the live instance's header at preflight; these columns are the shape, not a pin.)

## The report artifact (the terminal GO/NO-GO)

Stable, grep-friendly section names — the run's terminal artifact:

```
## Verdict                GO | NO-GO, with the one-line basis
## Shape                  N-way comparison table (legacy vs regenerated: CODE lines, CCN via lizard)
## Residuals              unresolved ambiguities (incl. the unpinned-log-text class)
## Registry-Gap           registry corrections made in the repair loop (each with its dated annotation)
## Gate-Gaps              declared gate gaps (golden-seam absent/seamless; oracle-audit scheduled; …)
## Perf                   the G3 before/after bench line
## Adoption               the standalone owner question — never bundled with any other approval
```

## Decisions

- **D1 — p0d incident extras excluded** (user-confirmed): the estate-damage sweep and the
  owner plugin-gate stops are **incident remediation, not the standard loop**; instrument honesty is
  delegated to F29 (the D1 oracle-strength gate asserts F29's attestation).
- **D2 — Ledger seeded in-skill:** the four ratified rulings ship as skill-default directive lines;
  campaign instances extend them (two-way door — a campaign-only ledger was rejected: every new
  campaign would re-derive the ratified rulings).
- **D3 — G2 catalog is a campaign-owned species:** the skill defines the required row shape and
  consumes the live instance at preflight; it never authors the catalog.
- **D4 — PROVE is an F29 invocation** with the report-seam grammar as the contract
  (`## Scores / ## Buckets / ## Survivors / ## Gap-Kill / ## Pair / ## Registry Annotations`).

## Execution topology (who runs what)

Multi-agent by design: the **orchestrator owns spawning** and has no filesystem — agents do all I/O
(the clean-room generation, the battery, every evidence command). Stages run as **background staged
agents** carrying the stage prompts, each dispatched at its §Stage-model pin; the orchestrator
**polls stage completion, never blocks**. The canonical topology shape is
`../mine-verify-cover/references/mine-family-core.md` §Execution topology (the mines share it); this
loop reuses that spawn discipline while remaining a non-family consumer.

## Safety rails — the prohibitions

- **Never let the generator see the target file** — in any form, including git history and the test
  trees. The clean-room read boundary is the instrument's hardest defense (a copy is not a
  regeneration).
- **Never generate past an unmapped cluster row** — in cluster mode an unmapped legacy row HALTs
  before generation; a dissolved unit still needs explicit dispositions.
- **Never re-implement suite-strength measurement inside this skill** — PROVE **invokes**
  `mine-oracle-strength`; the battery, the kill-attribution rule, and the honesty proof live there,
  single-homed.
- **Never apply design intent as a post-generation refactor** — it enters at Stage 2 (generation
  time) or it enters the ledger as a directive line for the next run.
- **Never bundle adoption** — adoption (and integration-branch operations) are always standalone
  owner questions; a GO is a recommendation, not an adoption.

## What this skill does NOT do

- **Mine or verify rules** — it consumes a gated registry; building/gating one is `mine-verify-cover`.
- **Design the target architecture** — the owner decides the shape; this loop regenerates into it and
  checks completeness (every rule has a home).
- **Measure suite strength** — that is `mine-oracle-strength` (F29), which PROVE invokes.
- **Author the golden-seam catalog or the campaign calibration ledger** — both are campaign-owned
  species; the skill defines their shape and consumes the live instances.
- **Run a live regeneration in this dev repo** — no stack toolchain runs here; the live loop is
  operator-owed at first campaign use (the fix-shelf pilot / a standalone unit run).

## Relationship to other skills

| Skill | Relationship |
|-------|-------------|
| `mine-verify-cover` | **Registry source.** Builds and mutation-gates the registry this loop regenerates from; its **run-2 refresh mode** is the Stage 1 freshness gate. Ground truth: code; gate: mutants. |
| `mine-oracle-strength` (F29) | **PROVE dependency.** Stage 5 **invokes** its blind battery + adjudication + gap-kill and consumes its `## Scores / ## Buckets / ## Survivors / ## Gap-Kill / ## Pair / ## Registry Annotations` report seam. F28 invokes, never re-implements. |
| `mine-design` | **Census as directive evidence only.** Its Stage-1 complexity census is a shape-directive input (Stage 2 (a)); its prescriptive designer/judge stages are NOT part of regeneration. |
| `mine-skill-candidates` | **Anti-pattern list.** Supplies the do-not-regenerate list (Stage 2 (c)). |
| F27 conventions charter | **Directive input when present** — the ratified charter is a Stage 2 (b) shape-directive input, not optional styling. |
