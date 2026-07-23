# Proposal — Proven-value index: make consumer-repo outcomes verifiable from the nexus tree (round-4 cat-3 remedy)

**Status:** Draft
**Decision-maker:** Laurentiu
**Recommendation:** Commit `docs/proven-value/INDEX.md` — a per-consumer-repo census (repo, SHA at
census, artifact counts, paths) plus ONE pinned end-to-end example vendored in-tree — so a blind
evaluator scoped to this repo can verify outcomes, not just mechanisms.
**Confidence:** High — the evidence already exists and was counted this session; the only work is
indexing and vendoring one example.
**Impact:** 7
**Effort:** low
**Date:** 2026-07-23

## Need

Rounds 3 and 4 both locked **Proven value at 7** with the same finding: end-result artifacts are
not re-verifiable from the tree (`.runs/` gitignored; pilot figures self-reported). But the value
exists — it lives in consumer repos the blind evaluator never opens:

- `omnishelf_flutter_app`: 61 business-rule KBs, 28 completed pipeline deliveries (summary.md),
  10 design briefs, tech-debt registry, reference model.
- `omnivision-ai-sdk`: 18 rule KBs, 9 tech-debt findings, algorithm/design pilots, golden harness.

The 7 is a **scope artifact**: the eval protocol (correctly) refuses self-reported numbers, and the
tree offers nothing else. Out of scope: changing the eval protocol itself; committing consumer
repos' full artifact sets (ownership/size).

## Approach

1. `docs/proven-value/INDEX.md`: one table per consumer repo — repo name, census commit SHA, counts
   by artifact type (rule KBs, completed deliveries, design briefs, debt findings), and the in-repo
   paths, so any evaluator with repo access re-executes the census in one command (the command is
   included).
2. **One vendored example** under `docs/proven-value/example/`: a real mined rule KB + its skeptic
   verdicts + the mutation-gate report for one class (sanitized if needed) — a complete
   Mine→Verify→Cover run whose chain is checkable in-tree.
3. Refresh the census each release wave (the release-plugin flow is the natural hook).

## Benefits

- Cat 3 path from 7 to 8+ on the next eval round; converts "corroboration only" into evidence.
- Doubles as the seed for a round-5 outcome eval (score results, not mechanisms).
- Onboarding/sales artifact: "what has this actually produced" answered by one page.

## Alternatives

- **Hand evaluators the consumer repos.** Works once, but the tree stays self-unverifiable and the
  protocol's tree-scope is what keeps blinding clean. Rejected as the primary fix; fine as a
  round-5 supplement.
- **Commit full consumer artifact sets.** Rejected: size, churn, and consumer-repo ownership.
- **Live CI pilot (mine a pinned OSS class per release).** Strongest evidence, but standing cost;
  deferred as a follow-up once the index exists.

## Unresolved

- May consumer repo names/paths appear in this repo, or does the index need anonymized labels?
- Which class becomes the vendored example (needs a clean, non-proprietary one)?

## Provenance

Round-4 blind evaluation cat-3 adjudication (both systems docked to 7 for the same gap); consumer
census run 2026-07-23 in discussion with Laurentiu.
