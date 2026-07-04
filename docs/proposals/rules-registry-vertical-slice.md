# Proposal — Rules registry: rename the mined "KB", merge to one canonical set, slice vertically per class

**Status:** Ratified — 2026-07-04, Laurentiu (decisions recorded in Unresolved → Resolutions)
**Decision-maker:** Laurentiu
**Recommendation:** Rename the mined rule ledgers from `docs/kb/` to `docs/business-rules/`, keep ONE
canonical **flat** per-class registry (`{Class}.md`) with per-rule provenance (`code | spec | both`)
over the two mined evidence files (linked, not co-located), scale coverage by **graphify-selected
rule-rich classes** only, and open the registries to consumers beyond test generation — **agent
guardrails + rule-aware review rider first**, cross-platform conformance spike-gated.
**Confidence:** High — the merge/provenance shape is not speculative: the Flutter PD-5263 Merge stage
already built exactly this (`docs/kb/golden/` registries, `source:`/`last_verified` per row) and the
C++ arc reproduced the two-arm inputs; only the naming + slicing + new consumers are new. Exception:
the cross-platform-conformance consumer's premise was checked against both repos' registries
(2026-07-04) and does NOT hold as stated — it is spike-gated, see Approach §4.
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

### 2. Rename: `docs/kb/` → `docs/business-rules/` (for this artifact species only)

The real knowledge base keeps `docs/kb/`. The mined/merged rule artifacts move to
`docs/business-rules/`. **Ratified name: `business-rules`, not the draft's `rules`** — bare `rules` is
already taken in this estate (`.claude/rules/` = the plugin's always-on agent rules; a second species
under the same word recreates the collision this rename escapes), and the alternatives fail
concretely: `mine-rules` names the process not the artifact, `golden-rules` collides with the `golden`
criticality tier (a registry holds golden AND core AND edge rows), `domain-rules` misnames the spec
arm's ui/api/settings-layer rules. `business-rules` is the method's own noun (`BR-n` rows, "the
business rules of one class") — accepting the known imprecision that a few mined rows are algorithmic
invariants, a tradeoff the `BR-` prefix already made.

### 3. Layout — **ratified 2026-07-04: FLAT registry, linked evidence** (the draft's folder slice
was not adopted)

```
docs/business-rules/<area>/<Class>.md   ← the canonical merged registry — the ONLY live rule file;
                                          per-row provenance + links to the evidence files
docs/specs/{slug}/…                     ← evidence stays where its lifecycle puts it (mined-code
                                          ledger, per-slug spec-rules.md, run reports) — linked, not moved
tests/mine-code/<area>/…  tests/mine-spec/<area>/…  ← unchanged; mirror the <area>/<Class> path
```

Rationale: the registry already IS the one-place view (both arms, provenance per row), and the spec
arm's evidence is per-slug — it cannot move per-class, so a folder slice is partial under any layout.
Flat + links gives the "one place to look" with zero migration churn. The draft's folder-per-class
sketch is retained below as the considered-and-not-adopted shape:

> `docs/rules/<area>/<class>/{registry,mined-code,mined-spec,report}.md` — physically co-locates the
> code-arm evidence; rejected at ratification in favor of flat + links (Unresolved 1a).

Executable tests stay in the build-owned trees (CMake/flutter_test need them there) but mirror the
class path — the slice is logical, one hop away. The campaign-level `mvc-report.md` +
suites/gate-JSON evidence stay in `docs/specs/{slug}/delivery/` (immutable run history).

### 4. Consumers beyond test generation (the actual payoff)

- **Agent guardrails (ratified-first consumer, decision 2026-07-04):** before an AI edit to a class,
  load its registry (`docs/business-rules/<area>/<Class>.md` — which behaviors are load-bearing);
  after the edit, a cheap skeptic re-verify
  of the touched rules catches semantic drift without re-mining. The registry becomes the contract
  that makes AI refactoring safe. **The precise gap (verified by grep):** the plugin's only existing
  hooks — the attestation drift checks in `solo.md`, `developer.md`, `architect.md` — are all
  forward-conditional on **C2 attestation records**, which are deferred to the next SddLifecycle arc,
  so the guardrail is currently dead code; and they are test-update-oriented, not context-loading. The
  increment: **rebase the trigger on the C1 registry that already exists** after Merge, add the
  pre-edit registry load + post-edit scoped skeptic. Works immediately on the 6 classes mined to date.
- **Rule-aware review (rider on the guardrail):** a PR touching class X is diffed against X's registry
  — "this change flips BR-12" instead of generic review commentary. Same trigger and path resolution
  as the guardrail; ship as a rider, not a standalone (standalone value is coverage-gated: 6
  registries across 2 repos today, none in the most PR-active repos).
- **Cross-platform conformance — premise checked 2026-07-04, spike-gated:** the claim "omnivision and
  the Flutter app implement overlapping planogram logic → diff the registries" does **not** hold at
  the rule-text level on today's registries. An Explore pass over both rule sets found **zero
  semantically overlapping rule statements**: the C++ arc mined pure algorithm mechanics (Hungarian
  assignment invariants, Levenshtein DP properties — 60 rules), the Flutter arc mined
  business/geometry rules (shelf-scale layout, reload state-machine, price enrichment — 192 rules).
  The real cross-platform link is *systemic*, captured in neither set: C++'s Levenshtein editops power
  planogram-compliance diffing (`get_compliance_guide_for_shelf_from_levenshtein_editops`), while the
  Flutter app renders/manages the same planogram concept. The consumer stays on the list, but its
  entry ticket is a **spike**: find one genuinely shared-logic pair (e.g. a Flutter compliance-guide
  derivation mirroring the C++ editops consumer), mine both sides of that, then diff. Diffing today's
  registries would compare apples to oranges.
- **Spec-repair loop:** `spec-only-divergent` and `code-only-precision` rows flow back as spec fixes /
  PO decisions (PD-5263 already produced 7 such items).
- **Graphify enrichment — complement, NOT replacement:** graphify owns structure (nodes, edges,
  communities); registries own semantics. Attaching registries as node payloads yields a
  behavior-aware graph ("which classes enforce pricing rules?"). The structural axis graphify provides
  is not derivable from rules — replacement is rejected.

### 5. Rollout

C++ first (omnivision has 2 classes, no other consumers): move the 2 registries to
`docs/business-rules/`, update `mine-verify-cover-cpp` artifact contract (→ 0.1.4). Then the
cross-stack rename as its own maintenance pass (core `mine-verify-cover`, `kb-entry-schema`, dotnet +
flutter adapters — MINOR bumps) with a migration note for the Flutter repo's existing `docs/kb/` +
`docs/kb/golden/` entries. Coverage scales only via graphify-selected rule-rich targets (Resolution 5).

**Consumer ordering (decided 2026-07-04):** first consumer slice = **agent guardrails + rule-aware
review rider** (one increment, shared trigger); the conformance spike queues behind it as a separate
cheap probe. Sequencing constraint: consumers hardcode the registry path, so the rename/layout
ratification lands **before** the consumer increment — point consumers at the final path once, never
re-point after a rename.

## Benefits

- Kills the KB namespace collision; the folder name finally says what the artifact is.
- One authoritative rule file per class — the "where do I look" answer becomes trivial, for humans and
  agents (cheaper context loading than mined-ledger archaeology).
- Provenance-per-rule preserves both arms' claims through the merge — auditability without duplication.
- Opens the rules to four consumers beyond Cover, turning a test-generation by-product into a
  first-class behavioral contract layer; the cross-platform conformance diff is a capability nothing
  else in the estate provides (spike-gated — its premise needs a shared-logic pair, Approach §4).

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

## Unresolved → Resolutions (ratified 2026-07-04, Laurentiu)

1. Final name — **`docs/business-rules/`**. Bare `rules` rejected as already-taken in-estate
   (`.claude/rules/` = agent rules); `golden-rules` rejected (collides with the `golden` criticality
   tier); `domain-rules` rejected (misnames spec-arm ui/api/settings rules); `mine-rules` rejected
   (names the process, not the artifact).
1a. Flat vs folder-per-class — **flat `{Class}.md` + linked evidence**. The registry is the one-place
   view; spec evidence is per-slug and cannot move per-class, so the folder slice is partial under any
   layout. Zero migration churn.
2. Registry row grammar — **adopt the PD-5263 golden-registry columns as-is**; a code-only row simply
   carries `source: code` — graceful degradation, no trimmed variant to maintain.
3. Registry from day one — **yes**: `{Class}.md` exists after the code arm alone (code-only rows);
   consumers don't wait for the spec arm.
4. Cross-stack rollout timing — **its own maintenance pass**, not coupled to the next Flutter
   campaign: the guardrail + review-rider increment (the ratified first consumer) hardcodes the final
   path, so the rename must land first and cannot wait on campaign scheduling.
5. Graphify fusion — split: **graph-informed target selection is ratified now** as the coverage
   strategy (mine graphify-selected rule-rich classes, ~10–20 per repo — consumers stay ahead of
   coverage so registries don't rot; "mine everything" explicitly rejected). Node-payload attachment
   (registries as graph payloads) stays **deferred to its own spike**.

## Graduate-to-spec

Technical proposal — on ratification, graduates to a tech-spec: the C++-first rollout is an ad-hoc
slice (`adhoc-RulesRegistry`), the cross-stack rename gets ADR treatment (it changes a shipped
contract in three plugins + one schema skill).

## Provenance

Session 2026-07-04 (C++ MVC re-validation arc). Fed by: the PD-5263 Flutter pilot's Merge/golden
registries (`D:\omnishelf\omnishelf_flutter_app\docs\specs\PD-5263-mvc-tests\delivery\mvc-report.md`),
the omnivision C++ campaign (`docs/specs/mvc-tests/delivery/mvc-report.md` in the SDK), and the
operator's naming/vertical-slice/out-of-the-box direction in-session.

Revised 2026-07-04 (architect session, same day): consumer-ordering decision recorded (guardrail +
review rider first); conformance premise checked by an Explore pass over both repos' registries —
zero rule-text overlap found, consumer re-scoped to spike-first; guardrail gap grounded by grep
(3 forward-conditional C2 hooks in solo/developer/architect agent docs, currently inert).

Ratified 2026-07-04 (same session, Laurentiu as named owner): name `docs/business-rules/`, flat
layout, PD-5263 row grammar as-is, day-one registry, own-pass rollout timing, graphify-selected
coverage. Graduates per `## Graduate-to-spec`.
