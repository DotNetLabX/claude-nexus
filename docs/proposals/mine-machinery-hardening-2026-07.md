# Proposal — Mine-family machinery hardening: close the five enforcement gaps

**Status:** Ratified (2026-07-16, Laurentiu Dumitrescu — covers R1/R2/R3/R5 plus the R4 *spike*; R4's
build is gated on the spike verdict)
**Decision-maker:** Laurentiu Dumitrescu
**Recommendation:** Land R1/R2/R3/R5 now (understood, small, no open questions — R1's gating
assumption is verified by the recorded 2026-06-23 resume, see Need §2); spike R4's delivery
question before committing to it.
**Confidence:** High — the one remaining unconfirmed assumption (R4: can ADR-5's read-index carry an
executable, given platform constraint #2?) is not load-bearing for this recommendation, which routes
R4 to a spike per ADR-28's research-first branch. R1's assumption was resolved 2026-07-16 against the
2026-06-23 run-eval record (resume replayed these exact workflows); the residual — a hard
mid-iteration kill — is tool-documented and verified opportunistically, not a gate.
**Impact:** 7
**Effort:** med
**Date:** 2026-07-15

## Need

The machinery evaluation ([`docs/research/2026-07-15-mine-family-vs-vwh-machinery.md`](../research/2026-07-15-mine-family-vs-vwh-machinery.md))
scored the mine family against VWH on enforcement tier and found five gaps that are **not philosophical
tradeoffs** — they are organs that were designed, planned, or already built, and then not wired up:

1. **The gate battery does not ship.** `harness/lib/cover-gates.mjs` (`suiteGreen`, `noFlaky`,
   `mutationFloor`, `targetMutated`, `noNewSkips`, `charPin`, `mutationRatchet`) is pure, unit-tested
   tier-(a) code. `harness/README.md`: *"ships nothing to users."* Worse, the workflows are unshippable
   as written — `cover.workflow.js:263` hardcodes `RUNS_DIR = 'D:\src\claude-plugins\nexus\harness\.runs'`,
   as do 8 of the other 9 drivers (all but Increment-1's `mine-verify.workflow.js`). A consuming project re-derives the gate logic from SKILL.md prose,
   unverified, every run. **This was Increment 4's own plan** (*"consuming projects receive them via the
   read-index copy pattern (ADR-5)"*) and it is the one step that did not land.
2. **Resume exists and nothing durable invokes it.** The Workflow tool supplies `journal.jsonl` +
   `resumeFromRunId`, and the harness has been meticulously kept compatible (*"no Date/Math.random —
   pure string op, resume-safe"* across every workflow file). It was invoked exactly once — the
   2026-06-23 ReviewInvitation run-eval resumed past a fixed budget gate, replaying the cached
   Mine→Verify (~193k tokens saved) and running Cover live — and then forgotten: no runbook or
   workflow references it, and the 07-15 machinery evaluation initially concluded it had *never* been
   used. A killed run — this has happened, at ~540–787k tokens for a C++ class — restarts from
   iteration 1 unless the operator happens to remember the mechanism from session memory.
3. **The skeptic's evidence dies in the schema.** `BATCH_VERDICT_SCHEMA.required = ['id','verdict','evidence']`
   forces a non-empty *string* to exist; the string never reaches the durable registry.
   `mine-family-core.md` describes this in tier-(a) language (*"the orchestrator **drops** any verdict
   without one"*) — it drops verdicts missing a string, not verdicts missing evidence.
4. **The capability contract is unchecked.** 5 capabilities × 4 adapters (dotnet, cpp, php, flutter) =
   20 promised fills, none verified. This has already bitten: `mine-verify-flows`' sabotage gate *"had
   no named executor until an eval fixed it — both the method and the Flutter adapter separately named
   a capability with no mechanics — same failure class, twice."*
5. **The shipped text overstates its own tier.** `mine-verify-cover/SKILL.md` describes "clean-room
   miners" in confident, load-bearing prose. The admission that this is prompt-only and structurally
   unenforceable for background subagents lives in `harness/` dev notes and ADR-13 — artifacts a
   consuming agent never loads.

**Out of scope.** (a) Making clean-room mechanical — that is blocked upstream (`agent()` exposes no
`disallowedTools`; ADR-13: a PreToolUse `deny` is not honored for background subagents) and is already
tracked as a spike in `mine-family-next-wave-2026-07.md` line 282. (b) Building VWH-shaped organs the
family's one-shot topology does not need — attribution, confound gates, hypothesis DAG, variance
discipline, calibration. The evaluation is explicit that these are absences by fit, not by oversight.
(c) Any change to the prose siblings' tier: giving `mine-verify-repo`/`design`/`algorithm`/
`reference-model`/`flows` real harnesses is a much larger question this proposal does not open.

## Approach

Five changes, sequenced by *gap closed ÷ work required*, not by value.

**R1 — Wire up the resume you already built and used once.** *(Effort: near-zero. SM 6→7 — 8 would
additionally need cross-session durability, Unresolved #3.)*
Add `resumeFromRunId` to the Cover runbook: capture the `runId` a run returns, and on a kill/hang
relaunch with `Workflow({scriptPath, resumeFromRunId})` rather than from scratch. No new module — the
organ is tool-supplied, the harness is already resume-safe, and the mechanism is proven on these exact
workflows (2026-06-23: halt → fix → resume). Ships as a `mine-family-core.md` runbook line plus a
`harness/README.md` note. The 06-23 episode is the proof-of-need: the capability was used, lived in no
artifact, and was reported "never invoked" three weeks later. Residual (non-gating): a hard
*mid-iteration kill* is unexercised — the tool contract documents kill-resume explicitly; verify on the
next killed run.

**R2 — Persist the verify evidence into the registry row.** *(Effort: low. Auditability, not verification.)*
The row already carries citations and line ranges (code arm) or verbatim quotes (spec arm). Add the
skeptic's re-execution excerpt beside them, written by the KB writer that already builds the row.
**One excerpt per row — not transcripts.** Raw dumps stay in the gitignored `harness/.runs/`; a
consuming repo receives the row, not the run. This also aligns the arm with the family's own shipped
standard: `mine-family-core.md` §Skeptic protocol already mandates excerpt-carrying verdict rows — and
its scoping note exempts the cover code-arm (*"not a consumer of this section"*). Extend the row
obligation to the cover arm's registry and tighten that scoping note in the same change.

**R3 — A `selfcheck` analog for the capability contract.** *(Effort: low.)*
A dev-repo script, in the shape of VWH's `selfcheck.py` (which cross-checks `FLAVORS.md`'s registry
rows against the flavor homes on disk): read `mine-family-core.md`'s 8-member table and
`mine-verify-cover`'s 5-capability contract, assert every adapter on disk fills every capability with a
*named executor*, and fail on drift — reading across all four stack plugins
(`nexus-dotnet`/`-php`/`-cpp`/`-flutter`). Home: extend the existing `scripts/selfcheck.mjs` (the
established CI-mirror for mechanical wiring checks) plus the CI tier alongside `plugin-release-check` —
resolves Unresolved #5.

**R4 — Ship the gates.** *(Effort: med — the only item with real design work. ET 6→8.)*
Deliver `cover-gates.mjs` to consuming projects so a run *executes* the gate instead of re-authoring
it. Two sub-problems, and the second is the actual work: (a) de-hardcode `RUNS_DIR` and the other
dev-repo absolutes — mechanical; (b) choose the delivery vehicle. Three candidates: ADR-5's read-index
(named by the original plan — but it is today a *conventions* pattern: the plugin ships markdown, the
project places it, agents read an index); the ADR-52 script-synced-copy precedent (a script already
syncs KB copies into consumer repos — closer prior art for carrying a file a workflow needs); or the
zero-machinery option — ship the gate source as a verbatim code block in the skill's reference file, so
the orchestrator's authored-from-spec workflow *transcribes* the gates instead of re-deriving them from
prose (cheapest; not full tier-(a) — a transcription can still drift). Platform constraint #2 blocks
the obvious shortcut of referencing `${CLAUDE_PLUGIN_ROOT}` from skill markdown. **Spike (b) before
committing** — see Unresolved.

**R5 — Disclose the tier in the shipped text.** *(Effort: trivial.)*
One sentence in `mine-verify-cover/SKILL.md` stating that clean-room is prompt-enforced and the
mechanical seal is pending. Land it in whatever patch next touches the file; it does not deserve its
own cycle.

## Benefits

- **R1** returns the arm's most expensive failure — a killed mid-loop run at 400k–787k tokens — from
  write-off to recoverable *when the session survives the kill* (the same-session cap, Unresolved #3,
  stands), for approximately the cost of writing it down.
- **R2** makes a verdict *challengeable by a later reader* without re-running the whole mine. Today,
  reconstructing why a rule was CONFIRMED means re-doing the mine; after, it means reading the row.
- **R3** converts a failure class that cost a human eval to find into a script that catches it at
  authoring time, permanently, across all four adapters and every future one.
- **R4** is the one change that makes the *shipped* skill and the *proven* harness the same program.
  Today every proven run used a driver that cannot leave this repo; the artifact users receive has a
  weaker enforcement tier than the artifact that was validated.
- **R5** closes the gap between what the skill implies and what it guarantees, at the point of use.
- **Together** they move the Cover arm's machinery mean 7.0 → ~7.6 on the evaluation's own scale
  (SM +1 from R1, ET +2 from R4, XS +2 from R3 closing the unchecked-seam gap — stated so the
  arithmetic is checkable) — most of the way to VWH's 7.8 — without adopting any VWH machinery the
  family's topology does not want.

## Alternatives

**Do nothing; the family is proven.** Genuinely defensible, and the strongest counter-argument on this
page. The 2026-07-12 job-lens eval scored `mine-verify-cover` above VWH on delivered outcomes (7.3 vs
6.3) *with* every gap above already present. The family converts weak machinery into real results at a
rate VWH has not matched — 4 stacks, 6 repos — so the gaps demonstrably are not fatal. **Rejected
because** R1/R2/R3/R5 are individually cheap enough that "it works anyway" is not a reason to decline
them, and because R4's gap means the validated artifact and the shipped artifact are different programs
— which the outcome evidence does not cover, since every proven run used the driver.

**Adopt VWH as the substrate instead.** Considered and rejected once already, on the record
(`br-coverage-vwh-evaluation.md`; *"VWH ruled out as host. Substrate decided: standalone nexus skill +
Workflow"*). Nothing in the machinery evaluation reopens it: VWH's advantages are concentrated in
organs the mine family's one-shot topology does not need, and its own notes admit the ML-shaped layer
misfires on non-ML flavors. Adopting the engine to get the firewall would be buying a search loop to
obtain a file-read guard.

**Port VWH's journal/recovery/lock trio.** This was the first cut's recommendation and it was **wrong**
— the organ already exists at the tool layer (see R1, and the evaluation's §7 correction log). Recorded
here because the error is instructive: a census that reads the harness will not find organs supplied by
the tool contract the harness runs on.

**Make clean-room mechanical first.** The most valuable fix in principle and the reason the family's ET
is capped. Not proposed because it is blocked upstream (ADR-13; `agent()` has no `disallowedTools`) and
already tracked as a spike elsewhere. R5 is the honest interim: disclose the ceiling rather than imply
it isn't there.

**Give the prose siblings real harnesses.** Would lift five members from ET 2 to ~6 — the single
largest scoring gap in the evaluation. Deliberately deferred: it is five workflows' worth of work, it
inherits R4's unresolved delivery question, and it should not be decided before R4's spike reports.

## Unresolved

1. **Does `resumeFromRunId` actually replay a killed Cover run?** — **Answered 2026-07-16:
   substantially yes.** The 2026-06-23 run-eval resumed these exact workflows (halt on the budget-gate
   misfire → fix → cached Mine→Verify replayed, ~193k saved, Cover ran live to all-gates-green).
   Residual: a hard *mid-iteration kill* is unexercised — the tool contract documents kill-resume
   explicitly. Verify opportunistically on the next killed run; no longer gates R1.
2. **Can ADR-5's read-index carry an executable?** It is specified for conventions markdown. Extending
   it to a `.mjs` a workflow requires may need an ADR amendment or a different vehicle entirely
   (candidates in R4: ADR-5 extension, ADR-52-style script sync, verbatim-block transcription). R4
   should not start before this is answered.
3. **Same-session-only resume — is that enough?** If a killed run must be resumable *tomorrow*, the
   tool's journal does not reach that far and a durable checkpoint becomes a real (larger) item.
4. **Does R2 change the tier at all, or only the audit trail?** Stated position: audit trail only — a
   persisted string is still a model-produced string. If the ratifier wants the *tier* raised, that
   needs the orchestrator to capture runner output directly rather than accept an agent's excerpt,
   which is a different and larger change.
5. **Who owns the `selfcheck` script's home** — `scripts/` beside `bump-plugin.mjs`, or `harness/`?
   — **Answered 2026-07-16:** `scripts/selfcheck.mjs` already exists as the CI-mirroring home for
   exactly this class of mechanical wiring check — extend it as the local mirror; the CI-gated
   assertion lives in `tests/unit/` (critic correction, same day: CI runs the test glob, not
   selfcheck), per R3.

## Graduate-to-spec

Technical proposal → on ratification, promote to a tech-spec with ADRs extracted (ADR-28). Two ADR
candidates are already visible: **the deterministic-helper delivery decision** (R4 — whichever vehicle
wins, it is an architectural commitment worth recording, and it amends or extends ADR-5), and
**capability-contract conformance** (R3 — the family now has a checked contract, which is an ADR-shaped
statement about how adapters relate to the method). R1/R2/R5 are plumbing and need no ADR.

**Graduated 2026-07-16:** promoted to `docs/specs/F6-MineMachineryHardening/definition/tech-spec.md`
(backlog row F6); ADR-60 (capability-contract conformance, R3) extracted to the register. R4's
delivery-vehicle ADR is extracted when its spike reports.

## Provenance

Session 2026-07-15, from a lineage investigation that became a machinery evaluation. Fed by:
[`2026-07-15-mine-family-vs-vwh-machinery.md`](../research/2026-07-15-mine-family-vs-vwh-machinery.md)
(this proposal is its §5, made actionable), its two grounded census passes (VWH kernel — 34 modules,
5,448 LOC; mine family — 8 SKILL.md + core + adapter + dev-repo harness), and a post-review targeted
check on ADR-5, resume usage and run-dump persistence that **reversed one of the five recommendations**
(see the evaluation's §7 correction log). Related prior art: `2026-07-12-mine-family-vs-vwh-per-member.md`
(the job lens — deliberately not reconciled against here), `mine-family-next-wave-2026-07.md` (owns the
clean-room seal spike), `vwh-adoptions-2026-06.md` (the 2026-06-12 adoption pass that took the
allocation principle and left the rest).

Revised 2026-07-16 after an independent fresh-eyes re-verification (model change): R1 re-grounded on
the 2026-06-23 run-eval record — the evaluation's "never invoked" claim was retracted (its §7
correction log, 2026-07-16 rows) — Confidence Medium → High with R4 explicitly research-first;
scoring arithmetic restated (7.0 → ~7.6, deltas itemized); R4's vehicle candidates broadened (ADR-52
script-sync precedent, verbatim-block transcription); R2 extended with the `mine-family-core.md`
skeptic-protocol scoping fix; Unresolved #1 and #5 answered in place.
