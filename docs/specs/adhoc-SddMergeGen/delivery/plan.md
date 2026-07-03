# Implementation Plan — adhoc-SddMergeGen

**Spec:** None (ad-hoc lane). Binding inputs: `docs/proposals/sdd-generate-merge-2026-07.md` (Draft —
**ratification is the pre-ship gate**: Steps 1–7 build provisionally, Steps 8 and 10 block unratified),
`docs/specs/adhoc-SddLifecycle/definition/tech-spec.md` (M1/C1/C2/M3 contracts),
`docs/specs/adhoc-SddCoverageLoop/` (AC-6 framing + Inc2 seed code), and the two consuming-repo pilot
evaluations cited in the proposal's Provenance.
**Intent:** Complex — new harness libs + workflow, shipped-skill mode additions across THREE plugins
(`nexus`, `nexus-dotnet`, `nexus-flutter`), agent-rule edits, spec amendment, release. 10 steps, at the
split threshold — not split: steps 1–4 are one dependency chain; splitting 5–8 / 9–10 leaves <2-step
sub-plans.
**Execution constraint (binding):** Step 9 requires the Workflow/agent-spawn surface and a consuming
repo — operator-owed **by construction**. The developer completes Steps 1–8, hands back; Step 9 is the
operator's arm; Step 10 closes.
**Architecture stance (grounded in ADR-1/ADR-6 precedent + adhoc-SpecArmTrigger):** shipped deliverables
are **method instructions in the skills** (agent-executed in consuming repos — mine-from-spec precedent);
`harness/` libs + workflow are the **dev-repo proving ground only** (offline validation + the nexus-side
pilot), never shipped. Both halves are in scope; skill text never references harness files.
**Version/release:** Step 10 bumps **every plugin whose `plugins/**` files changed** — `nexus`,
`nexus-dotnet`, `nexus-flutter` (MINOR each, owner-escalated) — once, after ALL edits, never per-step
(repo rule). Omni twin sync + commit are owner-owed at close.
**Owner-AFK provenance:** four checkpoint answers auto-applied at the 60s timeout (2026-07-03), recorded
in the proposal's Unresolved: per-repo registry (U-1), independence proven in first live merge run (U-2),
successor slug = this one (U-4), distillation in scope (this plan). All reversible at ratification —
reversal map in Open Questions, **including U-3** (tag vocabulary; highest fan-out).

---

## Context

AC-6 is adjudicated GO by the proposal (three SR spec-arm runs + the flutter two-arm comparison). This
arc builds the SDD loop's second half: the M1 triage-merge (spec-rules × code-arm KB → triaged, durable
registry), the **diff-driven** Cover-from-spec generator (consumes the triaged diff, never the raw rule
list), fact-based test tagging with derived tiers, the two-layer KB distillation (hot/cold + token
budget), and the spec write-back routing rules.

## Scope

**In:** harness merge/registry/distill libs + merge workflow (dev-repo); `mine-verify-cover` SKILL.md
merge + generate modes, tag vocabulary, ungating (`nexus`); tag/tier mapping in **both shipped
adapters** — `mine-verify-cover-dotnet` (`nexus-dotnet`) and `mine-verify-cover-flutter`
(`nexus-flutter`); `solo.md`/`developer.md` write-back rules; SddLifecycle amendment + ADR extraction;
multi-plugin release.
**Out (each explicitly dispositioned):**
- Team-mode technical-branch surfacing (deferred since adhoc-SpecArmTrigger).
- SR read-tracker false-positive fix (separate inbound feedback, `nexus-1.20.0-2026-07-03.md` item 2).
- Consuming-repo triage of the flutter C1–C6/U1–U9 findings (lives in that repo).
- **`mine-verify-cover-cpp` tag mapping — deferred** (proposal §B names dotnet+flutter only; cpp adapter
  gets the vocabulary in a follow-up; note the deferral in the method skill's adapter table so it is not
  silently inconsistent).
- **SddLifecycle C2 (attestation record + verdict/carried grammar, AC-L2/AC-L5) and C3/C4 (merged ONE
  test set) — deferred deliberately** per the proposal's §A re-scope (merge registry + generator first;
  attestation/one-suite merge is the next arc). Step 8 records the forward reference in the amendment.
- **Proposal §C render step (BR ledgers → docs-bootstrap high-trust source) — external omnishelf-docs
  concern**; captured as an extracted ADR (Step 8), implemented in that estate, not here.
- Any change to the shipped Mine+Verify arm's behavior.

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | yes | merge/triage lib; inputs below | harness-lib patterns — log |
| 2 | (none) | — | yes | registry writer; kb-sync-borrowed invariants | |
| 3 | (none) | — | yes | distill + token-budget lint | |
| 4 | (none) | — | no | merge workflow + guard registrations | |
| 5 | (none) | — | no | tag vocabulary + two adapter mappings (instruction edits) | |
| 6 | (none) | — | no | generate mode + ungating (instruction edits) | |
| 7 | (none) | — | no | agent write-back rules + gen-commands | |
| 8 | (none) | — | no | spec amendment + ADR extraction | |
| 9 | mine-verify-cover | Follow | no | live merge pilot on SR; Owner: operator | |
| 10 | release-plugin | Follow | no | three MINOR bumps (nexus, nexus-dotnet, nexus-flutter) | |

All-`None` steps still carry the TDD column; steps 1–3 are `TDD: yes` (node test runner, mjs — pattern:
`tests/unit/rule-crosswalk.test.mjs`, `tests/unit/workflow-contract.test.mjs`).

## Domain Model Changes

None (no product domain — plugin/method repo).

## Data Model Changes

New durable artifact shapes (documented in the skill, written per consuming repo):
- **Registry** — at the SddLifecycle OD-L5 default path `docs/kb/golden/{Class}.md` (C1 sections now;
  C2 attestation sections join when that deferred arc ships — one file, per the tech-spec's combined
  C1+C2 default): one row per canonical rule (canonical NAME key per SddLifecycle HIGH-D), columns:
  rule name, layer, criticality, arms (spec/code/both), delta bucket (the five from Step 1),
  disposition (add | carried | re-open | supersede | retire — the M3 reconciliation table; plus the
  `divergence-pending-triage` state carrying the spec-citation + code-attestation evidence pair and
  the optional `suspect-stale-spec` tag), provenance `source:`, `last_verified`, pointer to ledger
  row. Deprecate-never-delete; append-only changelog section.
- **Hot-layer distillate** — `docs/kb/index.md` rows: one line per rule cluster + registry pointer,
  under a stated token ceiling.

## Implementation Steps

### Step 1 — Merge/triage engine lib (harness)
**Files:** `harness/lib/merge-rules.mjs` (new), `tests/unit/merge-rules.test.mjs` (new)
**Satisfies:** proposal §A.1; SddLifecycle M1/M3 reconciliation table
**TDD:** yes

Content-keyed, granularity-tolerant matching of a `spec-rules.md` rule set against a code-arm KB rule
set. Match on symbol + condition content (never names or counts; many-to-one both ways — pattern:
`harness/lib/rule-crosswalk.mjs` `applyCrosswalk`/`reconcileRuleSets`, which this lib composes with,
not replaces). Output = the **five delta buckets** (proposal/SR-addendum condition 5): `overlap-
confirmed | spec-only-other-layer | spec-only-divergent | spec-only-unimplemented | code-only-
precision` — every rule in exactly one bucket, nothing silently dropped — plus the M3 dispositions
(add/carried/re-open/supersede/retire + the spec-disappearance edge). `spec-only-divergent` rows get
the distinct **`divergence-pending-triage`** state with the **evidence pair** (spec citation + code
attestation) — neither candidate-bug nor discard (SR-28/SR-23 precedent) — and a `suspect-stale-spec`
tag when the code-arm KB attributes the behavior to a source the mined spec predates (condition 6).
`ambiguous`-verdicted spec rules are **excluded from generation-eligible buckets** and routed to a
`spec-repair` list (condition 2).
**Accept:** unit tests (collected by the `tests/unit/*.test.mjs` glob) cover — many-to-one both
directions; each of the five buckets reachable and exhaustive (a rule never lands in two); a
divergent row carries both evidence-pair fields; the stale-spec tag fires on a predates fixture;
ambiguous exclusion; the BugRatio fixture pair (42 spec rules vs 37 code BRs, synthetic fixtures
mirroring the SR shapes) triages with non-empty `overlap-confirmed` after crosswalk.

### Step 2 — Registry writer lib (harness)
**Files:** `harness/lib/rules-registry.mjs` (new), `tests/unit/rules-registry.test.mjs` (new)
**Satisfies:** SddLifecycle C1; proposal §C (kb-sync borrowings)
**TDD:** yes

Writes/updates the per-repo registry (shape + OD-L5 path in Data Model Changes) from Step 1's triage
output. Binding invariants (borrowed from omnishelf kb-sync, cited in the proposal): every row carries
`source:` provenance and `last_verified`; existing rows are never deleted — disposition flips to
`retire`/`supersede` with the record kept; every write appends a changelog entry; a re-run against an
unchanged input pair is idempotent (no diff).
**Accept:** unit tests prove — no-delete invariant (a removal input yields a retained row with
`retire`); changelog append per write; idempotent re-run; provenance mandatory (write without `source:`
throws).

### Step 3 — Distillation + token-budget lint (harness)
**Files:** `harness/lib/kb-distill.mjs` (new), `tests/unit/kb-distill.test.mjs` (new)
**Satisfies:** proposal §C two-layer KB (owner correction 2026-07-03)
**TDD:** yes

Distills a registry into hot-layer rows (one line per rule cluster + pointer) and lints the hot layer
against a token ceiling (default constant, overridable; fail-closed when exceeded — the sync must not
silently bloat the always-loaded context). Cluster = same symbol + layer.
**Accept:** unit tests prove — one row per cluster with a resolving pointer; lint fails over ceiling
and passes at it; a ledger's full text never appears in the distillate (grep: no multi-line rule bodies
in output).

### Step 4 — Merge workflow front-end + guard registrations (harness)
**Files:** `harness/merge.workflow.js` (new); modify `tests/unit/workflow-contract.test.mjs`,
`scripts/selfcheck.mjs` (registration lists — the inline-sync guard keys on `harness/lib/…` paths,
`selfcheck.mjs:139-152`)
**Satisfies:** proposal §A build order (merge first)
**TDD:** no (contract-guard tests are the acceptance)

Actor skeleton mirroring `harness/spec-cover.workflow.js` (`_args` pattern): load both arms' artifacts →
crosswalk → merge (Step 1) → registry write (Step 2) → distill + lint (Step 3) → report. Workflow-runtime
constraints apply (meta-first, no static imports, no fs/Date/Math.random — agents do all I/O; the 7-rule
contract in the offline mock-globals guard). Register in the contract guard's shared loop + the
per-workflow no-static-import entry + the selfcheck sync guard (the `spec-cover-calc` registration
shape). A dedicated sandbox-run test file (the precedent's `spec-cover-calc-workflow.test.mjs`) is
**optional** — Steps 1–3's lib TDD covers the logic; add it only if the workflow gains logic the libs
don't own.
**Accept:** contract guard green including the new entries; selfcheck passes; **build-only PASS does
not prove the live merge** — that is Step 9's arm.

### Step 5 — Fact tagging + tier vocabulary (shipped instructions, THREE plugins touched across 5–6)
**Files:** `plugins/nexus/skills/mine-verify-cover/SKILL.md`;
`plugins/nexus-dotnet/skills/mine-verify-cover-dotnet/SKILL.md`;
`plugins/nexus-flutter/skills/mine-verify-cover-flutter/SKILL.md`
**Satisfies:** proposal §B; SR pilot condition 1 (layer tags)
**TDD:** no
**Ratification dependency:** the fact set + tier names are §U-3's "ratified vocabulary" — encoded here
provisionally; a U-3 reversal reworks this step and both adapter mappings (see Open Questions map).

Three edits:
1. **mine-verify-cover:** the consolidate stage's output schema (both arms) gains per-rule facts —
   `layer: domain-calc | api | ui | settings` (SR proposal 1), `criticality: golden | core | edge`;
   Cover's test-writer emits the facts plus `mutation-gated` and `runtime-cost: fast | slow` as test
   tags. Define the **named tiers as
   filter expressions over facts** (initial set: `smoke` = golden ∧ fast; `full` = all; `gate` =
   mutation-gated, run on target-class change) — explicitly extensible, explicitly **no scalar score**
   (record the rejection one-line so a later session doesn't re-propose it). Note in the adapter table:
   cpp mapping deferred.
2. **mine-verify-cover-dotnet:** map facts→`[Trait("layer",…)]` etc. and tiers→`dotnet test --filter`
   expressions (natural home: the capabilities/Test-style area, `SKILL.md:16-18`); plus the parked-red
   idiom — `[Fact(Skip = "SPEC-CODE DIVERGENCE … pending triage")]` with observed values (the SR
   mini-pilot convention).
3. **mine-verify-cover-flutter:** map facts→flutter test `tags` and tiers→`--tags` filter expressions,
   coherent with the adapter's existing survivor-tag taxonomy (`SKILL.md:92`) — extend, don't collide;
   plus the parked-red idiom via `skip:` with the same divergence-marker message shape.
**Accept:** greps — fact fields named in the consolidate schema; the three tier definitions present;
"no scalar" rejection line present; dotnet Trait/filter mapping table present; flutter tags/filter
mapping present; cpp-deferred note present.

### Step 6 — Generate mode (diff-driven Cover-from-spec) + ungating (shipped instructions)
**Files:** `plugins/nexus/skills/mine-verify-cover/SKILL.md` (anchors — re-grep before editing, lines
move: `:51`, `:74`, the SDD-lifecycle mode table `:277-280` incl. M0 "Cover/red-suite deferred" `:277`
and M3 "three-way reconciliation deferred" `:280`, `:285`, `:305`)
**Satisfies:** proposal §A.2; SR pilot conditions 1–3
**TDD:** no

Add the **merge** and **generate** stages to the SDD-lifecycle section as shipped modes:
- **Merge:** agent-executed per the method (the skill describes stages + the registry/distillate
  artifact contracts from Data Model Changes; content-keyed matching rules verbatim in substance from
  Step 1's semantics). Never references harness files.
- **Generate (Cover-from-spec):** input = the triaged registry — **only** `spec-only-unimplemented`
  rules whose `layer` matches the plan's target surface, plus owner-confirmed `spec-only-divergent`
  rows; `ambiguous` is blocked (routes to spec repair). **Two preconditions before authoring any red
  (SR proposals 6–7):** run the implemented-upstream check for rules whose layer ≠ target surface
  (SR-31 precedent — one inspection beats a misleading wrong-layer red), and route `suspect-stale-
  spec`-tagged divergences to spec repair, not test generation. **Output convention:** generated reds
  are KEPT, parked as skipped divergence records via the adapter's idiom (Step 5) with observed
  values, so the suite stays green while the divergence stays on the record. **Cover waits for the
  plan** (target surface is a plan decision — SddLifecycle amendment 2026-07-03 stands); worktree
  isolation returns for generate/merge (Mine+Verify stays manifest-only). Generated tests carry Step
  5's tags. In a mature-code run with an empty eligible set the correct output is zero tests — state
  this explicitly (flutter pilot; its executed probe validated the mechanism: 5 red confirmed drifts,
  1 green keeper, zero false alarms).
- **Ungating — rewrite the whole SDD-lifecycle mode table, not spot anchors:** rows M0 (`:277`) and M3
  (`:280`) currently say "deferred" and become stale the moment this step ships; `:74` ("No Cover, no
  mutation gate in this mode") must be reconciled against the new generate mode (that line stays true
  for Mine+Verify-from-spec — scope it explicitly). Replace the `:51`/`:285`/`:305` AC-6 claims with
  shipped-mode language + a pointer to the ratified proposal. C2/C3/C4 remain deferred (Scope) — the
  table must say so accurately, not implicitly.
**Accept:** grep `\bdeferred\b` within the SDD-lifecycle section returns ONLY the sanctioned deferrals
(C2/C3/C4 one-suite/attestation + cpp mapping; the unrelated `:267` multi-class-sweep deferral is
outside the section and untouched); no remaining "AC-6-gated"/"deferred pending" claim anywhere in the
file; generate-mode eligibility rule (spec-only ∧ verified ∧ layer-match; ambiguous blocked) present;
zero-tests-is-correct line present.

### Step 7 — Write-back routing rules + regenerate commands
**Files:** `plugins/nexus/agents/solo.md` (net-new section), `plugins/nexus/agents/developer.md`
(`:131` read-only enumeration); then `node scripts/gen-commands.mjs nexus`
**Satisfies:** proposal §D (owner decision 2026-07-03: developer never updates specs/plans)
**TDD:** no

1. **solo.md:** net-new "Spec write-back" section, placed beside the attestation drift check (`:14`) —
   after a fix that changes committed behavior, solo applies *trivial factual* spec corrections only
   (stale constant, dangling cross-reference) and re-stamps `spec-rules.md` when present (delta
   re-check, shipped 1.20.0); anything behavioral (bug-or-AC-change) is surfaced to the PO/owner, never
   settled.
2. **developer.md:131:** add `spec.md` (and `definition/` generally) explicitly to the read-only
   enumeration — currently implied, not named.
3. Regenerate commands (repo rule: agents changed; `nexus` only — no agent files change in the adapter
   plugins).
**Accept:** greps for both rules; `plugins/nexus/commands/{solo,developer}.md` regenerated in sync.

### Step 8 — SddLifecycle amendment + ADR extraction (ratification-gated)
**Files:** `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md`;
`docs/architecture/README.md` (ADR register); `docs/proposals/sdd-generate-merge-2026-07.md`
**Satisfies:** ADR-27/28 graduation
**TDD:** no

Amend SddLifecycle: AC-6 **discharged** (cite the proposal + the two consuming-repo evaluations), the
fold-in gate lifted for M1/C1 + generate, **C2/C3/C4 explicitly still deferred with a forward reference
to the next arc** (Scope), M1/C1 contracts implemented by this arc (pointers, not restatement). Extract
the proposal's ratified decisions as ADRs into the register (AC-6 GO + merge-first; diff-driven
generate; fact-based tagging/no-scalar; two-layer KB + render direction — the render ADR notes it is
implemented in the omnishelf-docs estate; write-back routing). Flip the proposal
`Status: Draft → Ratified` **only if the owner has ratified by then** — otherwise this step BLOCKS
(the pre-ship gate biting; escalate, do not proceed to Step 10).
**Accept:** greps — "AC-6" in SddLifecycle reads discharged; C2/C3/C4 deferral + forward reference
present; N new ADR entries present; proposal status consistent with the owner's recorded ratification.

### Step 9 — Live merge pilot on sprint-rituals (Owner: operator)
**Satisfies:** proposal U-2 resolution (independence proven in first live run); AC-T6 lineage
**Owner:** operator — by construction (needs Workflow/agent-spawn surface + the consuming repo)
**Confidence:** medium — first live run of the merge method; synthetic fixtures are the only precedent.

Runbook obligation (developer writes it into implementation.md; operator executes): in SR, run the
shipped merge method on one already-piloted pair (e.g. F13-BugRatio `spec-rules.md` × `docs/kb/
bug-ratio.md`) with **blind-arm independence enforced and evidenced** (input manifests disjoint; the
crosswalk map authored post-hoc, human-confirmed, never a run input — the SddCoverageLoop
`checkIndependence` discipline). Artifacts: the SR registry + distillate + an independence note.
**Accept (states what build-only did not prove):** Steps 1–4 green proves offline semantics only; this
step's artifacts in SR prove the live method + independence. A plan-sanctioned non-run at close is
`Deviated (valid reason)` with the runbook owed — not Missing.

### Step 10 — Release: multi-plugin MINOR bumps + gates (ratification-gated with Step 8)
**Skill:** Follow `release-plugin`
**Satisfies:** repo release rule (ADR-9)

After ALL edits, **one bump per changed plugin** (three total — `nexus`, `nexus-dotnet`,
`nexus-flutter`): `node scripts/bump-plugin.mjs --dry-run --minor` per plugin → verify each proposal
(bare `--dry-run` shows PATCH; the tool never auto-escalates; run once after all edits, never
mid-sequence) → apply `--minor` per plugin. Gates: `claude plugin validate --strict` exit 0 for each
changed plugin; lint/unit suite green (now including Steps 1–3 tests under `tests/unit/`); selfcheck
(`gen-omni --check` expected-RED until the owner's twin sync at commit).
**Accept:** three MINOR bumps + CHANGELOG entries (one per plugin); validate exit 0 ×3; gates recorded
in implementation.md. No commit (owner-owed).

## Cross-Service Changes

None (single repo; consuming-repo effects ship via the plugins).

## Migration Notes

None. Existing consuming-repo KBs/spec-rules need no migration — the registry is additive; first merge
run seeds it at the OD-L5 path.

## Testing Strategy

Harness libs TDD'd (Steps 1–3; tests in `tests/unit/` — the only globs the suite and CI collect,
`selfcheck.mjs:45`; fixture pairs mirroring the SR BugRatio shapes); workflow proven by contract guard +
selfcheck (Step 4); shipped instructions proven by acceptance greps (Steps 5–7); the live method proven
by the operator's SR pilot (Step 9). No mutant execution outside the sanctioned runners (standing rule —
the C++ deadlock lesson).

## KB Impact

None in this repo (nexus has no `docs/kb/`). The registry/distillate contracts land in consuming repos
via Step 9 and future runs.

## Open Questions

None open. Owner-checkpoint answers auto-applied at the 60s AFK timeout (header provenance) —
provisional until proposal ratification. **Reversal map:** U-1 (registry home) → Steps 2/9;
U-2 (pilot form) → Step 9; **U-3 (tag vocabulary) → Steps 5–6 + both adapter mappings — the highest
fan-out; adapters encode the vocabulary provisionally**; U-4 (vehicle) → Step 8; distill-scope →
Steps 3/4. A reversal re-opens the mapped steps.

## Plan Review

Mode: code-grounded critic (Mode 2) — mandatory for a shared-artifact pass; auto-applied at the
owner-AFK checkpoint (repo precedent). **Verdict as returned: NO-GO (2 CRITICAL, 3 HIGH, 5 MEDIUM,
1 LOW) → all findings folded; plan rev 2 approved.** Full findings: `delivery/review-critic.md`.

| # | Finding | Disposition |
|---|---------|-------------|
| F1 CRIT | Adapter path in wrong plugin; single-`nexus` bump strands adapter edits (version-keyed cache) | **Fixed** — Step 5 targets `plugins/nexus-dotnet/...` + `plugins/nexus-flutter/...`; Step 10 bumps all three changed plugins |
| F2 CRIT | "No shipped flutter adapter" false — `mine-verify-cover-flutter` ships; §B flutter-tags commitment dropped | **Fixed** — flutter mapping is Step 5.3; false claim removed from Scope |
| F3 HIGH | Tests at `harness/*.test.mjs` never collected (suite globs `tests/{lint,unit}` only); Step 4 edited a non-existent file | **Fixed** — all tests → `tests/unit/`; Step 4 targets `tests/unit/workflow-contract.test.mjs`; citations corrected |
| F4 HIGH | Ungating missed `:277`/`:280` table deferrals + `:74`; accept grep too narrow | **Fixed** — Step 6 rewrites the whole mode table, scopes `:74`, accept grep broadened to `\bdeferred\b` with sanctioned-only carve-out |
| F5 HIGH | U-3 (tag-vocabulary freeze) absent from reversal map while Step 5 encodes it | **Fixed** — U-3 mapped to Steps 5–6 + adapters; provisional-encoding note on Step 5 |
| F6 MED | Libs belong in `harness/lib/`; crosswalk precedent path wrong | **Fixed** — Steps 1–3 under `harness/lib/`; path corrected |
| F7 MED | C2/C3/C4 undispositioned; registry path diverged from OD-L5 | **Fixed** — explicit deferral in Scope + Step 8 forward reference; registry at OD-L5 `docs/kb/golden/{Class}.md` |
| F8 MED | "Entry gate" wording invited halt-at-Step-1 misreading | **Fixed** — renamed pre-ship gate; Steps 1–7 provisional, Steps 8/10 block |
| F9 MED | §C render step undispositioned | **Fixed** — Out-of-scope disposition (omnishelf-docs estate) + ADR note in Step 8 |
| F10 MED | cpp adapter silently inconsistent | **Fixed** — explicit deferral in Scope + adapter-table note in Step 5.1 |
| F11 LOW | "exactly" overstated the registration precedent | **Fixed** — shared-loop + no-static-import required; dedicated sandbox-run test optional with criterion |

**Rev 3 (2026-07-03, same session):** both pilot evidence files gained same-day addenda (flutter
"Executed probe"; SR "Addendum + Proposals 1–7") — folded per the revision-pass re-grounding rule:
Step 1 buckets → the five delta buckets + `divergence-pending-triage` (evidence pair) +
`suspect-stale-spec`; registry schema extended to match; `layer` enum gains `settings`; Step 6 gains
the implemented-upstream + stale-spec preconditions and the parked-red output convention; adapters
gain the skip-idiom mapping; fixture count corrected (37 code BRs). Repo-fact findings from the
critic pass are unaffected (no live-repo claims changed); the deltas are design-input additions from
the governing evidence, traceable line-by-line to the two updated files.
