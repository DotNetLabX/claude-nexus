# spec-representation-and-equivalence-oracles

## Do inferred invariants/contracts and structured rule grammars empirically beat named prose rules + example tests for regeneration-grade specification precision, is differential testing against a retained reference a stronger acceptance oracle than a fixed mutation-gated suite, and how is spec/oracle completeness measured without a golden set?

**Verdict:** Q1 yes with hard limits — inferred formal properties/contracts and structured grammars are empirically shown to reduce ambiguity and catch wrong-formula defects, but real-world catch rates are low (~9–13% of real bugs) and single-shot correctness is <50%, so they only work behind a verification/skeptic stage (validating this pipeline's design); test-based spec validation is independently confirmed as the systematically weak half; Q2 went unanswered by the surviving claim pool (no verified differential/metamorphic/N-version evidence — needs a dedicated sweep); Q3 has one validated golden-set-free metric — buggy/fixed-pair discrimination with a retained reference implementation standing in for the golden spec — plus all-inputs verification-soundness metrics.
**Evidence tier:** read-docs
**As-of:** 2026-07-22
**Validity scope:** GPT-4/GPT-5-class LLM specification-inference results and the pre-2026 empirical invariant/requirements-grammar literature; Q2 (equivalence oracles) is explicitly NOT covered by this entry's evidence base
**Status:** current
**Reconfirm trigger:** a frontier-model result crossing ~50% Sem@1 postcondition correctness or materially raising the ~12% real-bug discrimination rate on Defects4J-class benchmarks; a dedicated Q2 sweep (translation validation, metamorphic testing, N-version) completing; soft trigger 2027-01 (6 months)
**Corroboration:** 9 usable sources; 22 claims survived 3-vote adversarial verification (3 killed); the core Q1 verdict is corroborated by three independent source families — LLM-spec studies [1][2][4], Daikon-lineage empirical work [3][5][6], and requirements-grammar experiments [7][8][9]; the low real-world catch-rate figure converges independently across [1] (9%) and [4] (11–12.7%)

## Verdict

Machine-inferred formal properties are real defect catchers, not just documentation: LLM-generated postconditions discriminated 64 real historical Defects4J bugs, and correct ones kill ~3/4 of buggy mutants. But the absolute numbers cap hard on real code (~9–13% of real bugs, <50% single-shot semantic correctness), and validating a spec against example tests systematically overestimates its quality (86.6% test-set-correct vs 13.0% verification-sound) — independent, quantified confirmation of this program's own finding that the test-suite half is the weak half of the representation. Full contracts (preconditions + postconditions) close most of the soundness gap that bare postconditions leave, and there is a direct 2002 precedent for the BR-89 failure mode: a consensus-plausible mined invariant that was a test-suite artifact, matched the textbook, misled humans, and was exposed only by a downstream mechanical checker. Structured requirement grammars (EARS and peers) measurably improve unambiguity over prose in the only multi-system controlled comparison, but supply no defect-catching evidence on their own. Q2 — whether differential/metamorphic testing against a retained reference beats a fixed mutation-gated suite, and whether "regeneration-as-verifier" has named precedent — produced no surviving verified claims and remains open.

## Finding

- LLM-inferred formal postconditions catch real wrong-implementation defects: postconditions generated from natural-language intent discriminated 64/525 (12.2%) real historical Defects4J bugs (best single model GPT-4: 47/525), and correct postconditions killed all code mutants for up to 62.2% of EvalPlus problems, with the average correct postcondition discriminating ~3/4 of unique buggy mutants [1].
- Feasibility is high on simple code but collapses on real code: 77% of GPT-4 postconditions were test-set-correct (96% of EvalPlus problems got at least one), yet on real-world Java (Defects4J) bug-discrimination sits at ~11–12.7% across models and single-shot semantic correctness is 43–44% even for frontier models — inferred specs cannot be trusted as regeneration anchors without a downstream verification/skeptic stage [1][4].
- Full functional contracts (pre + postconditions) are far more verification-sound than postconditions alone — sound@1 64.8–71.3% vs 19.7–21.0% on Python-by-Contract — because the precondition half captures the input assumptions bare postconditions miss; with contracts, CrossHair automatically detected 14 of the 19 findable bugs (9–11 more than with postconditions alone) [2].
- Validating specifications against example tests systematically overestimates their true quality: GPT-5 postconditions reached 86.6% test-set correctness but only 13.0% verification soundness over all inputs, and test-based bug completeness likewise overestimates verifier-checked completeness — quantified independent corroboration that example-test oracles are the weak half of a spec representation [2].
- Inferred invariants reduce specification ambiguity and incompleteness for humans in a controlled experiment (41 programmers, 3 Java ADTs): success at producing a machine-verifiable spec rose 36%→71% with Daikon/Houdini assistance (p=0.03, hardest program excluded), and recall of necessary annotations rose 72%→86% (p=0.02; 76%→95% excluding the hardest program, p<0.01) [3][6].
- Direct 2002 precedent for the BR-89 wrong-formula failure mode: Daikon emitted a plausible-but-false invariant that was an artifact of the test data, matched the textbook's diagrams, and misled users into trying to verify it — human review failed and a downstream mechanical checker (ESC/Java) plus corrective loop is what weeds such rules out [3].
- Dynamically mined likely invariants are formally incomplete and unsound as error detectors in the general case (both false negatives and false positives), and their fault coverage under injection varies wildly by application — 90–97% (Swaptions) down to 10–15% (Blackscholes) — so they are leads, never a complete spec representation or acceptance oracle [5].
- Structured requirement grammars measurably improve spec quality over free prose: in the first controlled multi-system comparison (1764 requirements, 249 free-text originals from five real projects), four of five template systems (EARS, MASTER, Adv-EARS, Boilerplates/DODT) showed solely positive statistically significant effects across all seven ISO/IEC/IEEE 29148 quality categories, and all five improved most of the 37 unambiguity metrics — confirming and generalizing the inventor-run EARS before/after industrial series [8][9].
- EARS-specific evidence is about writing quality, not defect catching: the 2025 PLC study's ambiguity claim is qualitative only, contains no fault-injection or defect-detection experiment (all EARS-derived tests passed; 100% coverage on the industrial program), but transcription into EARS did surface incompleteness in the original prose requirements — a spec-gap-detector effect during rewriting [7].
- A validated golden-set-free metric for spec strength exists: buggy/fixed-pair discrimination — a postcondition counts only if it holds on the fixed version and fails on the buggy one — established by Endres et al. (FSE 2024) and adopted by follow-up work; a retained reference implementation substitutes for a golden spec [1][4].
- No surviving verified claim addressed Q2: differential/metamorphic testing vs a fixed mutation-gated suite, translation validation, compiler-testing lineage, or named "regeneration-as-verifier"/N-version precedent — the sweep's Q2 candidates did not survive adversarial verification or were not surfaced [no source found].
- The Daikon-based route to Q3 (over-strong inferred invariants pinpointing missing test inputs as a validated completeness measure) was explicitly refuted in verification (0-3 vote), as was the claim that >95% of Daikon-inferred properties are statically provable [no source found].

## Fix

- Upgrade the BR representation from prose + example tests toward full contract form (explicit preconditions + postconditions per rule): the precondition half is where most of the soundness gap lives, and it is exactly the "input assumptions" a prose rule leaves implicit [2].
- Keep the skeptic/verification gate as load-bearing, not optional: single-shot inferred specs are <50% semantically correct and catch only ~9–13% of real bugs unaided — sampling plus downstream filtering is what recovers correctness [1][4].
- Never accept a spec on example-test agreement alone; add an all-inputs check (property-based testing or symbolic execution, CrossHair-style) to the spec-acceptance path, since test-set validation overestimates spec quality by up to ~6x [2].
- Adopt buggy/fixed (mutant) discrimination as the standing spec-strength metric for the pipeline: mutate the reference implementation and require the rule/test representation to discriminate — this is the named, validated way to measure spec power without a golden spec [1][4].
- Treat mined invariants as leads to be verified, never truth: the test-suite-artifact failure mode is a named 2002 precedent, and the countermeasure is a downstream mechanical checker in a corrective loop — regeneration-divergence plays that checker role in this pipeline, consistent with the BR-89 experience [3].
- Add an EARS-class structured grammar to the prose-BR layer for ambiguity/completeness gains at authoring time, but pair it with oracles — the grammar itself carries no defect-catching evidence [7][8][9].

## Alternatives

- Keep prose rules + example tests as the sole representation — rejected: test-based validation systematically overestimates spec quality, and all 20 real defects in this program's own campaigns sat on the test-suite side [2].
- Trust N-miner consensus plus human/adversarial review as the wrongness filter — rejected: the 2002 DisjSets precedent shows plausible-but-false mined rules survive human review when corroborated by authoritative-looking sources; only a mechanical downstream check exposed them [3].
- Adopt Daikon-style dynamic invariants as the acceptance oracle wholesale — rejected: formally incomplete and unsound, with 10–97% application-dependent fault coverage; usable as a supplementary detector only [5].
- Measure spec completeness via inferred-invariant gaps — rejected: the supporting claim was refuted 0-3 in adversarial verification [no source found].

## Caveat

Q2 is a hole, not a negative result: the surviving claim pool simply contains nothing on differential/metamorphic oracles, translation validation, or N-version precedent, so this entry cannot rank a retained-reference oracle against a fixed mutation-gated suite. The contracts evidence ([2]) is a single not-yet-peer-reviewed preprint on introductory-scale tasks (55 tasks, 31 bugs), and its headline soundness gap is partly by construction (postcondition-only baselines emit no preconditions; ~10-point residual gap once input validity is controlled). The Daikon human study is 2002, toy programs (28–66 LOC), tool-novice users, and pools Daikon with Houdini. EvalPlus-scale numbers (77%, 62.2%) do not transfer to repository-scale code — the correctness-completeness gap widens there. Big Ears is an inventor-run before/after industrial series verified from its abstract only (full text paywalled); the RE'23 comparison measures quality via automated proxy metrics on author-produced rephrasings, not human comprehension. Three claims were killed in verification, including two flattering Daikon numbers from its own authors' tool paper — treat secondary summaries of Daikon's precision with suspicion.

## Fallback

If contract-form BR representation does not reduce regeneration divergence/repair in the next round-trip campaign, the residual ambiguity lives in the oracle half, not the rule half — shift investment to Q2-style differential oracles (retained-reference comparison) and run the dedicated Q2 sweep before further representation work. If buggy/fixed discrimination proves too expensive per rule, fall back to the verification-soundness split (all-inputs check vs test-set check) as the cheaper spec-quality signal [2].

## Sources

[1] https://dl.acm.org/doi/10.1145/3660791
[2] https://arxiv.org/abs/2510.12702
[3] https://www.cs.kent.edu/~jmaletic/cs63902/Papers/Ernst02.pdf
[4] https://arxiv.org/html/2507.10182
[5] https://arxiv.org/pdf/2312.16791
[6] https://homes.cs.washington.edu/~mernst/pubs/daikon-tool-scp2007.pdf
[7] https://link.springer.com/article/10.1007/s42979-025-03843-3
[8] https://www.researchgate.net/publication/224195362_Big_Ears_The_Return_of_Easy_Approach_to_Requirements_Engineering
[9] https://www.uni-koblenz.de/de/informatik/ist/juerjens/team/katharina-grosser/publikationen/template-systems-re23/@@download/file

## Recommendation

Three moves, in order. (1) Pilot contract-form BR representation on one already-mined class: rewrite its registry rules as explicit precondition + postcondition pairs and measure whether the next clean-room regeneration's divergence/repair count drops versus the prose baseline — this directly tests the [2] mechanism at this program's scale. (2) Stand up buggy/fixed-pair discrimination as the pipeline's spec-strength metric (mutate the retained reference, require the representation to discriminate) — it is the one validated golden-set-free completeness measure the literature offers [1][4]. (3) Before naming "regeneration-as-verifier" as established method in any program doc, run the dedicated Q2 sweep (translation validation, csmith/compiler-testing lineage, metamorphic testing, N-version programming as spec debugging) — the current evidence base supports it only by analogy to the 2002 checker-exposes-wrong-rule precedent [3], not by named precedent.
