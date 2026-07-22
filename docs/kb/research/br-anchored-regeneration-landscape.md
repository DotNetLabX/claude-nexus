# br-anchored-regeneration-landscape

## Is full-system regeneration from mined business rules + a target architecture + pattern templates, gated by equivalence tests, established practice — and what exists to copy vs invent?

**Verdict:** No validated end-to-end precedent exists (July 2026) — extraction (~90% fidelity) and constrained generation are individually evidenced, but generation is the proven bottleneck, no published round-trip or mutation-gated acceptance exists anywhere, and the leading vendor pipeline ships test artifacts without an enforcing gate; build the lane experiment-first, copying AWS Transform's artifact stack and inventing the verification tier and the gate.
**Evidence tier:** read-docs
**As-of:** 2026-07-19
**Validity scope:** the LLM legacy-modernization landscape as of mid-2026 (AWS Transform's shipped capabilities, AgentModernize as the only quantified academic pipeline, current-generation constrained-decoding results)
**Status:** current
**Reconfirm trigger:** published AWS Transform outcome data, a production-scale round-trip/equivalence benchmark, or a major vendor release in the regeneration space; soft trigger 2027-01 (6 months)
**Corroboration:** 10 usable sources, 22 claims survived 3-vote adversarial verification (8 killed); the core verdict is corroborated by three independent source families — academic [2], vendor documentation [1][5][8], and practitioner canon [4][7][10]

## Verdict

The exact pipeline — skeptic-verified mined business rules + prescribed target architecture + idiom reference model + pattern templates, gated by behavioral-equivalence tests — exists nowhere as a validated system. It exists as vendor pipelines with zero published outcome data and one small academic prototype whose result is sobering: extraction is the reliable half (~91% recall / ~90% precision against gold-standard rules), while regenerated code rarely achieves behavioral equivalence even at toy scale. The acceptance gate itself is the largest hole in the literature: no round-trip experiment, no mutation-gated acceptance, anywhere. A first one-class round-trip experiment is therefore itself a contribution, and the cheapest way to validate or kill the approach.

## Finding

- AWS Transform covers the full mine→spec→regenerate arc: four-level business-logic extraction (Line of Business → Business Functions → Features → Component), EARS-format technology-agnostic requirements per business function, and a `traceability.yaml` tracing each requirement to its source code [1][8].
- Its regeneration mechanism ("Reforge") is two-stage: a deterministic equivalence-preserving COBOL→Java transformation first, then an LLM idiom-normalization pass, with a keep-the-original fallback when reforging a class fails [8].
- The newer "Reimagine" pattern is the closest industrial analogue to the proposed lane: reverse-engineer business logic into a spec, forward-engineer microservice specs + IaC from it, deploy-and-test — explicitly human-in-the-loop, not autonomous [5].
- No vendor publishes quantified equivalence outcomes; the "years to months" efficiency claims carry no case study or benchmark [1][5].
- AWS ships equivalence-testing *artifacts* (generated test plans, data-collection scripts) but no enforcing pass/fail gate — gating discipline is left to the customer [5].
- The only quantified end-to-end result is academic (AgentModernize): rule extraction into a Behavioral Specification Graph reaches 91.2% recall / 89.7% precision, yet regenerated code rarely achieves behavioral equivalence even on small synthetic scenarios — generation, not extraction, is the bottleneck [2].
- A validator→transformer repair-feedback loop is what lifts equivalence above near-zero on most tested models — the single largest known effect on regeneration success [2].
- Grammar-constrained decoding reduces syntax errors 91–100% with provably sound token masking, and explicitly does not solve completeness or semantics [3].
- Grammar-structured code representation improves functional correctness beyond syntax even at billion-parameter scale (bug-discrimination F1 +18.25 and +8.75 points) [6].
- Formal correctness guarantees from constrained decoding exist only for deliberately restricted target languages and single-script scope [9].
- No published round-trip experiment (code → mined rules → regenerated code → original tests) at production scale exists; the nearest analogue is 8 synthetic scenarios of a few hundred LOC each [2].
- The sweep found no source addressing mutation-gated acceptance for regeneration, and none addressing golden-master/characterization methodology at scale beyond artifact generation [no source found].
- The rewrite canon's mechanisms: behavioral parity is the systematically underestimated long tail [7]; old code's field-tested fixes ("little hairs") are what a rewrite discards [4]; keeping the legacy system running alongside the new build is the recurring success pattern across six case studies [10].
- Classic SAR literature (reflexion models, Bunch/ACDC clustering) was largely unreachable in this sweep (paywalls), so the state of classic architecture-recovery tooling is under-represented in this evidence base [no source found].

## Fix

- Build the architecture miner rather than adopt: industrial decomposers are closed pipelines with self-asserted accuracy, and the academic artifact is a prototype [1][2][8].
- Copy from prior art: the hierarchical business-function catalog as output shape, EARS-style testable-acceptance requirements, mandatory per-finding source traceability, and a graph intermediate representation separating extracted behavior from target design [1][2][8].
- Invent the part with no prior art — an adversarial skeptic pass over mined architecture — because unverified extraction at ~90% fidelity still yielded near-total regeneration failure downstream [2].
- Give the regeneration lane an *enforcing* pass/fail equivalence gate, since the industrial state of the art gates nothing [5].
- Wire a validator→generator repair loop into the lane; without repair-from-failure, equivalence collapses to near zero [2].
- Adopt two-stage generation discipline: equivalence-preserving generation first, idiom normalization second, keep-original fallback on failure [8].
- Scope constrained generation to the template/idiom layer only — it guarantees form, never behavior [3][9].
- Plan incremental wave-shaped scope with legacy-alongside operation, never big-bang cutover [1][4][10].

## Alternatives

- Adopt AWS Transform outright — rejected: closed, mainframe-scoped (COBOL/JCL), no published accuracy, no enforcing gate [1][5][8].
- Freeform whole-system generation from the BR estate — rejected: replicates the near-zero-equivalence academic result [2].
- Equivalence-preserving transpilation only (Reforge-style, no spec-driven regeneration) — viable as retreat but forfeits the architecture escape that motivates the rewrite; kept as fallback, not goal [8].

## Caveat

The evidence base is thin and skewed: 10 usable sources of 15 fetched (ACM/Springer paywalls and a TLS failure blocked 5, including the foundational reflexion-model and Bunch papers), so the "nothing adoptable" verdict is stronger for LLM-era tooling than for classic SAR tooling. AgentModernize is small and synthetic — its generation-bottleneck finding may not transfer to a single rule-rich class backed by a mutation-gated suite, which is precisely what the round-trip experiment tests. Vendor mechanism descriptions are self-reported; three vendor-payoff claims were killed in verification as unverifiable marketing.

## Fallback

If the one-class round-trip experiment plateaus well below full equivalence despite a repair loop — replicating the academic result even with skeptic-verified rules and a prescribed architecture — the bottleneck is generation itself, not spec quality: retreat the lane to equivalence-preserving transformation plus idiom normalization (the Reforge pattern) instead of free regeneration from spec.

## Sources

[1] https://aws.amazon.com/blogs/migration-and-modernization/accelerate-mainframe-modernization-with-aws-transform-a-comprehensive-refactor-approach
[2] https://arxiv.org/html/2605.17535v1
[3] https://arxiv.org/html/2403.01632v1
[4] https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i
[5] https://aws.amazon.com/blogs/aws/aws-transform-for-mainframe-introduces-reimagine-capabilities-and-automated-testing-functionality
[6] https://arxiv.org/html/2503.05507v1
[7] https://developers.googleblog.com/en/mainframe-modernization-antipatterns
[8] https://docs.aws.amazon.com/transform/latest/userguide/transform-app-mainframe-workflow.html
[9] https://arxiv.org/html/2508.15866v1
[10] https://medium.com/@herbcaudill/lessons-from-6-software-rewrite-stories-635e4c8f7c22

## Recommendation

Run the one-class round-trip experiment before building anything: pick one fully-mined, mutation-gated class; regenerate it clean-room from its registry + the skill pack + reference model; measure (1) rule fidelity against the ~91/90 extraction ceiling, (2) equivalence rate against the original mutation-gated suite, with and without a repair loop, and (3) iterations-to-parity (the long-tail curve). Near-100% equivalence with bounded repair validates the lane and directly answers the open question the literature leaves; a plateau kills free regeneration and routes the lane to the transpile-then-normalize fallback. If validated, shape the regeneration lane as a proposal (docs/proposals/, ADR-28) with the architecture miner as one component. Next probe if reopened: rerun the sweep for classic SAR sources via non-paywalled mirrors, and check for AWS Transform outcome data.
