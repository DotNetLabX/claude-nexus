# claude-nexus

A multi-agent **team pipeline** for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Instead of one assistant doing everything, Nexus ships a coordinated team of specialized agents — architect, developer, reviewer, PO, critic, learner, team-lead, solo — that hand off work through files and route every message through a single orchestrator. Always-on rules keep them in bounds; process skills give them repeatable recipes; a configurable security guard gates dangerous tool calls.

> **Name alternatives considered:** Gravity, Blade — in case of a future rename.

## Why a pipeline

A single agent loses the thread on anything bigger than a few files: it plans, implements, and reviews in the same breath, so nothing checks its work. Nexus separates the roles. The architect plans, the developer implements, the architect does a done-check, the reviewer reviews — each pass is a fresh perspective with its own boundaries. Work is handed off through artifacts on disk (`docs/specs/{slug}/...`), so a context reset never loses pipeline state.

## Pipeline flow

```
User → PO (spec) → Architect (plan) → Developer (implement)
     → Architect (done check) → Reviewer (code review) → Done
```

- **Hub-and-spoke:** the **team-lead** orchestrates all communication. Agents never message each other directly — this keeps every scope change auditable and lets the user intercept decisions.
- **Fix cycles** (developer ↔ reviewer) are capped at **3**, then escalate to the architect.
- **`solo`** handles small changes (1–3 files) outside the full pipeline.

## Agents

| Agent | Model | Role |
|-------|-------|------|
| **team-lead** | opus | Orchestrates the pipeline, routes all messages, manages commits |
| **architect** | opus | Writes plans, runs done-checks, answers developer questions |
| **po** | opus | Shapes features, writes specs, answers product questions |
| **critic** | opus | Cross-checks specs (vs product doc) and plans (vs spec) |
| **learner** | opus | Consolidates lessons, promotes proven patterns to system files |
| **developer** | sonnet | Implements plan steps, writes `implementation.md` |
| **reviewer** | sonnet | Severity-rated code review |
| **solo** | sonnet | Small scoped changes without the full pipeline |

## Plugins

Nexus ships as two plugins. **Install exactly one** — `nexus-net` is a self-contained superset of `nexus`, not an add-on.

| Plugin | Scope | Skills | Install id |
|--------|-------|--------|------------|
| **nexus** | Stack-agnostic core | 9 process skills | `nexus@claude-nexus` |
| **nexus-net** | .NET / Vue superset | 38 skills (9 core + 29 stack) | `nexus-net@claude-nexus` |

`nexus-net` carries the same pipeline plus .NET / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints / Vue / Pinia / Tailwind conventions inlined into the code-touching agents, and adds 29 stack code-pattern skills (service/module/aggregate scaffolding, CQRS, persistence, gRPC, Vue, …).

## Install

```
claude plugin marketplace add ldumit/claude-nexus
claude plugin install nexus-net@claude-nexus   # .NET / Vue projects
claude plugin install nexus@claude-nexus        # any other stack
```

Pick a security mode when prompted, then **fully restart Claude Code** — plugin load state is latched per session.

## Usage

Two ways to drive an agent:

- **Persona** — `/nexus:architect`, `/nexus:developer`, … (or `/nexus-net:<agent>`). The main thread *adopts* the role for the session. Survives `/compact`, `/clear`, and resume — the `restore-agent` hook re-injects the persona after a context reset.
- **Subagent** — the team-lead spawns agents via the pipeline. They hand off through files and route messages hub-and-spoke.

**Entry points:** `backlog` (triage) → `team-lead` (orchestrate) → `architect` (plan) → `developer` (implement) → `architect` (done-check) → `reviewer` (review). Use `po` to shape a spec, `critic` to cross-check, `learner` to consolidate lessons, `solo` for a quick 1–3 file change.

## How it's organized

A plugin can't auto-load `rules/` or `@`-import bundled files into subagents, so Nexus distributes its knowledge across four mechanisms:

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Rules** (10) | Injected every session by the `inject-rules` hook | Universal behavioral constraints — guardrails, KB navigation, pipeline rules |
| **Agent conventions** | Inlined into each agent file at build time | Coordination protocol + per-agent boundaries travel *with* the subagent |
| **Skills** (9 / 38) | Invoked on demand by name | Reusable recipes — planning, specs, reviews, lessons, TDD, plus stack scaffolding in `nexus-net` |
| **Project docs** | Read at start *if present* (`docs/architecture/`, `docs/conventions/`, `docs/kb/`) | Stack-agnostic by design; absent files are skipped |

DRY is preserved at **build time** — the `nexus-net` agents are generated from the core agent bodies plus the convention sources in `build-src/conventions/` (see `scripts/`).

## Security

A `security_mode` chosen at install time feeds the synchronous `guard` PreToolUse hook:

| Mode | Behavior |
|------|----------|
| `open` (default) | Allows everything **except** catastrophic actions — `rm` outside the repo, force-push, `git reset --hard`, `curl\|sh`, secret reads, cross-repo writes, `sudo`, fork bombs |
| `hardened` | `open` + blocks `git push`, network installs, and remote fetches (teams / CI) |
| `off` | No guard |

`audit-logger` runs asynchronously and appends every tool call to `docs/audit/tool-calls.log` (record-only, never blocks).

## Design decisions

Intentional tradeoffs that reviewers frequently flag — not oversights.

| Decision | Rationale |
|----------|-----------|
| Agent boundary rules repeated per agent | Agents are self-contained — each defines its own "never do" without cross-referencing others. A missed guardrail is the highest-impact failure; duplication is cheaper than the miss. |
| Team-lead as sole message hub | Auditability + user-decision interception. Scope changes can't bypass the user. Single point of failure is the accepted tradeoff. |
| Serial pipeline, no parallelism | Features are 3–10 steps. Parallel coordination overhead exceeds the time saved at this scale. |
| `nexus-net` is a superset, not a dependency | A plugin can only inline conventions into *its own* agents, and subagents receive only their own agent file. So the .NET edition ships a complete agent set with conventions inlined, rather than layering onto `nexus` at runtime. |
| Rules injected every session | Missing a guardrail mid-implementation costs more than the ~150 lines of context. Solo sessions pay a small tax. |

## Details

- [nexus core README](plugins/nexus/README.md) — components, persona vs subagent, where conventions live, full security table
- [nexus-net README](plugins/nexus-net/README.md) — the 29 stack skills, why superset, project template

## License

[MIT](LICENSE)
