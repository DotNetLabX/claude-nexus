# Mine→Verify→Cover — PHP adapter (full arc to shipped nexus-php)

**Feature Spec:** None (ad-hoc technical increment — binding inputs: the mine-verify-cover adapter contract, the C++/Flutter porting precedent, owner scope decisions 2026-07-06)
**Parent:** `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` — multi-language end goal (.NET ✅, Flutter ✅, C++ ✅; PHP is the fourth adapter).
**Mirror pattern:** `harness/cover-cpp.workflow.js` — the proven thin-fork shape (gate battery byte-identical to `cover.workflow.js`).
**Backing:** `docs/kb/research/php-mutation-and-test-tooling.md` (cited, cite-check green); target-repo scan of `D:\omnishelf\fmcg_platform` (2026-07-06); shipped-adapter template `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md`.

## Context

Port the mine-verify-cover method to PHP: fill the 5-capability adapter contract (evidence indexer, test runner, mutation tool, test-style contract, prod-source-diff scoping), live-prove it on the owner's real repo, and graduate it to a shipped `nexus-php` plugin — the fourth stack adapter after `nexus-dotnet`, `nexus-flutter`, `nexus-cpp`. Owner decisions (2026-07-06): full arc in one pass; proof target = `D:\omnishelf\fmcg_platform`; critic review on this plan.

**Target-repo facts that shape the design** (scan 2026-07-06): Laravel 13 modular monolith, PHP ~8.4, **Pest v4** on PHPUnit 12, **no Infection**, **no coverage driver** (PCOV/Xdebug absent), Feature tests require live Postgres; ~556 test files. Research verdicts: Infection's `json` logger is **proprietary** (translation to the gate's mutants schema required — the Flutter-style fork, not the mull as-is fork); single-file mutation pinning via **positional CLI arg** (satisfies `target_mutated`); current Infection needs **PHP ^8.3 + PCOV/Xdebug/phpdbg**; **eris 1.1.0** is the maintained property-test API (PHPUnit ^10–^13); Infection's initial sanity check **always runs the full suite**.

**The binding architectural call — workspace-copy isolation (cpp pattern), not in-repo runs.** An in-repo Infection run would need Infection + a coverage driver installed into fmcg_platform AND would drag the full 556-file suite (live Postgres) into every mutation run's initial check. Instead: copy the target class into a self-contained composer workspace (plain PHPUnit 12 + Infection + PCOV + eris + the class's narrow deps), run everything in a Docker image (`php:8.4-cli` + pcov + composer + infection) — host-uniform on Windows, mirrors the proven cpp bringup. The consuming repo stays pristine; deliverable tests land there Pest-compatible (PHPUnit-class style runs under Pest's compatibility layer).

## Scope

**In:** vendored PHP toolchain under `harness/php/` + a deterministic toolchain probe; Mine→Verify on target #1 → verified KB; `harness/cover-php.workflow.js` (thin fork); offline-guard validation; two live Cover runs (target #1 toolchain proof, target #2 unlike-target de-hardcoding) with deliverables landed in fmcg_platform; ship `plugins/nexus-php` (0.1.0) + wiring (marketplace, gen-omni, core-skill mentions) + release-plugin bump, gated on a code-grounded review.

**Out:** in-repo (Pest-driven) Infection runs against fmcg_platform's own suite — documented in the shipped skill as a variant, not executed this pass; multi-class sweep / Discover; touching fmcg_platform beyond landing the run deliverables; extra skills for nexus-php (single-skill plugin, like nexus-cpp at 0.1.0); updating sibling adapters' relationship tables (cpp ship precedent: only the core skill is touched).

## The 5 capabilities, filled for PHP

| Capability | PHP fill |
|------------|----------|
| Evidence indexer | miner reads the target `.php` directly (pure classes; no indexer tooling needed this pass) |
| Test runner | `phpunit` (PHPUnit 12) **inside the Docker workspace** — run ×2 for `suite_green` + `no_flaky` |
| Mutation tool | **Infection** (current line, PHP ^8.3), single-file pin via **positional arg**, `json` logger → runner **translates** to the gate's mutants schema (Killed→Killed, Escaped→Survived, Timed Out→Timeout, Not Covered→NoCoverage, Errored→Killed, Skipped/Ignored→excluded) |
| Test-style contract | PHPUnit 12 class tests (Pest-compatible for the consuming repo) + **eris** property tests |
| Prod-source-diff scoping | `git diff` of the copied slice for `char_pin` (only tolerated change: an `@infection-ignore-all` / ignore-comment) |

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | (none) | — | no | Docker + composer workspace probe; confirm Infection JSON keys, positional pin, PCOV | deterministic toolchain work; no skill covers it |
| 2 | (none) | — | no | run `harness/mine-verify.workflow.js` on `CalculateReferencePeriodAction.php` | Workflow-run, stack-agnostic |
| 3 | (none) | — | no | author `harness/cover-php.workflow.js` as thin fork of `cover-cpp.workflow.js` | thin-fork; pattern is the sibling file |
| 4 | (none) | — | no | PHP test-style + runner contract (`harness/php/cover-php-contract.md`) | — |
| 5 | (none) | — | no | EXTEND + run offline guard `tests/unit/workflow-contract.test.mjs` (path const, loop list, sandbox slice) | — |
| 6 | (none) | — | no | live Cover run #1 (CalculateReferencePeriodAction) | live LLM loop — owner spend gate |
| 7 | (none) | — | no | live Cover run #2 (SelectStratifiedSampleAction) + land deliverables in fmcg_platform | owner spend gate |
| 8 | release-plugin | Follow | no | ship `plugins/nexus-php` 0.1.0 + wiring; nexus PATCH; code-grounded review first | — |
| 9 | (none) | — | no | run report + roadmap/KB update + lessons | — |

**All-`None` rationale (preserve the exemption):** the harness is authored and run via the **Workflow** tool, not the Skill tool; the Cover agent applies test discipline *inside* the loop. `mine-verify-cover` core + `cover-cpp.workflow.js` are read as spec/mirror, not invoked. The one Skill-tool invocation this plan mandates is `release-plugin` at Step 8.

## Domain Model Changes

None (dev-repo tooling + plugin shipping).

## Data Model Changes

None.

## Implementation Steps

### Step 1 — Toolchain probe + vendored workspace assets (deterministic, no LLM loop)
Create `harness/php/`: `Dockerfile` (`php:8.4-cli` + pcov + composer + infection pinned current), `composer.json.template` (require-dev: `phpunit/phpunit:^12`, `infection/infection`, `giorgiosironi/eris:^1.1`; per-target deps slot), `phpunit.xml.template`, `infection.json5.template` (json + summary loggers, `timeout`, `ignoreSourceCodeByRegex` slot). Scaffold a workspace (kept OUT of both repos, cpp `/probe` pattern): `src/` = the copied slice (`D:\omnishelf\fmcg_platform\app\Actions\CalculateReferencePeriodAction.php` + `nesbot/carbon` via composer), `tests/` = ONE hand-written seed test. Run: `composer install`, `phpunit` ×2, `infection src/CalculateReferencePeriodAction.php` (positional pin) inside Docker.
- **Accept (mechanism):** the run produces the `json` log; **record the log's actual top-level keys + per-mutant fields** in `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/probe-report.md` (resolves the research entry's stated Q1 caveat — the translation in Step 3 is authored against *observed* keys, never the inferred ones); the report proves the pin (only the target file mutated) and PCOV as the active driver. `Satisfies:` adapter capabilities 2–3 (runner + mutation tool proven).
- **Owner: operator** for Docker availability on the host; the file authoring is standard dev work.
- Confidence: high (every tool is documented-mature; the probe exists precisely to convert read-docs facts to ran-it facts).

### Step 2 — Mine→Verify target #1 → verified KB
Run `harness/mine-verify.workflow.js` (3 clean-room miners → consolidate → skeptic verify) on the copied `CalculateReferencePeriodAction.php`. KB out nexus-side: `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/kb-calculate-reference-period.md` (`kb-entry-schema` shape).
- **Accept:** a verified rule KB entry (status `verified`), ≥1 interpretive rule the skeptic confirmed (the full-week/month/quarter/year detection rules are the expected yield). `Satisfies:` adapter capability-1 (evidence indexer reads PHP source).
- **Owner: operator** (Workflow tool — not available to a developer subagent).
- Confidence: high (Mine→Verify is stack-agnostic, proven on C/.NET/Dart; PHP is in-model).

### Step 3 — Author `harness/cover-php.workflow.js` (thin fork)
Fork `cover-cpp.workflow.js`. **Copy the gate battery VERBATIM** (byte-identical to `cover.workflow.js`'s — diff-checkable; keep the keep-in-sync comment). Change exactly two actors:
- **Cover agent** writes PHPUnit 12 class tests + eris property tests per the Step-4 contract; one test per rule boundary; red-on-current kept + flagged as candidate bugs; forbidden to edit the slice / infection config / KB.
- **Runner agent** executes, inside the Docker workspace: `phpunit` ×2, then `infection <target>` (positional pin), then **translates the Infection `json` log → the existing `mutants` schema** using the Step-1 observed keys (status map from the capabilities table; `Timed Out` counts as a kill, matching the gate; `Skipped`/`Ignored` leave the denominator). Builds the honest `mutatedFiles` list (one `{file,count}` per mutated path in the log) for `target_mutated`.
- Files: `harness/cover-php.workflow.js` (new). Workspace assets from Step 1 are the runner mechanism.
- **Accept (mechanism):** `meta` is a pure literal; args parsed via the `_argsRaw`/`JSON.parse` pattern; `diff` of the gate-battery section vs `cover.workflow.js` is empty; the translation function's status map is visible in the file and matches the capabilities table; grep confirms `model: 'sonnet'` on the Cover + runner `agent()` calls (the core skill's Model rule — pin, don't inherit the session model). `Satisfies:` capabilities 2–5.
- Confidence: medium (thin fork is proven ×3, but the JSON translation seam is new — exactly why Step 1 pins the real keys first).

### Step 4 — PHP test-style + runner contract
Write `harness/php/cover-php-contract.md`: the test API the Cover agent must follow (PHPUnit 12 class style — `final class XTest extends TestCase`, data providers for boundary matrices; eris trait usage for property tests; **Pest-compatibility constraint**: no PHPUnit-internal APIs beyond what Pest's compatibility layer runs), the runner command sequence, and the anti-trap rules carried from the cpp lessons: **assert structural invariants, not hand-computed values** (for target #1: period-length conservation `refPeriod length == input length`, adjacency `refPeriod end + 1 day == input start`, idempotence on non-aligned ranges — an exact hand-computed date only for one trivially-traceable case); equivalent-mutant hygiene = `ignoreSourceCodeByRegex` for provably-behavior-free lines + the method's `expectedSurvivorLines` for reasoned exclusions (mutator-type × observability, never "everything that survived"); timeout policy = Infection default (timeout counts as killed — matches the gate).
- **Accept:** the contract names the test API + runner commands + the invariant-first assertion rule; the Cover agent receives it via a path arg.
- Confidence: high.

### Step 5 — EXTEND + run the offline guard (critic H-2: the guard has no cover-php hook until edited)
`tests/unit/workflow-contract.test.mjs` is a **fixed suite, not CLI-parameterized** — running it "against" a new workflow is a no-op. Extend it at the three verified sites, then run: a `COVER_PHP_PATH` constant (sibling of `COVER_CPP_PATH`, :28); a `['cover-php', COVER_PHP_PATH]` entry in the shared static-import/meta-purity loop list (:1554); a `cover-php runs in sandbox` slice (analogue of the cover-cpp slice, :1498-1518) with **PHP-shaped runner fixtures** (an Infection-json-translated `mutants`/`mutationSummary` return, not the mull shape). The guard's checks: no static `import`/`fs`/`require`/`process`, no `Date`/`Math.random`, `meta` pure literal, stringified-args parse, budget as shared pool. **Validate offline — never discover these on a paid live run.**
- **Accept (mechanism):** `node --test tests/unit/workflow-contract.test.mjs` green WITH the cover-php slice present and passing. This file is CI-run (`plugin-release-check.yml`) — the extension ships with the workflow, in the same change.
- Confidence: high.

### Step 6 — Live Cover run #1: CalculateReferencePeriodAction (the toolchain spend)
Run `cover-php.workflow.js` on the Step-2 KB, Docker runner. **`maxIterations` 1–2 first** (cpp cost lesson: get the kill-rate signal cheaply), raise only if the floor is reachable.
- **Accept:** all 6 gates evaluated honestly (`target_mutated`, `suite_green`, `no_flaky`, `mutation_floor` ≥75% reachable, `no_new_skips`, `char_pin`); generated tests kill Infection mutants; cost recorded (output tokens + wall time). **A sub-floor run where every gate mechanically worked and the gate *refused* to certify is a valid outcome for this step** (the cpp precedent) — the step fails only on mechanical breakage (runner/translation/gates), not on an honest sub-floor score.
- **Run-#1 deliverable disposition (critic M-1 — the adapter's every-run rule):** gates pass → the gated suite lands in fmcg_platform `tests/Unit/MineCode/` AND the verified KB in fmcg_platform `docs/business-rules/actions/calculate-reference-period-action.md`; sub-floor/refused → no suite lands, but the KB copy + the run's report section land regardless (never report-only-on-green, never silent).
- **Owner: operator** (Workflow tool + live spend — surfaced at the checkpoint before firing).
- Confidence: medium (first live PHP loop; the translation seam is the risk this run exists to prove).

### Step 7 — Live Cover run #2: SelectStratifiedSampleAction (the de-hardcoding target)
Run the loop on `D:\omnishelf\fmcg_platform\modules\ReportSampling\Actions\SelectStratifiedSampleAction.php` (~274 lines: largest-remainder quota allocation, scan-type splitting, ranking). Mine→Verify first (same as Step 2), then Cover.
- **Workspace dependency surface (critic H-3 — the class imports FIVE collaborators, verified at `SelectStratifiedSampleAction.php:7-11`):** `Illuminate\Support\Collection` → composer `illuminate/collections`; `Random\Randomizer` → PHP native (seed it fixed in tests); `SamplingCandidateData` → plain final-readonly DTO, **copy into workspace `src/`**; `SamplingScanTypeGroup` + its transitive `App\Enums\AnalyticsReportScanType` → plain string enums, **copy**; `SamplingDimensionsData` → **framework-coupled** (extends `Spatie\LaravelData\Data`, references Eloquent `ReportSamplingSetting`) — do NOT copy: **replace with a plain 5-public-bool stub** in workspace `src/` (`execute()` only reads its five booleans; tests construct it directly, never via `fromSetting()`; `char_pin` pins only the target file, so a stubbed collaborator is legal). **Purpose (cpp Levenshtein lesson): a second unlike target is what flushes hardcoded target-#1 assumptions out of the adapter prompts** — SUT shape must come from the contract file + KB + `_args.sutNotes`, never be baked into the Cover prompt.
- **Land the deliverables in the consuming repo** (the adapter run-artifact rules): the gated suite → fmcg_platform `tests/Unit/MineCode/` as Pest-compatible PHPUnit classes (register the directory in the repo's test discovery if `tests/Unit` auto-discovery doesn't already cover it — resolve against `tests/Pest.php` at run time); the verified rule KB → fmcg_platform `docs/business-rules/report-sampling/select-stratified-sample-action.md`; the cumulative run report → `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/mvc-report.md` (both runs, full 6-gate tables, survivor classification, incidents, cost).
- **Accept:** run #2 reaches its verdict with **zero PHP-adapter prompt edits specific to target #1 remaining** (grep the Cover prompt for `CalculateReferencePeriod`/`Carbon` — zero hits required); deliverables exist at the three named consuming-repo paths.
- **Owner: operator** (Workflow + spend — second checkpoint gate).
- Confidence: medium.

### Step 8 — Ship `nexus-php` (gated on Step 7 GO + mandatory code-grounded review)
Graduate the proven adapter to a shipped plugin, mirroring the nexus-cpp ship commit (`c3f9922`):
- `plugins/nexus-php/.claude-plugin/plugin.json` — 0.1.0, `dependencies: ["nexus"]`, description/keywords mirroring the cpp manifest's shape (Infection, PHPUnit/Pest, PCOV, eris, Docker).
- `plugins/nexus-php/CHANGELOG.md` — 0.1.0 entry.
- `plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md` — modeled on the cpp adapter SKILL.md's section set (5-capability table, trust anchor: *Infection is the PHP mutation standard but its JSON needs translation*, Docker + workspace bringup, the runner commands with the observed JSON key map, equivalent-mutant filter, test style incl. the invariant-first rule and Pest-compatibility, run artifacts, target-picking, in-repo/Pest variant documented as a later mode). **Bake the run lessons in — the shipped skill carries what the live runs proved, not the pre-run guesses.** In particular (critic L-2): the SKILL.md's Infection status map MUST be the **Step-1 probe-observed** map from `probe-report.md` — never this plan's pre-commitment table (whose `Errored`/top-level keys the research marks as inferred).
- `plugins/nexus-php/skills/mine-verify-cover-php/toolchain/` — the Step-1 assets (Dockerfile, composer.json.template, phpunit.xml.template, infection.json5.template).
- Wiring (all in the SAME ship commit): `.claude-plugin/marketplace.json` — add the `nexus-php` entry (:24 area); `scripts/gen-omni.mjs` — **add `mirrorDir(... 'nexus-php' ... 'omni-php')` beside lines 95–96** (hardcoded mirror list — verified 2026-07-06); **`tests/unit/gen-omni.test.mjs` (critic C-1 — CI-breaking if skipped, the cpp campaign needed fixup commits `3d14501`/`3e6cafe` for exactly this):** seed `plugins/nexus-php/skills/mine-verify-cover-php/SKILL.md` in the sandbox `before()` (:30-31) AND extend the expected-plugins `deepEqual` (:55) with `'omni-php'`; core `plugins/nexus/skills/mine-verify-cover/SKILL.md` — **all FOUR adapter-mention sites (critic M-2):** the method intro (:21), the fact/tier stack-adapter table (:296-302 — add a `deferred` PHP row mirroring cpp), the "What this skill does NOT do" bullet (:326), and the "Relationship to other skills" table (:409-411).
- **Follow release-plugin:** nexus-php is a NEW plugin at 0.1.0 (first version); the core-skill mention is a **nexus PATCH** (the cpp precedent, 1.18.3); regenerate/validate per the skill (`claude plugin validate plugins/nexus-php --strict`); gen-omni after the bump; ONE commit for content + bump + CHANGELOG.
- **Code-grounded review is MANDATORY before this step's commit** (shipped-skill authoring — the cpp ship required it and it caught the only CRITICAL): the reviewer reads the live `cover-php.workflow.js`, the probe/run reports, and verifies **every command, version, path, and JSON key** in the new SKILL.md against them — not a doc-only pass.
- **Accept (mechanism):** `claude plugin validate --strict` green; `node --test tests/unit/*.test.mjs` green (the CI gate, run locally pre-commit); `git show --stat` of the ship commit contains all SEVEN file groups above (plugin.json, CHANGELOG, SKILL.md, toolchain/, marketplace.json, gen-omni.mjs, gen-omni.test.mjs — plus the core-skill edit); grep `nexus-php` hits in marketplace.json AND gen-omni.mjs AND gen-omni.test.mjs; the review verdict is recorded in `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/review.md`. `Satisfies:` ADR-3 (thin stack extension), ADR-9 (owned release flow).
- Confidence: high (3× precedented ship shape; the risk is drift between SKILL.md claims and the live harness — that is exactly what the code-grounded review gates).

### Step 9 — Run report close-out + roadmap/KB update + lessons
Append the PHP-adapter outcome to `docs/specs/adhoc-MineVerifyCoverHarness/roadmap.md` (fourth adapter: verdict, kill scores, cost vs the .NET/Flutter/C++ baselines, the in-repo/Pest variant as named future work); finalize `delivery/mvc-report.md`; write `delivery/lessons.md` (architect + execution lessons, per `lessons-format`).
- **Accept:** roadmap names the PHP adapter with its verdict + costs; lessons.md exists with at least the translation-seam and unlike-target findings (or their absence stated).
- Confidence: high.

## Cross-Service Changes

None.

## Migration Notes

None.

## Testing Strategy

The gate battery IS the test: Step 5 proves the workflow runtime-legal offline; Steps 6–7 prove the generated suites compile (PHPUnit), double-run green, and clear the Infection floor honestly. The gate-battery section of `cover-php.workflow.js` must be **diff-identical** to `cover.workflow.js`'s (Step 3 acceptance). The probe (Step 1) converts every load-bearing read-docs claim into a ran-it fact before anything expensive depends on it.

## KB Impact

- `docs/kb/research/php-mutation-and-test-tooling.md` — Step 1 resolves the Q1 caveat (JSON keys observed); update the entry's Q1 block if observation contradicts a claim (supersede, don't delete).
- Harness roadmap update = **numbered Step 9** (not a trailing note).
- Consuming-repo KB: business-rules registry landed by Step 7.

## Open Questions

None blocking. Defaults taken (architect's calls, all reversible, grounded in the research entry + repo scan): workspace-copy isolation over in-repo Pest runs (drivers absent + full-suite initial check + Postgres coupling); PHPUnit-class + eris as the generated-test API with Pest-compatibility as a constraint (native Pest-style generation documented as a variant, not built); Docker (`php:8.4-cli` + pcov) as the runner host; Infection timeout-as-killed default kept (matches the gate). The two genuine owner decisions are the **live-run spends** (Steps 6 and 7) and the **ship go/no-go** (Step 8, contingent on Step 7) — each surfaced at its checkpoint, never assumed.

## Plan Review

**Mode:** critic (fresh-context, code-grounded — owner's choice at the Phase-1 checkpoint). **Verdict: GO-WITH-FIXES → fixes applied, plan approved.** Full findings persisted verbatim in `delivery/review-critic.md` (the critic writes no file — ADR-13).

| Finding | Severity | Disposition |
|---------|----------|-------------|
| C-1 gen-omni.test.mjs missing from ship wiring (CI-breaking; cpp precedent commits `3d14501`/`3e6cafe`) | CRITICAL | Fixed — Step 8 wiring + acceptance now include the fixture seed + expected-list edit, same commit |
| H-2 offline guard has no cover-php hook ("run against" was a no-op) | HIGH | Fixed — Step 5 rewritten to extend-then-run with the three named edit sites |
| H-3 target-#2 deps understated (5 imports; `SamplingDimensionsData` framework-coupled) | HIGH | Fixed — Step 7 enumerates all collaborators + the 5-bool stub strategy |
| M-1 run-#1 deliverable landing unstated | MEDIUM | Fixed — Step 6 carries the every-run disposition |
| M-2 core-skill mentions under-counted (4 sites, not 2) | MEDIUM | Fixed — Step 8 names all four |
| L-1 Sonnet model pin not asserted | LOW | Fixed — Step 3 acceptance greps `model: 'sonnet'` |
| L-2 `Errored→Killed` pre-commitment vs inferred keys | LOW | Fixed — Step 8 mandates the probe-observed map |

Verified-clean areas (no action): research fidelity, fork/gate-battery reality, target #1, the two named wiring locations, CI release-check scope, all five cpp lessons carried.
