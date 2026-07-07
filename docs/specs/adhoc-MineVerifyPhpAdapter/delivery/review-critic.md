# Critic findings — adhoc-MineVerifyPhpAdapter plan review (persisted by architect per ADR-13)

**Mode:** Plan Review (Mode 2, code-grounded, ad-hoc — no spec.md; binding inputs = adapter contract, cpp precedent, cited research)
**Reviewed:** `docs/specs/adhoc-MineVerifyPhpAdapter/delivery/plan.md`
**Date:** 2026-07-06
**Verdict: GO-WITH-FIXES**

> The arc (probe → Mine/Verify → thin fork → offline guard → two live runs → ship) is sound, well-grounded, and faithfully carries the cpp precedent's lessons and the research verdicts. Three fixes block a clean ship — two are CI-breaking wiring omissions the cpp precedent already stumbled on, one is a false dependency claim about the run-#2 target that the on-disk source contradicts.

## Findings

### [CRITICAL] C-1 — Step 8 ship wiring omits `tests/unit/gen-omni.test.mjs`; the ship commit lands red CI
Plan Step 8 names only `marketplace.json`, `gen-omni.mjs`, and the core skill. Editing `gen-omni.mjs` to add `omni-php` breaks `gen-omni.test.mjs` twice: (a) `tests/unit/gen-omni.test.mjs:55` asserts the produced list is exactly `['omni','omni-dotnet','omni-flutter','omni-cpp']` — deepEqual fails; (b) `:30-31` seeds stack plugins in a synthetic sandbox ("seed them so collect() doesn't ENOENT") — the new `mirrorDir` ENOENTs against the un-seeded sandbox. CI hard gate: `.github/workflows/plugin-release-check.yml:46-58` (`node --test tests/unit/*.test.mjs`). Precedent proof: the cpp campaign needed fixup commits `3d14501` (gen-omni test fixture repair) and `3e6cafe` (gen-omni wiring, separate from ship commit c3f9922).
**Fix:** add `tests/unit/gen-omni.test.mjs` to Step 8's edit list + `git show --stat` acceptance: seed `plugins/nexus-php/skills/.../SKILL.md` in `before()`, extend the line-55 assertion with `'omni-php'` — same commit.

### [HIGH] H-2 — Step 5's acceptance is mechanically unreachable: the offline guard has no cover-php hook
`workflow-contract.test.mjs` is a fixed suite, not CLI-parameterized. Covering cover-php requires editing three places (confirmed live): a `COVER_PHP_PATH` constant (sibling of `COVER_CPP_PATH` at :28); a `['cover-php', COVER_PHP_PATH]` entry in the static-import/meta-purity loop list at :1554; a cover-php sandbox-run slice (analogue of `cover-cpp runs in sandbox` :1498-1518) with PHP-shaped runner fixtures (Infection-json-translated `mutants`/`mutationSummary` return). As written ("run … against"), Step 5 silently no-ops on the new file and a defect reaches a paid live run.
**Fix:** reword Step 5 to "extend, then run"; acceptance = a passing `cover-php` slice exists.

### [HIGH] H-3 — Step 7's target-#2 dependency claim is contradicted by the source; one collaborator is framework-coupled
`SelectStratifiedSampleAction.php:7-11` imports five collaborators, not two: `Illuminate\Support\Collection` (composer), `Random\Randomizer` (native), plus module-internal `SamplingCandidateData` (plain final-readonly DTO — benign), `SamplingScanTypeGroup` (+ transitive `App\Enums\AnalyticsReportScanType`, plain string enums — benign), and **`SamplingDimensionsData`** which `extends Spatie\LaravelData\Data` and references the Eloquent model `ReportSamplingSetting` (SamplingDimensionsData.php:8-10) — an as-is copy fails to autoload or drags Laravel into the self-contained workspace.
**Fix:** `execute()` only reads `SamplingDimensionsData`'s five public booleans and tests construct it directly (never via `fromSetting()`) — replace with a plain 5-bool stub in workspace `src/` (`char_pin` pins only the target file, so a stubbed collaborator is legal). Enumerate all four collaborators + the stub strategy in Step 7.

### [MEDIUM] M-1 — Run-artifact landing specified only for run #2; run #1's deliverables unstated
The adapter rule (cpp SKILL.md:99-123) requires EVERY run — green or refused — to land artifacts in the consuming repo. Step 6 records only gates + cost.
**Fix:** state run #1's disposition in Step 6: gates pass → suite lands in `tests/Unit/MineCode/` + KB in `docs/business-rules/…`; sub-floor → report + KB only.

### [MEDIUM] M-2 — Core-skill edit surface under-counted ("two mentions")
The live core skill names adapters in at least FOUR places: `mine-verify-cover/SKILL.md:21` (intro), the fact/tier stack-adapter table :296-302, the "does NOT do" bullet :326, the relationship table :409-411.
**Fix:** enumerate all four sites; add the relationship-table row + a `deferred` fact/tier row (mirroring cpp) or state the omission explicitly.

### [LOW] L-1 — Model pinning not called out
Core "## Model" pins `agent()` to Sonnet; the plan relies on the fork inheriting it silently. **Fix:** Step-3 acceptance: grep confirms `model: 'sonnet'` on the Cover + runner agent calls.

### [LOW] L-2 — `Errored→Killed` pre-commitment vs research caveat
The capabilities table commits a status map whose top-level keys research Q1 marks as inferred. Safe only if the shipped SKILL.md (Step 8) uses the probe-observed map. **Fix:** explicit note in Step 8.

## Verified clean (no action)
Research fidelity (all load-bearing claims match cited verdicts, full-suite caveat honored by workspace design); fork reality (gate battery present + diffable in both workflows, `_argsRaw`/`JSON.parse` real at cover-cpp.workflow.js:174-176 / cover.workflow.js:218-220; guard checks match Step 5's list); target #1 fully clean (Carbon-only, pure, observable); the two named wiring locations correct (gen-omni.mjs:96, marketplace.json:24); CI release-check needs NO nexus-php line (validates only nexus + nexus-dotnet — precedent-consistent); all five cpp lessons carried; ship footprint otherwise matches c3f9922.
