# Equivalence net (mine-algorithm Stage 3 conformance)

The operational recipe Stage 3 follows to decide *when reasoning about conformance suffices* versus
*when both implementations must be run and compared*, and how to compare them. The sharp line is
drawn by output type.

## The route-by-output-type rule

- **Floating-point or geometric output -> executable back-to-back comparison is MANDATORY.**
  Reasoning about "same algorithm" cannot predict the numeric delta between a hand-rolled unit and a
  canonical replacement. Bit-exact parity across a dev host and the deployment target is not
  achievable in general (see the target-ABI rule below), so the comparator is an *engineered
  tolerance* and the only way to know a replacement stays inside it is to run both on a shared corpus
  and measure. Shared code ancestry does **not** imply behavioral equivalence.
- **Exact integer / discrete output -> reasoning-only is permitted, but narrowly.** When the output
  is purely integer / discrete / exact (label assignments, index sets, boolean classifications) AND
  every BR row is reproduced by construction, a row-by-row structural argument can carry the verdict
  without a harness. This is valid **only** where no floating-point or geometric quantity is
  compared; it is recorded as a reasoning-only verdict with the explicit residual-risk note.

## Engineered per-quantity comparators (never a global epsilon, never `==` on FP)

Choose the comparator per output quantity:

- **exact** — for integer / discrete / index / label output: bitwise equality is the right oracle.
- **`max(rel * |ref|, abs)`** — the safe scalar-FP default: relative tolerance survives large
  magnitudes, the absolute floor survives near-zero where a pure relative test blows up. A defensible
  starting pair is rel around 1e-6, abs around 1e-8; ULP-distance against a higher-precision oracle
  is stricter where the tooling is affordable.
- **agreement-rate** — for a nondeterministic or order-sensitive discrete output: the fraction of
  items on which old and new agree, with a stated floor, rather than element-wise equality.
- **distributional** — for a stochastic output where per-run identity is not expected: compare the
  output distributions (summary statistics / a distance between distributions) rather than a point.

The brief must **justify** its tolerance per quantity, with the reason — an unjustified global
epsilon is a review finding.

## Target-ABI measurement rule

Parity is measured on the **deployment target ABI**, not the dev host. Two independent mechanisms
make identical source yield different bits across the boundary: (a) some target compilers emit a
fused multiply-add by default (one rounding step) where the host does two; (b) the math library is
not required to be correctly-rounded, so different libraries or versions legitimately return
different bits. Compiler flags that disable FMA contraction fix only the first source, **not** the
math-library source — they are not a general route to bit-exactness. A golden set captured on the
host will not bit-match the target; capture and compare on the target ABI (or account for the
contraction explicitly).

## Corpus strategy

- **Production-capture seeds first** — real inputs the unit has actually processed.
- **Difference-guided generation** — grow the corpus by hunting divergence between the two
  implementations (delta-diversity), which surfaces far more discrepancies than blind fuzzing.
- **Property-based generators** for rich domain structs, so a legacy free function over a
  domain type gets a corpus without modifying the type.
- State the corpus provenance in the brief.

## Seed-injection: the enabling refactor for unseeded-RNG units

A unit that draws from an **unseeded** random-number source (often at several call levels) is not
even self-parity-testable — two runs of the *same* code diverge. Before such a unit can be compared
at all, **inject a seed** as the enabling refactor: thread a deterministic seed through the sampler
so old-vs-new and run-vs-run become reproducible. Name seed-injection in the brief's required net
whenever the unit is nondeterministic; without it the whole equivalence net is inapplicable.

## Metamorphic relations — the one-sided fallback

Where fixtures are too thin for a trustworthy parity pass, metamorphic relations are the fallback,
always labeled **one-sided**: a relation *violation* proves a defect, but relations *holding* never
prove equivalence. Metamorphic testing supplements the parity harness; it never replaces it, and it
is never the equivalence verdict for floating-point output. If a unit has no buildable comparison
slice at all, fall back to (a) metamorphic relations for a one-sided sanity gate plus (b) a
reasoning-only verdict restricted to exact-output rows with an explicit residual-risk disclosure —
never a silent reasoning pass on FP output.

## Performance parity

Complexity-class reasoning belongs in the brief at brief time (a canonical replacement's asymptotic
class versus the hand-rolled one). The **on-device micro-benchmark is deliberately deferred** until
a replacement implementation actually approaches — the same target-ABI-not-dev-host discipline
applies to timing as to numerics, and the micro-benchmarking recipe (frequency-scaling and
big.LITTLE pitfalls, harness timing-line integration) is not needed to render a brief. "Pinned
behavior, measured runtime" is the standing answer to a performance objection; the measurement is a
downstream step, not a gate on the brief.

## Provenance

Frozen from the research-pool entry `algorithm-equivalence-testing` (load-bearing claims 3-0/2-0
adversarially verified; the compiler-flag "restores bit-exactness" claim was adversarially refuted
and is load-bearing — do not assume a contraction flag buys parity). The seed-injection net and the
agreement-rate / distributional comparators were confirmed by a mine-algorithm pilot on a
nondeterministic clustering unit. The deferred micro-benchmark recipe is the research ledger's R5,
non-gating until a replacement implementation approaches.
