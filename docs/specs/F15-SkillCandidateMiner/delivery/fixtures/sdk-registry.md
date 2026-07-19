# Skill-gaps registry — omnivision-ai-sdk (mine-skill-candidates golden-fixture run)

**Run date:** 2026-07-19. **Swept repo:** `D:\omnishelf\omnivision-ai-sdk` (read-only input — nothing
written into that repo; this file is the F15 fixture artifact, per plan D1). **Method:**
`mine-skill-candidates` v1, executed by-Read from the working tree (the skill is not yet in the
installed plugin cache — Read-channel deviation, plan D2).

**Lens A window (D6):** full history, `2022-09-21` (first commit `178afd1`) through `2026-07-19`
(HEAD `c17cd28`), 1192 commits on `adhoc-RulesRegistry`. Chosen because the repo is small enough
(1192 commits) that a full-history scan is cheap and maximizes recurrence signal for the seeded
recipes.

**Tooling (D5 fallback fired):** `java`/Code Maat unavailable on this machine (`java` not on PATH).
Per the pre-authored fallback, Lens A co-change was computed directly from `git log --all --numstat`
(pairwise file-touch counting per commit), not Code Maat. `lizard` is present (1.23.0) but unused —
Lens A here only needs co-change, not complexity. **Deviated (valid reason), not Missing.**

**Bot filter:** `git shortlog -sne --all` shows 8 human identities (norbert, laurentiu-omni,
norbert-omniaz ×2, bmeric, maurycy.chomicz ×2, SrinivasVishal7, ldumit, Baris Meric) — no
dependabot/renovate/`[bot]`/CI accounts. Filter is a documented no-op on this repo (matches the
existing `docs/tech-debt/index.md` finding for the same repo).

**S2 skeptic:** fresh-context `general-purpose` subagent, `model: sonnet` (D4), re-executed a
sample of the citations below directly against the live repo via PowerShell/`git -C` (never
sandboxed Bash, per the external-repo rule). Its findings are folded into the rows below — two
citation errors caught and corrected (a commit misdated by a year; a class-body line range off by
two), and one weaker Lens B instance downgraded from "confirmed" to "partial, excluded."

**Seed join** (hand-authored Gaps table, `docs/architecture/index.md:197-203`):

| Suggested Skill Name | What's Missing | Seed file-list (Gaps table) |
|---|---|---|
| `add-action-type` | Shelf action types | fixing_tools + assistant + planogram_tools + ts_types |
| `add-kpi-metric` | KPI metrics | fixing_tools::KPI + calcKPI + Settings + reports |
| `add-task-type` | Scheduler task types | ts_task + ts_scheduler + core_adapter + ts_types |
| `add-config-param` | Config parameters | Settings + Variable + Configurator |
| `add-callback` | SDK->App callbacks | ts_types + core_adapter + Scheduler |
| `add-compliance-type` | Compliance checks | planogram_tools + fixing_tools + assistant |
| `create-conventions-doc` | Conventions doc generation | (no code file-set — hand-written this pass) |

---

## Skill candidates

| name | kind | source | recurrence | citations | repo | skeptic excerpt | last_verified | status |
|------|------|--------|-----------|-----------|------|-----------------|---------------|--------|
| `add-task-type` | gap | code | 69 co-change commits (Lens A) + 3 structural instances (Lens B) | Lens A: `def61d0` (2023-04-24, "ad-hoc version of task scheduler", 8/8 files), `dded672` (2025-06-26, "PD-2933 task cancelation", 5/8), `7201540` (2025-03-07, "PD-1475 SDK crash handling", 5/8). Lens B: `src/task_scheduler/ts_task.hpp:9-24` (`TaskBase`, 5-method private skeleton) instantiated identically by `src/task_scheduler/tasks/task_assistant.hpp:18-33`, `task_esl_blink.hpp:17-32`, `task_report_processor.hpp` (skeptic-read confirmed) — 22 total `task_*.hpp` files under that directory, 3 spot-verified exact | omnivision-ai-sdk | "SHA exists, date `Mon Apr 24 14:52:32 2023` matches, subject matches exactly. All 8 named files present... Method set matches exactly: initTask(), startTask(std::atomic<int>&), onProgress(), onTaskFinishedSuccess(), onTaskFinishedFail(), all private and pure-virtual." (class body actually closes at line 24, not 22 as first drafted — corrected here) | 2026-07-19 | candidate |
| `add-kpi-metric` | gap | code | 137 co-change commits (Lens A) | `3d97b3a` (2026-05-21 — corrected from an initially misdated 2025-05-21 per skeptic re-check, "PD-5571 KPI calculation for POSM", 5/8 files: fixing_tools.cpp/.h, planogram_tools.cpp, settings.cpp, reportProcessor.cpp), `ce8f96a` (2026-06-08, "PD-5688 POSM/Price KPIs for full planogram", 3/8), `8c84051` (2026-03-28, "upd", 6/8), `0d8d021` (2025-10-16, "SDK KPIs calculation", 3/8) | omnivision-ai-sdk | "SHA exists, subject... matches exactly, all 5 named files present. But actual date is Thu May 21 09:54:27 2026, not 2025 as claimed — a full year off." | 2026-07-19 | candidate |
| `add-config-param` | gap | code | 43 co-change commits (Lens A) | `178afd1` (2022-09-21, "OmniazCore" — the initial commit, 5/5 files: settings.cpp/.h, utils/variable.hpp, utils/configurator.cpp/.h — the full file-set in one commit), `12744b2` (2026-06-24, "add flag keep_big_frames", 2/5), `1b39a43` (2026-04-16, "PD-5169 per class detection thresholds", 2/5) | omnivision-ai-sdk | "Date Wed Sep 21 14:03:05 2022 matches, subject 'OmniazCore' matches exactly. All 5 named files... present — correctly identified as a subset of this 116-file initial commit." | 2026-07-19 | candidate |
| `add-callback` | gap | code | 69 co-change commits (Lens A) + 9 structural instances (Lens B) | Lens A: `4bc3985` (2026-01-12, "PD-4499 ESL Demo integration", 4/6), `dded672` (2025-06-26, "PD-2933 task cancelation", 5/6), `def61d0` (2023-04-24, "ad-hoc version of task scheduler", 6/6 full set). Lens B: `src/task_scheduler/ts_types.h:176-201` carries 9 `extern "C" typedef void(*callback_X)(...)` declarations (callback_collected_anchors, callback_recognition_update, callback_ocr_update, callback_pricetag_porcessing_update, callback_new_detection, callback_video_processing_update, callback_processed_planogram_update, callback_faliure_task_id, task_canceled) — same declaration skeleton repeated 9x | omnivision-ai-sdk | Lens A citations share the skeptic-confirmed `def61d0`/`dded672` verification above (same commits, add-task-type row); Lens B callback list independently re-read at S1 collection time, not separately re-run by the skeptic this pass (flagged for next-run re-check) | 2026-07-19 | candidate |
| `add-compliance-type` | gap | code | 91 co-change commits (Lens A) | `be4c195` (2025-04-10, "PD-1575 Step by step assistant", 5/6: fixing_tools.cpp/.h, planogram_tools.cpp, assistant.cpp/.hpp), `9bf3358` (2025-12-12, "PD-4465 Move inserts into gaps on OSA", 3/6), `05b67df` (2025-04-28, "demo fixes", 4/6) | omnivision-ai-sdk | "Date Thu Apr 10 12:05:28 2025 matches, subject 'PD-1575 Step by step assistant' matches exactly. All 6 named files present (of 20 total), correctly framed as '6 of 8.'" (8 = the add-action-type file-set this same commit also touches, see below) | 2026-07-19 | candidate |
| `add-action-type` | gap | code | 95 co-change commits (Lens A) | `be4c195` (2025-04-10, "PD-1575 Step by step assistant", 6/8: fixing_tools.cpp/.h, assistant.cpp/.hpp, planogram_tools.cpp, ts_types.h), `05b67df` (2025-04-28, "demo fixes", 4/8), `30511fd` (2025-04-14, "scan verification WIP", 4/8) | omnivision-ai-sdk | Same skeptic-confirmed `be4c195` verification as the add-compliance-type row (shared citation, the two recipes' file-sets overlap on `fixing_tools`/`planogram_tools`) | 2026-07-19 | candidate |
| `create-conventions-doc` | gap | code | 0 (no lens corroboration — doc-shaped recipe, no code file-set to co-change or structurally recur) | seed only: `docs/architecture/index.md:203` ("no `create-conventions-doc` skill exists — this pass wrote it by hand") | omnivision-ai-sdk | not run — no lens evidence exists to re-read | 2026-07-19 | candidate — **uncorroborated** (does not count toward the run gate) |

**Cross-corroboration note:** none of these rows pre-existed as `artifact`-source rows (this SDK repo
has no `mine-skill-gaps` run yet — a thin delivery estate, exactly the condition this mine exists
for), so no merge fired this run; every row is `source: code` only.

## Anti-patterns (do-not-propagate)

| pattern | instances | tech-debt row | last_verified | status |
|---------|-----------|---------------|---------------|--------|
| Repeated per-frame linear scan over `bigFrameDetections_` (identical `for(size_t i=0;i<bigFrameDetections_.size();i++)` loop opened independently at each call site instead of one shared iterator/index helper) | `src/processors/reportProcessor.cpp:1451,1578,1627,1653,1669,1700,1708,1728` (8 instances, skeptic re-confirmed: "grep -n for the literal loop pattern... returns 8 hits at lines 1451, 1578, 1627, 1653, 1669, 1700, 1708, 1728 — identical to the cited current lines") | `docs/tech-debt/processors.md` **PRC-9** (performance, severity high→medium, "pending triage") | 2026-07-19 | candidate |

**Note on the tech-spec's own expected citation (COR-4):** the tech-spec named the near-duplicate
KPI-block shape (`docs/tech-debt/core-root.md` COR-4, `report_kpis`/`svg_kpis`/`posm_kpis` blocks in
the old `fromJson`) as the anticipated anti-pattern row, with IFC-4 (4x duplicate FFI image-ingest
blocks) as a second candidate. **Both are now stale** — this SDK repo underwent an active
`adhoc-RefactoringPlan` in the days before this run (commits `c6354c9` "D1 Planogram::fromJson
3-layer restructure (COR-1)" and the `E4-Unit-*` core_adapter Move series) that extracted a shared
`parseReportKpi` helper (COR-4 resolved) and consolidated the 4 `newmemcpy` call sites into one
`buildPreprocessItem` helper in `core_adapter_ingest.h` (IFC-4 resolved). Skeptic-confirmed: `grep`
for `currKPI\.` in `src/planogram.cpp` → 0 hits; `grep` for `newmemcpy\(tmpitem\.img\.data` in
`src/interfaces/core_adapter.cpp` → 0 hits. **This is the health gate working as designed** — a
citation that no longer resolves at the swept revision does not enter the registry, even when a
tech-spec named it as the expected example. PRC-9 is offered as the still-live substitute per the
tech-spec's own "or another recurring-shape ∩ debt-row intersection" allowance.

## Run report (accept-criteria evidence)

**Corroboration count:** 6 of 7 seeded recipes corroborated with lens-produced citations (Lens A
commit SHAs, in every case — never the seed's own Gaps-table file-list). Gate requires ≥3;
**6 ≥ 3, PASS.** Only `create-conventions-doc` stayed uncorroborated (anticipated at plan time —
a doc-authoring recipe has no code file-set for either lens to find), correctly excluded from the
count per S1's uncorroborated-seed rule.

**Spot-check (≥3 counted rows' citations resolve):** 4 Lens A citations were independently
re-executed by the S2 skeptic subagent via `git -C ... show --stat <sha>` — `def61d0`, `3d97b3a`,
`178afd1`, `be4c195` — all 4 SHAs exist in SDK history with matching subjects and file-touch sets
(one date correction folded: `3d97b3a` is 2026-05-21, not the initially drafted 2025-05-21).
**4 ≥ 3, PASS.** The Lens B `TaskBase` skeleton citation was independently re-read at
`ts_task.hpp:9-24` and confirmed to hold verbatim across 3 of 4 spot-checked instances (the 4th,
`task_video_processor.hpp`, redeclares the same method signatures but as `public` rather than
`private` — downgraded out of the "exact match" citation and left as an uncited 4th instance,
not double-counted as an exact skeleton hit).

**Anti-pattern row (≥1 required):** PRC-9 (`reportProcessor.cpp`, 8 duplicate scan-loop instances)
— skeptic re-confirmed exact line match. **1 ≥ 1, PASS.** The tech-spec's own named example (COR-4)
was checked and found stale/resolved by concurrent repo work — reported here rather than
substituted silently.

**Overall: run gate PASSES** (6/7 corroborated ≥ 3; ≥3 citations spot-check resolve; 1 anti-pattern
row with a resolving tech-debt citation).

## Changelog

- **2026-07-19** — First run of `mine-skill-candidates` against `omnivision-ai-sdk` (F15
  golden-fixture run, executed by-Read from the working tree). 6/7 seeds corroborated, 1 anti-pattern
  row emitted. Code Maat unavailable — git-only co-change fallback (D5) used throughout. S2 skeptic
  (fresh-context `general-purpose`, `model: sonnet`) corrected one commit date and one line-range
  citation, downgraded one Lens B instance from exact-match to partial, and independently confirmed
  the COR-4/IFC-4 staleness finding.
