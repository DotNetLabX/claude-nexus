# F7-MineMachineryBorrowWave2 — Review

## Step 1 — Done-Check

Pre-commitment predictions (made before reading implementation.md): (1) S6 judge/disclosure gap or
golden-text leak; (2) Step-1 probe + temp-dir simulation shortcuts; (3) Step-9 findings-doc path
unrecorded. Found: all three handled — clean-room held (path + GOLD ids only, scoring script run
outside the repo), the probe fired its pre-authorized operator-owed fallback, the findings doc is
recorded (`docs/skill-evals/2026-07-18-mine-verify-family.md`).

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Ship the gate battery (ADR-62) | Implemented | Shipped file + shim + sweep + recipe section + 5 shipped-artifact tests; all 4 accept mechanisms reported. `${CLAUDE_SKILL_DIR}` probe sub-item → Deviated (valid reason, pre-authorized: env var unset in-pipeline; ADR-62 independent of the answer). Bonus: Windows `file://` ESM caveat discovered by accept #1 and baked into the shipped recipe. |
| 2 — Parameterize driver literals | Implemented | All 20 bare literals across 9 drivers converted to `_args.{name} ?? '<same default>'`; hardened grep → 0 hits; `node --check` clean (disclosed syntax-only, per plan). |
| 3 — Registry-write evidence gate | Implemented | Feasibility confirmation recorded as mandated (mechanical echo-check feasible; semantic paraphrase residual disclosed prompt-tier). Live verdict-drop at `mine-verify.workflow.js`; at `rules-registry.mjs`/`kb-write.mjs` the predicate is co-located + exported + paired non-destructively — documented design decision honoring those libs' binding invariants (deprecate-never-delete, pinned serializer contracts). ADR-60 must-fail fixtures present. Reviewer: verify the pairing is real at all three chokepoints. |
| 4 — Run journal + reconcile | Implemented | Unit + CLI level proven incl. double-reconcile idempotency; core supersede note grep-verified. Live cross-session kill/resume → Deviated (valid reason, pre-authorized `Owner: operator`; OPERATOR ACTION documented). |
| 5 — Mechanized firing watcher | Implemented | Journal-driven per the binding state source; sim-level proven over fixture Step-4 journal state; poll-statement pointer treatment done in both SKILL.md files. Live Workflow missed-completion → Deviated (valid reason, pre-authorized; OPERATOR ACTION documented). |
| 6 — Blocking kickoff preflight | Implemented | Two-tier with `applicable` on every check — the no-false-block path is reachable-and-skipped-by-class (vacuous-negative trap avoided per plan); "Wired-but-advisory" survives only in the supersede note (grep-verified). |
| 7 — Runway forecast | Implemented | `forecast: over-budget at stage N` binding line shape; emitted before overrun in sim; drivers' reactive rail untouched so existing tests stay green. |
| 8 — S6 BugRatio recall | Deviated (valid reason) | Report at `delivery/s6-bugratio-recall-report.md` instead of "harness runs area" — `harness/.runs/` is git-ignored, a committed report cannot live there; plan grants exact path = developer's call. Judge-by-developer was plan-pre-authorized (attributed + disclosed). Recall 3/3, unmatched none, both disclosure lines present, clean-room binding rule held. |
| 9 — Docs sweep + evaluate-skill | Implemented | ACCEPT verdict; findings doc path recorded; 14 heading-pointer sites resolve; superseded sentences confined to notes. |
| 10 — Close-out (MINOR bump + omni) | N/A | Owner: team lead per plan — not a developer deliverable at done-check. Heed the F10-contamination carry-over row before running the bump. |

**Skill conformance (log-scored):** scoped window = `.claude/audit/skill-invocations.log` where
`agent=developer`, `token=developer:implement`, session `4ca2eba5-…`: **6× `tdd`** (11:20–12:03) +
**1× `evaluate-skill`** (12:12) — exactly the plan's six TDD-yes steps (1, 3, 4, 5, 6, 7) and Step
9's Follow mapping. `## Skills Used` self-reports corroborate 1:1 against the log; no fabrication;
steps 2/8 (`None`/TDD-no) correctly log nothing; Step 10's `release-plugin` is team-lead-owned
(the out-of-window release-plugin entries belong to other sessions/features). **Pass.**

**`Satisfies:` cross-check (where present):** Steps 1–8 cite `tech-spec S1.1/S1.2/S1.3/S3/S2/S4/S5/S6`
— all resolve to real tech-spec sections. Pass.

**Plan-hygiene (self-attributed, no verdict impact):** the plan's Decisions row cited "mirrors
F8's `mine-semantic-model/tools/` precedent" — carried over from the team lead and confirmed by the
developer (`find plugins -type d -name tools` → 0 pre-wave hits): F8-W1 (the probe runner) is
gated and never built, so the cited precedent was planned, not on-disk. Architect's own artifact
defect (cosmetic — the row's primary rationale stands); plan row amended this pass.

**Scope check:** every created/modified file maps to a plan step; no unexpected files from this
developer. The foreign F10 files in the working tree are a **concurrent session's** (developer
flagged them correctly) — routed to the team lead as a Step-10 bump-contamination hazard, per
CLAUDE.md's multi-agent bump warning. The verify-gate advisory fail (gen-omni --check twin drift)
is the EXPECTED mid-feature state (ADR-6 — the twin syncs at close, Step 10).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-07-18*

## Step 2 — Code Review

## Reviewed By
reviewer (Fable 5), 2026-07-18 — initial review (plan re-read, all Step-1/2/3/4/5/6/7/8 artifacts
read, fresh verification: suite, greps, syntax, consuming-repo simulation, predicate lockstep,
independent S6 re-judge) **+ re-review of Fix Round 1 (cycle 1/3, same date)**: all five follow-ups
verified fixed with fresh evidence — see the per-finding Resolved lines and the Re-review rows in
the Evidence table.

## Verdict: APPROVED

No CRITICAL or HIGH findings. The initial round recorded one MEDIUM and four LOW follow-ups
(non-blocking); **Fix Round 1 addressed all five** — the MEDIUM and three LOWs fully resolved and
verified, the boundary-test LOW resolved on its preflight leg (watcher/forecast exact-boundary
fixtures remain optional, see Gaps).

## Pre-commitment Predictions
1. **Predicate lockstep drift across the four copies** — REFUTED: behavioral lockstep check (all 4
   copies × 19 fixtures incl. empty/echo/fragment/fabricated-line-ref/non-string coercion) — all agree.
2. **"Live drop" weaker than claimed at mine-verify** — PARTIALLY CONFIRMED: the persisted outcome is
   fully gated (see F-2), but a nearby ungated code path exists on the dormant monolith fallback (F-1).
3. **Repo/pilot residue in shipped tools** — REFUTED: all greps 0 hits; comments generalized beyond the
   mandated grep gate (developer went further than required).
4. **Vacuous preflight negative (test c)** — REFUTED: the `applicable` contract is structural (the
   member-conditional checks are always present in the result), so reachable-and-skipped is proven, not
   assumed.
5. **Watcher/journal time-unit or idempotency edge** — mostly refuted; residual boundary-test gap (F-3)
   and a CLI NaN edge (F-4).

## Findings

### [MEDIUM] S1.3 evidence gate is bypassable on the loop monolith-fallback path (and not invoked by the merge/loop inlines)
**File:** `harness/loop.workflow.js:440-441` (mechanism), `harness/loop.workflow.js:133` (reachability), `harness/loop.workflow.js:489-491` (write)
**Origin:** design
**Issue:** The inline mine-verify in loop.workflow.js's MONOLITH_FALLBACK branch carries `v.evidence`
onto rules unconditionally (`...(v?.evidence ? { evidence: v.evidence } : {})`, :440-441) with no
structural gate, and the controller then serializes those rules to the KB (`supersedingRules`,
:489-491) — so with `MONOLITH_FALLBACK = true` (:133, a documented flip-at-bringup constant, currently
false), claim-echo/vacuous evidence can reach the KB as `- verify:` excerpts, silently bypassing S1.3.
Related: the merge/loop workflows' inlined rules-registry/kb-write helper blocks do not invoke the new
paired `gateRegistryEvidence`/`gateRuleEvidence` helpers (the pairing lives at the lib seam only). The
plan enumerated exactly three chokepoints — all three ARE wired (verified below) — so this is a gap in
the plan's chokepoint enumeration vs the spec's "runs wherever a registry row is written", faithfully
implemented; hence origin: design.
**Fix:** Either sync the S1.3 gate block into the monolith-fallback inline (same VERBATIM-copy pattern
already used at mine-verify.workflow.js:163-185), or add a one-line disclosure at the fallback branch
("S1.3 gate not wired on this bring-up path") + an orchestrator call to the paired helpers before the
KB write. Follow-up scale — the primary (delegated) path is fully gated and the fallback is dormant.
**Confidence:** 85/100
**Resolved (Fix Round 1, verified):** `INLINED EVIDENCE GATE` block added at `loop.workflow.js:136-158`
(VERBATIM copy, SOURCE OF TRUTH comment) and wired in the monolith branch at :460-486 — the exact
mirror of the delegated path (post-parse gate → `gatedEvidenceById` → evidence carried only when
gated → `evidenceGateDropped` return + logged drop). Behavioral lockstep re-proven across all **5**
copies (19 fixtures, identical pass/reason). Adjacent areas re-checked: primary composition path
untouched; workflow-contract sandbox tests green in the fresh 587/0 run.

### [LOW] "Drops the verdict" implemented as evidence-carry drop; verdict tally left intact
**File:** `harness/mine-verify.workflow.js:307-323, 357-369`
**Origin:** implementation
**Issue:** Plan/spec wording: failing evidence "drops the verdict at write time". Implemented: the
CONFIRMED verdict stays in `interpretiveVerdicts` and `counts.confirmed`; only the evidence carry is
dropped (disclosed in the code comment, surfaced via `evidenceGateDropped`). I verified the persisted
outcome is identical to a full verdict-drop — the KB write consumes only `consensusRules[].evidence`
(gated), all consensus rules are written regardless of verdict (pre-existing F6 behavior), and
`counts.confirmed` has no downstream consumers (grep: none in harness/). So the deviation is
observability-only, but implementation.md's phrasing ("a CONFIRMED verdict … is DROPPED") overstates
what the code does.
**Fix:** Optional: decrement or annotate the confirmed tally (e.g. `confirmedEvidenceGated` count) so
an echo-evidence CONFIRMED is distinguishable in run logs; at minimum keep the code comment (already
honest) as the record.
**Confidence:** 90/100
**Resolved (Fix Round 1, verified):** disclosed as a Deviations entry in implementation.md (:188-191) —
the evidence-carry scoping, tally-intact choice, and `evidenceGateDropped` surfacing are now on the
record. Accepted as-is (the persisted-outcome equivalence was already established).

### [LOW] Missing exact-boundary tests on the wave's threshold conditions
**File:** `tests/unit/stage-watcher.test.mjs` (sinceMs > stallMs — no test at exactly stallMs), `tests/unit/runway-forecast.test.mjs` (cum > budget — no test at exactly budget), `tests/unit/kickoff-preflight.test.mjs` (`confirmed(0)`/`NaN` pass as "declared")
**Origin:** implementation
**Issue:** All three new threshold conditions use strict `>` and are tested only well above/below the
threshold, never at N and N+1. Also `kickoff-preflight.mjs:26-28` `confirmed()` accepts `0` and `NaN`
as a declared stop-budget (doc comment says "non-falsey" but 0/NaN slip the list).
**Fix:** Add one boundary fixture per threshold; optionally tighten `confirmed()` for numeric fields.
**Confidence:** 85/100
**Resolved — preflight leg (Fix Round 1, verified):** `confirmed()` now rejects numeric `0` and `NaN`
(`kickoff-preflight.mjs:28-32`) with 3 exact-boundary tests (0 → refused, NaN → refused, 1 → confirmed,
`kickoff-preflight.test.mjs:49-66`). The watcher (`sinceMs == stallMs`) and forecast (`cum == budget`)
exact-boundary fixtures were not added — still optional (see Gaps).

### [LOW] stage-watcher CLI: non-numeric stallMinutes silently disables firing
**File:** `harness/lib/stage-watcher.mjs:89`
**Issue:** `Number(stallMin)` on a non-numeric arg yields NaN → `sinceMs > NaN` is always false → the
watcher runs forever and never fires, with no warning (the startup line even prints "stall NaNms").
Operator-owed CLI, so impact is low.
**Origin:** implementation
**Fix:** Validate `Number.isFinite(stallMs)` and exit(2) with the usage line otherwise.
**Confidence:** 88/100
**Resolved (Fix Round 1, verified):** the CLI now guards `Number.isFinite(mins) && mins > 0`
(`stage-watcher.mjs:89-100`), exits 2 with a named error, and a subprocess test asserts exit 2 on
`abc` (`stage-watcher.test.mjs:76-84`). Default path (no stallMinutes arg) unaffected.

### [LOW] Step-1 accept #1 output not pasted in implementation.md
**File:** `docs/specs/F7-MineMachineryBorrowWave2/delivery/implementation.md` (Verification summary)
**Origin:** implementation
**Issue:** The plan's accept #1 required the consuming-repo simulation "command + output pasted" in
implementation.md. The simulation demonstrably ran (the Windows `file://` ESM discovery it surfaced is
recorded and baked into the shipped recipe), but the command + output themselves were not pasted. I
re-ran the simulation independently this session from a temp dir outside the repo — battery green,
exactly the 7 binding exports (Evidence table) — so the fact is established; the gap is documentation.
**Fix:** None required this cycle (reviewer evidence on file); paste outputs next time.
**Confidence:** 95/100
**Resolved (Fix Round 1, verified):** the developer re-ran the simulation from outside the repo and
pasted command + output into implementation.md (:249-257) — battery green against a NON-pilot class,
`EXPECTED_SURVIVOR_LINES === undefined` asserted, both greps 0. Corroborates my independent run.

## Positive Observations
- **The three chokepoints are real** (architect ask 1): the LIVE drop at `mine-verify.workflow.js:307-323`
  provably prevents gated evidence from reaching `consensusRules` (:357-367); `rules-registry.mjs:123-132`
  `gateRegistryEvidence` surfaces-never-mutates (honoring the deprecate-never-delete invariant);
  `kb-write.mjs:125-136` `gateRuleEvidence` strips-before-serialization — both exported, both unit-tested
  (`evidence-gate.test.mjs:82-110`), both non-destructive by documented design.
- **Four-copy lockstep proven behaviorally**, not just by eyeball: 19 fixtures through all four copies
  (shipped + 3 inlines, the workflow inline extracted from source and evaluated) — identical
  pass/reason on every fixture, including the word-boundary echo edge.
- **The target-agnostic invariant is pinned non-vacuously**: `cover-gates-shipped.test.mjs:33-52` proves
  the pilot dead-line (17) is COUNTED without caller input (reachable path, exercised) and the exclusion
  still honored when supplied — exactly the anti-vacuous discipline the plan demanded of Step 6c.
- Feasibility confirmation (S1.3) recorded honestly: mechanical echo-check claimed, semantic
  paraphrase-echo explicitly NOT claimed, disclosed prompt-tier in code + core doc — and my fixture
  battery confirms the disclosed residual behaves exactly as disclosed (echo + fabricated line ref passes).
- Doc work is exact: both binding headings preserved (all 14 external pointer sites re-resolved),
  superseded sentences confined to their notes, CHANGELOG + nexus-analytics untouched.
- Developer generalized shipped comments beyond the mandated grep gate (Fokus/CycleTime anecdotes
  neutralized) — the shipped artifact reads genuinely target-agnostic.

## Gaps
- ~~The monolith-fallback path~~ — RESOLVED in Fix Round 1 (gate wired, verified).
- Remaining optional: exact-boundary fixtures for the watcher (`sinceMs == stallMs`) and forecast
  (`cum == budget`) strict-`>` thresholds — the preflight leg was fixed; these two were not. LOW,
  no fix cycle warranted.
- Live arms remain operator-owed as pre-authorized (S2 watcher under a real Workflow stall; S3 two-session
  kill/resume; `${CLAUDE_SKILL_DIR}` probe) — each states what the developer PASS does not prove.

## Open Questions
- None. (No sub-80 findings survived self-audit.)

## Carry-Over Findings (from implementation.md — each addressed)
| Carry-over | Disposition |
|---|---|
| F8 `tools/` precedent not on disk (low) | CONFIRMED — pre-wave `find plugins -type d -name tools` → 0; plan Decisions row already amended by the architect at done-check; primary rationale stands. Closed. |
| `${CLAUDE_SKILL_DIR}` probe inconclusive (low) | CONFIRMED as pre-authorized operator-owed; the shipped recipe pins the base-dir announcement, not the env var (verified in §Shipped gate battery). Closed. |
| harness/README increment narrative stale (low) | CONFIRMED — README:5-8 predates the S1.1 graduation; out of Step-1 sweep scope per plan. Non-blocking follow-up for a future README refresh. |
| Foreign F10 files in tree (high, for team lead) | CONFIRMED present (git status this session: docs/architecture/README.md, docs/backlog.md, docs/proposals/skill-gap-miner-2026-07.md, docs/specs/F10-SkillGapMiner/). Not touched by this review. Step-10 bump owner MUST check the dry-run reasons against F7 files only (CLAUDE.md multi-agent bump warning). |
| Bump scope: plugins/** only (medium, team lead) | CONFIRMED — F7's plugin surface is `plugins/nexus/skills/mine-verify-cover/**` (SKILL.md, references/mine-family-core.md, tools/ ×3) + `plugins/nexus/skills/mine-verify-repo/SKILL.md`; harness/tests/docs are dev-repo-only. Plan mandates MINOR. |
| S6 judge is a developer judgment (medium) | RESOLVED by independent re-judge (architect ask 2): I rebuilt the mined-side packet from the 37-rule registry, re-ran `recall-score.mjs --pair` (3 golden × 37 candidates), and judged independently — GOLD-16↔BR-1, GOLD-17↔BR-5 (corroborated by BR-9), GOLD-18↔BR-19/20/21/22 cluster. Recall 3/3 reproduced. Golden text confined to scratchpad; referenced here by GOLD id only. |

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full suite (fresh) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 583 pass, 0 fail, 0 skipped (7.3s) |
| Step-2 accept grep | pass | `grep -nE "^const\s+[A-Z_0-9]+\s+=\s+'D:" harness/*.workflow.js` | 0 hits (was 20/9 files) |
| Step-1 accept #2 | pass | `grep -rn 'D:[\\/]src[\\/]claude-plugins' plugins/nexus/skills/mine-verify-cover/tools/` | 0 hits |
| Step-1 accept #3 + residue | pass | `grep 'BugRatioAnalyzer\|EXPECTED_SURVIVOR\|17, 133, 268'` + `'BugRatio\|Fokus\|sprint-rituals'` over tools/ | 0 hits both |
| Syntax | pass | `node --check` × 19 (9 drivers + mine-verify + 6 libs + 3 shipped tools) | all clean |
| Consuming-repo sim (accept #1 re-run) | pass | fixture script in session scratchpad (outside repo), `import(pathToFileURL(<shipped abs path>).href)` | all 7 gates PASS incl. mutationFloor 75%-floor + caller-exclusion 100%; exports = exactly the 7 binding names |
| Predicate lockstep (architect ask 1) | pass | behavioral battery: 4 copies × 19 fixtures | all agree (pass+reason identical) |
| S6 re-judge (architect ask 2) | pass | `node harness/lib/recall-score.mjs --pair --golden <sequestered path> --ids GOLD-16,GOLD-17,GOLD-18 --consensus <scratchpad>/consensus.json` | 3 pairs × 37 candidates; independent verdicts reproduce recall 3/3 |
| Doc integrity | pass | `grep '^## '` core + pointer greps + `git status` on CHANGELOG/nexus-analytics | both binding headings preserved; superseded text confined to notes; 14 pointer sites resolve; DO-NOT-TOUCH files untouched |
| **Re-review: full suite (fresh)** | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | **587 pass, 0 fail** (583 + 3 preflight boundary + 1 CLI subprocess test; 7.6s) |
| **Re-review: 5-copy lockstep** | pass | behavioral battery, 5 copies × 19 fixtures (loop.workflow.js inline extracted + added) | all agree (pass+reason identical) |
| **Re-review: fix wiring read** | pass | Read `loop.workflow.js:136-158,460-486`, `kickoff-preflight.mjs:28-32`, `stage-watcher.mjs:89-100` + new tests | monolith gate mirrors delegated path; 0/NaN refused; CLI exits 2 on non-numeric |
| **Re-review: syntax** | pass | `node --check` on the 3 changed files | clean |

*Status: COMPLETE — reviewer, 2026-07-18 (initial + fix-round-1 re-review, cycle 1/3)*
