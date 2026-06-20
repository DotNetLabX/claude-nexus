# Section-Addressable Reads & Read-Discipline Extension — Review

## Step 1 — Done-Check

**Pre-commitment predictions (made before reading implementation.md):** for a prose/skill/agent
edit pass the likeliest gaps are (1) a section-map skill missed or with the wrong heading set,
(2) the regenerated commands not actually reflecting the agent edits, (3) the operator-owed AC4
delta dressed up as done rather than disclosed as operator-owed. All three were specifically checked;
none materialized.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Amend ADR-22 with section-targeting dimension | Implemented | `docs/architecture/README.md` ADR-22 carries an `**Extended (this release).**` note: section-targeting dimension, locate-heading → `offset/limit`, non-lossy, whole-read fallback (3 cases), framed as a two-way-door amendment (ADR-25), tied to ADR-14 + ADR-2 #2. Verified by read. |
| 2 — Extend canonical Read-Discipline rule | Implemented | `plugins/nexus/rules/agents-workflow.md` `## Read Discipline` has the new bullet "Read the section, not the whole file": locate-then-read mechanism, all three fallbacks (a/b/c), composes with chunked-reads exemption, names the format skills as the targeting index. Verified by read. |
| 3 — Section maps in the format skills | Implemented | All 6 targets carry a `**Section map (targeting index).**` line with correct fixed headings (review-format 2; implementation-format 7; summary-format 5; lessons-format 6 per-role + the `### Improvement Proposal` non-anchor caveat; plan-template 11). `questions-format` carries the variable-heading **exclusion** + the comm-log exclusion note. Authoritative ADR-23 gate `skill-lint.mjs` exits 0 — dogfood test `tests/unit/skill-lint.test.mjs` green ("all shipped nexus skills are lint-clean", 16/16). The 5→ratified set divergence (lessons-format added beyond spec's 4) is recorded as an architect-ratified extension in the plan (critic F2) — a documented decision, not drift. |
| 4 — Duplicate targeted-read rule into heavy-loader agents | Implemented | All **4** agent files carry the targeted-read line at the named insertion points (critic `## Tool Usage`; reviewer `## Before Reviewing`; architect `## Read Discipline`; po Question-Answering). PO added per ratified critic F1 (heavy-loader subagent, can't Read source) — recorded in plan, not drift. Regenerated commands verified: `git diff --name-only HEAD -- plugins/nexus/commands/` = exactly `architect/critic/po/reviewer`, no others; the line is present in each regenerated command. Generated files not hand-edited. **selfcheck gen-commands-drift RED is a pre-commit artifact — adjudicated MET below.** |
| 5 — Extend kb-navigation with section-targeting | Implemented | `plugins/nexus/rules/kb-navigation.md` step 4 names section-targeting (read the specific **section**, locate by heading → `offset/limit`, ADR-22 Extended); file stays at 18 lines. Verified by read. |
| 6 — Minimal measurement harness | Implemented + Deviated (valid, pre-authored) | `scripts/measure-read-cost.mjs` exists (pure `measureReadCost` core + guarded CLI, parser ported from `consumption-report/SKILL.md` per critic F4). `tests/unit/measure-read-cost.test.mjs` runs 6/6 green against the committed fixture. The **AC4 absolute-`cache_creation` drop is OPERATOR ACTION REQUIRED** (live `be critic` Mode-2 run + `token_audit` ON + reload) — explicitly deferred by plan Step 6 + Testing Strategy, recorded verbatim with both capture commands in implementation.md. Per the plan this reads `Deviated (valid reason)`, not Missing. |
| 7 — Release bump (same commit) | Implemented + Deviated (valid, plan wording) | `plugin.json` 1.16.0 → 1.16.1 (PATCH, verified against HEAD); `CHANGELOG.md` 1.16.1 entry present; `gen-omni --check` in sync (selfcheck PASS); bump staged in the same change set (commit is the team lead's). Deviation: plan said "both plugins touched" but only `nexus` changed — `nexus-dotnet/` is git-clean; `bump-plugin.mjs` (authoritative per-plugin classifier) bumped nexus only. nexus-only is correct; plan's "both" was a planning-time over-estimate. **`--strict` clause adjudicated MET below.** |

### Adjudication — Step 7 `claude plugin validate --strict` (independently verified)

**Ruling: Step 7 accept is MET. The `--strict` failure is genuinely pre-existing and out-of-scope.**

Independently reproduced `claude plugin validate plugins/nexus --strict` (exit 1). Evidence:
- The **only** failing skills are `boy-scout`, `diagnose`, `evaluate-skill`, `improve-skills` — all **git-clean** (`git status` empty on all four), **none modified by this slice**.
- **None of the 6 edited skills fail `--strict`** (verified: grepped the strict-run failure list for the edited skill names → zero hits).
- Root cause: the CLI's YAML parser rejects the repo's flat **unquoted, long, em-dash-bearing** `description:` frontmatter (e.g. boy-scout's description is unquoted, very long, contains a UTF-8 em-dash). The edited skills carry the same em-dash byte pattern but short descriptions the parser tolerates — so this is a CLI-strictness-vs-repo-convention quirk on the long-description skills, not a defect this change introduced.
- The repo's **authoritative** ADR-23 form gate — `improve-skills/scripts/skill-lint.mjs`, the gate the plan's own Skill Mapping names for Step 3 — passes on the **entire** estate including those 4 (dogfood test green, 16/16).

The substantive Step 7 acceptance (bump incremented, CHANGELOG present, omni in sync, bump rides the change set) is fully met by the real gates. The `--strict` clause fails on an environment/CLI issue outside this slice's scope; it warrants its own follow-up (frontmatter quoting across the long-description skills) and is **not** attributable here.

### Adjudication — Step 4 selfcheck `gen-commands drift` RED (independently verified)

**Ruling: Step 4 accept is MET. The RED is a pre-commit artifact, by design.**

Independently reproduced `node scripts/selfcheck.mjs`: `[FAIL] gen-commands drift` (3/4 checks pass; selfcheck process itself exits 0 — the line is informational). The drift check regenerates commands into the working tree, then `git diff --exit-code -- plugins/nexus/commands/` compares the working tree to **HEAD**. HEAD is the pre-change baseline; the 4 regenerated commands are correctly in the working tree but not yet committed.
- `git diff --name-only HEAD -- plugins/nexus/commands/` = exactly `architect.md critic.md po.md reviewer.md` — the 4 intended commands, no others.
- gen-commands is idempotent (re-running produces the same 4 files).
- This resolves to green the moment the team lead commits (HEAD = the regenerated commands → `git diff --exit-code` exits 0).

The working tree is correct; nothing to fix pre-commit.

### Skill-conformance check (scored against the log)

The plan's Skill Mapping has **only two non-`None` skill obligations**: Step 6 `tdd` (`TDD: yes`) and
Step 7 `Follow release-plugin`. Steps 1–5 are all `Skill: None` (prose edits — no pattern skill
covers "edit a rule/agent/skill file"); Step 3's acceptance is the ADR-23 **form gate**
(`skill-lint.mjs` exit 0), not a skill invocation, and that gate is green.

`implementation.md` carries the required `## Skills Used` section (structural gate satisfied) and
self-reports `tdd` (Step 6) and `release-plugin` (Step 7) invoked. The `.claude/audit/skill-invocations.log`
was not present/readable in this done-check context to corroborate the two self-reported invocations
against the round token; the self-report is internally consistent with the plan and with the observable
results (the TDD red→green test suite exists and passes; the bump + CHANGELOG + omni-sync that
`release-plugin` produces are all present and verified). No fabrication signal: every claimed
invocation has a corroborating on-disk artifact. The two non-`None` obligations are satisfied by their
verifiable outputs; the all-`None` Steps 1–5 are exempt from any empty-log Fail.

**Verdict: PASS**

All 7 steps are Implemented (Steps 6 and 7 carry plan-sanctioned, pre-authored Deviations with valid
reasons). The two developer-flagged items were independently adjudicated against the live tree and both
rule MET: the `--strict` failure is pre-existing on 4 untouched skills, and the selfcheck drift RED is
a by-design pre-commit artifact resolving on commit. No step is Missing. No scope creep (every changed
file maps to a plan step; the only untracked additions are the slice's own delivery artifacts + the
two Step-6 files). The AC4 absolute-drop measurement remains **operator-owed post-bump** (live agent
run + reload) — disclosed, not a gap.

*Status: COMPLETE — architect, 2026-06-20*

## Step 2 — Code Review

## Reviewed By
reviewer (nexus pipeline agent)

## Verdict: APPROVED

## Pre-commitment Predictions
1. **Logic error in `--since` boundary / `--agent` exact-match** — investigated; both correct (`>=` semantics, exact string match). No finding.
2. **CLI arg parsing: dangling flag with no value** — confirmed: `--agent` or `--since` as the last argv token silently sets `opts.agent = undefined`, which bypasses the filter. Severity LOW (dev-tool, operator-awareness assumed). See Findings.
3. **Test coverage gap on `calls` count for the malformed-row case** — confirmed: the dirty-input test does not assert `calls`. Low-stakes (calls is a diagnostic counter, not AC4's metric). See Gaps.
4. **Plan heading count for `implementation-format` (6 listed vs 7 actual)** — the plan enumerated 6 headings but the skill template has always had 7 (with `## KB Changes`). Implementation correctly documents 7. Origin: design (plan text imprecise). Not a defect in the code; the actual section-map is accurate.
5. **`questions-format` exclusion missing comm-log** — checked; the `communication-log.md` exclusion note is present in `questions-format/SKILL.md` line 12. No finding.

## Findings

### [LOW] CLI dangling flag silently ignored (`--agent` / `--since` with no value)
**File:** `scripts/measure-read-cost.mjs:54-55`
**Origin:** implementation
**Issue:** When `--agent` or `--since` is the last token in `argv` with no following value, `argv[++i]` returns `undefined`. `opts.agent = undefined` passes the `agent !== undefined` check in `measureReadCost` as `false`, so the filter is silently skipped — the operator gets an unfiltered result without any error. Same for `--since`: `Date.parse(undefined)` returns `NaN`, `sinceMs` stays `null` (the null-guard `since ?` is `undefined ? … : null`), so all rows are kept regardless.
**Fix:** After the loop, add a guard: `if (opts.agent === undefined && argv.includes('--agent')) { console.error('--agent requires a value'); process.exit(2); }` (and same for `--since`). Alternatively, check `argv[i+1]` before consuming it. Either is appropriate for a dev-tool.
**Confidence:** 85/100

## Positive Observations
- **Pure core + guarded CLI pattern** mirrors the repo's established `render-fleet.mjs` / testable-script pattern exactly, making the unit test import clean and the operator command runnable without a test runner.
- **Efficiency formula documented inline** — the comment on line 43 explaining `0/0 → 0` prevents future confusion about the guard. The distinction between absolute `cache_creation` (AC4's metric) and the ratio (amortisation, not waste) is called out at lines 6–7 and again at line 71.
- **Fixture data verified**: the test assertions in the 6 cases were checked against the raw fixture rows — all asserted totals are arithmetically correct.
- **All 3 fallbacks present** in the agents-workflow Read Discipline bullet (a: no `^#` match, b: ambiguous/duplicate heading, c: oversized section). Each resolves to a wider/whole read as the plan required.
- **Carry-over findings all addressed**: the developer pre-disclosed all four items (gen-commands drift, AC4 operator-owed, `--strict` pre-existing failure, nexus-only bump). All four adjudicated in Step 1 and confirmed not-defects here.

## Gaps
- **`calls` count not asserted in the malformed/dirty-input test** (`measure-read-cost.test.mjs:63-68`): the test confirms `cacheCreation` and `cacheRead` are unaffected, but does not assert that `calls` equals 7 (6 real rows + the valid-JSON no-cache row). Low-stakes (calls is a diagnostic counter), but a complete coverage of the malformed-tolerance case would include it.
- **No boundary test at the exact `--since` timestamp** (a row with `ts === since`): the test uses a timestamp between the two groups, so it exercises the `<` side but not the inclusive `==` side. The `>=` semantics are correct by inspection of line 37, but the boundary case is untested.
- **AC4 absolute-drop measurement is operator-owed** (plan-sanctioned, pre-authored, confirmed in Step 1). The harness and procedure are committed; the live delta is not capturable at done-check time.

## Open Questions
None — all carry-over findings resolved; no finding fell below the 80-confidence cutoff except the LOW finding above (confidence 85, within range).

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Unit tests (Step 6) | pass | `node --test tests/unit/measure-read-cost.test.mjs` | 6/6 pass, 86ms |
| Full test suite | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 232/232 pass, 6057ms |
| Section-map lines present | pass | `grep -n "Section map"` across 5 skills | All 5 fixed-heading skills carry the targeting-index line; `questions-format` carries the variable-heading exclusion; `communication-log.md` exclusion present |
| ADR-22 Extended note | pass | `grep -n "Extended" docs/architecture/README.md` | Line 618 carries the section-targeting amendment with locate-then-read mechanism, non-lossy guarantee, 3 fallbacks, two-way-door framing |
| agents-workflow new bullet | pass | Read `plugins/nexus/rules/agents-workflow.md` offset 108 | New bullet present after "Sanctioned re-reads"; all 3 fallbacks (a/b/c) present; cross-references format skills and ADR-22 Extended |
| Heavy-loader agent edits (4) | pass | grep for targeted-read clause in critic/reviewer/architect/po | All 4 present at named insertion points |
| kb-navigation step 4 | pass | Read `plugins/nexus/rules/kb-navigation.md` | Step 4 names section-targeting; file 19 lines |
| skill-lint gate (ADR-23) | pass | dogfood test `tests/unit/skill-lint.test.mjs` (in 232 run) | 16/16 nexus skills lint-clean |

*Status: COMPLETE — reviewer, 2026-06-20*
