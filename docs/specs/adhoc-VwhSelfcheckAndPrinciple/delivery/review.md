# VWH Adoptions — Allocation Principle + Selfcheck Extensions — Review

## Step 2 — Code Review

## Reviewed By
nexus:reviewer agent (claude-sonnet-4-6)

## Verdict: APPROVED

## Pre-commitment Predictions
1. **Regex patterns in `wiring.test.mjs` for agent-name refs may miss or over-match** — Did not materialize. Verified: only 8 `subagent_type` matches in agents/rules/skills, all resolving correctly (critic × 5, Explore × 2, general-purpose × 1); zero `nexus:X` references in the scanned surfaces today (the test is forward-looking per the allowlist design). Regex scope is correct.
2. **`selfcheck.mjs` glob form may silently break on Windows Node.js** — Did not materialize. `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` passes via execFileSync on Node v24.13.0 Windows (selfcheck reports tests passing). The deviation from the plan's bare-dir form is valid and correctly documented.
3. **`salience-report.mjs` measurement may not reproduce the binding numbers** — Did not materialize. `collect()` returns architect.md maxBlockWords=574, agents-workflow.md maxBlockWords=1034, exactly matching the plan's Accept criteria. Total 19 rows = agent/rule file count confirmed.
4. **Block extraction regex may not precisely bound the ADR-14 block** — Did not materialize. All 8 agents are carriers; extracted block length is 777 chars each (byte-identical confirmed by the test). The regex stops correctly at the Cycle-caps bullet end.
5. **Step 2 learner.md may have bolded "three ways" contrary to the plan** — Did not materialize. Git diff confirms only "Classify" stays bold; "three ways" is plain text, exactly per the plan's before/after constraint.

## Findings

No blocking findings. Two LOW observations below.

### [LOW] `wiring.test.mjs` `nexus:X` regex branch has zero current hits — vacuous pass
**File:** `tests/lint/wiring.test.mjs:98-104`
**Confidence:** verified (live scan)
**Issue:** The `nexus:X` pattern currently matches zero references in agents/rules/skills (confirmed by running the scan manually). The test passes vacuously for that branch — a broken regex would also pass. Not a defect in the current tree (developer documented it as forward-looking); the `subagent_type` branch has 8 real hits covering the regex logic. The risk is that if the regex breaks in a future edit, no existing reference would catch it before a real `nexus:X` reference appears.
**Fix:** Consider adding a comment in the test acknowledging zero hits is expected, or assert that the scanner visited at least N files as a proof-of-life check. Optional.

### [LOW] `selfcheck.mjs` test output parse: green run shows "0 failing" not "all passing"
**File:** `scripts/selfcheck.mjs:44-47`
**Confidence:** verified (code trace)
**Issue:** Pattern `/# fail (\d+)/` matches `# fail 0` on a green run (match object is truthy), so `detail` becomes `'0 failing'` instead of `'all passing'`. The exit code (`r.status === 0`) correctly gates `ok`, so this is cosmetic only.
**Fix:** Change to `/# fail ([1-9]\d*)/` to match only non-zero fail counts, letting the green path fall through to `'all passing'`. Optional.

## Carry-Over Findings (from implementation.md)

| Carry-Over | Confirmed / Refuted | Evidence |
|------------|---------------------|----------|
| Pre-existing nexus-dotnet staged changes are NOT this slug's | **Confirmed** | `git status` shows ` M` on `plugins/nexus-dotnet/{.claude-plugin/plugin.json, CHANGELOG.md, conventions/csharp.md}` — belong to `adhoc-DotnetSkillSweep`. Not in this diff. Team lead must commit only steps 1–7 + nexus 1.7.2 bump. |
| `gen-commands drift` in selfcheck is uncommitted-only, not real drift | **Confirmed** | selfcheck check 2 fails `commands/ differ from agents/ — commit the regen`; re-running `gen-commands.mjs nexus` produces no further change (regen already in working tree). Resolves on team lead's commit. Not a defect. |
| Stray `.omc/state/*` under `plugins/nexus/agents/` (gitignored, untracked) | **Confirmed — pre-existing, out of scope** | Not in the review diff; `git check-ignore` handles it. No action in this slug. |

## Positive Observations
- Measurement-first discipline throughout: the binding Accept numbers (574/1034) are reproduced by the test, not merely claimed.
- Catalog boundary is clean: the disposition table accounts for every VWH §A3 Tier-1 item; the implementation adds only the NEW rows and does not re-implement the four COVERED rows.
- ADR-14 block-equality test uses runtime carrier discovery (not a hand-curated list) — a 9th agent would be covered automatically.
- The selfcheck deviation (glob form) is fully justified: bare-dir form regresses on Node ≥22 (v24.13.0 confirmed); the fix matches what `tests/README.md` and CI already use.
- Surgical nexus-only bump is correct: the bulk tool would have double-bumped nexus-dotnet. Manual PATCH + CHANGELOG is the right call given the constraint.
- Carry-over findings are specific and actionable, enabling the team lead to act without investigation.

## Gaps
- `nexus:X` regex branch: zero current hits; a future refactor that breaks the regex would be invisible until a real `nexus:X` reference appears in the scanned surfaces. Documented as LOW above.
- Salience lint does not assert the binding numbers — per Q1 policy (report-only, no thresholds), this is deliberate and correct.

## Open Questions
None.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Lint + unit tests (117 total) | pass | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | `pass 117 / fail 0` |
| New lint tests only (11) | pass | `node --test tests/lint/salience.test.mjs tests/lint/wiring.test.mjs tests/lint/convergence.test.mjs` | `pass 11 / fail 0` |
| Salience binding numbers | pass | `import('./scripts/salience-report.mjs').then(m=>m.collect())` | architect.md maxBlockWords=574, agents-workflow.md maxBlockWords=1034, 19 rows total |
| ADR-14 block extractor | pass | node inline | 8/8 agents are carriers; block length=777 each (byte-identical) |
| plugin.json version | pass | node inline | `version: 1.7.2` |
| selfcheck.mjs (pre-commit) | 3/4 pass | `node scripts/selfcheck.mjs` | tests pass, gen-omni pass, bump pass; gen-commands fail (documented carry-over — resolves on commit) |
| learner.md locus axis | pass | `git diff HEAD -- plugins/nexus/agents/learner.md` | "three ways" plain text, (c) locus axis appended verbatim per plan; "Classify" stays the only bold word |
| Architecture README section | pass | grep | Section at :72, Contents :18, ADR-7 pointer :268, ADR-23 pointer :629; double-hyphen anchor correct |
| Proposal cross-references | pass | grep | `Delivered:` at vwh-adoptions doc :31 (§A1) and :88 (§A3 Tier 1) |
| nexus-dotnet files isolation | pass | `git status` | nexus-dotnet files show ` M` — unstaged, not part of this slug's working set |

*Status: COMPLETE — reviewer, 2026-06-12*

---

## Step 1 — Done-Check

**Pre-commitment predictions (made before lining up dispositions):**
1. Step 8 entanglement with the pre-existing staged `nexus-dotnet` changes (bulk bump folding another slug's work, or omni sync skipped) — **materialized, and the developer caught it**: surgical nexus-only bump, carry-over finding for the team lead.
2. One of Step 4's four sub-checks landing without its red verification — **did not materialize**: all four implemented, each with an individual recorded red check.
3. Step 1 anchor/ADR-pointer slip — **did not materialize**: all three anchor references grep-verified.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Allocation principle in architecture record | Implemented | Grep-verified: section heading at `docs/architecture/README.md:72`, Contents anchor `:18`, ADR-7 pointer `:268`, ADR-23 pointer `:629` — exact double-hyphen anchor as pinned (MED-3) |
| 2 — Learner classifies by locus | Implemented | `by **locus**` present in `plugins/nexus/agents/learner.md` AND regenerated `plugins/nexus/commands/learner.md` (grep-verified both) |
| 3 — ADR-14 block-equality lint | Implemented | Extended `convergence.test.mjs` in place — plan-sanctioned developer's call; carrier set runtime-discovered (all 8), never hand-curated; local red check recorded (solo.md one-char edit, named the file, reverted) |
| 4 — Hook-wiring + bijection lints | Implemented | `tests/lint/wiring.test.mjs` exists; all four sub-checks (dup matcher w/ nexus-dotnet skip per MED-1, command→agent only per MED-2 w/ `backlog.md` allowlist, env-var resolve, agent-name refs w/ named platform allowlist); four individual red checks recorded |
| 5 — Salience report (report-only) | Implemented | `scripts/salience-report.mjs` + `tests/lint/salience.test.mjs` exist; MED-4 measurement definition honored; binding Accept numbers reproduce exactly (architect.md 574, agents-workflow.md 1034); no thresholds per Q1 |
| 6 — Selfcheck aggregator + docs | Deviated (valid reason) | Check (1) uses glob form `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` instead of the plan's bare-dir form — bare-dir args regressed on Node ≥22 (module resolution; v24.13.0 here) and fail even on a green tree. Same checks, same gate, matches what `tests/README.md`/CI already use. `--base` flag shape was the plan's explicit developer's-call. README row + section grep-verified |
| 7 — Proposal cross-references | Implemented | Grep-verified: `Delivered:` markers at `docs/proposals/vwh-adoptions-2026-06.md:31` (§A1) and `:88` (§A3 Tier 1, scoped so Tier 2 stays open); A2/A4–A6 untouched |
| 8 — Release (Follow release-plugin) | Deviated (valid reason) | Surgical nexus-only bump (`plugin.json` 1.7.2 grep-verified + CHANGELOG entry) instead of bulk `bump-plugin.mjs` apply — the bulk tool would have re-bumped `nexus-dotnet`, which belongs to `adhoc-DotnetSkillSweep` and is explicitly out of scope per the plan. gen-commands regen, gen-omni sync (`--check` exits 0), and `claude plugin validate --strict` all run. The single commit of steps 1–7 + bump is correctly left to the team lead (commit protocol — not a gap) |

**Skill conformance:** Plan maps steps 1–7 `Skill: None` (honest dispositions — dev-repo machinery, no covering skill) and Step 8 `Follow release-plugin`. Implementation's `## Skills Used` table matches one-for-one; release-plugin was followed with its single deviation documented. The plan's Skill Mapping carries no TDD column (plan-format gap, noted in lessons — not a developer deviation); Steps 3–5's red-then-green local checks satisfy the testable-behavior intent.

**Catalog boundary held:** the four "Covered (existing) — do NOT re-implement" rows from the plan's disposition table were not re-implemented (developer cross-verified them against live test files in Phase 1); the six NEW rows all map to Steps 3–5 implementations.

**Team-lead-owed items (disclosure, not verdict-affecting):**
1. The single commit (steps 1–7 + nexus 1.7.2 bump, including the untracked proposal doc) is owed by the team lead; the selfcheck `gen-commands drift` line goes green at that commit.
2. Do **not** fold the staged `nexus-dotnet` files into this slug's commit — they belong to `adhoc-DotnetSkillSweep` (carry-over finding, medium, in implementation.md).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-12*
