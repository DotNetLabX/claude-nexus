# Fresh blind evaluation: nexus mine family vs virtual-worker-harness — 8 categories, clean-room scored

**Date:** 2026-07-17 · **Author:** architect session (Fable 5) · **Round:** 3 (prior rounds: 2026-07-12 per-member, 2026-07-15 machinery — reconciled post-lock in §7)

## 0. Method and disclosure

Two independent clean-room evaluator agents (fresh context, forbidden from reading any comparison
material or the rival repo) each produced an evidence-cited capability profile and scored their
subject 1–10 against the same anchored 8-category rubric. A third agent inventoried VWH usages.
Scores were **locked before** the prior rounds' documents were read; §7 reconciles post-lock.

**Disclosure:** the synthesizing session unavoidably saw the prior rounds' *headings and top-line
scores* during recon (a `grep '^#'` skim). The evaluators saw nothing. Category names in this round
were defined fresh from the rubric, not lifted from round 2; overlap in concepts (enforcement,
economy, composability) is convergent, not copied.

**Comparability caveat:** the two evaluators scored independently against anchored descriptors
(10 = state of the art for agentic dev tooling; 5 = adequate; 2 = aspirational prose). Cross-system
comparability is approximate; §3 adjudicates the seams where the evidence shows a calibration split.

## 1. Verdict (read this first)

**VWH 63/80 vs mine family 58/80 — but the totals mislead; the profiles are near-perfect
complements.** VWH is a *kernel*: its guarantees are Python that raises (`FirewallViolation`,
`DeletionError`, blocking conclusion/charter gates) under 1,328 tests and a 90% CI coverage floor —
and its proven footprint is narrow and partly self-scored. The mine family is a *method*: its
verification semantics are the strongest in either system (skeptics must re-execute evidence or the
verdict is dropped; mutation gates proved fake-green-proof; a controlled head-to-head beat a real
51-test human suite 89.24% vs 53.80%) — and almost all of it is prose a consuming session must
faithfully transcribe, with the enforcement scripts explicitly not shipped.

The single highest-leverage move for the mine family is **shipping its enforcement as a runtime**
(VWH's model). The single highest-leverage move for VWH is **making its skeptic re-execute
evidence** (the mine family's model). Both are cheap relative to what they close (§6).

## 2. Locked category scores

| # | Category | Mine family | VWH | Δ |
|---|----------|:-----------:|:---:|:--:|
| 1 | Grounding & enforcement | 6 | **9** | VWH +3 |
| 2 | Verification & skepticism | 8 | 8 | tie (split halves — §3) |
| 3 | Proven value | **8** | 7 | mine +1 |
| 4 | Generality & extensibility | 8 | **9** | VWH +1 |
| 5 | Composability & workflow fit | **8** | 6 | mine +2 |
| 6 | State, resumability & audit | 7 | **8** | VWH +1 |
| 7 | Economy | 7 | **8** | VWH +1 |
| 8 | Operability & DX | 6 | **8** | VWH +2 |
|   | **Total** | **58/80** | **63/80** | VWH +5 |

### Score justifications (evaluator evidence, condensed)

**1. Grounding & enforcement — mine 6, VWH 9.** VWH: audit-hook firewall with realpath/symlink
canonicalization (`firewall.py:88-109`), append-only DAG invariants that raise (`dag.py:174-182`),
blocking charter and conclusion gates (`loop.py:91-100`, `conclusion.py:66-75`), 1,328 tests + CI
90% floor; docked one point because the firewall is in-process only (disclosed at
`firewall.py:73-75`). Mine: the Cover gate battery is genuinely mechanical *in the dev repo*
(`harness/lib/cover-gates.mjs`; skeptic evidence schema-enforced in `mine-verify.workflow.js:132-134`;
ADR-60 CI contract gate) — but the shipped skills are prose the consuming orchestrator
re-instantiates; gate-script delivery is explicitly spike-gated out of build scope (F6 tech-spec),
clean-room isolation is prompt-tier and self-disclosed (cover SKILL:36-39), and the four prose
siblings' "structural enforcement" is session-executed instruction.

**2. Verification & skepticism — both 8, opposite halves.** Mine has the stronger *semantics*:
must-RUN skeptics with drop-without-excerpt and the vacuous-evidence kill (core:100-111), a
mutation gate that survived a hostile repo shape, sabotage by a distinct runner, a blind
higher-tier judge that killed a planted fabricated-authority candidate 100% at tier 1, and an
oracle that is itself re-grounded on deviation. VWH has the stronger *delivery*: skeptic firing is
mechanized (daemon auto-fire after the documented 0-of-7 agent-driven failure, `monitor_spar.py`),
the close skeptic blocks finalization, refutation is the enforced resting verdict at ledger time —
but its periodic skeptic reasons over a kernel brief and **never independently re-executes
evidence**, and mid-campaign challenges are advisory (reject-with-reasoning suffices).

**3. Proven value — mine 8, VWH 7.** Mine: measured outcomes across four stacks and five-plus
repos — 100%×3 .NET classes, 91% cross-repo DDD (~396k tokens), 90%/94% Flutter live runs, 96% C++
plus an honest sub-floor refuse at ~69%, a controlled kill-delta 53.80%→89.24% vs a real human
suite, a 143→83-row repo mine with 0 WRONG, two adjudicated algorithm pilots; gap —
mine-reference-model has never run. VWH: real campaigns exist in all three flavors (bad-report
AUC ~0.94 on 5,948 real reports; 711-ph engagement, 1.66M transactions, 12/13 validation; .NET
Stryker cross-validation matching 57.14%) — docked because several headline numbers are self-scored
by its own battery, `release/` has never been used, and the model-gap A/B/C benchmark is designed
but not run.

**4. Generality & extensibility — mine 8, VWH 9.** VWH: a ~230-line typed contract + nine hasattr
hooks; three shipped flavors with genuinely different shapes (stochastic curve / deterministic
atomic / no-ground-truth); a PRD-gated `/add-flavor` wizard requiring a gaming threat model. Mine:
an explicit 5-capability adapter contract filled by four live stack adapters (dotnet/flutter/cpp/php),
CI drift-gated with an adversarial must-fail fixture; docked for the algorithm catalog's
availability column and fact-tier mappings being declared unfinished for cpp/php.

**5. Composability & workflow fit — mine 8, VWH 6.** Mine members feed each other by contract
(cover's registry is design's and algorithm's oracle; repo's registry feeds the refactoring lane;
flows' dead-code by-products route to repo; the SDD lifecycle merges spec and code arms) and slot
into a host pipeline. VWH assumes it **owns the repo** — every command commits, requiring a clean
tree; the one attach to a real multi-project .NET solution broke ~5 ways with 4 architecture
decisions still deferred; no PR/CI/host-team integration surface exists.

**6. State, resumability & audit — mine 7, VWH 8.** VWH: every experiment is an immutable commit
with SHA on its DAG node; journaled idempotent crash recovery; atomic state writes; crash-released
single-writer lock; docked for no mid-training resume and headless recovery discarding intent.
Mine: registries carry provenance/never-delete/changelog/idempotency; every stop writes a report;
one resume saved ~193k tokens — but resume is **same-session-only** ("a run killed today cannot be
resumed tomorrow") and there is no cross-run coverage rollup.

**7. Economy — mine 7, VWH 8.** VWH: graduated effort is designed in — scout tier ≈0.25× budget,
field-kill, landing-projection aborts, certify screens before paying retrains, realized cost
accrues per node into a runway forecast. Mine: real cost data exists and depth is graduated, but
the budget rail exists because the naive rail false-halted a live run, and one real runaway
(an off-contract runner hand-compiling a mutant at 100% CPU until operator kill) was fixed after
the incident, not prevented before.

**8. Operability & DX — mine 6, VWH 8.** VWH: a 403-line HANDS-ON walkthrough, a read-only
companion tutor, a bootstrap wizard ending in a green dry-run, doctor/selfcheck, live per-phase
nudges. Mine: unusually operational docs (copy-paste scaffolds, "do not relearn these the hard
way" fact tables) — but **no entry-point wizard exists; the operator IS the orchestrator**,
assembling multi-stage background-agent choreography from prose, and completion notifications were
unreliable enough to strand agents twice.

## 3. Adjudication — where the tie isn't a tie

The Verification tie decomposes cleanly: **mine's skeptic protocol is what a skeptic should do;
VWH's monitor is how a skeptic should be fired.** Neither system has both. This is the sharpest
single cross-pollination pair in the whole comparison (§6, borrows M1 and V1).

The Economy split reverses by unit of work: per *experiment*, VWH's kernel-computed cost controls
are stronger; per *campaign standing up*, mine is far cheaper (a skill invocation vs a repo the
harness must own). The scores reflect the rubric's per-unit-of-value framing.

## 4. Per-member / per-flavor snapshot

**Mine family** (evaluator's per-member profiles, condensed to one line each):
- **mine-verify-cover** — the proven core; 6-gate orchestrator-computed battery, 4-stack adapter
  contract; weakness: prompt-tier clean-room, recall unmeasured.
- **mine-verify-repo** — deterministic metric layer (bot-filtered churn/coupling, μ+3σ hotspots) is
  the family's most mechanical non-Cover organ; verify gate is session-executed prose.
- **mine-verify-flows** — golden-gate + sabotage-by-distinct-runner; honest about sabotage being
  weaker than mutation; single-hardware goldens constrain CI.
- **mine-design** — two-tier blind judge (provenance-strip, authority-zero, both-orderings) passed a
  planted-saboteur calibration; zero deterministic enforcement, single-pilot evidence.
- **mine-algorithm** — never-self-mine-the-oracle hard block (born from its own pilot violating it);
  equivalence net with per-quantity comparators; catalog instantiated for one stack.
- **mine-reference-model** — the only member with **zero live runs**, yet its output legitimizes
  `by-design` debt dispositions downstream; an unpiloted gate guarding a consequential judgment.

**VWH flavors:**
- **ML/pytorch** — founding flavor, extracted from a real deployment project; 7 cold-start
  validation runs including honest failures; no mid-training resume.
- **coverage** — same job as mine-verify-cover's Cover arm; gates computed in code
  (`measure.py:172-216`); .NET live-validated (kill-rate matched Stryker's own 57.14%) — but no
  campaign has driven a real repo past 8.8% branch coverage, and multi-project workspaces break it.
- **retail_intelligence** — the flagship "data analyst"; no-ground-truth maximands (served/measured
  value), semantic layer, value ledger, live Postgres connector, real client deliverables; enormous
  (a 44-module synth simulator grew inside it), straining the simplicity doctrine.

### 4b. Analytics head-to-head (added same day, owner ask)

The two analytics systems — VWH `retail_intelligence` vs `nexus-analytics` — were scored separately
on the same rubric, together with an artifact-level comparison of the two semantic models of the
same fmcg_platform database (VWH `profiles/retail/` vs knowledge-gateway's
`seed/db/semantic-model/`): **VWH retail 55/80 vs nexus-analytics 53/80** — the parent
complementarity repeated (proven+enforced vs composable+audited-but-unproven). On the semantic
model itself, **KG's bundle wins on correctness (probe-verified, formula-reconciled, boot-gated) —
VWH's profile wins on value semantics (weights, demand gating, feed states)**. Full scores, borrow
lists, and the F3 re-evaluation:
[`2026-07-17-analytics-semantic-models-head-to-head.md`](2026-07-17-analytics-semantic-models-head-to-head.md).

## 5. VWH usage inventory (the "what else is there" question)

| Usage | Kind | Status |
|-------|------|--------|
| ML/pytorch flavor + `example_clf` | shipped flavor | e2e green; founding |
| Coverage flavor + `example_coverage` | shipped flavor | v1; Python e2e, .NET live-validated |
| Retail-intelligence flavor + `example_retail_intel`/`example_analytics` | shipped flavor | v1+v2 (served + measured value) |
| **BI/data-analyst flavor** | **sketch only** in FLAVORS.md — never built (distinct from retail_intelligence) | proposal |
| **bad-report-filter** (shelf-photo classifier) | research hand-off package | baseline shipped (AUC ~0.94), multimodal NN staged, unbuilt |
| synth-retail-data simulator + twin-eval battery | adjacent system inside retail flavor | shipped; dominates recent git history |
| 711-ph (7-Eleven PH) engagement | real client campaign | closed 2026-07-12; 1.66M synthetic transactions, 12/13 validation |
| `vues/` dashboards (oxxo-pilot, sap-value-map, ceo-sales-plays, exec-value-brief, …) | adjacent reporting system | committed standalone HTML deliverables |
| solum-code-reader origin campaigns; autonomous runs 1–7; `/roast` operator-elicitation | historical/instrument | recorded in EXPERIENCE.md |

**Image generation: none exists and none is proposed** — repo-wide grep returned zero hits. The
only image handling is *consumption* (fetching shelf panoramas for the bad-report classifier).
The harness's most active current use is not the flavor loop at all but the synth-data/twin-eval
subsystem serving the 711-ph engagement (>50 of the last 60 commits).

## 6. Cross-pollination — what each should take, and what it buys

### Mine family ← VWH (ranked by leverage)

| # | Borrow | What it fixes (mine import gap) | Expected improvement | Effort |
|---|--------|--------------------------------|----------------------|--------|
| M1 | **Ship the enforcement runtime** — generalize the dev-repo gate scripts (R4) into shipped, consuming-repo-runnable checks; add a `conclusion.py`-style deterministic gate at registry-write time (verdict-without-excerpt is *rejected by code*, not by convention) | Gaps #2 & #3: enforcement scripts don't ship; prose siblings have no runtime | Grounding 6→~8.5 — the largest category deficit closes; every consuming-repo guarantee stops depending on session transcription | M–L |
| M2 | **Mechanized skeptic/stage firing** — a monitor-daemon pattern (pidfile-gated, auto-fire on cadence) instead of orchestrator-prose choreography | Gap #5 fragility: agents stranded twice; "poll, don't wait" hand-written into 23 stage prompts is a workaround, not a fix | Operability 6→~7.5; removes the stranding class entirely | M |
| M3 | **Journaled cross-session resume** — run-id journal + idempotent `reconcile` (resume / complete-tail / none) | Gap #5: resume is same-session-only | A run killed today resumes tomorrow; measured value of resume already ~193k tokens on one run | M |
| M4 | **Blocking kickoff/charter gate** — the advisory kickoff checklist becomes a preflight that refuses to start unfulfilled | "Wired-but-advisory — discipline without an enforced gate" (core:173-174) | Prevents the class of pilot incidents (unguided test-root, self-mined oracle) that were each fixed only after occurring | S |
| M5 | **Realized-cost accrual + runway forecast** onto the marginal-budget rail | Budget rail is reactive (built after a false halt); no forward projection | Economy 7→~8; budget halts become forecasts instead of surprises | S–M |

### VWH ← mine family (ranked by leverage)

| # | Borrow | What it fixes (VWH import gap) | Expected improvement | Effort |
|---|--------|-------------------------------|----------------------|--------|
| V1 | **Re-executing skeptic** — must-RUN + drop-without-excerpt + vacuous-evidence kill at the `monitor_spar` seam; the skeptic re-executes the agent's evidence commands, not just reads a kernel brief | Gap #4: advisory-only, never re-executes evidence | Verification 8→9; mid-campaign challenges become evidence-grounded instead of rhetorical | S–M |
| V2 | **Verified memory registry** — registry invariants (provenance, `last_verified`, never-delete + changelog, refresh grammar) + stamp/hash delta re-check applied to `memory/` | Gap #3: cross-campaign knowledge is unverified lore; seeding seam an acknowledged stub (T3.6) | Campaign N+1 inherits *verified claims*; stale lore detected by hash drift instead of trusted forever | M |
| V3 | **Anti-fake-green cross-checks** into the coverage measure engine — agent-reported totals vs tool-summary `Found N`; full-path target match; same-basename-partial defense | Field-proven failure modes mine already met and killed; VWH's gates are code but lack these specific adversarial invariants | Hardens the coverage flavor before its first hostile real-repo campaign — pre-paying lessons mine bought with incidents | S |
| V4 | **Host-repo composability seam** — workspace-split for multi-project solutions; a dirty-tree-tolerant mode; mine's adapter-capability-contract + CI drift-gate pattern for host integration | Gap #1: must own its repo; real .NET solution broke ~5 ways; no PR/CI surface | Composability 6→~8; unlocks the entire "attach to a real codebase" market the coverage flavor needs | L |
| V5 | **Fail-closed Minimize** — LLM-attributed test removal treated as hypothesis, re-gated on exact kill counts, restored on any drop | Coverage flavor has no suite-trimming safety | Lets the coverage flavor safely shrink the suites it generates | S |

### The strategic read

The two systems are converging from opposite ends of the same design space: **mine is a method
seeking a kernel; VWH is a kernel seeking a method's breadth.** The deepest opportunity is not any
single borrow but the shared organ both need: `mine-verify-cover`'s Cover arm and VWH's coverage
flavor do the *same job* (mutation-gated test generation) with independently built gate engines.
A shared gate engine — orchestrator-computed battery + anti-fake-green invariants (mine's
semantics) running as installed, tested code (VWH's delivery) — would serve both and would be the
natural first artifact of M1+V3.

## 7. Reconciliation vs prior rounds (post-lock)

*Written after locking §2, upon first full read of the 2026-07-12 and 2026-07-15 documents.*

**The three rounds triangulate one stable structure, not three verdicts.** The 07-12 job lens put
mine ahead (7.3 vs 6.3); the 07-15 machinery lens put VWH ahead (7.8 vs 7.0 Cover / 6.0 prose); this
round's mixed rubric lands between (VWH 63 vs mine 58). Across all three: **whenever the lens is
enforcement/machinery, VWH leads; whenever it is outcomes/breadth, mine leads** — reproduced here by
evaluators who never saw the prior rounds. The 07-15 headline ("a deep, hard, single-purpose engine
vs a shallow, soft, highly composable pattern") was independently re-derived in this round's §1
verdict ("a kernel vs a method"). Convergence under clean-room conditions is the strongest
confidence signal this comparison has produced.

**Category-name collision to defuse:** this round's *Economy* (mine 7, VWH 8) does **not** reverse
07-15's *EC* (mine 8, VWH 6). Different constructs sharing a name: 07-15 scored economy **of
design** (does each mechanism earn its place — where VWH's substrate island and non-ML misfires
cost it); this round scored economy **of operation** (cost controls per unit of work — where VWH's
scout tier, field-kill, and runway forecast win). Both remain true simultaneously.

**What changed between rounds — F6 visibly moved the needle.** The 07-15 "steal" list had five
items; git shows four shipped in F6-MineMachineryHardening (1a599f6, nexus 1.34.7, 2026-07-16):
resume wired into the runbook (#1), skeptic excerpts persisted into registry rows (#2 — this
round's evaluator found them at `mine-verify.workflow.js:311-323`), the capability-contract CI gate
with adversarial must-fail fixture (#3 — ADR-60), and the clean-room tier disclosure (#5 — cover
SKILL:36-39). The effect is visible in this round's scores: State 7 (vs 07-15's Cover 6 / prose 4)
and Generality 8 (vs 07-15's XS Cover 6 / prose 4). **The one prior steal that did not land — #4,
"ship the gates" — is exactly what this round independently re-derived as M1, the top mine borrow.**
Two clean-room rounds converging on the same #1 gap is as strong as this kind of evidence gets.

**What this round adds beyond the prior lists:**
- **M2 (mechanized skeptic firing)** and **M3 (cross-session resume)** go past 07-15's #1, which
  wired the tool-supplied *same-session* resume; the same-session cap and the stranded-agent
  incidents are the residue its correction log said a runbook line does not buy.
- **V1 (re-executing skeptic for VWH)** is new as a ranked borrow — 07-15's IA section *observed*
  that VWH's skeptic reads a brief rather than re-executing evidence, but its VWH-steal list
  (family shape, substrate island, flavor-scoping, tier self-labeling) never promoted it. The
  fresh VWH evaluator independently ranked it VWH's #1 import gap.
- **The usage inventory** (§5) is new ground: the BI/data-analyst *sketch* being distinct from the
  shipped retail flavor, the confirmed absence of any image-generation usage, and the finding that
  VWH's most active current use is the synth-data/twin-eval subsystem (a real client engagement),
  not the flavor loop itself — which sharpens 07-12's "the loop is still awaiting a real-world
  run" into "the *product* around the loop is what's earning today."

**What this round confirms unchanged:** 07-12's follow-up #2 (advisory kickoff is insufficient;
promote the Stage-0 HARD BLOCK pattern family-wide) is this round's M4 — still open. The
2026-06-23 substrate verdict and "borrow lessons, not machinery" rule survive: every borrow in §6
is a lesson/pattern transfer, none is a machinery transplant.

**Standing operational flag (third occurrence):** both prior research docs are deleted-uncommitted
in the working tree *today* — the same never-root-caused anomaly 07-12 §5.5 flagged for the 07-10
doc. This doc is written as a new untracked file; the deletions were left untouched. Owner should
`git restore docs/research/` (or confirm intent) before any commit sweeps them, and the anomaly now
has enough recurrences to deserve a root-cause pass.

## 8. Limitations

- Two evaluators, one per system: absolute score calibration across systems is approximate
  (mitigated by anchored descriptors and §3 adjudication; not eliminated).
- Evaluator claims were spot-checkable but not independently re-executed this round — the round
  inherits the evaluators' citation discipline (every score cites ≥2 file:line evidence items).
- The market scan ([`2026-07-17-market-scan-harnesses-and-mining.md`](2026-07-17-market-scan-harnesses-and-mining.md))
  ran in parallel; neither informed the other.
- VWH evidence includes self-scored numbers (Realism Index); the evaluator flagged, this round did
  not independently re-grade them.
