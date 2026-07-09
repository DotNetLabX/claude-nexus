# Internal Evidence — Review-Findings Classification (T4)

Measured 2026-07-09 by two sonnet classifier agents over this repo's complete review history, to size
the conformance-lens gap with our own data. Categories: (a) CORRECTNESS (bug, wrong behavior, security,
broken build/test) · (b) PLAN-CONFORMANCE (deviation from plan/spec) · (c) CONCEPTUAL-QUALITY (patterns,
principles, naming semantics, conventions, duplication, structure) · (d) PROCESS/OTHER (release hygiene,
versioning, doc formatting).

## Headline

| Lens | Runs | Findings | (a) Correctness | (b) Plan-conf | **(c) Conceptual** | (d) Process |
|---|---|---|---|---|---|---|
| nexus reviewer (`review.md` Step 2) | 38 | 54 | 32 (59.3%) | 2 (3.7%) | **11 (20.4%)** | 9 (16.7%) |
| Codex cross-check (`review-codex.md`) | 26 | 78 | 35 (45%) | 18 (23%) | **8 (10%)** | 17 (22%) |

Key observations:
- **The conceptual lens is a minority, incidental product of both reviewers** (10–20%), and almost
  entirely LOW severity — exactly ONE HIGH-rated conceptual finding in the whole corpus
  (adhoc-SkillEstateConsolidation: a shipped skill leaking reference-app vocabulary instead of
  genericized placeholders — a register violation, not a bug).
- **74% of Step-2 reviews (28/38) closed with zero findings** — the architect done-check absorbs
  conformance risk pre-review; correctness arrives largely clean. A PR-stage correctness pass would
  mostly find nothing (supports "no fourth correctness reviewer").
- **Plan-conformance is nearly extinct at Step 2** (2/54) — it belongs to the Step-1 done-check.
- **Codex's real added lens is external-fact drift**, not conformance: it diffs skill docs against live
  external source trees (e.g. 100% of its DotnetFeedbackApply findings), plus explicit reconciliation
  notes show it as supplementary to the reviewer, never a replacement.
- Sample conceptual-quality findings (verbatim titles): "create-grpc-contract's 'Handler usage' section
  — D3 register violation" (HIGH); "add-state-machine's dangling Person editor parameter" (MEDIUM);
  "No ## Model policy section for the fan-out agents" (LOW); "Header comment + implementation.md claim
  the root-anchor neutralizes nested plugins/ — it does not" (LOW).

## Caveat

This corpus is the **plugin repo** — mostly prose, skills, and small scripts. The conceptual lens
(patterns/layering/naming) is expected to be denser in consuming product repos (.NET/Vue). This data
proves the current reviewers don't *cover* the lens; it cannot size the lens on product code.

Full per-slug tables live in the classifier outputs (session 73e240cd, 2026-07-09); the summary above
preserves everything decision-relevant.
