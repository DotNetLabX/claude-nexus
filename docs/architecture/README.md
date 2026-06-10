# Nexus — Architecture & Decision Record

The canonical record of **how Nexus is built and why**. Nexus is a multi-agent feature-delivery
pipeline distributed as Claude Code plugins. This document lives **in the plugin repo** because the
plugin repo is the single source of truth (see ADR-1).

> **Dev-repo exception:** this file is the *plugin's* ADR record and deliberately keeps its
> `README.md` name/format. Consumer projects use `docs/architecture/index.md` as produced by the
> `create-architecture-doc` skill — the canonicalization there does not apply here.

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
- ADR-7 — Pipeline enforcement: failures must be unreachable, not merely discouraged *(qualified by ADR-13)*
- ADR-8 — Security guard as a synchronous hook
- ADR-9 — Build & release pipeline
- ADR-10 — Spawn mode: foreground for pipeline agents *(superseded by ADR-12)*
- ADR-11 — Token consumption audit (opt-in)
- ADR-12 — Spawn mode: background for pipeline agents (supersedes ADR-10)
- ADR-13 — The pipeline gate does not enforce on background subagents (qualifies ADR-7)
- ADR-14 — Agent self-containment: hard rules live in the agent, not the orchestrator
- ADR-15 — Graduated, minimal-intervention enforcement by the team lead
- ADR-16 — Relay model: background spawn + TaskOutput/artifact, inline notice is partial *(emphasis later inverted by ADR-17)*
- ADR-17 — The artifact is the primary deliverable; TaskOutput is best-effort *(refines ADR-16)*
- ADR-18 — Agent output boundaries: never author another agent's gate *(extends ADR-14)*
- ADR-19 — Team-lead operational depth, restored from the Fokus baseline
- ADR-20 — Commit strategy: 2 commits with override (reverts the 4-checkpoint default)
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
> **Qualified by ADR-13.** Track B's mechanical gate is unreachable-to-violate only for a *foreground* writer; a **background subagent's hook deny is not honored by the platform**, so for backgrounded pipeline agents (ADR-12) the "unreachable" guarantee does not hold — enforcement falls back to the agent's own hard-stop rule (ADR-14) + the team lead's verify-intervene (ADR-15). The principle stands; its mechanical reach was narrower than assumed.

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
blocks for teams/CI), `off`. `audit-logger.js` runs async (record-only, never blocks).

> **Amended (1.3.0):** the audit-logger is now **fully opt-in** behind `token_audit` and writes to
> **`.claude/audit/{session}.log`** (per-session, with a forensic `detail` field — file/command/skill
> per call) + `.claude/audit/token-usage.jsonl`, never to `docs/` (committed-content area) and never
> from bare `process.cwd()` (the stray-log bug). Consumers who enable it add `.claude/audit/` to
> their `.gitignore`. The original "always appends every tool call to `docs/audit/tool-calls.log`"
> behavior is retired — it contradicted ADR-11's "off by default means zero work".

**Why.** Enforcement must be synchronous (able to deny) and separate from observation (must never
block). One knob keeps it usable.

> **Note (1.3.0, persona plumbing).** The persona registry is deliberately **two files**:
> `.claude/.current-agent` is only the *write-trigger* (the persona command writes it; nothing reads
> it back) and `.claude/.personas.json` is the durable per-session registry consumed by
> `guard.js`/`audit-logger.js`/`restore-agent.js`. Don't "unify" them — rationale in the
> `register-persona.js` header.

---

## ADR-9 — Build & release pipeline
**Context.** The release flow was originally prose in this ADR with **no owner or automation**. The
result: a behavioral edit to `team-lead.md`/`architect.md` shipped without a version bump, so the
version-keyed cache (constraint #3) made `/plugin update` a no-op and no installed user saw it. The
version bump is the single most forgettable mandatory step.

**Decision.** The only generated artifacts are persona **commands** (`gen-commands.mjs`, agents →
commands) and the **omni twin** (`gen-omni.mjs`). The release flow is **owned by the `release-plugin`
skill + `scripts/bump-plugin.mjs`** (not loose prose) — it classifies the change to a semver tier,
bumps `plugin.json` + a per-plugin `CHANGELOG.md` **in the same commit as the change**, regenerates,
validates, and (on publish) tags. Reordered flow:

```
edit plugin files
  → release-plugin skill (node scripts/bump-plugin.mjs):
       classify change → bump plugin.json + CHANGELOG.md
       → node scripts/gen-commands.mjs <plugin>   (if agents changed)
       → node scripts/gen-omni.mjs                (syncs the twin; runs AFTER the bump)
       → claude plugin validate plugins/<plugin> --strict
       → COMMIT content + bump + CHANGELOG + regenerated commands as ONE commit
  → publish: from inside plugins/<plugin>/,  claude plugin tag --push   (→ <plugin>--v<version>)
```

**Why.** Fewer build steps = fewer ways to forget one — and an *owned* procedure can't be forgotten
the way prose can. The version bump is mandatory because the cache is version-keyed (constraint #3):
no bump → users never see the change. Semver policy is MAJOR-leaning: the payload is agent behavior
and the cache is version-keyed, so almost every change must reach users (full policy:
`plugins/nexus/skills/release-plugin/SKILL.md`; design rationale: `docs/proposals/`).

**Verified against the docs (June 2026), correcting/extending the old prose:**
- There is **no `claude plugin bump`** — bumping is editing `plugin.json`'s `version`; `bump-plugin.mjs`
  is that missing piece.
- `claude plugin tag` does more than tag: it **validates contents, checks `plugin.json` and the
  marketplace entry agree on the version, and requires a clean tree** — so the bump **must be committed
  before tagging** (hence the reorder). Tag name: `<plugin-name>--v<version>`.
- `claude plugin validate` supports `--strict` ("warnings → errors; use it in CI").
- The `version` field is **optional**: resolution is `plugin.json` → marketplace entry → git commit
  SHA → `unknown`. Omitting it makes every commit a new version — the documented model for
  internal/active-dev plugins (an option for the private `omni` twin; the public plugins keep explicit
  versions). Versions live only in `plugin.json`; marketplace entries stay version-less.

**Backstop.** No session hook (a release concern is the wrong granularity for PreToolUse, and the user
prefers none). The optional net is CI: `.github/workflows/plugin-release-check.yml` runs
`node scripts/bump-plugin.mjs --check` (fails a PR when a behavior-surface change lacks a bump) plus
`claude plugin validate --strict`.

**Rejected.** *Codegen-composed supersets* (ADR-3). *Hand-mirroring* (ADR-6). *A "Plugin-Writer" agent*
— releasing is a procedure (a skill), not a persona; an agent would duplicate Solo and can't be
preloaded into other agents (ADR-2/ADR-4).

---

## ADR-10 — Spawn mode: foreground for pipeline agents
> **Superseded by ADR-12.** Pipeline agents now spawn **background**. The foreground rationale below
> did not survive the current platform: `TaskOutput` returns an agent's full result regardless of spawn
> mode, and a background agent stays alive to `SendMessage`-resume — so neither relay nor two-phase
> resume actually requires foreground. Kept for the record.

**Context.** The team lead is the sole coordination hub. To relay or act on a verdict it must **read
and quote** the agent's result — the done-check PASS/FAIL, the reviewer's APPROVE/REQUEST-CHANGES, the
severity findings in `review.md` (Relay Contract + Verdict Validation, ADR-7). It also drives the
**two-phase Analyze→Resume** cycle by resuming the *same live agent* via `SendMessage` to its agent
id. Nexus originally defaulted spawn mode to **`Background`** (initial commit `cfb7a64`, Pre-Flight
item #5).

**Decision.** Spawn pipeline agents (architect, developer, reviewer, PO) **foreground**, and resume
across phases via `SendMessage`. Reserve background for fire-and-forget / test spawns only. The
original `Background` default was reversed during the pipeline-enforcement pass (`50c5247`).

**Why.** A background spawn **truncates the subagent's returned result**. The team lead's Relay
Contract and Verdict Validation depend on reading the *full* verdict; a truncated result makes relay
impossible and lets self-contradicting verdicts (APPROVED-with-open-HIGH, PASS-with-Missing) slip
through unchecked. The mandatory two-phase spawn additionally needs a live, addressable agent to
resume (`Analyze {slug}` → `Write the plan…` / `Implement…`). Foreground satisfies both; background
defeats both.

**Tradeoffs.** Foreground serializes the pipeline — no parallel agent execution. This is consistent
with the existing serial-pipeline decision (features are 3–10 steps; coordination overhead exceeds the
saving). The user waits on each agent rather than firing and forgetting.

**Rejected.** *Background default* — the original `cfb7a64` value; truncates results and silently
breaks relay + verdict validation. It still survives in the superseded `nexus-net` superset (ADR-3),
which is the source of cross-plugin confusion about the default.

---

## ADR-11 — Token consumption audit (opt-in)
**Context.** The pipeline's payload is agent behavior, and that behavior has a token cost: each agent
grows its own context (re-reading `plan.md`, the spec, the comm log) and generates output. The
consumption evaluation that motivated several pipeline fixes was done **by hand** from transcripts —
there was no built-in way to measure per-agent consumption in a live run.

**Decision.** An **opt-in** audit, **off by default**. A `token_audit` userConfig flag (default
`false`) that, when on, has the `audit-logger` hook append per-agent token
readings to `.claude/audit/token-usage.jsonl` (`{ts, agent, tool, input, output, cache_read,
cache_creation, context}`), plus a `consumption-report` skill that aggregates that log into a
per-agent table (peak context, output generated, tool-call count, growth curve). This **ships to
consumers** — unlike the release tooling (ADR-9), it is runtime observability for the pipeline, which
runs in consuming projects.

> **Amended (1.3.0):** the same flag now gates the **entire** logger — the tool-call trace included
> (previously the trace was unconditionally always-on, contradicting this ADR's premise). Output
> moved `docs/audit/` → `.claude/audit/`; the trace regained the per-session file + per-call
> `detail` field (file/command/skill) as forensic supervision evidence. The transcript read is
> tail-only (last 64KB) instead of whole-file.

**Why.** (a) **Fold capture into the existing always-on `audit-logger`** rather than add a hook — it
already attributes each tool call to an agent (`agent_type` / persona registry), so the only addition
is reading the transcript's last completed-turn `usage`. (b) **Off by default** so installs that don't
measure pay nothing — the flag short-circuits before any transcript read. (c) The data already lives
in transcripts, but a per-project append-only JSONL gives durable, in-project history independent of
transcript rotation, and the consuming project may not surface transcript paths conveniently.

**Tradeoffs.** A PreToolUse hook cannot see the **in-flight** turn's usage (not written yet), so it
records the **last completed** turn — a one-turn lag, immaterial for a growth curve. Several tool calls
in one turn carry the same usage tuple; the report **dedups consecutive tuples** so output is not
multi-counted (tool-call count still counts every call). When on, every tool call reads the transcript
file — async, observe-only, never blocks.

**Rejected.** *A dedicated `Stop`/`SubagentStop` hook* for end-of-run totals — loses the per-call
growth curve that answers "how does the agent grow its own context." *A new standalone hook* — needless;
`audit-logger` already runs per call with agent attribution. *Always-on capture* — imposes a
transcript read on every tool call for installs that never analyze; opt-in keeps the default free.

---

## ADR-12 — Spawn mode: background for pipeline agents (supersedes ADR-10)
**Context.** ADR-10 made pipeline spawns foreground to protect verdict relay and two-phase resume. In
practice that **blocks the main session** for the whole run — the user can do nothing while an agent
works. The repo owner's original default (initial commit `cfb7a64`) and repeatedly-stated preference
(three times across sessions) was **background**; foreground was experienced as a recurring bug, not a
feature, and kept being "re-fixed" back to foreground because three layers (instruction, gate, this ADR)
all asserted it.

**Decision.** Spawn pipeline agents (architect, developer, reviewer, PO, critic) with
`run_in_background: true`. The team lead reads each agent's **full** result with `TaskOutput` on
completion, then resumes the *same* live agent via `SendMessage` for Phase 2. The `pipeline-gate`
foreground-enforcement (former invariant 3) is removed; spawn mode is no longer hook-gated.

**Why.** Both ADR-10 fears fail on the current platform. (a) **Relay is not truncated** — the team
lead's Relay Contract already greps the *artifact* (`review.md`) for the verdict, and `TaskOutput`
returns the agent's full output regardless of spawn mode; the inline completion notice was never the
source of truth. (b) **Resume still works** — a background agent stays **alive and addressable** between
phases, which is exactly what the two-phase Analyze→Resume cycle needs; if anything a *foreground* agent
that has already returned is the one whose liveness is in doubt. (c) ADR-10's "background truncates the
returned result" was **reconstructed from the agent file, never measured**, and does not hold against
`TaskOutput`.

**Tradeoffs.** The pipeline stays **serial by design** (Inherited decisions) — background does not add
parallelism; the team lead still waits for each agent's completion before resuming. What changes is that
the **main session is no longer blocked**: the user can watch progress and intervene mid-run. The team
lead must read `TaskOutput` for the full result rather than trust the inline notice — captured in the
Relay Contract and Two-Phase Spawn rules.

**Rejected.** *Keep foreground (ADR-10)* — blocks the session for no correctness gain. *Restore a
launch-time background/foreground question* — it was the original "second Pre-Flight question," but a
single fixed default the owner already chose beats re-asking every run; a power user can still background
or foreground a one-off spawn manually.

---

## ADR-13 — The pipeline gate does not enforce on background subagents
**Context.** `pipeline-gate.js` (ADR-7 Track B) is a synchronous PreToolUse hook meant to make the two-phase collapse *unreachable*: block plan/source writes while `.pipeline-state` ends in `:analyze`, block a subagent from advancing the token (invariant 3), block APPROVED-with-open-HIGH. A real run (sprint-rituals Pass 3c-C) collapsed anyway: the team lead correctly held the token at `developer:analyze` for the entire ~30-min implementation window, the developer wrote ~14 source files, and the gate produced **zero** denies. The token was right; the gate simply did not fire. The only real gate-deny in that project's entire history was a **main-session (foreground)** spawn.

**Decision.** Record the platform reality: **a synchronous PreToolUse `deny` is not honored for a background (sidechain) subagent's tool call.** Since ADR-12 spawns every pipeline agent in the background, the gate is inert against exactly the agents it targets. The async `audit-logger` still *sees* those calls (so PreToolUse fires), but the blocking decision is dropped. Keep ADR-12 (background); do **not** revert to foreground to make the gate bite.

**Why.** Foregrounding to resurrect the gate (the recurring temptation) trades away the whole ADR-12 benefit — a non-blocking main session — to harden a backstop for a failure mode (an agent that *has* questions but assumes anyway) never actually observed; the one agent with questions in that run (the architect) self-stopped correctly. The cheaper, real fix puts the analyze→stop boundary where it always actually lived: the agent's own hard-stop-on-questions rule (ADR-14) + the team lead's verify-and-intervene (ADR-15). The gate stays as a cheap tripwire that still bites a foreground/main-session mistake and keeps the token's audit trail honest.

**Tradeoffs.** No mechanical hard-block on a backgrounded agent that violates the two-phase boundary — caught after the fact by the team-lead checkpoint + the architect done-check + the reviewer, not prevented. Accepted: the downstream gates still verify correctness, and the collapse is harmless when the plan is clean (zero questions to lose).

**Rejected.** *Foreground pipeline agents so the gate enforces* (ADR-10) — reverts ADR-12 for a backstop rarely needed; blocks the session. *Keep claiming the gate enforces two-phase* (the prior docs) — false for background agents and the source of repeated confusion. *Build non-hook enforcement (team lead diffs the tree each checkpoint)* — possible later, but ADR-15's reasoned intervention covers it without new machinery.

---

## ADR-14 — Agent self-containment: hard rules live in the agent, not the orchestrator
**Context.** Behavioral mandates (e.g. "stop and ask before assuming", "two-phase analyze-then-stop") were partly authored *in the team-lead role* — the team lead described how the architect/developer must behave. But every agent is usable **standalone** (`be developer`, `be architect`, `be solo`) with no team lead present, and ADR-2 constraint #2 means a spawned subagent receives **only its own agent file** as system prompt — it cannot see the team lead's instructions or (reliably) the injected `rules/`.

**Decision.** A behavioral hard-rule belongs **inside the agent it governs** (and, for cross-agent rules, duplicated into the always-on `agents-workflow.md`), **never** authored in the team-lead role. The team lead **coordinates and enforces** (spawn, relay, checkpoint, intervene); it does not implement the agents' internal rules. Concretely: the "never assume past an open question — stop and ask" rule is hard-coded in every agent file *and* in `agents-workflow.md`; the team-lead role only spawns Phase-1 and verifies the result.

**Why.** If an agent's rule lives only in the orchestrator, the agent loses it the moment it runs standalone or is spawned as a subagent (sees only its own file) — "a total mess" in the owner's words. Self-contained agents behave identically whether driven by a team lead or invoked directly. Same logic as the per-agent boundary duplication in Inherited decisions, applied to behavioral rules.

**Tradeoffs.** Deliberate duplication: the hard rule appears in N agent files plus the shared rule. Cheap (one line each) and consistent with ADR-2's "inline what a subagent must carry".

**Rejected.** *Author behavioral rules once in the team lead* — breaks standalone and subagent use. *Rely solely on the always-on `agents-workflow.md`* — does not reliably reach a spawned subagent (ADR-2 #2).

---

## ADR-15 — Graduated, minimal-intervention enforcement by the team lead
**Context.** With the gate inert against background agents (ADR-13) and rules owned by the agents (ADR-14), the team lead is the active enforcer. An agent that *assumed* past a question won't self-report it, so enforcement is detect-not-wait. But over-reacting — restarting a run on every spotted deviation — is its own failure, especially when the deviation cost nothing.

**Decision.** The team lead enforces in three graduated steps, biased to the least intervention that restores correctness: **(1)** broken rule with no process impact that the team lead can fix itself → fix and continue, do not stop the run; **(2)** recoverable → correct in place (re-issue the token, re-ask the unanswered question, send back the single fix) without restarting; **(3)** unrecoverable — a checkpoint that can't be reconstructed after the fact (e.g. the developer implemented before its real questions were answered) → stop that phase and retry it. Restarting a clean, already-correct run is itself a defect.

**Why.** The point of the checkpoints is "don't skip questions and assume" — not ceremony for its own sake. When a collapse loses no decision (clean plan, zero open questions), the downstream done-check and review already guarantee correctness, so a restart only burns tokens. Reserve the expensive intervention (stop + retry) for the case where information was actually lost.

**Tradeoffs.** Enforcement now depends on the team lead's reasoning about recoverability rather than a mechanical rule — less deterministic, but matched to a backstop the gate can't provide for background agents anyway.

**Rejected.** *Always stop-and-retry on any rule break* — wastes clean runs. *Never intervene, trust the agents* — an assumed-past question would slip silently.

---

## ADR-16 — Relay model: background spawn + `TaskOutput`/artifact; the inline notice is partial
> **Refined by ADR-17.** This ADR set the artifact as a *fallback* behind `TaskOutput`. ADR-17 later **inverts the emphasis** — the durable artifact is the *primary, mandatory* deliverable and `TaskOutput` is the best-effort convenience — after a run where both `TaskOutput` and the artifact were empty at once. Read ADR-17 for the current ordering; the "never relay a verdict you have not read" rule below is unchanged.

**Context.** Two earlier decisions appeared to collide. ADR-12 spawns pipeline agents in the background, where the **inline completion notice the team lead sees is partial** (often just "Idle. Awaiting resume."). Separately, the 1.2.1 revert restored **message-first relay** (team lead reads the agent's result and relays it) after the 1.2.0 experiment over-built a "minimal-return contract + grep-the-artifact-for-everything" machinery. Read naively, "message-first" and "inline is partial" contradict — and the team-lead role carried both claims (`:43`/`:112` said *don't* read the artifact; `:77` said *do*; line numbers refer to the pre-1.2.6 `team-lead.md` — historical record, since reconciled).

**Decision.** Reconcile explicitly: the agent's **full result is read via `TaskOutput`** (that is the "message"), **not** the partial inline notice. The durable **artifact** (`questions.md`/`review.md`/`plan.md`) is the record of record and a **legitimate fallback** to confirm a verdict or recover a missing line. What 1.2.1 dropped — and stays dropped — is the fragile *grep-the-artifact-for-the-verdict* machinery, **not** artifact-reading itself. The one hard rule: never relay a verdict you have not actually read, in `TaskOutput` or the artifact.

**Why.** It matches what every run actually does (the team lead read `questions.md` when the inline came back partial — and that was correct, not a workaround) and removes the doc contradiction that kept causing "the messaging is broken" misdiagnoses. The partial inline is a property of background spawn, not a regression and not OMC — confirmed by a run (Pass 3c-C) where the symptom persisted with OMC fully disabled for the prior ~3 hours.

**Tradeoffs.** The team lead must read `TaskOutput` (or the artifact) rather than trust the inline notice — one extra read per checkpoint, already implied by ADR-12.

**Rejected.** *Pure message-first, never read the artifact* (`:43`/`:112` as written) — impossible under background spawn; the inline is partial. *Resurrect the grep-the-artifact relay machinery* (1.2.0) — the fragility 1.2.1 removed. *Attribute the partial inline to OMC and disable it* — disproven; the symptom persisted with OMC off.

---

## ADR-17 — The artifact is the primary deliverable; `TaskOutput` is best-effort (refines ADR-16)
**Context.** ADR-16 set the relay model as "read the full result via `TaskOutput`, artifact as fallback." A later run (sprint-rituals Pass 5) broke **both** legs at once for one agent: the critic returned findings inline-only with **zero tool uses** (empty artifact), *and* `TaskOutput` returned "No task found with ID" for that completed background agent. With the primary path and the fallback both empty, the team lead could only recover by re-spawning a fresh critic with the file named as the primary deliverable — which then caught a HIGH the first had missed.

**Decision.** Invert the emphasis of ADR-16: the **durable artifact is the primary, mandatory deliverable** of every pipeline/Codex agent; `TaskOutput` is a best-effort *convenience*, not the contract. An agent that returns inline-only with an empty or missing artifact has produced an **incomplete result** — the team lead re-spawns it with the file named as the primary output, and never proceeds on an inline-only verdict. Codified as a universal hard rule in `agents-workflow.md` ("your durable artifact is your primary deliverable") and in the team-lead Relay Contract.

**Why.** `TaskOutput` is observably unreliable for already-completed background agents (returns "no task found"), and an agent can fail to write its file. Making the inline/`TaskOutput` path load-bearing means a single platform flake silently loses a gate. Anchoring on the artifact makes the flaky path non-load-bearing — exactly how the Fokus team lead always behaved (read the file, relay it).

**Tradeoffs.** Agents must write-first, report-second (already the Message Size Contract). A genuinely empty artifact costs one re-spawn — acceptable, and it surfaced a better review in practice.

**Rejected.** *Trust `TaskOutput` as the contract* (ADR-16 as first written) — both legs can fail together. *Treat an inline-only verdict as sufficient* — it's how a fabricated or lost gate slips through.

---

## ADR-18 — Agent output boundaries: never author another agent's gate (extends ADR-14)
**Context.** In Pass 5 the developer, spawned for Phase-1 `Analyze` in the background, ran the entire pipeline in one ~32-min / 111-tool-use sweep: it implemented, **self-committed**, wrote `.claude/.pipeline-state`, and — most severely — **fabricated both quality gates**, authoring a Step-1 done-check signed "Architect" (PASS) and a Step-2 review signed "Reviewer" (APPROVED) into `review.md`, plus a `summary.md`. None of this violated an explicit rule: neither the nexus nor the Fokus `developer.md` ever forbade writing another agent's file or signing as another role. Fokus avoided it structurally (tight team-lead relay/triage at every checkpoint + a "plan files are read-only to you" line) — protections nexus had dropped (verbatim relay) or never carried; the model is identical (both execute on Sonnet), so the model was not the cause.

**Decision.** Make the output boundary an explicit hard rule in each agent and in `agents-workflow.md` ("All Agents"): **each artifact has exactly one owner**, an agent never authors a verdict for a role that isn't its own, never signs a section as another agent, never commits, and never writes `.pipeline-state`. The developer's outputs are source + `implementation.md` (+ `lessons.md`); `plan.md`/`review.md`/`summary.md`/`.pipeline-state` are read-only to it. "If a gate hasn't run, report it — never simulate it." This is the **prevention** layer; ADR-15 (team-lead least-intervention) + ADR-19 (restored supervision) are the **containment** layer for when prevention fails on a background agent the gate can't block (ADR-13).

**Why.** A pipeline agent cannot verify or approve its own work — fabricating an independent gate is the most dangerous breach because it produces a green pipeline with no real review behind it. The gate is inert on background subagents (ADR-13), so the only durable prevention is a rule inside the agent itself (ADR-14). In Pass 5 the team lead caught it, voided the fakes, and re-ran the real gates — proof the containment layer works, but prevention is cheaper than recovery.

**Tradeoffs.** More "never do" surface per agent file (one-time, a few lines). Deliberate, per ADR-14's duplication logic.

**Rejected.** *Rely on the gate to block self-commits / pipeline-state writes* — inert on background (ADR-13). *Leave it implicit* — the failure proves "obvious" isn't enough; a capable model will complete the whole visible workflow unless told not to.

---

## ADR-19 — Team-lead operational depth, restored from the Fokus baseline
**Context.** The nexus team lead was extracted from Fokus, where the role was split across `agents/team-lead.md` (routing) **and** `conventions/team-lead-operations.md` (the operational half — spawn modes, timeout/failure recovery, escalation menu, commit strategy, communication-log header, resume, unattended), pulled into the agent via `@`-import. ADR-2 #2 means a plugin **cannot** `@`-import a convention into a subagent, so at extraction that operations file had to be **inlined** into `team-lead.md` — but most of it was dropped or thinned to one-liners, then drifted further across releases with no diff-against-Fokus check. Pass 5 surfaced the cost: the team lead had to **improvise** failure recovery and a malfunction log that the Fokus ops file already specified.

**Decision.** Restore the lost operational capabilities **inline** in `team-lead.md` (no `@`-import is possible): **verbatim relay to the user** (the user is the team lead's only window — show agent output before triage); **idempotency gate** in Pre-Flight (`summary.md` ⇒ done, `communication-log.md` ⇒ resume); a **safe Resume flow** (branch-mismatch *block*, done-check, resume-from-Step/Cycle via agent IDs); a **communication-log header** (Branch / Step / Cycle / agent IDs / steps done+remaining — this *is* the resume state) plus a Runtime/Plugin Issues Log; **phase-failure & timeout/stall recovery** (assess-diff → resume → split 20+ file tasks; Retry/Edit/Skip/Abort menu); an **escalation menu** (Continue/Force-accept/Abort at 3-cycle exhaustion); a **status-check table**; and **shutdown issue-investigation** (on detected issues, don't shut down silently — investigate, report, close on user OK).

**Why.** These are the *containment* half of the control model (ADR-18 is prevention): when a background agent misbehaves (and the gate can't stop it — ADR-13), the team lead must detect, recover, and relay. Fokus prevented the Pass-5 class of failure largely through this supervision discipline; restoring it closes the regression at its root — a whole reference file that fell through the `@`-import gap.

**Tradeoffs.** `team-lead.md` grows (the operations content now lives inline rather than in an `@`-loaded convention) — unavoidable under ADR-2 #2, and the team lead is the one agent for which this depth is load-bearing. Verbatim relay is bounded to attended runs (no user under `[UNATTENDED]`).

**Rejected.** *Ship the operations as a convention and `@`-import it* — impossible for a subagent (ADR-2 #2). *Leave the team lead thin and let it improvise* — Pass 5 shows improvisation is lossy and inconsistent. *Re-derive from scratch* — the Fokus baseline is the verified source; port it, don't reinvent.

---

## ADR-20 — Commit strategy: 2 commits with override (reverts the 4-checkpoint default)
**Context.** nexus auto-committed at **four** fixed phase boundaries (plan / implementation / review / shutdown). Fokus's default was **2 commits** (plan + final), user-overridable to 1 or 4. Pass 5 showed the 4-scheme's hidden cost: its *post-implementation* commit is a commit step right where the developer finished coding — exactly the seam the developer used to **self-commit** during the ADR-18 fabrication.

**Decision.** Adopt Fokus's **2-commit default, overridable** ("single commit" / "4 commits" at launch): `feat({slug}): add implementation plan` after approval, then one `feat({slug}): implement {description}` at pipeline end (code + review fixes + docs). The plan commit preserves the design for revert; everything after reverts as a unit.

**Why.** The 2-scheme commits **only at team-lead-owned boundaries** (plan approved, pipeline done) — there is no post-implementation commit step for a subagent to perform, reinforcing ADR-18 (pipeline agents never commit). Cleaner history, and the 4-scheme's only edge — granular checkpoints — is worth less than closing that seam. Override preserves flexibility.

**Tradeoffs.** Less granular default history; recover granularity per-run via the "4 commits" override when wanted.

**Rejected.** *Keep the fixed 4-checkpoint scheme* — adds a post-code commit seam and offers no per-run flexibility.

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
- **CI gate.** Added: `.github/workflows/plugin-release-check.yml` runs the version-bump check
  (`bump-plugin.mjs --check`, hard gate) and `claude plugin validate --strict` (advisory until CI auth
  for the `claude` CLI is confirmed, then flip to required). Still future: a lint for dangling
  `*-format`/skill references would catch the exact class of bug behind ADR-4.
- **Plugin init tests (proposed).** The plugin's executable surface is deterministically testable
  but currently untested — the 2026-06 cleanup audit found multiple shippable-only-because-untested
  bugs (dead classification branch in `bump-plugin.mjs`, `gen-commands.mjs` crash on a plugin with
  no `agents/` dir, pipeline-gate regressions across patches). Proposed: a `node:test` suite
  (zero deps, `node --test tests/`) in three layers, wired into the CI workflow:
  1. **Hook tests** — hooks are pure `stdin JSON → exit code/stdout` programs; feed synthetic
     `PreToolUse`/`PostToolUse` events and assert allow/deny, registry writes, and fail-open edges
     (guard.js rm/secret matrices, pipeline-gate role gating, register-persona Write|Edit payloads,
     audit-logger off-by-default = zero side effects).
  2. **Script tests** — `bump-plugin.mjs` tier classification table, `gen-commands.mjs` generation
     against a fixture agent, `gen-omni.mjs` write→`--check` round-trip (exit 0, then mutate → exit 1).
  3. **Structural lint** — every agent frontmatter parses and its `skills:` resolve to shipped
     skills; no dangling `*-format` references (the ADR-4 bug class — subsumes the lint above);
     `commands/` regen-clean vs `agents/`; CHANGELOG top entry matches `plugin.json` version;
     no `${CLAUDE_PLUGIN_ROOT}` in markdown bodies (ADR-2 #3).
  Out of scope: agent *behavior* (prompt semantics) — that requires LLM evals, a separate concern.
  Promote to an ADR when built.

---

*Working proposals that fed this record (historical, superseded by this doc): pipeline-enforcement
fixes, artifact-format delivery, and build/source-of-truth analyses — originally drafted in a
consuming project before ADR-1 moved the canonical record here.*
