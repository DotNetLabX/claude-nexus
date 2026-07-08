# Mine→Verify→Cover — PHP adapter — Review

## Step 1 — Done-Check

**Scope of this pass:** the deterministic/offline block **{1, 3, 4, 5} ONLY**, per the Q1
ratification (`delivery/questions.md` → Q1 "### Answer", architect owner-delegated). Steps {2, 6, 7}
are operator-owed (Workflow runtime + live LLM spend); Steps {8, 9} are deferred to a post-run
developer resume. Those five are **out of this pass's scope by design — not Missing.**

**Pre-commitment predictions (made before reading implementation.md):** (1) the biggest risk is
Step 3's translation seam / Step 5's fixtures being authored against *inferred* JSON keys if the
Docker probe was network-blocked (Q1's fail-closed guard); (2) Step 3's "byte-identical gate battery"
being a drift rather than the sanctioned per-language delta; (3) Step 3's literal `model: 'sonnet'`
grep acceptance not matching the actual `MODEL`-default fork pattern. **All three verified against
source — none is a gap** (probe genuinely ran with observed keys; delta is the sanctioned disable-regex
swap; the Sonnet pin is present via the `MODEL` default).

### Step dispositions

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Toolchain probe + vendored workspace assets | **Deviated (valid reason)** | Assets present (`harness/php/` Dockerfile + composer/phpunit/infection templates + seed test); `probe-report.md` records the **observed** Infection JSON group-key arrays, `stats` object, per-mutant fields; positional-pin proven (45 mutants, 1 file, 0 strays); PCOV confirmed as the active driver. Deviation: the bind-mount I/O tax caused 45/45 false timeouts on the first pass — root-caused via the `diagnose` skill (log-corroborated) and fixed by running on the container native fs (`cp -r /work /native`), yielding the genuine 21-Killed/24-Escaped map. This added a native-fs requirement the plan did not anticipate; documented across probe-report.md, the contract, the workflow runner prompt, and the Dockerfile. Faithful execution of the Step-1 intent ("convert read-docs facts to ran-it facts"), not a scope change. Accept met. |
| 2 — Mine→Verify target #1 → KB | **Deferred / operator-owed** | Out of scope by Q1. `Owner: operator` (Workflow tool — absent from a developer subagent). Not Missing. |
| 3 — Author `cover-php.workflow.js` (thin fork) | **Deviated (valid reason)** | `harness/cover-php.workflow.js` created. `meta` is a pure literal (:41). Gate battery byte-copied from `cover.workflow.js`; the only live delta is the sanctioned per-language `PHP_DISABLE_RE` (:157) — the lone `STRYKER_DISABLE_RE` occurrence (:155) is a comment, not a live ref (the sandbox test executing the body ruled out an undefined-ref). `INFECTION_STATUS_MAP` (:219-229) matches the probe-observed map exactly, incl. the two groups the research had NOT enumerated (`killedByStaticAnalysis`→Killed, `syntaxErrors`→CompileError — critic L-2). Two acceptance lines met by equivalent-not-literal mechanisms, both disclosed: (i) "empty diff" is a 2-line sanctioned delta (const + its one `charPin` ref); (ii) the literal `model: 'sonnet'` grep matches only the `MODEL` default (:246) — the Sonnet pin is present and `model: MODEL` is on both agent() calls (:465, :468), same as cpp/flutter (L-1 carry-over for the reviewer). Additive: a `mutationSummary` + a loop-body translation cross-check (outside the gate battery), serving Step 5's offline-validation mandate for the seam. |
| 4 — PHP test-style + runner contract | **Implemented** | `harness/php/cover-php-contract.md` created (9.1 KB): 5-capability fill, native-fs host reality, workspace layout, PHPUnit-12/eris/Pest-compatible test style, invariant-first assertion rules, equivalent-mutant hygiene, timeout policy, Infection→gate translation summary, run invocation. |
| 5 — EXTEND + run the offline guard | **Implemented** (+ disclosed additive test) | Three named edit sites present in `tests/unit/workflow-contract.test.mjs`: `COVER_PHP_PATH` (:29), the `['cover-php', COVER_PHP_PATH]` entry in the shared meta-purity/static-import loop (:1616), the `cover-php runs in sandbox` slice (:1535) with PHP-shaped translated fixtures asserting gate-battery reuse + equivalent-mutant filter + translation cross-check. Additive second test (mismatch HALT, :1566) — same slice section, serves Step 5's seam-guard goal. **Acceptance re-run fresh: `node --test tests/unit/workflow-contract.test.mjs` → 64/64 pass, 0 fail** (cover-php slice present and passing). |
| 6 — Live Cover run #1 | **Deferred / operator-owed** | Out of scope by Q1. `Owner: operator` (Workflow + live spend). Not Missing. |
| 7 — Live Cover run #2 + land deliverables | **Deferred / operator-owed** | Out of scope by Q1. `Owner: operator` (Workflow + live spend). Not Missing. |
| 8 — Ship `nexus-php` | **Deferred (post-run resume)** | Out of scope by Q1. Gated on Step 7 GO; SKILL.md must carry the probe-observed map + live-run lessons (critic L-2), which do not exist until the runs happen. Mapped `release-plugin` fires in that resume. Not Missing. |
| 9 — Run report close-out | **Deferred (post-run resume)** | Out of scope by Q1. Reports run outcomes; follows the runs. Not Missing. |

### Skill-conformance check (scored against `.claude/audit/skill-invocations.log`)

- **All in-scope steps {1,3,4,5} map `Skill: None`** — the **all-`None` exemption** applies; an empty
  pattern-skill log for these steps is not a Fail. Step 8's mapped `release-plugin` correctly does **not**
  appear (Step 8 deferred).
- **`## Skills Used` section present** (structural requirement met).
- **The one self-reported invocation is corroborated, not fabricated:** implementation.md reports
  `diagnose` at Step 1; the log carries `{"agent":"developer","skill":"diagnose","token":"developer:implement","session":"9f6c29dc-…"}`
  — session-matched to this run. Legitimate reactive use (root-causing the probe anomaly). **No fabrication.**

### Plan-hygiene note (self-attributed — non-blocking, does not change any disposition)

The plan (my artifact) discloses its four self-resolved architect calls under `## Open Questions`
("Defaults taken: workspace-copy isolation, PHPUnit+eris, Docker host, timeout-as-killed") rather than
in the canonical `## Decisions` section (a row set OR the explicit `None …` sentinel). The disclosure
**substance** (decision · why · reversibility) is present; only the canonical section **form** is absent.
Recorded per the done-check's plan-hygiene rule; it does **not** Fail the developer and does **not** alter
any step disposition or the verdict. (Logged as an architect lesson.)

### Scope / files

No scope creep. Tracked-eligible additions are exactly the intended deliverables: `harness/php/`
(Dockerfile, composer.json.template, phpunit.xml.template, infection.json5.template,
examples/ seed test, cover-php-contract.md), `harness/cover-php.workflow.js`, and the modified
`tests/unit/workflow-contract.test.mjs`. The 4962-file `harness/php/workspace/` (vendor tree + logs)
is confirmed **git-ignored** — not tracked.

**Verdict: PASS** (in-scope block {1, 3, 4, 5}). All in-scope steps are Implemented or Deviated with
valid, documented reasons; no step is Missing. Steps {2, 6, 7} are the operator's next action (Workflow
+ live spend); Steps {8, 9} follow in a post-run developer resume.

**Downstream note for the reviewer (Step 2):** implementation.md carries four Carry-Over Findings for a
**code-grounded** review of the live seam — most explicitly tagged for the Step-8 code-grounded pass
(the runner's live `mutationSummary`↔translated-array consistency; the probe-observed status map baked
into the shipped SKILL.md; the `MODEL`-default Sonnet pin). The plan already mandates a mandatory
code-grounded review at Step 8; whether a Step-2 review of the offline block runs now or folds into that
Step-8 pass is the team lead's routing call.

*Status: COMPLETE — architect, 2026-07-07*

## Step 2 — Code Review

## Reviewed By
reviewer (Step 2, cycle 1/3 — **re-review after developer fixes**). Scope unchanged: the
deterministic/offline block **{1, 3, 4, 5} ONLY**, per the Q1 ratification
(`delivery/questions.md`). Steps {2, 6, 7} (operator live runs) and {8, 9} (ship/close-out) remain
out of scope by design.

This cycle verifies the fix-list from the **consolidated** review round (my cycle-1 findings merged
with an independent Codex cross-check). The merge itself carried the verdict to REQUEST CHANGES
because the cross-check rated the composer version constraint HIGH — a stricter read of the same
fact my cycle-1 pass had flagged only as a 55/100 Open Question (F1 below). I re-verify all four
fix-list items myself in this pass rather than accepting the developer's "verified" column at face
value.

## Verdict: APPROVED

## Pre-commitment Predictions (this cycle)
1. F1 (the version pin) would be the one fix worth the most scrutiny, since it's the item where my
   own cycle-1 read (55/100, "likely fine") diverged from the converged verdict (HIGH). — **Checked
   directly against `composer.lock`** rather than re-trusting either prior read: the pin now matches
   the actually-installed version, so the divergence is resolved by the fix, not by re-litigating who
   was right.
2. F2's new `CompileError` fixture might satisfy the letter of my finding (an entry with that status
   exists) without actually proving the denominator-exclusion property (e.g., asserting count-3 total
   without a `reachableDenominator` assertion). — **Not found**: the fix adds the exact assertion my
   finding asked for (`reachableDenominator === 1`), not just a cosmetic fixture entry.
3. F3/F4 (Codex's LOW findings) being cosmetic, I expected no interaction with the gate-battery logic
   or the offline suite's pass count beyond +1 test. — **Confirmed**: both are additive/textual; the
   gate-battery diff re-derivation (below) shows no unintended logic drift from the F4 comment trim.
4. Adjacent-regression risk: bumping `mutationSummary.total`/`mutatedFiles.count` in the F2 fixture
   could silently break the *other* `cover-php` slice (the mismatch-HALT test) if the edit had bled
   across slices. — **Not found**: the HALT test's fixture (`:1571-1590`) is untouched and still
   independently correct (own total=3, own mutants of length 2, still HALTs as before).

## Fix Verification (cycle 1)

| Finding | Verified? | Evidence |
|---------|-----------|----------|
| F1 HIGH — `infection/infection` unconstrained (`"*"`) | **Fixed, verified.** | `harness/php/composer.json.template:15` and `harness/php/workspace/composer.json:7` both now read `"infection/infection": "^0.34"`. Cross-checked against the actual installed version: `node -e` parse of `harness/php/workspace/composer.lock` confirms `infection/infection 0.34.0` — `^0.34` is satisfied by the version the probe actually observed, not a guess. The pin-moves-with-map rule is documented in **both** places the finding asked for: the template's `//4`–`//8` comment block AND `harness/php/cover-php-contract.md:18-24` ("The version pin moves together with the observed map (reviewer F1)"). |
| F2 MEDIUM (mine) — no `CompileError`-status fixture | **Fixed, verified.** | `tests/unit/workflow-contract.test.mjs:1544-1553` adds a third mutant (`status: 'CompileError'`, line 99, mutator `ArrayItemRemoval`) to the happy-path `cover-php` slice; `mutationSummary.total`/`syntaxError` and `mutatedFiles.count` bumped to 3 to keep the cross-check consistent. Line 1566 adds the exact assertion my finding asked for: `assert.equal(result.gates.mutation_floor.detail.reachableDenominator, 1, ...)` — proving the CompileError entry is enumerated (counts toward the anti-fake-green total) but excluded from scoring. I traced the gate math by hand: `DENOMINATOR_STATUSES` excludes `CompileError`, so only the one `Killed` entry reaches the denominator (the `Survived` entry at line 47 is separately excluded via `expectedSurvivorLines`) — `reachableDenominator=1` is the correct value, not a coincidental pass. |
| F3 LOW — no direct `cover-php` static-import test | **Fixed, verified.** | `tests/unit/workflow-contract.test.mjs:1628` adds `test('cover-php.workflow.js has no static import (joins the shared contract loop)', ...)`, same phrasing/style as the existing spec-cover/spec-cover-calc/merge direct assertions at the same site. |
| F4 LOW — `PHP_DISABLE_RE` comment longer than the cpp precedent | **Fixed, verified.** | `harness/cover-php.workflow.js:153-155` is now a 2-line comment + const, matching `CPP_DISABLE_RE`'s 2-line shape at `harness/cover-cpp.workflow.js:128-130` exactly in structure. Re-ran my own gate-battery diff (see Evidence) — still only the sanctioned disable-regex delta, now tighter (3 changed lines in the first hunk vs. 5 before the fix). |

No new findings from this cycle's investigation. **F1's severity convergence is now moot** — the
constraint is pinned to the exact probed/installed version, closing both my original Open Question
and the cross-check's HIGH.

## Findings

None open. (Cycle-1's sole MEDIUM — F2 above — is resolved and verified, not merely accepted on the
developer's word.)

## Positive Observations
- **F1's fix over-delivers on disclosure**: the pin-moves-with-map rule is written out in full in
  *two* independent places (template comment + contract doc section), not just the minimum "add a
  comment" the finding could have been read as satisfying.
- **F2's fix adds the exact assertion, not just a fixture entry.** It would have been easy to add a
  `CompileError` mutant to the array without asserting anything new about it (satisfying "a
  CompileError entry exists" while leaving the denominator-exclusion property unproven). The developer
  added the `reachableDenominator === 1` assertion specifically — the property my finding cared about,
  not just its surface form.
- **No adjacent regressions from any of the four fixes.** The mismatch-HALT test, the meta-purity
  loop, and the rest of the 65-test file are all untouched outside the four fixes' exact scope —
  confirmed by re-running the full suite fresh (below) rather than assuming isolation.

## Gaps
- The `killedByStaticAnalysis → Killed` mapping remains structurally-observed-but-not-functionally-
  exercised (0 elements in the actual probe run) — unchanged from cycle 1, not addressed by this fix
  cycle (it wasn't in the fix-list), and still not a blocking gap: honestly represented in
  probe-report.md, worth watching if Steps 6/7's live runs also happen to produce zero
  static-analysis kills.
- No offline test pins the `mutationFloor` percentage boundary (`>= 75`) specifically for the PHP
  fork — unchanged from cycle 1; still acceptable since `mutationFloor` is verbatim shared logic
  already exercised elsewhere in the suite.

## Open Questions
None. The one cycle-1 Open Question (the unconstrained `infection/infection` constraint) is resolved
by F1's fix, not merely deferred — closing it rather than carrying it forward.

## Carry-Over Findings (from implementation.md) — unchanged this cycle, still tracked

These four are forward-looking carry-overs for Steps 6–8 (operator live runs / Step-8 ship review);
this fix cycle touched none of the code they concern, so my cycle-1 dispositions stand unchanged:

| Title | Disposition |
|-------|-------------|
| Native-fs run is mandatory or Infection false-times-out every mutant (HIGH, for operator Steps 6/7) | CONFIRMED in cycle 1 (`probe-report.md`, `Dockerfile:13-21`, `cover-php.workflow.js:401-411`, `cover-php-contract.md:18-29`). Unaffected by this fix cycle. |
| Step-8 SKILL.md must use the probe-OBSERVED status map (MEDIUM, for developer Step 8 resume) | CONFIRMED in cycle 1. Unaffected by this fix cycle. |
| Cross-check is the seam's only anti-fake-green guard (MEDIUM, for reviewer Step 8 code-grounded review) | CONFIRMED in cycle 1, with the `CompileError`-coverage refinement — **that refinement is now resolved by F2's fix** (see Fix Verification above), so this carry-over's one open edge is closed for the offline layer; the live-data half (Step 8) still stands as originally carried. |
| `model: 'sonnet'` acceptance is via `MODEL` default, not literal on agent calls (LOW, for reviewer) | CONFIRMED in cycle 1. Unaffected by this fix cycle. |

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Offline guard (in-file) | pass | `node --test tests/unit/workflow-contract.test.mjs` | `tests 65 / pass 65 / fail 0` (fresh run, this re-review; up from 64 — F3's new test) |
| Offline guard (full CI glob) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `tests 488 / pass 488 / fail 0` (fresh run, this re-review; matches implementation.md's self-reported 488/488) |
| Syntax check | pass | `node --check harness/cover-php.workflow.js` | `syntax OK` |
| F1 pin cross-check (independent) | pass | `node -e "…JSON.parse(fs.readFileSync('harness/php/workspace/composer.lock'))…"` looking up `infection/infection` | `infection/infection 0.34.0` in both `packages-dev` entries — satisfies the new `^0.34` constraint in both `composer.json.template` and the workspace `composer.json` |
| F1 contract-doc cross-check (independent) | pass | `grep -n -i "pin\|0.34" harness/php/cover-php-contract.md` | Confirms the "version pin moves together with the observed map (reviewer F1)" section at `:18-24` |
| F2 fixture logic (independent hand-trace) | pass | Read `tests/unit/workflow-contract.test.mjs:1535-1569` + `harness/cover-php.workflow.js:82-127` (`mutationFloor`) | Traced by hand: `Killed`(57) → denominator; `Survived`(47) → excluded via `expectedSurvivorLines`; `CompileError`(99) → excluded via `DENOMINATOR_STATUSES` filter. `reachableDenominator=1`, `achievedScore=100` — matches the fixture's asserted values exactly |
| Gate-battery diff (independent re-derivation, post-F4) | pass | `sed -n '64,205p' harness/cover.workflow.js` vs `sed -n '59,202p' harness/cover-php.workflow.js` then `diff` | Only the `STRYKER_DISABLE_RE`→`PHP_DISABLE_RE` const (now a 2-line comment, matching cpp's shape) + its one `charPin` reference differ — still exactly the sanctioned per-language delta, tighter than cycle 1 |
| F3 static-import test (independent) | pass | `grep -n "has no static import" tests/unit/workflow-contract.test.mjs` | `cover-php.workflow.js has no static import (joins the shared contract loop)` present at `:1628`, matching the sibling tests' phrasing |

*Status: COMPLETE — reviewer, 2026-07-07*

## Step 1 — Done-Check (Steps 8-9)

**Scope of this pass:** Steps **8** (ship `nexus-php` + wiring + bump) and **9** (close-out:
roadmap/KB/lessons) **ONLY** — the deferred ship + close-out block, resumed post-run per the Q1
ruling. The deterministic block {1,3,4,5} already passed its own done-check + dual review and is
committed (`f4f3c07`); the operator batch {2,6,7} ran live (outcomes in the fmcg_platform
`mvc-report.md`). This section does **not** re-adjudicate {1..7}. Per the resume note, this is a
**step-level completeness/disposition** check; the **MANDATORY code-grounded verification** of the
new SKILL.md (every command/version/path/JSON key vs `probe-report.md` + `mvc-report.md` +
`cover-php.workflow.js`) is the Step-2 reviewer's job that follows.

**Pre-commitment predictions (made before verifying):** (1) Step 8's acceptance names a *ship commit*
(`git show --stat`), but the developer intentionally leaves everything UNCOMMITTED for the mandatory
review — so the commit-shaped acceptance can't literally verify here; the 7 file groups must be
confirmed as working-tree changes instead. (2) Step 8's mandatory code-grounded review + "verdict
recorded in review.md" is the Step-2 reviewer's downstream job — pending, not a done-check gap. (3)
Two harness edits (`cover-php.workflow.js` residue, `mine-verify.workflow.js` cosmetic fix) reach
beyond the plan's named Step 8-9 files — scope-creep check needed. **All three confirmed as
predicted:** HEAD is still `f4f3c07` (ship uncommitted by design); all 7 groups present in the
working tree; both harness edits are disclosed deviations with valid reasons (not silent creep).

### Step dispositions

| Step | Disposition | Notes |
|------|-------------|-------|
| 8 — Ship `nexus-php` (+ wiring + bump) | **Deviated (valid reason)** | All seven named file groups + the core-skill edit present as working-tree changes: `plugins/nexus-php/` (untracked) — `plugin.json` **0.1.0** ✓, `CHANGELOG.md` **[0.1.0]** ✓, `mine-verify-cover-php/SKILL.md` ✓, `toolchain/{Dockerfile, composer.json.template, phpunit.xml.template, infection.json5.template}` (4/4) ✓; `marketplace.json` `nexus-php` entry (:28-29) ✓; `gen-omni.mjs` `mirrorDir` (:97) **+** `wantPlugins` `omni-php` (:114) ✓; `gen-omni.test.mjs` SKILL seed (:32) **+** `deepEqual` `omni-php` (:56) ✓; core `mine-verify-cover/SKILL.md` 4 PHP mention sites ✓; `nexus` `plugin.json` **1.25.1** (PATCH) ✓ + `CHANGELOG.md` [1.25.1] entry ✓. `release-plugin` (plan-mapped Follow) is in `skill-invocations.log`, session-matched to this run (`9f6c29dc…`, `agent:developer`, `token:developer:implement`). Four disclosed deviations, all valid: (a) reverted `bump-plugin.mjs`'s new-plugin over-bump `0.1.1→0.1.0`; (b) `wantPlugins` companion beyond the plan's named `mirrorDir` (necessary — else the mandated `deepEqual` extension fails); (c) toolchain comment-refs neutralized to the SKILL.md (comments only, build instructions byte-identical); (d) `mine-verify` `target.class` cosmetic fix (4-line pure helper, offline-guard green). **The commit-shaped acceptance (`git show --stat` of the ship commit) is intentionally NOT met by a commit** — HEAD is still `f4f3c07`; the developer leaves it UNCOMMITTED for the plan's mandatory code-grounded review (Step 8:111) + the team-lead ship commit (developer never commits). Groups verified present in the working tree instead. Accept met at the developer's owned boundary. |
| 9 — Run report close-out + roadmap/KB + lessons | **Implemented** | `roadmap.md` names the PHP adapter with its verdict (SHIPPED `nexus-php` 0.1.0; both run verdicts + kill scores) and costs vs the .NET/Flutter/C++ baselines, plus the in-repo/Pest variant as named future work (:147-181) ✓. `docs/kb/research/php-mutation-and-test-tooling.md` Q1 block updated with a **RESOLVED BY OBSERVATION** note (supersede, not delete — plan KB Impact) capturing the probe-observed keys incl. `killedByStaticAnalysis`/`syntaxErrors` and the `uncovered` correction (:36-43) ✓. `lessons.md` exists with **both** named findings: translation-seam (Infection array-key encoding + observed-not-inferred map, :85-103) **and** unlike-target (Target #2's contradicted dependency surface, architect lesson :18-22) ✓; plus architect/developer/reviewer sections + improvement proposals. `mvc-report.md` finalized in fmcg_platform (REFUSED-honest verdict, 6-gate tables, survivor classification, costs) ✓. |

### Skill-conformance check (scored against `.claude/audit/skill-invocations.log`)

- **Step 8 maps `release-plugin` (Follow)** — present in the log, session-matched to this run
  (`{"ts":"2026-07-08T03:23:19.960Z","agent":"developer","skill":"release-plugin","token":"developer:implement","session":"9f6c29dc-416d-44d4-974f-fe0369e714bb"}`).
  Matched on the final segment (`release-plugin`). **Not missing, not fabricated.**
- **Step 9 maps `Skill: None`** — the all-`None` exemption applies; no skill expected. The close-out
  is docs-only (roadmap/KB/lessons).
- **`## Skills Used (Steps 8-9)` section present** (structural requirement met). The one non-`release-plugin`
  self-report is "None" for the harness edits + Step 9 — consistent with the log.

### Scope / additive files

Two code edits reach **beyond** the plan's named Step 8-9 file set — both disclosed as deviations
with valid reasons, neither silent creep:
- `harness/cover-php.workflow.js` — target-#1 residue cleanup (neutralized `CalculateReferencePeriod`/
  `Carbon`-flavored example arithmetic in the Cover prompt). This operationalizes Step 7's "zero
  target-#1 prompt edits remaining" acceptance; disclosed, self-reported as no gate-battery/logic change.
- `harness/mine-verify.workflow.js` — `target.class` cosmetic-defect fix (mvc-report incident 2); the
  resume brief offered "document or fix if trivial", a 4-line pure helper, all offline-guard tests green.

Untracked `delivery/kb-calculate-reference-period.md` + `kb-select-stratified-sample.md` are the
operator batch {2,6,7} KB deliverables (out of Steps 8-9 scope — not creep). No unexpected scope.

**Verdict: PASS** (Steps 8-9). Both steps are Implemented / Deviated with valid, documented reasons;
no step is Missing. Two gates remain downstream **by design**: the Step-8 MANDATORY code-grounded
review of the new SKILL.md (Step-2 reviewer) and the team-lead ship commit (nexus + the mirrored omni
twin — the developer never commits).

**Downstream note for the reviewer (Step 2 on this block):** the mandatory code-grounded review must
verify **every** command/version/path/JSON key in `plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md`
against `probe-report.md` + the fmcg_platform `mvc-report.md` + `harness/cover-php.workflow.js` — not a
doc-only pass — and must **additionally** cover the two harness code edits above (`cover-php.workflow.js`
residue, `mine-verify.workflow.js` `target.class` fix), which are code changes outside the earlier
{1,3,4,5} review scope. The Step-8 acceptance line "review verdict recorded in review.md" is satisfied
by that Step-2 section, not by this done-check.

*Status: COMPLETE — architect, 2026-07-08*

## Step 2 — Code Review (Steps 8-9)

## Reviewed By
reviewer (Step 2, cycle 1/3 — first pass on this block). Scope: Steps **8** (ship `nexus-php` + wiring
+ bump) and **9** (close-out) ONLY. This is the plan's **MANDATORY code-grounded review** (plan.md
Step 8:111) — every command, version, path, and JSON key in the new
`plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md` is checked against the live artifacts
(`delivery/probe-report.md`, the fmcg_platform `delivery/mvc-report.md`, `harness/cover-php.workflow.js`),
plus the two harness code edits outside the earlier {1,3,4,5} review scope (`cover-php.workflow.js`
residue cleanup, `mine-verify.workflow.js` `classFromSource` fix) and the wiring completeness.

## Verdict: APPROVED

## Pre-commitment Predictions (this cycle)
1. The biggest risk is the SKILL.md's Infection status map being copied from the plan's pre-commitment
   table (missing `killedByStaticAnalysis`/`syntaxErrors`) instead of the probe-observed one — critic
   L-2's exact concern. — **Not found**: `SKILL.md:74-88`'s table is byte-consistent with
   `probe-report.md`'s observed map, including both groups the plan's table omits.
2. The wiring (marketplace.json, gen-omni.mjs, gen-omni.test.mjs, core SKILL.md four sites) is the kind
   of multi-file mechanical edit that's easy to get 3-of-4 on. — **Not found**: all four core-skill sites
   present, both gen-omni.mjs sites present (`mirrorDir` + `wantPlugins`), gen-omni.test.mjs seed +
   deepEqual both present, `--check` reports the omni twin in sync.
3. The two "outside-scope" harness edits (cover-php prompt neutralization, mine-verify `classFromSource`)
   are more likely to be under-tested than the ship files themselves, since they're framed as small
   drive-by fixes. — **Confirmed for one of the two**: the prompt neutralization is comment/wording-only
   and provably outside the gate battery (diff re-derivation below); but `classFromSource`'s actual new
   derivation behavior (deriving a class name from a non-default `src` when no `targetClass` is given) has
   **no offline-guard test** — see F2 below.
4. Numbers restated in the SKILL.md (kill percentages, mutant counts, assertion counts) are a likely spot
   for transcription drift from `mvc-report.md`. — **Not found**: 89%/51-57, 88%/152-173, the
   `known-bug`/cross-suite-contamination 93/93/657-assertion figure, and the `Xoshiro256StarStar` /
   `SamplingDimensionsData` five-bool collaborator details all trace exactly to `mvc-report.md` and
   `kb-select-stratified-sample.md`.

## Findings

### [MEDIUM] SKILL.md's landed-suite filename pattern contradicts both itself and the observed run
**File:** `plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md:128` (vs. `:44`)
**Origin:** implementation
**Issue:** The "Run artifacts" section states the gated suite lands at
`tests/Unit/MineCode/<Class>Test.php` — i.e., implying the `Harness` infix is dropped when the suite is
copied into the consuming repo. This contradicts two things: (1) the SKILL.md's **own** "Toolchain
bringup" section at `:44` ("the Cover agent writes `<Class>HarnessTest.php` here"), and the runner's
`COVER_TEST` write target in `harness/cover-php.workflow.js:261`
(`` `${HOST_WS}\\tests\\${TARGET_CLASS}HarnessTest.php` ``) — the Cover agent's write target is a
non-negotiable ("YOUR ONLY WRITE TARGET", `cover-php.workflow.js:358-359`), always suffixed
`HarnessTest.php`. (2) The **actual observed landing**: `mvc-report.md`'s "Suite landing" section
explicitly instructs "copy the two harness test classes from
`nexus/harness/php/workspace/tests/*HarnessTest.php` into `tests/Unit/MineCode/`" (no rename), and the
Postscript confirms the landed files kept the `HarnessTest` suffix. I verified this directly against the
consuming repo's filesystem: `tests/Unit/MineCode/CalculateReferencePeriodActionHarnessTest.php` and
`tests/Unit/MineCode/SelectStratifiedSampleActionHarnessTest.php` — both retain `HarnessTest`, neither
matches the `<Class>Test.php` pattern the SKILL.md documents as the deliverable's path.
**Fix:** Change `SKILL.md:128`'s bullet to `tests/Unit/MineCode/<Class>HarnessTest.php`, matching both
the SKILL.md's own workspace-layout claim and the two live landings.
**Confidence:** 90/100

### [MEDIUM] No offline-guard test exercises `classFromSource`'s actual new behavior
**File:** `harness/mine-verify.workflow.js:51-54` (the new `classFromSource` helper); `tests/unit/workflow-contract.test.mjs`
**Origin:** implementation
**Issue:** The fix (mvc-report incident 2) makes `target.class` derive from the source basename via
`classFromSource(SRC)` when no explicit `targetClass` arg is given, instead of always reporting
`'BugRatioAnalyzer'`. I confirmed the derivation itself is correct by hand-tracing the regex against
three inputs (the `.cs` default, and both PHP proof-run source paths — all three derive the expected
class name). But grepping `tests/unit/workflow-contract.test.mjs` for every `mine-verify`-targeting test
shows only three shapes are exercised: (a) explicit `targetClass` passed (string-args and object-args
tests, `:248-263`), (b) `null` args → the `.cs` default path, asserted **only on `.target.source`**, never
`.target.class` (`:265-269`), and (c) the verify-failed halt test, which also passes an explicit
`targetClass` (`:284`). **No test passes a non-default `src` with no `targetClass`** — the exact shape
`classFromSource` was added to handle, and the shape a direct (non-`loop`-composed) Mine→Verify-only
invocation would hit (every `loop*.workflow.js` composer forwards `targetClass` explicitly, so this path
is reachable only via a standalone Workflow-tool call). The new behavior is correct but unverified by the
regression suite.
**Fix:** Add one offline test: `runInSandbox` with `{ src: '<custom>/SelectStratifiedSampleAction.php' }`
(no `targetClass`) and assert `result.target.class === 'SelectStratifiedSampleAction'`.
**Confidence:** 85/100

## Positive Observations
- **The status-map critic-L-2 checkpoint is genuinely honored, not just claimed.** I independently
  diffed the plan's pre-commitment table (`plan.md:27`, six groups) against `probe-report.md`'s observed
  map (nine groups) against the shipped `SKILL.md:74-88` table and `cover-php.workflow.js`'s
  `INFECTION_STATUS_MAP` (`:217-227`) — all three of the last three are identical, and specifically
  include `killedByStaticAnalysis`/`syntaxErrors`, which the plan's table omits. This is the exact
  mechanism the mandatory review exists to catch, and it holds.
- **The four core-skill mention sites are all present and each one's content is accurate**, not just
  present-as-boilerplate: the fact/tier table's new PHP row correctly names the concrete PHPUnit
  mechanism (`#[Group(…)]` / `--group`/`--exclude-group`) rather than a generic "deferred" stub.
- **Wiring is complete and self-consistent.** `gen-omni.mjs --check` (read-only) confirms the regenerated
  omni twin is in sync with nexus, and the twin's `plugins/omni-php/` directory exists in `../omni` —
  cross-checked, not just trusted from the developer's self-report.
- **The gate battery is still provably diff-identical** after the Step-8 prompt-neutralization edit — I
  re-ran the same `sed`+`diff` re-derivation the cycle-1 reviewer used and confirmed only the sanctioned
  `PHP_DISABLE_RE` delta remains; the neutralized bullet sits entirely inside `coverPrompt()`, outside the
  gate-battery function block.
- **All four Carry-Over Findings from `implementation.md` are addressed** (see below) — none silently
  dropped.

## Gaps
- **The eris-installation-failure lesson from the live run is not baked into the shipped SKILL.md.**
  `mvc-report.md`'s Postscript records that `composer require --dev giorgiosironi/eris` failed in the
  actual consuming repo (missing `ext-gd`/`ext-pgsql`/`ext-exif`) when landing a suite outside the
  isolated workspace, and that the property test was converted to a deterministic exhaustive sweep
  instead. The SKILL.md's eris guidance (`:20`, `:121`) presents eris as unconditionally available
  ("optional per target") with no mention of this observed platform-requirement risk or the sweep
  fallback. This is **not** one of the five run lessons implementation.md's Key Decisions names as
  required ("native-fs mandatory; the observed map; `known-bug` scoping; the `^0.34` pin rule; seed-the-
  RNG/stub-the-collaborator"), and the failure happened during an owner-driven manual landing step
  outside the automated Cover loop — so I'm not confident this was in the intended scope of "bake the run
  lessons in" for Step 8. Moved to Open Questions rather than asserted as a finding (confidence < 80).
- The `killedByStaticAnalysis`/`errored` groups remain structurally-mapped-but-zero-exercised on both
  proof runs (carried from the Step-1..7 review's Gaps list, unchanged by this block — not re-asserted
  here as a new finding).

## Open Questions
- **Should the eris platform-requirement risk (and the exhaustive-sweep fallback) be added to the
  shipped SKILL.md's eris guidance, or is it correctly out of scope as a one-off owner action outside the
  adapter's automated flow?** (Gap above, confidence ~55 — genuinely a judgment call, not a clear miss.)
  If yes, the natural home is a short caveat under the "Property tests" bullet (`SKILL.md:121`) or a new
  bullet in "The in-repo / Pest-native variant" section, since the failure specifically occurred when
  landing outside the isolated workspace.

## Carry-Over Findings (from implementation.md) — dispositioned this cycle

| Title | For | Disposition |
|-------|-----|--------------|
| Code-grounded review is MANDATORY before the ship commit | reviewer | **DONE — this section.** Every command/version/path/JSON key in the SKILL.md checked against `probe-report.md` + `mvc-report.md` + `cover-php.workflow.js`; two findings above (F1, F2) are the result. |
| Ship is entirely UNCOMMITTED (nexus + omni twin) | team lead | **CONFIRMED, unchanged.** `git log --oneline -1` still shows `f4f3c07`; all 7 file groups + core-skill edit + harness edits remain uncommitted, per the developer's disclosed intent (never commits; team lead owns both the nexus ship commit and the `../omni` mirror commit). Not this reviewer's action to take. |
| New-plugin ship checklist is a recurring gap | learner | **CONFIRMED as a real recurrence, not re-litigated here.** Verified independently: the `bump-plugin.mjs` over-bump correction (`nexus-php` restored to `0.1.0`) and both `gen-omni.mjs` sites (`mirrorDir` + `wantPlugins`) are present and correct in the working tree, matching implementation.md's account of the 2-occurrence (cpp + php) pattern. Promotion call is the learner's, not mine. |

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Offline guard (in-file) | pass | `node --test tests/unit/workflow-contract.test.mjs` | `tests 65 / pass 65 / fail 0` (fresh run, this review) |
| Offline guard (full CI glob) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `tests 489 / pass 489 / fail 0` (fresh run, this review; matches implementation.md's self-reported 489/489) |
| Syntax check | pass | `node --check harness/cover-php.workflow.js && node --check harness/mine-verify.workflow.js` | both `OK` |
| Plugin validation (nexus-php) | pass | `claude plugin validate plugins/nexus-php --strict` | `Validation passed` |
| Plugin validation (nexus) | pass | `claude plugin validate plugins/nexus --strict` | `Validation passed` |
| Skill lint (new skill) | pass | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-php/skills/mine-verify-cover-php` | `OK    mine-verify-cover-php` |
| Omni twin sync (read-only) | pass | `node scripts/gen-omni.mjs --check` | `✓ omni twin is in sync with nexus` (full `gen-omni.mjs` apply not re-run — it writes to `../omni`, outside this read-only review's mandate; `--check` alone is sufficient to confirm sync since implementation.md reports the apply already ran) |
| Status-map cross-check (independent) | pass | Diffed `plan.md:27` (pre-commitment, 6 groups) vs `probe-report.md:96-106` (observed, 9 groups) vs `SKILL.md:74-88` vs `cover-php.workflow.js:217-227` (`INFECTION_STATUS_MAP`) | Shipped map matches the probe-observed map exactly, including `killedByStaticAnalysis`→`Killed` and `syntaxErrors`→`CompileError`, which the plan's pre-commitment table omits (critic L-2 satisfied) |
| Gate-battery diff re-derivation | pass | `diff <(sed -n '64,205p' harness/cover.workflow.js) <(sed -n '59,202p' harness/cover-php.workflow.js)` | Only the `STRYKER_DISABLE_RE`→`PHP_DISABLE_RE` delta remains after the Step-8 prompt-neutralization edit — still exactly the sanctioned per-language delta |
| Toolchain-copy diff (comments-only check) | pass | `diff` of each `harness/php/*` template/Dockerfile against its `plugins/nexus-php/.../toolchain/` copy | Only comment text differs (dev-repo path refs → SKILL.md refs); every build instruction (`FROM`, `RUN`, version pins, logger config, `timeout`) byte-identical |
| Wiring grep | pass | `git diff .claude-plugin/marketplace.json scripts/gen-omni.mjs tests/unit/gen-omni.test.mjs plugins/nexus/skills/mine-verify-cover/SKILL.md` | `nexus-php`/`omni-php` present in all named sites; core SKILL.md's four adapter-mention sites (intro, table, not-do bullet, relationship table) all updated |
| `classFromSource` hand-trace | pass (logic correct; untested — F2) | Node one-liner against the `.cs` default + both PHP proof-run source paths | `BugRatioAnalyzer`, `SelectStratifiedSampleAction`, `CalculateReferencePeriodAction` — all correct |
| Business-rules registry landing | pass | `find docs/business-rules` (fmcg_platform) | Both `actions/calculate-reference-period-action.md` and `report-sampling/select-stratified-sample-action.md` exist, matching `SKILL.md:130`'s `<area>/<unit>.md` path claim |
| Sibling-adapter scope check | pass | `git diff --stat plugins/nexus-cpp plugins/nexus-flutter plugins/nexus-dotnet` | empty — no scope creep into sibling adapters' relationship tables (plan's explicit Out-of-scope item honored) |

*Status: COMPLETE — reviewer, 2026-07-08*
