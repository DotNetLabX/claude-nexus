# Proposal — Rules registry: rename the mined "KB", merge to one canonical set, slice vertically per class

**Status:** Draft
**Decision-maker:** Laurentiu
**Recommendation:** Rename the mined rule ledgers from `docs/kb/` to `docs/rules/`, keep ONE canonical
per-class registry with per-rule provenance (`code | spec | both`) over the two mined evidence files,
lay it out as a vertical slice (one folder per class), and open the registries to consumers beyond
test generation (agent guardrails, cross-platform conformance, graphify enrichment).
**Confidence:** High — the merge/provenance shape is not speculative: the Flutter PD-5263 Merge stage
already built exactly this (`docs/kb/golden/` registries, `source:`/`last_verified` per row) and the
C++ arc reproduced the two-arm inputs; only the naming + slicing + new consumers are new.
**Impact:** 7
**Effort:** med
**Date:** 2026-07-04

## Need

Three accumulating problems, surfaced by the C++ (omnivision) and Flutter (PD-5263) MVC campaigns:

1. **Name collision.** The mined rule ledgers land in `docs/kb/` — the same namespace the nexus method
   uses for the *actual* knowledge base (research pool, `kb-entry-schema`, graphify inputs). Two
   different artifact species share one folder and one word.
2. **Wrong word.** What the miners emit is not a knowledge *base* — it is **verified per-class
   documentation of the rules the code (or spec) enforces**: a rule ledger. The method's own prose
   already says "rule ledger"; the folder name never followed.
3. **Scatter.** After a full two-arm run, one class's truth is spread across up to five files in three
   directories (live KB entry, mined-code ledger, mined-spec ledger, merged/golden registry, run
   report) — there is no single place to *see* a class's rules with their provenance.

Also unresolved by current docs: whether reconciliation (Merge) leaves two rule sets or one.

**Out of scope:** the mine-spec C++ front-end (separate increment); replacing graphify (explicitly NOT
proposed — see Approach §4); moving executable tests out of the build-owned test trees.

## Approach

### 1. One canonical set, two evidence trails (the keep-2-or-1 answer)

Merge produces **one registry per class**; the two mined ledgers are demoted to immutable evidence.
Every registry row carries provenance, so nothing is lost by merging:

```markdown
- BR-7: {statement}   <!-- source: both | code-only | spec-only · status: verified|mutation-gated|divergence-pending-triage · criticality: golden|core|edge · last_verified: 2026-07-01 -->
```

Divergences (the spec-vs-code reds) live in the SAME registry flagged `divergence-pending-triage` —
no third file. This codifies what PD-5263's Merge (M1) already does in `docs/kb/golden/`.

### 2. Rename: `docs/kb/` → `docs/rules/` (for this artifact species only)

The real knowledge base keeps `docs/kb/`. The mined/merged rule artifacts move to `docs/rules/`.

### 3. Vertical slice — one folder per class

```
docs/rules/<area>/<class>/
  registry.md      ← the canonical merged rules (provenance per rule) — the ONLY live rule file
  mined-code.md    ← evidence (code arm)
  mined-spec.md    ← evidence (spec arm, when run)
  report.md        ← the cumulative run record (the mvc-report section for this class)
tests/mine-code/<area>/…   tests/mine-spec/<area>/…   ← unchanged; mirror the same <area>/<class> path
```

Executable tests stay in the build-owned trees (CMake/flutter_test need them there) but mirror the
class path — the slice is logical, one hop away. The campaign-level `mvc-report.md` +
suites/gate-JSON evidence stay in `docs/specs/{slug}/delivery/` (immutable run history), while the
per-class `report.md` is the living record.

### 4. Consumers beyond test generation (the actual payoff)

- **Agent guardrails:** before an AI edit to a class, load its `registry.md` (which behaviors are
  load-bearing); after the edit, a cheap skeptic re-verify of the touched rules catches semantic drift
  without re-mining. The registry becomes the contract that makes AI refactoring safe.
- **Cross-platform conformance:** omnivision (C++) and the Flutter app implement overlapping planogram
  logic. Mine both, diff the registries → behavioral drift between platforms in plain rule language.
  No existing tool covers this axis.
- **Rule-aware review:** a PR touching class X is diffed against X's registry — "this change flips
  BR-12" instead of generic review commentary.
- **Spec-repair loop:** `spec-only-divergent` and `code-only-precision` rows flow back as spec fixes /
  PO decisions (PD-5263 already produced 7 such items).
- **Graphify enrichment — complement, NOT replacement:** graphify owns structure (nodes, edges,
  communities); registries own semantics. Attaching registries as node payloads yields a
  behavior-aware graph ("which classes enforce pricing rules?"). The structural axis graphify provides
  is not derivable from rules — replacement is rejected.

### 5. Rollout

C++ first (omnivision has 2 classes, no other consumers): move the 2 registries, update
`mine-verify-cover-cpp` artifact contract (→ 0.1.4). Then, on ratification, the cross-stack rename
(core `mine-verify-cover`, `kb-entry-schema`, dotnet + flutter adapters — MINOR bumps) with a
migration note for the Flutter repo's existing `docs/kb/` + `docs/kb/golden/` entries.

## Benefits

- Kills the KB namespace collision; the folder name finally says what the artifact is.
- One authoritative rule file per class — the "where do I look" answer becomes trivial, for humans and
  agents (cheaper context loading than mined-ledger archaeology).
- Provenance-per-rule preserves both arms' claims through the merge — auditability without duplication.
- Opens the rules to four consumers beyond Cover, turning a test-generation by-product into a
  first-class behavioral contract layer; the cross-platform conformance diff is a capability nothing
  else in the estate provides.

## Alternatives

- **Keep `docs/kb/` and disambiguate by subfolder** (`docs/kb/rules/…`): no rename churn, but the
  collision-in-word remains and every consumer must know the subfolder split. Rejected: the word is
  the problem, not just the path.
- **Keep two rule sets after Merge** (mined-code + mined-spec as peers, no canonical registry):
  maximal fidelity, no merge step; but every consumer must reconcile on read, divergences have no
  home, and PD-5263 empirically needed the merged registry anyway. Rejected.
- **True vertical slice including tests** (tests inside `docs/rules/<class>/`): one folder holds
  everything; but build systems own the test trees, and CMake-globbing docs/ is ugly and breaks the
  mine-code/mine-spec isolation folders. Rejected — mirrored paths give 90% of the benefit.
- **Replace graphify with mine-rules:** rejected as scoped above — different axes (structure vs
  semantics); fusion beats substitution.
- **Do nothing** (status quo): the collision and scatter compound with every class mined. Rejected.

## Unresolved

1. Final name — `docs/rules/` vs `docs/behavior/` vs `docs/contracts/` (recommendation: `rules`).
2. Registry row grammar — adopt the PD-5263 golden-registry columns as-is, or trim for the
  single-arm (code-only) case that C++ is in today?
3. When mine-spec has no C++ front-end yet, does `registry.md` exist from day one (code-only rows) or
   only after a spec arm runs? (Recommendation: day one — consumers shouldn't wait for the spec arm.)
4. Cross-stack rollout timing: with the next Flutter campaign, or as its own maintenance pass?
5. Graphify fusion depth: node-payload attachment only, or bidirectional (graph communities informing
   Mine's target selection)? (Deferred; needs its own spike.)

## Graduate-to-spec

Technical proposal — on ratification, graduates to a tech-spec: the C++-first rollout is an ad-hoc
slice (`adhoc-RulesRegistry`), the cross-stack rename gets ADR treatment (it changes a shipped
contract in three plugins + one schema skill).

## Provenance

Session 2026-07-04 (C++ MVC re-validation arc). Fed by: the PD-5263 Flutter pilot's Merge/golden
registries (`D:\omnishelf\omnishelf_flutter_app\docs\specs\PD-5263-mvc-tests\delivery\mvc-report.md`),
the omnivision C++ campaign (`docs/specs/mvc-tests/delivery/mvc-report.md` in the SDK), and the
operator's naming/vertical-slice/out-of-the-box direction in-session.
