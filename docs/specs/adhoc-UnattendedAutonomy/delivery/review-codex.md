# Codex Cross-Check — Unattended Autonomy (v1)

**Reviewer:** Codex (independent)
**Date:** 2026-06-16
**Plan:** `docs/specs/adhoc-UnattendedAutonomy/delivery/plan.md` (APPROVED — critic Mode-2 ACCEPT + Q-D1 amendment)
**Implementation:** `docs/specs/adhoc-UnattendedAutonomy/delivery/implementation.md`
**Suite (verified independently):** `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` → **214/214 green**

---

## Verdict: GO

No blocking issues. The three highest-risk areas (agent_type matching, never-block guarantee, fail-closed scoping) are correctly implemented and independently verified. Findings below are informational or minor — none require a fix before merge.

---

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

**MED-1 — `blocking` defaults `true` but the schema says nothing about it** (`verify-gate.js:60`)

The resolver silently coerces `c.blocking !== false` → defaults `true` for any `commands[]` entry that omits the field. That is the right behavior, but it is not documented anywhere a user writing `.claude/verify.json` would see it — `agents-workflow.md` and the plan say "`blocking`: bool" without noting the default. A user who omits the field expecting the command to be advisory (non-blocking) will be surprised when a failure gates the verdict.

*Recommendation:* add one sentence to the `agents-workflow.md` verify.json schema table: "Omitting `blocking` is equivalent to `true`." Not a correctness bug, just a usability trap.

**MED-2 — Detection fallback runs the `node --test` glob in the sandbox but the glob may expand to zero files** (`verify-gate.js:71`)

When the detection fallback is used, the synthesized command is `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs`. In a project where those subdirectories exist but are empty, the shell expands the globs to literals (`tests/lint/*.test.mjs`) and Node interprets them as a non-existent file path, which exits non-zero — producing a spurious `verdict:"fail"`. The explicit-config path is not affected (the user supplies the exact command). The detection-fallback test in `verify-gate.test.mjs:159` creates structural markers but doesn't create any actual test files, so the detected command would exit non-zero in that sandbox too — but the test only asserts that a verdict is written and the command includes `--test`, not that the verdict is `pass`. Practically this only bites in an edge case (empty test dirs), but it is a silent wrong verdict.

*Recommendation:* either note the limitation in `agents-workflow.md` ("the fallback glob may expand to zero files in sparse repos"), or add `--passWithNoTests` / check for at least one matching file before synthesizing the command. Low urgency — the explicit-config path is the primary path.

### LOW

**LOW-1 — `resolveCommands` returns `[]` for an absent/undetectable project, and the verdict is written with `verdict:"pass"` (no blocking failures in an empty set)** (`verify-gate.js:124-126`)

When no config exists and nothing is detectable, `commands` is `[]`, `results` is `[]`, `blocking_failed` is `false` (no element satisfies `.some(…)`), so the verdict is `pass`. This is a correct empty-set result (the plan explicitly calls this out: "an undetectable project yields an empty set and a clean (non-blocking) verdict — never a crash"), but it means a project that has neither a `verify.json` nor a detectable test structure will always be `pass` at the gate. The team-lead consuming the verdict has no signal that the gate ran with zero commands.

The `commands: []` field in the written verdict IS the signal, so a careful team-lead can detect it. But it is easy to miss in a long audit file.

*Recommendation:* add `commands_count: results.length` to the verdict record or set `verdict:"pass/unchecked"` (a distinct value) when `commands` is empty. Informational — the plan's design is intentional.

**LOW-2 — `stop_hook_active` guard is not checked in the hook** (`verify-gate.js`)

The implementation notes record that `stop_hook_active: false` was the value in the live probe. The CR-1 spike established that `stop_hook_active` guards against the retry-loop pathology. The hook does not check this field — it unconditionally runs when `stop_hook_active` is any value. If the platform ever fires the hook with `stop_hook_active: true` (a re-fire due to a prior attempt), the gate will re-run verify and append a second verdict line for the same subagent stop.

The plan and ADR-31 correctly note the hook must NEVER block; the retry-loop concern applies to the `decision:"block"` path (which this hook never takes), not to the run-and-record path. A double-run would merely append a second advisory record — recoverable, not a correctness failure. But it is a subtle edge case worth documenting.

*Recommendation:* add a comment in `verify-gate.js` noting that `stop_hook_active` is not checked here because the run+record path is idempotent (a double-write to an append-only file is harmless), contrasted with why `decision:"block"` must be withheld (which IS loop-dangerous). Low urgency — this is a maintainability note, not a bug.

**LOW-3 — The `token` field in the verdict is a raw `.pipeline-state` string, but the plan scopes by it** (`verify-gate.js:100`)

The verdict uses the full `.pipeline-state` content (e.g. `developer:implement`) as a round key. The team-lead is told to scope the latest verdict by the current `.pipeline-state` token. This works correctly when the token is stable across a round. However, if the team-lead writes a new token (e.g. advancing to `reviewer:review`) *before* reading the verdict from the prior `developer:implement` stop, the scoping logic would find no matching verdict in the file.

The existing system (violations.log, read-tracker) uses the same token/round pattern. The team-lead already owns the `.pipeline-state` write point, so the ordering is deterministic: consume the verdict (at the implementation-phase checkpoint) → then advance the token. The risk is ordering error in the team-lead's behavioral implementation, not in the hook.

*Recommendation:* the plan's Q-D1 amendment already addresses the related scoping concern (act only at the implementation-phase checkpoint). The team-lead text at `:185-188` is correct. Informational only.

---

## Risk Area Verification

### (1) `agent_type` matching — false-green guard

**Correctly implemented.** The normalization `String(agent_type).toLowerCase().split(/[:/]/).pop()` (`verify-gate.js:102`) reduces `nexus:developer` → `developer` (live-verified by the mandatory probe: `agent_type = nexus:developer`, CLI 2.1.179, pinned in `implementation.md`). The three-way branch is:
- `IMPL_ROLES = {developer, solo}` → run verify, write verdict (`verify-gate.js:45`)
- `NONIMPL_ROLES = {architect, reviewer, po, critic, team-lead, learner}` → exit 0, no verdict (`verify-gate.js:113`)
- absent or unrecognized → writes `agent:"unknown"` verdict, never silent skip (`verify-gate.js:117-119`)

The unknown-agent path correctly WRITES (the false-green guard). The `rawAgent` empty-string check (`!rawAgent || !IMPL_ROLES.has(rawAgent)`) at line 117 is correct: after the non-impl early-return at 113, anything reaching 117 is either absent (`rawAgent = ''`) or unrecognized (not in IMPL_ROLES). Both write the unknown record.

Unit tests at `verify-gate.test.mjs:116-132` cover both absent and unrecognized cases and assert the written record. The platform-contract tripwire at `platform-contract.test.mjs:45-54` permanently pins the `agent_type` read and the matcher-less registration.

**No issue.**

### (2) Never-block guarantee

**Correctly implemented.** The hook has no `process.stdout.write` call anywhere (verified by reading the full 129-line file). The only output path is `process.exit(0)` — no JSON, no decision field, no deny. The `write()` function appends to the verdict file, not stdout.

The `never a deny/block` test at `verify-gate.test.mjs:134-142` asserts both `denyReason(res) === null` (PreToolUse shape) AND `doesNotMatch(res.stdout, /"decision"\s*:\s*"block"/)` (SubagentStop block shape). Both forms are covered.

The hook is synchronous and uses `execSync` (`verify-gate.js:81`), so there is no async path that could emit output after exit. The outer `try/catch` at line 127 swallows all errors silently with `process.exit(0)`.

**No issue.**

### (3) Fail-closed defer-to-queue scoping

**Correctly implemented.** The Q-D1 amendment is present verbatim in `team-lead.md:188`:

> "act on a `blocking_failed` verdict as a defer trigger only at your own implementation-phase verify checkpoint (developer handed back `implementation.md` complete) — **never** on an intermediate `developer:implement` SubagentStop mid-turn"

The defer logic in the Unattended Mode section (`team-lead.md:408`) names four trigger conditions:
- `blocking_failed` verify verdict **at the implementation-phase checkpoint** (correctly scoped to the checkpoint, not every stop)
- 3-cycle review exhaustion
- genuinely unanswered load-bearing question
- token-cap breach

The Review Queue section (`team-lead.md:385-394`) correctly states the gate hook never writes the queue — that is the team-lead's decision. The `flag-off no-queue invariant` test at `verify-gate.test.mjs:144-150` asserts this directly.

The token-cap inert-when-off dependency is stated (`team-lead.md:411`), and the loud-inertness warning is wired in the same paragraph. `Force-accept` is explicitly marked unreachable under `[UNATTENDED]` (`team-lead.md:412`).

**No issue.**

---

## Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| MED-1 | MEDIUM | `plugins/nexus/rules/agents-workflow.md` | `blocking` defaulting to `true` when omitted from verify.json is not documented; a user expecting advisory behavior from an omitted field will be surprised |
| MED-2 | MEDIUM | `plugins/nexus/hooks/scripts/verify-gate.js:71` | Detection-fallback synthesizes glob command that may expand to zero files in sparse repos, producing spurious `fail` verdicts |
| LOW-1 | LOW | `plugins/nexus/hooks/scripts/verify-gate.js:124-126` | Empty command set produces `verdict:"pass"` with no signal that zero commands ran; recommend `commands_count` or a distinct `"pass/unchecked"` value |
| LOW-2 | LOW | `plugins/nexus/hooks/scripts/verify-gate.js` | `stop_hook_active` not checked; a re-fired stop would append a duplicate verdict record (harmless on the run+record path, but worth a comment) |
| LOW-3 | LOW | `plugins/nexus/hooks/scripts/verify-gate.js:100` | Token-scoped verdict consumption relies on team-lead advancing `.pipeline-state` only after reading the verdict; correct by Q-D1, but ordering-sensitive |

*No CRITICAL or HIGH findings. All three highest-risk areas (agent_type matching, never-block, fail-closed scoping) verified clean. GO.*
