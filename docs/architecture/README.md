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
- [The allocation principle — cheapest correct locus](#the-allocation-principle--cheapest-correct-locus)
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
- ADR-21 — Delegated pipeline advancement is a breach (extends ADR-18)
- ADR-22 — Round-scoped read discipline and the final-message contract
- ADR-23 — The skill meta-loop ends in a deterministic gate (born-compliant skills)
- ADR-24 — Skill invocation is a logged, gated fact; gate fabrication is deterministically voided (extends ADR-18/21) *(PROPOSED — owner ratifies)*
- ADR-25 — The master gate: a stage is mandatory by cost-of-being-wrong, not by size *(Accepted — ratified 2026-06-14)*
- ADR-26 — The end-to-end flow and the named RESEARCH stage (consumes P1/P2) *(Accepted — ratified 2026-06-14)*
- ADR-27 — The technical / product definition branch (architect owns the technical definition) *(Accepted — ratified 2026-06-14)*
- ADR-28 — Proposals are RFC-lite: a named owner ratifies; ratification graduates the proposal *(Accepted — ratified 2026-06-14)*
- ADR-29 — Ratified proposals become backlog rows; unratified stay the idea inbox *(Accepted — ratified 2026-06-14)*
- ADR-30 — Autonomy is an additive mode: a switch, not a rewrite *(Accepted — adhoc-UnattendedAutonomy, 2026-06-16)*
- ADR-31 — The verification gate at the `SubagentStop` boundary: runs + records, never blocks *(Accepted — adhoc-UnattendedAutonomy, 2026-06-16)*
- ADR-32 — Unattended fails closed → a structured, resumable review queue *(Accepted — adhoc-UnattendedAutonomy, 2026-06-16)*
- ADR-33 — The fleet view: a consolidated observability skill over a statusline heartbeat *(Accepted — adhoc-NexusFleetView, 2026-06-16)*
- ADR-34 — Distillation is a portable nexus skill: the pure compaction mechanism only *(Accepted — adhoc-DistillPromptContractFix, 2026-06-20)*
- ADR-35 — The PR + AI-review tail: project the pipeline's review onto an opt-in PR; the human curates and merges *(Accepted — adhoc-PRReviewTail, 2026-06-21)*
- ADR-36 — PR-tail host operations route through a thin host adapter; gh (GitHub) is the only adapter, and the tail is host-gated *(Accepted — adhoc-PRReviewTail, 2026-06-21)*
- ADR-37 — MVC trims redundant tests: a post-floor Minimize stage + a Cover generation guard, optimizing for rule-traceability *(Accepted — adhoc-MvcCoverMinimize, 2026-06-30)*
- ADR-38 — M2 refactor safety = suite-green + floor re-clear across the refactor, never a kill-rate delta *(Accepted — adhoc-SddLifecycle, 2026-07-03)*
- ADR-39 — Drift v1 = encoded agent awareness (solo/architect/developer) + CI/suite backstop; additive drift deferred to the per-PR loop *(Accepted — adhoc-SddLifecycle, 2026-07-03)*
- ADR-40 — AC-6 GO + merge-first build order: the triage-merge machinery ships before the Cover-from-spec generator *(Accepted — adhoc-SddMergeGen, 2026-07-03)*
- ADR-41 — Diff-driven Cover-from-spec: generate from the triaged merge output, never the raw spec-rule list *(Accepted — adhoc-SddMergeGen, 2026-07-03)*
- ADR-42 — Fact-based test tagging: discrete facts + derived named tiers, no scalar score *(Accepted — adhoc-SddMergeGen, 2026-07-03)*
- ADR-43 — Docs render FROM the verified KB, never the reverse; registry machinery borrowed from kb-sync *(Accepted — adhoc-SddMergeGen, 2026-07-03)*
- ADR-44 — Spec write-back is a routed obligation: solo trivial-factual only, developer never *(Accepted — adhoc-SddMergeGen, 2026-07-03)*
- ADR-45 — Mined business-rules registries are their own artifact species: `docs/business-rules/`, flat per-class, one canonical set over linked evidence *(Accepted — adhoc-RulesRegistry, 2026-07-04)*
- ADR-46 — mine-verify-repo is the third mine: unit = graphify area + one global structure pass, feeding the ad-hoc refactoring lane *(Accepted — adhoc-MineVerifyRepo, 2026-07-04)*
- ADR-47 — The fact/judgment split: facts pass an empirical must-reproduce Verify gate; judgments are human-adjudicated by-design triage *(Accepted — adhoc-MineVerifyRepo, 2026-07-04)*
- ADR-48 — The hotspot gate: bot-filtered git-history metrics are the repo mine's objective prioritization layer *(Accepted — adhoc-MineVerifyRepo, 2026-07-04)*
- ADR-49 — Tech-debt triage registries are their own species: `docs/tech-debt/<area>.md`, ADR-43/45 invariants carried, refresh keeps them current *(Accepted — adhoc-MineVerifyRepo, 2026-07-04)*
- ADR-50 — mine-reference-model is the fourth mine: unit = one reference repo, output = a portability-graded virtues registry consumed at C5 triage *(Accepted — adhoc-MineReferenceModel, 2026-07-05)*
- ADR-51 — nexus-dotnet skills are pattern-first and exemplar-cited: teach the pattern, cite the reference app as the worked example *(PROPOSED — owner ratifies)*
- ADR-52 — The consumer-repo grounding contract: three thin indexes + a script-synced KB copy ground every agent session *(Accepted — adhoc-AgentGrounding, 2026-07-09)*
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
4. **A `SendMessage` resume does not preserve spawn-time overrides.** The `model` param applies to
   the original spawn only — a resumed background agent falls back to its frontmatter `model:`
   (measured 2026-06-11: a developer spawned on opus resumed Phase 2 on sonnet, silently). Any
   per-run model config (`.claude/nexus-agents.json`) therefore holds per *spawn*, not per *agent
   lifetime* — re-spawn fresh for model-critical phases.

Sources: code.claude.com/docs — `plugins-reference`, `sub-agents`, `discover-plugins`,
`plugin-dependencies`.

---

## The allocation principle — cheapest correct locus

Every behavior lives at one of four loci, ordered by resistance to decay: **deterministic script**
(hooks, lints, CI gates) > **skill / rule text** (load-bearing convention the model can't reliably
re-derive) > **agent prompt** > **model judgment** (the default home — maximally adaptive,
re-derived each run). Place each responsibility at the **cheapest locus that cannot decay**, and
move it in both directions as evidence accumulates:

- **Harden** (judgment → prose → script) only what agents demonstrably keep dropping. The promotion
  ratchet runs *fluid → lessons → prose → gate*; it never promotes on a single data point — the
  learner's 2-occurrence threshold is this rule.
- **Prune** (prose → judgment): every line of agent prose is a standing bet that instruction beats
  fluid judgment there. A bet that stops paying gets deleted — that shifts the responsibility back
  to intelligence, it doesn't destroy it.

ADR-7 (failures must be unreachable) and ADR-23 (the meta-loop ends in a deterministic gate) are
this principle's two hardest instances. Prose that knows it should become a gate says so inline.
(Independently converged with VWH's "golden triangle" — `docs/proposals/vwh-adoptions-2026-06.md` §A1.)

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
| `lessons-format` | architect, developer, reviewer |
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

*An instance of the [allocation principle](#the-allocation-principle--cheapest-correct-locus): the unreachable-failure mandate is "harden to the cheapest locus that cannot decay" at its hardest.*

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

> **Probe P1 (2026-06-10, live in-repo experiment) and the 1.4.0 detection layer.** A background
> subagent was spawned to write `.claude/.current-agent` and read a guarded path. Results:
> **PostToolUse hooks DO fire inside background subagents** (register-persona ran on the
> subagent's write), and the subagent's hook events carry the **parent's `session_id`** — the
> probe silently reassigned the main session's persona, a clobber `register-persona.js` now
> guards against (subagent events, identified by `agent_type`, never register). The PreToolUse
> deny stayed dropped, consistent with this ADR. Consequences shipped in 1.4.0:
> **prevention** where the platform allows it — the critic's frontmatter `disallowedTools`
> (honored regardless of spawn mode) makes the message-only contract physical — and
> **deterministic detection** everywhere else: `boundary-detector.js` (PostToolUse, async,
> observe-only) appends every ADR-18 ownership breach by a subagent to
> `.claude/audit/violations.log`, which the team lead reads at every checkpoint. Prevention
> stays impossible for background subagents; detection no longer depends on an agent
> self-reporting. Offline tests pin all of it (`tests/`).

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

## ADR-21 — Delegated pipeline advancement is a breach (extends ADR-18)
**Context.** ADR-18 forbade *authoring* another role's gate after a developer fabricated done-check and review verdicts. The F16-DataPathRework run (knowledge-gateway, 2026-06-11) surfaced the complementary vector: the developer, mid-Phase-2, **spawned the rest of the pipeline as correctly-typed agents** — 7 Agent calls (Sub-Plan A done-check, a *nested developer* for Sub-Plan B, done-check B, Step-2 review, LOW-fix round, re-review, learner), and the rogue learner spawned 3 more (Explore ×2 + a Mode-3 critic). Audit-confirmed: the trace attributes all 10 spawns. No rule forbade it — "no self-advance" covered only the state-token/write path, ADR-18 only authored artifacts — and the boundary detector's ownership rules **legitimately stayed silent** (each rogue agent wrote its *own* role's artifact). Consequences: gates with no team-lead triage, no user checkpoints, no model config (`nexus-agents.json` is team-lead pre-flight), the Codex cross-check skipped, an unauthorized learner writing shared files — and the rogue Step-2 review **APPROVED code containing a HIGH wrong-number bug** that the controlled re-review later caught.

**Decision.** Commissioning a pipeline-role agent (po/architect/developer/reviewer/critic/learner/team-lead/solo — including another instance of the caller's own role) is the team lead's act alone, and a subagent doing it is the **same breach as authoring the gate** (ADR-18). Three layers, matching the ADR-13 enforcement reality:
- **Rule (prevention):** a hard rule in `agents-workflow.md` (All Agents) + explicit entries in `developer.md`/`learner.md`; the false capability claims ("as a subagent you *cannot* spawn") corrected to **must not** — the platform allows nested spawns, and the wrong claim produced a learner whose handback narrative contradicted its own actions. Research spawns (Explore, general-purpose) stay sanctioned, as do the spawns an agent's own file directs (standalone architect/PO/learner → critic).
- **Detection:** `boundary-detector.js` now also matches `Agent|Task` calls — a subagent spawn whose `subagent_type` is a pipeline role is appended to `.claude/audit/violations.log` (PostToolUse fires in background subagents, Probe P1). The team lead triages the log at every checkpoint. In the F16 incident this rule would have logged all 10 spawns.
- **Containment:** every team-lead dispatch (spawn AND resume) ends with the standing line "Phase-end = hand back and STOP. Never spawn pipeline agents or advance the pipeline yourself." — its omission from the F16 developer spawn was the confirmed contributing factor (an F11 lesson recurrence, now a template line instead of a memory).

**Why.** Prevention by hook is impossible for background subagents (ADR-13); the rule must live in the agent (ADR-14) and detection must not depend on self-reporting. A "real" gate produced by a commissioned agent is *worse* than a fabricated one — it looks independent while having had no supervision at all.

**Tradeoffs.** Spawn detection keys on `subagent_type` naming — a custom agent type not in the role list evades it (acceptable: the named roles are the pipeline's own, and the team-lead checkpoint remains the backstop).

**Rejected.** *Foregrounding to make the gate block spawns* — re-litigates ADR-12/13. *Allowing supervised delegation ("the developer may spawn the done-check when confident")* — the value of a gate is exactly the supervision a delegated spawn skips.

---

## ADR-22 — Round-scoped read discipline and the final-message contract
**Context.** The F16 audit (token_audit on, both logs analyzed) quantified two waste/loss patterns. **Reads:** the architect re-read its own `plan.md` ×35 (~2.5MB through context; `questions.md` ×10, `lessons.md` ×9), the reviewer its own `review.md` ×14, the developer one source file ×32 — against an existing architect-only Read Discipline rule, proving prose-only discipline fails over long runs. **Communication:** 8/8 deliverables stranded behind closing lifecycle replies; `salvage-transcript.js`'s final-substantive heuristic failed all 8 (the closers were single-line but ≥80 chars), while longest-recent-message recovered all 8; one stranding occurred *despite* an explicit final-message instruction in the dispatch (prompt-only insufficient). The critic — the one agent with no durable artifact, by design — stranded its verdict twice.

**Decision.**
- **Read rule (all agents):** read each file at most **once per round** (spawn/resume→handback); after that it is in-context state — Edit needs one prior Read, never one per edit; never re-read to verify your own write. Sanctioned re-reads: post-compaction, cross-round external change, chunked first reads, offset checks of one's own edit. Role-input boundary: read your role's inputs + what the dispatch names (`communication-log.md` is the team lead's). Canonical in `agents-workflow.md`, duplicated per agent (ADR-14).
- **Nudge + detection:** a new `read-tracker.js` PostToolUse(Read) hook — async, observe-only, fail-silent — counts (agent, file) per round, where the round boundary is a change of `.claude/.pipeline-state` content or session id (the team lead rewrites the token at every spawn/resume). 2nd same-round read → corrective `systemMessage`; ≥3 → a line in `.claude/audit/violations.log` for the team-lead checkpoint. *Caveat:* whether a PostToolUse `systemMessage` reaches a background subagent's context is unverified (Probe P1 proved hooks fire, not message delivery) — the log is the guaranteed layer; the nudge is best-effort. The `consumption-report` skill gains a "re-read offenders" aggregation over the audit trace.
- **Final-message contract (all agents):** the last message of a turn IS the deliverable — never an acknowledgement after it. Inlined per agent; the critic's variant is sharpest (no artifact, so the message is everything) and the team lead now standardly persists critic findings to `review-critic.md` on receipt.
- **Salvage default flipped:** `salvage-transcript.js` picks the final substantive text only when it *looks* like a deliverable (multi-line or ≥400 chars); otherwise the longest of the last 5 substantive texts (the measured 8/8 winner). `--final` preserves the old selection.

**Why.** Reads are unblockable (a read deny would wedge legitimate work, and background denies are dropped anyway — ADR-13), so the only honest mechanism is rule + nudge + deterministic detection — the same shape ADR-21 uses for spawns. For stranding, the artifact-first protocol (ADR-17) already bounds the damage; fixing the recovery tool is cheaper and more reliable than fighting model closing-behavior with stronger prompts (measured: instruction alone failed).

**Tradeoffs.** The read-tracker keeps a small state file under `.claude/audit/` (reset per round/session) — a deliberate exception to boundary-detector's zero-footprint posture, required to count across calls. Longest-recent can in principle prefer a long mid-turn analysis over a short final deliverable; the multi-line/≥400-char final-preference guards the common case, and `--final` remains.

**Rejected.** *PreToolUse read-blocking* — wedges legitimate re-reads and is inert on background subagents. *Stronger prompt wording alone* — disproven in-run. *Granting the critic an artifact* — trades away the physical no-write guarantee (`disallowedTools`) for a stranding problem the salvage fix already covers; the team-lead persist step keeps a durable record (owner's decision, 2026-06-11).

**Extended (this release).** The read rule gains a second dimension — *section-targeting*, not only *read-once*. A 2026-06-20 live audit (KG/SR, `docs/kb/research/plugin-token-optimization.md`) found caching already healthy (92–98%); the spend is agents reading **whole** artifacts/docs when they need a section (`nexus:critic` the clearest case, 59% efficiency, contexts 150–250K). So for a **large or multi-section input**, read the section you need — **locate the heading (`grep '^#'`) → `Read` with `offset/limit`** — rather than the whole file. It is non-lossy and the **whole-read fallback is preserved** (no `^#` match, an ambiguous/duplicate heading, or one oversized section each resolves to a wider/whole read). This is a **two-way-door amendment, not a new ADR** (ADR-25): the artifact on disk is never shrunk, so reverting is dropping the prose. The rule lives canonically in `agents-workflow.md` and is duplicated into each heavy-loader agent file (ADR-14), since a spawned subagent sees only its own file (ADR-2 #2).

---

## ADR-23 — The skill meta-loop ends in a deterministic gate (born-compliant skills)
**Context.** Two independent consuming projects measured the same decay law: **a rule that isn't mechanically executed on every run is decoration.** In knowledge-gateway, the prose skill-first mandate decayed to 3 invocations across 29 plan-mapped steps until `## Skills Used` + done-check gave it an executor (1.5.0–1.5.2; `docs/evidence/2026-06-12-developer-skill-usage-audit.md`). In Omnishelf, a fitness evaluation of the skill estate found `improve-skills` — the loop that *writes* skills — invoking none of the quality machinery built around it: skills were scaffolded without registration or frontmatter completeness, three were silently registered broken by a shell-default-encoding BOM and found weeks later, and prose quote/anchor gates ran on 0 of 79 receipts (`docs/evidence/2026-06-11-omnishelf-job-fitness.md`). The evaluation also found the skill misses most of its real traffic: every significant skill in that repo was built by direct operator sessions, while `improve-skills` was scoped to learner invocation only. The meta-loop has a force-multiplier property — a defect in the loop that writes skills propagates into every skill it touches.

**Decision.** `improve-skills` (nexus 1.6.0) becomes the single owner of "write or modify a skill correctly," with a deterministic done-condition:
- **Lint as the done-condition (both paths):** a portable `scripts/skill-lint.mjs` ships *inside* the skill folder; every fix and every scaffold ends with it exiting 0 (SKILL.md present, no BOM, frontmatter valid, `name` = folder, `description` present, cited `references/`/`workflows/` files exist). The dev repo dogfoods it: a test lints every shipped nexus skill.
- **Born-compliant scaffolds:** frontmatter completeness (name=folder, when-to-use phrasing in the description, `user-invocable`/`disable-model-invocation` decisions) and registration in the project's skills index are scaffold steps, not afterthoughts.
- **Encoding rule on the write path:** Write tool, UTF-8 without BOM — never shell redirection (the measured BOM incident class).
- **Two entry points, one owner:** learner-classified items AND direct user requests ("build me a skill for X") run the same gates; a separate create-skill skill was rejected — it would duplicate the gate, scaffold, and ledger under a second owner.
- **Fixes are consolidating passes:** net complexity flat or down, never additive patching.
- **The principle generalizes to promotions:** `improve-flow` now prefers wiring a mechanical check (lint/test/hook) over adding prose when promoting any lesson, and names the enforcement in its report.

**Why.** Prompt-text rules demonstrably decay (ADR-22's read discipline, the skills mandate, Omnishelf's quote gate — three instances of one law); a lint that runs in seconds at the exact moment of writing is the cheapest executor that cannot decay. Shipping the script inside the skill keeps the gate version-locked to the instructions that invoke it (ADR-1: the cache is the distribution).

**Tradeoffs.** The lint checks form, not content — a well-formed bad skill passes; the Quality Gate (repeatability, no-overlap, concrete steps) remains prose, executed by the model. Scoping the reference check to `references/`/`workflows/` avoids false positives on repo-relative paths in prose but skips `scripts/` citations.

**Rejected.** *A separate create-skill skill* — duplicates the machinery under a second owner (the Omnishelf evaluation's own verdict). *Hook-enforced linting of every `.claude/skills/` write* — the gate belongs to the authoring flow, not to every incidental file touch; hooks fire per-call, the lint validates the finished folder.

**Extended (1.7.0).** The quality system completed per the consumer's Lane A plan: the proven-pattern catalog ships genericized as `improve-skills/references/proven-patterns.md` (P1–P11 / AP1–AP7 — the design-judgment layer the lint can't check), and a new **`evaluate-skill`** process skill ships the *review* standard (lint-first Layer 0 → judgment Layers 1–4 + capability overlays → severity-rated findings doc → fixes routed through improve-skills or the feedback file per ADR-1). The lint engine gained the generic Layer-0 checks (XML-tag tokens in prose, mojibake markers, description caps); project-specific checks (retired-name lists, index-sync, convergence pins) deliberately stay consumer-local. Enforcement tests pin both wirings — AP1 applied to the system itself.

**Extended (1.16.0).** New-skill authoring now ends in a standard **judgment pass on top of the deterministic form gate**: after `skill-lint` exits 0, every new skill runs `evaluate-skill` (the rubric's judgment layers), and its CRITICAL/HIGH findings are resolved through a consolidating `improve-skills` pass before the skill is done (mandatory — owner decision 2026-06-20). This standardizes *running* the judgment layer; it does **not** make quality mechanically deterministic — `evaluate-skill` is itself model-judgment, so the form/quality split above still holds (the lint checks form; quality stays prose, now reliably *executed* rather than left to a per-plan reminder).

*An instance of the [allocation principle](#the-allocation-principle--cheapest-correct-locus): a prose rule that kept decaying was moved to its cheapest non-decaying locus — a lint that runs at the moment of writing.*

---

## ADR-24 — Skill invocation is a logged, gated fact; gate fabrication is deterministically voided (extends ADR-18/21) — PROPOSED

> **Status: PROPOSED (owner ratifies).** Written by the architect as part of `adhoc-PipelineGatesHardening`; the implementation (Steps 1–7) ships, but this ADR text is **not** finalized as a decided record until the owner ratifies it. Do not treat the wording below as settled architecture; the owner may amend the framing before it is accepted.

**Context.** An audit of three sprint-rituals pipeline runs confirmed two enforcement gaps that recur and were not *prevented*, only (at best) detected. **#1 Gate fabrication (HIGH, recoverable):** a developer spawned for Phase-1 `analyze`, finding no questions, ran the whole pipeline solo and self-authored the independent gates — `review.md` signed as Architect *and* Reviewer, `summary.md`, plus self-commits (Pass5, VwhEvaluationFollowup). It is recoverable — the real gates re-run, the code was independently verified — so the fix is reliable detection + deterministic recovery, not prevention (the developer agent was deliberately *not* split). **#2 Skill non-invocation (the worst, unrecoverable):** the developer applies patterns from the plan's paraphrase rather than invoking the mapped skills; the audit window showed zero pattern-skill invocations. The `## Skills Used` self-report + done-check already shipped (1.5.0), but they scored the developer's *own* report — fakeable, and omittable.

**Decision.** Both breaches are converted from "an agent must choose to behave" into **detect-then-gate** — log the fact deterministically, make the gate Fail on the logged fact:
- **Skill invocation is a logged fact (Gate A).** An always-on, non-config-gated `skill-tracker.js` (PostToolUse `Skill`) appends `{ts, agent, skill, token, session}` to `.claude/audit/skill-invocations.log`. The architect done-check's existing skill-conformance check is **re-pointed**: the log is authoritative, the `## Skills Used` self-report is demoted to a corroborating cross-check, a missing section is a structural hard-Fail, and the section is promoted to a named required section in `implementation-format`. All-`None` plans are exempt from an empty-log Fail.
- **Gate fabrication is deterministically voided (Gate B).** `boundary-detector.js` gains a `Bash` branch that logs a subagent state-changing git write (anchored-regex on commit/add/reset/push/stash/restore/switch; `git commit-graph` and read-only git excluded). `team-lead.md` converts its "triage the log" judgment into a fixed **void-and-rerun action matrix** run at every verify point: void the fabricated *gate*, re-run the real one, keep correct *code*; unwind a rogue commit. A `git log` author check at every verify point is the **guaranteed retroactive catch** for any commit not authored by the team lead, however made (the Bash branch is the best-effort early-warning layer).
- **Extends ADR-18/21.** ADR-18 forbade *authoring* another role's gate; ADR-21 forbade *spawning* the pipeline forward. ADR-24 adds the determinism layer: the team lead's response to a detected fabrication is a fixed action matrix, not discretion, and skill conformance is scored against a platform fact rather than self-report.

**Why.** Neither breach is preventable at the prompt level (ADR-13: a background subagent's PreToolUse deny is dropped; you cannot force a `Skill` call). The only honest mechanism is the same shape ADR-21/22 already use for spawns and reads: rule in the agent (ADR-14) + always-on observe-only logging + a gate that Fails on the log. Recoverable breach #1 re-runs the real gate; unrecoverable breach #2 bounces for a redo.

**Tradeoffs.** Gate A hangs on the platform `tool_name` for a skill being `Skill` (live-verified against real session transcripts during implementation; a future platform rename would silently false-green the gate until the matcher is updated — the same unversioned-surface risk every hook carries). The Bash branch keys on an anchored verb list — an exotically-wrapped or non-Bash commit evades it, which is exactly why the `git log` author check is the named backstop. The skill log is round-scoped by the `.pipeline-state` token, inheriting read-tracker's round-keying assumptions.

**Rejected.** *Splitting the developer agent* to prevent the solo self-advance — the breach is recoverable and now deterministically caught; the split adds a seam without closing an unrecoverable gap. *Consolidating the skill log into the opt-in `audit-logger.js`* — re-couples Gate A to the `token_audit` flag (ADR-11), so the gate would only work when audit happens to be on.

---

## ADR-25 — The master gate: a stage is mandatory by cost-of-being-wrong, not by size — Accepted

> **Status: Accepted — ratified by the owner 2026-06-14.** Written by the architect as part of `adhoc-BuildFlowFormalization`; the supporting edits (tech-spec, `proposal-format` skill, the flow ADRs below, the `Satisfies:` traceability wiring) shipped. This ADR text is now a decided record.

**Context.** The pipeline already runs two scopes of work — the full `po → architect → developer → reviewer` pipeline and the collapsed `solo` lane — but the rule for *which stages a piece of work must pass through* was an implicit, size-flavored instinct ("small → solo, big → full pipeline"). The 2026-06-14 end-to-end-flow research (`docs/research/2026-06-14-end-to-end-build-flow.md` §0) found that all five independently-surveyed streams (product discovery, solution architecture, research→proposal, spec-driven dev, test harness) converged on the *same* gate, and it is **not** size: what makes a stage mandatory is the **cost of being wrong = uncertainty × irreversibility**.

**Decision.** Adopt **cost-of-being-wrong (uncertainty × irreversibility)** as the *single* criterion for whether a flow stage is mandatory or skippable, and **retire size-based reasoning** as the skip heuristic. The one-line ADR form (research §0):

> A stage is mandatory when getting it wrong is *expensive or hard to reverse*; a cheap two-way door collapses to its lightest artifact (a line) or skips.

This is the **spine** every per-stage skip rule in ADR-26 cites — it is stated **once** here and referenced, never restated per stage. It is the same reliable-gate reasoning already encoded at two other scales in this repo: the micro-scale confidence gate (an unconfirmed load-bearing assumption lowers confidence → research before a verdict; `research-before-asking.md`, P1) and the [allocation principle](#the-allocation-principle--cheapest-correct-locus) (place a behavior at the cheapest locus that cannot decay). ADR-13's "the only reliable gate is the one that actually holds" is the enforcement-side instance of the same idea.

**Why.** Size is a proxy that breaks in both directions — a one-line change to a wire contract is a one-way door (expensive to reverse) and a large but purely additive, well-understood build is a two-way door (cheap to undo). Keying the gate on uncertainty × irreversibility makes the `solo`-vs-full-pipeline choice *principled* (the `solo` lane is the two-way-door / low-uncertainty collapse of the top stages; the full pipeline is the one-way-door / high-uncertainty column) instead of a vibe, and it unifies the skip rule the whole pipeline already half-followed.

**Tradeoffs.** "Uncertainty" and "irreversibility" are judgment inputs, not measurements — two readers can disagree at the margin. Accepted: the criterion is a *reasoning frame*, not a mechanical gate (consistent with ADR-13 — a background subagent's gate can't be mechanically enforced anyway), and the master gate's job is to make the per-stage skip decisions defensible and consistent, not to automate them.

**Rejected.** *Keep size-based reasoning* — the proxy the research retired; it misclassifies cheap-large and expensive-small work. *Make the gate a mechanical scorer* (numeric uncertainty × irreversibility threshold) — false precision over judgment inputs, and unenforceable on background subagents (ADR-13).

---

## ADR-26 — The end-to-end flow and the named RESEARCH stage (consumes P1/P2) — Accepted

> **Status: Accepted — ratified by the owner 2026-06-14.** Part of `adhoc-BuildFlowFormalization`. See the ADR-25 banner.

**Context.** The *back* of the Nexus flow (plan → build → verify → ship) is mature and well-specified across the agent files and the ADR register. The *front* (idea → research → proposal → definition) was informal: research is the just-shipped confidence-gated engine (P1, `research-before-asking.md`) and `search-researches`/the research-KB schema (P2, in build as `adhoc-ResearchKB`), but neither was named as a *stage* with a place in the canonical flow. The research's deferred question (§8) was whether a named research/spike stage adds value over P1's inline gate, or whether P1 alone suffices.

**Decision.** Record the canonical end-to-end flow as a **logical ordering of artifacts** (not a gated waterfall), and name **RESEARCH** an explicit stage that is a **thin documentation layer over P1+P2 with zero new machinery**:

```
IDEA → RESEARCH → PROPOSAL → [branch] DEFINITION → PLAN → BUILD → VERIFY → SHIP
```

- **RESEARCH stage.** Stage entry asks the master gate (ADR-25): *is the riskiest assumption already known? is the decision reversible & cheap?* → **skip**; otherwise run the **P1 inline gate + P2 `search-researches`** engine and emit its existing output contract (recommendation + confidence + options eliminated) before a proposal is drafted. This is strictly additive to P1's inline gate, which keeps firing inside every other stage; the named stage is the *macro* placement of the same engine at the front of large/uncertain work. **P1 and P2 are referenced by name; their entry/output schemas are not restated here** (hard constraint — the flow *consumes* the research system, it does not re-specify it). For the recall/capture wiring of `research-before-asking.md` itself, see `adhoc-ResearchKB` (P2 owns that file's edits); this ADR only *names the stage*.
- **Mandatory-vs-skippable matrix** (research §6, keyed on ADR-25): the **bottom three stages (PLAN, BUILD, VERIFY) are always mandatory**; the **top three (RESEARCH, PROPOSAL, DEFINITION) flex on the master gate** — they collapse to their lightest artifact (or skip) for a two-way door and are mandatory for a one-way door. This is the `solo`-lane collapse vs. full-pipeline distinction, now principled.
- **VERIFY stage — named by reference, not built here.** The tiered T1–T4 harness (`docs/research/testing-claude-code-plugins.md`) + the `mine-verify` clean-room/adversarial pattern (`docs/proposals/mine-verify-pilot-method.md`, `docs/proposals/mine-verify-pass3-evaluation.md`) are the intended VERIFY-stage gate. They are named **by reference only**; the harness is **NOT built in this pass** (it collides with the in-flight plugin-unit-test work in [Known limitations](#known-limitations--future-work) and the `mine-verify` Pass-4 generic-harness seed — the same "don't re-specify a system this flow consumes" discipline the hard constraint applies to P1/P2/P3). Promote to its own ADR when built.

**Why.** Naming RESEARCH a stage costs almost nothing new — it is an ADR paragraph that points at P1+P2 and the master gate — and it is what makes ADR-25's "Research: skip | mandatory" row mean something concrete. P1 (micro, inline, per-decision) and a RESEARCH stage (macro, front-of-work placement) are the **same engine at two scopes**, not competing mechanisms; the research converged on naming the stage (§1, §6, §7.2). Recording the flow as a logical artifact ordering (every source stresses iteration — TOGAF ADM, dual-track agile) keeps it from being read as a rigid waterfall.

**Tradeoffs.** A documented stage that is "usually skipped" risks looking like ceremony — mitigated by anchoring its entry test on the master gate (skip is the default for a known/reversible decision). Naming VERIFY by reference leaves a forward dependency (the harness ADR) open; accepted to avoid pre-empting two in-flight efforts.

**Rejected.** *Leave research as P1's inline gate with no named stage* — loses the front-of-work placement and leaves the §6 matrix's RESEARCH row meaningless. *Build the T1–T4 / `mine-verify` harness in this pass* — collides with the in-flight plugin-unit-test and `mine-verify` Pass-4 work (research Q2/§7.6). *Restate P1/P2's schemas in the flow ADR* — violates the hard constraint and creates a second drifting copy of a system another pass owns.

---

## ADR-27 — The technical / product definition branch (architect owns the technical definition) — Accepted

> **Status: Accepted — ratified by the owner 2026-06-14.** Part of `adhoc-BuildFlowFormalization`. See the ADR-25 banner.

**Context.** After PROPOSAL the flow branches by **who owns the definition** (research §2). The product branch was already covered — the PO owns `spec.md` + acceptance criteria — and `architect.md` already states that an ad-hoc/technical pass has no `spec.md` and is cross-checked against the **ADR register**, not product docs (architect.md ad-hoc block). What was *not* recorded as a decision is the symmetric technical branch: that a technical feature has a real definition artifact (a tech-spec) the architect owns, parallel to the PO's spec.

**Decision.** Record the two-branch definition split:

- **Product feature → PO owns the definition:** `spec.md` + acceptance criteria. Cross-check = critic Mode 1 vs product/architecture docs.
- **Technical feature → architect owns the definition: a tech-spec + extracted ADRs.** A purely technical feature has no product "what" to shape, so the architect *is* the definer (the PO-equivalent), and the binding cross-check is the **ADR register** (critic Mode 2), not product docs.
- **Both branches converge at PLAN.**

The altitude rule (research §2a, "same thinking at two altitudes, one authoritative"): the **tech-spec / proposal is where you explore** (options, trade-offs, narrative); the **ADR is the durable one-decision record** (terse, in-repo, greppable). One authoritative source — the ADR wins on *the decision*, the tech-spec owns *the rationale* and the ADR points back to it. Drift over time → **supersede, don't rewrite** (the same supersede-don't-delete discipline P2 and the ADR-status convention already use). This is operationalized in the two definer agents in ADR-25's sibling agent edits (architect.md gains the technical-definition-ownership line; po.md gains the product-proposal-as-spec-seed line).

**Why.** The split is industry-standard (Mountain Goat: "the PO owns what & why; the architect/tech-lead owns how"; confirmed independently by the solution-architecture and RFC research streams). Recording it makes the ad-hoc lane symmetric with the product lane instead of an exception, and the one-authoritative-source rule prevents the tech-spec and the ADRs from drifting into two competing decision records — the failure mode supersede-don't-rewrite exists to prevent.

**Tradeoffs.** A technical feature now nominally has a tech-spec artifact — but the master gate (ADR-25) still applies: a two-way-door technical change collapses the tech-spec to a one-line ADR and skips the separate document. The branch is a *definition-ownership* rule, not a mandate to always write a tech-spec.

**Rejected.** *Treat all definition as the PO's `spec.md`* — a purely technical feature has no product "what", so this forces a product framing onto an architecture decision (the Mountain Goat anti-pattern). *Let the tech-spec and ADRs each be independent decision records* — produces two drifting truths; the one-authoritative-source + supersede rule exists precisely to avoid it.

---

## ADR-28 — Proposals are RFC-lite: a named owner ratifies; ratification graduates the proposal — Accepted

> **Status: Accepted — ratified by the owner 2026-06-14.** Part of `adhoc-BuildFlowFormalization`. See the ADR-25 banner. (This ADR is itself a worked instance of the rule it states — written by the architect, now ratified by the owner.)

**Context.** A proposal in this repo was a freeform file in `docs/proposals/` with an ad-hoc `Status:` line. The research (§3, §3a; decided 2026-06-14 in §8) gives it a standard shape and, more importantly, a governance rule the freeform form lacked: **a proposal is not a decision.** The owner's prior decision (MEMORY "proposal-spec-plan-vocabulary") barred re-proposing a proposal/spec/plan *vocabulary doc* — so this ADR is deliberately the narrower thing: an RFC-lite **front-matter + lifecycle**, not a vocabulary.

**Decision.** Give `docs/proposals/*` an RFC-lite lifecycle, defined as front-matter + section order in the **`proposal-format` skill** (ADR-4: formats are skills) and governed by the rules here:

- **A proposal is not a decision — a named owner ratifies it** (enables disagree-and-commit; research §3).
- **Front-matter / sections:** NABC (Need / Approach / Benefits / Alternatives) + Unresolved questions; a **named decision-maker**; `Status: Draft → Ratified → Superseded`; **Impact: 1–10**; **Effort: low | med | high**; **Confidence:** — the only proposal-layer additions on top of P2's research-output format are *impact* and *effort* (the rest the research engine already produces).
- **Ratifier = the owner; the architect recommends.** The recommendation + confidence are **derived from P1** (from unconfirmed assumptions), never self-rated. **Below-High confidence ⇒ the recommendation is "research first" (the P1 research branch), never a go/no-go to ratify** — the owner only ever ratifies High-confidence recommendations; anything below routes through a research spike and re-surfaces. This is the **anti-regression guarantee** (research §3a) and is why this layer *reuses* P1 rather than re-deciding it.
- **Mode-0 proposal critic = default-skip; user confirmation IS the gate.** A proposal already carries derived confidence + mandatory alternatives, so it is self-critiqued; the Mode-0 critic runs **only on explicit user confirmation** — the confirmation is the enforcement, consistent with ADR-13 (an automated gate on a background subagent does not hold). The architect may *flag* a high-impact/irreversible proposal, but enforcement is the confirm, not the flag — **no new automated gate is added.**
- **Ratification graduates the proposal:** a **technical** proposal is promoted to the **tech-spec + extracted ADRs** (ADR-27; "one writing session, two homes" — never re-authored); a **product** proposal is handed to the PO as the **spec seed**. Unratified proposals stay the **idea inbox** (ADR-29).

**Why.** The "a named owner ratifies" rule is the single most important governance finding from the RFC stream — it is what makes "disagree and commit" possible and what distinguishes a proposal (gathers feedback) from a decision (the ADR). Deriving confidence from P1 and routing below-High to research-first means the proposal layer can never *regress* the recommendation+confidence the agents already produce (the rejected "owner ratifies all, no recommendation" option). Framing it as front-matter + a skill (not a vocabulary doc) stays inside the owner's prior decision.

**Tradeoffs.** More structure on `docs/proposals/*` for new proposals; existing proposals keep their freeform `Status:` (no migration — adopting the new front-matter is operator curation, out of scope). The lifecycle *rules* live here in the ADR and the *format* lives in the skill — a deliberate split (ADR-4 producer-format shape) that means a reader of the skill must follow its pointer back to this ADR for the ratification semantics.

**Rejected.** *Owner ratifies all proposals with no architect recommendation* — a regression that discards the recommendation + confidence the agents already produce (research §3a, option 1 rejected). *A proposal/spec/plan vocabulary doc* — barred by the owner's prior decision (MEMORY); this RFC-lite front-matter is the narrower, sanctioned thing. *An automated Mode-0 proposal critic gate* — unenforceable on background subagents (ADR-13); user-confirm is the only reliable gate.

---

## ADR-29 — Ratified proposals become backlog rows; unratified stay the idea inbox — Accepted

> **Status: Accepted — ratified by the owner 2026-06-14.** Part of `adhoc-BuildFlowFormalization`. See the ADR-25 banner.

**Context.** The flow ends PROPOSAL at "ratified", but there was nowhere for a ratified item to land: `docs/backlog.md` **did not exist**, yet the team-lead agent already *references* it (reads it to triage "what's next", and the PO updates a feature's row on spec-Ready). So the lifecycle had a dangling end and the team lead depended on a missing file (research §6, §7.7; R7).

**Decision.** Record the ratified-proposal → backlog lifecycle and back it with a **minimal** `docs/backlog.md`:

- A **ratified** proposal ⇒ a **backlog row**, ranked by **impact ÷ effort** (the impact + effort the proposal front-matter carries, ADR-28, give the backlog its priority ordering). **Any proposal destined for a backlog row MUST therefore carry both `Impact` and `Effort`** — a proposal may omit `Impact` only on the master-gate "one ADR line" record-only path (ADR-25), which does **not** enter the ranked backlog.
- **Unratified proposals stay the idea inbox** in `docs/proposals/`.
- `docs/backlog.md` holds the **schema + the lifecycle rule + at most one illustrative row** — **no migration** of existing proposals into rows (that is operator curation, not a plan/flow act). Shape Up's warning applies: don't let unbet ideas accumulate as zombie backlog rows — the unratified-stay-in-the-inbox rule is what keeps the backlog to *bet* work.

**Why.** A flow that ends at "ratified" with nowhere for the row to land is incomplete, and the team lead already assumes the file exists — creating the minimal schema closes both gaps with the smallest surface. Ranking by impact ÷ effort reuses the proposal front-matter (ADR-28) and closes the ranking gap from the prior backlog discussion. Keeping it minimal (schema, not a migration) avoids turning a definitional pass into a bulk-curation exercise.

**Tradeoffs.** The backlog starts essentially empty (schema + one example) — population is deferred to operator curation as proposals are ratified. Accepted: a migrated-all-at-once backlog would be exactly the zombie-row accumulation Shape Up warns against.

**Rejected.** *Migrate every existing `docs/proposals/*.md` into backlog rows now* — operator curation, not a flow step; risks zombie rows. *Leave the backlog undefined and let the team lead keep referencing a missing file* — the dangling dependency that motivated this ADR.

---

## ADR-30 — Autonomy is an additive mode: a switch, not a rewrite — Accepted

> **Status: Accepted — adhoc-UnattendedAutonomy, 2026-06-16.** Extracted (not re-authored) from `docs/specs/adhoc-UnattendedAutonomy/definition/tech-spec.md` (Layer 0). Owner-stated hard constraint: the attended pipeline must not break.

**Context.** Running Nexus unattended overnight needs new behavior (a verification gate, a fail-closed defer) — but the 29-ADR attended pipeline is the project's primary asset and must not regress. A forked attended/unattended code path would drift and rot.

**Decision.** Autonomy is a **single additive mode** governed by the existing `[UNATTENDED]` launch-prompt token (`team-lead.md:383`) — **no new parallel flag**. New logic *branches on the flag*; it never alters the shared attended path. With the flag off, every code path is byte-identical to the pre-v1 baseline — new behavior is **unreachable** when attended. This is pinned mechanically by a **golden regression test** (offline observables: the new gate is a no-op on output and filesystem flag-off; the existing `pipeline-gate.js`/`guard.js` decisions are unchanged), which must exist and pass before any other v1 code merges.

**Why.** "Switch, not rewrite" makes the don't-break-attended constraint mechanical rather than a promise. Reusing `[UNATTENDED]` avoids a second mode signal that could disagree with the first. The golden test is the constraint's executable form — a regression in attended mode fails CI, not a code review.

**Tradeoffs.** New behavior branches on a prompt token the hooks cannot see (a hook is a separate process); so the flag-consuming fork lives in the team-lead (which reads the prompt), and the gate itself always runs advisory. Accepted — it is what keeps the gate a single code path (ADR-31).

**Rejected.** *Forked attended/unattended code paths* — they drift; the one-advisory-or-authoritative-path discipline exists to avoid exactly this. *A new mode flag* — a redundant second signal; reuse `[UNATTENDED]`.

---

## ADR-31 — The verification gate at the `SubagentStop` boundary: runs + records, never blocks — Accepted

> **Status: Accepted — adhoc-UnattendedAutonomy, 2026-06-16.** Extracted from the tech-spec (Layer 1). Boundary confirmed by a live in-repo spike (the CR-1 verify-boundary spike, 2026-06-16) — the same Probe-P1 pattern ADR-13 uses.

**Context.** Unattended operation needs verification to *gate* phase advancement, but ADR-13 records that a background subagent's **PreToolUse `deny` is dropped** by the platform. The question was whether a usable enforcement boundary exists for a backgrounded implementation subagent without a stateful MCP server.

**Decision.** A net-new **`SubagentStop` hook**, keyed to the implementation subagent's completion, **runs the project's declared verify command set and records a verdict** to the audit trail — it **never denies or blocks**. The verify *execution* is **one code path**; the only fork is verdict *consumption*: in attended mode the human reads it and decides (advisory), in unattended mode the verdict *is* the decision (authoritative), consumed by the foreground team-lead. The spike confirmed `SubagentStop` fires **per subagent completion** (not only end-of-run), mid-session, with a payload identifying the subagent (`agent_type`, `agent_id`, `agent_transcript_path`, `last_assistant_message`).

**Why.** Enforcing by *consuming a recorded verdict* (not by a hook deny) sidesteps the ADR-13 deny-drop entirely — the gate needs only run+record, which PostToolUse/SubagentStop demonstrably do on background subagents. Keeping verify execution to one path means there is no second verify implementation to rot; the single consumption fork is the one testable place mode-divergence could live.

**Tradeoffs.** The boundary is the *implementation subagent's* stop, so the team-lead must be foreground to consume the verdict — true by scope (unattended always runs the standalone `claude -p` team-lead; the team-lead-as-subagent ADR-21 case is out of v1). The gate informs but cannot *force* — enforcement is the team-lead acting on the recorded Fail, consistent with ADR-15.

**Rejected.** *Block at `SubagentStop`* — the spike found a `SubagentStop` `block` **is** honored on a background subagent (unlike the PreToolUse deny), but it traps a verify-failed subagent in an **unsatisfiable retry loop** (observed: 14 forced re-fires until the platform loop-guard cut it off) — it has no new information to satisfy the gate. So run+record-and-consume is a *deliberate* choice, not a platform limitation. *A stateful MCP gate server (maestro pattern)* — a new long-running process; the Stop-boundary route is cheaper (the Layer-2 roadmap retains MCP as a fallback if the hook route ever leaks).

---

## ADR-32 — Unattended fails closed → a structured, resumable review queue — Accepted

> **Status: Accepted — adhoc-UnattendedAutonomy, 2026-06-16.** Extracted from the tech-spec (Layer 3). The unattended **replacement** for the graduated-intervention menu (ADR-15), which is attended-only — not a competitor to it.

**Context.** Today an unattended phase failure is retry-once-then-skip-and-record (`team-lead.md:319`) and an exhausted escalation is fail-the-run-never-escalate (`:330`). Both are fail-closed in spirit but lose the failing item silently — there is no structured way for a human to resume it in the morning. The OMC failure mode (force-accept unverified work unwatched) must stay impossible.

**Decision.** Under `[UNATTENDED]`, on **verify-fail OR 3-cycle-cap-exhausted OR a genuinely unanswered question**, the run **defers the item to a review queue** — a structured artifact capturing, per item: slug, failing gate/reason, audit-trail pointer, and a resume instruction. Resume **reuses the existing ADR-19 idempotency machinery** (`communication-log.md` + `.pipeline-state` Step/Cycle; `summary.md`⇒done, log⇒resume-from-step) so re-entry continues at the failing phase and does **not** re-run completed work. Unattended **never force-accepts and never force-ships** — worst case is "deferred to the queue." `Force-accept` (`team-lead.md:327`) stays attended-only and unreachable under `[UNATTENDED]`. A per-run token/cost cap aborts-to-queue when exceeded (advisory/inert in attended, where the human is the governor).

**Why.** A structured, resumable queue turns "lost overnight" into "triaged by morning" while keeping the fail-closed guarantee. Reusing the ADR-19 resume state avoids a cold restart (which would re-run verified work and could undo it). Citing ADR-15: the graduated menu needs a human, so unattended substitutes the queue for the menu rather than removing the safety.

**Tradeoffs.** A new queue artifact + index to maintain, and the cost cap is only real if a token counter is enabled (ADR-11's `token_audit` is opt-in/off-by-default — an unattended run must enable it or carry a lightweight always-on counter, or the cap is inert). Accepted and stated as a dependency.

**Rejected.** *Force-accept on unattended* (the trilogy's default) — ships unverified work unwatched, the OMC failure mode. *A silent skip* (`:319` as-is) — loses the item with no resume path. *A cold-restart resume* — re-runs completed, verified work; reuse the ADR-19 resume state instead.

---

## ADR-33 — The fleet view: a consolidated observability skill over a statusline heartbeat — Accepted

> **Status: Accepted — adhoc-NexusFleetView, 2026-06-16.** Additive, two-way-door observability surface; per ADR-25 the change collapses to this one ADR rather than a tech-spec or multi-ADR extraction.

**Context.** The per-row `subagentStatusLine` (ADR-13) restyles each background agent's panel row, but there is no single-screen, on-invoke view of the whole running fleet. The load-bearing finding that shapes the design: the rich live roster — per-task `tokenCount`, `startTime`, `status`, and role — is delivered **only** to the `subagentStatusLine` hook. The in-session `TaskList` tool returns just the task board (`{id, subject, status, owner, blockedBy}`), not the agent panel. So a skill that wants live fleet data cannot query for it on demand; the data must be captured where it is pushed.

**Decision.** The statusline renderer persists a **heartbeat** — a normalized fleet snapshot to `<root>/.claude/audit/fleet-state.json` on every render (atomic temp-then-rename; drain-on-empty so a stale roster never lingers; fail-open so row rendering is never disturbed). The launch root is resolved from the documented top-level statusLine payload field `workspace.project_dir` — **not** `CLAUDE_PROJECT_DIR`/`CLAUDE_PLUGIN_ROOT` (hooks-only env, absent for a statusLine process), not `tasks[].cwd` (a per-task subagent dir → wrong audit location), and not bare `process.cwd()` — honoring ADR-8's audit write-path discipline. A user-invoked skill (`fleet`) then **joins** that snapshot with three best-effort sources — the newest `communication-log.md` header (phase/cycle), `token-usage.jsonl` (per-agent tool-call depth, gated on ADR-11's opt-in `token_audit`), and `violations.log` (boundary-event count) — into a header / per-agent-line / health-footer dashboard. Scope is **single-project, current session**; every join degrades to a pinned one-liner, never an error, and a snapshot past a freshness threshold renders **stale**, not live. The skill is the delivery carrier (ADR-2).

**Why.** The heartbeat is the only way to make the push-only roster readable after the fact; persisting it where the other audit artifacts already live keeps one write-path discipline. Best-effort joins mean the view is always renderable — a fresh install with no run reads "No active fleet" rather than throwing. Building it as a skill (not an agent/command) keeps it a zero-cost, user-invoked surface that ships to consumers exactly as the other observability tooling does (ADR-11).

**Tradeoffs.** The statusline gains a side effect (a guarded file write) on top of a previously pure transform — accepted because it is fail-open and the only delivery point for the data. The depth columns are inert unless `token_audit` is on (ADR-11 is off by default), so the common case shows the roster without per-agent calls plus an "enable token_audit" hint. Single-session/single-project scope means a multi-run history view is out of band (the audit logs already serve that; see `consumption-report`).

**Rejected.** *Skill calls `TaskList`* — the task board lacks `tokenCount`/`startTime`/role/run-state, so the dashboard would have nothing live to render; the heartbeat exists precisely because this source is insufficient. *A Vue dashboard now* — deferred; the snapshot + parser is the reusable substrate a future visual surface would consume, but shipping it now is scope the two-way-door change does not warrant.

---

## ADR-34 — Distillation is a portable nexus skill: the pure compaction mechanism only — Accepted

> **Status: Accepted — adhoc-DistillPromptContractFix, 2026-06-20.** Graduates the `distill-prompt` proposal (2026-06-19, authored from the `knowledge-gateway` session as the reinstall-safe carrier) per ADR-28; an additive two-way-door skill, so per ADR-25 it collapses to this one ADR rather than a tech-spec.

**Context.** `distill-prompt`'s job is to compact a multi-turn conversation/transcript that *worked* into ONE clean, generalized, reusable prompt + a title. The valuable atom is the *compaction mechanism*, and it is domain-generic — so it lives once in the plugin and every consumer reuses it (analytics design-time, gateway F25 runtime, and future repos). The hazard it sits beside is the promotion/storage machinery that surrounds it in any real consumer (a prompt library, recurrence detection, a 2-occurrence promotion threshold, idempotency tagging) — which is **not** the skill's job and would destroy its portability if folded in. The original 1.15.0 build drifted the *other* way — it narrowed to a single-prompt sharpener with the opposite, keep-values rule, and a wrong-lens job-fitness eval graded the drift ACCEPT — precisely because this boundary was never recorded.

**Decision.** `distill-prompt` is the **pure compaction mechanism only.** It contains **none** of the promotion/storage pipeline: no storage/sharing/dedup/recurrence-detection/shared library, no Sheet/YAML prompt library, no parameter format, no AM role, no grounding dictionaries, no SQL/category linting, no promotion threshold, no `[APPLIED]`/`[TRACKED]` tagging. Those are **project-local (analytics) or the `learner`'s / `improve-skills`' job** — the "spot a pattern → promote it to a durable artifact" family. The generalization contract is fixed: **KEEP** the converged intent + final working approach; **STRIP** iteration noise, verbatim message text, and run-specific data values (categories, dates, brand/SKU names, IDs, sheet URLs, retrieved figures) so a re-fired prompt carries no stale data. Output is **prose-only** — the optional `[placeholder]` parameterization is deferred until a consumer needs it. Input is **source-agnostic**: adapting a project's logs into a transcript is the consumer's job. Runtime surfaces (gateway F25) **embed the same instruction** rather than re-authoring it — the skill is the single source of truth. Standalone / user-invocable; the `learner` may invoke it later (they **compose, not overlap**).

**Why.** Build the atom once; both design-time and runtime surfaces plus future repos reuse it, and F25 sheds a bespoke instruction copy. The boundary is what keeps it portable — a skill polluted with any one project's promotion/storage concern stops being reusable by the others. Recording the boundary as an ADR is the durable fix for the drift class that produced 1.15.0: an unrecorded boundary let the charter re-scope freely.

**Tradeoffs.** The skill is deliberately *incomplete* on its own — it produces a reusable prompt but does nothing to store, share, or promote it; every consumer supplies that half. That incompleteness *is* the portability. The behavior change from the 1.15.0 build is a reversal (keep-values → strip-values, prompt → conversation), shipped **inside the existing 1.16.1 release tree** (Option A — no separate version bump: distill-prompt's rewrite landed in the 1.16.1 tree, days old with no adopters, so it's documented under the existing `[1.16.1]` CHANGELOG entry rather than as its own bump) rather than as a **MAJOR** — the plugin `version` is plugin-wide, and a MAJOR would over-signal a breaking change to every nexus user for a one-skill fix.

**Rejected.** *Fold promotion/recurrence/library into the skill* — destroys portability; those belong to project-local analytics or the learner/improve-skills. *Keep the 1.15.0 single-prompt sharpener* — it solved a narrower, different job than the contract (input, cardinal rule, and output all differ); not interchangeable. *A second sibling skill beside the sharpener* — the contract is one skill superseding the sharpener, not two. *Ship without recording the boundary* — the exact gap that let the original build drift.

---

## ADR-35 — The PR + AI-review tail: project the pipeline's review onto an opt-in PR; the human curates and merges — Accepted

> **Status: Accepted — adhoc-PRReviewTail, 2026-06-21.** Graduates the PR-review-tail tech-spec (`docs/specs/adhoc-PRReviewTail/definition/tech-spec.md`) per ADR-27/28 — extracted (not re-authored) at Ready. Owner-ratified design forks D1–D4 + MINOR release tier; attaches after the push gate (ADR — `adhoc-BranchPreflightGuard`, 1.16.2).

**Context.** The pipeline ended at the final commit (and, with the push gate, at a controlled push). There was no controlled hand-off from "pushed" to "reviewed and merged," and no place for the AI review the pipeline already produces to reach a PR.

**Decision.** An **opt-in, attended-only, host-gated** tail, owned by the **team-lead**, that after push: (a) opens a PR; (b) posts the AI review **first** — by **default *projecting* the reviewer's existing `review.md`** as a single PR review body (*not* a second reviewer), with an **opt-in** hand-off to `/code-review ultra` for an independent fresh-eyes pass + inline comments; then (c) **STOPS** and hands to **one human** who curates via native GitHub/`gh` UX and **controls the merge.** The team-lead **never auto-merges**; merge runs only on explicit user instruction, sequenced **after** the human review, never at commit closure. Under `[UNATTENDED]` the tail is unreachable (fail-closed, ADR-32); hardened mode skips it (prose deferral, like the push gate).

**Why.** Reuse over rebuild — the reviewer already emits severity-rated `file:line` findings, so *projecting* them is one coherent review with no reconciliation; a second reviewer is the *opt-in*, not the default. "AI first, human curates" keeps the human in control of the one-way action (merge). Attended-only + fail-closed unattended honors ADR-18/20/32; the team-lead is the existing owner of outward actions.

**Tradeoffs.** MEDIUM/LOW review.md findings may lack `file:line` and post in the body, not inline (inline is the opt-in independent pass's job). `gh` is not blocked by hardened mode, so the hardened deferral is prose-level in v1 (a hook block is roadmap).

**Rejected.** *A second on-PR reviewer as default* — reconciliation cost; fresh eyes is the opt-in. *Auto-merge* (even unattended-flagged) — a one-way action unwatched is the OMC/ADR-32 failure mode. *A custom curation UI* — GitHub's native dismiss/resolve/approve already is the curation surface.

---

## ADR-36 — PR-tail host operations route through a thin host adapter; gh (GitHub) is the only adapter, and the tail is host-gated — Accepted

> **Status: Accepted — adhoc-PRReviewTail, 2026-06-21.** Extracted with ADR-35 from the same tech-spec per ADR-27/28.

**Context.** PR/merge operations are host-specific. Hard-coding `gh`/GitHub into the team-lead prose would exclude offline / non-GitHub / no-remote repos and silently turn the tail into a hard step.

**Decision.** All outward PR operations (**open-PR / post-review / view-PR / merge**) route through a **named host-adapter seam** documented once in `agents-workflow.md`. The **only adapter shipped is `gh` (GitHub).** Host capability is **resolved first** (GitHub remote + `gh` installed/authed); absent → the tail is **unavailable** and the pipeline closes at push exactly as today — never an error, never a hard step.

**Why.** The seam keeps offline/non-GitHub repos first-class (the tail is always optional) and lets a future GitLab/Gitea/Azure adapter slot in without re-architecting. Mirrors the push gate's best-effort, host-aware, never-blocks posture.

**Tradeoffs.** v1 ships a single adapter, so the "abstraction" is a documented concept, not code — accepted: it is exactly what stops GitHub being hard-wired into the agent prose.

**Rejected.** *Hard-code `gh` inline in team-lead prose* — excludes non-GitHub, makes the tail a hard step. *A third-party `gh` extension for inline comments* — an external dependency outside the thin seam.

---

## ADR-37 — MVC trims redundant tests: a post-floor Minimize stage + a Cover generation guard, optimizing for rule-traceability — Accepted

> **Status: Accepted — adhoc-MvcCoverMinimize, owner-ratified 2026-06-30.** Additive, two-way-door change to the `mine-verify-cover` method; per ADR-25 it collapses to this one ADR rather than a tech-spec. Grounded in a 3-suite pilot on a production Flutter app (`omnishelf_flutter_app`).

**Context.** The Cover→Gate loop ratchets only *up* — each iteration adds tests to kill surviving mutants, and nothing ever trims. On three live Dart suites, 8–33% of generated tests killed **no new mutant** — worst on the *simplest* class (BuildZplCodeUsecase: 15 of 45 dead), because a small mutant set meets the rule→test 1:1 framing. The redundancy is detectable purely by **reasoning** — tracing each test to the mutant(s) it kills by reading test + source — the same reasoning the classify-survivors agent already performs on the mutant side; no extra mutation runs are needed to *detect* it. (`mutation_test` re-runs the whole suite once per mutant, so a bloated suite also inflates every gate run, not just the test count.)

**Decision.**
- **A new Minimize stage** in the stack-neutral method (`mine-verify-cover`), running **after** the loop reaches the mutation floor and **before** Report — the **dual of classify-survivors**: that stage tags unkilled mutants, this one tags tests that kill nothing new. Attribution is reasoning-only (no per-test mutation re-runs).
- **Suite target = rule-traceable, not mutation-minimal.** Remove true duplicates and categorically-dead tests (log-only, occurrence-count escalation, same-call-under-two-rule-labels, "boundary" tests that never construct the distinguishing input); **keep** a test that documents a *distinct verified rule* even when another test already kills its mutant. The suite stays the executable spec of the rule KB — the skill's paired deliverable.
- **A Cover generation guard** (volume reduction, *not* the enforcement). The Cover prompt enforces the adapter's existing "never assert on log output" policy plus "one representative per mutation-equivalence class," so the categorical dead tests are not emitted in the first place.
- **A fail-closed confirm.** Removal is verified, never trusted — per-test attribution is fallible reasoning no tool can verify (the mutation tool reports only aggregate survivors, never which *test* killed which mutant), so the confirm is the only safety net. After a **write-owning agent** applies the trim, the **runner agent re-runs the full gate on the reduced suite** and the orchestrator (which has no filesystem — it only routes and decides) compares the **exact reachable killed-count** to the pre-minimize count; any drop → **restore**. The full re-gate is the **sound default** — it inherits the gate's existing anti-fake-green guards and catches attribution errors beyond any "at-risk lines"; targeted at-risk-line re-mutation is an optional cost optimization only where the mutation tool supports line-scoping. This is the anti-fake-green invariant — equivalently the mutation ratchet (a kill-rate regression → halt) — applied to test removal.
- **Home = the base method**; the .NET and C++ adapters inherit unchanged (the pass is pure reasoning over the kill-map plus the mutation tool each adapter already provides).
- The Minimize stage **reports** `removed N redundant tests, reachable kill X%→X% (confirmed unchanged)` — never a silent trim (ADR-8 no-silent-caps discipline).

**Why.** The loop's objective is to climb to the floor; de-duplication is the opposite objective (fewest tests at constant kill), and folding both into one loop muddies each — so a separate post-floor stage is the clean home, exactly as Gate (climb) and classify-survivors (analyze) are already separate stages. Generation-time de-dup *alone* is unsafe: mid-loop the Cover agent lacks the whole-suite kill-map, so its redundancy judgment is unreliable and its failure mode is **under-generation** — a silent coverage hole, strictly worse than bloat. So generation stays conservative (categorical only) and the load-bearing de-dup is the whole-suite Minimize pass where the judgment is sound. Rule-traceable beats mutation-minimal because the skill ships verified-rules-as-tests; on the three pilot suites both targets removed the *same* tests (the divergent gray zone was empty), so rule-traceable costs nothing observed while preserving the skill's identity.

**Tradeoffs.** A new stage plus a confirm run — targeted and bounded, but non-zero given `mutation_test` re-runs the suite per mutant. Accepted: the confirm is the only thing that makes "leaner with zero coverage loss" a *proven* fact rather than a hope, and scoping it to the at-risk lines keeps it cheap. The generation guard is prompt-level (a request, not an enforcement) — accepted because the Minimize pass + confirm IS the enforcement, so the guard need only reduce volume.

**Rejected.** *Generation-time de-dup as the primary mechanism* — unsafe without the whole-suite view; risks under-generation. *Reasoning-only removal with no confirm run* — detection by reasoning is sound but removal is a stronger claim, and an attribution error becomes a silent coverage hole. *A mutation-minimal suite target* — discards the rule↔test traceability that is the skill's paired deliverable, for a gain that did not appear in the pilot data. *A Flutter-adapter-only home* — the over-generation is method-level (the rule→test framing), so .NET and C++ would keep bloating.

---

## ADR-38 — M2 refactor safety = suite-green + floor re-clear across the refactor, never a kill-rate delta — Accepted

> **Status: Accepted — adhoc-SddLifecycle, owner-ratified 2026-07-03.** The shipped, ungated half of `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md`'s ADR-G (Q1=(A), user-confirmed); extracted per ADR-27/28. The *merged-set-is-the-gated-unit* half of ADR-G (C3/AC-L3) and the full M1/M3 lifecycle (C1/C2/C4) are **deferred pending the parent pilot's AC-6 verdict** (`docs/specs/adhoc-SddCoverageLoop`).

**Context.** `mine-verify-cover` already gates a class at creation (its shipped gate battery: `target_mutated`, `suite_green`, `no_flaky`, `mutation_floor`, `no_new_skips`, `char_pin`). Refactoring a class already gated by that suite has no defined safety protocol — a naive read of the gate battery would pull in `char_pin` ("production source was not changed"), which a refactor structurally violates, and would tempt a kill-rate-delta comparison across a source change whose mutant population (denominator) is not stable.

**Decision.** M2 (Protect) re-runs exactly two of the six existing gates, before and after the refactor: `suite_green` (every pre-refactor gated test stays green post-refactor) and `mutation_floor` (the re-gated whole-class reachable kill clears the adapter's floor). `char_pin` is explicitly **inapplicable** to M2 — the refactor's whole point is a production-source change, the inverse of the skill's normal no-edit-prod stance. A kill-rate before/after **delta is advisory only, never the pass/fail criterion** — the mutant population changes with the source, so a rate comparison is not apples-to-apples.

**Why.** Reuse over invention — M2 needs no new gate machinery, only a scoped re-run of two gates the method already computes from the adapter's raw output (no agent self-reports a gate, per the existing anti-fake-green invariant). Excluding `char_pin` keeps the protocol internally consistent instead of gating on an assertion the refactor is designed to break. Demoting the rate delta to advisory (never pass/fail) avoids a false-fail/false-pass on a shifting denominator — a strictly weaker, honest signal beats a misleading strict one.

**Tradeoffs.** M2 gives up a "did the refactor make testing harder" *quantitative* signal — the advisory delta is reported but never blocks. Accepted: the alternative (treating the delta as gating) produces false verdicts on every refactor that changes mutant count, which is nearly all of them.

**Rejected.** *Full gate battery re-run including `char_pin`* — structurally contradicts a refactor. *Kill-rate delta as the pass/fail criterion* — not apples-to-apples across a source change (HIGH-B, code-grounded critic pass on the tech-spec). *Deferring M2 alongside M1/M3 until AC-6* — M2's arm is the already-shipped code arm; nothing about it depends on the two-arm pilot's verdict (Q1=(A)).

---

## ADR-39 — Drift v1 = encoded agent awareness (solo/architect/developer) + CI/suite backstop; additive drift deferred to the per-PR loop — Accepted

> **Status: Accepted — adhoc-SddLifecycle, owner-ratified 2026-07-03.** Extracts `docs/specs/adhoc-SddLifecycle/definition/tech-spec.md`'s ADR-H in full (not gated on AC-6 — the drift rule is a dormant conditional, safe regardless of the parent pilot's verdict). Extracted per ADR-27/28.

**Context.** Before this pass, attestation-awareness was discretionary — the architect's general KB-reading, not an encoded rule; no shipped agent file (solo, architect, developer) carried any check for an attested golden set (verified net-new: zero matches for "attested golden set" across the shipped agents). A class with a future C2 attestation record could silently drift out of sync with its tests, with nothing prompting an update.

**Decision.** Encode a forward conditional in all three agents — solo and developer (symmetric, pre-implementation): when the class about to be touched has an attested golden set (`docs/kb/golden/{Class}.md`), update the affected tests in the same pass, or flag an M3 re-mine. architect (symmetric, at plan/done-check time): when a class in scope has an attested golden set, plan the test update or flag an M3 re-mine — role-differentiated, since the architect never writes tests itself. The rule is framed as dormant/forward — it references a record type (C2) that does not exist yet in this codebase; it activates the day the first attestation record ships. The mechanical backstop is free: the merged golden-set test set lives in the consuming repo's normal suite, so drift that *breaks* an attested rule fails CI regardless of process discipline. **Named, accepted v1 gap:** additive drift — new behavior in a covered class that keeps all tests green while the golden set silently under-covers — is not solved here; only the future per-PR loop (out of scope, roadmap) closes it.

**Why.** Converting discretion into an encoded rule is the cheapest correct locus for this control — three short, forward-conditional bullets versus a new enforcement mechanism, and it composes with the existing CI backstop instead of duplicating it. Role-differentiating the architect's phrasing (plan/flag, not "update tests") keeps the rule honest about who actually writes tests in this pipeline.

**Tradeoffs.** Encoded awareness is prompt-level, not a hard gate — an agent can still miss it (same class of risk as every other agent-prose rule, per "Agent boundary rules repeated per agent" in Inherited pipeline decisions below). Accepted: the CI backstop catches the harmful case (broken attested rule); the awareness rule targets the softer case (stale-but-still-green tests) where only prompted discipline helps.

**Rejected.** *A mechanical pre-commit or CI check for attestation staleness* — needs the C1/C2 machinery (registry, versioned attestation) that is deferred pending AC-6; premature to build the enforcement before the record format exists. *Solving additive drift now* — requires the per-PR loop, out of scope for this ungated slice; named and accepted as a v1 gap instead of silently ignored.

---

## ADR-40 — AC-6 GO + merge-first build order: the triage-merge machinery ships before the Cover-from-spec generator — Accepted

> **Status: Accepted — adhoc-SddMergeGen, owner-ratified 2026-07-03.** Extracts `docs/proposals/sdd-generate-merge-2026-07.md` §A.1. Discharges `adhoc-SddCoverageLoop`'s AC-6 gate (superseding ADR-38/ADR-39's "deferred pending AC-6" framing for the M1/C1 slice).

**Context.** The formally-planned blind two-arm BugRatio pilot never ran; instead the operator ran the shipped `mine-from-spec` arm in two consuming repos — sprint-rituals (3 standalone spec-arm runs, 168/178 rules verified, GO with three conditions) and omnishelf_flutter_app (a deliberate two-arm comparison against 4 mutation-gated code-arm KBs: 17 match/11 partial/6 spec-only/1 contradiction). Both independently ranked the merge/comparison machinery as the highest-value next build, ahead of the generator.

**Decision.** AC-6 is adjudicated **GO**. The next build is the **M1 triage-merge machinery**, with the seven SR-pilot-surfaced conditions designed in from the start: layer-tag rules at consolidate time; `ambiguous` blocks generation; content-keyed, granularity-tolerant matching (many-to-one both ways); a distinct `divergence-pending-triage` disposition carrying an evidence pair; the five delta buckets (`overlap-confirmed`/`spec-only-other-layer`/`spec-only-divergent`/`spec-only-unimplemented`/`code-only-precision`); a `suspect-stale-spec` staleness signal; and an implemented-upstream check before authoring any red for a wrong-layer rule. The Cover-from-spec generator ships second, consuming the merge's triaged output (ADR-41).

**Why.** Both independent pilots converged on the same ordering without coordination — the comparison step is what surfaced productization interest in both repos, while a generator built against the raw spec-rule list (the original AC-6 framing) would aim untargeted, ambiguous, wrong-layer reds at the codebase. Building the merge machinery first, with the pilot conditions designed in rather than retrofitted, avoids re-discovering the same seven conditions the hard way on a second stack.

**Tradeoffs.** The formal blind BugRatio worktree pilot (which would have proven blind-arm independence formally) is demoted to optional confirmatory evidence rather than a gate — accepted because three live runs plus one deliberate comparison already answered the questions AC-6 was asking, with richer evidence than a synthetic pilot would have produced.

**Rejected.** *Wait for the formal blind pilot before building anything* — the live evidence already exceeds what the formal pilot would show; waiting adds delay without adding confidence. *Build the generator first, merge machinery second* — inverts the value ordering both pilots independently confirmed.

---

## ADR-41 — Diff-driven Cover-from-spec: generate from the triaged merge output, never the raw spec-rule list — Accepted

> **Status: Accepted — adhoc-SddMergeGen, owner-ratified 2026-07-03.** Extracts `docs/proposals/sdd-generate-merge-2026-07.md` §A.2.

**Context.** The original AC-6 framing assumed Cover-from-spec would generate tests directly off the full mined spec-rule list. Both pilots showed this is unsafe: spec rules span multiple layers in one flat list (F12: 78 rules, ~30 targeting the analyzer class; F13: only 4 of 24 spec-only rules target the domain class) and include `ambiguous`-verdicted rules the spec does not actually commit to — generating from the raw list aims layer-mismatched, guess-encoding reds at the codebase.

**Decision.** Cover-from-spec ships as a **diff-driven** generator. Input = the merge's triaged output: `spec-only-unimplemented` rules whose `layer` matches the plan's target surface, plus owner-confirmed `spec-only-divergent` rows; `ambiguous` rules are blocked (routed to spec repair). Two preconditions gate red authoring: an implemented-upstream check for layer-mismatched rules, and routing `suspect-stale-spec` divergences to spec repair rather than test generation. **Output convention:** generated reds are kept, parked as skipped divergence records (the adapter's parked-red idiom) with observed values — the suite stays green while the divergence stays on the record. In a mature-code run with an empty eligible set, the correct output is **zero tests** — not a failure signal.

**Why.** Both pilots independently re-validated this same-day by hand — flutter's executed probe (11 tests from 6 uncovered/contradicted rules: 5 red confirmed drifts, 1 green keeper, zero false alarms) and SR's mini-pilot (4 tests: 2 real divergences, 1 agreement, the ambiguous rule correctly withheld). The diff-driven scope is safe-by-construction in mature repos (nothing red to generate) and valuable exactly when a redesign/greenfield needs it, without waiting for a genuine M0 moment — the diff decides, per run.

**Tradeoffs.** Cover-from-spec cannot run standalone against a spec with no code arm to diff against for M1/M3 targets — it needs the merge's triage first. Accepted: for M0 (no code exists yet), the triage degenerates correctly (every eligible rule lands in `spec-only-unimplemented`/`spec-only-other-layer` with an empty code arm), so the same mechanism produces the greenfield red suite without new machinery (OD-L6).

**Rejected.** *Generate directly off the raw spec-rule list* (the original framing) — both pilots show this aims layer-mismatched and ambiguous-encoding reds at the codebase. *Wait for a genuine greenfield M0 before building at all* (flutter pilot's literal verdict) — rejected by the owner; M0s are rare in practice, and the diff-driven scoping achieves the same safety without waiting.

---

## ADR-42 — Fact-based test tagging: discrete facts + derived named tiers, no scalar score — Accepted

> **Status: Accepted — adhoc-SddMergeGen, owner-ratified 2026-07-03.** Extracts `docs/proposals/sdd-generate-merge-2026-07.md` §B.

**Context.** Generated (and existing) tests need a way to run in named subsets — a fast pre-commit smoke pass, a full nightly run, a mutation-relevant gate pass on target-class change — without hand-maintaining per-run test lists. The owner considered a 1–100 priority/confidence scalar on tests as one option.

**Decision.** Tag each rule and its generated test with discrete **facts**: `layer` (`domain-calc|api|ui|settings`), `criticality` (`golden|core|edge`), `mutation-gated` (bool), `runtime-cost` (`fast|slow`). Named **tiers** are filter expressions over facts, not a separate taxonomy — the initial set: `smoke` = `golden ∧ fast`; `full` = all; `gate` = `mutation-gated`, run on target-class change — mapped per stack adapter to its native filter syntax (`.NET`: `[Trait]` + `dotnet test --filter`; Flutter: `tags:` + `--tags`; C++: deferred). A 1–100 scalar is explicitly **rejected**.

**Why.** Miners and skeptics cannot reliably calibrate a 67-vs-72 distinction, and any numeric threshold drifts session to session with no stable meaning; CI filters need stable named categories, not a moving number. This mirrors `kb-sync`'s own design note that it does not assign confidence scores — the same lesson recurring independently. Facts also double as the layer-tag input the merge machinery already needs (ADR-40) — one metadata pass serves two consumers.

**Tradeoffs.** A fixed fact vocabulary is less flexible in one dimension (no single ordering axis) but more flexible in the dimension that matters (unlimited tier definitions as new filter expressions, with no recalibration of an existing scale when a new tier is added).

**Rejected.** *A 1–100 scalar priority/confidence score* — calibration and threshold-drift problems, no stable CI-filter semantics; explicitly rejected so a later session does not re-propose it (recorded per the skill's own rejection line).

---

## ADR-43 — Docs render FROM the verified KB, never the reverse; registry machinery borrowed from kb-sync — Accepted

> **Status: Accepted — adhoc-SddMergeGen, owner-ratified 2026-07-03.** Extracts `docs/proposals/sdd-generate-merge-2026-07.md` §C. The render-step half is **implemented in the omnishelf-docs estate**, not this repo — this ADR records the direction decision; the render code itself is out of scope here.

**Context.** The omnishelf-docs pipeline runs code→docs→KB (`docs-bootstrap`→`kb-sync`); nexus mine-verify runs code→verified-rules→KB. An operator idea considered making docs a mandatory intermediate between mining and the KB. Separately, the KB's consumption model is not uniform: agents load a hot layer into context on every run, but full rule ledgers are read-on-demand only — an undistilled hot layer risks context bloat (the same failure `kb-sync`'s `MAX_GLOSSARY_ENTRIES: 500` guards against).

**Decision.** Route by fact-kind, not a single direction for everything. Domain vocabulary/context facts (glossary, bounded contexts) are correctly docs→KB (`kb-sync`) — code cannot define a "workstream." Behavioral rules are correctly mining→KB direct — inserting a docs layer between mining and the KB would distill a verified ledger from unverified prose (provenance inversion), so this is **rejected** for rules. The missing piece is a **render step**, not an intermediate: BR ledgers feed `docs-bootstrap`/`docs-update` as a high-trust source, generating docs FROM the KB, never the reverse. The M1 merge registry (C1) borrows `kb-sync`'s registry machinery: mandatory `source` provenance, `last_verified` staleness ceilings, deprecate-never-delete, append-only changelog. The KB itself splits into a token-budgeted **hot layer** (one line per rule cluster + a pointer) and a **cold layer** (the full ledgers, read on demand) — a distillation stage compresses cold to hot, with a fail-closed token-budget lint.

**Why.** Two ground-truth sources (code+spec for behavior, prose for vocabulary) both need to stay canonical for their own fact-kind; conflating them either way loses information (docs cannot originate a mutation-gated rule; a mined rule cannot originate a bounded-context name). The registry invariants are proven, reusable machinery from a live sibling system — reinventing them would just re-derive the same properties with new bugs. The hot/cold split is the valid core of the original "distill before KB" instinct, relocated to where it actually belongs: between the KB's own layers, not between mining and the verified ledger.

**Tradeoffs.** Two ground-truth sources are more complex than one uniform rule — accepted because forcing docs→KB for behavioral rules would be actively wrong (provenance inversion), not merely inconsistent.

**Rejected.** *Docs as a mandatory intermediate between mining and the KB* — provenance inversion: distilling a verified ledger from unverified prose. *A single uniform code→docs→KB direction for everything* — wrong for behavioral rules, where code+spec are the ground truth and prose is a lossy rendering.

---

## ADR-44 — Spec write-back is a routed obligation: solo trivial-factual only, developer never — Accepted

> **Status: Accepted — adhoc-SddMergeGen, owner-ratified 2026-07-03.** Extracts `docs/proposals/sdd-generate-merge-2026-07.md` §D.

**Context.** The SDD method's reliability rests on spec freshness — the flutter pilot's stale-constant finding and a rollback-narrative finding are what spec rot looks like in practice. Before this decision, no agent file encoded any rule about which role may correct a spec, or under what conditions.

**Decision.** Spec write-back is a **routed obligation**, not a discretionary edit. Solo may apply *trivial factual* spec fixes only (a stale constant, a dangling cross-reference) and re-stamp `spec-rules.md` when present; anything **behavioral** (a bug-or-AC-change) is surfaced to the PO/owner — solo never settles it. The **developer never** updates `spec.md` or `plan.md` under any circumstance; in team mode, drift surfaces via developer/reviewer messages, and the architect amends the plan while the PO/owner amends the spec. `developer.md`'s existing read-only file enumeration is extended to name `docs/specs/{slug}/definition/` explicitly (previously only implied).

**Why.** Granting broad spec-write authority to an implementing agent would let behavior-vs-spec disagreements get silently resolved by whichever side happened to run last, instead of by a human decision — exactly the failure mode the SDD method's divergence-triage machinery (ADR-41) exists to surface, not paper over. Scoping solo's license to *trivial factual* fixes only keeps the low-friction path open for genuinely mechanical corrections (the delta re-check, already shipped, makes the post-edit re-check cheap) without reopening behavioral authority.

**Tradeoffs.** Every behavioral spec-vs-code disagreement now requires a human touchpoint even when the "obviously correct" answer seems clear to the agent — accepted because an agent's obviousness judgment is exactly the thing this rule exists not to trust blindly.

**Rejected.** *Let solo resolve behavioral drift when confident* — reintroduces the silent-resolution risk this decision exists to close. *Let the developer also apply trivial fixes* — owner-stated: the developer never touches a spec, full stop, no trivial-fix carve-out (unlike solo, which operates outside the team pipeline's plan/review ceremony and can act with lower ceremony).

---

## ADR-45 — Mined business-rules registries are their own artifact species: `docs/business-rules/`, flat per-class, one canonical set over linked evidence — Accepted

> **Status: Accepted — adhoc-RulesRegistry, owner-ratified 2026-07-04.** Extracts
> `docs/proposals/rules-registry-vertical-slice.md` (Ratified 2026-07-04, all six resolutions).
> Implementation vehicle: `docs/specs/adhoc-RulesRegistry/definition/tech-spec.md`.

**Context.** The mined rule ledgers and merged registries (SddLifecycle C1, ADR-43's registry
machinery) land in `docs/kb/` — the namespace of the *actual* knowledge base (research pool,
`kb-entry-schema`, graphify inputs). Two artifact species share one folder and one word; after a full
two-arm run, one class's truth is scattered across up to five files in three directories. Separately
unresolved: whether Merge leaves one rule set or two, and how far the registry estate should scale.

**Decision.** Mined/merged rule artifacts are their **own species**, named and homed apart from the
KB: `docs/business-rules/<area>/<Class>.md` — one canonical **flat** registry per class, per-row
provenance (`source: code | spec | both`, `status`, `criticality`, `last_verified`), over the two
mined ledgers demoted to **linked, immutable evidence** (never co-located folders; spec evidence is
per-slug and cannot move per-class). The registry exists from the code arm alone (day one). Registry
invariants carry over unchanged from ADR-43 (rows never deleted, append-only changelog, idempotent
re-runs). Coverage scales **by selection, not sweep**: graphify-selected rule-rich classes (~10–20
per repo); consumers stay ahead of coverage. Consumer order is ratified: agent guardrails + a
rule-aware-review rider first; cross-platform conformance is **spike-gated** (a 2026-07-04 check
found zero rule-text overlap between the C++ and Flutter registries — the diff needs a shared-logic
pair first).

**Why.** The name is the collision: `docs/kb/` already means the knowledge base, and bare `rules`
already means the plugin's always-on agent rules (`.claude/rules/`) — `business-rules` is the
method's own noun (`BR-n` rows). One canonical set with provenance beats two peer sets because every
consumer would otherwise reconcile on read and divergences would have no home (the PD-5263 pilot
empirically needed the merged registry). Selection-based coverage exists because an unconsumed
registry decays silently — worse than absent; the guardrail loop is what keeps registries true.

**Tradeoffs.** A rename touches a shipped contract in the core skill + agent docs (7 files carry the
old path) and owes the Flutter repo a migration note — accepted once, early, while the estate is 6
registries small. `business-rules` is slightly imprecise for mined algorithmic invariants — the
`BR-` prefix already made that tradeoff.

**Rejected.** *Keep `docs/kb/` with a subfolder* — the word is the problem, not just the path.
*Two peer rule sets after Merge* — reconcile-on-read for every consumer. *Folder-per-class vertical
slice* — partial under any layout (spec evidence is per-slug); flat + links gives the one-place view
with zero churn. *`golden-rules` / `domain-rules` / `mine-rules` as names* — collide with the
`golden` criticality tier, misname spec-arm ui/api/settings rules, and name the process rather than
the artifact, respectively. *Mine everything* — cost scales linearly, value doesn't; noise ledgers
rot. *Replace graphify* — different axes (structure vs semantics); fusion beats substitution.

---

## ADR-46 — mine-verify-repo is the third mine: unit = graphify area + one global structure pass, feeding the ad-hoc refactoring lane — Accepted

> **Status: Accepted — adhoc-MineVerifyRepo, owner-ratified 2026-07-04.** Extracts
> `docs/proposals/mine-verify-repo.md` (Ratified 2026-07-04). Implementation vehicle:
> `docs/specs/adhoc-MineVerifyRepo/definition/tech-spec.md`. Evidence base:
> `docs/kb/research/repo-technical-evaluation-for-refactoring.md`.

**Context.** The end goal is refactoring, and the architect's ad-hoc lane (ADR register + triage +
backlog row) presupposes a repo-level triage artifact nothing produces. The two shipped mines are
unit-scoped (one class / one spec). Research confirms the field-wide gap: architectural tech-debt
management is largely untooled and prioritized by gut feeling.

**Decision.** Build `mine-verify-repo` — the mine-verify invariant (clean-room miners → consensus →
skeptic verify → graded registry) at repo scope. Unit = one graphify area (fan-out), plus ONE global
miner reading only the structure graph (layering violations, dependency-direction violations, god
nodes / hub classes — smells invisible per-area). Four diverse lenses: code-quality, architecture,
performance, test-coverage. The
**security lens is deferred** to `/security-review` (overlap + a different verification discipline —
exploitability, not grep-reproducibility). Output feeds the ad-hoc lane; before executing an accepted
refactor, `mine-verify-cover` (M2, ADR-38) is the behavior-preservation safety net. This skill
**supersedes `improve-architecture`'s discovery phase**; its heuristic catalog becomes donor look-for
material for the architecture lens.

**Why.** graphify is the shipped scoping engine — areas are the natural clean-room unit. Diverse
lenses beat redundant voters (research: lens diversity is the ensemble mechanism; naive consensus
degrades teams). One discovery skill, not two overlapping ones.

**Tradeoffs.** A per-area scan misses cross-area smells — accepted, that is exactly what the global
pass exists for. Refactoring *payoff* is unproven (only defect-density prediction is validated) —
carried as the pilot's measured hypothesis, never a claim.

**Rejected.** *Port docs-bootstrap Phase 5 as-is* — battle-tested donor, but self-graded findings, no
git-history gate, no by-design adjudication, feeds docs not refactoring. *ATAM-lineage formal
assessment* — near-zero validation; beaten by a lighter method in the one controlled comparison.
*Keep a security lens* — duplicates a shipped specialized tool.

---

## ADR-47 — The fact/judgment split: facts pass an empirical must-reproduce Verify gate; judgments are human-adjudicated by-design triage — Accepted

> **Status: Accepted — adhoc-MineVerifyRepo, owner-ratified 2026-07-04.** Extracts
> `docs/proposals/mine-verify-repo.md` §Approach 4–6.

**Context.** Per the research's **unverified-but-directional §5 leads** (flagged "treat as leads,
not established facts"): raw LLM repo audits run ~79–83% false positive, and consensus alone does
not fix it — 80+ agents (including adversarial reviewers) unanimously endorsed a nonexistent OpenSSL
bug; only a mandatory empirical evidence gate killed it. Separately, "is this a problem *here*?" is
not a fact at all — the fokus "anemic by design" lesson: a textbook smell can be a deliberate
convention.

**Decision.** Every registry-bound finding is **fact-shaped**: a reproducible check (grep, metric
threshold, graph query) + evidence excerpt. The Verify skeptic **re-executes** the evidence command —
reasoning-only verification is forbidden and structurally enforced (a verdict without its
re-execution output is dropped by the orchestrator). Verdict grammar: CONFIRMED / WRONG / IMPRECISE.
The skeptic also recalibrates severity downward-by-default (LLMs inflate; adversarial pass corrected
8/9). **Judgments** — whether a confirmed fact is a problem in this repo — are adjudicated by the
architect + owner against the repo's reference model (ADRs, conventions; degraded runs flag
`no-reference-model`), recorded as the row's disposition, never automated. A cross-model critic seam
(e.g. Codex) is named in the Verify schema for a later slice.

**Why.** The must-reproduce gate is the difference between a trustable registry and the
~80%-false-positive audit dumps the literature documents. Human by-design triage is what stops the
system from "fixing" deliberate architecture.

**Tradeoffs.** Re-execution costs a command run per finding — cheap next to one false refactor.
Human triage is a throughput ceiling — accepted; dispositions are durable, so it is paid once per
finding, not per run (refresh re-stamps).

**Rejected.** *Consensus/vote-count as the gate* — empirically endorsed a nonexistent bug.
*Automated by-design classification* — the judgment needs the reference model + owner intent.
*Skeptic re-reasoning without execution* — the exact failure mode the evidence gate exists to kill.

---

## ADR-48 — The hotspot gate: bot-filtered git-history metrics are the repo mine's objective prioritization layer — Accepted

> **Status: Accepted — adhoc-MineVerifyRepo, owner-ratified 2026-07-04.** Extracts
> `docs/proposals/mine-verify-repo.md` §Approach 2–3.

**Context.** mine-verify-cover's objective layer is the mutation gate — inapplicable at repo scope
(no per-finding test suite to gate). Phase 5's donor approach — agent-estimated likelihood — is the
weakest link the research identifies; the validated defect predictors are git-history metrics,
computable for free.

**Decision.** The deterministic metric layer runs **before any miner**: bot filtering first
(mandatory — bots dominated churn in measured corpora), then relative churn, churn×complexity
hotspots (filter: > μ+3σ AND >1 change/month), minor-contributor ownership, change coupling. Free
tooling only (`git log --numstat` commands, Code Maat, lizard). Two uses: **scan order** (miners
visit the top-N hot areas — the cost cap) and **finding rank** (`hotspot-priority` is computed,
never agent-assigned). Miners consume the metric tables and are forbidden from estimating any metric
a table provides. Thresholds calibrate within-repo; uninformative signals (e.g. ownership on a
single-maintainer repo) are dropped loudly in the run report, never silently zeroed.

**Why.** Churn/ownership are the strongest **validated** defect correlates known, and a god class
nobody touches is a non-problem — importance must come from history, not opinion. Directional
support from an unverified research §5 lead: hybrid deterministic-signal + LLM triage killed 94–98%
of false positives.

**Tradeoffs.** History-blind debt (a hot problem in a not-yet-touched area) ranks low — accepted;
the global structure pass and triage can still promote it. Cross-project threshold transfer is poor —
hence within-repo calibration as a rule.

**Rejected.** *Agent-estimated likelihood* (Phase 5's approach) — the research's identified weak
link. *Mutation gating at repo scope* — doesn't scale, wrong unit. *Commercial tooling (CodeScene)*
— same signal lineage computable free; revisit only on demonstrated friction.

---

## ADR-49 — Tech-debt triage registries are their own species: `docs/tech-debt/<area>.md`, ADR-43/45 invariants carried, refresh keeps them current — Accepted

> **Status: Accepted — adhoc-MineVerifyRepo, owner-ratified 2026-07-04.** Extracts
> `docs/proposals/mine-verify-repo.md` §Approach 7–8. Sibling decision to ADR-45 (same
> species-separation logic, different artifact).

**Context.** ADR-45 settled that mined rule registries are their own species outside `docs/kb/`.
The repo mine's output is a third artifact kind — verified debt findings with dispositions — and a
one-shot audit report rots silently, which is worse than absent.

**Decision.** Triage registries live at `docs/tech-debt/<area>.md` **in the target repo** — per-area
flat files, sibling species to `docs/business-rules/`, never inside `docs/kb/`. Registry invariants
carry unchanged from ADR-43/45: per-row provenance + `last_verified`, rows never deleted
(dispositions flip: `accepted | by-design | deferred | resolved | superseded`), append-only
changelog, idempotent re-runs. `by-design` rows cite their adjudication basis. A **refresh pass**
(run 2+) re-verifies each row against the git delta since `last_verified`, mapping onto the same
fields — no extra state: `resolved` when the evidence command no longer reproduces; still-active =
a re-stamped `last_verified` only; `superseded` when restructuring moved the problem (the fresh
finding row cites the old row's id in its provenance). Consumers:
the ad-hoc lane (accepted → backlog row) and the M2 safety-net composition.

**Why.** The species split is the same argument as ADR-45 — `docs/kb/` means the knowledge base, and
a debt registry is a work queue with provenance, not knowledge. The refresh pass is what makes this a
registry instead of a report.

**Tradeoffs.** Another top-level docs folder in consuming repos — accepted, the alternative
(overloading `docs/kb/` or `docs/business-rules/`) re-creates the collision ADR-45 just removed.

**Rejected.** *One repo-global `registry.md`* — per-area files match the mine's unit and keep
diffs/reads scoped. *Housing findings in `docs/business-rules/`* — different species: rules document
what code does; findings document what should change. *A docs-layer rendering as the primary
artifact* — ADR-43 direction: render FROM the registry if ever needed, never the reverse.

---

## ADR-50 — mine-reference-model is the fourth mine: unit = one reference repo, output = a portability-graded virtues registry consumed at C5 triage — Accepted

> **Status: Accepted — adhoc-MineReferenceModel, owner-ratified 2026-07-05.** Proposal provenance:
> the mine-verify-repo pilot's Entry 8 (`docs/plugin-feedback/omni-1.22.0-2026-07-05.md` in the
> pilot repo), ratified by owner directive. Implementation vehicle:
> `docs/specs/adhoc-MineReferenceModel/definition/tech-spec.md`.

**Context.** mine-verify-repo's C5 triage adjudicates `by-design` against "the repo's reference
model" and degrades to `no-reference-model` when none exists — but producing the reference model
has no owner in the skill family. The first pilot (omnishelf_flutter_app) needed exactly that
artifact for its triage step, and a hand-built precursor
(`dotnet-reference.md`, 2026-05-31) proved the artifact shape by hand: code-verified pattern
choices + the rule each reveals + a portability mapping to the consuming stack.

**Decision.** Build `mine-reference-model` — the "what to copy" arm. Unit = ONE designated
reference repository; parallel clean-room extractors per dimension (default five: layering, module
boundaries, error handling, DI, testing strategy) → one consolidate+skeptic that **re-executes**
every pattern's evidence against the reference source (verdict without its re-execution excerpt is
dropped — C3 inherited) → `docs/reference-model.md` written in the **consuming** repo: the third
registry species (ADR-43/45/49 invariants carried), with a per-pattern **portability stamp**
(`portable | adapt | not-portable`) and a translation dictionary built from confirmed rows only.
The gate kills **invented virtues** (flattery) where the debt mine kills false positives.
Pattern *existence* is the skeptic-gated fact; *portability* is an ADR-47 judgment column —
agent-drafted, advisory, human-confirmed at the point of use (triage/roadmap citation), never a
new in-run adjudication gate. The artifact is an **additional formal source** of C5's "reference
model" alongside the repo's own ADRs/conventions (ADR-47's referent stands unchanged);
`no-reference-model` fires only when no reference model of any kind is available. **No metric layer — a deliberate asymmetry with ADR-48:** virtues
are structural choices, not churn concentrations; the dimension list + per-dimension cap replace
hotspot ranking as the cost bound.

**Why.** An unverified virtue in the adjudication reference silently legitimizes `by-design`
dispositions — worse than a false debt finding. The must-reproduce gate transfers unchanged; only
the failure mode it kills differs. Species logic is ADR-45/49's argument a third time: a virtues
registry is an adjudication reference with provenance, neither knowledge (`docs/kb/`) nor a work
queue (`docs/tech-debt/`).

**Tradeoffs.** A dimension-scoped scan misses virtues outside the listed dimensions — accepted;
the list is a run parameter. Portability stamps ride unadjudicated until first cited — accepted,
the alternative (a human gate per run) re-creates the throughput ceiling ADR-47 already declined.

**Rejected.** *Run mine-verify-repo on the reference repo* — produces a debt registry, the wrong
artifact (the pilot's architect recommendation records this explicitly). *Auto-generating project
skills from the extracted patterns* (Entry 8's optional stage 2) — `improve-skills` owns skill
scaffolding; separate proposal if demand proves out. *Housing the output in `docs/kb/` or
`docs/tech-debt/`* — re-creates the species collision ADR-45/49 removed. *A metric layer on the
reference repo* — measures pain, not judgment.

---

## ADR-51 — nexus-dotnet skills are pattern-first and exemplar-cited: teach the pattern, cite the reference app as the worked example — PROPOSED

> **Status: PROPOSED (owner ratifies).** Written by the architect as part of `adhoc-SkillEstateConsolidation`; the implementation (the 4 ported skills, the `authorization-patterns` re-registration, the fold-upstream pass) ships, but this ADR text is **not** a decided record until the owner ratifies it. Do not treat the wording below as settled architecture; the owner may amend the framing before it is accepted. Provenance: the owner directive (D1–D3) recorded verbatim-in-substance in `docs/specs/adhoc-SkillEstateConsolidation/delivery/plan.md` (Definition section).

**Context.** The nexus-dotnet estate was mined from ONE reference application (`dotnet-microservices`), which is a template/quarry for the owner's *other and future* .NET projects — not a consumer with ongoing feature work. When a shipped skill is framed to that one repo's domain (the Articles lifecycle), it teaches "how this app is built" instead of "how to build a .NET app in this family." One shipped skill had exactly this defect (`authorization-patterns`' description led with "Endpoint authorization for the article lifecycle"); a repo-exact estate silently narrows every downstream run to a domain the new project does not have.

**Decision.** A nexus-dotnet skill is **pattern-first and exemplar-cited**: it teaches the *pattern* for a new .NET project in the consuming family (the closed role enum range-partitioned by domain, the two-layer auth gate, the data-driven state machine, the idempotency variants, …), and cites the reference app (`dotnet-microservices`) as the **worked example** — never as the only reality it serves. The concrete register gate: repo-domain vocabulary (`Article*`, `UserRoleType`, ArticleHub, service names) may appear **only** inside an explicit exemplar clause that names the reference app; a skill's `description` leads with the pattern, not the domain. Repo-exact framing is a **defect** — except in the one case where the pattern genuinely *is* the app (a convention that only makes sense as that repo's choice).

**Why.** The estate is a mining instrument for future projects (D1/D2). A pattern-first skill ports to any project in the family; a repo-exact one ports to none but the quarry. Making the register a durable rule (not a one-pass cleanup) keeps future skill authoring and the `improve-skills`/`evaluate-skill` meta-loop pointed at the pattern, so the next mined skill is born compliant rather than re-cleaned.

**Tradeoffs.** The case-insensitive `article` description grep is only a **smoke test**, not the rule — a skill can be repo-exact without the literal token (service names, `UserRoleType`), and can legitimately name the reference app inside an exemplar clause. The binding gate is the register rule (repo vocabulary only inside a named-exemplar clause), which is a judgment check, not a deterministic one; it rides the `evaluate-skill` rubric's Layer-1 register review rather than a lint.

**Rejected.** *Keeping project-local skills as the estate* — they are a mining instrument, never an end state (D2); they drift behind every plugin release. *Renaming the two already-replaced skills to drop domain flavor* — names are stable public surface; the register lives in the description and body, not the folder name. *A deterministic `article`-token lint as the gate* — both stricter and weaker than the rule (false-flags a named exemplar clause, misses `UserRoleType`/service-name framing); demoted to a smoke test.

---

## ADR-52 — The consumer-repo grounding contract: three thin indexes + a script-synced KB copy ground every agent session — ACCEPTED

> **Status: Accepted — adhoc-AgentGrounding, owner-ratified 2026-07-09.** Extracts the consumer-repo grounding-contract decision from `docs/proposals/agent-grounding-memory-wiring.md` (Ratified 2026-07-09, Resolutions 3–4); implementation vehicle: the `adhoc-AgentGrounding` slice (`docs/specs/adhoc-AgentGrounding/definition/tech-spec.md`).

**Context.** Nexus agents auto-load a fixed grounding set in every consuming repo — `docs/architecture/index.md` (architect), `docs/conventions/coding-conventions.md` (architect/developer/solo), `docs/product/index.md` (po, architect on-demand), `docs/kb/index.md` (solo + the kb-navigation rule). Consumer repos that lack these files start every session blind: the omnivision SDK has a rich doc estate and none of the three indexes, so each session rediscovers the docs; the estate KB travels to consumer repos as an untracked manual copy — byte-identical the day it's copied, silently stale after. The knowledge-gateway MCP (pgvector+FTS hybrid RAG over the docs hub + meeting notes) exists as a runtime memory but nothing tells agents when a repo can rely on it. (Ratified: `docs/proposals/agent-grounding-memory-wiring.md`, 2026-07-09.)

**Decision.** A consumer repo satisfies the **grounding contract** when it provides: (1) the **three thin indexes** — `docs/architecture/index.md`, `docs/conventions/coding-conventions.md`, `docs/product/index.md` — each an index over the repo's *existing* docs, not a rewrite; and (2) **KB access on both layers** — a **tracked, script-synced copy** of the estate KB (never a manual untracked copy), plus the knowledge-gateway MCP as the runtime layer *once the gateway consultation rule ships* (that rule is spike-gated and not part of this contract's mandate). The shipped surface is a compact `## Repo grounding contract` section in the `kb-navigation` rule: agents surface a missing grounding file **once per session** — note it and offer to create the index — never nagging, never blocking. Scaffolding automation (`ground-repo`) is deliberately deferred; the documented contract alone unblocks consumers.

**Why.** Grounding-at-session-start is the property that makes any estate repo agent-ready without per-repo prompt engineering — the contract names the exact files agents already auto-load, so satisfying it is mechanical and verifiable per repo. A tracked, scripted KB copy makes staleness visible in diffs instead of silent; the gateway clause keeps runtime memory named without coupling the contract to an unproven consumption pattern.

**Tradeoffs.** Thin indexes are one more artifact to maintain per repo (mitigated: they are indexes, cheap to refresh, and agents flag their absence). A script-synced copy can still lag between syncs — tracked-and-diffable, not fresh-by-construction. The once-per-session surfacing adds a small prompt obligation to every agent session in non-compliant repos — the intended pressure, kept to one note.

**Rejected.** *Baking grounding into each consumer repo's CLAUDE.md* — duplicates per repo and drifts; the plugin owns the navigation rules. *Gateway-only KB access* — agents go blind when the MCP is absent, and the gateway indexes only the docs hub today. *A plugin-owned embedding/KG memory layer* — the gateway already provides runtime memory; file-based registries and KB stay the reviewable source of truth; corpus size keeps grep competitive. *A standalone always-on rule file for the contract* — a per-session context cost (ADR-25) for what fits as one section of the existing navigation rule.

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
- **Skill-inventory discovery (P2) — resolved in 1.4.1.** `create-implementation-plan` now instructs
  building the inventory from the skills surfaced in the agent's context (plugin skills included),
  with the `.claude/skills/` glob covering only project-local skills. Kept here for the record; the
  F16 all-`None` skill mapping was verified honest (the data-path pattern genuinely has no skill
  coverage), not an inventory artifact.
- **CI gate.** Added: `.github/workflows/plugin-release-check.yml` runs the version-bump check
  (`bump-plugin.mjs --check`, hard gate) and `claude plugin validate --strict` (advisory until CI auth
  for the `claude` CLI is confirmed, then flip to required). The dangling-`*-format`/skill-ref lint
  that catches the ADR-4 bug class has since shipped (see *Plugin unit tests* below).
- **Plugin unit tests — SHIPPED (2026-06; roadmap `docs/proposals/plugin-evaluation-2026-06.md` §A,
  research `docs/research/testing-claude-code-plugins.md`).** No longer future work: the `node:test`
  suite (zero deps) is built and is the CI hard gate. `tests/lint/` (**T1** structural lint — frontmatter
  schema, `skills:`/dangling-`*-format` resolution, convergence of duplicated vocabulary,
  enforcement/relay contracts, CHANGELOG↔`plugin.json`, no `${CLAUDE_PLUGIN_ROOT}` in markdown);
  `tests/unit/` (**T2** — every hook driven by synthetic event JSON, plus `bump-plugin`/`gen-commands`/
  `gen-omni` against fixture trees); `tests/evals/` (**T3/T4** — the real agents via headless
  `claude -p --plugin-dir` on the **subscription CLI**; owner decision 2026-06-10: no API key, CI-wiring
  deferred with it). Run: `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` + `scripts/selfcheck.mjs`;
  gated by `plugin-release-check.yml`. **Still owed:** promote this to a full ADR (the "promote when built"
  note); the only open roadmap item is owner live-validation (§A step 5).

---

*Working proposals that fed this record (historical, superseded by this doc): pipeline-enforcement
fixes, artifact-format delivery, and build/source-of-truth analyses — originally drafted in a
consuming project before ADR-1 moved the canonical record here.*
