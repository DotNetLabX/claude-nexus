# F7-MineMachineryBorrowWave2 — ship the enforcement, mechanize the firing, survive the kill

**Status:** Ready — architect (Fable 5), 2026-07-17; code-grounded critic returned GO-with-fixes
same day, all findings folded (2 HIGH, 3 MEDIUM, 3 LOW + 2 gaps — see `## Critic disposition`). Ratified proposal:
`docs/proposals/mine-machinery-borrow-wave-2-2026-07.md` (Laurentiu, 2026-07-17). **Stage 0 gates
S1; S2–S6 are spike-independent and may start in parallel with Stage 0.**
**Target:** `plugins/nexus` (mine-family skills + core reference) + dev-repo `harness/` — one
release-plugin bump at wave close (**MINOR** — new capability: shipped enforcement runtime).
**Binding inputs:** the wave-2 proposal; the fresh evaluation
(`docs/research/2026-07-17-mine-family-vs-vwh-fresh-eval.md` §6 M1–M5);
`2026-07-15-mine-family-vs-vwh-machinery.md` §3.2/§5 (at HEAD); F6's tech-spec (wave 1, R4
deferred); the VWH reference mechanisms (`kernel/monitor.py`, `kernel/recovery.py`,
`kernel/charter.py`, `kernel/conclusion.py`, `dag.py` cost accrual — patterns only, no code
imports).

## Goal

Wave 1 (F6) hardened what was cheap; this wave closes the structural gaps: the tier-(a) gate code
that never reaches consumers (M1), the orchestrator-attention dependency that stranded agents twice
(M2), the same-session resume cap (M3), the advisory kickoff that every incident walked through
(M4), the reactive budget rail (M5), and the unmeasurable recall claim (N1).

## Stage 0 — spike (gates S1 only; shared decision with F8-W1)

- **S0a — clean-room seal test** (the recorded P3 spike, `mine-family-next-wave-2026-07.md:282`):
  does a read-restricted `agentType` actually deny file reads under Workflow? Outcome feeds S1's
  isolation posture (seal vs disclosed prompt-tier) — either outcome is shippable; the spike ends
  the "pending upstream platform support" limbo with a tested fact.
- **S0b — delivery-mechanism decision** for shipped executables. Options to evaluate against the
  live constraints (ADR-5 is a *conventions* read-index; platform constraint #2:
  `${CLAUDE_PLUGIN_ROOT}` never expands inside skill markdown): (a) extend ADR-5's read-index copy
  pattern to carry scripts; (b) kickoff-generated scripts from a shipped skill template (the
  orchestrator writes them at kickoff from verbatim skill-text blocks, hash-stamped); (c) a
  versioned package install step declared by the adapter contract. **One decision for F7-S1 and
  F8-W1** (recorded in both; proposal Unresolved #1).
- Exit: a short spike report in `docs/specs/F7-MineMachineryBorrowWave2/delivery/` + the decision
  as an ADR draft (extracted at ship, ADR-28). **The spike must weigh per-option reversibility**
  (critic gap note): (a) read-index copy and (b) kickoff-generated are light/reversible; (c) a
  versioned package creates a consumer-side dependency whose removal is breaking — closer to a
  one-way door, so it carries the higher justification bar (ADR-25).
- **RESOLVED 2026-07-18 (spike ran 2026-07-17; owner confirmed):** S0a — tool-level restriction is
  mechanical under Workflow but path-scoped denial doesn't exist ⇒ the **disclosed prompt-tier
  seal stands** for S1; one leg (custom agentType registration) completes at S1 kickoff via the
  kept `.claude/agents/spike-sealed-reader.md` fixture. S0b — **option (d), invoke-in-place from
  the version-keyed plugin cache via the skill base-dir announcement; ADR-62** (vendored
  hash-stamped copies only for consumer CI). See `delivery/spike-report.md`.

## S1 — M1: ship the enforcement runtime (gated on S0b)

1. Generalize the dev-repo gate battery (`harness/lib/cover-gates.mjs` — suiteGreen, noFlaky,
   mutationFloor, targetMutated, noNewSkips, charPin, mutationRatchet) into a **named shipped
   artifact** — the consuming-repo battery delivered via the S0b mechanism — with the
   anti-fake-green invariants intact (agent-total vs tool-summary cross-check; full-path target
   match). **The shipped artifact is this new battery; the 9 dev-repo drivers do NOT ship** — they
   remain dev-repo templates (critic HIGH-2 boundary).
2. Parameterize the dev-repo path literals in the 9 RUNS_DIR-pinned drivers
   (`cover-cpp.workflow.js:200`, `cover-flutter.workflow.js:223`, `cover-php.workflow.js:264`,
   `cover.workflow.js:263`, + the remaining loop/loop-flutter/spec-cover/spec-cover-calc/merge
   drivers) — **RUNS_DIR plus the ~15 sibling literals** (HOST_WS, KB_RULES, REPORT_PATH,
   MINE_VERIFY_SCRIPT, NEXUS, …) — config-resolved with dev-repo defaults. This is dev-repo
   template hygiene, so the drivers work as consuming-repo authoring templates; the defaults may
   remain as config values because the drivers are not shipped artifacts.
3. **Registry-write gate, all members:** upgrade the skeptic-evidence check from "non-empty string"
   (`mine-verify.workflow.js:132` already enforces `minLength: 1` post-F6) to a **structural
   excerpt check** rejected in code: evidence that is empty, a claim-echo, or carries no
   re-execution content drops the verdict at write time. The developer defines the exact predicate
   and **must confirm a code-only heuristic is feasible for the claim-echo case before committing
   to it** — fallback if not: the mechanical subset only (line-ref presence + quoted-output
   presence + non-identity with the claim string), with the semantic echo check disclosed as
   prompt-tier (critic gap note). This piece serves the prose siblings too — it runs wherever a
   registry row is written, not only in Cover workflows.

Accept (grep + run): a consuming-repo simulation (temp dir outside this repo) runs the shipped
battery green against a fixture; `grep -r 'D:\\src\\claude-plugins' <the S1.1 shipped artifact>`
= 0 hits — **scoped to the shipped battery only, not the dev-repo drivers** (which legitimately
keep dev-repo defaults); a fixture verdict with claim-echo evidence is rejected (adversarial
must-fail case, ADR-60 pattern); dev-repo unit tests still green.

## S2 — M2: mechanized stage/skeptic firing

Capability-level (mechanism is the developer's): stage dispatch must not depend on the
orchestrating session noticing a completion. A watcher (spawned process, scheduled loop, or
Monitor-based — Windows-compatible, no cron assumption) advances a stalled stage or fires the
cadence skeptic within a bounded interval, and logs each firing. Accept: a simulated
missed-completion run advances without operator input; the single canonical "Poll, don't wait"
statement (`mine-verify-repo/SKILL.md:115-122` — the "23" in its prose is pilot history, not a
line count; critic MEDIUM-1) is replaced by a pointer to this protocol section plus one disclosure
line; the two mine-verify-cover poll mentions get the same pointer treatment.

## S3 — M3: cross-session resume

A run-id journal (per-run file under the runs dir: stage, status, runId, timestamps) + an
idempotent `reconcile` entry path (resume / complete-tail / none — VWH `recovery.py` shape) layered
over the Workflow tool's same-session cache. Accept: kill a live run, open a NEW session, reconcile
resumes with cached stages replayed; double-reconcile is a no-op; the core reference's
"a run killed today cannot be resumed tomorrow" sentence (verbatim-greppable, under the heading
`## Marginal-budget rail + report-on-halt` in `mine-family-core.md` — critic LOW-1) is
superseded — never silently rewritten (supersede note + changelog line).

## S4 — M4: blocking kickoff

The core's kickoff checklist (`mine-family-core.md` heading `## Kickoff checklist (new-target
runs, B4)`, self-labeled "wired-but-advisory") becomes an orchestrator-verified preflight with a
**reconciled, two-tier precondition set** (critic MEDIUM-2 — the prior draft conflated two lists):
- **Universal (the existing core 4, made blocking):** tool preflight · expected survival rate ·
  stop-budget declared · run-report location.
- **Member-conditional (from mine-algorithm's Stage-0 HARD BLOCK, applied only where the member
  consumes that input):** registry existence/freshness — oracle-consuming members only
  (mine-design, mine-algorithm); mined-test-root disclosure — Cover-arm runs only.

A failed precondition refuses the run with a named reason. Pattern precedent: mine-algorithm's
Stage-0 HARD BLOCK (`mine-algorithm/SKILL.md:90`) — closing the 07-12 follow-up #2. Accept: a
fixture kickoff missing a universal precondition refuses with the named reason; an
oracle-consuming fixture missing registry freshness refuses; a non-oracle member does NOT check
registry preconditions (no false blocks); the "wired-but-advisory" self-label is superseded.

## S5 — M5: runway forecast

Accrue realized tokens per completed stage into the run journal (S3's file — **hard ordering:
S3 before S5**, critic LOW-3); the marginal-budget rail gains a forward projection (spent +
projected-remaining vs budget) and reports `forecast: over-budget at stage N` **before** the
overrun instead of halting at it. Report-on-halt semantics unchanged. Accept: a fixture run with a
low budget emits the forecast line before the rail trips.

## S6 — N1: recall golden set (rider)

One golden set for one proven class (owner picks; BugRatio or CycleTime — both have adjudicated
registries): a curated known-rules list, **mined-vs-golden RECALL** computed by the existing
`harness/lib/recall-score.mjs` (which computes recall only — critic HIGH-1; precision against a
curated *subset* is ill-defined, since a mined rule absent from the subset is not necessarily a
false positive). **No precision, no F1 from the golden set.** If a precision-shaped number is
wanted later, its oracle is the skeptic's CONFIRMED/WRONG verdicts, not the golden subset — out of
scope this wave. Recorded as method evidence in the run report; explicitly evidence, not a gate: no
floor, no halt. Accept: one scored run report exists with recall (matched/total + unmatched list)
against the golden set.

## Non-goals (recorded so they aren't re-litigated)

- VWH loop machinery (DAG, variance acceptance, firewall, commit-per-experiment) — the 2026-06-23
  non-adoption table stands.
- Full orchestrator runtimes for the prose siblings beyond the S1.3 registry-write gate — v2
  candidate after S1 proves the delivery mechanism.
- Market items N2/N3/N5 (code-aware segmentation, equivalent-mutant precision scoring, acceptance
  telemetry) — idea inbox, unratified.

## Acceptance summary

**Grep-checkable:** zero hardcoded dev-repo paths in the S1.1 shipped artifact (scoped grep); S2
protocol section present + the canonical poll statement replaced by a pointer + disclosure line;
S3/S4 core supersede notes + changelog lines present (verbatim-sentence greps, real headings); S6
recall report exists. **Run gates (not grep):** S1's consuming-repo simulation + claim-echo
must-fail fixture; S2's missed-completion simulation; S3's cross-session resume exercise; S4's
refused-kickoff fixtures (universal + member-conditional + non-oracle no-false-block); S5's
forecast line. **Judgment:** evaluate-skill ACCEPT on touched skills; omni twin regenerated and
committed per convention — **at wave close, confirm the omni twin's back-port state before
`gen-omni` (auto-memory: an ahead twin can be clobbered by a naive regen; likely omni-flutter-only,
verify anyway — critic open question).**

## Decisions (architect, disclosure per plan-template)

- **M1 v1 scope = Cover gate battery + all-members registry-write gate; prose-sibling full
  runtimes deferred.** The registry-write gate is the prose siblings' highest-value enforcement at
  a fraction of the cost; full runtimes need S0b's mechanism proven first. (Two-way door; rejected:
  all-members runtimes now — unproven delivery mechanism × 5 members is the big-bang shape wave 1
  correctly avoided.)
- **S2 mechanism left at capability level.** Windows/no-cron reality makes the daemon shape a
  build-time decision; the spec pins the acceptance, not the process model. (Two-way door;
  rejected: pinning VWH's pidfile daemon — substrate mismatch.)
- **N1 rides this wave, recall-only** (proposal Unresolved #4 resolved; critic HIGH-1 folded): the
  existing scorer computes recall only, and recall is the one metric a curated golden *subset*
  soundly supports — so N1 is genuinely wiring + curation at recall scope. Precision/F1 would be
  new build work against a different oracle (skeptic verdicts) — out of scope. (Two-way door;
  rejected: precision/F1 this wave — ill-defined against a subset, and no longer "too cheap to
  defer".)
- **S4 precondition set redefined, two-tier** (critic MEDIUM-2 disclosed): the existing core 4
  become the blocking universal tier; mine-algorithm's oracle preconditions join as
  member-conditional. Neither prior list survives alone. (Two-way door; rejected: blocking the
  core 4 verbatim — leaves the truth-fork class unguarded; blocking registry-freshness family-wide
  — false-blocks the non-oracle members.)
- **S2–S6 not gated on Stage 0** — only S1 needs the delivery decision; serializing the whole wave
  behind the spike wastes the cheap stages. (Two-way door; rejected: full-wave gate — F3's shape,
  but F3's Stage 0 was evidence-order, not mechanism-choice.)
- **Stale-claim correction folded in:** the 07-15 machinery doc's "`\"\"` passes the evidence
  schema" is stale — `minLength: 1` exists post-F6 (`mine-verify.workflow.js:132`); S1.3 targets
  the *next* gap (vacuous/echo evidence), not the closed one.

## Critic disposition (2026-07-17, code-grounded, verdict GO-with-fixes — all folded)

| Finding | Disposition |
|---|---|
| HIGH-1 recall-score.mjs computes recall only; precision/F1 ill-defined vs a golden subset | Fixed — S6 rescoped to recall-only; precision's true oracle (skeptic verdicts) named and deferred; Decisions row corrected |
| HIGH-2 "0 hits" grep vs dev-repo defaults; RUNS_DIR not the only literal; shipped-artifact boundary undefined | Fixed — S1.1 names the shipped artifact (drivers do NOT ship); grep scoped to it; S1.2 widened to all ~15 driver path literals as dev-repo template hygiene |
| MEDIUM-1 "23 poll lines" is pilot history, not current state (1 consolidated statement exists) | Fixed — S2 acceptance targets the single canonical statement + the 2 cover mentions |
| MEDIUM-2 S4 precondition set diverged from the core checklist; "family-wide" registry check false-blocks non-oracle members | Fixed — two-tier set (universal core 4 blocking + member-conditional oracle checks); Decisions row added |
| MEDIUM-3 "parallel with Stage 0" vs "one pass once S0b lands" contradiction | Fixed — sequencing rewritten below |
| LOW-1 §resume/§kickoff aren't literal headings | Fixed — real heading text cited |
| LOW-2 driver enumeration omitted cover.workflow.js | Fixed — enumerated |
| LOW-3 S5→S3 journal dependency implicit | Fixed — hard ordering noted in S5 |
| Gap: claim-echo predicate is semantic, non-trivial in pure code | Fixed — feasibility confirmation + mechanical-subset fallback written into S1.3 |
| Gap: S0b options differ in reversibility; spike didn't weigh it | Fixed — per-option reversibility weighing added to Stage-0 exit |
| Open question: omni twin regen vs pending FL-2 back-port | Folded — wave-close confirmation step added to acceptance |

## Effort / sequencing

Stage 0: small (two bounded questions). S1: the design-bearing item, med. S2–S5: small–med each.
S6: small. **Sequencing (critic MEDIUM-3 resolved): S2–S6 build work may proceed during the spike;
S1 starts only after S0b; the formal pipeline close — done-check, review, single MINOR
release-plugin bump, omni twin sync — happens once, after S1 lands.** Within the pass: S3 before
S5 (journal dependency).
