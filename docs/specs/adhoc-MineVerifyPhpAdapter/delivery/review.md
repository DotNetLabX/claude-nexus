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
