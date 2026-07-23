# Round-4 blind evaluation: mine family vs virtual-worker-harness (VWH)

**Date:** 2026-07-22 · **Protocol:** sealed-envelope blind re-evaluation (rev 3 of
`docs/specs/adhoc-VwhRound4Eval/delivery/prompt.md`) · **Orchestrator/lock judge:** Fable ·
**Evaluators:** two independent clean-room Opus agents (Evaluator-M: nexus mine family only;
Evaluator-V: VWH only) · **Skeptic:** fresh-context Fable agent, re-executed 40+ citations
across all 16 category-checks (re-ran the nexus unit suite live; VWH suite verified by
inspection + corpus count — pytest unavailable in the skeptic's environment).

Blinding held: no prior-round scores, verdicts, or borrow lists were read by any party before
the lock; prior docs were unsealed only after the locked table AND the fresh borrow table below
were written. Near-misses are logged in §7.

---

## 1. Verdict

**VWH edges the mine family, 8.4 vs 8.0 locked mean — a close result between two genuinely
strong, mechanically-enforced systems with complementary centers of gravity.** VWH leads by +1
in three categories (grounding & enforcement, state/resumability/audit, operability & DX) and
ties everywhere else. The mine family's thesis — adversarial verification computed by a trusted
orchestrator from raw tool output — is fully realized in shipped, tested code and matches VWH's
9 on verification; its enforcement perimeter is narrower (concentrated in the Cover core, with
disclosed prompt-tier residue for non-cover members), whereas VWH's enforcement is process-level
(OS audit-hook firewall wired into every CLI entry) and its state layer is atomic, quarantining,
and crash-recovery-tested. Both systems share the same honest weakness: their end-to-end value
artifacts live outside the committed tree (nexus `.runs/` gitignored; VWH campaign state
gitignored, `release/` empty), so both locked at 7 on proven value.

## 2. Locked score table

Anchors: 10 = state of the art for agentic dev tooling · 5 = adequate · 2 = aspirational prose.
Every score is backed by ≥2 `file:line` evidence items (full profiles: Evaluator-M/V reports,
round-4 working set); the skeptic re-executed ≥2 citations per category per system — **zero
FAILED citations**, 5 immaterial DRIFTED verdicts (3 M, 2 V), verdicts noted where they matter.

| # | Category | mine family | VWH | Delta | Note |
|---|----------|:----:|:---:|:-----:|------|
| 1 | Grounding & enforcement | 8 | 9 | V+1 | M: pure deterministic gates (`cover-gates.mjs`), evidence/preflight predicates, unit-tested; candid prompt-tier residue. V: process-global `sys.addaudithook` firewall wired at CLI entry, blocking charter/conclusion/diff gates, CI coverage floor held on itself. |
| 2 | Verification & skepticism | 9 | 9 | — | M: skeptic re-execution with drop-without-excerpt enforced in code; mutation gate + instrument-integrity rule + sabotage check + reject-by-default judge. V: bootstrap/Wilson CI certify (lower CI bound > 0), three-layer fresh-context skeptic incl. mandatory blocking close gate. |
| 3 | Proven value | **7** (adjudicated from 8) | 7 | — | Both: strong mechanism-level proof (M: 540/540 tests re-executed live by the skeptic, pinned real-repo fixtures; V: 2285 test functions/238 files, CI-gated, run-driven kernel evolution, productionized synth flavor). Both: end-result artifacts gitignored → not independently re-verifiable from the tree. |
| 4 | Generality & extensibility | 9 | 9 | — | M: 5-capability adapter seam, 4 shipped stack adapters with real toolchains, 12-member family on one invariant. V: one `TaskAdapter` Protocol drives 3 diverse flavors, conformance gate mechanically fails broken adapters. |
| 5 | Composability & workflow fit | 8 | 8 | — | M: typed registries + anti-self-mine preflight block; lint-enforced skill wiring. V: single-source-of-truth DAG with rendered views, git-native commit-per-experiment. (Skeptic drift on M: flows dead-code routes to run-report candidates, not directly into the registry — immaterial.) |
| 6 | State, resumability & audit | 8 | 9 | V+1 | M: durable per-run journal + idempotent reconcile (tested), append-only registries; persistence is caller-owned. V: atomic intent journal that quarantines corruption, tested idempotent crash recovery, single-writer lock, decision log. |
| 7 | Economy | 8 | 8 | — | M: marginal-delta budget rail + pre-overrun runway forecast, model-tier asymmetry, hotspot-bounded scanning. V: scout/full tiers, field-kill, two-stage certify, EV÷cost ordering; some discipline advisory. |
| 8 | Operability & DX | 7 | 8 | V+1 | M: excellent pinned bringup runbooks and named refusals, but very dense skills and operator-assembled orchestration for non-cover members. V: doctor env checks, actionable errors, strong docs; large surface + minor doc drift ("Two flavors ship" vs 3 homes). |
| | **Locked mean** | **8.0** | **8.4** | | |

### Lock adjudications (judgment record)

1. **M category 3: 8 → 7 (applied).** The skeptic found the score leaned partly on the repo's
   own non-re-executable pilot figures (Hungarian 46%→64%, Levenshtein 96%, recall 3/3 — run
   artifacts gitignored). Disclosed by the evaluator, so not laundering — but the protocol
   mandates *do not trust self-scored numbers*, and V was held to exactly this standard (its
   "~92% coverage" claim was quarantined and its gitignored campaign state cost it the same
   point). Symmetric treatment levels both at 7 and dissolves the only calibration asymmetry
   the skeptic detected.
2. **No other docks.** All other scores survive on confirmed evidence as locked above. The five
   DRIFTED citations (e.g. M's "40 pass" across three cited test files is actually 26 pass /
   0 fail; V's "2294 test functions" is 2285; "30 days" of committed data is 27 files) are
   direction-preserving and non-load-bearing.
3. **Self-score flags carried into the record:** M's pilot figures and V's `EXPERIENCE.md`
   run-outcome numbers are both self-attested narrative, admitted as corroboration only. The
   skeptic noted Evaluator-V omitted flagging the EXPERIENCE.md numbers in its §4; the code
   cross-references citing those runs are genuine and were verified.

## 3. Fresh borrow table — `VWH ← mine` (derived pre-unseal, round-4 evidence only)

Ranked by expected improvement ÷ effort. Written BEFORE unsealing any prior round or the
shipped-borrow ledger, per protocol.

| Rank | ID | Borrow (lesson, not machinery) | What it fixes in VWH | Expected category improvement | Effort |
|------|----|-------------------------------|----------------------|-------------------------------|--------|
| 1 | B1 | **Exact-comparison floor audit** — the `mutationFloor` lesson ("a `Math.round` once turned 74.59% into a 75-floor PASS"; timeout counted as survivor, never as kill): audit every threshold comparison in kernel gates/certify/coverage-floor paths for rounding or tolerance that can flip FAIL→PASS at the boundary; pin boundary regression tests. | Silent fake-green at threshold boundaries in gate arithmetic. | Cat 1 (hardening; keeps 9 honest) | S |
| 2 | B2 | **Cross-reference lint in `selfcheck`** — the `skill-refs.test.mjs` lesson: the meta-gate validates that file paths referenced by skills/CLAUDE.md/framework docs resolve to real files; catches pointer rot mechanically. | Doc/skill pointer drift is currently caught by humans (e.g. the "Two flavors ship" README drift Evaluator-V found). | Cat 1, Cat 8 | S |
| 3 | B3 | **Budget runway forecast** — the `forecastRunway` lesson: project realized per-experiment cost + gap-closing slope and surface "over budget at experiment N, before target" in `status`/`plan` BEFORE the overrun, not when the stopping trigger fires. | VWH economy is reactive (triggers fire at the wall); no pre-overrun warning exists. | Cat 7: 8 → 9 candidate | M |
| 4 | B4 | **Structural evidence gate on skeptic outputs** — the `structuralEvidenceOk` lesson: mechanically reject a sparring/close-skeptic verdict whose evidence is empty, a claim-echo, or lacks a re-execution marker; dropped verdicts don't count as serviced. | Skeptic re-execution is currently asked-for in the prompt, not enforced on the response payload. | Cat 2 (hardening; converts prompt-tier to code-tier) | M |
| 5 | B5 | **Instrument-integrity buckets in the coverage flavor's measure engine** — never count a crashed/timed-out runner as a pass; crashes/timeouts/compile-fails become adjudication buckets distinct from pass/fail. | Potential mis-attribution of runner failures as results in coverage measurement. | Cat 1/2 | M (STOP-and-surface if it needs adapter-contract changes) |
| 6 | B6 | **Suite-strength audit ("audit the auditor")** — the `mine-oracle-strength` idea: a periodic blind audit that authors fresh probes against the harness's own gates to measure whether the test suite would actually catch gate regressions. | No meta-check that VWH's 90%-floor suite is *strong*, only that it's *large*. | Cat 2 | L → design doc only this pass |

**Implementation status (added post-wave, 2026-07-23).** B1 `ac38209` · B2 `6d969d3` · B4
`4eef22b` · B5 `cfab060` shipped in VWH, one commit each with their own regression tests; B6
shipped as a design doc `a9162a3` (staged hybrid, mutmut-first, with build triggers); B3 dropped
at unseal (§5 — VWH already has the organ). Full-suite verification on VWH: ~2,338 tests,
28 failures all byte-identical on pre-wave main (local-environment + one pre-existing selfcheck
desync), zero wave regressions; combined coverage 93.3% ≥ the 90% CI floor. Details:
`virtual-worker-harness/research/2026-07-22-round4-borrow-wave-implementation.md`.

## 4. `mine ← VWH` borrows (nexus backlog note — no nexus changes made beyond this doc)

Derived from round-4 evidence; for the nexus backlog, not implemented here:

- **Process-level clean-room enforcement**: VWH's `sys.addaudithook` firewall (raises on `open()`
  of forbidden paths, realpath-normalized, wired at every CLI entry) is the code-tier version of
  the miner clean-room that `mine-verify-cover/SKILL.md:36-39` candidly admits is prompt-enforced.
  A Node loader/fs-hook equivalent would close the family's biggest disclosed enforcement gap.
- **Statistical certification of deltas**: VWH certifies improvements with bootstrap/Wilson CIs
  over multi-seed repeats (`delta_ci_lower > 0`). Mutation-score and kill-rate deltas across runs
  are noisy in exactly the way this treats; nexus gates are deterministic point thresholds.
- **Mandatory blocking close-skeptic**: VWH's `_STOP` cannot finalize until an independent
  fresh-context skeptic audits the corpus and is explicitly serviced. Nexus skeptics are per-run;
  a blocking registry-finalization audit gate is the missing top-of-funnel analog.
- **Doctor-style structured env checks**: `harness doctor` returns severity-rated, fix-hinted
  environment checks; the nexus bringup runbooks encode the same knowledge as prose an operator
  must execute by hand.
- **Reference-vs-shipped drift gate**: Evaluator-M found `harness/cover.workflow.js:116-117`
  still treats Timeout as killed, contradicting the shipped `cover-gates.mjs` (labeled Inc-3
  debt). A lint that diffs reference-workflow constants against shipped-gate behavior would have
  caught it.

## 5. Reconciliation vs prior rounds (written post-unseal)

Prior rounds read at unseal: 2026-07-12 (per-member, job lens), 2026-07-15 (machinery lens),
2026-07-17 (round 3, same 8-category rubric — the direct comparator), and the
F7-MineMachineryBorrowWave2 shipped-borrow ledger.

### 5.1 Per-category deltas vs round 3 (07-17), each attributed

Round 3: mine 58/80, VWH 63/80 (VWH +5). Round 4: mine 64/80, VWH 67/80 (VWH +3).

**Mine family +6 — five of six category gains attributed to shipped changes (F7 wave-2), one
loss to calibration:**

| Cat | 07-17 → 07-22 | Attribution |
|-----|:---:|-------------|
| 1 Grounding | 6 → 8 | **Shipped (F7):** the gate battery now ships target-agnostic inside `mine-verify-cover/tools/` and runs from the plugin cache (ADR-62), closing round 3's #1 mine borrow ("ship the gates" / §3.2 unclosed seam); registry writes evidence-gated at every chokepoint. Round-4's Evaluator-M independently found `cover-gates.mjs`/`evidence-gate.mjs`/`kickoff-preflight.mjs` as *shipped, unit-tested* tools without knowing they were borrows — independent confirmation the wave landed. |
| 2 Verification | 8 → 9 | **Shipped (F7):** evidence-gating enforced in code at write chokepoints (round 3 had documented "tier (c) wearing (a)'s clothes" — a schema `required` field that `""` passes; `structuralEvidenceOk` now rejects empty/claim-echo/no-re-execution-marker). |
| 3 Proven value | 8 → 7 | **Calibration:** round-4 lock adjudication applied the do-not-trust-self-reported standard symmetrically (V was held to it in round 3 and again here); M's non-re-executable pilot figures no longer carry the 8. Not a regression in the system. |
| 4 Generality | 8 → 9 | **Shipped (F7, partial) + calibration:** capability-contract CI gate with adversarial must-fail fixture (round 3's mine-steal #3) shipped in F6/F7; round-4 evaluator also weighted the 12-member/4-adapter breadth. |
| 6 State/audit | 7 → 8 | **Shipped (F7):** run journal + stage watcher (mechanized firing, round 3's M2) and cross-session resume (M3) — the "organ that works, wired to nothing" is now wired. |
| 7 Economy | 7 → 8 | **Shipped (F7):** runway forecast + realized-cost accrual onto the marginal-budget rail (round 3's M5). |
| 8 Operability | 6 → 7 | **Shipped (F7):** blocking two-tier kickoff preflight with named refusals (M4); report-on-halt discipline. Density cost remains (still not 8). |

All five round-3 `mine ← VWH` borrows (M1–M5) shipped in F7 wave-2 and are visible as score
movement in a blind round that did not know they existed. That is the cleanest
borrow-wave-efficacy measurement these rounds have produced.

**VWH +4 — all attributed to calibration, none to shipped changes:** VWH commits since 07-17 are
synth-data features (V2-P1/P1.5/P4), none rubric-relevant.

| Cat | 07-17 → 07-22 | Attribution |
|-----|:---:|-------------|
| 2 Verification | 8 → 9 | **Calibration:** round-4's evaluator weighted the three-layer skeptic + CI-based statistical certification more heavily. Round 3's dock — the periodic skeptic reads a brief and *never re-executes evidence* — remains true and is independently re-derived below (B4). |
| 5 Composability | 6 → 8 | **Calibration/lens:** round 3 scored host-repo attachment (multi-project .NET breakage, no PR/CI surface — all still true); round 4 scored internal composability + dev-workflow fit (single-source-of-truth DAG, git-native commits). Both readings stand; the +2 is the lens, not the code. |
| 6 State/audit | 8 → 9 | **Calibration:** round-4's evaluator re-executed the crash-recovery idempotence tests in detail; round 3's residual docks (no mid-training resume; headless recovery discards intent) are unaddressed and still open. |

### 5.2 Fresh borrows vs prior rounds — convergence and drops

| Fresh borrow | Prior-round status | Disposition |
|--------------|--------------------|-------------|
| B1 exact-floor audit | New (cousin of round 3's V3 anti-fake-green, different mechanism) | **Implement (S)** |
| B2 cross-ref lint in selfcheck | New | **Implement (S)** |
| B3 runway forecast | **DROPPED — VWH already has the organ** (`dag.py:192,327` realized-cost accrual + `runway_gpu_hours` + `forecast_remaining_experiments`, `gating.py` cost/runway parking, `test_cost_accounting.py`). Nexus's `forecastRunway` was itself round 3's M5 borrow *from* VWH. A blind fresh derivation proposed an organ the target already has; the unseal caught it. | **Dropped** |
| B4 structural evidence gate on skeptic outputs | **Convergent, three rounds running:** 07-15 observed it (skeptic "reasons over a kernel brief, never re-executes"), 07-17 ranked it V1 (VWH's #1 import gap), round 4 re-derived it blind. Never shipped. | **Implement (M) — top priority** |
| B5 instrument-integrity buckets in coverage measure | **Partially convergent** with round 3's V3 (anti-fake-green cross-checks into the measure engine); some V3 items may already exist post-`_rekey`-fix — implementer verifies before writing. | **Implement (M), verify-first; STOP if adapter-contract-breaking** |
| B6 suite-strength audit | New (echoes the `mine-oracle-strength` annex member) | **Design doc only (L)** |

**Prior-round VWH borrows not re-derived this round, still open (standing backlog, not this
wave):** V2 verified-memory registry, V4 host-repo composability seam (L), V5 fail-closed
minimize; plus 07-15's structural items (retire-or-build the substrate island, flavor-scope the
ML-shaped advisory layer, self-label soft tiers). Round-4 evaluators did not surface these —
worth noting that the substrate-island and advisory-misfire findings have now gone two blind
rounds without independent re-derivation, weak evidence they are less load-bearing than 07-15
weighted them.

## 6. Limitations

- Two evaluators, one per system: cross-system calibration is approximate even with anchored
  descriptors; the skeptic's re-execution pass and the symmetric cat-3 adjudication mitigate but
  do not eliminate it. §5.1's VWH deltas show the residual lens-sensitivity directly (cat 5: ±2
  on unchanged code across rounds).
- The skeptic could not execute the VWH pytest suite (no pytest in its shell environment) — VWH
  suite claims were verified by corpus count + CI config inspection, matching Evaluator-V's own
  disclosed limitation. The nexus suite WAS re-executed live (540/540).
- Self-reported numbers in both repos (M: pilot figures; V: `EXPERIENCE.md` run outcomes,
  "~92%" coverage) were admitted as corroboration only, never as score evidence.
- The fresh borrow table was written blind by design; B3 demonstrates the cost (proposing an
  existing organ) and the unseal step demonstrates the correction. Convergences (B4) are the
  compensating signal.
- The working-tree anomaly round 3 flagged (research docs deleted-uncommitted, third occurrence)
  is **not present today**: prior research docs are committed and intact; only this doc and two
  spec folders are untracked. Either resolved or dormant; no new evidence for a root cause.
- Blinding near-misses: see §7 — two incidental, non-comparative provenance mentions on the M
  side; none for V, skeptic, or orchestrator.

## 7. Blinding near-miss log

- **Evaluator-M** (2 incidental, non-comparative, logged for transparency): `harness/lib/run-journal.mjs:17`
  carries a one-line provenance comment naming VWH `recovery.py` ("SHAPE ONLY, no imports");
  `harness/lib/stage-watcher.mjs` references the same lineage. Neither contained comparative
  content; only the self-contained implementations were used.
- **Evaluator-V**: none — `research/` left unopened except noting a directory name; no
  CHANGELOG/backlog/roadmap docs; no git history.
- **Skeptic**: none reported.
- **Orchestrator**: none — prior-round docs, proposals, `*Borrow*` specs, and the shipped-borrow
  ledger were first opened at the unseal step, after this table and §3 were written.
