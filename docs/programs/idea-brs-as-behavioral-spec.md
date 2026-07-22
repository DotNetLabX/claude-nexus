# Idea — a mined BR registry is a *verified behavioral specification*, not pseudo-code

**Captured:** 2026-07-22 · **Status:** idea — candidate to graduate into `br-anchored-regeneration.md` §2 doctrine · **Owner to rule:** Maria

## The question that prompted it

While the regeneration pilot (regenerate classes/code/project from mined BRs) is running and looking
like it will succeed: *are the mined BRs a sort of semantic model of the code, or a representation as
pseudo-code?*

## Short answer

Decisively the semantic side — but the precise term is **verified behavioral specification**. A mined
BR registry describes *what the unit does* (its input→output relation, boundaries, invariants), not
*how it does it* (control flow, algorithm, decomposition). Its **mutation-gated test suite is that
specification made executable** — the oracle, proven to actually bite. The two together are an
**extensional contract**, not an **intensional transcription**.

That distinction is not academic — it is the whole reason the pilot works.

## Pseudo-code vs behavioral spec

| | Pseudo-code (intensional) | Mined BR registry (extensional) |
|---|---|---|
| Describes | the *how* — steps, branching, algorithm | the *what* — observable behavior, contracts |
| Relation to the impl | isomorphic; carries its structure (and accidental complexity) forward | structure-independent; many impls satisfy it |
| Under a rewrite | a **fixed point** — forces new-impl ≈ old-impl | an **invariant** — both endpoints satisfy the same spec |
| Verification | none inherent | skeptic re-executes each rule's evidence; mutation gate proves the oracle |
| Named / reasoned-about | restated code, still anonymous | each rule named + evidence-cited → completeness is checkable rule-by-rule |

## Why this *is* the mechanism behind "better, never a copy"

Regeneration is a behavior-preserving map: `old-impl → spec → new-impl`. Only an **extensional**
representation is invariant across that map — both endpoints can satisfy the same spec while looking
nothing alike. A **pseudo-code** anchor would instead pin the *shape*, forcing the new code back into the
old structure — the exact thing the program's governing directive ("*better, never a copy* —
equivalence gates protect behavior; they never mandate structural closeness") wants to discard.

So the owner's intuition — the pilot succeeds *because of* the mined BRs — has a precise name: the BRs
succeed because they are semantic, not because they are a good code transcript. The empirical proof is
already in the campaign record: **P0-RC regenerated 599 readable-first lines against a 1,335-line
refactored original and was adopted** (`br-anchored-regeneration.md` §2). A pseudo-code anchor could not
have produced a 2.2× smaller, differently-shaped unit that still passed the gates — that reshaping is
only possible because the anchor pinned behavior, not structure.

This also names the difference from a blind golden-master / characterization test (Feathers): those pin
*observed* behavior anonymously ("this is what it does; I don't know why"). A mined+verified BR pins
*named, evidence-cited* behavior ("this is the rule; here is the proof"). The named form is what lets a
human design a better architecture and a machine check that every capability and rule has a home — you
cannot reason about the coverage of behavior you never named.

## The caveat (the boundary of the metaphor)

A *formal* semantic model is **complete** — it fully determines behavior. A mined BR registry is a
semantic model of the **mined-and-gated subset only**; it is silent on everything that was not mined.
During regeneration, un-mined behavior is **unconstrained** — the new impl does whatever it does there,
and no gate catches it until a fresh blind battery exposes it. The program's own doctrine is exactly
this: *"generation is not the bottleneck — registry completeness and oracle strength are"*; every
campaign repair traced to registry under-specification, and every gate-invisible miss (BR-106, the
weak-oracle shells, the 20 REAL blind spots) was an un-mined hole. **Coverage is the edge of the
"semantic model" claim** — trustworthy inside it, blind outside it.

## Where BRs sit in the program's semantic layers

"Semantic" is the right *category*, but the program already reserves the phrase **semantic model**
(`mine-semantic-model`) for **data semantics**. Placing BRs precisely:

- **Behavioral semantics** — `mine-verify-cover` BR registry (this idea) — what one unit computes.
- **Data semantics** — `mine-semantic-model` — what the data means/shapes.
- **Flow semantics** — `mine-verify-flows` — how units compose into user flows.
- **Structural map** — `mine-architecture` — the current-state boundaries + BR-coverage join.

All four are extensional (meaning-level, not pseudo-code). The **whole-system** semantic model is their
*join*, at the unit grain and above — no single registry is it alone. A BR registry is the
**unit-grain behavioral** layer of that join.

## Open follow-on (2026-07-22) — is this the *best* representation for regeneration?

"Best representation for regeneration" conflates two jobs the BR registry does unequally well:

- **Generation input** (what the LLM reads to regenerate) — named extensional prose rules + reference
  model + pattern pack are close to best-available and LLM-native; the only known weakness is prose
  ambiguity, already addressed by the declared-ambiguity → registry-repair loop. Keep as-is.
- **Acceptance oracle** (what proves equivalence) — the mined mutation-gated suite is coverage-bounded
  by mining (the same blind spot §"caveat" names). Two strengtheners, both already partly in-toolkit,
  attack that ceiling:
  - **property / metamorphic specs** over example tests (invariants over input *spaces*, not points) —
    cheap; already have FsCheck / kiri_check / RapidCheck.
  - **differential testing against the frozen legacy at the golden seam** — coverage-*unbounded* by
    mining; catches un-mined divergence for free. Feasible where the unit is harnessable in isolation
    (proven pure domain calcs: posmCompliance, CompleteRealogram; harder for stateful/IO units).

**Provisional design read (Architect, confidence high):** keep the registry as the *design* surface;
move the *acceptance* side from "mined suite alone" toward "mined suite (names + design) + property /
differential oracle against frozen legacy (coverage-complete equivalence)."

**Reassessment (2026-07-22, Fable) — routing upgraded from forked dive to `/deep-research`.**
Re-evaluation found the "narrow dive" framing under-scoped:
- The question is **breadth-first** — it spans multiple mature literatures (behavioral-spec graphs,
  inferred invariants/contracts (Daikon lineage), EARS, DSL/model lifting, differential + metamorphic
  testing, translation validation, spec-completeness measurement). Per the research-routing doctrine,
  breadth-first → deep-research, user-gated.
- It is **program-foundational, slow one-way door** (ADR-25 frame): every campaign accrues registries
  and gates shaped around this representation; switching later invalidates accumulated mining artifacts.
- **New gap surfaced:** current miners extract **branch-shaped** rules; no mine extracts
  **property-shaped** rules (invariants over input spaces). Property mining (Daikon-style dynamic
  inference or LLM property mining) is the one missing layer in the composite generation input
  (registry + design brief + reference model + pattern pack) — and it strengthens the oracle directly
  (property toolchain already in-adapter: FsCheck / kiri_check / RapidCheck). **Candidate mine.**
- **Weighting:** P0-FSD's 97/97 zero-repair says representation adequacy is already high for
  rule-shaped units; the binding constraints are registry completeness + oracle strength — so the
  research weights the *oracle* question at least as heavily as *representation*.

**Grounding check before firing (2026-07-22, both campaign repos read):** the WHAT-representation is
the estate's MOST validated layer (repairs 1/39, 0/97 across five runs — prose rules + contract pack
suffice for behavior); the HOW layer's gaps have an internal build queue (F27 charter, F28
regenerate-unit, F31 pattern pack). The genuinely uncovered representation layers, evidence-cited:
(1) **no property/invariant layer** — P0c's BR-89 was a factually wrong formula surviving 3-miner
consensus + skeptic, caught only by the regeneration itself; BR-129 was a missing merge-asymmetry
invariant; (2) **recurring prose-ambiguity shapes** — accessor pins (projected-vs-raw), sign/endpoint
semantics, log-text — a precision-grammar question; (3) **the oracle is the load-bearing risk** — all
20 real cross-campaign defects sat in the TEST half of the representation, never the rules; and
"faithful regeneration as registry verifier" (the BR-89 catch) wants checking against
N-version / translation-validation literature. Research therefore weights Q1 invariants/precision and
Q2 oracles; the pipeline-exists and HOW questions are out of scope.

**Refined research question (RUN 2026-07-22 → captured as
`docs/kb/research/spec-representation-and-equivalence-oracles.md`, cite-check passed; 24 sources,
22/25 claims survived 3-vote verification. Headline: Q1 YES-with-limits — inferred properties catch
wrong-formula defects but only behind a skeptic + mechanical downstream check, which VALIDATES the
pipeline's Mine→Verify→Gate + regeneration-as-checker shape, and BR-89 has a named 2002 Daikon/ESC-Java
precedent; contracts (pre+post) close most of the test-validation soundness gap (~6x overestimate
confirmed); Q2 oracles = evidence hole, dedicated follow-up sweep owed; Q3 = buggy/fixed-pair
discrimination adoptable as the spec-strength metric, invariant-gap route refuted 0-3):** for LLM regeneration of
legacy code into a new architecture — (1) do richer representations (behavioral-spec graphs, inferred
invariants/contracts, EARS, DSL/model lifting) demonstrably beat named prose rules + gated tests as
generation input? (2) is differential/metamorphic testing against a retained reference implementation
established as a stronger equivalence oracle than a fixed mined suite (translation-validation /
compiler-testing lineage)? (3) how is spec/oracle *completeness* measured absent a golden set?
The landscape sweep (`br-anchored-regeneration-landscape.md`, 2026-07-19) did not target any of these —
it aimed at "does the pipeline exist"; zero overlap. Capture target on run: `docs/kb/research/`.

## One-line takeaway

A mined BR registry is a verified behavioral specification and its mutation-gated suite is that spec made
executable — a semantic (extensional) contract, not a pseudo-code (intensional) transcript. That is
precisely why regeneration yields *better, never a copy* — and its trust ends exactly where BR coverage
ends.
