# Codex Cross-Check — adhoc-NexusFleetView

**Reviewer:** Codex (independent subagent)
**Date:** 2026-06-16
**Scope:** data-accuracy and correctness — 4-source join logic, token-usage dedup parity,
degradation/staleness paths, atomic-write/torn-read safety, fail-open correctness.

---

## Verdict: GO

All 23 tests pass (run confirmed). All plan-critical correctness requirements are met.
Four low-severity findings noted; none block the release.

---

## Test Run

```
✔ 23 tests pass (subagent-rows.test.mjs + render-fleet.test.mjs)
✔ 0 failures
```

---

## Findings

### LOW-1 — Entry-point guard primary condition is dead on Windows

**File:** `plugins/nexus/skills/fleet/scripts/render-fleet.mjs:209`

```js
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('render-fleet.mjs'))
```

On Windows, `import.meta.url` is `file:///D:/path/render-fleet.mjs` (three-slash, forward slashes);
`process.argv[1]` is a native path with a drive letter. The primary condition never matches on
Windows. The `endsWith('render-fleet.mjs')` fallback fires correctly instead (confirmed: direct
invocation produces output). **No behavior defect** — but the primary condition is dead code on
this platform.

**Impact:** None. The CLI works correctly.
**Recommendation:** Replace with the standard `fileURLToPath`-based guard used in Node.js ESM docs:
```js
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
```
Not a blocker.

---

### LOW-2 — Null-role tasks render as `[?]` in fleet, silently diverging from the row renderer

**File:** `plugins/nexus/skills/fleet/scripts/render-fleet.mjs:166`

```js
const meta = (role && ROLES[role]) || { tag: role || '?', color: WHITE };
```

The row renderer in `subagent-rows.js` skips tasks where `detectRole` returns null (line 172:
`if (!role) continue`). The fleet dashboard renders them as `[?]`. Any task the heartbeat writes
with `role: null` (e.g. a non-nexus subagent) appears in the fleet with a `[?]` tag and white
color.

This is likely **intentional** (full visibility vs filtered row view), but the SKILL.md and
plan do not document this divergence. A user who sees `[?]` rows may be confused.

**Impact:** Minor UX confusion. No data corruption.
**Recommendation:** Document the intentional divergence in SKILL.md ("non-nexus tasks render as
`[?]`") or add an explicit filter `tasks.filter(t => t.role)`. Not a blocker.

---

### LOW-3 — Malformed-stdin heartbeat test: `projectDir` injection does not reach the script

**File:** `tests/unit/subagent-rows.test.mjs:155-160`

```js
const { status } = runHook(SCRIPT, payload, { projectDir: root });
```

The heartbeat resolves root from `data.workspace.project_dir` (payload), not from
`CLAUDE_PROJECT_DIR` (env). When stdin is malformed, `JSON.parse` fails and `data = {}`, so
`resolveRoot(data)` returns null regardless of `projectDir`. The `projectDir` harness arg sets
`CLAUDE_PROJECT_DIR` in the env — which this script deliberately ignores. The test passes for the
right reason (no root in data → no write) but the comment `// Even with a root present` describes
a condition that is not true: the root is in the env, not the payload, and the script never sees it.

**Impact:** Zero — test behavior and assertion are correct.
**Recommendation:** Tighten the comment:
```js
// CLAUDE_PROJECT_DIR is hooks-only env (ignored here); even if it were set, parse
// failure means data = {} → no root → no write.
```
Not a blocker.

---

### LOW-4 — Dedup algorithm is consecutive-per-role, not consecutive-per-agent-instance

**File:** `plugins/nexus/skills/fleet/scripts/render-fleet.mjs:119-127`

The consecutive-tuple dedup tracks a single `key` per role, not per agent instance. If two
concurrent agent aliases (e.g. `nexus:architect` and `architect-2`) interleave rows in the log
with the same tuple, the dedup can drop output rows that should be counted. Example:

```
architect row A: tuple X → counted (out += A.out)
architect-2 row B: tuple X → key still X → dropped (out not counted) ← potential under-count
```

This matches consumption-report's behavior exactly (same algorithm, same limitation). The plan
explicitly calls for replicating it (M2 disposition), and the test pins parity. The limitation is
inherited, not introduced here.

**Impact:** Potential slight under-count of output tokens when interleaved aliases share a tuple.
Only affects the `out` field used for dedup parity assertion — not the `calls` count that the
fleet dashboard surfaces. The visible metric (calls) is unaffected.
**Recommendation:** Document in a code comment that this matches consumption-report and carries the
same interleaved-alias edge case. Extract to shared module as the plan's follow-up note already
flags. Not a blocker.

---

## Specific Areas Checked

### 4-source join logic
- Fleet state: `readJSON` returns null on missing/malformed → `MSG.noFleet` ✓
- Comm log: `readCommLog` scans `docs/specs/*/delivery/communication-log.md` by mtime, gracefully
  returns null on any filesystem error. Regex matches `**Step:**` and `**Cycle:**` headers ✓
- Token depth: `readDepth` tries both `.claude/audit/` and legacy `docs/audit/` paths; returns
  null when absent ✓
- Violations: `readViolations` splits on newline and counts non-empty lines; null on missing ✓
- All degradations produce their pinned MSG strings and exit 0 ✓

### Token-usage dedup parity vs consumption-report
- Same consecutive-tuple key `[input|output|cache_read|cache_creation]` ✓
- Same per-role accumulator pattern ✓
- Test asserts `d.architect = {calls:3, out:300}` and `d.developer = {calls:2, out:700}` against
  the fixture — manually verified against the algorithm trace ✓
- `main` agent correctly excluded (no role) ✓
- `developer-2` alias maps to `developer` via `roleOf()` ✓

### Staleness path
- Fixture `stale/fleet-state.json` has `ts` 600s before NOW (1700000000000 vs NOW=1700000600000)
- `age > FRESHNESS_MS` (600000 > 60000) → stale ✓
- `fmtAge(600000)` → `'10m'` → label `"stale — last seen 10m ago"` ✓
- Stale rows still render (roster visible, just labelled) ✓

### Atomic write / torn-read safety
- Temp file named `<target>.<pid>.tmp` — PID suffix prevents multi-invocation collisions ✓
- `renameSync` over target: Node.js on Windows uses `MoveFileExW` with `MOVEFILE_REPLACE_EXISTING`;
  both tmp and target are in the same `.claude/audit/` directory (same filesystem) → single-op
  move ✓ A reader never observes a partially-written file ✓

### Fail-open correctness
- The entire `writeFleetState` body is wrapped in `try { ... } catch { /* fail-open */ }` ✓
- Row rendering is unaffected by any write failure — stdout-unaffected test asserts byte equality ✓
- `resolveRoot` returns null on any falsy/whitespace-only root → write unconditionally skipped ✓
- Malformed stdin: `JSON.parse` fails → `process.exit(0)` before `resolveRoot` is even called ✓

### Drain-on-empty
- `writeFleetState` is called before the `if (!tasks.length) process.exit(0)` guard ✓
- Empty `tasks: []` with valid root writes `{ts, columns, tasks: []}` ✓
- Verified by test `heartbeat: empty tasks[] with a resolvable root drains to an empty snapshot` ✓
- `renderFleet` treats an empty `tasks` array as `MSG.noFleet` (line 143: `if (!tasks.length) return ...`) ✓
  so after drain, the dashboard correctly reports no active fleet ✓

### Root resolution
- Reads `data.workspace.project_dir` only — correct per statusLine docs and implementation notes ✓
- Never reads `CLAUDE_PROJECT_DIR` env (hooks-only, absent in statusLine process) ✓
- Never uses `tasks[].cwd` (per-task subagent dir, wrong audit location) ✓
- Never uses `process.cwd()` (ADR-8 stray-log) ✓
