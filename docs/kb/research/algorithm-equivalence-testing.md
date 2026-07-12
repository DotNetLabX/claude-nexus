# algorithm-equivalence-testing

## When replacing a hand-rolled algorithm with a canonical/library one in production C++ (arm64/NDK CV SDK), when does conformance-by-reasoning suffice vs when is executable back-to-back comparison mandatory — and what tolerance policy, corpus strategy, and fallback does a BR-registry-gated replacement skill need?

**Verdict:** For any replacement whose output flows through floating-point, `libm`, or geometric computation, **executable back-to-back comparison on a shared corpus is mandatory and conformance-by-reasoning is insufficient** — bit-exact parity between the x86 dev host and the arm64 target is not achievable in general (Clang-on-Arm emits FMA by default; `libm` is not required to be correctly-rounded), and compiler flags do **not** restore it across the board, so the comparator must be an *engineered tolerance* (ULP for scalar FP; per-quantity absolute epsilon sized to coordinate magnitude for geometry), never `==`. Even implementations sharing code ancestry diverge behaviorally (NEZHA found 14 unique differences among OpenSSL/LibreSSL/BoringSSL forks). Reasoning-only is defensible **only** for integer/discrete/exact outputs where the BR registry fully pins behavior and every row is reproduced by construction. Corpus = production-capture seeds + difference-guided generation + property-based generators for rich structs; metamorphic relations are a **one-sided fallback** (a violation proves a bug; relations holding never prove equivalence).
**Evidence tier:** read-docs
**As-of:** 2026-07-12
**Validity scope:** C++ numeric/geometric/CV code on arm64 (Android NDK) vs x86 dev hosts; golden-master/strangler parity practice; ULP/tolerance engineering; differential-testing corpus construction. Feeds the mine-algorithm stage-3 conformance gate.
**Status:** current — but self-synthesized (the deep-research workflow's own synthesis stage failed on a usage limit); the confirmed claims below are 3-0/2-0 adversarially verified, the "uncorroborated" block hit the usage ceiling before its votes completed.
**Reconfirm trigger:** finishing the verification of the OpenCV-test-suite tolerance claims (currently uncorroborated); or a change in NDK/Clang FP-contraction defaults; or a mine-algorithm pilot that measures actual parity behavior on a real replacement (promotes uncorroborated → measured).
**Corroboration:** high-stakes (gates a replacement-adjudication skill). Load-bearing claims independently sourced — executable-comparison-is-the-bar: Scientist [1] + NEZHA [11]; FP parity non-determinism: Arm learning path [6] (FMA) + Zimmermann `libm` accuracy paper [9] (correct-rounding not required); ULP-vs-oracle metric: [9]. Prior pool: [12] (JEST/metamorphic/oracle-contamination), [13] (RapidCheck/mull C++ harness).

## Verdict

The question mine-algorithm's stage 3 must settle is *when is reasoning enough vs when must we run both implementations and compare*. The evidence draws a sharp line by output type:

**Executable comparison is mandatory for floating-point / geometric / `libm` output.** Two independent, verified mechanisms make bit-exact parity unattainable across the dev-host↔target boundary: (a) Clang on Arm emits fused multiply-add by default while x86 does not, and an FMA rounds once where a separate multiply-then-add rounds twice — so *identical source* yields *different bits* on arm64 vs x86 [4][5]; (b) IEEE-754 (even 2019) only *recommends* correctly-rounded math functions, and real `libm`s do not provide it, so different libraries or versions legitimately return different bits for the same input [6]. Crucially, the "just pin `-ffp-contract=off`" escape was **refuted** (0-3): compiler flags address the FMA source but not the `libm` source, so they are not a general route to bit-exactness. The consequence: the comparator is an engineered tolerance, and the only way to know a canonical replacement stays within it is to *run both and measure* — reasoning about "same algorithm" cannot predict the numeric delta. NEZHA drives the point home: 14 behavioral differences among forks of *one* codebase [11] — shared ancestry does not imply behavioral equivalence.

**Reasoning-only is the narrow exception.** When the output is integer / discrete / exact (label assignments, index sets, boolean classifications) and the unit's BR registry rows fully and individually pin the behavior, a structural argument that each row is reproduced by construction can carry the verdict without an executable harness. This is exactly the mine-design/BR-conformance path — but it is *only* valid where no FP/geometric quantity is compared.

**Tolerance is engineered per quantity, never global.** The state-of-practice metric for scalar FP is ULP-distance against a higher-precision oracle (MPFR), because per-function error ranges from 0.5 ulp (correctly-rounded `sqrt`) to billions of ulps (single-precision Bessel) — one global epsilon is indefensible [7]. Near-zero results need an absolute epsilon (relative/ULP tests blow up at zero); large-magnitude results need relative — so the safe scalar default is a combined `max(rel·|ref|, abs)` predicate. For geometric outputs the practice is hand-chosen absolute epsilons per output quantity, sized to input coordinate magnitude and widened for lower-precision input.

**Corpus and fallback.** Seed from production capture, then generate with *difference-guided* search (NEZHA's delta-diversity found 52×/27×/6× more discrepancies than grammar-based or single-program fuzzers [10]); make rich domain structs generatable via RapidCheck `rc::Arbitrary` specialization without touching the struct [11-pool]. Where fixtures are thin, metamorphic relations are the fallback — but a one-sided oracle: a violation proves a defect, relations holding cannot prove equivalence, so MT supplements the parity harness, never replaces it.

## Finding

- GitHub Scientist codifies executable back-to-back comparison on live inputs as the standard for critical-path replacement, explicitly stating tests/fixtures alone are insufficient: "Tests can help guide your refactoring, but you really want to compare the current and refactored behaviors under load." [1] (3-0)
- The parity-harness contract is concrete and portable: randomize control/candidate order, measure wall+CPU time of both, compare candidate to control, swallow+record candidate exceptions, publish all observations, and **always return the control's value** so the candidate cannot affect production during the parity window [1] (3-0)
- Equivalence policy is a first-class knob: comparison defaults to `==` but the harness *expects* a custom `compare` override when values aren't trivially equal — i.e., a tolerance/normalization comparator is the accepted mechanism, not exact match [1] (3-0)
- Clang on Arm emits FMA (`fmadd`) by default while typical x86 builds do not, so the same C++ source produces different single-precision results on arm64 vs x86 — bit-exact parity across the two can fail for identical algorithms [4] (3-0)
- Mechanism: an FMA performs multiply+add with a single rounding step vs two for separate ops, changing the rounded result [5] (3-0)
- **Refuted (0-3):** "compiler flags (`-ffp-contract=off`/`=fast`) restore cross-platform bit-exactness." They fix the FMA-contraction divergence source but not `libm` non-determinism, so they are not a general bit-exactness route — tolerance engineering remains mandatory [4]
- Exact bitwise equality is an invalid default oracle for any path through `libm`: IEEE-754 (2019) only recommends correctly-rounded math functions and real libraries don't provide it, so different libs/versions legitimately return different bits for the same input [6] (3-0)
- State-of-practice FP error metric is ULP-distance vs a higher-precision oracle (MPFR), not fixed abs/rel epsilon; per-function worst-case ranges 0.5 ulp (`sqrt`, correctly rounded everywhere) to millions/billions of ulps (`y0f/y1f/lgammaf`) — tolerance is engineered per function [7] (3-0)
- Corpus feasibility splits by input-domain size: exhaustive comparison is practical only for binary32 univariate functions (~2³² values → true upper bounds on error); for double-precision/bivariate, guided black-box search (recursive interval subdivision, sample, recurse into highest-error intervals) yields only lower bounds [8] (3-0)
- NEZHA differential testing found 14 unique behavioral differences among OpenSSL/LibreSSL/BoringSSL — forks of the *same* codebase — so executable comparison surfaces divergences that reasoning-from-shared-ancestry misses [11] (2-0)
- NEZHA's difference-guided generation (delta-diversity: guide inputs by behavioral asymmetry *between* the compared impls) found 52× more discrepancies than Frankencerts, 27× more than Mucerts, 6× more than AFL adapted to differential testing — corpus generation should be guided by the divergence signal, not blind [11] (3-0)
- RapidCheck makes a user-defined C++ domain struct generatable by specializing `rc::Arbitrary` with a static `arbitrary()`, so legacy free functions over rich structs get property-based corpora without modifying the struct [11-pool] (3-0)
- **[uncorroborated — verification hit usage limit, single-source]** OpenCV's own suite exemplifies the whole pattern: `cv::threshold` validated back-to-back against a scalar reference; a uniform `FLT_EPSILON*10` tolerance across depths; a purely synthetic randomized corpus (params drawn deliberately out-of-range to exercise clamping); and IPP replacement paths that diverged from the reference at ULP boundaries on two separate issues (16085, 21258), pinned by zero-tolerance `nextafterf`-constructed boundary regression tests — direct evidence that conformance-by-reasoning failed for an optimized drop-in and adversarial-boundary executable comparison was required. [15,16 in source list]
- **[uncorroborated — single-source]** OpenCV geometric tolerance is hand-chosen per output quantity, sized to coordinate magnitude and widened by input precision class (fitEllipse: center 0.01, size 0.1 for float32 relaxed to 1.0 for integer input, angle 0.1°); convexHull validated by geometric invariants (hull vertices are input points; convexity by signed determinant) rather than a reference impl, with zero-tolerance only for discrete cross-mode consistency
- **[uncorroborated — single-source]** Metamorphic relations are a one-sided oracle (a violation proves a defect; relations holding cannot prove correctness/equivalence), and no method establishes when an MR set is "complete" — so MT is a supplementary confidence layer, not an equivalence proof; a single best MR for dilation/erosion caught only 53.84% of injected mutants

## Fix

For mine-algorithm's stage-3 conformance gate, adopt this decision rule and default:

- **Route by output type.** If the unit produces any floating-point or geometric quantity → **executable back-to-back comparison mandatory**. If output is purely integer/discrete/exact AND every BR row is reproduced by construction → reasoning-only is permitted, recorded as such with the row-by-row argument.
- **Default harness:** run old and new on a shared corpus; comparator = engineered tolerance — scalar FP: ULP-distance (or combined `max(rel·|ref|, abs)` to survive near-zero); geometric: per-quantity absolute epsilon sized to coordinate magnitude. Never ship `==` on FP output.
- **Corpus:** production-capture seeds first; then difference-guided generation (NEZHA delta-diversity) to hunt divergence; RapidCheck `rc::Arbitrary` for rich domain structs. State corpus provenance in the algorithm-brief.
- **Tolerance defense:** the brief must *justify* the tolerance (per-quantity, with the reason), not assert a global epsilon — an unjustified tolerance is a review finding.
- **Fallback when fixtures are thin:** metamorphic relations, explicitly labeled one-sided (a pass is not an equivalence proof); escalate to "reasoning-only + explicit residual-risk note" only for exact-output units.
- **arm64 reality note in every brief:** parity is measured on the target ABI (or with FMA contraction accounted for), because x86-dev-host golden files will not bit-match arm64.

## Alternatives

- **Formal equivalence (UC-KLEE-style symbolic cross-checking of two C functions):** strongest guarantee, proves two impls write the same outputs on all paths; heavy, scales poorly to CV code with loops/FP, and was surfaced but not corroborated here — reserve for small exact-integer kernels, not geometric pipelines.
- **Pure golden-master (capture old outputs once, assert new matches):** simpler than a live parity harness, but a captured x86 golden set is the exact thing arm64 FMA/`libm` divergence breaks — only safe with an engineered tolerance and target-ABI capture.
- **Mutation gating instead of parity (mull/Stryker):** proves the *test suite* catches bugs, not that new≡old; complementary (pool entry `cpp-mutation-and-test-tooling`), not a substitute for the parity comparison.
- **Metamorphic-only:** cheapest when no reference exists, but one-sided — acceptable as a *supplement* or for exact outputs, never as the equivalence verdict for FP.

## Caveat

- The deep-research workflow's synthesis stage failed twice on a usage limit; **this entry is self-synthesized** by the architect from the verified claim set. The 11 confirmed claims are 3-0/2-0 adversarially verified; the OpenCV-test-suite and metamorphic-completeness claims are **uncorroborated** (their verification votes errored before completing) — directionally strong (primary sources, consistent with the confirmed physics) but not independently confirmed.
- The refuted compiler-flag claim is a genuine adversarial kill and load-bearing: do not let a plan assume `-ffp-contract=off` buys bit-exact parity.
- All FP findings assume the arm64/NDK target vs an x86 dev host — the exact divergence surface depends on the actual NDK Clang version and math library; a same-ABI capture narrows but does not eliminate `libm`-version divergence.

## Fallback

- If executable comparison is infeasible for a specific unit (no buildable slice harness): fall back to (a) metamorphic relations for a one-sided sanity gate, plus (b) a reasoning-only verdict *restricted to exact-output rows* with an explicit residual-risk disclosure — never a silent reasoning pass on FP output.
- If ULP tooling (MPFR oracle) is too heavy for a scalar check: use the combined `max(rel_tol·|ref|, abs_tol)` predicate (e.g. `rel 1e-6, abs 1e-8`) as a defensible default, documenting that it is coarser than ULP-vs-oracle.
- If the corpus is too thin to trust a parity pass: seed-capture from production first, then delta-diversity generation; if still thin, mark the replacement "parity-unproven" and route it out of the auto-approve lane.

## Sources

[1] https://github.com/github/scientist — parity-harness contract; "compare behaviors under load"; `compare` override (primary)
[4] https://learn.arm.com/learning-paths/cross-platform/floating-point-behavior/how-to-3/ — Clang-on-Arm FMA default → x86/arm64 divergence (primary)
[5] (same Arm learning path) — FMA single-rounding mechanism
[6] https://members.loria.fr/PZimmermann/papers/accuracy.pdf — IEEE-754 does not require correctly-rounded `libm`; different libs/versions differ bit-level (primary)
[7] (same Zimmermann paper) — ULP-vs-MPFR metric; per-function error 0.5 ulp → billions
[8] (same) — corpus feasibility splits by domain size; exhaustive only for binary32 univariate
[11] https://www.cs.columbia.edu/~suman/docs/nezha.pdf — 14 diffs among OpenSSL/LibreSSL/BoringSSL forks; delta-diversity 52×/27×/6× (primary)
[11-pool] https://github.com/emil-e/rapidcheck/blob/master/doc/generators.md — `rc::Arbitrary` specialization for domain structs (primary)
[12] docs/kb/research/spec-driven-test-generation.md (this repo) — prior pool: JEST N+1 differential testing, metamorphic, oracle contamination, mutation gating
[13] docs/kb/research/cpp-mutation-and-test-tooling.md (this repo) — prior pool: GoogleTest + RapidCheck + mull C++ harness
[uncorroborated sources] https://github.com/opencv/opencv/blob/master/modules/imgproc/test/test_thresh.cpp ; .../test/test_convhull.cpp ; https://dl.acm.org/doi/10.1145/3708521 (metamorphic survey) ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11051087/ (MR effectiveness) — cited claims not independently verified (usage-limit)

## Recommendation

**Immediate use (mine-algorithm stage 3):** encode the route-by-output-type rule — executable back-to-back comparison mandatory for any FP/geometric output, reasoning-only permitted solely for exact-output units with full BR-row reproduction. Default comparator is an engineered per-quantity tolerance (ULP or `max(rel,abs)` for scalars; coordinate-sized absolute epsilon for geometry), never `==`. Corpus = production capture + delta-diversity generation + RapidCheck `rc::Arbitrary`. The algorithm-brief must *justify* its tolerance and state that parity is measured on the arm64 target, not the x86 host. Metamorphic relations are the thin-fixture fallback, always labeled one-sided.

**Next probe if reopened:** finish verifying the OpenCV-test-suite tolerance claims (the concrete `FLT_EPSILON*10` / per-quantity-epsilon / IPP-ULP-boundary evidence) — they would upgrade the tolerance-policy section from "uncorroborated but consistent" to "measured in a shipping CV library." Also probe UC-KLEE-style symbolic equivalence for the exact-integer-kernel case, where a formal proof could replace the corpus entirely.
