# Review — adhoc-NexusFleetView

## Step 1 — Done-Check

Done-check by the architect (no code-correctness reading — that is the reviewer's Step 2). Every plan
step was checked for a corresponding implementation.md entry and a real on-disk artifact; the 3
deviations and 2 carry-overs the developer documented are dispositioned below.

| Step | Disposition | Notes |
|------|-------------|-------|
| 1 — Heartbeat: persist the live fleet snapshot from the statusline | Deviated (justified) | `subagent-rows.js` carries the guarded atomic write (`writeFleetState`, temp-then-rename), drain-on-empty (write hoisted ahead of the `!tasks.length` short-circuit), fail-open, root from `data.workspace.project_dir`. Step 1.0's gating spike was resolved from the official statusLine docs instead of a live capture — see D1/C2. Acceptance extends the real `tests/unit/subagent-rows.test.mjs` suite (H2 fix); all 14 pass incl. 6 heartbeat tests (write, latest-wins, drain, no-root-skip, malformed-stdin no-write, stdout-unaffected). |
| 2 — The `/nexus:fleet` skill | Deviated (justified) | `skills/fleet/SKILL.md` + `scripts/render-fleet.mjs` (exports `renderFleet`/`readDepth`/`MSG`). Fixture tree under `tests/fixtures/fleet/{full,roster-only,stale,malformed}/.claude/audit/…` present; `render-fleet.test.mjs` asserts verbatim full-data render + each pinned degradation path + dedup-parity — all 9 pass. Skill refers to the trigger as "the fleet view" not the literal `/nexus:fleet` token (lint convention) — see D2; `description` rephrased for strict-YAML — see D3. |
| 3 — Record the decision as one ADR | Implemented | ADR-33 present at README.md:818, listed in Contents at :51, `Status: Accepted — adhoc-NexusFleetView, 2026-06-16` (M3 banner). References ADR-11/8/2/13/25 rather than restating; both rejected alternatives recorded ("skill calls `TaskList`", "Vue dashboard now"). |
| 4 — Release | Implemented | `plugin.json` = 1.12.0 (owner-escalated MINOR); CHANGELOG 1.12.0 entry names the fleet view; omni twin regenerated. `validate --strict` clean and twin contents to be confirmed in Step 2 Evidence (architect does not run the build at done-check). No `gen-commands` — correct, no agent changed. |

### Deviation dispositions

- **D1 — Step 1.1 dropped the `CLAUDE_PROJECT_DIR` fallback** → **Accepted.** The plan's `root =
  process.env.CLAUDE_PROJECT_DIR || <confirmed field>` was literal prose riding on Step 1.0, which was
  explicitly a *gating spike to determine the root field*. The finding that `CLAUDE_PROJECT_DIR` is
  hooks-only (absent for a statusLine process, so the fallback is dead in production) is exactly what
  that gate existed to surface. Removing dead code preserves the plan's intent (a usable project root,
  never a subagent dir or stray cwd). Within scope.
- **D2 — SKILL.md does not write the literal `/nexus:fleet` command token** → **Accepted.** The repo's
  wiring lint reserves `nexus:<name>` tokens for agent-backed commands; no shipped skill writes its own
  `/nexus:` token (consumption-report doesn't either). Referring to it as "the fleet view" keeps the
  body lint-clean and convention-consistent; the user still invokes `/nexus:fleet` via the standard
  skill-trigger mechanism. No behavior change.
- **D3 — `description` frontmatter rephrased to avoid a YAML colon-space** → **Accepted.** `validate
  --strict` parses frontmatter as real YAML, where an unquoted plain scalar cannot contain `": "`.
  Rephrasing to parse cleanly is a correctness fix, not a scope change.

### Carry-over dispositions

- **C1 — Dedup algorithm copied, not shared (low, → reviewer)** → **Accepted as carry-over.** This is
  precisely plan M2's flagged follow-up (the consumption-report dedup lives inline in a `node -e`
  block, so it is replicated and pinned with a parity test, not imported). Extraction to a shared
  `scripts/` module is correctly deferred out of this scope.
- **C2 — Live root-field confirm is operator-owed (medium, → team-lead)** → **Accepted as carry-over,
  flagged.** Step 1.0 was specified as a gating capture spike on a *live* run with a STOP-and-escalate
  branch. The developer resolved the root field from the official statusLine docs rather than a live
  capture, with sound structural reasoning (a subagent cannot capture a main-session statusLine
  payload, so a live confirm is the team lead's to own). This does **not** make Step 1 missing — the
  code, the docs-grounding, and the full test suite all exist and pass. But the heartbeat is unverified
  against a real run, so `workspace.project_dir` being populated in production is an open verification
  the team lead owes before the feature is trusted live. Correctly routed; not silently closed.

No step is Missing or silently skipped. All 23 unit tests (14 subagent-rows + 9 render-fleet) pass on
this machine. The two deviations on Steps 1 and 2 are justified contract corrections, not scope drift;
both carry-overs are legitimately deferred (C1 by plan, C2 to the operator who structurally owns it).

**Verdict: PASS**

*Status: COMPLETE — architect, 2026-06-16*

---

## Step 2 — Code Review

**Reviewer:** code-grounded, 2026-06-16
**Scope:** `plugins/nexus/statusline/subagent-rows.js`, `plugins/nexus/skills/fleet/SKILL.md`,
`plugins/nexus/skills/fleet/scripts/render-fleet.mjs`, `tests/unit/subagent-rows.test.mjs`,
`tests/unit/render-fleet.test.mjs`, `tests/fixtures/fleet/`, `docs/architecture/README.md:ADR-33`,
`plugins/nexus/.claude-plugin/plugin.json`, `plugins/nexus/CHANGELOG.md`

All 23 tests pass (`node --test tests/unit/render-fleet.test.mjs tests/unit/subagent-rows.test.mjs`).
Skill-lint: `OK fleet`. Plugin version 1.12.0 confirmed.

---

### Findings

#### LOW-1 — `fmtK` contract divergence between statusline and renderer
**Origin:** implementation  **Severity:** LOW  **Confidence:** 95

`subagent-rows.js:fmtK` returns `''` for zero/absent/non-finite (the row then omits the token field entirely). `render-fleet.mjs:fmtK` returns `'0'` for the same inputs, which means the renderer always shows `0 tok` for tasks with no `tokenCount` — a user-visible phantom. The call site (`render-fleet.mjs:171`) confirms this: `fmtK(t.tokenCount) + ' tok'` when the value is a number (including 0), `'0 tok'` otherwise. If a task carries `tokenCount: 0` the output shows `0 tok` rather than omitting the field as the statusline would.

This is a cosmetic inconsistency, not a crash path. The full-data fixture avoids it (both tasks carry positive token counts). Testable but not currently tested.

**Fix:** In `render-fleet.mjs`, bring `fmtK` in line with the statusline: return `''` for non-positive values, and at the call site use the same omit-if-empty guard the statusline uses. Or, if `0 tok` is intentional for the dashboard (a zero-count is meaningful), document it.

---

#### LOW-2 — `import.meta.url` main-guard fragile on Windows
**Origin:** implementation  **Severity:** LOW  **Confidence:** 85

`render-fleet.mjs:209`:
```js
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('render-fleet.mjs'))
```

On Windows, `import.meta.url` uses `file:///C:/...` (three slashes, forward slashes) while `process.argv[1]` uses `C:\...` (backslashes). The first comparison will always be `false` on Windows. The fallback `endsWith('render-fleet.mjs')` saves it in the common case, but that guard also fires when an importer's path happens to end with that string (unlikely but technically wrong). The standard fix is `import.meta.url === pathToFileURL(process.argv[1]).href`. Since the tests run on this Windows machine and all pass, the `endsWith` fallback is working — but the primary guard is dead.

**Fix:** Replace the comparison with `import.meta.url === new URL(\`file://${process.argv[1]?.replace(/\\/g, '/')}\`, import.meta.url).href` or, cleaner, use `node:url`'s `pathToFileURL`.

---

#### NOTE-1 — `D2` trigger verification confirmed
**Origin:** implementation  **Severity:** informational

The plan flagged D2 as needing reviewer confirmation: SKILL.md does not write the literal `/nexus:fleet` token; the user still invokes it as `/nexus:fleet` via the standard skill-trigger mechanism. Confirmed: SKILL.md `name: fleet`, body refers to "the fleet view" / "the `fleet` skill" — no `/nexus:` string in the body. This is consistent with every other shipped skill (spot-checked: `consumption-report` SKILL.md has no `/nexus:consumption-report` token). Skill-lint passes. The trigger works because Claude Code resolves `/nexus:<name>` to the plugin skill named `<name>`, not by scanning the skill body. No action.

---

#### NOTE-2 — Carry-over C2 (live root-field confirm) acknowledged
**Origin:** design  **Severity:** informational

`data.workspace.project_dir` is asserted from the official statusLine docs. No live-run confirm was possible by the developer (structural constraint: a subagent cannot capture a main-session statusLine payload). All code paths for no-root are covered (skip write, `resolveRoot` returns null). If `workspace.project_dir` is absent in a real run the heartbeat silently skips — no crash, no stale data, no user impact beyond "No active fleet" from the skill. The team lead owns the post-ship verification before treating the feature as production-trusted. No code change required.

---

### Plan Conformance

| Plan requirement | Status | Notes |
|-----------------|--------|-------|
| Atomic temp-then-rename write | PASS | `subagent-rows.js:writeFleetState` — temp at `target + '.' + process.pid + '.tmp'`, then `renameSync` |
| Drain-on-empty: write hoisted before `!tasks.length` short-circuit | PASS | `subagent-rows.js:162–165` — `writeFleetState` called before `if (!tasks.length) process.exit(0)` |
| Fail-open: write errors swallowed, row rendering unaffected | PASS | `writeFleetState` wraps entirely in `try/catch {}` |
| Root from `data.workspace.project_dir` only (not CLAUDE_PROJECT_DIR, not tasks[].cwd, not process.cwd) | PASS | `resolveRoot` checks only `data.workspace.project_dir`; header comment names all three rejections |
| No `fleet-state.json` or malformed JSON → `MSG.noFleet` | PASS | `renderFleet:140–143` returns `GRAY + MSG.noFleet + R` for null state or non-array tasks |
| Empty tasks array in state → `MSG.noFleet` (not a crash) | PASS | `renderFleet:143` — `tasks.length === 0` returns noFleet |
| Stale snapshot labelled, not rendered as live | PASS | `FRESHNESS_MS = 60_000`; stale path appends `stale — last seen {age} ago` to header |
| No token_audit → basic columns + depth hint | PASS | `!depth` path appends `MSG.noDepth`; depth-gated `calls` column absent |
| No comm-log → phase/step and cycle omitted | PASS | `comm && comm.step` guard; confirmed by test and roster-only fixture |
| Pinned degradation constants imported by tests | PASS | `MSG.noFleet` and `MSG.noDepth` exported from renderer, imported by test |
| Dedup algorithm replicated (consecutive-tuple key) | PASS | `readDepth` replicates the same `[input,output,cache_read,cache_creation].join('|')` key |
| Dedup parity test vs consumption-report | PASS | `depth dedup matches the consumption-report algorithm` test — exact call/out values asserted |
| SKILL.md frontmatter `name: fleet`, user-invoked intent | PASS | Frontmatter confirmed; skill-lint green |
| ADR-33: Status banner, Contents entry, both rejected alternatives | PASS | `README.md:51` (Contents), `:818` (ADR), both rejections present |
| `plugin.json` 1.12.0 | PASS | Confirmed |
| CHANGELOG 1.12.0 entry | PASS | Names fleet view + statusline heartbeat |

---

### Verdict: **APPROVE**

Two LOW findings; no MEDIUM or HIGH. Neither blocks ship.

- **LOW-1** (`fmtK` zero-token divergence) is a cosmetic display inconsistency — tasks with `tokenCount: 0` show `0 tok` rather than omitting the field. No fixture covers this case so it went undetected. Worth a one-line fix but not a gate.
- **LOW-2** (Windows `import.meta.url` guard) — the `endsWith` fallback is working in tests on this Windows machine; the primary comparison is dead but harmless given the fallback covers the real CLI invocation pattern. Fix before the guard grows more complex.

The fail-open guarantee is solid (`writeFleetState` try/catch, `process.exit(0)` in the CLI shim, every degradation path returns a string). The atomic write is correctly implemented. The 4-source join degrades independently on each source. The skill is invocable via `/nexus:fleet`. All 23 tests pass; skill-lint clean.

*Status: COMPLETE — reviewer, 2026-06-16*
