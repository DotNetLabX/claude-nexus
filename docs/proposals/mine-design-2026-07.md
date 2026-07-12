# Proposal — mine-design: evidence-cited design prescription at class/function level (the sixth mine)

**Status:** Ratified — 2026-07-12 by Laurentiu, **fully adopt-ratified 2026-07-12** (the pilot condition was met — Confidence re-derived Medium→High after the calibration-pair + held-out pilot; see the Pilot line below). **Graduated 2026-07-12 — shipped as `plugins/nexus/skills/mine-design` (nexus 1.31.0).** Drafted 2026-07-11; research closed (taxonomy ratified in owner discussion, census-at-scale via P1, judge design via R4).
**Pilot complete (2026-07-12) — all three gates PASS:** calibration (plant killed 100%, PLN-1 reproduced + twice corrected by census counts), contrast (`fromJson` → DTO+mapper, rules engine rejected — no routing failure), held-out validation (`posmCompliance`, tier-1 discriminated among genuine designs, grounded C>B>A). **Confidence re-derived to High** — and **fully adopt-ratified by Laurentiu, 2026-07-12** (the pilot condition was met; both siblings are graduation-ready). Run report: `omnivision-ai-sdk/docs/specs/adhoc-MineDesignPilot/delivery/run-report.md`. Skill-authoring inputs recorded there (blind-judge calibration, row-9 exception-posture revision, search-root pinning, sonnet-lanes/opus-gate tiers).
**Decision-maker:** Laurentiu
**Companion:** `mine-algorithm-2026-07.md` — sibling skill, same 3-stage shape; this one prescribes *structure* (patterns/principles), mine-algorithm prescribes *computation* (canonical algorithms). The stage-1 census routes algorithm-shaped units to it.
**Routing-boundary home (owner decision, 2026-07-12):** the shared "algorithm-shaped vs rule/mapping-shaped" routing contract lives **once, in the mine-family core doc** (`mine-verify-cover/references/mine-family-core.md` §Routing boundary, core shipped nexus 1.26.1) — not restated per-proposal. **Authored into the core at graduation (nexus 1.31.0):** both skills cite it rather than restating. On drift, supersede the core, never fork the definition.
**Inputs contract:** REQUIRED — unit source + its BR registry (`mine-verify-cover` output; without it the census loses its deletion oracle and the BR-row→rule-object mapping). OPTIONAL — tech-debt row (`mine-verify-repo`: targeting/ranking + pre-verified metrics, not needed for the method itself); house-precedent inventory (patterns already present in the repo — cheap stage-0 sweep inside this skill, NOT the external reference-model, which neither miner consumes).
**Recommendation:** Build a mine-family skill that, given one class/function, produces a **design brief**: the target architecture with named patterns and principles, each pattern *earning its place by citing the exact branches it eliminates*, plus rejected alternatives with reasons. Three stages: mechanical complexity census → decision-table-constrained designers → reject-by-default judge. Output feeds refactoring plans (first consumer: the SDK WS7 plan).
**Confidence:** High — re-derived 2026-07-12 after the calibration-pair + held-out pilot. The formerly load-bearing assumption (stage-2/3 efficacy with no design oracle) is experiment-confirmed: the two-tier judge killed the planted fabricated-authority candidate at tier 1 (authority scored zero, fabricated census rows caught), discriminated among genuine designs (accounting inflation caught with excerpts), showed no position-bias flips it couldn't resolve by evidence, and the synthesis reproduced-and-refined the manual PLN-1 brief while routing the mapping-shaped contrast unit to DTO+mapper and a fresh held-out unit to a grounded ranking.
**Impact:** 7
**Effort:** med
**Date:** 2026-07-11

## Need

The SDK refactoring program (adhoc-MineCode WS7) needs a **per-unit target architecture** for every structural debt row — not just "split this file" but *into what, using which pattern, protected by which net*. Three facts make this a skill, not a one-off:

1. **The manual method works but is trapped in session context.** On 2026-07-11 an architect session derived a complete, defensible design brief for the SDK's worst function (PLN-1, CCN 103) through iterative discussion. The reasoning was sound and the owner (Laurentiu) validated it step by step — but it lives in one conversation and cost ~an hour of expert back-and-forth per unit. The SDK alone has 6 functions at CCN≥57 plus a CCN-393 parser; other repos will follow.
2. **The debt registries name what is wrong, not what to build.** `mine-verify-repo` output (50 verified rows) + the pattern toolbox map items to candidate pattern *names*, but nothing produces the evidence-cited per-unit prescription.
3. **The audience has no pattern background.** The SDK's senior dev (and most owners) won't accept "apply Specification pattern" on authority. Briefs must carry the *reasoning* — why this pattern, what it eliminates, what was considered and rejected — to be discussable. The manual session proved that register works.

**Out of scope:** generating the refactored code (the brief is a design artifact; implementation stays with the developer/plan pipeline); repo-level ranking (that is `mine-verify-repo`); replacing architect judgment (the brief is adjudicated, not auto-applied).

## Approach — the method (mine-family shape)

### Proof of concept — the PLN-1 manual session (2026-07-11, SDK repo; recorded here verbatim-in-substance because it is the calibration target)

Target: `planogram_tools::compilance::planogramCompilance` (`src/planogram/planogram_tools.cpp:1255`) — 482 NLOC, CCN 103, heading a cohort of 6 functions ≥ CCN 57. The session produced, in order:

**1. The core correction.** Extract Method *relocates* complexity, it does not reduce it — 103 paths split into 10 functions is still 103 paths. Path-count reduction requires changing the shape of the logic. The ladder derived, ordered by what each move does to path count:

- **Delete the fake paths first** (est. 20–30%): dead branches, copy-paste variants (the repo has `clenInserts`/`cleanInserts` twins), repeated defensive re-checks. The BR registry makes deletion safe: *a branch with no corresponding verified rule is a deletion candidate, not a mystery*.
- **Parse, don't validate:** the function defends itself mid-flight (null product? empty section? parseable price?) re-checked at every stage. Validate once at entry into a richer type that can't be invalid; downstream branching disappears. Single biggest path-killer in old defensive code.
- **Rules engine (Specification pattern) — the headline move:** the function is structurally "for each position, evaluate a pile of business rules and classify it"; the 103 paths are dozens of rules braided into one control flow. Each rule becomes a small named object; the god function collapses into a pipeline running a *list* of rules. **The mined BR registry rows ARE the rule catalog** — each row maps to one rule object with its own 3-line test. (This is the second payoff of the 928-row registry investment: the mining was requirements extraction for exactly this refactor.)
- **Strategy per type-fork:** branching on product kind (POSM / price tag / insert / regular) recurs through the whole function → one strategy per kind, chosen once at the top; the factory is a plain table (`map<ProductKind, strategy>`), not an abstract-factory hierarchy.
- **Table-driven logic for data-shaped branches:** thresholds, status→action mappings, category special cases become lookups.
- Extract Method's real place: the **first strangler cut** that makes the rules visible — never the destination.

**2. The architecture-level answers** (the owner asked: god class? SRP at class level? factory? visitor? template method? chain of responsibility?):

- **There is no class.** The business stratum is procedural C++: free functions over shared mutable domain structs, config read from a `Settings` singleton mid-flight, results written directly into domain objects (`position.pirsCustom = ...`). SRP applies at *module* level (the god file's four namespaces → four components); class-level design is something to *introduce*, not repair.
- **Pipeline, not Template Method:** the flow (normalize/project → align → classify → score → emit) is invariant; variation lives inside stages. Explicit pipeline of stage objects (composition); Template Method rejected — buys the same variation with inheritance coupling in a codebase with no inheritance culture.
- **Config resolved at construction, not per-item:** settings flags currently create paths *inside* the position loop. A composition root builds the pipeline once per run — flags choose which rules/strategies load, the hot path runs branch-free. Deletes a large share of the paths on its own.
- **CoR semantics, not CoR structure:** classification precedence (missing beats misplaced beats wrong-price) is Chain of Responsibility *conceptually*; the honest implementation is a first-match-wins loop over an ordered vector of specifications — identical semantics, no handler-linkage boilerplate.
- **Visitor rejected:** the domain is flat data structs with a kind discriminator, not a polymorphic hierarchy — double dispatch has nothing to dispatch on. "Pattern cosplay" if applied.
- **CQS — the deepest change:** today decision and mutation are fused (a rule decides AND writes into `Position` AND touches the report). Target: rules are pure (`Position` in → verdict out), one applier stage writes. Functional core, imperative shell. This is what makes each BR row individually testable.

**3. House precedent (grep/read-verified in the SDK).** The codebase is two strata: the 2022 platform layer (different authors, since departed) already uses GoF deliberately — **Strategy by name** (`TrackUpdateStrategy`, `src/trackers/sortcpp/track_update_strategy.h:19`), **Abstract Factory** (`IRecognitionBackendFactory`), **Command + NVI idiom** (`TaskBase`, `src/task_scheduler/ts_task.hpp`), Facade (`core_adapter`), Builder (domain fluent setters), Singleton (`Settings`), Observer (SDK→App callbacks). The business stratum (planogram/processors/esl, ~75% of the code, one solo maintainer) has none. The pitch this enables: *extend the codebase's own idioms across the boundary they stopped at* — house precedent with file:line beats "let me show you GoF".

**4. Performance verdict** (owner asked whether "more C++" hurts on-device): the compliance calculation is not the hot path (ncnn inference/stitching dominate by orders of magnitude); strategies/rules are constructed once at pipeline build; the refactor plausibly gets *faster* (construction-time config resolution replaces per-position singleton reads; dead/duplicate validation deleted). Perf is measurable via a timing line in the golden harness — "pinned behavior, measured runtime" is the answer to the objection.

**5. The contrast case that proves the census must drive the prescription:** COR-1 (`fromJson`, CCN 393) is **mapping-shaped, not rule-shaped** — the correct moves are DTO + versioned tolerant mapper, *no* strategies, *no* specifications. Same metric (huge CCN), completely different prescription. A skill that pattern-matches on "high CCN" without classifying branch *causes* will prescribe rules engines for parsers.

### The method — three stages

**Stage 1 — complexity census (mechanical, verifiable — the novel artifact).** For the target unit, classify **every branch/decision by cause**, each with `file:line` evidence: `business-rule` (maps to a BR registry row where one exists) · `type-fork` · `config-fork` · `defensive-validation` · `absence-handling` (legitimately-optional input/collaborator — distinct from defensive: valid input may lack it) · `error-propagation` (per-call return-code plumbing) · `mapping` · `dead` · `duplicate` — 9 causes (was 7; extended + ratified 2026-07-12). Plus one **flow-shape** observation per unit, recorded once: `staged-pipeline | state-transition | single-pass` — it is what licenses the pipeline move (table row 11) and arms the deferred state-row promote-trigger. Plus one **mutation-fusion** observation per unit — the sites where a branch both decides and writes (decision fused with mutation): the census anchor for row 5 (CQS), exactly as flow-shape anchors row 11 — without it the calibration exemplar's deepest move could not cite census evidence and would die at the tier-1 grounding kill (census-coverage fix, critic 2026-07-12). Row 6 anchors to data-shaped `business-rule`/`mapping` rows (threshold/lookup-representable predicates); with these, every decision-table row has a census anchor. Inputs: source, the unit's BR registry (rows ↔ branches cross-walk), lizard metrics, the tech-debt row. The census is skeptic-checkable exactly like BR rows — and is independently valuable ("31 of 103 paths are config-forks" is a finding on its own).

**Stage 2 — designers (2–3 independent, clean-room).** Each proposes a target design constrained by a **fixed decision table** (below), with three hard obligations per proposed pattern: (a) cite the census rows it eliminates, (b) name the strangler-fig migration path (the design must be reachable in small safe steps, not big-bang), (c) cite house precedent where it exists. **No pattern without cited census rows** — the anti-cosplay rule.

**Stage 3 — judge (reject-by-default, adversarial).** Kills any pattern that doesn't earn its rows; records every rejection *with reasons* (the Visitor/Template-Method rejections above are the template — rejections are half the brief's discussion value). Scores surviving designs on: paths eliminated, allocation behavior (nothing constructed per-iteration), migration safety, precedent fit. Comparative judging across the 2–3 designs substitutes for the missing oracle.

**Decision table v2** (ratified with the owner 2026-07-12, grounded against SDK source; the ≤ ~15-row growth cap stands — 11 rows + anti-moves block + one deferred row):

| # | census shape | candidate move |
|---|---|---|
| 1 | rule-shaped branching | Specification objects / ordered rules pipeline; first-match-wins where precedence exists (CoR semantics, never CoR structure) |
| 2 | type-fork | Strategy per kind + plain-map factory |
| 3 | config-fork | resolve at composition root (construction-time); inject config, kill mid-flight singleton reads |
| 4 | mapping-shaped | DTO + versioned tolerant mapper at format seams |
| 5 | decision fused with mutation | CQS split — pure rules, single applier (functional core, imperative shell) |
| 6 | data-shaped branches | table-driven lookup; Special Case object for sentinel categories |
| 7 | defensive re-validation | parse-don't-validate — validate once at entry into a type that can't be invalid |
| 8 | absence-handling (legitimately optional) | define absence behavior **once**: Null Object / neutral element at the source, Special Case value, or single entry gate; kill per-site re-checks |
| 9 | error-propagation | single error channel at the module seam — Result/`expected` style (NDK builds are often `-fno-exceptions`: adapt, don't adopt, "replace error code with exception") |
| 10 | dead / duplicate | delete, registry-gated; parameterize surviving near-twins into one function |
| 11 | flow: invariant staged sequence, variation inside stages | explicit Pipeline of stage objects (composition); Template Method is the standing anti-move |

**Deferred row (promote-trigger recorded):** `state-transition → transition table + validate-before-mutate` — promoted the first time a census classifies branches as genuine transition logic (current status gates next status). Grounding 2026-07-12: all 6 status-write sites in the SDK business stratum are lookup-shaped (fresh classification → status write; the near-miss at `compliance_posm.cpp:1032-1085` is a first-write-wins claim guard, not a lifecycle) and the BR registries contain no transition language. Until the trigger fires, state-shaped branches fold into row 6.

**Anti-moves (cite-nothing tier — can never satisfy the census-citation obligation):** Extract Method (relocates paths; legitimate only as the first strangler cut) · guard-clause flattening (reduces depth, not path count) · standing estate rejections, recorded per unit with reasons: Visitor (flat structs — nothing to dispatch on), Template Method (inheritance coupling in a no-inheritance culture), CoR-as-structure, abstract-factory hierarchies (a plain map suffices).

**Row-8 grounding (2026-07-12, SDK source):** house precedent exists — `assistant.cpp` `getThumbnailForIndexCode`/`getPOSMImage` already return a placeholder Mat on failed `imread` (a Null Object invented in-house), while 4 caller sites still re-check `thumbnail.empty()`: dead guards against an absence that can no longer reach them. Plus ~25 scattered empty-section early-returns (`planogram_tools.cpp`, `compliance_posm.cpp`) and the `pirsProductPriceNotKnown` Special Case status — all three row-8 flavors, live.

**Output grammar — `design-brief.md` per unit:** census summary (counts by cause), recommended target architecture (prose + the moves ranked by paths eliminated), per-move pattern name + principle + census citations + migration path, rejected alternatives with reasons, BR-row → rule-object mapping (rule-shaped units), and the safety net the refactor requires (golden flow / gated suite / registry).

## Benefits

- WS7-style refactoring plans get their per-unit target-architecture sections **generated with evidence** instead of hand-derived in hour-long expert sessions — and the SDK needs ~7 of them immediately.
- Briefs are **discussable by non-pattern people**: reasoning and recorded rejections, not pattern names on authority. This is the difference between a plan the senior dev ratifies and one he shelves.
- The BR registries get their second consumer (after the edit-time guardrail): rule catalogs for rules-engine prescriptions.
- The census alone quantifies *where* complexity comes from — a better conversation-opener with any owner than CCN numbers.

## Alternatives

- **Keep doing it manually per unit in architect sessions** — quality proven, doesn't scale, and the evidence dies with the session (this proposal exists precisely because the PLN-1 reasoning had to be rescued from a conversation before compaction).
- **Fold into `mine-verify-repo`** — rejected: the repo mine finds and ranks debt across a codebase; prescription is per-unit, consumes registries, runs at a different cadence (plan-authoring time), different output species.
- **Freeform LLM design advice** — rejected: the known failure mode is pattern cosplay (Visitor everywhere). The census-citation obligation and reject-by-default judge exist to suppress exactly that; without them this skill should not ship.

## Unresolved (status ledger — research closed, pilot-gated)

1. **Stage-2 oracle problem:** "best design" has no ground truth. Mitigation: comparative judging + owner adjudication; **calibration target = the PLN-1 brief in §Proof above** (the skill run on `planogramCompilance` should reproduce its substance: rules pipeline, strategy table, construction-time config, CQS, Visitor/Template-Method rejected) and **COR-1 as the contrast case** (must prescribe DTO+mapper, NOT a rules engine). **Update 2026-07-12 (RATIFIED):** judge-side research landed — `docs/kb/research/llm-design-judging.md`. Stage 3 is a **two-tier gate**: tier 1 is an absolute, rubric-anchored, reject-by-default *grounding* kill (a pattern survives only if its census-row citation verifies; famous pattern names score **zero** — grounding is the only currency); tier 2 pairwise-ranks the survivors only, run in both orderings. Rationale: pairwise judging is ~4× more distractor-gameable than absolute (35% vs 9% flips), and authority/name-dropping bias *is* the pattern-cosplay mechanism. **Judge-independence decision (owner, 2026-07-12): provenance-strip-and-calibrate-first.** The judge is a different Claude tier with which-designer-produced-what stripped; calibrate toward recall on the PLN-1 brief plus a *planted fabricated-authority candidate* (measures actual authority robustness). Escalate to a stronger independence mechanism **only if** that calibration shows self-preference or authority leakage — first an external cross-family CLI judge (Codex-precedent), then a 3-judge geometric-median panel; do not pre-build either (the research's correlated-error ceiling says a panel is worthless until a single judge is demonstrably unstable). **Contamination guard (critic finding, 2026-07-12):** PLN-1/`planogramCompilance` is **calibration-only** — it anchors the judge, so it cannot also score the skill; pilot validation runs on a **held-out unit** from the CCN≥57 cohort (plus COR-1 as the contrast case). Reproducing the PLN-1 brief is a smoke check, never the pass criterion.
2. **Taxonomy curation:** RESOLVED 2026-07-12 — decision table v2 ratified in owner discussion (11 rows + anti-moves block + one deferred row with promote-trigger; see §Approach), grounded against SDK source rather than a web research pass (GoF/Fowler/PoEAA are weight-stable knowledge; the curation judgment was the deliverable). The ≤ ~15-row growth cap stands as a standing rule.
3. **Census at scale:** RESOLVED via P1 — the mine-family core (shipped nexus 1.26.1, `adhoc-MineFamilyCore`) owns the 64k chunked-writes discipline; the pilot on the CCN-103 unit validates it, no separate research needed.
4. **Placement:** stack-neutral core + per-stack adapter notes (cpp first, dotnet pilot candidate later), consistent with the mine-family core/adapter split.
5. **Output home in consumer repos:** `docs/design-briefs/<area>/<unit>.md` vs inside `docs/specs/{slug}/` — align with the ADR-45 registry-placement convention at spec time.

## Graduate-to-spec

Pilot authorization (research is closed: item 1 ratified, items 2–3 resolved) → calibrate on `planogramCompilance` + `fromJson` (calibration pair: judge anchoring + contrast case) → **validate on a held-out CCN≥57 unit** (contamination guard above) → re-derive Confidence and return for full ratification → skill authoring per skill-authoring-recipe — the graduating session also authors the routing contract into the mine-family core (single authoring session; both siblings then cite it) → first production run over the SDK's CCN≥57 cohort to feed the WS7 refactoring plan.

## Provenance

SDK architect session 2026-07-11 (repo `D:\Omnishelf\omnivision-ai-sdk`, thread adhoc-GraphSpike, refactoring-plan meeting prep). Grep/read evidence cited in §Proof lives in that repo. Campaign inputs: `docs/business-rules/` (928 verified rows — 2026-07-10 campaign snapshot; the live count has since grown), `docs/tech-debt/` (50 verified rows), `docs/specs/adhoc-GraphSpike/delivery/bug-handoff.md` (85 items).
