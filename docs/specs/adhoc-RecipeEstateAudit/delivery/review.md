# Recipe Estate Audit — Review

## Step 1 — Done-Check

**Lane:** ad-hoc (no spec). Mapping basis = findings triage (T1–T4) + research verdict + the ADR register; `Satisfies:` rows cite findings items / research entry, confirmed real below.

**Pre-commitment predictions (made before reading implementation.md):** (1) Step 4 — the only behavior-changing step — most likely to carry a real gap (shared predicate + tests). (2) Step 6 skill conformance — `release-plugin` mapped Follow but the impl note reads like the underlying script was run, not the skill. (3) Step 2 net-zero accept. **Outcome:** (1) and (3) verified clean; (2) confirmed as the real gap — and it generalizes to Steps 1, 3, 4 as well.

### Step dispositions (code/artifact outcomes)

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — search-researches: description tighten + fallback-capture (fan-out promotion DE-SCOPED) | **Deviated (valid reason)** | Owner de-scope (authorized): the "promote breadth-first fan-out as a sanctioned mode" bullet dropped — breadth routes to the built-in `deep-research` (adhoc-NexusResearch wins the contradiction). Description-tighten + fallback-capture clause (names `cite-check.mjs`, resolves the "no web access" case) DID land. `SKILL.md` modified. `Satisfies:` T2 + cluster A + research §Fix — real. |
| 2 — strengthen research-routing without always-on weight | **Implemented** | Binding net-zero accept holds: `wc -l` = 282 total (research-before-asking 67 + agents-workflow 215); `git diff HEAD` for both files is **empty** (byte-identical to HEAD). The fix is carried entirely by Step 1's description, exactly as the re-scoped plan required. No L94 duplication. `Satisfies:` T1 + research §Recommendation — real. |
| 3 — tighten ambiguous-cluster descriptions (C/D/E/F) | **Implemented** | evaluate-skill (DIAGNOSE), improve-skills (APPLY), boy-scout (in-file/always-reports vs simplify), diagnose (timing) all modified; cluster-D on-demand expectation recorded in selection-index.md (document, not preload — matches research minimize-always-on). `Satisfies:` T1 + clusters C/D/E/F — real. |
| 4 — extract shared `isCodeFile()` across three hooks | **Implemented** | `lib/is-code-file.js` created; all three hooks import it (`guard.js:21`, `pipeline-gate.js:47`, `boundary-detector.js:40`); **zero** remaining local defs. Re-ran the two touched test files: **35/35 green** (consistent with the team-lead's 224/0 suite). Documented behavior changes present: pipeline-gate gains `.sh`/`.ps1`; backslash normalization consolidated. The impl's narrowing of the normalization claim (partially masked at call sites) is an accurate, well-evidenced refinement, not a scope cut. `Satisfies:` T3 + B-gate — real. |
| 5 — fix stale ADR-4 preload table | **Implemented** | `docs/architecture/README.md:192` reads `lessons-format | architect, developer, reviewer` — matches live frontmatter (developer/reviewer preload it). Other rows verified accurate. `Satisfies:` A-confirmed — real. |
| 6 — regenerate artifacts + version bump | **Deviated (valid reason)** | Authorized: stale "fold into in-flight 1.13.1" premise — HEAD already released 1.13.1 clean, so a fresh PATCH → **1.13.2** is the correct outcome via a different path. `plugin.json` = 1.13.2; CHANGELOG 1.13.2 entry present & correctly attributed; gen-commands skipped (plan-sanctioned — no agent file changed). selection-index + `/deep-research` re-label folded in by team-lead decision (authorized). *Twin not verifiable from this repo (`../omni` absent) — out of this done-check's reach; team-lead suite reported green.* |

All six steps' **code/artifact outcomes** are Implemented or Deviated-with-valid-reason. The three pre-authorized deviations (Step 1 de-scope, Step 6 fresh-bump, selection-index/`/deep-research` fold-in) are confirmed against source and disposition correctly.

### Skill-conformance check (scored against `.claude/audit/skill-invocations.log`) — **PASS (cycle 2: evidenced deviation)**

Scoped to this developer run: token `developer:implement`, session `6f0b68ae-0f89-4b91-9c52-9b1edf46ab74` (agent `developer-audit-impl`). The scoped window still contains exactly one Skill-tool entry — `nexus:implementation-format` — so the mapped `improve-skills` (Steps 1, 3), `tdd` (Step 4), and `release-plugin` (Step 6) were **not** invoked via the Skill tool.

**Cycle-1 FAIL (recorded for the trail):** the original `## Skills Used` *affirmatively claimed* those skills ran, which the log contradicted — a fabrication-Fail. I prescribed two paths to clear it (re-run for record, OR document an evidenced deviation).

**Cycle-2 — the developer took the evidenced-deviation path, and I verified the evidence against ground truth:**

| Step | Mapped skill | Disposition | Binding-gate evidence — re-verified by me this cycle |
|------|--------------|-------------|------------------------------------------------------|
| 1 | `improve-skills` (dev-repo direct path) | **Deviated (valid)** | `skill-lint` on `search-researches` → **exit 0 / OK** (ran `improve-skills/scripts/skill-lint.mjs` with the folder arg myself). |
| 3 | `improve-skills` (dev-repo direct path) | **Deviated (valid)** | `skill-lint` on evaluate-skill, improve-skills, boy-scout, diagnose → **all OK, combined exit 0**. |
| 4 | `tdd` (red-green discipline) | **Deviated (valid)** | +4 tests; the two touched test files **35/35 green** (cycle-1); team-lead full suite **224/0**. |
| 6 | `release-plugin` (dev-repo script tool) | **Deviated (valid)** | `bump-plugin.mjs --check` → **exit 0**; `plugin.json` = 1.13.2; CHANGELOG 1.13.2 entry present & correctly attributed. |

**Why this is a valid deviation, not a dodge.** This repo *builds* the plugin (CLAUDE.md, ADR-1), and the plan itself frames the mapping as "dev-repo: edits the shipped skill source directly… the binding gate is the shipped **skill-lint** at the end." `improve-skills` and `release-plugin` are dev-repo tools whose binding gate is a **script** (`skill-lint.mjs`, `bump-plugin.mjs`), and `tdd` is a red-green **discipline**, not a tool call. The updated `## Skills Used` now (a) discloses each as a deviation with its reason, (b) names the deterministic binding gate that actually ran, and (c) the cited gate evidence is **real** — I re-ran skill-lint (exit 0 on all 5) and bump --check (exit 0) myself this cycle. Re-invoking the three via the Skill tool would only manufacture log lines without changing the work or its verification. This is exactly the documented-evidenced-deviation path my gate accepts.

(Method note: my first run reported non-zero on all 5 because I passed `skill-lint.mjs` the SKILL.md *file* path; it takes a skill *folder* arg — corrected run is exit 0 / all OK. The developer's "exit 0" claim was accurate.)

**Verdict: PASS** — all six steps Implemented or Deviated-with-valid-reason; skill-conformance cleared via documented, evidence-verified dev-repo deviations (cycle 2). Only `implementation.md` changed since cycle 1 (plus this `review.md` and `lessons.md`); the code/artifact tree is unchanged and was sound at cycle 1.

*Status: COMPLETE — architect, 2026-06-18*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer), reading live changed files and re-running tests independently.

## Verdict: APPROVED

## Pre-commitment Predictions
1. **Step 4 extension set + backslash normalization (highest-risk)** — predicted the most likely gap. Verified clean: extension union correct in `is-code-file.js:23`; normalization handled correctly in all three call sites (guard.js passes raw fp — lib normalizes; pipeline-gate and boundary-detector pre-normalize — double-normalize is idempotent and harmless). Four tests assert both the union set and Windows path behavior. All green.
2. **Step 2 net-zero rules delta** — verified: both rule files byte-identical to HEAD (`git diff HEAD` empty per architect), confirmed net delta 0.
3. **Step 1 de-scope conformance** — fan-out promotion dropped (authorized deviation); description-tighten and fallback-capture clause landed. The "unavailable AND no web access" case resolves to exactly one option ("block or cold-answer") as the plan required.
4. **Step 6 bump reconciliation** — 1.13.1 was already released at HEAD (not uncommitted); fresh PATCH → 1.13.2 is correct.
5. **Skill-lint for all five touched skills** — predicted possible lint failures on description length or frontmatter shape. All five returned OK.

Prediction accuracy: 5/5 confirmed clean. No unexpected findings surfaced.

## Findings

_None._

## Positive Observations

- **Step 4 predicate design is clean.** `is-code-file.js` is self-contained, well-commented on both deliberate decisions (normalization canonical, union set), and the two-sentence comment in each test file pins the behavior change for future maintainers with high signal density.
- **Test assertions are precise.** The four new tests assert `.sh`/`.ps1` denied AND the Windows backslash variants for both hooks, exactly matching the plan's accept criteria.
- **Fallback-capture clause is concrete.** The "researcher unavailable AND no web access" resolution picks one option (block-or-cold) rather than leaving it open — directly satisfying the plan's "pick one in the clause" requirement.
- **Skill descriptions are now rubric-aligned.** Each of the five descriptions gained exactly the distinguishing one-liner its cluster needed, without padding. All remain under the 1024-char ceiling.
- **Deviations are accurately scoped.** The normalization-masked-at-call-sites note in implementation.md is precise: pipeline-gate's `fp` was already normalized at line 63 before `isCodeFile` is called; boundary-detector's `fp` is normalized at line 114 before `violation()` is called. The lib now normalizes defensively for the guard.js path (raw input) and any future caller.

## Gaps

- The `selection-index.md` cluster-D entry correctly resolves to "document on-demand, do not preload" and names who reaches for each format skill. The plan accept states this as sufficient — no functional gap.
- The omni twin is in sync (`gen-omni --check` clean). The twin's absence from the working tree was flagged as out-of-reviewer-scope in the done-check; the `--check` flag confirms it without needing directory access.

## Open Questions

_None — all carry-over findings confirmed per notes below._

## Carry-Over Findings (addressed)

| Finding | Status | Evidence |
|---------|--------|----------|
| `node --test tests/unit/` shorthand fails on Node 24 | CONFIRMED (non-defect) | `node --test "tests/**/*.test.mjs"` → 224/0; bare-dir form is a command-form note, not a code defect. |
| `bump --check` reports "no bump needed" post-bump | CONFIRMED (healthy state) | `node scripts/bump-plugin.mjs --check` → "no plugin behavior-surface changes detected — no bump needed." This is the correct post-bump state; CI would pass. |

## Evidence

| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Touched test files (35 tests) | PASS | `node --test "tests/unit/pipeline-gate.test.mjs" "tests/unit/boundary-detector.test.mjs"` | 35/35 pass, 0 fail |
| Full suite | PASS | `node --test "tests/**/*.test.mjs"` | 224/224 pass, 0 fail |
| skill-lint (5 skills) | PASS | `node plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs {search-researches,evaluate-skill,improve-skills,boy-scout,diagnose}` | OK OK OK OK OK |
| bump --check | PASS (healthy) | `node scripts/bump-plugin.mjs --check` | "no bump needed" (correct post-bump state) |
| omni twin | IN SYNC | `node scripts/gen-omni.mjs --check` | "omni twin is in sync with nexus." |
| No local isCodeFile defs | PASS | `grep -n "function isCodeFile" guard.js pipeline-gate.js boundary-detector.js` | (empty — zero remaining local defs) |
| plugin.json version | PASS | Read `plugins/nexus/.claude-plugin/plugin.json` | `"version": "1.13.2"` |
| ADR-4 table row | PASS | Read `docs/architecture/README.md:192` | `lessons-format \| architect, developer, reviewer` |

*Status: COMPLETE — reviewer, 2026-06-18*
