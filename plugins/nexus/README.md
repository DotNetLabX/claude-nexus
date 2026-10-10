# nexus

The stack-agnostic, self-contained core of **Nexus** — a multi-agent feature pipeline for Claude Code.

> **Name alternatives considered:** Gravity, Blade — in case of future rename.

It ships a coordinated team of specialized agents, always-on behavioral rules, reusable process skills, persona commands, and a configurable security guard. Nothing in here assumes a particular tech stack — the companion **nexus-dotnet** plugin (which depends on this one) layers .NET / Vue / EF code-pattern skills on top.

## What's inside

| Component | Count | Notes |
|-----------|-------|-------|
| **Agents** | 8 | architect, developer, learner, po, solo, team-lead (`opus`); critic, reviewer (`sonnet`) |
| **Rules** | 18 (4 kernel + 10 on-demand + 1 prohibitions + 1 reply-form + 2 spawn-contract) | **Three** always-on tiers are injected at SessionStart, each as its own separately-capped payload (plugins have no auto-loaded `rules/`) — the kernel, the prohibitions envelope and the reply-form envelope; the on-demand tier is delivered as a Read-Index instead; and the **spawn-contract** pair is not a SessionStart tier at all — it is delivered at *spawn* time, via `SubagentStart` — see *Design: where conventions live* below |
| **Skills** | 20 | 13 process recipes (planning, specs, architecture docs, review calibration, lessons, TDD, debugging, cleanup, verify roles, skill building, releases) + 7 artifact-format and entry schemas (implementation/questions/review/summary/lessons/proposal + KB entries) |
| **Commands** | 10 | 8 persona activators + `backlog` + `style` |
| **Hooks** | 30 commands across 7 events, over 25 scripts | `inject-rules`, `restore-agent`, `inject-prohibitions`, `inject-reply-style`, `declarations-nudge` (SessionStart); `guard`, `pipeline-gate`, `prohibition-gate`, `test-entry-gate`, `owner-ask-gate`, `audit-logger` (PreToolUse); `register-persona`, `learner-cadence`, `boundary-detector`, `registry-stamp-check`, `read-tracker`, `skill-tracker`, `handoff-tracker`, `lessons-tracker`, `config-advisor`, `register-owner-away` (PostToolUse); `inject-verify-roles`, `inject-spawn-contract`, `inject-script-folder`, `handoff-tracker` (SubagentStart); `verify-gate`, `handoff-tracker` (SubagentStop); `handoff-tracker` (Stop, UserPromptSubmit). `handoff-tracker` is registered five times and `read-tracker` twice, which is why 30 commands cover 25 script names |

## Two ways to use an agent

1. **Subagent (native)** — the pipeline spawns agents via the Task tool. The team-lead orchestrates; agents hand off through files (`docs/specs/{slug}/...`) and route messages hub-and-spoke.
2. **Persona (`/nexus:<agent>`)** — the main thread *adopts* a role for the session (e.g. `/nexus:architect`). The command records the role per-session in `.claude/.personas.json` (keyed by session id, so concurrent sessions don't collide). `restore-agent` restores the role on `/compact` via a cap-safe pointer (role identity + agent-file path + re-read instruction + re-grounding block: context duties, summary-content-is-a-claim — the full body exceeds the platform's 10K hook-output cap, ADR-85) — the one event that drops it; `/clear` exits the persona, and entries older than 16h are pruned automatically.

Pipeline entry points: `backlog` (triage) → `team-lead` (orchestrate) → `architect` (plan) → `developer` (implement) → `architect` done-check and `reviewer` (code review), side by side. `solo` is the lightweight path for 1–3 file changes. `po` shapes specs; `critic` cross-checks specs/plans; `learner` consolidates lessons.

## Design: where conventions live

- **Always-on kernel** → `rules/*.md`, injected every session via `inject-rules.js`, budgeted ≤9,200 assembled chars (ADR-91; the platform caps hook output at 10,000 — oversize is persisted to a file and never reaches the model).
- **Always-on prohibitions** → `rules/prohibitions/*.md`, injected every session as a **second, separate** SessionStart payload, budgeted ≤4,000 assembled chars. The platform caps each hook *output* independently, so this costs the kernel nothing. It carries stop-signs only — rules where the violation is a single wrong act, one line plus a pointer to the section that owns the procedure — plus one named affirmative duty; the kernel's tier-1 enumeration is non-recursive, so a subdirectory is invisible to it by construction. The small budget is the point: procedures belong on demand, and the next raise is a diet, not a raise.
- **Always-on reply form** → `rules/reply-style/*.md`, injected every session as a **third**, separate SessionStart payload, budgeted ≤1,000 assembled chars. One paragraph on the *form* of a reply: answer at the level the question was asked, and offer the held-back depth in one closing line rather than front-loading it. It is the one always-on tier with an **off switch** — set `replyStyle` to `"off"` in the project's `.claude/nexus-agents.json` (or run `/nexus:style off`) and this payload is not emitted at all; anything else, including a missing file or an unrecognised value, leaves it on. A user-set Claude Code output style takes precedence over the paragraph, which the paragraph itself says — the plugin never reads or overrides that setting. The reply-form envelope uses the same subdirectory mechanism as the prohibitions tier, and the same doctrine: the small budget is the point.
- **Spawn contract** → `rules/spawn-contract/*.md`, *not* a SessionStart tier at all: delivered at **spawn** time by the `SubagentStart` hook `inject-spawn-contract.js`, budgeted ≤3,000 assembled chars with each file ≤1,500. One block per spawn, chosen by audience — a **charter-less helper** (`general-purpose`, `Explore`, a custom name) gets `helper-contract.md`, which is the only carrier such a spawn has, because a SessionStart injection never reaches one; a **known pipeline role** gets `role-boundary.md`, which is reinforcement only and never a rule's sole carrier, since the agent files keep their own copies. Same pointer form as the prohibitions envelope: one imperative per line, each naming the section that owns it. The hook informs, it does not enforce — a synchronous hook decision is not honored for a background subagent's tool call, so nothing here is a gate.
- **On-demand rules** → `rules/on-demand/*.md`, *not* injected. The hook emits a **Read-Index** instead: one line per file, its path relative to the plugin root the payload states once + the file's `> Read when:` trigger. Read the file when its trigger fires.
- **Decision citations** → the `ADR-n` tags in the agents and rules are provenance pointers into the plugin's source repository's architecture record (where a rule means *your* project's decision register instead, it says so); `rules/on-demand/agents-workflow.md` § Glossary ships one-line meanings for the private terms and the most-cited decisions.
- **Coordination protocol & per-agent conventions** → **inlined directly into the agent files** (plugin agents can't `@`-import bundled files, and `${CLAUDE_PLUGIN_ROOT}` doesn't expand in agent/command markdown — a command's `` !` ``-preprocess line is the exception the plugin relies on, because the CLI runs that line and substitutes its output before the model sees the file). Each pipeline agent carries its own `## Coordination Protocol`; the team-lead also carries `## Operations`.
- **Project-owned docs** (`docs/architecture/`, `docs/conventions/`, `docs/kb/`) → agents **read them at start if present**. Stack-agnostic by design; absent files are skipped.
- **On-demand recipes** → skills, invoked by name (architect → `create-implementation-plan`/`create-architecture-doc`; po → `create-feature-spec`; learner → `improve-flow`/`improve-skills`).

## Security

A `userConfig.security_mode` is chosen at install time and passed to the synchronous `guard.js` PreToolUse hook:

| Mode | Behavior |
|------|----------|
| `open` (default) | Allow everything **except** catastrophic actions — `rm` outside the repo, force-push, `git reset --hard`, `curl\|sh`, secret reads (`.env`, `secrets`, `id_rsa`), cross-repo writes, `sudo`, fork bombs |
| `hardened` | `open` + blocks `git push`, network installs, and remote fetches (for teams / CI) |
| `off` | No guard |

With `userConfig.token_audit` on (default off), `audit-logger.js` runs asynchronously and appends every tool call to `.claude/audit/{session_id}.log` (record-only; never blocks).

## Reply form

The always-on reply-form paragraph, delivered every session, shapes how replies are *formed*: answer at the level the question was asked — a product-worded question gets the outcome in plain words, a technical one gets a technical answer, a mixed one is treated as product — and offer the held-back depth in one closing line instead of front-loading it. Error reports, failing tests, security warnings, destructive-action confirmations and any decision the agent puts to you are exempt and keep their full content. Reply *form* only: reasoning, verification and tool use are untouched.

It is on by default and controlled by one committed key, `replyStyle` in the project's `.claude/nexus-agents.json`. Only the literal string `off` turns it off — any casing, surrounding whitespace ignored. **Anything else leaves it on:** a missing file, a missing key, a value that is not a string, an unrecognised value, a file that cannot be read, or one that does not parse. A broken config never costs a session its rules, and nothing is injected into the session to complain about it — `/nexus:style` is where you find out.

| Command | Effect |
|---------|--------|
| `/nexus:style` | Reports the state the file resolves to, where that came from, and the config file's full path. Writes nothing. |
| `/nexus:style on` | Sets the key to `on` and prints the paragraph, so the rule applies for the rest of this session too. |
| `/nexus:style off` | Sets the key to `off` and prints the stand-down notice. |

Both writes behave the same way. Either one creates `.claude/nexus-agents.json` containing only that key if the file does not exist, and preserves every other key byte-for-byte if it does. If the key already holds the value you asked for — **or the file or key is absent, which is the same as `on`** — nothing is written and nothing is created; the report says *already on* / *already off*. If the file exists but does not parse, nothing is written at all and the command says why.

The **printed** half always runs, whatever the file half did: the key decides what the *next* session receives, while what the command prints takes effect immediately — this session's delivery was decided at its start and need not match the file. **A user-set Claude Code output style wins**, which the paragraph says itself; the plugin performs no detection of that setting and never edits it.

## Install

```
/plugin marketplace add <path-or-url to claude-nexus>
/plugin install nexus@claude-nexus
```

Pick a security mode when prompted, then fully restart Claude Code (plugin load state is latched per session).

## Stack-specific work

For .NET / ASP.NET / EF Core / CQRS / DDD / FastEndpoints / Vue / Pinia / Tailwind patterns, install **nexus-dotnet**, which declares `dependencies: ["nexus"]` (so it auto-installs this plugin) and adds the stack code-pattern skills plus convention files.
