# F7 — Mine Machinery Borrow Wave 2 — Implementation

Developer Phase-2 implementation of `docs/specs/F7-MineMachineryBorrowWave2/delivery/plan.md`
(Steps 1–9; Step 10 is team-lead close-out). Written incrementally, one step at a time.

## Files Created
- `docs/skill-evals/2026-07-18-mine-verify-family.md` — (Step 9) the evaluate-skill findings doc for the
  touched skills (mine-verify-cover incl. `references/mine-family-core.md`, mine-verify-repo). **Verdict:
  ACCEPT** — Layer 0 clean, no Critical/High/Medium, 2 deferred Low watch-items. The F7 changes are a net
  fitness improvement (advisory→enforced, duplication reduced, resumable + fan-out overlays satisfied).
- `docs/specs/F7-MineMachineryBorrowWave2/delivery/s6-bugratio-recall-report.md` — (Step 8) the S6 BugRatio
  recall run report: **recall 3/3 = 100%** (GOLD-16↔BR-1, GOLD-17↔BR-5, GOLD-18↔BR-21; unmatched: none)
  over the current 37-rule confirmed registry, no fresh mine run. Both disclosure lines (verbatim
  development-class disclosure + judge attribution) + evidence-not-a-gate status. Golden referenced by path
  + GOLD id ONLY (clean-room binding rule — no golden rule text).
- `plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs` — (Step 1) the SHIPPED, target-agnostic
  §6 gate battery: 7 exported gates (`suiteGreen`, `noFlaky`, `mutationFloor`, `targetMutated`,
  `noNewSkips`, `charPin`, `mutationRatchet`), zero imports, no per-class data. ADR-62 canonical/hash-drift
  anchor. Generalized from the 248-line dev-repo file; all pilot data (`EXPECTED_SURVIVOR_LINES`, `17,133,268`,
  `BugRatioAnalyzer`, `Fokus.Domain`) stripped.
- `tests/unit/cover-gates-shipped.test.mjs` — (Step 1, TDD) pins the shipped artifact directly: 7 binding
  exports present, NO `EXPECTED_SURVIVOR_LINES` export, `mutationFloor` with no opt excludes nothing (no
  inherited dead lines), caller-supplied exclusion still honored, battery smoke. 5 tests.
- `plugins/nexus/skills/mine-verify-cover/tools/evidence-gate.mjs` — (Step 3) the SHIPPED, target-agnostic
  structural evidence predicate `structuralEvidenceOk(evidence, claim)` → `{pass, reason, detail}`; reasons
  `empty | claim-echo | no-reexecution-content | ok`. Zero imports. ADR-62 invoke-in-place.
- `harness/lib/evidence-gate.mjs` — (Step 3) dev-repo re-export shim of the shipped predicate.
- `tests/unit/evidence-gate.test.mjs` — (Step 3, TDD, ADR-60) adversarial must-fail fixtures: (a) claim-echo
  REJECTED, (b) empty/whitespace REJECTED, (c) genuine re-execution excerpt PASSES; plus no-reexec rejection,
  claim-omitted behavior, shim parity, and the two lib gate helpers (`gateRuleEvidence`, `gateRegistryEvidence`).
- `harness/lib/run-journal.mjs` — (Step 4) the per-run journal + idempotent cross-session reconcile lib.
  Pure functions: `createJournal`/`startStage`/`completeStage` (stage status + timestamps + per-stage token
  accrual), `reconcile` (resume / complete-tail / none — VWH `recovery.py` SHAPE only, no imports),
  `serializeJournal`/`parseJournal`, plus a thin operator CLI (`node harness/lib/run-journal.mjs reconcile
  <journalPath>` — the only fs-touching path, behind a `pathToFileURL` direct-invocation guard). The wave's
  shared run-state substrate (Step 5 watcher polls it; Step 7 accrues into it).
- `plugins/nexus/skills/mine-verify-cover/tools/kickoff-preflight.mjs` — (Step 6) the SHIPPED two-tier
  blocking preflight `preflight(config)` → `{pass, refusals:[{check, reason}], checks}` + exported
  `ORACLE_CONSUMING_MEMBERS`. Universal tier (tool preflight / expected survival rate / stop-budget /
  run-report location) blocks all members; member-conditional tier (registry freshness for
  mine-design/mine-algorithm; mined-test-root disclosure for Cover-arm runs) carries `applicable` on every
  check so the skipped path is reachable-and-skipped-by-class, never vacuously absent. Zero imports.
- `tests/unit/kickoff-preflight.test.mjs` — (Step 6, TDD) (a) missing universal → refusal with named
  reason (each of the 4 individually blocking), (b) oracle member missing registry → refusal
  (applicable:true), (c) non-oracle member → registry check REACHABLE + applicable:false (vacuous-negative
  trap avoided) + not blocked, plus the Cover-arm mined-test-root conditional. 7 tests.
- `harness/lib/stage-watcher.mjs` — (Step 5) the mechanized stage/skeptic firing watcher. Pure decision
  `pollJournal(journal, {now, stallMs, skepticStage})` → advance / fire-skeptic / none (binding state source
  = the Step-4 journal), `formatFiring` (loggable line), + `runWatcher` loop (Windows-compatible
  `setInterval`, no cron) behind a `pathToFileURL` CLI guard (`node harness/lib/stage-watcher.mjs watch
  <journalPath> [stallMin]` — operator-owed live arm).
- `tests/unit/stage-watcher.test.mjs` — (Step 5, TDD, sim-level over fixture Step-4 journal state) a
  stalled stage → advance (no operator input); a stalled skeptic stage → fire-skeptic; within-interval →
  none; completed run → never fired; each firing logs a stage-named line. 6 tests.
- `tests/unit/runway-forecast.test.mjs` — (Step 7, TDD, sim-level) a low budget emits
  `forecast: over-budget at stage N` while spent is still under budget (BEFORE the overrun); a comfortable
  budget emits no line; the crossing stage is the first remaining stage whose projected cumulative exceeds
  budget; no completed stages / all-done → no forecast. 5 tests.
- `tests/unit/run-journal.test.mjs` — (Step 4, TDD) build + stage transitions + reconcile fixtures:
  killed-mid-run → resume from the dangling stage (reset running→pending); all-done-unfinalized →
  complete-tail; completed → none; **double-reconcile is a no-op** (idempotency, both resume + complete-tail
  cases, `deepEqual` no state drift); serialize/parse round trip. 9 tests.

## Files Modified
- `harness/lib/cover-gates.mjs` — (Step 1) converted from the 248-line canonical file to a DEV-REPO
  RE-EXPORT SHIM: re-exports the 7 gates from the shipped file, keeps ONLY the dev-only
  `EXPECTED_SURVIVOR_LINES = [17,133,268]`. One canonical copy, zero test churn (existing importers
  `cover-gates.test.mjs`, `workflow-contract.test.mjs` stay green unmodified).
- `harness/cover.workflow.js`, `harness/loop.workflow.js`, `harness/spec-cover.workflow.js`,
  `harness/spec-cover-calc.workflow.js` — (Step 1 sweep) SOURCE OF TRUTH comment lines re-pointed to the
  shipped path (`plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs`), noting the dev shim. The
  inlined VERBATIM gate-helper copies themselves are UNCHANGED (kept-in-sync pattern preserved — Scope
  DO-NOT-TOUCH).
- `harness/README.md` — (Step 1 sweep) lines 23/26/35: `lib/cover-gates.mjs` row re-described as a shim of
  the shipped canonical; test list adds `cover-gates-shipped.test.mjs`; orchestrator gate-source line notes
  the shipped battery is re-exported through the shim.
- **(Step 7) `harness/lib/run-journal.mjs`** — added `forecastRunway(journal, {budget})`: the marginal-budget
  rail's forward projection over the journal's per-stage token accrual (already recorded by Step 4's
  `completeStage`), emitting the binding `forecast: over-budget at stage N` line before the overrun. Report-on-halt
  (reactive halt) untouched — the 10 drivers' rail logic is NOT modified, so existing rail tests stay green.
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — (Step 7) §Marginal-budget rail
  gains a **Runway forecast (F7 S5)** bullet (spent + projected-remaining vs budget → forecast line before
  the overrun; report-on-halt unchanged).
- **(Step 2) All 9 drivers parameterized** — `harness/cover-cpp.workflow.js` (runsDir),
  `cover-flutter.workflow.js` (runsDir), `cover-php.workflow.js` (runsDir), `cover.workflow.js` (sr,
  runsDir), `loop-flutter.workflow.js` (mineVerifyScript, coverFlutterScript, runsDir),
  `loop.workflow.js` (sr, runsDir, mineVerifyScript, coverScript), `merge.workflow.js` (sr, nexus,
  runsDir), `spec-cover-calc.workflow.js` (sr, nexus, runsDir), `spec-cover.workflow.js` (kg, runsDir).
  Every one of the 20 bare `const NAME = 'D:...'` literals converted to `_args.{camelName} ?? '<same
  default>'` (the established precedent, `mine-verify.workflow.js:50` / `cover-cpp.workflow.js:182`).
  Dev-repo defaults preserved (drivers are dev-repo templates, not shipped — critic HIGH-2 boundary).
  `${SR}`/`${NEXUS}` interpolations resolve transitively.
- **(Step 3) evidence-gate wiring at the three chokepoints:**
  - `harness/mine-verify.workflow.js` — inlined the predicate (SOURCE OF TRUTH comment) and added the
    **LIVE** post-parse gate: a CONFIRMED verdict whose evidence is empty/echo/no-reexec is DROPPED (its
    evidence is not carried onto the rule → no bogus `- verify:` excerpt), logged, and surfaced in a new
    `evidenceGateDropped` return field. The `minLength:1` schema stays. Toy `'ok'` fixtures drop harmlessly
    (no test asserts them); `'…returns 0…'` passes via the output marker (Slice 3b stays green).
  - `harness/lib/kb-write.mjs` — co-located exported `structuralEvidenceOk` + `gateRuleEvidence(rules)`
    (strips echo/empty/no-reexec evidence before serialization, non-destructive otherwise). Existing
    `buildVerifyExcerpt`/`buildRulesSection` UNCHANGED (their pinned sub-bullet contract + the loop inlines
    are untouched — zero re-sync churn).
  - `harness/lib/rules-registry.mjs` — co-located exported `structuralEvidenceOk` + `gateRegistryEvidence(rows)`
    (SURFACES rows whose `evidencePair.codeAttestation` fails; never mutates a row — the registry's
    deprecate-never-delete/idempotent invariant forbids it). `updateRegistry` byte-identical → the
    merge.workflow.js inline needs no re-sync.
  - `harness/loop.workflow.js` — (fix round 1) inlined the predicate + gated the MONOLITH mine→verify path's
    evidence carry (was ungated at :439-442, reviewer MEDIUM). Now in lockstep with the other 4 copies.
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — (Step 6) `## Kickoff checklist
  (new-target runs, B4)` (**heading preserved** — 7 external pointer sites) rewritten into the two-tier
  blocking preflight (Universal + Member-conditional), refuse-with-named-reason semantics, the
  `tools/kickoff-preflight.mjs` enforcement pairing, and the prose-only residue disclosure. The
  `**Wired-but-advisory:**` label is SUPERSEDED via a note (grep-verified: the phrase survives only in the
  note). (Step 5) net-new section `## Stage-completion discipline + mechanized firing` (grep-verified no prior consumer): the canonical
  "poll, don't wait" completion discipline (moved here) + the F7 S2 mechanized watcher capability, with the
  dev-repo-machinery disclosure.
- `plugins/nexus/skills/mine-verify-repo/SKILL.md` — (Step 5) the canonical "poll, don't wait" paragraph
  (:115-122) REPLACED by a pointer to the new §Stage-completion section + disclosure line (cross-skill
  citation form `../mine-verify-cover/references/mine-family-core.md`, matching the file's other pointers).
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — (Step 5) the single "poll, don't wait" mirror
  (:107-110) REPLACED by the same pointer.
- `plugins/nexus/skills/mine-verify-cover/references/mine-family-core.md` — (Step 4) `## Marginal-budget
  rail + report-on-halt` (**heading text preserved** — 7 external pointer sites) gains a **supersede note**:
  the old "a run killed today cannot be resumed tomorrow, so resume immediately or write the loss off"
  sentence is quoted inside the note and the live rail now points at the run journal for cross-session
  reconcile. Grep-verified: the superseded sentence survives ONLY inside the note (in `plugins/`). (Step 3)
  §Registry invariants gains the "Evidence gate on write (F7 S1.3)" instruction (heading preserved) — run
  the shipped predicate wherever a row/`- verify:` is written; code enforcement at the harness chokepoints,
  prose-only residual disclosed. (Step 1) net-new section
  `## Shipped gate battery — invoke in place (ADR-62)`: the base-dir announcement recipe (with the
  Windows `file://` import caveat), the ADR-5 hash-stamped vendored fallback (documented, never default),
  and the disclosed MEDIUM stability of the announcement (one-file fix locus).

## Key Decisions
- **Shim import specifier** = `../../plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs` (dev-repo
  relative, harness/lib → repo root → plugin). Dev-repo-only; the shipped file itself has zero imports.
- **Doc recipe uses `pathToFileURL`** — surfaced by accept #1: `import()` of a bare `D:\...` absolute path
  throws `ERR_UNSUPPORTED_ESM_URL_SCHEME` on Windows; the recipe and the fixture both go through a
  `file://` URL. Baked into the shipped recipe so consumers don't re-discover it.
- **(Step 3) Feasibility confirmation (spec-mandated, recorded here):** a code-only heuristic for the
  claim-echo case IS feasible in the MECHANICAL sense — identity + word-boundary containment with no
  re-execution markers. A full SEMANTIC paraphrase-echo (reworded claim + a fabricated line ref) is NOT
  reliably code-detectable; that residual is prompt-tier (the skeptic prompt + the mine-family-core
  instruction), disclosed, not claimed by the code. The code predicate enforces: empty → reject; claim-echo
  (mechanical) → reject; no-reexecution-content (no line-ref AND no quoted/output artifact) → reject.
- **(Step 3) Non-destructive lib wiring (design rationale):** the LIVE "drops the verdict" enforcement runs
  at `mine-verify` (evidence never reaches the registry/KB once dropped). `rules-registry.mjs` and
  `kb-write.mjs` have BINDING invariants that forbid mutating persisted output — the registry is
  deprecate-never-delete/idempotent (its tests round-trip `codeAttestation` verbatim), and `buildVerifyExcerpt`'s
  sub-bullet contract is pinned by F6 fixtures using informal prose that the strict gate would reject. So at
  those two named chokepoints the predicate is **co-located + exported + paired** (a `gateXxx` helper the
  orchestrator can call) rather than retrofitted destructively into the pinned serializers. Both libs stay
  import-free (they are inlined verbatim into merge/loop workflows), so the predicate is COPIED with a
  SOURCE OF TRUTH comment, not imported — the established inlining pattern.
- **Word-boundary echo hardening** — the mechanical claim-echo containment check pads with spaces
  (`' '+hay+' '`.includes(`' '+needle+' '`)) so a stray 1-char fragment (e.g. `'y'` inside "says") does not
  false-match as an echo; it correctly falls to `no-reexecution-content`. Applied to all four copies (shipped
  + the three inlines) in lockstep.
- **Comment generalization beyond the grep gate** — the grep gate (#3) only forbids
  `BugRatioAnalyzer|EXPECTED_SURVIVOR|17, 133, 268`, but I also neutralized `Fokus.Domain/**` and the
  CycleTime/BugRatio live-incident anecdote in the shipped comments (kept the lesson, dropped the class
  names) so the shipped artifact reads as genuinely target-agnostic.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | tdd | Plan Skill Mapping: Skill (none), TDD yes. `tdd` invoked; red-green on the shipped-artifact target-agnostic invariant. No pattern skill (logged gap: harness/Workflow tooling authoring). |
| 2 | None | Plan Skill Mapping: Skill (none), TDD **no** (wiring — bare-literal → `_args` parameterization; acceptance is the grep + `node --check`, same gap as Step 1). |
| 3 | tdd | Plan Skill Mapping: Skill (none), TDD yes. `tdd` invoked; red-green on the ADR-60 must-fail predicate fixtures + the two lib gate helpers. No pattern skill (same gap as Step 1). |
| 4 | tdd | Plan Skill Mapping: Skill (none), TDD yes. `tdd` invoked; red (module absent) → green on reconcile fixtures + idempotency. No pattern skill (same gap). |
| 5 | tdd | Plan Skill Mapping: Skill (none), TDD yes. `tdd` invoked; red → green on the sim-over-fixture-journal watcher decisions. No pattern skill (same gap). |
| 6 | tdd | Plan Skill Mapping: Skill (none), TDD yes. `tdd` invoked; red → green on the two-tier refusal + vacuous-negative-trap (c) fixtures. No pattern skill (same gap). |
| 7 | tdd | Plan Skill Mapping: Skill (none), TDD yes. `tdd` invoked; red → green on the low-budget forecast-before-overrun sim. No pattern skill (same gap). |
| 8 | None | Plan Skill Mapping: Skill (none), TDD **no** (scoring run using the existing tested `recall-score.mjs`; no new behavior to TDD — the scorer is already unit-tested). |
| 9 | evaluate-skill | Plan Skill Mapping: `evaluate-skill` (Follow), TDD no. Invoked; Layer-0 lint run directly on both skills (OK), judgment layers applied, findings doc written with **ACCEPT** verdict. Pointer sweep = the per-step grep gates + the consolidated sweep (14 heading-pointer sites resolve, no stale cover-gates SOURCE OF TRUTH, superseded sentences confined to notes). |

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Plan Decisions-row "mirrors F8's mine-semantic-model/tools/ precedent" does not verify on disk | low | reviewer | `find plugins -type d -name tools` → 0 hits before this wave; no `tools/` dir exists under any plugin skill | Step 1's target path stands on its PRIMARY rationale (family-core already lives in mine-verify-cover). The precedent clause is aspirational, not load-bearing. Flagged per Phase-1 carry instruction. |
| `${CLAUDE_SKILL_DIR}` probe inconclusive in-pipeline | low | reviewer/operator | `echo $CLAUDE_SKILL_DIR` → `<unset>` in the developer bash context | ADR-62 does not depend on the answer (the recipe pins the "Base directory for this skill:" announcement, not the env var). OPERATOR-owed if a definitive probe is wanted. Pre-authorized `Deviated (valid reason)`. |
| harness/README.md still self-describes as "Increment 2 ... graduates ... at Increment 4" | low | reviewer | README:5-8 narrative | The gate battery has NOW partially graduated (S1.1). Left the increment narrative intact (out of Step-1 scope — the sweep touches pointer lines only); noting for a future harness-README refresh. |
| Step-10 bump: foreign F10 files in the working tree | high | architect/team lead | `git status`: `docs/architecture/README.md`, `docs/backlog.md`, `docs/proposals/skill-gap-miner-2026-07.md`, `docs/specs/F10-SkillGapMiner/` are modified/untracked by a CONCURRENT F10 session — NOT mine | Per CLAUDE.md's multi-agent bump warning: when the team lead runs `bump-plugin.mjs` at Step 10, check the dry-run reasons against F7 files ONLY. F7's plugin surface = `plugins/nexus/skills/mine-verify-cover/**` (SKILL.md, references/mine-family-core.md, new tools/) + `plugins/nexus/skills/mine-verify-repo/SKILL.md`. The F10 files must not contaminate the F7 bump/CHANGELOG bullets. |
| Only `plugins/**` changes trigger a bump; harness/ + tests/ + docs/ do not | medium | team lead | The shipped surface I changed is under `plugins/nexus/skills/mine-verify-{cover,repo}/` | The plan calls a **MINOR** bump (new capability: shipped enforcement runtime — the tools/ dir + the mine-family-core mechanisms). harness/, tests/, and docs/specs/ changes are dev-repo-only (no bump), consistent with the harness README's "ships nothing" note. |
| Judge substance-match (S6) is a developer semantic judgment | medium | reviewer | s6 report §Disclosures | The recall 3/3 rests on my GOLD↔BR pairings (GOLD-16↔BR-1, GOLD-17↔BR-5, GOLD-18↔BR-21 cluster). A reviewer wanting an independent check can re-run the pairing (`recall-score.mjs --pair`) and re-judge; the mined+golden sources are cited by path. |

## Deviations from Plan
- **(Step 3, fix round 1) "Drops the verdict" is scoped to the evidence CARRY, not the verdict tally
  (observability).** The plan says a failing verdict "drops the verdict". Implemented as: the failing
  verdict's EVIDENCE is not carried onto the rule (so no un-re-executed `- verify:` excerpt reaches the KB),
  and the drop is logged + surfaced via a new `evidenceGateDropped: [{id, reason}]` return field. The
  verdict's CONFIRMED/WRONG tally is left intact (touching it would break existing contract-test assertions
  and conflate the skeptic's classification with the evidence-quality gate). This is the observable,
  non-breaking realization of "drop" — disclosed in the code comment at both gate sites and here.
- **(Step 8) Report location = `delivery/` not the `.runs/` "harness runs area"** — the plan names "the
  harness runs area" but `harness/.runs/` is **git-ignored** (`.gitignore:30`), so a COMMITTED report cannot
  live there. Put it in the git-tracked `delivery/` folder (`s6-bugratio-recall-report.md`) — the plan
  grants "exact path = developer's call" and requires the report be committed, which delivery/ satisfies.
- **(Step 8) Judge performed by the developer** (pre-authorized) — the substance-match was an
  orchestrator-side semantic judgment I performed over the deterministic pairing packet (GOLD-16↔BR-1,
  GOLD-17↔BR-5, GOLD-18↔BR-21), attributed + disclosed in the report. Scored via the tested
  `recall-score.mjs` (`computeRecall` over my verdict map) run in a scratchpad script OUTSIDE the repo so no
  golden/mined rule text touches the git tree.
- **(Step 5) Live Workflow missed-completion exercise is operator-owed** — proven at SIM level (`pollJournal`
  over fixture Step-4 journal state advances a stalled stage / fires the cadence skeptic without operator
  input; the sim exercises exactly what the live watcher reads). The PASS does NOT prove a live Workflow
  run whose stage actually stalls and is advanced by the running watcher loop. `Deviated (valid reason)`,
  pre-authorized (a developer subagent has no Workflow tool). **OPERATOR ACTION REQUIRED:** launch a real
  Workflow run, start `node harness/lib/stage-watcher.mjs watch <journalPath>`, induce a stall, and confirm
  the watcher logs the firing and advances the stage.
- **(Step 4) Live cross-session kill/resume exercise is operator-owed** — proven at UNIT level (reconcile
  fixtures + double-reconcile idempotency) AND at CLI level (a fixture journal reconciled via
  `node harness/lib/run-journal.mjs reconcile <path>`, dangling stage reset to pending, resume plan emitted,
  double-reconcile confirmed a no-op). The PASS does NOT yet prove a real two-session Workflow kill→new
  session→reconcile→resume. `Deviated (valid reason)`, pre-authorized (needs Workflow + two sessions — a
  developer subagent has neither). **OPERATOR ACTION REQUIRED:** kill a live Workflow mid-run, open a new
  session, run `node harness/lib/run-journal.mjs reconcile <journalPath>`, and relaunch from the reported
  stage to prove the end-to-end recovery.
- **`${CLAUDE_SKILL_DIR}` probe** — unprobeable in-pipeline (env var unset). Marked operator-owed per the
  Step-1 clause "if unprobeable in-pipeline, mark operator-owed — ADR-62 does not depend on the answer".
  `Deviated (valid reason)`, pre-authorized. **OPERATOR ACTION (optional):** if a definitive answer is
  wanted, run a mine-verify-cover skill load and read the announced base dir / any `CLAUDE_SKILL_DIR` in
  that context — not required for correctness.

## Fix Round 1 — reviewer follow-ups (cycle 1/3)

Reviewer APPROVED (no CRITICAL/HIGH); these are the recorded non-blocking follow-ups, all addressed.

- **MEDIUM — S1.3 bypassable on the dormant monolith-fallback path.** `harness/loop.workflow.js` has an
  inlined MONOLITH mine→verify path (runs only when `MONOLITH_FALLBACK=true`, currently `false`) that at
  :439-442 carried verdict evidence onto rules UNGATED — the delegated path (mine-verify.workflow.js) was
  gated, the fallback was not. **Fix:** inlined the evidence-gate predicate into loop.workflow.js (new
  `INLINED EVIDENCE GATE` block, SOURCE OF TRUTH comment) and added the SAME post-parse gate + evidence-carry
  gating + `evidenceGateDropped` return as the delegated path. Now **5 predicate copies in lockstep**
  (shipped canonical + inlines in mine-verify.workflow.js, loop.workflow.js, kb-write.mjs, rules-registry.mjs)
  — verified all 5 carry the identical reexec regex + word-boundary echo hardening.
- **LOW — kickoff-preflight `confirmed(0)`/`confirmed(NaN)` passed.** `tools/kickoff-preflight.mjs`
  `confirmed()` tightened to reject a numeric `0` (a 0 stop-budget halts immediately — not a meaningful
  ceiling) and `NaN` (e.g. a bad `Number('abc')` parse — never a valid declaration). Added 3 exact-boundary
  tests (0 → refused, NaN → refused, 1 → confirmed).
- **LOW — stage-watcher CLI non-numeric stallMinutes → silent NaN.** `harness/lib/stage-watcher.mjs` CLI now
  validates `stallMinutes` is a positive finite number and exits `2` with a named error otherwise (a NaN
  threshold made `sinceMs > NaN` always false → the watcher would silently never fire). Added a subprocess
  test asserting exit 2 on `abc`.
- **LOW — "drops the verdict" observability.** Disclosed below in Deviations (the gate targets the evidence
  CARRY onto the rule, leaves the verdict tally intact, and surfaces `evidenceGateDropped`).
- **LOW (doc gap) — Step-1 accept #1 sim evidence.** Pasted below.

**Step-1 accept #1 evidence (consuming-repo simulation, re-run green from OUTSIDE the repo):**
```
$ cd <scratchpad outside repo> && node ./consume-cover-gates.mjs
BATTERY GREEN from outside the repo — all 7 gates pass; scorePct=80%, expectedSurvivorsExcluded=0
```
Fixture imports the shipped `plugins/nexus/skills/mine-verify-cover/tools/cover-gates.mjs` by absolute path
(via `pathToFileURL`), runs all 7 gates green against a NON-pilot consumer class, and asserts
`EXPECTED_SURVIVOR_LINES === undefined` (no pilot default ships). Grep #2 (repo path) and grep #3
(BugRatioAnalyzer/EXPECTED_SURVIVOR/17,133,268) both → 0 hits.

## Verification summary
- Full CI glob (`node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`): **587 pass, 0 fail** (post
  fix-round 1; was 583 pre-round + 4 new boundary/guard tests).
- `node --check` on all touched drivers + new libs + shipped tools: clean.
- Step accept criteria met per step (greps, adversarial must-fail fixtures, sim/unit runs, ACCEPT verdict).
- Operator-owed live arms (S2 watcher, S3 kill/resume, `${CLAUDE_SKILL_DIR}` probe) documented above,
  pre-authorized `Deviated (valid reason)` — each states what the developer PASS does not yet prove.
- Steps I own (1–9) complete. **Step 10 (release-plugin MINOR bump + omni sync) is the team lead's**
  close-out — heed the Carry-Over row on the concurrent F10 files contaminating the bump classification.

*Status: COMPLETE (fix round 1 applied — 5/5 reviewer follow-ups addressed, ready for re-review) — developer, 2026-07-18*
