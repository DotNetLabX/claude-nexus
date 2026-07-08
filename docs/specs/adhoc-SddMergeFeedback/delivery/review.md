# Review — adhoc-SddMergeFeedback

## Step 1 — Done-Check

Pre-commitment predictions (made before reading source): the 3 highest-risk gaps were (1) Step 2
HIGH-1 — `crosswalkExpectations` missing from `selfcheck.mjs` PAIRS; (2) Step 5 — "granularity-tolerant"
claim lingering or a harness filename leaking into skill text; (3) Step 6 — bump / omni-twin regen
absent. All three were verified **closed** against live source (code-grounded done-check — mandatory for
this shipped-skill + harness pass).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — `updateRegistry` code-only-row drop (item 1) | Implemented | `rules-registry.mjs` local `ruleKey` helper added; `updateRegistry` new-entry key + walk switched to `ruleKey(entry)`; workflow inline reuses the existing inlined `ruleKey` (no duplicate, per MED-1). Regression test present and GREEN: "a code-only-precision entry with only `id` (no ruleName) still produces a registry row". |
| 2 — Crosswalk carries operator metadata (item 2a) | Implemented | `rule-crosswalk.mjs`: object-value shape resolved, LOW-3 `?? r?.ruleName` fallback, `crosswalkExpectations` exported. **HIGH-1 closed** — `selfcheck.mjs:160` PAIRS `fns` now `['applyCrosswalk','crosswalkExpectations','reconcileRuleSets']` (verified). Inline mirror synced (spec-diff green). |
| 3 — Divergence honors `expect`/`staleSpec`; boundary demoted (items 2b+3) | Implemented | `merge-rules.mjs` import extended; `expect` authoritative, `boundaryDiverges` fallback retained as hint; `staleSpec`-OR-date tag; header + boundary comments corrected. `merge-rules` suite (incl. LOW-2 no-boundary false-overlap case) GREEN. |
| 4 — `clusterKey` layer-only fallback (item 4) | Implemented | `kb-distill.mjs` fallback → `${layer}`; `?? canonicalName` pseudo-symbol dropped (LOW-4); layer-only line render. `kb-distill` suite (per-layer collapse + LOW-4) GREEN. Inline mirror synced. |
| 5 — Skill doc honesty (item 2 doc half) | Implemented | `mine-verify-cover/SKILL.md` Merge paragraph rewritten. Verified: **no** "granularity-tolerant"/"content-keyed" claim (removed), operator-declared mechanism + boundary-as-corroborating-hint present, `suspect-stale-spec` clause adjusted, **no** harness filename leak. |
| 6 — Verify + release bump | Implemented | `plugin.json` 1.25.1→1.25.2 (PATCH); `CHANGELOG.md` 1.25.2 entry cites `nexus-1.21.0-2026-07-04.md` item 2; omni twin regenerated (`gen-omni --check` green); `bump-plugin --check` green. |

**Independent verification run (this done-check):**
- `node --test tests/unit/{rules-registry,rule-crosswalk,merge-rules,kb-distill}.test.mjs` → **48 pass / 0 fail** (matches implementation.md claim; 13 new regression cases present).
- `node scripts/selfcheck.mjs` → **5/5** — tests, gen-commands drift, gen-omni --check, bump-plugin --check, spec-diff inline-copy sync (7 lib/workflow pairs) all PASS. Confirms the hard inline-sync constraint held on every edited function.
- `plugins/nexus/.claude-plugin/plugin.json` → `1.25.2` (confirmed).
- `scripts/selfcheck.mjs:160` PAIRS `fns` includes `crosswalkExpectations` (HIGH-1 confirmed closed).
- SKILL.md Merge paragraph: no stale claim, no harness filename, operator-declared mechanism present.

**Skill conformance (scored against `.claude/audit/skill-invocations.log`, scoped to session `b0bdc807…`, agent `developer`, token `developer:implement`):**
- Logged this run: `tdd` (13:16), `nexus:tdd` (13:20), `nexus:release-plugin` (13:32).
- Steps 1–4 are `Skill: None` / `TDD: yes` → require `tdd`; **present** in the log. Step 5 `None`/`n/a` — no skill owed. Step 6 `Skill: release-plugin` → `release-plugin` **present** in the log.
- `## Skills Used` section present and corroborated by the log. No fabricated invocation. **PASS.**

**Plan hygiene:** `## Decisions` section present and non-silent (5 rows). No `Satisfies:` annotations on steps (ad-hoc pass, no spec ACs) — optional, no finding.

**Deviations:** implementation.md reports none. The omni-twin *commit* in `../omni` is carried as team-lead-owed (twin already regenerated + `gen-omni --check` green); the live merge run is operator-owed per the workflow runbook — both are pre-sanctioned scope boundaries, not gaps.

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-08*

## Step 2 — Code Review

## Reviewed By
reviewer (code-grounded — this edits a shipped skill + a harness a consuming repo runs)

## Verdict: APPROVED

**Re-review, Cycle 1/3 — focused delta review of Fix Cycle 1** (implementation.md `## Fix Cycle 1`).
Substance was already approved in the prior cycle; this pass verifies the 3 fixes (my LOW-1 + 2
Codex findings) are correct and introduced no regression. All three confirmed correct; no new
findings. Superseding the prior cycle's verdict text below (prior cycle's single LOW-1 finding is
now resolved, not re-asserted).

## Pre-commitment Predictions
Expected the highest re-review risk to be: (1) Fix 3's guard only mirrored in the lib, not the
`merge.workflow.js` inline copy (an easy miss under time pressure on a "hardening" fix); (2) the
"empty decl vs absent entry indistinguishable" claim being asserted but not actually reachable by
the consumer (`triageRuleSets`'s `expectations.get(key)` call site) — i.e., a claim that Fix 3
changed something the consumer never observes differently; (3) Fix 2's wording change accidentally
introducing a harness filename or breaking skill-lint's line-length/structure checks; (4) Fix 1's
comment rewrite drifting from the lib's actual corrected header instead of matching it. All four
investigated directly against live source:
- (1) confirmed fixed — the guard line is byte-identical (comment included) in both
  `harness/lib/rule-crosswalk.mjs` and the inline copy in `harness/merge.workflow.js`.
- (2) confirmed true by construction, not just asserted — traced `triageRuleSets`'s `decl =
  expectations.get(key)` call site: `decl` is `undefined` whether the canonical was never in the
  crosswalk or was only ever given a metadata-less alias (guard prevents storing the empty object in
  either case), so `decl?.expect`/`decl?.staleSpec` reads identically down both paths. Also
  reproduced the guard's RED-before-fix directly (see Evidence).
- (3) confirmed clean — skill-lint 25/25 green after the edit; no harness filename appears in the
  changed lines.
- (4) confirmed matching — the test header now states the same operator-declared/boundary-as-hint
  mechanism as the lib's Step-3-corrected header, no drift.

## Findings
None (≥80 confidence). The prior cycle's one LOW finding is resolved — see Positive Observations.

## Positive Observations
- **Prior LOW-1 (stale "Content-keyed, granularity-tolerant matching" doc-comment) is fully
  resolved.** `tests/unit/merge-rules.test.mjs`'s header (lines 1–13) now states the honest
  mechanism — crosswalk-reconciled, operator-declared `expect` authoritative, boundary compare
  demoted to a corroborating hint — matching `harness/lib/merge-rules.mjs`'s Step-3-corrected header.
  Repo-wide grep for the retired phrase now returns only the two *intentional* historical-reference
  uses (each reads "...was never the granularity-tolerant content match an earlier comment
  claimed..." — describing the past inaccuracy, not asserting it), in `harness/lib/merge-rules.mjs:10`
  and `tests/unit/merge-rules.test.mjs:8`. No live stale claim remains anywhere in the harness/tests
  tree.
- **Fix 3's guard is byte-identical between the lib and the workflow's inlined copy, confirmed via a
  live mutation test, not just a green selfcheck.** Temporarily reverted the guard in
  `harness/lib/rule-crosswalk.mjs` to the pre-fix unconditional `out.set(...)` and reran
  `tests/unit/rule-crosswalk.test.mjs`: both of Fix 3's new regression tests failed for exactly the
  described reason (`actual: {}` vs `expected: {expect:'divergent'}`; `actual: true` vs `expected:
  false`) — proving they are load-bearing, not incidental passes. Restored and reran: 14/14 green.
  `node scripts/selfcheck.mjs` stayed 5/5 throughout (7 pairs in sync, `crosswalkExpectations` incl.).
- **The "empty-decl vs absent-entry indistinguishable" behavior-preservation claim holds by
  construction, independent of `Object.values()` iteration order.** Traced the fix: since the guard
  means an empty `decl` (`{}`) is *never* stored regardless of which alias is processed first or
  second, a real (non-empty) declaration for a canonical always survives once written, and the
  canonical is simply absent from the map if no alias ever carries metadata — there is no order
  dependency left to regress, a stronger fix than a first-write-wins guard would have been.
- **Adjacent call sites re-checked, not just the touched lines.** `harness/lib/merge-rules.mjs`'s
  `triageRuleSets` (the sole consumer of `crosswalkExpectations`) is byte-unchanged since the prior
  cycle and its `decl?.expect`/`decl?.staleSpec` optional-chaining reads were already
  absence-tolerant — Fix 3 needed no consumer-side change, and none was made.
- **Fix 2 (SKILL.md wording) propagated correctly to the omni twin.** `../omni`'s
  `plugins/omni/skills/mine-verify-cover/SKILL.md` now reads "per canonical rule" (re-synced via
  `gen-omni.mjs`, per implementation.md's claim), version still `1.25.2` (no re-bump, correctly —
  the wording tweak rides within the already-uncommitted bump).
- **Full regression run confirms no adjacent breakage from any of the 3 fixes.** `node --test
  tests/lint/*.test.mjs tests/unit/*.test.mjs` → 505 pass / 0 fail (matches implementation.md's
  claim exactly, includes the 2 new Fix-3 regression tests).

## Gaps
- Carried from the prior cycle, unchanged: no test exercises a declared `expect` on a canonical with
  a many-to-one match set where a different match member would otherwise have agreed on boundary.
  Still a reasonable, low-risk, untested combination — not re-flagging.
- Two conflicting *non-empty* declarations for the same canonical (e.g., one alias declares
  `expect:'overlap'`, another declares `expect:'divergent'`) remain last-write-wins, order-dependent
  on `Object.values()` iteration — Fix 3 only hardens the empty-vs-non-empty case (the actual Codex
  finding), not this separate operator-authoring-error scenario. Out of scope for this feedback item
  (items 1–4 never call for detecting contradictory crosswalk authorship) — noting as a gap, not a
  finding.

## Open Questions
- None below the 80-confidence cutoff.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full regression (lint + unit) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 505 pass / 0 fail (matches implementation.md; incl. 2 new Fix-3 tests) |
| selfcheck (all 5 gates) | pass | `node scripts/selfcheck.mjs` | `selfcheck: 5/5 passed` — 7 lib/workflow pairs in sync incl. `crosswalkExpectations` |
| Fix 3 guard RED-before-fix (rule-crosswalk) | confirmed | reverted the guard to unconditional `out.set(...)` in `harness/lib/rule-crosswalk.mjs`, reran `tests/unit/rule-crosswalk.test.mjs`, restored | both new regression tests failed as expected (`{}` vs `{expect:'divergent'}`; `true` vs `false`); restored → 14/14 green |
| Fix 3 lib/workflow byte parity | confirmed | visual diff of `crosswalkExpectations` in `harness/lib/rule-crosswalk.mjs` vs its inline copy in `harness/merge.workflow.js` | identical, including the guard comment |
| bump-plugin --check / version | pass | `node scripts/bump-plugin.mjs --check; echo EXIT:$?` + version grep | `EXIT:0`; `plugin.json` still `1.25.2` (no re-bump, as claimed) |
| skill-lint (Fix 2) | pass | `node --test tests/unit/skill-lint.test.mjs` | 25/25 pass, incl. "all shipped nexus skills are lint-clean" |
| No harness-filename leak (Fix 2) | confirmed | grep for `harness/`/`merge.workflow` in `SKILL.md` | only the pre-existing, unrelated `## Substrate` line-319 mention; no new leak |
| Stale-claim sweep (Fix 1) | confirmed | repo-wide grep for `granularity-tolerant`/`Content-keyed` across `harness/`, `scripts/`, `tests/`, `plugins/nexus/skills/mine-verify-cover/` | only 2 hits, both the intentional historical-reference phrasing ("...an earlier comment claimed...") — no live stale assertion remains |
| Omni twin re-sync (Fix 2) | confirmed | `cd ../omni` + grep wording + version | `SKILL.md` reads "per canonical rule"; version `1.25.2`; still uncommitted (unchanged carry-over) |

*Status: COMPLETE — reviewer, 2026-07-08*
