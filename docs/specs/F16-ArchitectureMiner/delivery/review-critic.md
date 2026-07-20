# Critic Review — F16-ArchitectureMiner tech-spec (code-grounded)

**Date:** 2026-07-19 · **Mode:** spec review, code-grounded (live plugin tree + SDK fixture repo)
**Verdict:** GO-with-fixes — 0 HIGH, 5 MEDIUM/LOW + 2 gap notes; all load-bearing anchors verified
correct (consumer contract quoted verbatim from F2 P2; research citations faithful;
`evidence-gate.mjs`/`kickoff-preflight.mjs` exist with matching exports; the Tier-2
"skipped by member class" claim code-verified against `ORACLE_CONSUMING_MEMBERS`; acceptance greps
non-vacuous; run-time count reconciliation confirmed as the correct design).
**Disposition:** all findings folded by the architect 2026-07-19 (table below); spec flipped Ready.

## Findings (critic, substance)

1. **[MEDIUM-A] D1 overlap with mine-verify-repo's global structure-graph pass under-disclosed.**
   Both derive dependency-direction facts from the same graphify substrate
   (`mine-verify-repo/SKILL.md:90-101`); the spec acknowledged only the coupling table. Divergence
   risk when one falls back to an import scan.
2. **[MEDIUM-B] "Fifth species" undercounts.** ADR-65's value ledger explicitly joins the
   registry-species family (`README.md:1826,1839`); architecture-map is the **sixth**.
3. **[MEDIUM-C] Predicted ADR-66 is claimed by F15** (its summary records the 65→66 renumber after
   F3 took ADR-65); the spec's own after-F15 sequencing guarantees F16 gets **ADR-67**.
4. **[MEDIUM-D] Landing-site enumeration incomplete** — missed `mine-verify-cover/SKILL.md:473` and
   the paired "10-row" hits in four siblings. Acceptance #2's grep is complete and is the real
   backstop.
5. **[MEDIUM-E] `docs/architecture-map/` sits one hyphen from the fixture's existing hand-authored
   `docs/architecture/` estate** (index/assessment/flow-map) with no stated relationship.
6. **[LOW-F] Borrowed F2 counts drift** (live SDK: 18 registry files, not 16; 6 areas still
   correct) — F16 already protected by run-time reconciliation.
7. **[Gap-1] No F16 backlog row yet** (ADR-58 requires one at shaping).
8. **[Gap-2] "Zero proposed-target content" is judgment-gated**, not mechanically grep-checkable —
   acceptable for a pilot gate but must be named as such.

## Architect disposition (2026-07-19)

| # | Severity | Disposition |
|---|----------|-------------|
| 1 | MEDIUM | Fixed — D1 REUSES mine-verify-repo's confirmed global-pass edge facts when `docs/tech-debt/` exists (input alongside the coupling table); independent derivation only when absent, with the substrate used recorded in `index.md`'s run report |
| 2 | MEDIUM | Fixed — recounted as sixth species; ADR-65 added to the precedent enumeration |
| 3 | MEDIUM | Fixed — prediction changed to "next free number (ADR-67 expected; verify the register at close)" |
| 4 | MEDIUM | Fixed — hand-listed line numbers dropped; Acceptance #2's grep named the authoritative sweep target |
| 5 | MEDIUM | Fixed — deliberate-separation statement added (decided architecture vs mined current-state evidence) + a mandatory pointer line in `index.md` naming the repo's decided-architecture location |
| 6 | LOW | Fixed — drift flagged; run-time reconciliation named authoritative |
| 7 | Gap | Fixed — backlog row added at Spec Ready (this pass); acceptance item added |
| 8 | Gap | Fixed — acceptance names the gate judgment-checked (header grep + skeptic/human verification) |

## Plan review addendum (2026-07-19)

**Mode:** Mode 2 plan-vs-spec, code-grounded — same critic resumed. **The critic terminated
mid-pass on a platform API error** after delivering its verified findings; the remaining two
mechanical checks (skill-lint CLI shape, residual species ordinal) were completed **in-context by
the architect and are disclosed as such** — not an independent pass. Verdict on the delivered
evidence: GO-with-fixes, all folded.

| # | Severity | Finding | Disposition |
|---|----------|---------|-------------|
| P1 | MEDIUM | Step 2's hand-transcribed sweep table listed 7 files; the plan-time grep hits 15 lines across **8 files** — `mine-verify-repo/SKILL.md:27,276` was dropped (the exact hand-list-drifts-from-grep failure the plan rules name) | Fixed — row added; table header now states the grep, not the table, is authoritative at execution |
| P2 | LOW | Residual "fifth registry species" at tech-spec Output section (line 144) survived the finding-B fold | Fixed — "sixth" |
| P3 | — (verified) | HEAD `6fd50b1`, F15 closed, baseline 1.37.0, ADR-66 claimed-but-unwritten at HEAD — plan Steps 3–4 grounding confirmed correct | No change |
| P4 | — (verified in-context, disclosed) | `skill-lint.mjs` usage is `node skill-lint.mjs <skill-folder>` (header line 4) — Step 1's acceptance command form exact | No change |
| P5 | — (verified in-context, disclosed) | Spec acceptance #1–7 all map to plan steps (#1,#4→S1; #2→S2; #5→S3; #6→S4; #3→S5; #7→done at Spec Ready) | No change |
