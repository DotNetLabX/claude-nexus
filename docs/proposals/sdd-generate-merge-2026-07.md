# Proposal — SDD loop: AC-6 adjudication, merge-first roadmap, diff-driven Cover-from-spec

**Status:** Ratified (2026-07-03, owner go-ahead in-session — "so what are we waiting for?"; the four
auto-applied checkpoint answers stand unreversed)
**Decision-maker:** Laurentiu
**Recommendation:** Adjudicate AC-6 **GO**. Build the merge/comparison machinery first (with the three
SR-pilot conditions designed in), then Cover-from-spec as a **diff-driven** generator consuming the
triaged merge output — never the raw spec-rule list. Add fact-based test tagging (derived tiers, no
scalar score), keep the KB canonical for behavioral rules (docs rendered *from* BR ledgers), and make
spec write-back a routed obligation (solo: trivial factual fixes only; developer: never).
**Confidence:** High — three complete consuming-repo pilot runs (SR ×3 specs, omnishelf-flutter ×1 with
a two-arm comparison) plus the nexus AC-T5 drill; every load-bearing claim below cites run evidence.
**Impact:** 8
**Effort:** high
**Date:** 2026-07-03

## Need

The SDD roadmap's remaining half — the M1 merge machinery and Cover-from-spec — is gated on the
`adhoc-SddCoverageLoop` AC-6 pilot verdict. The formally-planned pilot (blind two-arm BugRatio run in SR
worktrees) has not run, but the operator ran the shipped `mine-from-spec` arm in **two consuming repos**,
producing richer evidence than the formal pilot would have:

- **sprint-rituals** (`docs/plugin-feedback/nexus-1.20.0-2026-07-03.md`): 3 standalone spec-arm runs
  (F13-BugRatio, F12-CycleTime, F8-SprintSummaryCard). 168/178 consolidated rules verified; skeptic
  caught 2 genuine spec self-contradictions; 44 spec findings. Verdict recorded: **GO with three
  conditions** for the generate/merge half.
- **omnishelf_flutter_app** (`docs/specs/PD-5263-mvc-tests/delivery/mine-spec-pilot-evaluation.md`):
  spec arm + a deliberate two-arm comparison against 4 mutation-gated code-arm KBs. 35 rules; **17
  match / 11 partial / 6 spec-only / 1 contradiction → 6 contradiction findings (C1–C6) + 9
  undocumented-commitment candidates (U1–U9)**. Verdict recorded: spec arm cheap and reliable; the
  **comparison is the multiplier**; zero `unimplemented` rules → no red-suite need *in that M1 context*.

These runs also satisfy the `adhoc-SpecArmTrigger` operator-owed AC-T6 (first consuming-repo run).
This proposal adjudicates AC-6, re-scopes the "last part," and folds in three operator design decisions
raised 2026-07-03 (test tiers, docs↔KB direction, spec write-back).

**Out of scope:** the formal blind BugRatio worktree pilot (optional confirmatory evidence, not a gate
anymore — see Unresolved U-2); team-mode technical-branch surfacing (already deferred by
adhoc-SpecArmTrigger); any change to the shipped Mine+Verify arm.

## Approach

### A. AC-6 verdict: GO — merge first, generator second

1. **Merge/comparison machinery (M1 triage-merge) is the next build.** Both pilots independently rank
   it the highest-value piece (flutter: "the comparison step earned productization interest"; SR: "on
   GO, build the merge machinery with the pilot-surfaced conditions designed in"). Design in the
   **seven SR-pilot proposals** (the original three conditions + four from the same-day addendum's F13
   delta + mini-pilot — SR feedback "Proposals 1–7"):
   - **Layer-tag rules at consolidate time** (`domain-calc | api | ui | settings`) — spec rules span
     layers in one flat list (F12: 78 rules, ~30 targeting the analyzer class; F13: only 4 of 24
     spec-only rules target the domain class); target selection needs the tag.
   - **`ambiguous` blocks generation for that rule** — an ambiguous verdict means the spec doesn't
     commit; a generated red test would encode the miner's guess. Ambiguous routes to spec repair.
     (Validated live: SR-30's threshold-0 edge was correctly withheld.)
   - **Content-keyed, granularity-tolerant matching** — spec-rule count ≠ code-BR count and mapping is
     many-to-one both ways (42 spec rules vs 37 code BRs for BugRatio). Match on symbol + condition,
     never names or counts.
   - **A distinct `divergence-pending-triage` disposition** — a spec-arm red against
     mutation-**attested** code is neither the code arm's "candidate bug" (the behavior is deliberately
     pinned by a killing test) nor a discard (the spec commitment is real). Emit with the **evidence
     pair** (spec citation + code attestation) so a human rules once, durably. Hit twice in one pilot
     (SR-28 `>` vs `>=` boundary; SR-23 stale-spec drift).
   - **Triage output = the five delta buckets** observed on F13: `overlap-confirmed`,
     `spec-only-other-layer`, `spec-only-divergent` (→ divergence-pending-triage),
     `spec-only-unimplemented` (→ GAP backlog), `code-only-precision` (→ spec/KB enrichment). Every
     rule lands in exactly one bucket; nothing silently dropped.
   - **Stale-manifest signal** — tag a divergence `suspect-stale-spec` when the code-arm KB attributes
     the behavior to a settings/feature source the mined spec predates; route to spec repair, not
     code-bug triage (SR-23's `DefaultSpPerBug` case).
   - **Upstream-layer resolution before red-test authoring** — for a rule whose layer ≠ target surface,
     run an implemented-upstream check first (SR-31 lived in the repository, not the analyzer — one
     inspection avoided a misleading wrong-layer red).
2. **Cover-from-spec ships as a *diff-driven* generator.** Input = the triaged merge output
   (`spec∧¬code` confirmed-unimplemented rules + owner-confirmed contradictions), **not** the raw
   spec-rule ledger. This reconciles the two pilots — and both re-validated it same-day by hand:
   flutter's executed probe (11 tests from the 6 uncovered/contradicted rules: 5 red confirmed drifts +
   1 new green keeper, zero false alarms) and SR's mini-pilot (4 tests: 2 real divergences, 1 green
   agreement, the ambiguous rule withheld). Flutter's verdict updated accordingly: "if this gets
   productized, it is a *comparison-driven* Cover step, not a standalone spec-arm Cover." **Output
   convention (from both probes):** generated reds are KEPT, parked as skipped divergence records
   (e.g. `Skip = "SPEC-CODE DIVERGENCE … pending triage"` + observed values) so the suite stays green
   while the divergence stays on the record. At a redesign or greenfield moment the same generator
   produces the red suite up front — no waiting for a "genuine M0"; the diff decides, per run.
3. The existing Inc2 code track (`spec-cover-calc` workflow etc., commit `675a4d9`) is the
   implementation seed; the fold-in remains the vehicle (SddLifecycle tech-spec contracts stand,
   amended by this re-scope on ratification).

### B. Test tagging: discrete facts, derived tiers — no scalar score

Tag each generated test (and its source rule) with **facts**: `layer` (domain-calc|api|ui|settings),
`criticality` (golden|core|edge), `mutation-gated` (bool), `runtime-cost` (fast|slow). Tiers are then
**named filter expressions** over facts (e.g. smoke = golden ∧ fast; full = all; gate = mutation-gated,
run on target-class change), mapped per adapter (dotnet `[Trait]`/`--filter`, flutter `tags`). A 1–100
scalar is rejected: miners/skeptics cannot calibrate 67-vs-72, thresholds drift, and CI filters need
stable named categories — kb-sync's own design note ("this skill does not assign confidence scores")
reflects the same lesson. Facts give unlimited tier flexibility without a fake number.

### C. Docs ↔ KB direction: route by fact-kind, render docs from BR ledgers

The omnishelf-docs pipeline (`docs-bootstrap` v3 → `kb-sync` v2.2) runs **code → docs → KB**; nexus
mine-verify runs **code → verified rules → KB**. Both are right *for their fact-kind*:

- **Domain vocabulary / context facts** (glossary, bounded contexts, capabilities): prose docs are the
  ground truth — code cannot define a "workstream." docs→KB (kb-sync) is correct there.
- **Behavioral rules**: code+spec are the ground truth; prose is a lossy rendering. Mining→KB direct is
  correct; inserting a docs layer between mining and KB would distill a verified ledger from unverified
  prose — provenance inversion. Rejected.
- **The missing piece is a render step, not an intermediate:** BR ledgers (KB entries, spec-rules.md)
  are per-class/per-spec islands. Feed them into docs-bootstrap/docs-update as a **high-trust source**
  (their `code_backing` rubric would ceiling mutation-gated BRs at 5). Docs are generated *from* the
  KB, never the KB from docs.
- **Borrow kb-sync's registry machinery for the M1 merge registry:** mandatory `source` provenance,
  `last_verified` staleness ceilings, deprecate-never-delete, append-only changelog. These are exactly
  the durable-record properties the SddLifecycle registry needs; don't reinvent them.
- **Two-layer KB with a distillation stage (owner correction, 2026-07-03):** the KB's consumption model
  is not uniform. The **hot layer** is loaded/cached into every agent's context — it must stay distilled
  and **token-budgeted**, or context blows up (kb-sync's `MAX_GLOSSARY_ENTRIES: 500` guards the same
  failure). The **cold layer** is the full BR ledgers, read on demand when working on that class/spec.
  Full ledgers never enter the hot layer: a distillation stage compresses each ledger to one-line
  rule-cluster rows + a pointer to the ledger, and a budget lint fails the sync when the hot layer
  exceeds its token ceiling. This is the valid core of the original "distill before KB" instinct — the
  distillation is real, but it sits *between cold and hot layers of the KB*, not between mining and the
  verified ledger.

### D. Spec write-back: a routed obligation, not a discretionary edit

The method's reliability rests on spec freshness (flutter pilot's stale-constant C2 and
rollback-narrative O1 are what rot looks like). Rules:

- **Solo** may apply *trivial factual* spec fixes (stale constant, dangling cross-reference) and
  re-stamp; anything **behavioral** (bug-or-AC-change, e.g. C1/C3/C4) is surfaced to the PO/owner —
  solo never settles it.
- **Developer never updates spec.md or plan.md** (owner-stated, 2026-07-03). In team mode drift
  surfaces via developer/reviewer messages; the architect amends the plan, the PO/owner amends the spec.
- The spec-stamp makes post-edit re-checks cheap (delta re-check, already shipped in 1.20.0).

## Benefits

- Unblocks the SDD roadmap's second half on real consuming-repo evidence instead of a synthetic pilot.
- Catches the defect class nothing else catches: code that **faithfully implements the wrong
  behavior**. Flutter's probe proved the code arm's 100+ mutation-gated tests are all green yet
  structurally blind to all five confirmed spec drifts — only the spec arm's comparison surfaces them.
- The diff-driven generator is safe-by-construction in mature repos (generates nothing when there is
  nothing red to write) and valuable exactly when a redesign/greenfield needs it — no M0 waiting game.
- Fact-based tagging solves the "cannot run all mined tests always" cost problem and doubles as the
  layer-tag input the merge needs — one metadata pass, two consumers.
- The docs/KB routing keeps one canonical verified source while finally aggregating rule islands into
  readable docs; registry machinery is borrowed, not rebuilt.
- Write-back routing closes the spec-rot loop without granting agents spec authority they must not have.

## Alternatives

- **Wait for a genuine greenfield M0 before building Cover-from-spec** (flutter pilot's literal
  verdict): rejected by the owner — M0s are rare in practice; the diff-driven scoping achieves the same
  safety without waiting.
- **Build Cover-from-spec against the raw spec-rule ledger** (original AC-6 framing): rejected — both
  pilots show flat rule lists span layers and include ambiguous rules; generating from them aims UI
  rules at domain classes and encodes guesses.
- **1–100 priority/confidence scalar on tests** (operator idea, considered): rejected in favor of
  discrete facts + derived named tiers — calibration and threshold-drift problems; flexibility comes
  from facts, not a scalar.
- **Docs as a mandatory intermediate between mining and KB** (operator idea, considered): rejected —
  provenance inversion; adopted instead as a downstream render (C above).
- **Run the formal blind BugRatio worktree pilot before any build:** demoted to optional confirmatory
  evidence — it would prove blind-arm independence formally, but three live runs + one comparison
  already answered the questions AC-6 was asking. Kept as an Unresolved for the ratifier.

## Unresolved

- **U-1 — Registry home:** does the M1 merge registry live per-repo (`docs/kb/` alongside class KBs) or
  centrally? SddLifecycle C1 sketches it; the kb-sync borrowings need a concrete placement decision.
- **U-2 — Formal BugRatio pilot:** still wanted as confirmatory evidence (blind-arm independence was
  never live-proven; flutter's comparison was deliberately non-clean-room), or closed as superseded?
- **U-3 — Tag taxonomy freeze:** the fact set (`layer`, `criticality`, `mutation-gated`,
  `runtime-cost`) and the initial named tiers need one ratified vocabulary before adapters encode them.
- **U-4 — Slug/vehicle:** amend `adhoc-SddLifecycle`'s tech-spec (it owns the fold-in contracts) or
  open a successor slug for the merge+generator arc?
- **U-5 — Flutter follow-ups routing:** C1/C3/C4/C6 bug-or-AC verdicts and U1–U9 PO decisions live in
  the consuming repo — out of this proposal, but the merge design should assume that triage shape.

## Graduate-to-spec

Technical branch (ADR-27/28): on ratification this promotes to a tech-spec — most naturally as an
amendment to `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` (whose AC-6 gate it discharges)
plus extracted ADRs for: AC-6 GO + merge-first order, diff-driven Cover-from-spec, fact-based test
tagging, docs-render direction, spec write-back routing. U-4 decides amendment-vs-successor-slug.

## Provenance

Architect session, nexus repo, 2026-07-03. Inputs: `docs/plugin-feedback/nexus-1.20.0-2026-07-03.md`
(sprint-rituals, 3 spec-arm runs, GO + 3 conditions);
`docs/specs/PD-5263-mvc-tests/delivery/mine-spec-pilot-evaluation.md` (omnishelf_flutter_app, two-arm
comparison); `docs/specs/adhoc-SddCoverageLoop/` + `docs/specs/adhoc-SddLifecycle/` (AC-6 gate and
fold-in contracts); `docs/specs/adhoc-SpecArmTrigger/delivery/summary.md` (AC-T6);
omnishelf-docs `.claude/skills/{docs-bootstrap,kb-sync}/SKILL.md` (direction comparison, registry
machinery); operator decisions in-session (no developer write-back; don't wait for M0).
