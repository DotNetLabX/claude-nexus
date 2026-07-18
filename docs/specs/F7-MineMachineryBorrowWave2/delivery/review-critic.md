# F7 — Mine Machinery Borrow Wave 2 — Critic Review

> Persisted verbatim by the team lead from the critic's completion message (the critic writes no
> file by design). Critic: Mode 2 plan review, code-grounded, opus. Received 2026-07-18.

## Mode: Plan Review
## Verdict: REVISE

One HIGH (a false-green acceptance gate that leaves two spec-named literals unconverted) and two MEDIUM findings. All are localized and fixable — the plan is otherwise exceptionally well-grounded (every line-pin, all 14 heading-pointer sites, and every ADR citation I checked verified accurate against live source).

## Pre-commitment Predictions (expected vs found)
1. **Line-number pin drift** → *Mostly refuted.* Every pinned anchor I checked is accurate against live source (see matrix) — except the Step 2 grep enumeration.
2. **Step 2 "18 hits" vs spec "~15 siblings" mismatch** → *Confirmed, worse than predicted.* The plan's grep is whitespace-blind and misses 2 aligned-assignment literals → **HIGH-1**.
3. **Step ordering / dependency gaps** → *Partly confirmed.* Step 4's journal dependency is ambiguous and contradicts the plan's own Data Model section → **MEDIUM-1** (S3-before-S5 is correctly pinned).
4. **Heading-preservation bindings (7+7 pointer sites)** → *Refuted (all accurate).* 14/14 pointer sites verified.
5. **S6 external golden files** → *Partly confirmed.* golden-set.md + bug-ratio.md exist; `fokus-spec.md` is unresolvable → **MEDIUM-2**.
6. **ADR-62/5/60/25 fidelity** → *Refuted (all accurate).* ADR-60 genuinely carries the "provably fallible / adversarial fixture" clause the plan cites.

## Cross-reference Matrix
| Spec Requirement | Plan Coverage | Status | Notes |
|---|---|---|---|
| S1.1 ship generalized battery, anti-fake-green invariants intact | Step 1 | COVERED | `targetMutated` (tool-summary cross-check) + `mutationFloor` full-path key confirmed present in the shippable file |
| S1.1 target-agnostic (no BugRatio defaults ship) | Step 1 Accept #3 | COVERED | grep gate for `BugRatioAnalyzer\|EXPECTED_SURVIVOR\|17, 133, 268`; live file has these at :243-248, must be stripped |
| S1.2 parameterize driver path literals (RUNS_DIR + ~15 siblings) | Step 2 | **PARTIAL** | 18/20 bare literals listed; `loop.workflow.js:92` (RUNS_DIR) + `:100` (COVER_SCRIPT) missed — **HIGH-1** |
| S1.3 registry-write evidence gate, all members, feasibility-first | Step 3 | COVERED | `mine-verify.workflow.js:132` (`minLength:1`), `rules-registry.mjs`, `kb-write.mjs` all confirmed to exist |
| S2 mechanized firing + supersede poll statement | Step 4 | COVERED | `mine-verify-repo/SKILL.md:115-122` confirmed = the canonical poll paragraph; "one poll mention" correction verified (grep = 1) |
| S3 run-id journal + cross-session reconcile | Step 5 | COVERED | supersede sentence at `mine-family-core.md:94-95` verified; 7 budget-rail pointer sites verified |
| S4 blocking kickoff preflight, two-tier | Step 6 | COVERED | checklist at `mine-family-core.md:159-174` + label at :173 verified; 7 kickoff pointer sites verified; `mine-algorithm:90` HARD BLOCK verified |
| S5 runway forecast (S3-before-S5) | Step 7 | COVERED | hard ordering pinned; journal dependency declared |
| S6 recall golden set, recall-only | Step 8 | PARTIAL | `recall-score.mjs` (recall-only, no precision/F1) verified; golden-set.md + bug-ratio.md exist; `fokus-spec.md` unresolvable — **MEDIUM-2** |
| Acceptance: evaluate-skill ACCEPT | Step 9 | COVERED | |
| Acceptance: omni back-port confirm + MINOR bump | Step 10 | COVERED | Owner: team lead |
| Non-goals (VWH loop, prose runtimes, N2/N3/N5) | Scope "Out" | COVERED | all three source non-goals mapped |

## Findings

### [HIGH-1] Step 2 acceptance grep is whitespace-blind — two spec-named literals are unlisted and the gate false-greens
**Source:** tech-spec S1.2 (`RUNS_DIR plus the ~15 sibling literals … config-resolved`); plan Step 2 + its Accept.
**Issue:** The plan pins its literal list and its acceptance to the grep `^const [A-Z_0-9]+ = 'D:` — which requires a **single space** around `=`. Two bare dev-repo literals in `loop.workflow.js` use **aligned (multi-space) assignment** and are invisible to it:
```
harness/loop.workflow.js:92:const RUNS_DIR     = 'D:\\src\\claude-plugins\\nexus\\harness\\.runs'
harness/loop.workflow.js:100:const COVER_SCRIPT       = 'D:\\src\\claude-plugins\\nexus\\harness\\cover.workflow.js'
```
The plan's grep returns 18 hits; a whitespace-tolerant grep returns **20** (evidence: I ran both). `loop.workflow.js` actually has **four** bare literals (`:69` SR, `:92` RUNS_DIR, `:99` MINE_VERIFY_SCRIPT, `:100` COVER_SCRIPT) — the plan lists only two (`:69, :99`). Neither miss is covered by the plan's transitive-resolution clause: `RUNS_DIR:92` is an independent base const (`RUNNER_RESULT:93` interpolates it) and `COVER_SCRIPT:100` is a bare script path — neither is `${SR}`/`${NEXUS}`-derived. Notably `:100` (COVER_SCRIPT) is the adjacent twin of the listed `:99` (MINE_VERIFY_SCRIPT), differing only in alignment whitespace.
**Impact:** Two-fold. (1) A spec-named requirement — RUNS_DIR parameterization — is left unmet in one of the plan's own 9 drivers, so `loop.workflow.js` retains hardcoded dev-repo paths as a "consuming-repo authoring template" (the exact hygiene S1.2 exists to fix). (2) The acceptance re-runs *the same blind grep*, so it returns "0 hits" and **passes even while `:92`/`:100` stay bare** — a silent false-green the developer and reviewer would trust.
**Suggestion:** Add `loop.workflow.js:92` (RUNS_DIR) and `:100` (COVER_SCRIPT) to the Step 2 list (18→20). Change both the enumeration grep and the acceptance grep to a whitespace-tolerant form (e.g. `^const [A-Z_0-9]+ +=[^=].*'D:` or scan `'D:\\\\`) so aligned assignments are caught.

### [MEDIUM-1] Step 4 (S2) watcher's state source is ambiguous and contradicts the plan's own Data Model section
**Source:** plan Step 4 Accept (`sim-level node test over journal/stage state`) vs plan `## Data Model Changes` (journal `consumed by Steps 5 and 7`).
**Issue:** The Data Model section says the Step-5 journal is "consumed by **Steps 5 and 7**" — not Step 4. Yet Step 4's acceptance tests "over journal/stage state." Either (a) the S2 watcher reads Workflow's own live run/stage state and "journal" is loose wording, or (b) it reads the Step-5 journal — which would create an **undeclared Step 4 → Step 5 dependency** while the plan orders Step 4 *before* Step 5 and declares only Step 7 as journal-dependent. The spec's S2 (firing a stalled stage, same-session) and S3 (journal, cross-session resume) are orthogonal — nothing in the spec says the S2 watcher consumes the journal.
**Impact:** A developer can't tell what state the watcher operates over, nor whether Step 4 must wait on Step 5. Under interpretation (b) the declared step order is inverted; under (a) the sim test may validate against a journal shape the live (operator-owed) watcher never uses.
**Suggestion:** State explicitly whether the S2 watcher reads Workflow run/stage state or the S3 journal. If the journal, add Step 4 to the "consumed by" list and note the Step 5→Step 4 ordering; if Workflow state, drop "journal" from Step 4's Accept wording.

### [MEDIUM-2] Step 8 golden-curation leg 3 (`fokus-spec.md §Bug Ratio`) names an unresolvable file
**Source:** plan Step 8 (`… and \`fokus-spec.md\` §Bug Ratio — NOT from the harness-mined registry`).
**Issue:** Two of three legs are precisely pinned and exist (`D:\src\sprint-rituals\docs\audit\golden-set.md`, `…\docs\kb\bug-ratio.md` — both confirmed present). The third, `fokus-spec.md`, **does not exist at any path** (verified via find/glob); the Fokus product spec lives at `D:\src\sprint-rituals\docs\product\fokus\{index,v1,v2}.md`. "fokus-spec.md" is an established *provenance citation* (it appears verbatim at `bug-ratio.md:74` and in questions.md Q1), so the plan didn't invent it — but it is not a resolvable path, and the plan doesn't disambiguate which version (v1/v2/index) carries "§Bug Ratio."
**Impact:** Leg 3's spec text partly defines the golden known-rules list, hence the recall denominator. A developer guessing v1 vs v2 could produce a different recall figure — a reproducibility gap in the run's evidence. It also violates the plan's own clean-room "reference by path + GOLD ids only" discipline, since the path is unresolvable.
**Suggestion:** Pin the resolvable path + version for the fokus §Bug Ratio leg (likely `docs/product/fokus/v2.md`, to be confirmed by the owner), or state that `bug-ratio.md §Source` already subsumes the fokus provenance and drop leg 3 as redundant.

## Gap Analysis
- **Step 1 stale-pointer sweep — enumeration vs re-grep.** The plan pins the four `SOURCE OF TRUTH:` comment lines (`cover.workflow.js:58`, `loop.workflow.js:139`, `spec-cover.workflow.js:217`, `spec-cover-calc.workflow.js:210`) + `README.md:23,26,35` — all verified accurate. There are additional descriptive `cover-gates.mjs` references ("Copied VERBATIM … keep in sync": `cover.workflow.js:61,140,278`, `loop.workflow.js:136,191`, etc.) that the plan's Scope deliberately leaves untouched. This is a conscious, disclosed scoping (only SOURCE-OF-TRUTH lines update), and Step 1 instructs a full `grep cover-gates across harness/`, so the developer re-discovers rather than relying on the pinned list. **Not a finding** — noted for completeness.
- **Pre-existing inlined-copy drift (out of scope).** `cover.workflow.js:150-153`'s inlined `targetMutated` carries a `strayMutatedFiles` detail the lib version lacks — the "Copied VERBATIM" comment is already slightly stale. The plan explicitly leaves inlined copies untouched (Scope DO-NOT-TOUCH), so this is pre-existing harness state, **not this plan's concern**.
- **No missing spec requirement otherwise.** Every S1–S6 requirement, every acceptance item, and all three non-goals map to a plan step. Operator-owed live arms (S2 missed-completion, S3 cross-session, `${CLAUDE_SKILL_DIR}` probe) are properly disclosed as `Deviated (valid reason)` with each step stating what a developer PASS does not prove.

## Strengths (noted so the architect can preserve them)
- The "one poll mention" grounding correction (Decisions row) correctly overrides the spec's stale "two mentions" with grep evidence — I independently confirmed exactly one (`mine-verify-cover/SKILL.md:107-108`).
- The S6 circular-oracle guard (curate from independent legs, never the mined registry) is a sound strengthening beyond the spec, grounded in Q1 research.
- Step 6c's vacuous-negative trap (prove the registry-check path is reachable *and* skipped, not merely absent) correctly applies the family-core skeptic §vacuous-evidence discipline.
- `## Decisions` is non-silent (8 rows) — silent-decision hygiene satisfied.

## Open Questions
- **MEDIUM-2 version disambiguation** is a PO/owner call (which Fokus spec version is the frozen Bug Ratio source) — flag to the owner, not resolvable by the developer alone.

---

Reviewed: docs/specs/F7-MineMachineryBorrowWave2/delivery/plan.md
