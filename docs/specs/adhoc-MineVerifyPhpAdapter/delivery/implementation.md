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

*Status: block {1,3,4,5} + Fix Cycle 1/3 COMPLETE — developer, 2026-07-07*

---

# Steps 8-9 — Ship `nexus-php` + close-out (post-run developer resume, 2026-07-08)

**Scope of this pass:** Steps **8** (ship the proven adapter as `nexus-php` + wiring + bump) and **9**
(close-out: roadmap/KB/lessons), per the Q1 ruling (`questions.md` → Q1). The deterministic block
{1,3,4,5} shipped earlier (commit `f4f3c07`, reviewed + approved); the operator batch {2,6,7} is COMPLETE
(both live runs landed — `mvc-report.md` in fmcg_platform + the two KBs). This pass baked the
**probe-OBSERVED** map + the **live-run lessons** into the shipped SKILL.md, none of which existed until
the runs. **Everything is left UNCOMMITTED** for the plan's MANDATORY code-grounded review, then the
team-lead ship commit. Steps 1–7 were NOT touched.

## Files Created (Steps 8-9)
- `plugins/nexus-php/.claude-plugin/plugin.json` — the new plugin manifest, **`0.1.0`** (initial version),
  `dependencies: ["nexus"]`, description/keywords mirroring the nexus-cpp manifest shape (Infection,
  PHPUnit/Pest, PCOV, eris, Docker).
- `plugins/nexus-php/CHANGELOG.md` — the `0.1.0` initial-release entry (5-capability summary, the
  translation fork, the baked live-run lessons, the two proof-run verdicts).
- `plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md` — **the primary Step-8 deliverable.** Modeled
  on the cpp adapter's section set: 5-capability table; the trust anchor (*Infection is the PHP mutation
  standard, but its JSON needs translation*); Docker + workspace-copy bringup; the **native-fs MANDATORY**
  section; the Infection run commands; the **probe-observed** Infection-json→gate status map (the table
  from `probe-report.md`, NOT the plan's pre-commitment — critic L-2); the `^0.34` pin-moves-with-the-map
  rule; the `known-bug` group convention + cross-suite-contamination lesson; the seed-the-RNG /
  stub-the-framework-coupled collaborator rules; the equivalent-mutant filter; PHPUnit-12/eris/Pest-
  compatible test style; run artifacts; target-picking; and the in-repo/Pest variant documented as a later
  mode. Every command/version/path/JSON key is grounded in the live artifacts (`probe-report.md`,
  `mvc-report.md`, `cover-php.workflow.js`).
- `plugins/nexus-php/skills/mine-verify-cover-php/toolchain/{Dockerfile, composer.json.template,
  phpunit.xml.template, infection.json5.template}` — the Step-1 toolchain assets, copied from
  `harness/php/`. Comment references to dev-repo artifacts (`delivery/probe-report.md`,
  `harness/cover-php.workflow.js`, "Step-1 probe") were neutralized to point at the shipped SKILL.md
  (**comments only** — every build instruction is byte-identical to the harness original, mirroring the
  cpp toolchain's self-contained style).

## Files Modified (Steps 8-9)
- `.claude-plugin/marketplace.json` — added the `nexus-php` entry after `nexus-cpp` (wiring).
- `scripts/gen-omni.mjs` — added `mirrorDir(NEXUS/plugins/nexus-php → OMNI/plugins/omni-php)` beside the
  cpp mirror (:96) AND the companion `{ name: 'omni-php', source: './plugins/omni-php' }` in the
  `wantPlugins` marketplace array (:113). The plan named only the mirrorDir; the wantPlugins entry is its
  necessary companion (see Deviations).
- `tests/unit/gen-omni.test.mjs` — seeded `plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md` in the
  sandbox `before()` (so `collect()` doesn't ENOENT) AND extended the expected-plugins `deepEqual` (:55)
  with `'omni-php'` — both per the plan's critic-C-1 wiring.
- `plugins/nexus/skills/mine-verify-cover/SKILL.md` — the **four** adapter-mention sites (critic M-2): the
  method intro, the fact/tier stack-adapter table (a `deferred` PHP row mirroring cpp, with the PHPUnit
  `#[Group(…)]` filter note), the "What this skill does NOT do" bullet, and the "Relationship to other
  skills" table (a full PHP row). Text-only; no method/behavior change.
- `plugins/nexus/.claude-plugin/plugin.json` — **`1.25.0 → 1.25.1`** (PATCH, the core-skill edit; the cpp
  precedent shipped its core-skill mention as a nexus PATCH).
- `plugins/nexus/CHANGELOG.md` — the `1.25.1` entry describing the PHP adapter registration (rewritten from
  the tool's stub).
- `harness/cover-php.workflow.js` — **residue cleanup** (small harness edit): neutralized the Cover
  prompt's target-#1-flavored example-arithmetic bullet (`diffInDays(...) + 1` / `subDays/subWeek/subMonth`
  / `$result['from']`/`$result['to']` → stack-generic wording). The "Do NOT assume the
  CalculateReferencePeriod shape" warning stays (it names the default). No gate-battery / logic change.
- `harness/mine-verify.workflow.js` — **cosmetic-defect fix** (mvc-report incident 2): `target.class` now
  derives from the source basename via a new pure `classFromSource(SRC)` helper when no explicit
  `targetClass` arg is given, instead of always reporting the back-compat `'BugRatioAnalyzer'`. The `.cs`
  default path still derives to `'BugRatioAnalyzer'`, so all existing offline-guard tests stay green.

## Key Decisions (Steps 8-9)
- **The shipped status map is the probe-OBSERVED one, not the plan's pre-commitment table (critic L-2).**
  The SKILL.md's Infection-json→gate table is copied from `probe-report.md`'s observed map — `killed`/
  `errored`/`killedByStaticAnalysis`→`Killed`, `escaped`→`Survived`, `timeouted`→`Timeout`,
  `uncovered`→`NoCoverage`, `syntaxErrors`→`CompileError` (unscored), `ignored`/`skipped` excluded — with
  the two groups the research inferred-away (`killedByStaticAnalysis`, `syntaxErrors`) explicitly present.
- **`nexus-php` ships at `0.1.0` (not the tool's proposed `0.1.1`).** `bump-plugin.mjs` over-bumps a brand-
  new plugin; corrected back to the authored initial version (see Deviations). Only `nexus` took the real
  PATCH bump (the core-skill edit).
- **All five run lessons landed in the SKILL.md** (per the resume brief): native-fs mandatory; the observed
  map; the `known-bug` per-target-scoping convention; the `^0.34` pin-moves-with-the-map rule; and the
  seed-the-RNG (`Xoshiro256StarStar`) / stub-the-framework-coupled-collaborator rules.
- **Boy-scout considered, not invoked.** The touched files are new authored content (already clean) or
  precise single-line insertions into well-maintained files; no adjacent in-file dead code / naming /
  duplication warranted cleanup, and this ship is left for review — no scope creep.

## Skills Used (Steps 8-9)
| Step | Skill(s) invoked | Notes |
|------|------------------|-------|
| 8 | release-plugin | Plan Skill: `release-plugin` (Follow). Invoked before the bump; ran `bump-plugin.mjs --dry-run` → apply, then corrected the new-plugin over-bump; gen-omni sync + `--check`; `claude plugin validate --strict` (both plugins). |
| 8 (harness edits) | None | The residue cleanup + cosmetic-defect fix are harness (not shipped) — no skill; offline guard re-run green. |
| 9 | None | Close-out (roadmap append, research-entry supersede, lessons) — docs only, no skill (plan Skill: none, TDD no). |

## KB Changes (Steps 8-9)
| Entry | Action | What changed |
|-------|--------|-------------|
| `docs/kb/research/php-mutation-and-test-tooling.md` | UPDATE | Q1 Caveat block: appended a **RESOLVED BY OBSERVATION** note superseding the inferred top-level-key list with the probe-observed keys (`uncovered` not `notCovered`; `+killedByStaticAnalysis`, `+syntaxErrors`). Supersede, not delete (plan KB Impact). |
| `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` | UPDATE | Added a "Multi-language adapters — status" section: PHP shipped as the fourth adapter, both run verdicts + kill scores, cost vs the .NET/Flutter/C++ baselines, the in-repo/Pest variant as named future work. |

## Deviations from Plan (Steps 8-9)
- **Corrected `bump-plugin.mjs`'s over-bump of the new plugin.** The tool proposed `nexus-php 0.1.0 → 0.1.1`
  (it classifies the new manifest as a change-vs-HEAD and cannot know `0.1.0` is the intended initial
  version) and prepended a stub `0.1.1` CHANGELOG block that mangled the intro line. Reverted `nexus-php` to
  `0.1.0` and restored its clean CHANGELOG (the cpp precedent shipped at `0.1.0`; plan Step 8 states
  "nexus-php is a NEW plugin at 0.1.0"). The `--check` CI gate does not flag this (a new plugin has
  `baseV === null`). Reason: a first release must be `0.1.0`, not `0.1.1`.
- **Added the `wantPlugins` omni-php entry to gen-omni.mjs — the plan named only the `mirrorDir`.** Without
  it the regenerated omni `marketplace.json` would omit omni-php and the `gen-omni.test.mjs :55` deepEqual
  (which the plan DOES mandate extending with `'omni-php'`) would fail. The cpp precedent touched both
  sites; this is the necessary companion, not new scope. Verified: `gen-omni --check` in sync.
- **Neutralized dev-repo path references in the shipped toolchain copies (comments only).** The plan said
  "the Step-1 assets"; a verbatim copy would ship `delivery/probe-report.md` / `harness/cover-php.workflow.js`
  references a consumer can't resolve. Adjusted comments to reference the SKILL.md; no build-instruction
  change. Reason: shipped-quality (the cpp toolchain templates are self-contained).
- **Fixed the mine-verify `target.class` cosmetic defect rather than only documenting it.** The resume brief
  offered "document (or fix if trivial)"; the fix is a 4-line pure helper and keeps every offline-guard test
  green (the `.cs` default still derives to `'BugRatioAnalyzer'`; the `null`-args test asserts only `source`,
  the string/object-args tests pass an explicit `targetClass`). Reason: trivial + test-safe.

## Verification (Steps 8-9)
```
node --test tests/unit/workflow-contract.test.mjs        → 65/65 pass (after the two harness edits)
claude plugin validate plugins/nexus-php --strict         → Validation passed
claude plugin validate plugins/nexus     --strict         → Validation passed
node --test tests/lint/*.test.mjs tests/unit/*.test.mjs   → 489/489 pass (full CI glob)
node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-php/skills/mine-verify-cover-php   → OK
node scripts/gen-omni.mjs && node scripts/gen-omni.mjs --check    → ✓ omni twin is in sync with nexus
```
Ship file groups present (git status): plugins/nexus-php/ (plugin.json, CHANGELOG, SKILL.md, toolchain/×4);
modified marketplace.json, gen-omni.mjs, gen-omni.test.mjs, core mine-verify-cover/SKILL.md, nexus
plugin.json + CHANGELOG; harness cover-php + mine-verify workflows. `nexus-php`/`omni-php` grep-confirmed in
marketplace.json, gen-omni.mjs, gen-omni.test.mjs. Omni twin regenerated (uncommitted, in ../omni) — the
team lead owns BOTH the nexus ship commit and the mirrored omni commit.

## Carry-Over Findings (Steps 8-9)
| Title | Severity | For | Evidence | Note |
|-------|----------|-----|----------|------|
| Code-grounded review — RESOLVED | high→closed | reviewer | review verdict | Reviewer APPROVED (code-grounded) + Codex GO, no blocking findings. Consolidated F1-F5 fixed in Fix Cycle 1 below. |
| Ship is entirely UNCOMMITTED (nexus + omni twin) | high | team lead | git status | Team lead owns the single nexus ship commit (all 7 file groups + bump + core-skill edit + harness edits) AND the mirrored `../omni` commit (CLAUDE.md omni convention). Developer never commits. |
| New-plugin ship checklist is a recurring gap | medium | learner | lessons.md Improvement Proposal | cpp needed fixup commits `3d14501`/`3e6cafe`; php needed the bump-over-bump correction + both gen-omni sites. 2 occurrences — flagged for promotion to the release-plugin skill. |

## Fix Cycle 1 (Ship review — reviewer APPROVED + Codex GO, 5 non-blocking findings)

| Finding | Severity | Fix | Verified |
|---------|----------|-----|----------|
| F1 — SKILL.md:128 documented the landed suite filename as `<Class>Test.php`, contradicting :44's own claim and the actual landed filenames (`CalculateReferencePeriodActionHarnessTest.php`, `SelectStratifiedSampleActionHarnessTest.php` — confirmed on disk in fmcg_platform `tests/Unit/MineCode/`) | MEDIUM (reviewer) | Changed :128 to `<Class>HarnessTest.php`, matching :44 and reality. | Read-verified against the two on-disk filenames. |
| F2 — no offline-guard test exercised the `classFromSource` derivation path (`args.src` given, `targetClass` omitted) — only the explicit-targetClass and null-args-default shapes were covered | MEDIUM (reviewer) | Added `mine-verify derives target.class from args.src basename when targetClass is absent` to `tests/unit/workflow-contract.test.mjs` (beside the null-args-default test): passes `{ src: '...SelectStratifiedSampleAction.php' }` with no `targetClass`, asserts `target.class === 'SelectStratifiedSampleAction'` and `target.source` unchanged. | `node --test` — full CI glob grew 489→**490**, all green. |
| F3 — implementation.md's Verification transcript recorded `node skill-lint.mjs plugins/nexus-php/...` which is not reproducible (no repo-root `skill-lint.mjs`) | LOW (Codex) | Corrected the recorded command to `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-php/skills/mine-verify-cover-php` (the real, reproducible path). | Re-ran the corrected command from repo root — `OK    mine-verify-cover-php`. |
| F4 — `gen-omni.mjs`:156's success banner was stale (`plugins: omni, omni-dotnet (omni-net removed)`) though the script mirrors 5 plugins now | LOW (Codex) | Refactored the 5 `mirrorDir(...)` calls into a `mirrorPlugin(srcName, dstName)` helper that appends each `dstName` to a `mirroredPlugins` array; the banner now prints `mirroredPlugins.join(', ')` — derived from the actual mirrored list, never hand-maintained again. | Ran `node scripts/gen-omni.mjs` — banner now reads `plugins: omni, omni-dotnet, omni-flutter, omni-cpp, omni-php   (omni-net removed)`. |
| F5 — OPTIONAL (reviewer's Open Question, included per team-lead call): bake the eris platform-requirement fallback from `mvc-report.md`'s Postscript into the SKILL.md's test-style section | OPTIONAL | Added one sentence to the "Property tests" bullet: `composer require --dev giorgiosironi/eris` can fail on root platform requirements (`ext-gd`/`ext-pgsql`/`ext-exif` absent) — fallback is a deterministic exhaustive sweep over the input range (run-proven on the fixed bug post-script run). | Text-only; run-proven per `mvc-report.md` Postscript (2026-07-08). |

**Verification after fixes:**
```
node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs plugins/nexus-php/skills/mine-verify-cover-php   → OK
node --test tests/lint/*.test.mjs tests/unit/*.test.mjs   → 490/490 pass (grew from 489 — F2's new test)
claude plugin validate plugins/nexus-php --strict         → Validation passed
claude plugin validate plugins/nexus     --strict         → Validation passed
node scripts/gen-omni.mjs && node scripts/gen-omni.mjs --check   → banner lists all 5 mirrored plugins; ✓ omni twin is in sync with nexus
```
No new deviations introduced by this fix cycle; all five findings addressed as specified, nothing disputed.
Everything remains UNCOMMITTED (nexus working tree + the regenerated `../omni` twin) — the team lead owns
both commits.

*Status: COMPLETE (Steps 8-9 — ship `nexus-php` + close-out — including Fix Cycle 1) — developer,
2026-07-08. Reviewer APPROVED + Codex GO; F1-F5 fixed and re-verified. Everything left UNCOMMITTED for the
team-lead ship commit (nexus + omni twin).*
