# Review — adhoc-SddMergeGen

## Step 1 — Done-Check

**Verdict: PASS** (architect, 2026-07-03)

**Pre-commitment predictions vs found:** (1) stale deferral surviving Step 6's ungating → whole-file
grep clean (`AC-6`/`deferred pending`: 0 hits; in-section `\bdeferred\b` = only the sanctioned C2/C3/C4
+ cpp-deferred rows; the `:309` multi-class-sweep hit is the pre-existing out-of-section deferral, plan-
sanctioned). The suspected stale ADR-38 note (`docs/architecture/README.md:921`) is resolved by ADR-40's
explicit supersession line (`:953`) — the register's supersede-don't-rewrite convention, not a defect.
(2) flutter tier mapping colliding with the survivor-tag taxonomy → clean: new section `:116` explicitly
framed as a different taxonomy; `--tags` filters + parked-red `skip:` idiom present. (3) skill-log gaps →
none (below).

### Step dispositions

| Step | Disposition | Evidence |
|------|-------------|----------|
| 1 — merge-rules lib | **Implemented** (with a plan-prose deviation, valid) | `harness/lib/merge-rules.mjs` + 9/9 tests; five buckets + evidence pair + stale-spec tag verified. Deviation: M3 dispositions moved to Step 2 — valid; Step 1's Accept never tested them and the stateless triage inputs cannot decide them (prior-state-keyed). Accept-criteria-wins ruling documented in Key Decisions. |
| 2 — rules-registry lib | Implemented | 8/8 tests; no-delete/changelog/idempotent/provenance invariants tested. `re-open` correctly out of scope (needs the deferred C2 verdict grammar) — documented, carried as a LOW for the reviewer. |
| 3 — kb-distill lib | Implemented | 6/6 tests; fail-closed ceiling; no-ledger-body-leak test present. |
| 4 — merge workflow + registrations | Implemented | Contract guard + selfcheck 7-pair inline-copy sync green; sandbox-run test added inline (plan-sanctioned optionality on the dedicated file). Two sync-guard-surfaced cleanups documented, not deviations. |
| 5 — fact tagging, 3 plugins | Implemented | Accept greps confirmed: `settings` in layer enum (`mine-verify-cover/SKILL.md:256`), tiers + no-scalar line + cpp-deferred row (`:282`), dotnet Trait/filter table, flutter tags/filter + skip idiom (`…-flutter/SKILL.md:116-131`). |
| 6 — generate mode + ungating | Implemented | Whole-file AC-6 grep: 0 hits; mode table rewritten all four rows (`:324`); `divergence-pending-triage` + evidence pair (`:354`); zero-tests-is-correct (`:378`); eligibility rule + two preconditions present. |
| 7 — write-back rules + gen-commands | Implemented | `solo.md:16 ## Spec write-back`; `developer.md:131` names `definition/` read-only in full, cites proposal §D; commands regenerated in sync (`commands/solo.md:17`). |
| 8 — SddLifecycle amendment + ADRs | Implemented | Amendment section + AC-6 discharged header; ADR-40..44 present with Contents entries; ADR-40 supersedes ADR-38/39's AC-6 framing explicitly (`README.md:953`); ADR-43 notes omnishelf-docs as the implementing estate. Proposal `Status: Ratified` consistent (ratified by owner in-session before dispatch). |
| 9 — live SR merge pilot | **Deviated (valid reason)** — plan-sanctioned by construction | Runbook written (implementation.md Step 9 section): independence check, post-hoc human crosswalk, workflow invocation, expected artifacts, and the explicit what-build-only-did-not-prove statement. Operator-owed. |
| 10 — release | Implemented | Three MINOR bumps verified in plugin.json (nexus 1.21.0, nexus-dotnet 1.3.0, nexus-flutter 0.3.0); validate --strict ×3 exit 0; 469/469 tests; selfcheck 4/5 with the sanctioned expected-RED `gen-omni --check`. No commit (correct — owner-owed). |

### Skill conformance (scored against `.claude/audit/skill-invocations.log`)

Scoped window: `agent=developer`, `token=developer:implement`, this session. Logged: `tdd`
(2026-07-03T18:38) and `release-plugin` (T18:59) — final-segment match. Plan's non-`None` mappings:
Steps 1–3 `tdd` → one invocation covering the three consecutive TDD steps in one context (a loaded
skill is not re-invoked; red-first evidence per step documented in `## Skills Used`) — pass. Step 10
`release-plugin` → logged — pass. Step 9 `mine-verify-cover` (Follow) → not invoked, documented
deviation with valid reason (operator-owed, no live run attempted) — pass. `## Skills Used` present;
no self-reported invocation absent from the log — no fabrication.

### Notes for the reviewer (Step 2)

- LOW: `updateRegistry` implements the `add/carried/supersede/retire` quarter of the M3 table;
  `re-open` deferred with the C2 arc — verify the module comment scopes it honestly.
- LOW: the hot-layer distillate deliberately writes to a nexus-side `.runs/` artifact, not a
  consuming-repo `docs/kb/index.md` splice (destructive-edit avoidance; `_args.distillatePath`
  override documented). Judge whether the plan's Data Model wording is honored — architect ruling:
  yes, the plan named the eventual home, not an in-workflow splice mechanism.
- Convention observation (non-blocking): ADR-38 (`README.md:921`) carries no back-pointer to ADR-40;
  the register handles supersession in the new entry only. Consistent with existing practice.

## Step 2 — Code Review

## Reviewed By
reviewer

## Verdict: APPROVED

## Pre-commitment Predictions

Predicted before reading code (feature type: harness lib triad + a Workflow front-end that inlines them,
+ a durable cross-run registry artifact; complexity driver: the registry is a read-modify-write cycle
across runs, and Workflow scripts can't `import`):
1. **Inline-copy drift** between the four libs and their verbatim copies in `merge.workflow.js` — the
   precedent (`spec-cover-calc.workflow.js`) has bitten this before. **Found:** none — `selfcheck.mjs`'s
   sync guard is real (traced the extraction/normalize logic, not just the green checkmark) and 469/469
   tests pass fresh.
2. **The registry's round trip (write → re-read → re-write) silently loses data** — a markdown table is
   a lossy serialization of a richer in-memory row shape, and the M1/M3 idempotency invariant depends on
   recovering that shape faithfully across runs. **Found:** yes — this is the review's central finding
   (below). The pure-function unit tests never exercise the actual render→parse boundary, so they gave
   false confidence.
3. **Skill-text vocabulary drift** across the three plugins (method skill + two adapters) for the new
   fact/tier taxonomy. **Found:** none — `layer`/`criticality`/`mutation-gated`/`runtime-cost` map
   consistently to `[Trait]` (.NET) and `test()` `tags:` (Flutter); both explicitly frame themselves as a
   different taxonomy from Flutter's pre-existing survivor-tag table (no collision); the parked-red idiom
   (`Skip`/`skip:`) uses the same divergence-marker message shape in both.
4. **Stale `deferred`/`AC-6` language surviving Step 6's ungating rewrite.** **Found:** none — grepped the
   whole `mine-verify-cover/SKILL.md` file; zero `AC-6` hits; the only `deferred` hits inside the
   `## SDD lifecycle` section are the sanctioned C2/C3/C4 + cpp-mapping carve-outs.
5. **Workflow-runtime contract violations** (static import / fs / Date / Math.random in the orchestrator
   body). **Found:** none — `merge.workflow.js` passes the shared contract loop plus its own
   no-static-import and sandbox-run tests; manually re-read the orchestrator body top to bottom, no
   violation.

## Findings

### [HIGH] `renderRegistry` silently drops the delta bucket, the `divergence-pending-triage` state, the
evidence pair, and the `suspect-stale-spec` tag — breaking the registry's own idempotency invariant across
a real file round trip

**STATUS: RESOLVED in Fix-Cycle 1** — verified independently, see `### Fix-Cycle 1 Re-Review` below. Kept
here verbatim as the record of the original finding — do not edit the text below this line.

**File:** `harness/lib/rules-registry.mjs:142-156` (`renderRegistry`); byte-synced copy at
`harness/merge.workflow.js:284-298`; the inconsistent read-side instruction at
`harness/merge.workflow.js:457-459` (`registryReadPrompt`)
**Origin:** implementation
**Confidence:** 92/100

**Issue.** The plan's Data Model Changes section explicitly names the registry's columns: "rule name,
layer, criticality, arms ..., **delta bucket** (the five from Step 1), disposition (... **plus the
`divergence-pending-triage` state carrying the spec-citation + code-attestation evidence pair and the
optional `suspect-stale-spec` tag**), provenance `source:`, `last_verified`, pointer to ledger row." The
proposal is explicit about *why*: "Emit with the evidence pair ... so a human rules once, **durably**."

`updateRegistry` computes all of this correctly onto each row object (`bucket`, `state`, `evidencePair`,
`tags` are all present — verified directly). But `renderRegistry`'s markdown table only emits
`canonicalName | layer | criticality | arms | disposition | source | lastVerified` — `bucket`, `state`,
`evidencePair`, and `tags` are never written to the persisted `docs/kb/golden/{Class}.md` file. Reproduced
directly:

```
ROW OBJECT (in memory): { ..., bucket: 'spec-only-divergent', state: 'divergence-pending-triage',
  evidencePair: { specCitation: 'spec says strictly greater', codeAttestation: 'BugRatioAnalyzer.cs:42' } }
RENDERED MARKDOWN: | BoundaryRule | domain-calc | core | both | add | test-run | 2026-07-03 |
  -- includes 'divergence-pending-triage'? false
  -- includes the evidence pair citation text? false
  -- includes the bucket 'spec-only-divergent'? false
```

This is not just a cosmetic loss. `registryReadPrompt` (the agent that re-reads the registry on the NEXT
run) is itself internally inconsistent with what got written — it instructs the agent to parse `bucket`
"from the markdown table," but the table never had a bucket column to parse. Simulating a real
render→(agent-recoverable-columns-only)→re-`updateRegistry` round trip on an **unchanged** input pair
(same spec rule, same code rule, same crosswalk):

```
Run 1 disposition: add
Run 2 disposition (same unchanged input): supersede        <- should be 'carried'
Run 2 changelog grew? true — "superseded BugRatioPercent (supersede) — source: run 1"
```

This directly violates the plan's own binding invariant ("a re-run against an unchanged input pair is
idempotent — **no diff**") the moment the registry crosses the real file-write/file-read boundary — which
is exactly what Step 9's live pilot does, and exactly what a repeat merge run in a consuming repo will do
on every subsequent invocation. The blast radius is not limited to divergent rows: `prior.bucket` is
undefined after ANY real round trip (not just divergent-state rows), so `prior.bucket === entry.bucket`
is false for every row on every re-run, so **every row supersedes itself on every re-run**, forever.

It also breaks the stated purpose of Merge→Generate as a pipeline: Generate's own eligibility rule (both
in the plan Step 6 and in the shipped `mine-verify-cover/SKILL.md` `## SDD lifecycle` section) is "input =
the triaged registry — only `spec-only-unimplemented` rules ... plus owner-confirmed `spec-only-divergent`
rows." A downstream agent reading the persisted registry file has no way to tell which rows are
`spec-only-unimplemented` vs. `overlap-confirmed` vs. anything else, because the bucket was never
persisted — the registry cannot actually serve as Generate's input contract as currently rendered.

**Why the TDD suite didn't catch this:** `rules-registry.test.mjs`'s idempotency test (Slice 3) and its
M3-supersede test (Slice 6b) both chain `updateRegistry` calls by passing the **in-memory** `.rows` object
from one call straight into `existingRows` of the next — never through `renderRegistry` and back through a
column-limited re-parse. The renderRegistry test (Slice 7) asserts only that `canonicalName`/`source`/
`last_verified`/`## Changelog` appear — it never asserts `bucket`, `state`, or the evidence-pair text are
present in the rendered output, so the gap was invisible to the suite even though `bucket: 'overlap-
confirmed'` was present right there in that test's own fixture row.

**Fix.** Render the delta bucket as a table column; render the divergence state + evidence pair (and the
`suspect-stale-spec` tag when present) for `spec-only-divergent` rows — either as additional columns or as
an indented per-row block under the table (mirroring the changelog section's append style) so ordinary
rows stay uncluttered. Update `registryReadPrompt` to parse exactly what's actually rendered. Add a test
that exercises the real boundary: render → reconstruct only the recoverable columns (as this review's
repro does) → call `updateRegistry` again on unchanged input → assert `disposition === 'carried'` and
`changelog` unchanged — the current Slice 3/6 tests should be supplemented, not replaced, since the pure
in-memory chaining is still a valid (if incomplete) check on its own.

## Positive Observations

- **Inline-copy sync guard is real, not a rubber stamp.** Traced `selfcheck.mjs`'s `extractFn`/`normalize`
  logic directly — it extracts named function bodies via brace-depth matching, strips comment-only and
  blank lines, and diffs. Re-ran `node scripts/selfcheck.mjs` and `node scripts/gen-commands.mjs nexus`
  myself; both came back green/idempotent.
- **Test suites are non-vacuous.** Every one of the 23 new unit tests across the three libs asserts a
  specific behavioral invariant (bucket exclusivity via a `Set` size check, byte-identical row equality
  across two *consecutive steady-state* re-runs — not just seed vs. first re-run — a throw assertion for
  missing provenance, a negative "does NOT fire" case alongside every positive stale-spec/tag test). The
  BugRatio-shaped fixture (42 spec / 37 code) asserts exact bucket cardinalities (30/12/7), not just
  non-emptiness.
- **Skill-text discipline across three plugins is genuinely coherent** — fact vocabulary
  (`layer`/`criticality`/`mutation-gated`/`runtime-cost`) and tier definitions
  (`smoke`/`full`/`gate`) match verbatim in intent across the method skill and both adapters; the Flutter
  adapter explicitly calls out that its new fact-tag table is a *different* taxonomy from its pre-existing
  survivor-tag table at the same file, heading off a real collision risk.
- **Workflow runtime-contract discipline is solid** — no static import, no fs/Date/Math.random in the
  orchestrator body (manually re-read top to bottom); `_args` parses both the JSON-string and object
  arrival shapes; the crosswalk-map provenance rule (human-authored, post-hoc, passed in via `_args`,
  never computed by an agent in this run) is respected and documented at the point of use.
- **Honest scoping of what's deferred.** The `re-open` disposition gap, the C2/C3/C4 deferrals, and the
  cpp-adapter gap are all documented in-place (module comments, the SKILL.md adapter table, the tech-spec
  amendment) rather than silently absent — this made several of my pre-commitment predictions come back
  clean.

## Gaps

- **The registry round-trip gap (Finding above) also silently drops the code-only-precision bucket's
  `layer`/`criticality`.** Related but distinct root cause: `codeReadPrompt`
  (`harness/merge.workflow.js:451-453`) asks the code-arm-KB reader agent for
  `{ id, statement, boundary?, symbol?, attestation?, attributedSource? }` — it never asks for `layer`/
  `criticality`, even though `mine-verify-cover/SKILL.md`'s new `## Fact tagging & test tiers` section
  states the consolidate-stage schema gains these facts on **both arms**. A `code-only-precision` row's
  `entry` is spread from the code rule alone (no spec-side fields to fall back on), so those rows will
  likely render with blank `Layer`/`Criticality` columns even after the Finding above is fixed. Lower
  confidence than the main finding (moved to Open Questions below) since it depends on whether an existing
  code-arm KB's markdown actually carries per-rule layer/criticality yet.
- **Step 9 (live SR pilot) is correctly not executed** — operator-owed by construction, plan-sanctioned.
  The runbook in `implementation.md` is concrete enough to execute (exact paths, exact `Workflow(...)`
  call, exact independence-check sequence) — but note the Finding above means the FIRST real run of that
  runbook will hit the idempotency break on its *second* invocation (a re-run against the same BugRatio
  pair), not the first. Worth fixing before Step 9 runs, not after.
- **`specRepair` (ambiguous-verdicted rules) has no durable consuming-repo artifact** — it only appears in
  the git-ignored, nexus-side run report (`harness/.runs/merge-{class}.md`). Neither the plan nor the
  proposal mandates a durable spec-repair artifact beyond "routed... never silently dropped," and the
  report is itself one of Step 9's four expected artifacts, so this is not filed as a finding — noting it
  here in case a future arc wants spec-repair entries to survive in the registry too.

## Open Questions

- **[MEDIUM, confidence ~65] `codeReadPrompt` omitting `layer`/`criticality` for the code arm** (see Gaps
  above) — is this an oversight, or a deliberate "code-only-precision rows get triaged/tagged by a human
  later" design choice? If deliberate, worth a one-line comment in `merge.workflow.js` saying so, since
  the Data Model Changes' column list doesn't distinguish bucket-conditional blank columns from a
  completeness bug.
  **RESOLVED in Fix-Cycle 1** — see `### Fix-Cycle 1 Re-Review` below. `codeReadPrompt` now extracts
  `layer?`/`criticality?`, reasoned explicitly in `implementation.md` Key Decisions as "extract" (matching
  the method skill's "both arms" fact-tagging contract), not "blank is correct."
- **Carry-over — `updateRegistry`'s `re-open` disposition is unimplemented** (from `implementation.md` /
  the Step 1 done-check LOW note): **Confirmed, not a gap.** Read `harness/lib/rules-registry.mjs:11-25`
  directly — the module comment honestly scopes `re-open` as needing the C2 attestation record's
  verdict-line grammar, explicitly deferred per Scope, and documents that this lib implements only the
  `add`/`carried`/`supersede`/`retire` quarter of the M3 table. No action needed; correctly disclosed, not
  silently missing.
- **Carry-over — the hot-layer distillate writes to a nexus-side `.runs/` artifact, not an in-workflow
  `docs/kb/index.md` splice** (from the Step 1 done-check LOW note): **Confirmed, not a gap.** Traced
  `distillate-write` in `harness/merge.workflow.js:509` and the Key Decisions note in `implementation.md`
  — the plan's Data Model Changes names the eventual home (`docs/kb/index.md`) but does not mandate an
  in-workflow splice mechanism, and auto-splicing into a hand-maintained index would be a real
  destructive-edit risk (the `kb-write.mjs` supersede-not-delete precedent the codebase already follows
  elsewhere). `_args.distillatePath` gives a live run an explicit override once the splice mechanics are
  trusted. Agree with the architect's ruling.
- **Carry-over — `gen-omni --check` is RED (twin not synced):** Confirmed sanctioned per the plan
  ("expected-RED until the owner's twin sync") and CLAUDE.md's release process (owner-owed, private
  `../omni` repo, outside this session). Not a Step 2 blocker.

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit + lint suite (fresh, this session) | PASS | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `469 pass, 0 fail` |
| selfcheck (fresh, this session) | 4/5 (1 sanctioned RED) | `node scripts/selfcheck.mjs` | tests PASS; gen-commands drift PASS; gen-omni --check **FAIL (sanctioned)**; bump-plugin --check PASS; spec-diff inline-copy sync PASS (7 pairs) |
| gen-commands idempotency (fresh) | PASS | `node scripts/gen-commands.mjs nexus` then re-ran selfcheck | regenerated byte-identical — selfcheck's gen-commands-drift check stayed PASS after the rerun |
| Plugin validation ×3 (fresh) | PASS | `claude plugin validate plugins/{nexus,nexus-dotnet,nexus-flutter} --strict` | exit 0 all three |
| Version bumps (fresh) | Confirmed | read `plugin.json` for all three plugins | nexus 1.21.0, nexus-dotnet 1.3.0, nexus-flutter 0.3.0 — matches implementation.md |
| Registry round-trip idempotency (fresh, this session — the HIGH finding) | **FAIL** | ad hoc Node repro: render → reconstruct only the columns `renderRegistry` actually emits → re-`updateRegistry` on unchanged input | `run 2 disposition: supersede` (expected `carried`); changelog grew by one spurious entry |
| Inline-copy sync guard logic (read, not just run) | Confirmed sound | read `scripts/selfcheck.mjs:98-133` (`normalize`/`extractFn`) | comment/blank-line-normalized function-body diff — a real check, not a name-only stub |

*Status: COMPLETE — reviewer, 2026-07-03 (initial pass, superseded by the Fix-Cycle 1 re-review below).*

---

### Fix-Cycle 1 Re-Review

**Re-reviewed by:** reviewer | **Cycle:** 1/3 | **Date:** 2026-07-03

**Scope (per the coordinator's dispatch):** confirm the HIGH is resolved (re-run the round-trip repro
against the new `parseRegistry` path), spot-check the 6 new tests aren't vacuous, confirm inline-copy sync
still holds, confirm the Open Question disposition. Read the developer's fix summary but verified against
the live diff, not the summary, per standing instruction.

**Verified against the actual diff (not the fix summary):**

- Read `harness/lib/rules-registry.mjs` in full (263 lines, was 157) — `renderRegistry` now emits a
  `Bucket` table column plus a `## Divergence detail` section (state/evidence-pair/tags, per-row, present
  only when at least one divergent row exists — confirmed empty-case omission by test). New `parseRegistry`
  is the deterministic inverse (table parse + divergence-block regex parse + changelog parse). `evidenceKey`
  now fingerprints only `bucket`/`layer`/`state`/`evidencePair`/`tags` — **`boundary`/`codeRule.boundary`
  removed**, which is the second, previously-unstated root cause: even with (1) fixed alone, a fingerprint
  over non-persisted fields could never recompute identically post-round-trip. The `_evidenceKey` cache
  field is gone; grepped the whole tree (`harness/`, `tests/`) — zero remaining references outside
  historical Key Decisions prose.
- Read the corresponding block in `harness/merge.workflow.js` (lines 190-373) line-by-line against the lib
  — logically identical (comments differ only, which is what the sync guard normalizes away). `codeReadPrompt`
  (`:529-533`) now asks for `layer?`/`criticality?` on the code arm, resolving my Open Question. The
  `registryReadPrompt` (`:535-538`) no longer instructs the agent to reconstruct structured JSON from a
  column list at all — it now asks for verbatim raw content, and the orchestrator parses it via
  `parseRegistry` (`REGISTRY_READ_SCHEMA` changed from `{exists, rows, changelog}` to `{exists, content}`).
  This is a structural fix, not a patch: the read/write contract is now enforced by a tested pure-function
  pair instead of two independently-maintained prompt/writer descriptions, so this class of drift cannot
  recur silently.
- **Re-ran my own HIGH-finding repro against the new path** (not just re-read the fix) — built a proper
  seed→steady-state→render→parse→re-run sequence (matching the plan's own idempotency definition, not the
  seed-vs-first-carried transition I mistakenly diffed on a first pass): unchanged `overlap-confirmed` row
  stays `carried` across two consecutive real round trips, rows byte-identical, changelog un-grown between
  the two steady-state re-runs. Re-ran the divergent-row case (`state`/`evidencePair`/`tags` all present) —
  same result: `carried`, zero new changelog growth, and the parsed-back row is field-for-field identical
  to the pre-render row. **The HIGH finding's core defect is closed** — confirmed independently, not by
  trusting the developer's own new test.
- **Spot-checked the 6 new tests are non-vacuous** (`tests/unit/rules-registry.test.mjs` Slices 7b/8/9,
  `tests/unit/workflow-contract.test.mjs`'s two new tests): each asserts specific rendered/parsed text
  (`assert.match(md, /divergence-pending-triage/)`, exact `evidencePair` field equality post-parse, an
  explicit `assert.doesNotMatch` for the no-divergent-rows case rather than just checking the row count),
  not just "did not throw." The `workflow-contract.test.mjs` addition is the strongest one — it builds a
  **hand-written, `renderRegistry`-shaped** prior registry file (including the `Bucket` column), feeds it
  through the actual sandboxed `merge.workflow.js` with `exists:true`, and asserts
  `dispositionCounts.carried === 1` / `dispositionCounts.supersede === undefined` — proving the fix through
  the real agent-call wiring (schema change included), not just the isolated lib. All 5 pre-existing Slices
  1–6 + the original Slice-7 renderRegistry test are byte-identical to what I read in the initial pass —
  confirmed unmodified, not weakened to make the new tests pass.
- **Confirmed inline-copy sync still holds** — `parseRegistry` added to the existing `rules-registry.mjs` ↔
  `merge.workflow.js` PAIRS entry in `scripts/selfcheck.mjs:170`; ran `node scripts/selfcheck.mjs` fresh,
  `spec-diff inline-copy sync` still PASS (7 pairs — same count, since this extended an existing pair's
  `fns` list rather than adding a new pair).
- **Confirmed the Open Question disposition** (`codeReadPrompt` layer/criticality) — resolved as "extract,"
  reasoned in `implementation.md` Key Decisions: the method skill's `## Fact tagging & test tiers` section
  states the consolidate-stage schema gains these facts on both arms, so extraction (not blank-by-design) is
  the contract-consistent default; a code-arm KB that genuinely lacks them will still correctly report them
  absent, not fabricate data. Agree with this resolution — it directly cites the governing skill text rather
  than asserting a preference.
- **No new findings surfaced this cycle.** Checked the fix's own edge risk (whether removing `boundary`/
  `codeRule.boundary` from `evidenceKey` could mask a genuine change that keeps the same bucket) — the
  developer's own Key Decisions note discloses this as a deliberate, narrow, documented scope choice
  (`criticality` also deliberately excluded from the fingerprint for the same reason), consistent with the
  plan's Data Model Changes column list (which never named `boundary` as a registry column in the first
  place). Not a regression — a correction of the original over-broad fingerprint.

**Fresh gates, re-run this cycle (not trusted from the fix summary):**

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit + lint suite | PASS | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `475 pass, 0 fail` (was 469; +6 new, matches the fix summary) |
| `rules-registry.test.mjs` alone | PASS | `node --test tests/unit/rules-registry.test.mjs` | `13 pass, 0 fail` (8 pre-existing + 5 new: renderRegistry×2, parseRegistry×2, the round-trip regression) |
| `workflow-contract.test.mjs` alone | PASS | `node --test tests/unit/workflow-contract.test.mjs` | `61 pass, 0 fail`, including both new merge-sandbox tests |
| selfcheck | 4/5 (1 sanctioned RED) | `node scripts/selfcheck.mjs` | tests PASS; gen-commands drift PASS; gen-omni --check **FAIL (sanctioned, unchanged)**; bump-plugin --check PASS; spec-diff inline-copy sync PASS (7 pairs, `parseRegistry` now included) |
| Plugin validation ×3 | PASS | `claude plugin validate plugins/{nexus,nexus-dotnet,nexus-flutter} --strict` | exit 0 all three |
| Version bumps | Unchanged (correct) | read `plugin.json` ×3 | nexus 1.21.0, nexus-dotnet 1.3.0, nexus-flutter 0.3.0 — no re-bump; no plugin-shipped file touched this fix cycle (harness/tests/selfcheck.mjs are dev-repo-only) |
| **HIGH-finding repro, re-run against `parseRegistry`** | **PASS (was FAIL)** | ad hoc Node repro: seed→steady-state→render→parse→re-run, both an ordinary and a divergent row | steady-state disposition stays `carried` across two consecutive real round trips; rows byte-identical; changelog unchanged between the two steady states |
| `git diff`/full read of the changed lib + workflow + selfcheck + both test files | Read directly, not summarized | — | confirms the fix summary's description matches the actual diff |

**Cycle 1 verdict: APPROVED** (this is the section's single canonical verdict — see the `## Verdict:` line
at the top of this Step 2 section, now updated to match)

No CRITICAL or HIGH issues remain open. The one HIGH finding from the initial pass is resolved and
independently re-verified (not just re-read). The one MEDIUM-confidence Open Question is resolved with a
sound, skill-text-grounded justification. No new findings surfaced during the re-review of the changed
files and their adjacent call sites (the render/parse pair, the workflow's Load phase, the selfcheck PAIRS
registration, and both test files).

*Status: COMPLETE — reviewer, 2026-07-03 (Fix-Cycle 1 re-review).*
