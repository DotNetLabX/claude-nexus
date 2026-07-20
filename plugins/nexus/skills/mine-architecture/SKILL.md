---
name: mine-architecture
description: Produce the skeptic-verified current-state semantic map of ONE repository — parallel clean-room extractors read the source per dimension (module boundaries and dependency directions, the business-function catalog, data ownership, contracts and seams), a fresh skeptic re-executes every claim's evidence before it enters the map, and a BR-coverage join marks which capabilities the business-rule registries cover and flags the zero-coverage modules, written to docs/architecture-map/ in the target repo. Current-state only — zero target-design content. Use when a rewrite or an audit needs a verified answer to what a system actually is, structurally, and where the proof is. Not a debt mine (mine-verify-repo), a virtue mine (mine-reference-model), a unit-level prescription (mine-design / mine-algorithm), and never a proposed target architecture.
user-invocable: true
---

# Mine→Verify→Emit (repo-architecture scope)

Point this at ONE repository. It produces a **skeptic-verified current-state semantic map** —
`docs/architecture-map/` in the TARGET repo — that answers the question a rewrite must answer
before designing anything: **what does this system actually do, structurally, and where is the
proof?** The de-facto module set, the business capabilities each module carries, who owns which
data, and which contracts join them — every claim carried by re-executable evidence.

**Current-state only.** The artifact contains **zero target-design content** — no proposed modules,
no recommended decomposition, no migration ordering. Target design is a *decided* human artifact,
informed by this map but never a copy of it; a mined "proposed architecture" would be a judgment
wearing a fact's clothes and would silently anchor the human design. This mine finds *what is*.

This is the **eleventh mine** — a **full method-contract member** of the mine family (unlike the
two name-and-shape members): unit = one repo's architecture; ground truth = code structure (+
optional structural graph and change-coupling table); gate = adversarial skeptic re-execution;
output = the `docs/architecture-map/` registry (the sixth registry species). Read
`../mine-verify-cover/references/mine-family-core.md` §The mine family for the full 11-row family
table and the shared invariant (bounded unit → clean-room miners → consolidate → skeptic verify →
verified registry) all eleven members follow.

**The routing triangle.** Three repo-scoped mines answer three different questions about the same
codebase and never duplicate one another:

- **`mine-architecture` (this) — *what is*.** The verified current-state structural map.
- **`mine-verify-repo` — *what hurts*.** The prioritized technical-debt registry.
- **`mine-reference-model` — *what to copy*.** The portability-graded virtue registry.

What changes here is the failure mode the gate kills. This mine kills **the plausible-but-wrong
structural claim** — a dependency direction that reads right but the imports contradict, a
capability traced to a `file:line` that does not contain it, a "this module owns type X" that an
outside mutator refutes. An unverified structural claim in a rewrite's current-state map is worse
than a missing one: it silently mis-scopes the target design that consumes it.

## The pipeline

```
Extract     parallel clean-room extractors, one per dimension (default four, below) — every claim
            fact-shaped: statement + reproducible evidence command + file:line traceability
Consolidate merge per-dimension claims into the single map IR; dedup cross-dimension overlaps;
            join BR-registry coverage per capability (when docs/business-rules/ exists)
Verify      the adversarial skeptic RE-EXECUTES each claim's evidence -> CONFIRMED / WRONG /
            IMPRECISE; dependency-direction claims re-queried against the graph/import scan;
            catalog traceability re-resolved; the vacuous-evidence check applies
Emit        write docs/architecture-map/ in the TARGET repo (registry invariants, ADR-43/45/49
            lineage): index.md (context map + module table + run report) + one file per module
Refresh     run 2+ re-verifies existing rows against the git delta (family refresh grammar)
```

## The four dimensions (default set, overridable per run)

- **D1 — Boundaries & context map.** The de-facto module set and the dependency directions between
  modules. Ground truth: the structural graph when present (graphify `graphify-out/`), else a
  deterministic include/import scan; the change-coupling table (when available) adds *evolutionary*
  coupling evidence — modules that co-change without a static edge are a flagged boundary fact.
  Every direction claim carries the query/grep that proves it.
  **Overlap disposition.** `mine-verify-repo`'s global structure-graph pass derives
  dependency-direction facts from the same substrate — so when the target repo has
  `docs/tech-debt/` with **confirmed global-pass rows**, D1 **reuses those edge facts as input**
  (the same standing as the coupling table) rather than re-deriving them; independent derivation
  happens **only** when they are absent. `index.md`'s run report records which substrate a run used
  (graphify / import scan / reused tech-debt rows), so two registries in one repo can never
  silently disagree about their basis.
- **D2 — Business-function catalog.** Hierarchical: module → capability → entry function(s). Each
  capability row carries an **EARS-style** testable statement (EARS = the "Easy Approach to
  Requirements Syntax" — a `When {trigger}, the {module} shall {response}` sentence, i.e. a
  requirement phrased so a test can be written from it) **plus** per-finding source traceability
  (the `file:line` of the implementing entry point). **The catalog cites, never duplicates:** where
  a BR registry covers the capability, the row carries the registry rows' ids as its rule coverage
  (the join below); the rules themselves stay in `docs/business-rules/` — one canonical set.
- **D3 — Data ownership.** Which module owns each core domain type / store, and who mutates it from
  outside — every outside-mutation claim backed by the grep that finds the mutating call site.
- **D4 — Contracts & seams.** The public surfaces between modules and at the system edge (exported
  APIs, FFI seams, message/file formats), each with its declaring `file:line`.

### The BR-coverage join (the census feed)

At Consolidate, when the target repo has `docs/business-rules/`, every D2 capability row gains a
`rule-coverage` field, whose grammar is `{registry file + row ids} | none | no-registry-estate`:

- **`{registry file + row ids}`** — the covering registry file plus the covered rows' ids.
- **`none`** — the registry estate exists but does not cover this capability — making zero-coverage
  modules a first-class, grep-countable output (the direct census evidence a rewrite's re-homing
  map starts from).
- **`no-registry-estate`** — the target repo has no `docs/business-rules/` at all; the join is an
  **optional input, never a precondition**, and this value records that a run ran without one.

## Execution topology (who runs what)

Read `../mine-verify-cover/references/mine-family-core.md` §Execution topology before orchestrating
— the canonical shape (multi-agent by design, orchestrator-owns-spawning, staged background
`general-purpose` agents, "launch = orchestrate stages") is defined there. The orchestrator has no
filesystem; agents do all I/O, including running the extractors' and skeptic's evidence commands.

This skill's own sizing: **four dimension extractors in parallel (default), then ONE
consolidate+skeptic agent** — the `mine-reference-model` staging shape, which held comfortably at
roughly 145 findings on the debt-mine pilot, so a four-dimension architecture run is comfortably
bounded. A large `index.md` or module file is **appended per section** (core §Execution topology
chunked-writes rule), never composed in one oversized write.

**On a NEW target, the core §Kickoff checklist is the enforced preflight** — walk it before
launching. Tier 1 is universal (tool preflight, expected survival rate, stop-budget, run-report
location). **Tier 2 — the registry-oracle freshness check is skipped by member class: this member
consumes no registry oracle** (unlike `mine-design` / `mine-algorithm`); the BR-coverage join input
is **optional and disclosed at kickoff**, never a precondition.

## Verify gate — the adversarial skeptic (the invented part)

- **Full consumer of the family §Skeptic protocol.** Read
  `../mine-verify-cover/references/mine-family-core.md` §Skeptic protocol for the must-RUN /
  drop-without-excerpt enforcement this gate uses unchanged: the skeptic **RUNS** each claim's
  evidence command and compares output to the claim; a verdict row that does **not** carry its
  re-execution output excerpt is **dropped by the orchestrator**; the **vacuous-evidence check**
  applies — a zero-hit/absence claim whose grep is structurally unable to match is **WRONG**, not
  CONFIRMED. Verdict grammar: **CONFIRMED / WRONG / IMPRECISE**.
- **Dimension-specific re-execution.**
  - **D1** direction claims are re-queried against the graph / import scan (or the reused tech-debt
    edge rows, per D1's overlap disposition) — the claimed direction must reproduce.
  - **D2** traceability is re-resolved — the cited `file:line` must contain the named entry point —
    and every cited BR row must **exist in the named registry file** (a `rule-coverage` citing a
    row that is not there is WRONG).
  - **D3** outside-mutation greps are re-run — the mutating call site must still be found.
  - **D4** declaring-site reads are re-confirmed — the cited `file:line` must declare the surface.
- **Anti-flattery clean-room framing (carried over from `mine-reference-model`).** Extractors are
  clean-room and are **never told what the architecture "should" be** — the stage prompt asks *what
  boundaries and capabilities does this code exhibit*, not *how well is it structured*. Framing is
  half the defense; the skeptic is the other half.
- **Judgment rides as a note, never a row.** A judgment-shaped observation ("this boundary is
  leaky", "this seam is fragile") is a **`lens-note` attached to a fact**, never a standalone
  confirmed row (`../mine-verify-cover/references/mine-family-core.md` §Fact/judgment doctrine).

## Output artifact & species

`docs/architecture-map/` in the **target** repo — the **sixth registry species**:

- `index.md` — the context map (module table + dependency-direction matrix + external seams), the
  run report (claims mined / confirmed / killed — the survival rate), and the append-only changelog.
- `{module}.md` — one per module: the capability catalog (D2 rows incl. `rule-coverage`), data
  ownership (D3), contracts (D4), each row with evidence + provenance + `last_verified`.

**Registry invariants** — read `../mine-verify-cover/references/mine-family-core.md` §Registry
invariants + refresh outcome grammar (per-row provenance, `last_verified`, rows **never deleted**,
append-only changelog, idempotent re-runs). The shipped **evidence gate**
(`tools/evidence-gate.mjs` `structuralEvidenceOk`, invoked in place per ADR-62) runs at **every row
write** — evidence that is empty, a claim-echo, or carries no re-execution content is dropped.

Two `index.md` lines are **mandatory**:

- A **`Current-state only`** header line — the artifact's own declaration that it contains no target
  design.
- A **decided-architecture pointer line** naming the repo's decided-architecture location (its
  hand-authored `docs/architecture/` estate) **or `none`**.

**Deliberate separation (decided vs mined).** A consuming repo may already carry a hand-authored
`docs/architecture/` estate (ADRs, assessments — what the humans **decided**). `docs/architecture/`
holds the decided record; `docs/architecture-map/` holds what the mine **verified the code
exhibits**. On drift, the decided record wins for **intent** and the map wins for **current-state
fact**. The pointer line keeps the two estates from ever being read as competitors.

## Binding prompt obligations (grep-checkable)

These are load-bearing prompt clauses, verifiable by grep in this file:

- **The skeptic stage prompt forbids reasoning-only verdicts.** The skeptic must RUN each claim's
  evidence command against the target source; a verdict reached by re-reasoning without execution
  is **forbidden** and, as structural enforcement, a verdict row without its re-execution output
  excerpt is **dropped by the orchestrator**.
- **The extractor stage prompt is clean-room, not target-primed.** The extractor prompt asks **"what
  boundaries and capabilities does this code exhibit"** — it must **not** ask how the code *should*
  be structured or propose any target design. Priming an extractor toward a "better" architecture is
  the anchoring attack this gate exists to stop.
- **A dependency-direction or absence claim embeds its query.** A D1 direction claim carries the
  graph query / import grep that proves it, and an absence claim ("no module imports X") embeds the
  grep that returns zero hits; the skeptic re-runs it and confirms the result. A structural claim
  without a re-executable trace is a judgment, not a fact.
- **Every D2 capability row carries a `rule-coverage` field** — `{registry file + row ids}`,
  `none`, or `no-registry-estate` — never omitted, so zero-coverage is countable.
- **`index.md` carries the `Current-state only` header and the decided-architecture pointer line** —
  both are written on every run.

## Safety rails

- **Read-only on the target source; one write.** No agent edits any source in the target repo — the
  **only write is `docs/architecture-map/`** (+ its changelog). graphify output, the coupling table,
  and the BR registries are read-only inputs.
- **Marginal-budget cap + report-on-halt** — read
  `../mine-verify-cover/references/mine-family-core.md` §Marginal-budget rail (gate on the spend
  delta, never the shared-pool absolute; every stop writes a report and never exits silently green).
- **The four prohibitions** — no skeptic verdict by re-reasoning without execution; no deleting
  registry rows; no claim without a reproducible evidence command; **no target-design content** in
  the artifact. These are the method's hard floor.

## What this skill does NOT do

- **Propose any target design** — no proposed modules, no decomposition advice, no migration
  ordering (owner-decided). The target design is a *decided* human artifact this map feeds facts to;
  a mined "proposed architecture" would anchor it. This is the first and hardest prohibition.
- Produce the **class-disposition census** (mine / brief / glue / dead) — that is a campaign
  artifact built *using* this map, not produced by this skill.
- Mine **patterns/virtues** (`mine-reference-model`), **debt** (`mine-verify-repo`), or **unit-level
  prescriptions** (`mine-design` / `mine-algorithm`) — sibling questions, not this one's.
- Mine a **security** dimension — same deferral as the siblings (`/security-review`, owner call);
  the default four dimensions do not include security.
- Build a **multi-repo / cross-repo** map — one repo per run.

## Relationship to other skills

Read `../mine-verify-cover/references/mine-family-core.md` §The mine family for the full family
table (all eleven members) and the routing triangle above for how this skill's *what is* differs
from the *what hurts* / *what to copy* siblings.

| Skill | Relationship |
|-------|-------------|
| `mine-verify-repo` | Sibling, different question (*what hurts* vs *what is*); its metric layer's coupling table AND its confirmed global-pass dependency-direction rows are **optional D1 evidence inputs** (reused, never re-derived, when present — see D1's overlap disposition). Not a consumer. |
| `mine-reference-model` | Sibling, different question (*what to copy*); staging shape and anti-flattery framing borrowed. Not a consumer. |
| `mine-design` / `mine-algorithm` | **Not inputs and not consumers of this skill.** They prescribe at unit level for existing code; this skill maps repo-level structure. **No seam, no overlap, no duplication.** |
| `mine-verify-cover` | Producer of the BR registries the D2 `rule-coverage` join cites. Independent runs. |
| `mine-skill-gaps` / `mine-skill-candidates` | Unrelated outputs (skill candidates); no seam. |
| graphify | Optional D1 substrate (structural graph); the fallback is the deterministic import scan. |
