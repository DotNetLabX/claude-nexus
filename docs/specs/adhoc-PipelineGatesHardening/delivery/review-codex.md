# Cross-Check Review -- Pipeline Gates Hardening
**Reviewer:** codex-rescue
**Date:** 2026-06-13
**Scope:** boundary-detector.js Bash branch, skill-tracker.js, hooks.json

---

## Verdict: GO (with 2 WARNs)

No blocking defects. Both gates implement their stated contract correctly.
The two WARNs are known-by-design gaps that do not prevent shipping.

| WARN | boundary-detector.js | L103-104 | git -C /path commit is NOT caught. The -C flag before the subcommand breaks the regex. Best-effort by design; git log author check is the guaranteed backstop. Not a blocking defect. |
| WARN | boundary-detector.js | L103-104 | Shell aliases (gc for git commit) omitting the literal word git are not caught. Best-effort by design. |
| INFO | skill-tracker.js | L62 | A Skill event with no skill key in tool_input exits silently (zero footprint). Correct -- nothing to log -- but no log line is produced for such malformed events. |

---

## Findings

| Severity | File | Location | Finding |
|----------|------|----------|---------|
| WARN | boundary-detector.js | L103-104 | git -C /path commit is NOT caught. The -C flag before the subcommand breaks the regex. Best-effort by design; git log author check is the guaranteed backstop. Not a blocking defect. |
| WARN | boundary-detector.js | L103-104 | Shell aliases (gc for git commit) omitting the literal word git are not caught. Best-effort by design. |
| INFO | skill-tracker.js | L62 | A Skill event with no skill key in tool_input exits silently (zero footprint). Correct -- nothing to log -- but no log line is produced for such malformed events. |

---

## Area 1 -- boundary-detector.js: Bash Branch

### Branch placement

Verified by reading L78-112. Control flow:

- L78: tool_name allowlist check (Write|Edit|MultiEdit|Agent|Task|Bash) -- Bash included.
- L79: agent_type guard -- subagent-only scope enforced before any branch executes.
- L85-90: Agent|Task branch.
- L91-106: Bash branch (new code). Sets fp and rule, or exits at L104 if no verb matches.
- L107-111: else block (Write/Edit/MultiEdit) with file_path early-exit at L109.

The Bash branch at L91 is structurally prior to the file_path early-exit at L109.
A Bash event never reaches L109. Placement: PASS.

### Regex probes

Regex: /\bgit\s+(commit|add|reset|push|stash|restore|switch)(\s|$)/ on ti.command.toLowerCase() at L103-104.

All results verified by running the regex in Node against exact strings.

| Probe | Command string (lowercased) | Expected | Result |
|-------|----------------------------|----------|--------|
| A. git commit | git commit -m msg | MATCH | PASS |
| A. git add | git add . | MATCH | PASS |
| A. git reset | git reset --soft head~1 | MATCH | PASS |
| A. git push | git push origin main | MATCH | PASS |
| A. git stash | git stash | MATCH | PASS |
| A. git restore | git restore . | MATCH | PASS |
| A. git switch | git switch main | MATCH | PASS |
| A. git commit at end of string | git commit | MATCH (dollar arm) | PASS |
| A. git add at end of string | git add | MATCH (dollar arm) | PASS |
| A. &&-chain: git status && git commit | git status && git commit -m x | MATCH (substring scan) | PASS |
| A. &&-chain: git log && git push | git log && git push origin main | MATCH | PASS |
| A. &&-chain: git add && git commit | git add . && git commit -m y | MATCH | PASS |
| B. bash -c with inner quotes | bash -c git commit -m x (inner-quoted) | MATCH (word boundary before g after quote char) | PASS |
| B. bash -c no inner quotes | bash -c git commit -m x | MATCH (git commit substring present) | PASS |
| C. git commit-graph write | git commit-graph write | NO MATCH (trailing dash not space or end) | PASS |
| D. Quoted args | git commit -m some message | MATCH | PASS |
| E. Leading whitespace | (spaces)git commit -m x | MATCH (word boundary at space/g) | PASS |
| F. git -C /path commit | git -c /path commit -m x | NO MATCH | WARN (documented gap) |
| G. Shell alias gc | gc -m msg | NO MATCH | WARN (documented gap) |
| Read-only: git log | git log --oneline | NO MATCH | PASS |
| Read-only: git status | git status | NO MATCH | PASS |
| Read-only: git diff | git diff head | NO MATCH | PASS |
| Read-only: git show | git show head | NO MATCH | PASS |
| Main-session (no agent_type) | any | exit(0) at L79 before Bash branch | PASS |

Note on Probe B (bash -c wrapping): An initial test-harness run showed a false negative
for one bash -c form due to shell-level quote stripping in the probe script. Retested
as Node string literals: the lowercased command contains the substring git commit
preceded by a non-word character (quote or space), satisfying the word boundary.
The regex correctly catches wrapped forms where the literal git <verb> substring is present.

---

## Area 2 -- skill-tracker.js

| Criterion | Expected | Finding | Result |
|-----------|----------|---------|--------|
| Never blocks | Fire-and-forget | process.exit(0) at L83 always fires regardless of path | PASS |
| Fail-silent on error | No throws, no exit(1) | Entire handler in try/catch at L56/L82; process.exit(0) at L83 is outside try so always executes | PASS |
| No config-gate | Active without opt-in flag | No argv check, no env-flag check, no conditional activation | PASS |
| tool_name Skill filter | Only Skill events processed | L58: strict equality check exits before any fs call for all other tool names | PASS |
| Non-Skill event writes nothing | Zero footprint | L58 exits before mkdir or appendFile | PASS |
| Attribution: agent_type first | data.agent_type takes priority | L69: data.agent_type then readSessionPersona then main | PASS |
| Attribution: session persona fallback | Reads .personas.json | L43-49: try/catch reads .personas.json[sid].agent, returns null on error | PASS |
| Attribution: main tail | Literal string main when both prior sources absent | third fallback in chain at L69 | PASS |
| Agent name reduction | nexus:developer -> developer | L70: toLowerCase then split on colon-or-slash then pop -- mirrors boundary-detector and audit-logger | PASS |
| skill from tool_input.skill | Verbatim skill name | L61: String(ti.skill or empty) | PASS |
| Empty skill: zero footprint | Exits silently | L62: if not skill then return process.exit(0) | PASS (INFO noted) |
| Round token from .pipeline-state | empty string if absent | L74: nested try/catch -- token stays empty on any read error | PASS |
| session from data.session_id | String, empty if absent | L64: String(data.session_id or empty) | PASS |
| Log schema ts+agent+skill+token+session | Exactly five fields | L80: JSON.stringify with those five keys | PASS |
| Log file: skill-invocations.log | Distinct from violations.log | L79: path.join(auditDir, skill-invocations.log) | PASS |
| Root resolution chain | CLAUDE_PROJECT_DIR or data.cwd or cwd() | L65 -- identical to boundary-detector.js and audit-logger.js | PASS |

---

## Area 3 -- hooks.json

| Criterion | Expected | Finding | Result |
|-----------|----------|---------|--------|
| Valid JSON | Parses without error | JSON.parse succeeds on full file | PASS |
| Bash in boundary-detector matcher | Extends Write|Edit|MultiEdit|Agent|Task with |Bash | PostToolUse[1].matcher confirmed as Write|Edit|MultiEdit|Agent|Task|Bash | PASS |
| New Skill entry present | PostToolUse entry with matcher Skill | PostToolUse[3]: matcher Skill, command -> skill-tracker.js, timeout 10, async true | PASS |
| Skill entry shape matches existing entries | type, command, timeout, async fields | All four fields present, values match read-tracker entry conventions | PASS |
| No duplicate-matcher violation | Skill unique across PostToolUse | Matchers: Write|Edit and Write|Edit|MultiEdit|Agent|Task|Bash and Read and Skill -- no overlap | PASS |
| Ordering: Skill last in PostToolUse | Appended after Read entry | [0] register-persona, [1] boundary-detector, [2] read-tracker, [3] skill-tracker | PASS |
| async true on new/modified entries | Consistent with audit hooks | Both boundary-detector and skill-tracker carry async true | PASS |
| PreToolUse guard matcher unchanged | Read|Write|Edit|MultiEdit|NotebookEdit|Bash | Verified unchanged -- no regression | PASS |
| pipeline-gate matcher unchanged | Write|Edit|MultiEdit | Verified unchanged -- no regression | PASS |

---

## Summary

All three areas check out. The two WARNs (git -C flag form and shell aliases) are acknowledged
best-effort boundaries in both the plan and the L93-95 comment block in boundary-detector.js.
The guaranteed retroactive catch is the team-lead git log author check, which unwinds any
commit not authored by the team lead regardless of how it was made.

**Verdict: GO.**
