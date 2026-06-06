# Nexus — Architecture & Decision Record

The canonical record of **how Nexus is built and why**. Nexus is a multi-agent feature-delivery
pipeline distributed as Claude Code plugins. This document lives **in the plugin repo** because the
plugin repo is the single source of truth (see ADR-1).

> **Scope.** `nexus` is the public core; `nexus-dotnet` is its .NET/Vue stack extension. `omni` /
> `omni-dotnet` are a private twin **generated** from this repo (ADR-6) — everything here applies to
> both, modulo naming. Each section is an ADR: *Context → Decision → Why → Tradeoffs → Rejected
> alternatives.*

## Contents
- [Platform constraints that shape everything](#platform-constraints)
- ADR-1 — Plugin repo is the single source of truth
- ADR-2 — How knowledge reaches the agents (four delivery mechanisms)
- ADR-3 — Stack support is a dependency extension, not a superset
- ADR-4 — Artifact formats are skills, preloaded producer-only
- ADR-5 — Conventions use the Read-Index pattern
- ADR-6 — `omni` is generated from `nexus`
- ADR-7 — Pipeline enforcement: failures must be unreachable, not merely discouraged
- ADR-8 — Security guard as a synchronous hook
- ADR-9 — Build & release pipeline
- [Inherited pipeline decisions](#inherited-pipeline-decisions)
- [Known limitations / future work](#known-limitations--future-work)

---

## Platform constraints
Three Claude Code facts drive most decisions below. Verified against the docs (June 2026):

1. **Plugins have no auto-loaded `rules/`.** A plugin can ship `agents/`, `commands/`, `skills/`,
   `hooks/`, `.mcp.json`, `.lsp.json`, `monitors/`, `bin/`, `settings.json` — but *not* a `rules/`
   directory that auto-loads. Project `.claude/rules/` reaches subagents via the CLAUDE.md hierarchy;
   a plugin cannot.
2. **Subagents receive only their own agent file as system prompt** (plus preloaded skills and basic
   env). They cannot `@`-import bundled files, and `${CLAUDE_PLUGIN_ROOT}` expands only in hook /
   MCP / monitor *command strings*, never inside agent or skill markdown.
3. **The plugin cache is keyed by version.** Installed plugins are copied to
   `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>`. `/plugin update` is a no-op unless
   `plugin.json`'s `version` changed. `--plugin-dir` bypasses the cache and reads a working checkout
   live.

Sources: code.claude.com/docs — `plugins-reference`, `sub-agents`, `discover-plugins`,
`plugin-dependencies`.

---

## ADR-1 — The plugin repo is the single source of truth
**Context.** Nexus was originally developed *inside a consuming project* (`fokus/.claude/`) and
copied into the plugin by hand ("the hardcopy"). Two copies drifted.

**Decision.** The plugin repo is canonical. Consuming projects **install** the plugin and **only**
hold project-specific files (`CLAUDE.md`, `docs/specs/`, `docs/kb/`, `docs/conventions/`,
`.claude/settings*.json`). No project holds a copy of the plugin's agents/rules/skills/hooks.

**Why.** A project hardcopy is coupled to that project, has no versioning, and drifts. The drift was
not theoretical: the artifact-format definitions stayed in the hardcopy and never shipped, so the
plugin referenced five `*-format` skills that did not exist (see ADR-4). "When your AI tooling lives
inside `.claude/` of a single project it is coupled to that project with no mechanism to version,
share, or update it." Plugins are the package manager for AI workflows.

**Dev loop without a hardcopy.** `claude --plugin-dir <repo>/plugins/nexus` loads the working
checkout live (cache-bypassed, no restart; a `--plugin-dir` plugin overrides an installed copy of the
same name for that session). `/reload-plugins` hot-reloads — `SKILL.md` edits apply immediately;
agent/hook/MCP edits need the reload. Feedback flows: project surfaces a gap → fix in the plugin
repo → bump version → `/plugin update`.

**Tradeoffs.** Iterating means running with `--plugin-dir` rather than editing files in the project
you're sitting in. Worth it to kill drift.

**Rejected.** *Hardcopy-as-source* (the origin of the format-gap bug). *Treat each project's copy as
a fork* (N truths, no convergence).

---

## ADR-2 — How knowledge reaches the agents
**Context.** Given the platform constraints, bundled content does not automatically reach a spawned
subagent.

**Decision.** Four mechanisms, each chosen to beat a specific constraint:

| Layer | Mechanism | Beats constraint |
|-------|-----------|------------------|
| **Always-on rules** | A SessionStart hook (`inject-rules.js`) injects `rules/*.md` every session | #1 (no auto `rules/`) |
| **Coordination protocol + per-agent boundaries** | **Inlined into each agent file** at author time | #2 (subagent sees only its own file; no `@`-import) |
| **Reusable recipes / schemas** | **Skills**, invoked by name and/or preloaded via `skills:` frontmatter | #2 (preload injects full content at spawn) |
| **Project specifics** | Agents **read `docs/architecture/`, `docs/conventions/`, `docs/kb/` if present** | keeps the core stack-agnostic |

**Why.** Each mechanism is the *only* reliable carrier for its payload given constraints #1–#2.
Inlining the coordination protocol is deliberate duplication — a subagent that doesn't carry its own
protocol has no way to obtain it.

**Tradeoffs.** Rules cost ~150 lines of context every session (even solo). Inlined protocol is
duplicated across agents. Both are cheaper than a missed guardrail mid-run.

---

## ADR-3 — Stack support is a dependency extension, not a superset
**Context.** The .NET/Vue edition needs the same pipeline plus stack skills/conventions. The first
design was `nexus-net`: a **superset** that shipped a complete *second copy* of every agent with
conventions inlined, generated by a `compose-dotnet-agents.mjs` build step.

**Decision.** Drop the superset. Ship `nexus` (core) + **`nexus-dotnet`** (thin), where
`nexus-dotnet` declares `dependencies: ["nexus"]` and adds only stack skills + convention files.

**Why.** Plugin dependencies **auto-install, auto-enable, and layer their components** — "when you
enable a plugin, Claude Code also enables its dependencies." So installing `nexus-dotnet` pulls and
enables `nexus`, and the core's agents/rules/hooks are active alongside the extension's skills. The
superset duplicated all of that and required regenerating 8 agents on every edit — the single most
error-prone build step. Removing it deleted `compose-dotnet-agents.mjs`, `scaffold-dotnet.mjs`,
`gen-nexus-dotnet.mjs`, and `build-src/`.

**Tradeoffs.** The dependency model relies on the project having `docs/conventions/` for the core
agents to read (the extension ships them to copy in) — the superset avoided that by inlining, at the
cost of the fragile build. Net: prefer dependencies.

**Rejected.** *Keep the superset* (retains the fragile compose step). *Ship both models* (maximum
maintenance surface).

---

## ADR-4 — Artifact formats are skills, preloaded producer-only
**Context.** Agents are told to write `implementation.md`, `questions.md`, `review.md`,
`summary.md`, `lessons.md` "following the `X-format` skill". Those five skills **did not exist** —
referenced in 6 files, defined in 0 (the ADR-1 drift). Downstream machinery depends on the shapes:
hub-and-spoke routing reads `questions.md`'s `To:` field; the review gate parses `review.md`'s
verdict/severity; the architect's done-check reads `implementation.md`'s sections.

**Decision.** Create the five `*-format` **skills** in the core, and **preload each only into the
agent(s) that *produce* that artifact** via the agent's `skills:` frontmatter:

| Format | Preloaded onto (producers) |
|--------|----------------------------|
| `implementation-format` | developer |
| `questions-format` | developer, architect |
| `review-format` | reviewer, architect |
| `lessons-format` | architect |
| `summary-format` | team-lead |

**Why.** Skills are the right carrier (single source, on-demand). Naming a skill in prose is a model
*decision* that can be skipped; the `skills:` frontmatter field **injects the full skill content at
subagent startup** — guaranteed, not discretionary. Preloading is scoped to producers so no agent
carries a format it never writes. Skill names are **bare** (`questions-format`, not
`nexus:questions-format`) — the established convention in this repo (the architect already preloaded
bare `create-implementation-plan`); bare names are portable across all four plugins, and if a bare
ref ever fails to resolve it degrades safely to the prose-named invocation.

**Tradeoffs.** A small always-on context cost on producing agents. Acceptable vs. silent
shape-drift in machinery-critical artifacts.

**Rejected.** *Pure skills, no preload* (leaves machinery-critical formats to model discretion).
*Inline each format into every agent* (duplicates five evolvable templates across the agent set).
*Ship as `rules/` or `${CLAUDE_PLUGIN_ROOT}` files* (unsupported delivery to subagents, per
constraints #1–#2).

---

## ADR-5 — Conventions use the Read-Index pattern
**Context.** Stack coding conventions (csharp, ef-core, vue, testing, …) must reach the code-touching
agents without inlining them into every agent (which the dropped superset did).

**Decision.** The code-touching agents (developer, reviewer, solo, architect) **read
`docs/conventions/coding-conventions.md` if present — the index — and every file it lists**, at the
start of code work. `nexus-dotnet` ships those convention files for a project to place under
`docs/conventions/`.

**Why.** It keeps the core stack-agnostic (absent file → skipped) while letting any project — .NET or
otherwise — supply binding standards the agents honor. One index file points at the rest, so adding a
convention doesn't require touching agents.

**Tradeoffs.** The project must place the conventions (a copy step the extension documents). In
exchange the core ships zero stack assumptions.

---

## ADR-6 — `omni` is generated from `nexus`
**Context.** A private twin (`omni`/`omni-dotnet`, proprietary license) was maintained by hand-mirror
(`sed`), doubling every change and the error surface.

**Decision.** `nexus` is canonical; `scripts/gen-omni.mjs` **regenerates** the omni repo —
token-swapping identifiers (`Nexus→Omni`, `nexus→omni`, `DotNetLabX→omniaz`), rebuilding the plugins,
`scripts/gen-commands.mjs`, and `marketplace.json` plugins array.

**Why.** Single source of truth removes by-hand divergence. The generator **preserves omni's
proprietary `LICENSE`, marketplace name/owner**, and rewrites the README license footer + privacy
note via an explicit override list. A hard guard **refuses to write an omni README that still
contains "MIT"** so the proprietary twin can never inherit the public license.

**Tradeoffs.** The twin/license narrative does not token-swap cleanly, so this architecture doc and
the top-level READMEs carry small per-twin overrides rather than being blindly mirrored.

**Rejected.** *Hand-mirror* (the status quo being replaced). *One repo, two marketplace names*
(license/visibility differ per repo).

---

## ADR-7 — Pipeline enforcement: failures must be unreachable, not discouraged
**Context.** A real pipeline post-mortem showed agents that *believed* they were following the
protocol while silently collapsing it (single-spawning instead of the two-phase Analyze→Resume,
approving with open HIGH findings, the done-checker editing source). The defects were baked into the
agent specs, so a *faithful* agent reproduced them.

**Design test.** *Could an agent faithfully following the spec still make this mistake — and still
believe it succeeded? If yes, it isn't fixed.* Fixes must make the failure **unreachable**.

**Decision.** Two layers:
- **Spec (Track A)** — explicit two-phase spawn, message templates, verdict validation (reject
  APPROVED-with-open-HIGH, PASS-with-Missing), no-self-fix in the done-check, unattended-mode
  defaults.
- **Mechanical (Track B)** — synchronous PreToolUse hooks that *enforce* what the spec asks:
  `guard.js` (blocks catastrophic/secret/out-of-root actions and non-code personas editing source)
  and `pipeline-gate.js` (blocks plan/source writes during an `:analyze` phase, and APPROVED reviews
  with unresolved CRITICAL/HIGH). Both fail open and emit self-correcting deny reasons so unattended
  (`claude -p`) runs stay safe.

**Why.** Spec text relies on the agent's belief; a hook does not. Mechanical gates catch the cases
where a faithful agent would otherwise fail silently.

**Tradeoffs.** Hooks add latency and complexity; they fail open to avoid blocking legitimate work.

---

## ADR-8 — Security guard as a synchronous hook
**Decision.** A `security_mode` chosen at install (`userConfig`) feeds the synchronous `guard.js`
PreToolUse hook: `open` (default — blocks catastrophic actions only), `hardened` (adds push/network
blocks for teams/CI), `off`. `audit-logger.js` runs async and appends every tool call to
`docs/audit/tool-calls.log` (record-only, never blocks).

**Why.** Enforcement must be synchronous (able to deny) and separate from observation (must never
block). One knob keeps it usable.

---

## ADR-9 — Build & release pipeline
**Decision.** The only generated artifacts are persona **commands** (`gen-commands.mjs`, agents →
commands) and the **omni twin** (`gen-omni.mjs`). Release flow:

```
edit plugin → node scripts/gen-commands.mjs nexus → node scripts/gen-omni.mjs
            → claude plugin validate <each plugin> → bump version in plugin.json
            → claude plugin tag --push
```

**Why.** Fewer build steps = fewer ways to forget one. `claude plugin validate` is the CI gate the
best-maintained marketplaces use. The version bump is mandatory because the cache is version-keyed
(constraint #3): no bump → users never see the change.

**Rejected.** *Codegen-composed supersets* (ADR-3). *Hand-mirroring* (ADR-6).

---

## Inherited pipeline decisions
Pre-existing tradeoffs, retained:

| Decision | Rationale |
|----------|-----------|
| Agent boundary rules repeated per agent | Self-contained agents; a missed guardrail is the highest-impact failure, so duplication is cheaper than the miss. |
| Team-lead as sole message hub | Auditability + user-decision interception; scope changes can't bypass the user. |
| Serial pipeline, no parallelism | Features are 3–10 steps; parallel coordination overhead exceeds the saving at this scale. |
| Rules injected every session | Missing a guardrail mid-run costs more than the context; solo pays a small tax. |

---

## Known limitations / future work
- **Skill-inventory discovery (P2).** `create-implementation-plan` / `create-architecture-doc` build
  their skill inventory by globbing `.claude/skills/`. Plugin skills live in the version cache, **not**
  in the project's `.claude/skills/`, and there is no documented runtime "list skills" API — so the
  inventory under-reports plugin-provided skills. Fix: have those skills use the skills surfaced in
  the agent's context rather than a directory glob.
- **CI gate.** A GitHub Actions workflow running `claude plugin validate` on every push is
  recommended but not yet added. A lint for dangling `*-format`/skill references would catch the exact
  class of bug behind ADR-4.

---

*Working proposals that fed this record (historical, superseded by this doc): pipeline-enforcement
fixes, artifact-format delivery, and build/source-of-truth analyses — originally drafted in a
consuming project before ADR-1 moved the canonical record here.*
