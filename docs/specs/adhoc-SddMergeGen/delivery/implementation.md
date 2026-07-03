# SDD Merge/Generate — Implementation

Plan: `docs/specs/adhoc-SddMergeGen/delivery/plan.md` (rev 3, code-grounded-critic approved). Governing
proposal `docs/proposals/sdd-generate-merge-2026-07.md` is **Ratified** — Step 8/10 ratification gates
are cleared per the team lead's instruction.

Steps 1–8 and 10 implemented; Step 9 is the written runbook only (operator-owed by construction — see
below). Updated incrementally after each step, per the developer's incremental-visibility rule.

## Files Created

- `harness/lib/merge-rules.mjs` — Step 1. Content-keyed, granularity-tolerant crosswalk-composed triage
  of a spec-arm rule set against a code-arm rule set into the five delta buckets (`overlap-confirmed`,
  `spec-only-other-layer`, `spec-only-divergent`, `spec-only-unimplemented`, `code-only-precision`).
  Composes `harness/lib/rule-crosswalk.mjs`'s `reconcileRuleSets` (imported, not duplicated — this is a
  plain lib module, not a Workflow script, so a static import is legal here). `spec-only-divergent` rows
  carry the `divergence-pending-triage` state + the evidence pair (`specCitation`/`codeAttestation`) and
  an optional `suspect-stale-spec` tag (fires when `codeRule.attributedSource.date` post-dates the spec's
  `specDate`). Ambiguous-verdicted spec rules route to a separate `specRepair` array, never into a bucket.
- `tests/unit/merge-rules.test.mjs` — 9 tests: many-to-one both directions, all five buckets reachable +
  mutually exclusive, evidence-pair presence, stale-spec tag fires/doesn't-fire, ambiguous exclusion, and
  the 42-spec-rule/37-code-BR BugRatio-shaped fixture (30 crosswalked overlaps, 12 layer-matching
  spec-only gaps, 7 un-crosswalked code-only rows).
- `harness/lib/rules-registry.mjs` — Step 2. `updateRegistry` computes the M1/M3 disposition
  (`add | carried | supersede | retire` — the quarter of the tech-spec's three-way table decidable from
  C1 alone; `re-open` needs the C2 attestation verdict line, out of scope per this arc's deferral) by
  diffing Step 1's triage output against prior registry rows. No-delete invariant: a rule absent from the
  new triage retains its row with `disposition: 'retire'`. Every write requires `source:` (throws
  otherwise) and stamps `lastVerified`. Every write appends a changelog entry; a steady-state re-run
  against unchanged input is byte-identical (no new changelog growth). `renderRegistry` renders the C1
  markdown table + `## Changelog` section (OD-L5 default path `docs/kb/golden/{Class}.md`).
- `tests/unit/rules-registry.test.mjs` — 8 tests: no-delete/retire, changelog append, idempotent steady
  state (seed `add` → two consecutive unchanged re-runs are byte-identical), provenance-mandatory throw,
  source/lastVerified stamping, M3 carried, M3 supersede, markdown render shape.
- `harness/lib/kb-distill.mjs` — Step 3. `distillRegistry` clusters registry rows by (symbol, layer) into
  one hot-layer line per cluster + a pointer back to the cold-layer ledger — never the full rule
  statement/body. `lintTokenBudget` fail-closed lints the rendered hot text against `DEFAULT_TOKEN_CEILING`
  (2000, overridable), using a coarse 4-chars/token estimate (no tokenizer dependency in a pure lib).
- `tests/unit/kb-distill.test.mjs` — 6 tests: one row per cluster with resolving pointer, one-line-only
  invariant (no embedded newline, no full statement leak), lint passes at ceiling / fails over ceiling,
  default-ceiling fallback, and a grep-checkable "no multi-line rule body in the rendered distillate" test.
- `harness/merge.workflow.js` — Step 4. The M1/M3 merge actor: actor skeleton mirroring
  `harness/spec-cover-calc.workflow.js`'s `_args` pattern and Load→compute→Write phase shape. Three read
  agents (spec-rules.md, the code-arm class KB, the existing registry — `exists:false` on a first run) →
  orchestrator-computed crosswalk+triage (`triageRuleSets`, inlined) → orchestrator-computed registry
  update (`updateRegistry`/`renderRegistry`, inlined) + a registry-write agent → orchestrator-computed
  distillation + fail-closed token-budget lint (`distillRegistry`/`lintTokenBudget`, inlined) + a
  distillate-write agent (skipped, with a HALT return, when the lint fails) → a report-write agent.
  Inlines FOUR libs verbatim (`rule-crosswalk.mjs`, `merge-rules.mjs`, `rules-registry.mjs`,
  `kb-distill.mjs` — the crosswalk is transitively needed since `merge-rules.mjs` composes it), kept in
  sync via `selfcheck.mjs`'s inline-copy guard. No static import, no fs/Date/Math.random in the
  orchestrator body — agents do all I/O.

## Files Modified

- `harness/lib/rules-registry.mjs` — Step 4 boy-scout fix (found by the selfcheck inline-copy sync guard
  while inlining `updateRegistry` into `merge.workflow.js`): removed a dead `changed` local (written 5
  times, never read — the function already returns `{rows, changelog}` without it) and three trailing
  inline comments, so the lib and its verbatim inline copy in the workflow are byte-identical. Pure
  cleanup — `rules-registry.test.mjs` unaffected (all 8 tests still green).
- `harness/lib/kb-distill.mjs` — same Step 4 sync-guard fix: removed one trailing inline comment on the
  `clusters` Map declaration inside `distillRegistry` so the lib and its inline copy match verbatim.
- `tests/unit/workflow-contract.test.mjs` — added `MERGE_PATH` constant; registered `['merge', MERGE_PATH]`
  in the shared meta-purity loop; added a standalone "has no static import" test (matching the
  spec-cover/spec-cover-calc precedent); added one sandbox-run test (`merge.workflow.js runs in
  mock-globals sandbox without ReferenceError...`) proving the actor wiring (agent call order + inlined
  function scope resolution) runs clean on a small fixture pair — a dedicated
  `merge-workflow.test.mjs`-style file was skipped per the plan's explicit optionality (Steps 1–3's lib
  TDD already covers the triage/registry/distill logic; nothing here is workflow-owned logic the libs
  don't already own).
- `scripts/selfcheck.mjs` — added 4 new PAIRS entries to the "spec-diff inline-copy sync" check:
  `rule-crosswalk.mjs`↔`merge.workflow.js` (`applyCrosswalk`, `reconcileRuleSets` — transitively needed
  since `merge-rules.mjs` composes the crosswalk internally, mirroring spec-cover-calc's dual-lib-inline
  precedent), `merge-rules.mjs`↔`merge.workflow.js`, `rules-registry.mjs`↔`merge.workflow.js`,
  `kb-distill.mjs`↔`merge.workflow.js`. The guard caught the two divergences above on first run (correct
  behavior — the guard doing its job, not a plan defect).
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — Step 5: new `## Fact tagging & test tiers` section
  (placed after `## The KB rule-ledger`, before `## The adapter contract`) — the consolidate-stage facts
  (`layer: domain-calc|api|ui|settings`, `criticality: golden|core|edge`) plus Cover's test-only facts
  (`mutation-gated`, `runtime-cost: fast|slow`); the three named tiers (`smoke`/`full`/`gate`) as filter
  expressions over facts; the "rejected: 1–100 scalar" line; the three-adapter mapping table incl. the
  explicit cpp-deferred note. Step 6: rewrote `## Input-source axis`'s and `## mine-from-spec mode`'s
  stale AC-6 claims (both scoped explicitly to "this mode alone", pointing to the new shipped Merge/
  Generate stages); rewrote the ENTIRE `## SDD lifecycle (M0–M3)` section — the mode table (all four
  rows, since M0's "Cover/red-suite deferred" and M3's "three-way reconciliation deferred" both went
  stale the moment Merge/Generate ship), the M0/M2/M1-M3 prose, and added the Merge + Generate stage
  descriptions (five delta buckets, `divergence-pending-triage` + evidence pair + `suspect-stale-spec`,
  registry no-delete/changelog/idempotent invariants, the generate-mode eligibility rule, the two
  pre-red preconditions, the parked-red output convention, and the explicit zero-tests-is-correct line).
  C2/C3/C4 (`re-open`, the attestation record, the merged ONE test set) are the ONLY "deferred" language
  left inside the section — verified by grep (see Deviations/verification below).
- `plugins/nexus-dotnet/skills/mine-verify-cover-dotnet/SKILL.md` — Step 5: new `## Fact tags & test
  tiers — .NET mapping` section (after `## Test style`) — facts→`[Trait]` mapping, tiers→`dotnet test
  --filter` expressions, and the parked-red `[Fact(Skip = "SPEC-CODE DIVERGENCE …")]` idiom.
- `plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md` — Step 5: new `## Fact tags & test
  tiers — Dart/Flutter mapping` section (after `## Test style`, before `## Minimize stage — Dart fill`)
  — explicitly framed as a DIFFERENT taxonomy from the existing survivor-tag table at (now) line ~94 (no
  collision); facts→flutter `tags:` mapping, tiers→`--tags` filter expressions, and the parked-red
  `skip: 'SPEC-CODE DIVERGENCE …'` idiom.
- `plugins/nexus/agents/solo.md` — Step 7.1: net-new `## Spec write-back` section, placed immediately
  after the attestation drift check paragraph (before `## Workflow`) — trivial-factual-fix + re-stamp
  license, behavioral-drift-surfaced-not-settled rule, and an explicit note that this is narrower than a
  general spec-edit license.
- `plugins/nexus/agents/developer.md` — Step 7.2: extended the `## What You Never Do` "Write any file
  that isn't yours" bullet (was line 131, unchanged after Step 5/6 since those touched a different
  plugin) to explicitly name `docs/specs/{slug}/definition/` in full (`spec.md`, `epic.md`/`bug.md`,
  `tech-spec.md`, `help.tooltips.md`) as read-only — previously only implied by the plan/review/summary
  enumeration.
- `plugins/nexus/commands/{architect,developer,reviewer,team-lead,po,critic,learner,solo}.md` — Step 7.3:
  regenerated via `node scripts/gen-commands.mjs nexus` (repo rule: agent files changed). `solo.md` and
  `developer.md` carry the new content; the rest regenerated byte-identical (their source agents
  unchanged this round) — `selfcheck.mjs`'s "gen-commands drift" check confirms in-sync.
- `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` — Step 8 (plan-directed cross-slug amendment;
  the plan names this file explicitly as a Step 8 deliverable — not a freelance edit past the developer's
  normal `definition/` read-only boundary, which governs `adhoc-SddMergeGen`'s OWN definition folder,
  not a different slug's file the plan assigns as a spec-amendment task). Updated the `**Status:**`/
  `**Depends on:**` header lines (AC-6 discharged, citing the ratified proposal + the two consuming-repo
  evaluations); added a one-line historical-context flag to `## Context` (unchanged prose, now marked as
  the pre-amendment narrative); added a new `## Amendment (adhoc-SddMergeGen, 2026-07-03)` section
  (placed after `## Critic Review`, before `## Review gate`) covering: the AC-6 discharge + citations,
  what M1/C1/Generate now implement (pointer to the shipped skill, not a restatement), the explicit
  C2/C3/C4 deferral + forward reference (including which v1 Acceptance Criteria — AC-L3/L4/L5 — remain
  unmet), and the 5 extracted ADRs with a note distinguishing them from the tech-spec's own earlier
  ADR-E..I numbering (ADR-G/H already extracted as ADR-38/39; ADR-E/F remain un-extracted, still
  C2/C3-dependent). Updated `## Review gate`'s closing line to reference this amendment.
- `docs/architecture/README.md` — Step 8: added 5 new ADR entries to `## Contents` and 5 new full ADR
  sections (ADR-40..44, inserted after ADR-39, before `## Inherited pipeline decisions`) extracting the
  ratified proposal's 5 decisions verbatim per the plan: ADR-40 (AC-6 GO + merge-first order), ADR-41
  (diff-driven Cover-from-spec), ADR-42 (fact-based tagging, no scalar), ADR-43 (docs-render direction —
  noted as implemented in the omnishelf-docs estate, not this repo), ADR-44 (spec write-back routing).
- `plugins/nexus/.claude-plugin/plugin.json` / `plugins/nexus/CHANGELOG.md` — Step 10: `release-plugin`
  skill, MINOR bump `1.20.0 -> 1.21.0` (`--dry-run --minor` reasons: agent instruction/behavior change,
  shipped command changed, skill change; owner-escalated to minor per the plan's binding reminder — a new
  user-facing capability, the Merge/Generate stages, not a fix). CHANGELOG stub edited to describe the
  actual change (per the skill's step 3).
- `plugins/nexus-dotnet/.claude-plugin/plugin.json` / `plugins/nexus-dotnet/CHANGELOG.md` — Step 10:
  MINOR bump `1.2.0 -> 1.3.0` (skill change; owner-escalated). CHANGELOG stub edited.
- `plugins/nexus-flutter/.claude-plugin/plugin.json` / `plugins/nexus-flutter/CHANGELOG.md` — Step 10:
  MINOR bump `0.2.1 -> 0.3.0` (skill change; owner-escalated). CHANGELOG stub edited.
- `harness/lib/rules-registry.mjs` — **Review Cycle 1 fix (HIGH, confidence 92).** `evidenceKey` no
  longer fingerprints `boundary`/`codeRule.boundary` (triage-entry-only fields never part of the
  registry row schema — the finding's root cause); it now fingerprints only `bucket`/`layer`/`state`/
  `evidencePair`/`tags`, all of which are actually persisted. Removed the now-unnecessary `_evidenceKey`
  cache field from every row (both `add` and `carried`/`supersede` branches) — it was never rendered
  anyway and is no longer needed once the fingerprint is computed purely from persisted fields.
  `renderRegistry` now emits a `Bucket` table column on every row, plus a `## Divergence detail` section
  (an indented per-row block, present only when at least one row carries `state`/`evidencePair`/`tags`)
  for `state`, `evidencePair.specCitation`/`evidencePair.codeAttestation`, and `tags`. New exported
  `parseRegistry(markdown)` — the deterministic INVERSE of `renderRegistry` — parses the table, the
  Divergence detail section, and the Changelog section back into `{rows, changelog}`.
- `harness/merge.workflow.js` — **Review Cycle 1 fix.** Byte-synced inline copies of `evidenceKey`/
  `updateRegistry`/`renderRegistry` updated to match the lib exactly, plus the new inline `parseRegistry`.
  `REGISTRY_READ_SCHEMA` changed from `{exists, rows, changelog}` (a column list the writer had silently
  drifted from) to `{exists, content}` — the registry-read agent now returns the raw file text verbatim;
  the orchestrator parses it itself via `parseRegistry`, so the read-side contract can never drift from
  the write-side again (finding item 2). `registryReadPrompt` rewritten accordingly. `codeReadPrompt`
  extended to ask for `layer`/`criticality` (Open Question fix, item 5 — see Key Decisions below).
- `scripts/selfcheck.mjs` — added `parseRegistry` to the `rules-registry.mjs`↔`merge.workflow.js` PAIRS
  entry's `fns` list so the inline-copy sync guard covers the new function (finding item 4).
- `tests/unit/rules-registry.test.mjs` — added 6 tests (Slices 7b–9): `renderRegistry` persists the
  bucket column + full divergence detail for a divergent row; an all-ordinary registry omits the
  Divergence detail section entirely (no dangling empty header); `parseRegistry` recovers every rendered
  field exactly (including a divergent row's state/evidence-pair/tags) and the changelog verbatim; an
  empty/first-run registry parses to empty rows/changelog; and **the finding's own regression test** —
  render (post-steady-state) → parse → re-run `updateRegistry` on unchanged input → assert every row
  stays `carried` with ZERO changelog growth (finding item 3). All pre-existing Slices 1–7 kept
  unmodified and still pass (verified: none depended on the removed `_evidenceKey` field or on
  `boundary`/`criticality` being part of the evidence fingerprint).
- `tests/unit/workflow-contract.test.mjs` — updated the merge sandbox-run test's `registryReadReturn`
  fixture to the new `{exists, content}` shape; added a second sandbox-run test proving an `exists:true`
  registry with REAL rendered content (including the Bucket column) round-trips through the actual
  workflow wiring's `parseRegistry` call and produces `carried` (not `supersede`) on unchanged input —
  the exact review-found bug, proven end-to-end through the workflow, not just the isolated lib.

## Key Decisions

- **M3 disposition lives in Step 2, not Step 1.** The plan's Step 1 prose lists "the M3 dispositions" as
  part of triage output, but Step 1's own Accept criteria never test dispositions, and the tech-spec's M3
  table is keyed on **prior C2 state** — data the stateless `triageRuleSets` (specRules/codeRules/
  crosswalkMap only) has no access to. `updateRegistry` (Step 2) is the one function that sees both the
  prior registry rows and the new triage, so it is the correct (and only correct) home for
  add/carried/supersede/retire. `re-open` (new evidence contradicts a *recorded verdict*) needs the C2
  attestation verdict-line grammar, which is explicitly deferred in this arc's Scope — `updateRegistry`
  implements the three-quarters of the table that C1 alone can decide, and this gap is documented rather
  than silently reproduced as a false `re-open`.
- **`rules-registry.mjs` imports `merge-rules.mjs`'s bucket shape by convention, not by type** — both are
  plain JS objects (`{ruleName, layer, criticality, bucket, codeRule?, state?, evidencePair?, tags?}`);
  no shared schema module was introduced since both libs are consumed directly by the same Step-4 workflow
  (over-abstracting a 2-consumer contract was avoided).
- **[SUPERSEDED by the Review Cycle 1 fix — kept for the record, do not resurrect.]** `updateRegistry`'s
  internal `_evidenceKey` cache field was described here as a private bookkeeping field that "does not
  leak into the rendered markdown." That framing was itself the seed of the review's HIGH finding: a
  cache field that is *never rendered* also can never be *recovered* after a real file round trip, so
  every subsequent run fell back to recomputing `evidenceKey(prior)` from fields (`boundary`,
  `codeRule.boundary`) the registry row never carried in the first place — silently forcing `supersede`
  on every re-run. **Removed entirely** in the fix (see the new Key Decisions entries below): `evidenceKey`
  now fingerprints only fields the registry actually persists, so no cache is needed and none can go stale.
- **Review Cycle 1 fix — `evidenceKey` fingerprints only registry-persisted fields, not triage-entry-only
  fields.** The original fingerprint included `boundary`/`codeRule.boundary` (present on a fresh triage
  entry from `merge-rules.mjs`, but never copied onto a registry row — the plan's Data Model Changes
  column list does not list `boundary` as a registry column at all). A fingerprint over non-persisted
  fields can never recompute identically once the "prior" row has been through a real
  render→write→read→parse cycle, which is exactly what a live merge run does on every re-invocation
  (Step 9's own runbook). Fixed by restricting the fingerprint to `bucket`/`layer`/`state`/
  `evidencePair`/`tags` — every one of which is now a real, round-tripped registry column. `criticality`
  was deliberately NOT added to the fingerprint (kept minimal, matching only what changed per the
  review's evidence) — a criticality-only edit with everything else unchanged is not treated as
  "different evidence" for carried/supersede purposes; this is a narrow, documented scope choice, not an
  oversight.
- **Review Cycle 1 fix — the registry-read agent now returns raw file content; the orchestrator parses
  it via `parseRegistry`, not the agent.** The original design asked the read agent to reconstruct
  structured JSON (`rows`, `changelog`) from an instructed column list — exactly the kind of two-sided
  prompt/writer contract that can silently drift apart, which is what happened (the writer never emitted
  `bucket` at all; the reader was told to parse it anyway). `parseRegistry` is the deterministic INVERSE
  of `renderRegistry`, unit-tested directly (render→parse round trip), so the two sides cannot drift
  again without a test catching it. This also fixes finding item 2 (the read-side column-list
  inconsistency) at its structural root rather than patching the column list to match by hand.
- **Open Question (item 5) resolved: EXTRACT `layer`/`criticality` on the code arm, not "blank is
  correct."** `mine-verify-cover/SKILL.md`'s `## Fact tagging & test tiers` section states the
  consolidate-stage schema gains `layer`/`criticality` on **both arms** — not spec-only. Leaving
  `codeReadPrompt` without them was a genuine prompt-completeness gap relative to the skill's own stated
  contract, not a deliberate "humans triage code-only-precision rows later" design (nothing in the plan
  or proposal says that). Fixed by extending `codeReadPrompt` to ask for `layer?`/`criticality?` — the
  `RULE_ARRAY_SCHEMA_ITEM` schema already supported both fields (shared between the spec- and code-read
  schemas); only the prompt TEXT was incomplete. A code-arm KB entry that genuinely has no per-rule
  layer/criticality yet (most existing KBs, pre-dating this Step-5 skill addition) will still correctly
  report them as absent — the fix makes extraction possible, it does not fabricate data the source
  lacks.
- **`lintTokenBudget`'s token estimate is a coarse 4-chars/token heuristic**, not a real tokenizer — this
  is a pure lib with no dependencies; a real token count would need a tokenizer library the harness does
  not carry. Documented in the module comment so a future session doesn't mistake it for exact.
- **The hot-layer distillate writes to a standalone nexus-side artifact by default** (`harness/.runs/
  merge-{class}-hot-distillate.md`, git-ignored), NOT auto-spliced into the consuming repo's
  `docs/kb/index.md`. Splicing a generated block into a hand-maintained index is exactly the destructive-
  edit risk this harness avoids elsewhere (kb-write.mjs's supersede-not-delete precedent); the plan's Data
  Model Changes names `docs/kb/index.md` as the eventual home but does not mandate an in-workflow splice
  mechanism. `_args.distillatePath` overrides the target directly for a live run that wants to write there.
  Documented as an explicit Note in the workflow file header and in the Step 9 runbook below.
- **The crosswalk map is an input arg (`_args.crosswalkMap`), never computed inside the workflow** — per
  `rule-crosswalk.mjs`'s provenance (human-authored, post-hoc, never a run input to either blind arm).
  This workflow runs strictly AFTER both arms have already produced their rule sets, so accepting an
  already-authored map here does not reopen AC-1 blindness.

## Skills Used

| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | tdd | Red (module-not-found) confirmed before writing `merge-rules.mjs`; all 9 tests green on first implementation pass, no refactor needed. |
| 2 | tdd | Red confirmed before `rules-registry.mjs`; one test (`idempotent re-run`) exposed a flawed test expectation (asserted byte-identical across an add→carried transition) — fixed the TEST (seed run + two steady-state re-runs), not the production code, per the skill's "fails for the wrong reason → fix the test setup" rule. |
| 3 | tdd | Red confirmed before `kb-distill.mjs`; all 6 tests green on first pass. |
| 4 | None (TDD: no — contract-guard tests are the acceptance, per plan) | — |
| 5 | None (TDD: no — instruction edits) | — |
| 6 | None (TDD: no — instruction edits) | — |
| 7 | None (TDD: no — instruction edits) | — |
| 8 | None (TDD: no — spec amendment / ADR extraction) | — |
| 9 | mine-verify-cover (Follow, per plan) | Not invoked as a live run — Step 9 is operator-owed by construction; the runbook is written into this file's Step 9 section, not executed. |
| 10 | release-plugin (Follow, per plan) | Invoked via the Skill tool; followed the procedure exactly — `--dry-run --minor` per plugin first, read reasons, then applied `--minor`, ran once after all edits (never mid-sequence), edited the CHANGELOG stubs, regenerated commands, validated all three `--strict`. No commit (owner-owed). |

## Step 9 — Live merge pilot on sprint-rituals (OPERATOR ACTION REQUIRED)

**Owner: operator — by construction.** Step 9 needs the Workflow/agent-spawn surface (this developer
session has no `Workflow`/`agent`/`parallel` primitives) plus a consuming repo (`D:\src\sprint-rituals`).
Per the plan: "a plan-sanctioned non-run at close is `Deviated (valid reason)` with the runbook owed — not
Missing." This section IS that runbook — it has **not been executed**, only written.

**Goal.** Prove the merge method live (not just the offline contract guard from Step 4) with **blind-arm
independence enforced and evidenced** — the `adhoc-SddCoverageLoop` `checkIndependence` discipline
(`harness/lib/independence-check.mjs`).

**Target.** One already-piloted pair: **F13-BugRatio**. Spec arm:
`docs/specs/adhoc-SddCoverageLoop/delivery/spec-rules-bugratio.md` (nexus repo — the clean-room spec
oracle, already mined). Code arm: `docs/kb/bug-ratio.md` (in `D:\src\sprint-rituals` — the already-verified
code-arm KB entry for `BugRatioAnalyzer`).

**Runbook steps:**

1. **Declare + check independence BEFORE running Merge.** Build the two arms' manifests — `specManifest.paths`
   = the spec-rules.md path (and nothing else); `codeManifest.paths` = the code-arm KB path (and nothing
   else) — and call `checkIndependence({ specManifest, codeManifest, goldenSetPath: 'sprint-rituals/docs/audit/golden-set.md', crosswalkPath: <the crosswalk map file, once authored> })`.
   `pass` must be `true` with zero violations before proceeding: neither manifest may contain the sequestered
   SR golden set or the crosswalk map, and the two manifests must be disjoint (no overlapping path).
2. **Author the crosswalk map POST-HOC.** After both arms' rule sets already exist (they do — this is a
   merge over ALREADY-MINED output, not a fresh mine), a human inspects both rule sets' actual content and
   authors the canonical-name crosswalk map by hand (`{ 'BR-n': 'CanonicalName', ... }`) — **never** an
   agent-authored map, **never** a run input to either arm (rule-crosswalk.mjs's provenance rule). Confirm
   the map is human-authored/human-confirmed before the next step — this is the evidence-pair half of
   "blind-arm independence enforced and evidenced."
3. **Run the merge workflow.** `Workflow({ scriptPath: 'D:\\src\\claude-plugins\\nexus\\harness\\merge.workflow.js' }, { targetClass: 'BugRatioAnalyzer', specRulesPath: '<the nexus spec-rules-bugratio.md path>', codeArmKbPath: 'D:\\src\\sprint-rituals\\docs\\kb\\bug-ratio.md', registryPath: 'D:\\src\\sprint-rituals\\docs\\kb\\golden\\BugRatioAnalyzer.md', crosswalkMap: <the Step-2 map>, targetLayer: 'domain-calc' })`.
4. **Fold the distillate in by hand.** The workflow writes the hot-layer distillate to a standalone
   nexus-side artifact (`harness/.runs/merge-BugRatioAnalyzer-hot-distillate.md`, git-ignored) by design
   (see implementation.md Key Decisions) — review it, then splice the reviewed rows into
   `sprint-rituals/docs/kb/index.md` by hand (or point `_args.distillatePath` directly at it for a future
   run once the splice mechanics are trusted).
5. **Write the independence note.** A short markdown note (alongside the run report) stating: the two
   manifests declared in step 1, the `checkIndependence` result (pass + zero violations), and confirmation
   that the crosswalk map was authored post-hoc by a human, never a run input.

**Artifacts expected:** the SR registry (`sprint-rituals/docs/kb/golden/BugRatioAnalyzer.md`), the hot-layer
distillate (reviewed + folded into `sprint-rituals/docs/kb/index.md`), the run report
(`harness/.runs/merge-BugRatioAnalyzer.md`), and the independence note above.

**What Step 4's build-only PASS did NOT prove** (and what this run is FOR): the offline contract guard
proves the workflow's runtime shape (no static import, no ReferenceError, meta purity) against SYNTHETIC
fixtures. It does not prove the crosswalk composes correctly against REAL BugRatio-shaped rule text, that
the registry read/write round-trips through a real agent's Read/Write tool calls, or that blind-arm
independence holds against the REAL SR golden set path. Only this live run proves those.

## Carry-Over Findings

| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| `gen-omni --check` is RED (twin not synced) | low | team lead / owner | `selfcheck.mjs` output: `[FAIL] gen-omni --check — omni twin drifted` | Sanctioned by the plan ("expected-RED until the owner's twin sync"). The private `omni` twin sync + commit is an owner action outside this session (CLAUDE.md: "Commit it in the `../omni` repo"), not a developer gap. Not blocking Step 1 done-check. |
| Step 9 not run | n/a — operator-owed by construction | reviewer / owner | This file's "Step 9" section is the written runbook only | `Deviated (valid reason)` per the plan's own framing, not `Missing`. The runbook names the exact target (F13-BugRatio), the manifest/independence check call, the workflow invocation, and the artifacts expected. |
| `updateRegistry`'s `re-open` disposition is unimplemented | low | reviewer | `harness/lib/rules-registry.mjs` module comment + implementation.md Key Decisions | Correctly scoped, not a gap: `re-open` needs the C2 attestation record's verdict-line grammar, which is explicitly deferred (Scope, tech-spec amendment). Registry implements the `add`/`carried`/`supersede`/`retire` quarter of the M3 table only. |

## Deviations from Plan

- **None that change scope or behavior.** Two boy-scout-scale fixes surfaced by the selfcheck inline-copy
  sync guard while wiring Step 4 (dead `changed` variable + 3 trailing comments removed from
  `harness/lib/rules-registry.mjs`/`kb-distill.mjs` so the lib and its verbatim workflow inline copy
  match) — documented above under Files Modified, not a plan deviation (the guard is doing exactly what
  it exists to do).
- **Step 4's dedicated sandbox-run test file was skipped**, per the plan's explicit optionality ("add
  only if the workflow gains logic the libs don't own" — Steps 1–3's lib TDD already covers the
  triage/registry/distill logic). One sandbox-run test was added inline to
  `tests/unit/workflow-contract.test.mjs` instead (proving the actor wiring runs clean), which is
  stricter than the plan's bare minimum (contract guard green) without requiring a whole new file.
- **Step 9 is a written runbook, not an execution** — the plan-sanctioned, by-construction operator
  deferral (see Carry-Over above). No attempt was made to run it (no Workflow/agent-spawn surface in this
  session).
- **Steps 8/10's ratification gates were pre-cleared** by the team lead's explicit instruction (the
  governing proposal shows `Status: Ratified`, confirmed by direct read of
  `docs/proposals/sdd-generate-merge-2026-07.md` before any Step 8 edit) — not an independent developer
  judgment call, per the task instructions.

## Gate Results Summary (post Review Cycle 1 fix)

| Gate | Result |
|------|--------|
| `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | **475/475 PASS** (was 469; +6 new tests: 4 in `rules-registry.test.mjs`, 1 in `workflow-contract.test.mjs`, plus 1 pre-existing test count correction — see Fixes Applied) |
| `node scripts/selfcheck.mjs` — tests (lint+unit) | PASS |
| `node scripts/selfcheck.mjs` — gen-commands drift | PASS |
| `node scripts/selfcheck.mjs` — gen-omni --check | **FAIL (sanctioned, expected-RED — see Carry-Over)** |
| `node scripts/selfcheck.mjs` — bump-plugin --check | PASS (no plugin file touched this fix round — version discipline honored, see Fixes Applied) |
| `node scripts/selfcheck.mjs` — spec-diff inline-copy sync | PASS (7 lib/workflow pairs — caught and fixed 1 new divergence in `parseRegistry` on first run, same guard behavior as Step 4) |
| `claude plugin validate plugins/nexus --strict` | PASS (exit 0) |
| `claude plugin validate plugins/nexus-dotnet --strict` | PASS (exit 0) |
| `claude plugin validate plugins/nexus-flutter --strict` | PASS (exit 0) |
| Version bumps | **Unchanged this round** — nexus 1.21.0, nexus-dotnet 1.3.0, nexus-flutter 0.3.0 (fix rides within the existing uncommitted bump per the coordinator's version-discipline instruction; no plugin file changed) |
| Commit | **None** — owner-owed per the plan and the hard rule (developer never commits) |

## Fixes Applied — Review Cycle 1/3

**Reviewer verdict:** REQUEST CHANGES. **Blocking finding:** `[HIGH, confidence 92]` `renderRegistry`
silently dropped the delta bucket, the `divergence-pending-triage` state, the evidence pair, and the
`suspect-stale-spec` tag when persisting to markdown — breaking the registry's own idempotency invariant
across a real file round trip (every row falsely "superseded" itself on every re-run), and leaving
Generate's eligibility rule with no bucket to read from the persisted registry.

**Root cause (traced, not just patched):** two compounding gaps —
1. `renderRegistry` never rendered `bucket`/`state`/`evidencePair`/`tags` at all.
2. `evidenceKey` (the carried-vs-supersede fingerprint) included `boundary`/`codeRule.boundary` —
   fields that live only on a fresh triage entry, never on a registry row, even in the ORIGINAL design.
   So even fixing (1) alone would not have closed the loop: a `prior` row rebuilt from a real file could
   never reproduce the same fingerprint as a fresh triage entry, because the fingerprint depended on data
   the registry was never going to persist. Both had to be fixed together.

**Fix (all 5 items from the coordinator's fix scope):**
1. **Render + persist the missing fields.** `renderRegistry` now emits a `Bucket` table column plus a
   `## Divergence detail` section (state/evidence-pair/tags, indented per-row, present only when needed).
   `evidenceKey` now fingerprints only fields the registry actually persists
   (`bucket`/`layer`/`state`/`evidencePair`/`tags`) — removing `boundary`/`codeRule.boundary` from the
   fingerprint fixes the round trip at its structural root, not just its symptom. The now-unnecessary
   `_evidenceKey` cache field was removed entirely (see Key Decisions).
2. **Fixed the read-side contract at its root, not just its symptom.** Rather than hand-editing
   `registryReadPrompt`'s column list to match the (now-corrected) writer, the registry-read agent now
   returns RAW file content; the orchestrator parses it deterministically via the new `parseRegistry`
   (the exact inverse of `renderRegistry`, unit-tested as a pair) — so the read/write contract cannot
   silently drift apart again.
3. **Added the render→parse-shaped round-trip regression test** the review asked for, exactly as
   specified: seed(add)→steady-state(carried) in-memory, THEN render→parse (the real file boundary), THEN
   re-run `updateRegistry` on unchanged input, asserting `carried` + zero changelog growth. Also added a
   second end-to-end version inside the actual workflow sandbox (not just the isolated lib) proving the
   same invariant through the real agent-call wiring. All pre-existing Slices 1–7 kept unmodified, still
   green.
4. **Kept the workflow's inline copies byte-synced** — `evidenceKey`/`updateRegistry`/`renderRegistry`
   updated to match; new `parseRegistry` added to both the workflow inline copy and
   `selfcheck.mjs`'s PAIRS `fns` list. The sync guard caught one genuine divergence (a stray trailing
   comment) on first run, same as it did in Step 4 — fixed by matching the two copies exactly.
5. **Open Question resolved: extract, don't document-as-correct.** `codeReadPrompt` now asks for
   `layer?`/`criticality?` — the skill's own `## Fact tagging & test tiers` section states both facts
   apply to BOTH arms, so omitting them from the code-arm read was a completeness gap, not a deliberate
   design choice. See Key Decisions for the full reasoning.

**Verification (fresh, this round):** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` →
475/475 PASS. `node scripts/selfcheck.mjs` → 4/5 (the 1 fail is the pre-existing, plan-sanctioned
`gen-omni --check` RED, unrelated to this fix). `claude plugin validate --strict` → exit 0 ×3
(re-confirmed, unchanged). Plugin versions confirmed UNCHANGED (nexus 1.21.0, nexus-dotnet 1.3.0,
nexus-flutter 0.3.0) — no plugin file was touched this round, so no re-bump; `bump-plugin --check`
still PASSes.

**No commits.**

*Status: COMPLETE — developer, 2026-07-03 (Review Cycle 1/3 fix applied).*
