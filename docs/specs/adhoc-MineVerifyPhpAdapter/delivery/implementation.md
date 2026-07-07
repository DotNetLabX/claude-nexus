# Mine→Verify→Cover — PHP adapter — Implementation

**Scope of this pass:** the deterministic/offline block **{1, 3, 4, 5}** ONLY, per the architect's Q1
answer (`delivery/questions.md` → Q1, owner-delegated, confidence high). Steps **{2, 6, 7}** are
operator-owed (Workflow runtime + live LLM spend — not in a developer subagent's toolset); Steps
**{8, 9}** are deferred to a post-run developer resume (Step 8's SKILL.md must bake in the live-run
lessons + probe-observed map, none of which exist until the runs happen). This pass ends at the
operator checkpoint.

This was a **resume** of an interrupted pass: the `harness/php/` assets + workspace + a first probe run
were already on disk. This session diagnosed + fixed the probe anomaly, then completed Steps 1's report,
3, 4, and 5.

## Files Created
- `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/probe-report.md` — **Step 1 deliverable.** The
  OBSERVED Infection JSON key map (top-level keys, `stats` object, per-mutant fields), the observed
  status→gate translation map, the bind-mount anomaly diagnosis + native-fs fix, the positional-pin
  proof (45 mutants, 1 file, 0 strays), PCOV-as-driver confirmation, and the canonical native-fs runner
  command sequence.
- `harness/php/cover-php-contract.md` — **Step 4 deliverable.** The 5-capability PHP fill, host reality
  (why Docker + native-fs), workspace layout, the PHPUnit-12/eris/Pest-compatible test style, the
  anti-trap invariant-first assertion rules (period-length conservation, adjacency, previous-full-period
  mapping, one hand-computed anchor), equivalent-mutant hygiene (`ignoreSourceCodeByRegex` +
  `expectedSurvivorLines`), timeout policy, the Infection→gate translation summary, and the run
  invocation.
- `harness/cover-php.workflow.js` — **Step 3 deliverable.** The thin fork: §6 gate battery byte-identical
  to `cover.workflow.js` (only `PHP_DISABLE_RE` differs); `INFECTION_STATUS_MAP` translation seam
  (probe-observed); a Cover agent that writes PHPUnit-12/eris tests; a runner agent that runs
  phpunit ×2 + `infection <target>` (positional pin) on the container native fs and translates the
  Infection json; and a loop-body anti-fake-green translation cross-check.

## Files Modified
- `tests/unit/workflow-contract.test.mjs` — **Step 5**, extended again in **fix cycle 1** (review F2/F3).
  Original edits at the plan's named sites: (1) `COVER_PHP_PATH` constant beside `COVER_CPP_PATH`;
  (2) `['cover-php', COVER_PHP_PATH]` in the shared meta-purity/static-import loop list; (3) a
  `cover-php runs in sandbox` slice (analogue of the cover-cpp slice) with PHP-shaped runner fixtures
  (translated `mutants` + `mutationSummary`) asserting gate-battery reuse + equivalent-mutant exclusion,
  PLUS a second test asserting the translation cross-check HALTs on a count mismatch. Fix-cycle 1 edits:
  a third mutant (`status: 'CompileError'`, from a translated `syntaxErrors` entry) added to the sandbox
  fixture + a `reachableDenominator` assertion proving it is enumerated but unscored (F2); a direct
  `cover-php.workflow.js has no static import (joins the shared contract loop)` test added beside the
  spec-cover/spec-cover-calc/merge direct-assertion site (F3). `node --test` green (65/65 in-file;
  488/488 full CI glob).
- `harness/cover-php.workflow.js` — **fix cycle 1** (review F4): trimmed the `PHP_DISABLE_RE` comment
  from 4 lines to the cpp-shaped 2-line form (`CPP_DISABLE_RE`'s precedent), keeping the per-language
  gate-battery delta minimal and diff-checkable. No logic change (verified: `diff` against
  `cover.workflow.js`'s battery section is still exactly the disable-regex const + its one `charPin`
  reference).
- `harness/php/composer.json.template` — **fix cycle 1** (review F1, HIGH): pinned
  `infection/infection` from `"*"` to `"^0.34"` — the Step-1 PROBED minor line (0.34.0, confirmed in
  `workspace/composer.lock`). Added a comment block stating the pin-update rule: the composer pin,
  `probe-report.md`'s observed status map, and `INFECTION_STATUS_MAP` move together — bumping the pin
  requires re-running the Step-1 probe and reconciling all three.
- `harness/php/workspace/composer.json` — **fix cycle 1**, consistency companion to the template pin
  above (same `"*"` → `"^0.34"` edit) so the on-disk workspace matches the template it was generated
  from; the resolved `composer.lock` already recorded 0.34.0, so no re-`composer install` was needed.
- `harness/php/cover-php-contract.md` — **fix cycle 1** (review F1): added the same pin-moves-together
  rule to the capabilities section (the finding asked for "template comment and/or contract" — did both).
- `harness/php/Dockerfile` — (Step 1/original pass) added a "RUN ON THE CONTAINER'S NATIVE FS" comment
  block documenting the bind-mount I/O tax finding + the copy-in command (a load-bearing operational
  fact for anyone running the image). No build-instruction change.
- `harness/php/workspace/infection-log.json` + `infection-summary.log` — (Step 1/original pass) replaced
  the stale all-timeout run with the good native-fs run so the (git-ignored) workspace is
  self-consistent. Housekeeping only.

## Key Decisions
- **PHP is a Flutter-STYLE fork (translation required) but keeps the .NET full-array `mutationFloor`.**
  Infection's json is proprietary → translation is needed (unlike mull/Stryker). But unlike Flutter's
  survivor-only XML, Infection enumerates EVERY status, so the runner produces a COMPLETE per-mutant
  array and the workflow reuses `cover.workflow.js`'s full-array `mutationFloor` byte-identically. "The
  Flutter-style fork" (plan) means "has a translation step," not "adopt Flutter's summary-only scoring."
- **The runner translates; the workflow gates (Option A).** Settled by the cover-cpp sandbox slice: the
  guard feeds the workflow a *runner-return* fixture and asserts on gate output, so the runner returns
  gate-schema `mutants`. The PHP runner reads `infection-log.json`, applies `INFECTION_STATUS_MAP`
  (rendered into its prompt from the same in-file const), and returns translated `mutants` +
  `mutationSummary`. This matches the Flutter precedent (runner parses/translates; workflow gates).
- **Translation status map is probe-OBSERVED, not the plan's inferred pre-commitment (critic L-2).**
  `INFECTION_STATUS_MAP` = `{killed, killedByStaticAnalysis, errored → Killed; escaped → Survived;
  timeouted → Timeout; uncovered → NoCoverage; syntaxErrors → CompileError (unscored); ignored, skipped
  → excluded}`. The two groups the research inferred-away (`killedByStaticAnalysis`, `syntaxErrors`) were
  observed and are now mapped.
- **Native-fs run is mandatory** (see the anomaly resolution below) — encoded in the runner prompt, the
  contract, and the Dockerfile.

## Skills Used
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 1 | diagnose | Plan Skill: none (TDD no). `diagnose` invoked to root-cause the 45/45-timeout probe anomaly (bind-mount I/O tax) — phased loop, H1 confirmed, fix + native-fs re-run. |
| 3 | None | Plan Skill: none (TDD no). Thin fork of `cover-cpp`/`cover-flutter` per the plan's mirror-pattern; gate battery copied verbatim from `cover.workflow.js`. |
| 4 | None | Plan Skill: none (TDD no). Contract authored from the plan's Step-4 spec + the cpp/flutter contract shape. |
| 5 | None | Plan Skill: none (TDD no). Extends the existing offline guard suite — the guard IS the test; no separate `tdd` step (extend-then-run, per the plan). |

*(Steps 2, 6, 7 = operator-owed; 8, 9 = deferred resume — no skills invoked this pass. Step 8's mapped
`release-plugin` fires in the deferred resume.)*

## Carry-Over Findings
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Native-fs run is mandatory or Infection false-times-out every mutant | high | operator (Steps 6/7) | probe: 9.6s vs 0.16s bare run; 45/45 false timeouts on bind mount | The runner prompt + contract + Dockerfile already encode `cp -r /work /native`. Do NOT run Infection directly over the bind mount. |
| Step-8 SKILL.md must use the probe-OBSERVED status map | medium | developer (Step 8 resume) | `probe-report.md` status table; critic L-2 | `killedByStaticAnalysis`→Killed and `syntaxErrors`→CompileError are observed additions to the plan's capabilities table. |
| Cross-check is the seam's only anti-fake-green guard | medium | reviewer (Step 8 code-grounded review) | `cover-php.workflow.js` loop cross-check + the HALT test | Verify the live runner returns a `mutationSummary` consistent with the translated array; a mis-translation HALTs `mutant-count-mismatch` rather than scoring. |
| `model: 'sonnet'` acceptance is via `MODEL` default, not literal on agent calls | low | reviewer | `cover-php.workflow.js:246,465,468` | Same as cpp/flutter (`const MODEL = _args.model ?? 'sonnet'`; `model: MODEL`). The Sonnet pin is present; a literal `grep "model: 'sonnet'"` over the agent calls finds only the MODEL-default line. |
| Step-8 SKILL.md must state the `^0.34` pin + the pin-moves-with-map rule | low | developer (Step 8 resume) | `composer.json.template` (fix cycle 1); `cover-php-contract.md` pin-update rule | Carry the pin forward into the shipped skill's toolchain section — if a live run needs a newer Infection minor, the probe must re-run before the pin (and the shipped skill) advance. |

*(The F1 composer-pin risk from cycle 1 is now RESOLVED, not carried over — see Fix Cycle 1 below. Kept only as the forward-looking Step-8 note above.)*

## Deviations from Plan
- **Probe anomaly root-caused and fixed (the reason this was a resume).** The prior run recorded 45/45
  "Timed Out". Diagnosed (diagnose skill) as the Windows→Linux bind-mount I/O tax; fixed by running on
  the container native fs. The re-run observed the genuine map (21 Killed + 24 Escaped). This is a
  faithful execution of the plan's Step-1 intent ("convert read-docs facts to ran-it facts"), not a
  scope change — but it added the native-fs requirement to the runner design, which the plan did not
  anticipate. Documented in probe-report.md, the contract, the workflow runner prompt, and the Dockerfile.
- **Added `mutationSummary` + a loop-body translation cross-check to the PHP fork.** The plan's Step 3
  did not name a `mutationSummary`, but Step 5's fixture description explicitly calls for a
  "`mutants`/`mutationSummary` return," and the harness's pervasive anti-fake-green discipline (plus the
  Flutter precedent's survivor-count HALT) makes a translation-completeness cross-check the natural,
  testable guard on the exact seam the plan flags as the risk. It sits OUTSIDE the gate battery (loop
  body), so the battery stays byte-identical. Reason: the translation seam is the one novel PHP surface;
  guarding it offline (both pass + fail paths tested) is precisely Step 5's mandate ("validate offline —
  never discover on a paid live run").
- **Gate-battery "empty diff" is a 2-line delta, not literally empty.** The disable-regex constant
  (`PHP_DISABLE_RE`, matching `@infection-ignore-all`) + its one `charPin` reference differ from
  `cover.workflow.js`'s `STRYKER_DISABLE_RE` — the sanctioned per-language delta every sibling fork
  carries (cpp `CPP_DISABLE_RE`, flutter `DART_DISABLE_RE`). Copied the battery FROM `cover.workflow.js`
  (not the drifted sibling forks) to maximize the empty-diff; verified via `diff` (only those 2 lines).
- **Step 5 adds a second test (the mismatch HALT) beyond the one named sandbox slice.** Additive, in the
  same slice section; directly serves Step 5's offline-validation goal for the translation seam.

## Fix Cycle 1/3 (Step-2 review)

Findings from the consolidated Step-2 review round, all fixed in this cycle:

| Finding | Severity | Fix | Verified |
|---------|----------|-----|----------|
| F1 — `composer.json.template` left `infection/infection` at `"*"`, letting a fresh workspace resolve a future Infection whose json shape could silently invalidate `INFECTION_STATUS_MAP` | HIGH (blocking) | Pinned to `^0.34` (the Step-1 probed minor, 0.34.0-confirmed in `workspace/composer.lock`) in both the template and the on-disk workspace `composer.json`. Added the pin-moves-with-the-map rule as a comment in the template AND a section in `cover-php-contract.md` (both, per the finding's "template comment and/or contract"). | Read-verified against `composer.lock`; no `composer install` re-run needed (lock already recorded 0.34.0, satisfied by `^0.34`). |
| F2 — no offline fixture exercised a `CompileError`-status mutant (Infection's `syntaxErrors` group) through the gate math | MEDIUM | Added a third mutant (`status: 'CompileError'`, translated from a `syntaxErrors` entry) to the `cover-php runs in sandbox` fixture; bumped `mutationSummary.total`/`syntaxError` and `mutatedFiles.count` to match; added an explicit `reachableDenominator === 1` assertion proving the CompileError mutant is enumerated (honest count) but never enters `DENOMINATOR_STATUSES` scoring. | `node --test` — the updated sandbox test passes with the new assertion. |
| F3 — cover-php's no-static-import coverage was only implicit (meta-purity loop + sandbox run) | LOW | Added a direct `cover-php.workflow.js has no static import (joins the shared contract loop)` test, matching the exact style/phrasing of the spec-cover/spec-cover-calc/merge direct assertions, placed at that same site. | New test passes; total suite count 64→65. |
| F4 — the `PHP_DISABLE_RE` comment (4 lines) was longer than the cpp-shaped 2-line precedent at the same sanctioned per-language delta site | LOW (polish) | Trimmed to a 2-line comment matching `CPP_DISABLE_RE`'s shape. | `diff` against `cover.workflow.js`'s gate-battery section re-confirmed: still exactly the disable-const + its one `charPin` reference (now 3 changed lines instead of 5, tighter and diff-checkable). |

**Verification after fixes:**
```
node --test tests/unit/workflow-contract.test.mjs   → 65/65 pass
node --test tests/lint/*.test.mjs tests/unit/*.test.mjs (full CI glob)   → 488/488 pass
node --check harness/cover-php.workflow.js   → syntax OK
```

No new deviations introduced by the fix cycle; all four findings addressed as specified, nothing disputed.

### Out of scope this pass (per Q1) — NOT done, by design
- **Step 2 (Mine→Verify #1 → KB), Step 6 (live Cover #1), Step 7 (live Cover #2 + land deliverables):**
  `Owner: operator` — require the nexus Workflow runtime + live LLM spend, absent from a developer
  subagent. **OPERATOR ACTION REQUIRED** at the checkpoint: run these via the Workflow tool on this host
  (Docker is up — 28.5.1, `mvc-php-probe` built). Step 2 produces the KB `cover-php.workflow.js` defaults
  to (`kb-calculate-reference-period.md`); Steps 6/7 fire the two spend gates.
- **Step 8 (ship `nexus-php`) + Step 9 (close-out):** deferred to a post-run developer resume. Step 8's
  SKILL.md must carry the probe-observed map + live-run lessons (critic L-2); pre-authoring it now would
  bake in stale guesses. Step 8's mapped `release-plugin` skill fires in that resume.

*Status: COMPLETE (block {1,3,4,5} + Fix Cycle 1/3) — developer, 2026-07-07*
