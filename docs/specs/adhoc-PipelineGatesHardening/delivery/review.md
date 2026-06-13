# Pipeline Gates Hardening — Review

## Step 1 — Done-Check

**Scope:** plan Steps 1–8 only. Step 9 (release bump / gen-commands / omni twin) is the team lead's
and is deliberately NOT expected on disk — its absence is not a Fail (confirmed: `plugin.json`/`CHANGELOG.md`
unbumped, `commands/architect.md` + `commands/team-lead.md` not regenerated, `omni` twin's `hooks.json`
lacks the new entries — all expected pending-states, carried as a team-lead finding in implementation.md).

**Plan is all-`Skill: None`** → skill-conformance reduces to "the `## Skills Used` section is present" (the
all-`None` exemption applies — and it is the very exemption Step 3 was built to preserve). `## Skills Used`
is present (implementation.md:118-128), every row `None` with a documented reason. Exemption satisfied.

**Pre-commitment predictions (made before reading the implementation):** (1) Step 5 anchored regex differs
from the verified one, or the `:76` no-op was altered, or the Bash branch sits after the `file_path`
early-exit; (2) Step 2 logger accidentally config-gated, wrong matcher, or `|| 'main'` tail dropped;
(3) Step 3 re-point drops the all-`None` exemption so this very plan would Fail. **All three predictions
checked and cleared** — each load-bearing fact verified on disk.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Red tests first | Implemented | `tests/unit/skill-tracker.test.mjs` created; `tests/unit/boundary-detector.test.mjs` extended (ADR-18/20 git-write section: positive commit/verb/`&&`-chain reds + negatives for read-only/`commit-graph`/empty/main-session); `tests/lint/enforcement.test.mjs:93` adds the `## Skills Used` named-required structural lint. The `:76` `detect(dir,'critic','','Bash')` no-op (HIGH-3) is preserved unchanged. Existing-test count is **10, not the plan's "11"** — Deviated-within-step, documented (Q1), binding directive "preserve every existing test" honored; all preserved. |
| 2 — Always-on skill-invocation logger | Implemented | `skill-tracker.js` created: always-on (no `argv[2]`/config-gate), `tool_name === 'Skill'` filter (`:58`), `|| 'main'` tail preserved (`:69`), log line `{ts, agent, skill, token, session}` (`:80`), `token` from `.pipeline-state` (`:74`), root = `CLAUDE_PROJECT_DIR \|\| data.cwd \|\| cwd`, fail-silent, never blocks. `hooks.json:50-54` registers it on `PostToolUse` matcher **`Skill`**, async, timeout 10. **Highest-risk live-verify resolved:** developer verified `tool_name === 'Skill'` against 20 real session transcripts (14 `Skill` tool_use occurrences; `tool_input.skill` carries the name) — Gate A is NOT false-green. Verified string recorded (implementation.md:97-116). |
| 3 — Done-check gates against the log | Implemented | `architect.md:230-238` re-pointed in place (replaced, not duplicated): authoritative source = `skill-invocations.log`; self-report demoted to cross-check; round-scoped by `.pipeline-state` token + `agent == developer\|main`; final-segment skill matching. Four hard-Fail dispositions present (`:235-238`): mapped non-`None` skill absent from log w/o documented deviation, self-report absent from log (fabrication), missing `## Skills Used` section, **plus the all-`None` exemption preserved explicitly** (`:238`). The prior "compare to implementation.md `## Skills Used`" wording is gone. |
| 4 — Promote `## Skills Used` to required section | Implemented | Verify-first carve-out applied: no prior "required sections" enumeration existed, so this is not a no-op. `implementation-format/SKILL.md:45-50` adds the **"Required sections"** statement naming `## Skills Used` as required and binding its absence to the done-check hard-Fail. Existing template (`:22-28`) + anti-pattern (`:56`) preserved. Step 1's structural lint (`enforcement.test.mjs:93`) is green. |
| 5 — Boundary detector flags rogue subagent git writes | Implemented | `boundary-detector.js:91-106` adds the `Bash` branch with the **exact verified regex** `/\bgit\s+(commit\|add\|reset\|push\|stash\|restore\|switch)(\s\|$)/` on the lowercased command — matches plan byte-for-byte. Branch sits **before** the `file_path` early-exit (`:107-111`) — correct position. Trailing `(\s\|$)` excludes `git commit-graph`. `hooks.json:38` matcher extended to include `Bash`. The `:76` Bash-no-git-verb no-op is **preserved** (returns at `:104`, zero footprint). Subagent-only (`:79` `!data.agent_type` exit). Verified case table asserted in test. |
| 6 — Deterministic fabrication void-and-rerun gate | Implemented | `team-lead.md:175-184` adds the 4-row action matrix (non-owner-authored gate → void+re-run; rogue pipeline-role spawn → void downstream+re-run; subagent git write OR non-team-lead commit → unwind+re-commit; skill-conformance Fail → bounce to developer) run at every verify point. `git log` author check named as the guaranteed retroactive catch reconciling Step 5 (`:184`). Explicitly **additive** to Verdict Validation + least-intervention ladder, not a replacement. |
| 7 — Document the logs + gates | Implemented | `agents-workflow.md:119` adds the `## Audit Substrate (.claude/audit/) — detect-then-gate` section documenting both logs (`violations.log` + `skill-invocations.log`: writers, records, consumers) and naming the detect-then-gate principle once. No dangling log reference — every log named is written by a shipped script. |
| 8 — Propose ADR-24 (owner ratifies) | Implemented | `docs/architecture/README.md:634` adds **proposed** ADR-24 with a `Status: PROPOSED (owner ratifies)` banner (`:636`) — explicitly NOT finalized; Contents-list line at `:42` also marked PROPOSED. Notes it **extends ADR-18/21** (`:643`). No existing ADR rewritten. Flagged for owner ratification in handback (correct — architect proposes, owner ratifies). |

### Skill-conformance check (all-`None` exemption)
Plan Skill Mapping for Steps 1–8 is uniformly `Skill: None` (Step 9's `Follow release-plugin` is out of
scope). The all-`None` exemption applies: no skill-invocation log entry is owed, and the `## Skills Used`
section is present with a `None` + reason per step. **Conformance satisfied** — no Fail.

### Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full suite (canonical glob) | 127 pass / 1 fail / 128 | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | The 1 fail is the **pre-existing** `nexus-dotnet:create-module-claude-md` `disable-model-invocation` frontmatter failure (committed `75ccd2b`, outside `nexus` scope, untouched here). Baseline was 116/117; +11 new tests all green → 127/128, no new failure introduced. |
| `node --check` skill-tracker.js | OK | `node --check …/skill-tracker.js` | clean |
| `node --check` boundary-detector.js | OK | `node --check …/boundary-detector.js` | clean |
| `hooks.json` parses | OK | `node -e JSON.parse(...)` | parses |

**Verdict: PASS** — all of Steps 1–8 are Implemented (Step 1 carries one Deviated-within-step item: the
stale "11" existing-test count, documented as Q1, with every existing test preserved; non-blocking). The
single failing test is the documented pre-existing out-of-scope `nexus-dotnet` baseline failure, not
introduced by this pass. Step 9 is out of scope and correctly pending for the team lead.

**Owner-owed gate (disclosed, not a Fail):** ADR-24 is PROPOSED — the owner ratifies before it becomes a
decided record. Surface at handback.

*Status: COMPLETE — architect, 2026-06-13*

## Step 2 — Code Review

## Reviewed By
Reviewer agent (nexus:reviewer), 2026-06-13. Evidence collected via direct file reads and fresh test run in this review session.

## Verdict: APPROVED

## Pre-commitment Predictions

1. **`skill-tracker.js` might be config-gated or missing the `|| 'main'` tail** (MED-5 risk). **Cleared:** `argv[2]` guard is absent (always-on confirmed); the `|| 'main'` fallback is present at line 69.
2. **Bash branch might sit after the `file_path` early-exit**, making it dead code for Bash calls. **Cleared:** Bash branch at char 4949, fp early-exit at char 6445 — ordering is correct.
3. **Anchored regex might deviate from the plan's verified pattern**, or `git commit-graph` might be mis-excluded. **Cleared:** the regex in `boundary-detector.js:104` is byte-for-byte identical to the plan's verified pattern; all 21 case-table entries pass when run fresh.
4. **The `:76` Bash-no-verb no-op test might have been silently altered.** **Cleared:** `detect(dir, 'critic', '', 'Bash')` is at exactly line 76; zero-footprint is confirmed.
5. **Step 3 might have left a literal `nexus:create-feature` in `architect.md`**, triggering the wiring lint. **Cleared:** the literal is absent; `{plugin}:{skill}` placeholder is in place; wiring lint runs 4/4 green.

## Findings

No blocking findings (none at MEDIUM or above that the developer should act on). One LOW style observation follows.

### [LOW] Verification note phrasing is mildly ambiguous
**File:** `docs/specs/adhoc-PipelineGatesHardening/delivery/implementation.md:169`
**Issue:** The note reads "all 11 new tests are green (the 3 reds turned green)." The parenthetical can be read as implying all 11 were reds; the actual count is 3 reds and 8 additional positive/negative tests that started green. No correctness or plan-conformance defect.
**Fix:** Optional — could read "all 11 new tests green (the 3 Step-1 reds turned green; 8 additional tests also green)."
**Confidence:** verified (style-only observation, no logic impact)

## Carry-Over Findings — Addressed

All four carry-over findings from `implementation.md` are explicitly addressed:

| Carry-over | Status | Evidence |
|---|---|---|
| Steps 1–8 only — Step 9 not done | Confirmed non-defect | `plugin.json`/`CHANGELOG.md` unbumped; `commands/architect.md` + `commands/team-lead.md` not regenerated; `omni` twin lacks new entries — all expected pending-states for the team lead |
| ADR-24 PROPOSED, owner-ratify | Confirmed non-defect | `docs/architecture/README.md:636` carries `Status: PROPOSED (owner ratifies)` banner; not silently finalized |
| Gate A depends on unversioned `tool_name === 'Skill'` | Confirmed — residual risk documented | Developer verified against 20 real session transcripts (14 occurrences). Residual platform-rename risk documented in ADR-24 Tradeoffs; same risk profile as every hook. No action owed. |
| Live guardrail validation owner-owned, deferred | Confirmed non-defect | Plan Testing Strategy explicitly defers the real-pipeline fire-test to the owner; JS units prove the mechanism — that is the build-time obligation |

## Positive Observations

- **Anchored regex + `(\s|$)` carve-out is exactly right.** All 21 case-table entries pass in a fresh node run, including the `git commit-graph` exclusion and `&&`-chained commits.
- **Always-on posture maintained.** `skill-tracker.js` has no `argv[2]` guard (matches `read-tracker.js` precedent). Gate A cannot be silently disabled by the `token_audit` flag.
- **Bash branch position is architecturally correct.** Runs before the `file_path` early-exit; the git-write check is never dead code.
- **`:76` Bash-no-verb no-op is preserved.** Zero-footprint invariant for non-write Bash commands confirmed at line 76.
- **`agent` reduction vs `skill` verbatim storage is correct.** `agent` gets final-segment reduction for attribution; `skill` is stored verbatim so Step 3 can match on the final segment at read time — matching the plan specification.
- **Wiring lint 4/4 green.** No dangling agent references introduced; the `{plugin}:{skill}` reword applied before handback caught by lint, not shipped as a defect.
- **Highest-risk live-verify resolved with the right oracle.** Developer verified `tool_name === 'Skill'` against the project's own `.jsonl` session transcripts — the correct ground-truth source, not an inference from `audit-logger.js`.
- **`team-lead.md` action matrix is additive.** Explicitly preserves and references the existing Verdict Validation and least-intervention ladder; does not replace either.
- **`implementation-format` Required sections statement passes the enforcement lint regex byte-for-byte** — confirmed with the exact regex the test uses.

## Gaps

- `git reset --soft` is flagged by the Bash branch (the regex matches all `reset` forms, not just `--hard`). The plan accepts this as "acceptable redundancy" with `guard.js`'s existing `reset --hard` deny. Intentional and covered by the test (`boundary-detector.test.mjs:158`).
- Live guardrail validation (a real pipeline run deliberately firing both gates) remains owner-owned by design. Not a code-review gap.

## Open Questions

None. All pre-commitment predictions were cleared with fresh evidence; no ambiguity remains.

## Evidence
| Check | Result | Command | Output |
|-------|--------|---------|--------|
| Full test suite (canonical glob) | 127 pass / 1 fail / 128 total | `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` | 1 fail = pre-existing nexus-dotnet frontmatter (`75ccd2b`); baseline 116/117 + 11 new tests all green = 127/128 |
| `node --check` skill-tracker.js | OK | `node --check plugins/nexus/hooks/scripts/skill-tracker.js` | clean |
| `node --check` boundary-detector.js | OK | `node --check plugins/nexus/hooks/scripts/boundary-detector.js` | clean |
| hooks.json | parses | `node -e JSON.parse(...)` | parses |
| Regex case table (21 entries) | All match plan | Node inline verification | All 21 entries correct |
| Bash branch position | Before fp early-exit | Char-index check | Bash at 4949, fp early-exit at 6445 |
| Config-gate absent | Confirmed | Source grep on skill-tracker.js | No `argv[2]` present |
| Fallback tail | Present | Source grep on skill-tracker.js | Present at line 69 |
| Wiring lint | 4/4 pass | `node --test tests/lint/wiring.test.mjs` | No dangling references |
| `:76` test | Preserved | Line-number check | `detect(dir,'critic','','Bash')` at line 76, zero-footprint confirmed |
| Gate-A lint regex | Passes | Node inline match against enforcement.test.mjs pattern | `implementation-format` passes the required-sections assertion |

*Status: COMPLETE — reviewer, 2026-06-13*
