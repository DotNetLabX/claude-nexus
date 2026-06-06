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

Nexus ships as **two plugins** in the `claude-nexus` marketplace — a stack-agnostic core and a thin stack extension that **depends on** it:

| Plugin | Scope | Skills | Install id | How to install |
|--------|-------|--------|------------|----------------|
| **nexus** | Stack-agnostic core (pipeline agents, rules, process skills, security guard) | 14 (9 process + 5 artifact-format) | `nexus@claude-nexus` | Standalone |
| **nexus-dotnet** | .NET / Vue stack extension | 29 stack | `nexus-dotnet@claude-nexus` | `dependencies: ["nexus"]` — installing it **auto-installs `nexus`** |

- **Generic / non-.NET stacks** → install **`nexus`** alone. Its code-touching agents read the project's `docs/conventions/` if present (Read-Index), so the pipeline adapts to any stack.
- **.NET / Vue stacks** → install **`nexus-dotnet`**. It declares `dependencies: ["nexus"]`, so Claude Code pulls and enables `nexus` automatically and layers the 29 .NET / ASP.NET Core / EF Core / CQRS / DDD / FastEndpoints / Vue / Pinia / Tailwind code-pattern skills plus the stack convention files on top.

> **Why a dependency, not a superset?** Plugin dependencies auto-install, auto-enable, and layer their components, so a thin extension reuses the core's agents/rules/hooks at runtime instead of shipping a hand-composed copy. This removes the most error-prone build step.

## Install & lifecycle

Every command runs two ways — **in-session** as a slash command (`/plugin …`) or in the **terminal** as `claude plugin …`. They're equivalent. Shortcuts: `/plugin market` = `/plugin marketplace`, `rm` = `remove`.

### 1. Add + install

Add the marketplace once, then install the plugin for your stack:

```
/plugin marketplace add DotNetLabX/claude-nexus     # GitHub owner/repo
/plugin install nexus@claude-nexus              # generic stack
```

.NET / Vue projects — install the stack extension (it auto-installs `nexus`):

```
/plugin install nexus-dotnet@claude-nexus       # pulls + enables nexus automatically
```

Pick a security mode when prompted, then run `/reload-plugins` (or restart Claude Code) to activate.

Other `add` sources: a full git URL (`…/claude-nexus.git`, optionally `#branch`) or a local path (`./claude-nexus`). Terminal form, with install scope:

```
claude plugin marketplace add DotNetLabX/claude-nexus
claude plugin install nexus@claude-nexus --scope user   # user (default) | project | local
```

### 2. Update

Updating is **two steps** — refresh the catalog, then update the installed plugin:

```
/plugin marketplace update claude-nexus     # pull latest marketplace.json + versions
/plugin update nexus@claude-nexus           # update the plugin
/reload-plugins                             # apply (or restart)
```

> **Version-gated.** A plugin update is pulled only when its `version` in `plugin.json` is bumped — if the resolved version matches what you already have, `/plugin update` skips it. (Plugins with no `version` fall back to the git commit SHA, so every commit counts as an update.)

Terminal: `claude plugin marketplace update claude-nexus` (omit the name to refresh all marketplaces). Or enable **auto-update** per marketplace in `/plugin` → **Marketplaces**, which refreshes and updates at startup, then prompts you to `/reload-plugins`.

### 3. Remove

```
/plugin uninstall nexus@claude-nexus        # uninstall one plugin
/plugin disable  nexus@claude-nexus         # stop loading it, keep it installed
/plugin enable   nexus@claude-nexus         # re-enable later
```

Remove the whole marketplace — this **uninstalls every plugin installed from it**:

```
/plugin marketplace remove claude-nexus
```

Inspect state any time with `/plugin list` (`--enabled` / `--disabled`) or the `/plugin` → **Installed** tab.

## Usage

Two ways to drive an agent:

- **Persona** — `/nexus:architect`, `/nexus:developer`, …. The main thread *adopts* the role, tracked per-session in `.claude/.personas.json`. The `restore-agent` hook re-injects the role on `/compact` (the one event that silently drops it); `/clear` exits the persona; abandoned sessions expire after 16h. Concurrent sessions each keep their own role.
- **Subagent** — the team-lead spawns agents via the pipeline. They hand off through files and route messages hub-and-spoke.

**Entry points:** `backlog` (triage) → `team-lead` (orchestrate) → `architect` (plan) → `developer` (implement) → `architect` (done-check) → `reviewer` (review). Use `po` to shape a spec, `critic` to cross-check, `learner` to consolidate lessons, `solo` for a quick 1–3 file change.

## How it's organized

A plugin can't auto-load `rules/` or `@`-import bundled files into subagents, so Nexus distributes its knowledge across four mechanisms:

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Rules** (11) | Injected every session by the `inject-rules` hook | Universal behavioral constraints — guardrails, KB navigation, pipeline rules, engineering discipline |
| **Agent conventions** | Inlined into each agent file at build time | Coordination protocol + per-agent boundaries travel *with* the subagent |
| **Skills** (14 core + 29 stack) | Auto-discovered (model-invoked by `description` + task context; none disable model invocation), and also pinned by name — and preloaded via each agent's `skills:` frontmatter — where the pipeline wants determinism | Reusable recipes — planning, specs, reviews, lessons, TDD, artifact-format schemas, plus stack scaffolding in `nexus-dotnet` |
| **Project docs** | Read at start *if present* (`docs/architecture/`, `docs/conventions/`, `docs/kb/`) | Stack-agnostic by design; absent files are skipped |

The stack extension (`nexus-dotnet`) layers on at runtime via `dependencies: ["nexus"]` — no build-time agent composition. The only generated artifacts are the persona commands (`gen-commands.mjs`, agents → commands) and the `nexus-dotnet` payload (`gen-nexus-dotnet.mjs`, skills + conventions).

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
| Stack support is a dependency extension, not a superset | Plugin dependencies auto-install, auto-enable, and layer components at runtime, so `nexus-dotnet` reuses the core's agents/rules/hooks instead of shipping a hand-composed copy. This removes the fragile build-time agent composition; the core's code-touching agents read `docs/conventions/` (Read-Index), which the extension supplies. |
| Rules injected every session | Missing a guardrail mid-implementation costs more than the ~150 lines of context. Solo sessions pay a small tax. |

## Details

- [Architecture & Decision Record](docs/architecture/README.md) — why Nexus is built the way it is: source of truth, dependency model, knowledge delivery, pipeline enforcement, build & release
- [nexus core README](plugins/nexus/README.md) — components, persona vs subagent, where conventions live, full security table
- [nexus-dotnet README](plugins/nexus-dotnet/README.md) — the 29 stack skills, the dependency model, project template

## License

[MIT](LICENSE)
