# Proposal — mine-algorithm: canonical-algorithm recognition and BR-conformance-gated replacement (the seventh mine)

**Status:** Ratified — 2026-07-12 by Laurentiu. Drafted 2026-07-11; research closed (R1 equivalence, R2 catalog; R5 deferred, non-gating). Pilot sequence per Graduate-to-spec: 1) fixing_tools optimizer, 2) `clusterize`.
**Pilot 1 complete (2026-07-12):** method validated end-to-end — 3/3 matcher convergence, no over-matching, gate caught 1 accident-class deviation and refuted 1 REAL-bug adjudication via the re-grounding rule. Brief: `omnivision-ai-sdk/docs/algorithm-briefs/planogram/fixing_tools-optimizer.md`; run report: `omnivision-ai-sdk/docs/specs/adhoc-MineAlgorithmPilot/delivery/run-report.md`. Owner call resolved: input-order ratified — swap GO.
**Pilot 2 complete (2026-07-12):** registry pulled (79 verified rows, 100% skeptic survival, one 3/3-unanimous rule corrected) + full method on `clusterize` — verdicts: ≈263 NLOC dead-code deletion APPROVED, discovery core restructure-toward-canonical (sequential RANSAC over linked `cv::RNG`+`cv::fitLine`, 0 new deps, seed-injection as enabling refactor), merge swap owner-gated (BR-35/36 accidents). Brief: `omnivision-ai-sdk/docs/algorithm-briefs/planogram/clusterize-shelf-clustering.md`; run report: `run-report-pilot2.md`. Model-tier finding: sonnet lanes + opus gate suffice — SKILL.md default. **Graduation evidence complete — next: skill authoring, which also writes the routing contract into the mine-family core.**
**Decision-maker:** Laurentiu
**Companion:** `mine-design-2026-07.md` — sibling skill, same 3-stage shape; mine-design prescribes *structure* (patterns/principles), this one prescribes *computation* (algorithms). **Routing-boundary home (owner decision, 2026-07-12):** the shared "algorithm-shaped vs rule/mapping-shaped" routing contract will live **once, in the mine-family core doc** (nexus 1.26.1 shipped the core; the contract is **not authored there yet** — the first sibling to graduate-to-spec writes it in that single session, and both skills then cite it rather than restating it). mine-design's census routes algorithm-shaped units here; this skill hands rule/mapping-shaped units back. On drift, supersede the core.
**Inputs contract:** REQUIRED — unit source + its BR registry (HARD dependency: the registry is the stage-3 conformance oracle; a unit without one must be mined first, as with `clusterize`). OPTIONAL — tech-debt row (targeting only), bug-handoff (classifying deviations as adjudicated-bugs), slice harness (executable comparison). The external reference-model is NOT an input.
**Recommendation:** Build a mine-family skill that, given one algorithm-shaped unit and its BR registry, (1) characterizes the *computational problem* the unit solves, (2) matches it against canonical algorithms from the literature, and (3) adjudicates replacement through **BR-row conformance** — the canonical algorithm must reproduce the unit's verified behavior, with every deviation classified as adjudicated-bug / domain-requirement / accident. Output: an algorithm brief recommending replacement only with a quantified win.
**Confidence:** High — re-derived 2026-07-12 after the research pass. The named main risk (equivalence-testing depth) is resolved by R1: executable back-to-back comparison as the default, with an engineered per-quantity tolerance comparator. Stage 3 has a real oracle (the BR registry, with the deviation-triggered row re-grounding rule below closing the mis-mined-row gap); stage 2 recognition is demonstrated and catalog-bounded (R2). Remaining unknowns are pilot-answerable, and the pilots are in the graduation path.
**Impact:** 7
**Effort:** med
**Date:** 2026-07-11

## Need

Hand-rolled implementations of problems the literature solved decades ago are a distinct debt species: they carry the bugs, the untestability, and the maintenance load of custom code while delivering nothing a canonical algorithm wouldn't. The SDK (`D:\Omnishelf\omnivision-ai-sdk`) proves the pattern **in both directions**:

- **Where canonical algorithms were used, the code is the healthiest in the repo:** Hungarian (assignment), Levenshtein (compliance alignment), SORT (tracking), DBSCAN (vendored, clustering). Two of these are the estate's mutation-gate success stories (levenshtein 96% kill; hungarian registry) — named algorithms come with defined behavior, which is why they test well.
- **Where they weren't:** `clusterize` (`planogram_tools.cpp:4409`, 278 NLOC, CCN 72) is hand-rolled shelf-line clustering *in the same repo that vendors DBSCAN*; the fixing_tools action optimizer reads as a hand-rolled greedy take on an assignment/scheduling problem (175-row registry, 5 adjudicated bugs).

Two further facts make this a skill: the BR registries (928 verified rows in the SDK — 2026-07-10 campaign snapshot) provide the **conformance oracle** that makes replacement safe rather than reckless; and the audience speaks this language — a senior algorithms-first developer who distrusts "patterns" will engage with "your clusterize is DBSCAN with three accidental deviations, two of which are your open bugs."

**Out of scope:** performing the replacement (developer/plan pipeline); inventing new algorithms; units whose complexity is rule- or mapping-shaped (mine-design's territory — its census routes those).

## Approach — the method (3 stages, mine-family shape)

**Stage 1 — problem characterization (from BRs + code).** State the *computational problem* the unit solves — inputs, outputs, invariants, objective function — abstracted from the implementation. The unit's BR registry rows are the raw material: they describe verified behavior, which is the problem spec. Output is skeptic-checkable (each claim cites rows/lines).

**Stage 2 — catalog match (2–3 independent matchers, clean-room).** Map the problem to canonical candidates (sequence alignment, assignment, clustering, scheduling, graph, DP families; CV-specific canon where relevant), each with complexity class and **library availability**. Hard constraint: prefer already-linked libraries — OpenCV, Eigen, STL, vendored DBSCAN/NumCpp — so a replacement adds **zero new NDK dependencies**. Recognition is a demonstrated LLM strength; independence + stage 3 contain the over-matching failure mode.

**Stage 3 — conformance adjudication (adversarial, the honest part).** The canonical candidate is checked against the unit's verified BR rows, row by row. Every deviation is classified:

- **adjudicated-bug** — the deviation is a known defect (cite the bug-handoff item); the replacement *fixes* it;
- **domain-requirement** — genuine business behavior; the canonical algorithm must be parameterized/extended to honor it, or the candidate dies;
- **accident** — behavior nobody chose; owner call, recorded.

**The oracle is itself challengeable (critic fix, 2026-07-12):** a canonical deviation is also evidence that the BR row may be mis-mined — a bug captured as a "rule", low-agreement rows especially. Before a deviation is honored as a **domain-requirement**, the deviating row is re-grounded against source; a row that fails re-grounding is corrected in the registry, not defended by the gate.

Replacement verdict requires a **quantified win** — and maintainability is quantifiable in this estate (owner correction, 2026-07-11): NLOC deleted, CCN drop, mutation-kill improvement on the gated suite, adjudicated bugs eliminated, complexity class. "Cleaner" qualifies when it arrives as numbers; it never qualifies as an adjective.

**Output grammar — `algorithm-brief.md` per unit:** problem statement (row-cited) · canonical match(es) with complexity + library source · conformance table (BR rows × canonical behavior, deviations classified) · replacement recommendation with the quantified wins · migration path + required net (golden flow / gated suite) · rejected candidates with reasons.

## Benefits

- **Wholesale code deletion:** a canonical replacement typically collapses hundreds of custom lines into a call plus an adapter — the cheapest CCN reduction available anywhere in the plan.
- **Bug elimination by substitution:** deviations classified as adjudicated-bugs disappear with the replacement instead of being fixed one by one.
- **The registries' third consumer** (after the edit-time guardrail and mine-design's rule catalogs): conformance oracles.
- **Highest ratification chance of the family with an algorithms-first owner** — it argues in his native language and its wins are numeric.

## Alternatives

- **Manual recognition in architect sessions** — same session-trap argument as mine-design: works, doesn't scale, evidence dies with the context window.
- **Fold into mine-design** — rejected: different taxonomy (algorithm catalog vs pattern decision table) and different oracle (BR conformance vs census citations). But the family-core stages (characterize → constrained propose → adversarial verify) should be shared per the P1 consolidation direction.
- **Straight library substitution without the conformance gate** — rejected outright: hand-rolled code accretes behavior clients depend on; replacing it on cleanliness grounds silently breaks production. The BR gate *is* the proposal.

## Unresolved (status ledger — research closed, R5 deferred)

1. **Catalog scope:** RESOLVED 2026-07-12 — researched and captured to `docs/kb/research/canonical-algorithm-catalog.md`. ~25 entries, three-value availability field (`library` / `vendored` / `reasoning-only`). Key result: most CV-canon is already `library`-available in OpenCV (NMS all variants, USAC RANSAC, Kalman, k-means, `cv::partition` grouping, Hough) — those replacements are near-pure deletions; **assignment/Hungarian is the top reasoning-only hand-rolled family** (no solver in the linked set — SORT ports vendor their own), and `clusterize`/DBSCAN is `vendored`. Bounding discipline (few/frequent/balanced/deduped, ~30 cap, match by problem-signature not code-tokens since code-only recognition is only F1~0.56) confirmed directionally. Catalog-discipline sub-claims are uncorroborated (usage limit) — reconfirm trigger recorded in the entry.
2. **Equivalence-testing depth:** RESOLVED 2026-07-12 — researched and captured to `docs/kb/research/algorithm-equivalence-testing.md`. **Default: executable back-to-back comparison is mandatory for any floating-point/geometric output; conformance-by-reasoning is permitted only for exact integer/discrete outputs with full BR-row reproduction.** Decisive finding: bit-exact parity between the x86 dev host and the arm64 target is unattainable (Clang-on-Arm FMA default + `libm` not required to be correctly-rounded), and `-ffp-contract` flags do NOT fix it (adversarially refuted) — so the comparator is an *engineered per-quantity tolerance* (ULP or `max(rel,abs)` for scalars; coordinate-sized epsilon for geometry), never `==`. Even shared-ancestry forks diverge (NEZHA). Corpus = production capture + difference-guided generation + RapidCheck `rc::Arbitrary`; metamorphic relations are a one-sided fallback (a violation proves a bug; holding never proves equivalence).
3. **Performance parity obligation (R5 — DEFERRED):** on-device (NDK/arm64) replacements need complexity-class reasoning plus a micro-benchmark in the harness — same "pinned behavior, measured runtime" discipline as the golden harness. Research on the arm64 micro-benchmarking recipe (Google Benchmark under NDK, big.LITTLE / frequency-scaling pitfalls, harness timing-line integration) is **deferred until the pilot approaches** — it gates nothing before then, and R1 already establishes that the same target-ABI-not-dev-host rule applies to timing as to numerics.
4. **Family-core reuse:** RESOLVED 2026-07-11 — the P1 family-core consolidation shipped (adhoc-MineFamilyCore, nexus 1.26.1, commit `a4742bf`) and the consuming SDK is on the current plugin version; both siblings slot into the core reference's stage plumbing rather than duplicating scaffolding.

## Graduate-to-spec

Ratification (research items 1–2 are closed; R5 stays deferred until the pilot approaches) → **pilot 1: the fixing_tools action optimizer** — its registry already exists (175 rows, 5 adjudicated bugs), so the full method runs today; the question it answers: is the optimizer a known assignment/scheduling problem, and do the 5 bugs fall out as deviations? → **pilot 2: `clusterize`** — the marquee case (vendored DBSCAN sitting next to hand-rolled clustering), whose concern has **no registry yet** (the campaign mined planogram_tools' KPI concern, not clustering), so this pilot first *pulls* a Mine→Verify registry for the clustering concern — exactly the "cold tail deferred until WS7 pulls it" trigger foreseen in the campaign runstate → skill authoring per skill-authoring-recipe → route into the SDK WS7 plan as the replacement lane alongside mine-design's structural lane.

## Provenance

SDK architect session 2026-07-11 (repo `D:\Omnishelf\omnivision-ai-sdk`, thread adhoc-GraphSpike) — the same session that produced `mine-design-2026-07.md`; the owner's maintainability-quantification correction is encoded in Stage 3. Campaign inputs: `docs/business-rules/` (928 verified rows — 2026-07-10 campaign snapshot), `docs/tech-debt/` (50 rows), `docs/specs/adhoc-GraphSpike/delivery/bug-handoff.md` (85 items), campaign runstate (cold-tail pull rule).
