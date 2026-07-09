# Tech-Spec — Agent grounding: registry consumers, discoverability, and the consumer-repo grounding contract

**Slug:** adhoc-AgentGrounding
**Type:** Technical feature — architect owns the definition (ADR-27). Graduated from TWO ratified
sources per ADR-28 (decisions extracted, never re-authored):
- `docs/proposals/agent-grounding-memory-wiring.md` (Ratified 2026-07-09) — items 1, 3, 5.
- `docs/proposals/rules-registry-vertical-slice.md` (Ratified 2026-07-04) — the queued consumer
  increment (guardrail + review rider), recorded as successor #1 in
  `docs/specs/adhoc-RulesRegistry/definition/tech-spec.md` Out-of-scope, plus that slice's deferred
  merge-harness path rebase (`adhoc-RulesRegistry` summary Notes).
**Status:** **Ready** — code-grounded critic pass folded (REVISE → fixed, see `## Critic Review`)
**Depends on:** `adhoc-RulesRegistry` shipped (nexus 1.21.1 / nexus-cpp 0.1.4) — the C1 registries
exist at the final path (`docs/business-rules/<area>/<unit>.md`), so consumers point at it once and
never re-point.
**Date:** 2026-07-09
**Plan:** `docs/specs/adhoc-AgentGrounding/delivery/plan.md`

---

## Context

The rules-registry slice shipped the *artifact* (canonical per-class registries at
`docs/business-rules/`) but left its consumers queued: the three agent guardrail hooks are still
forward-conditional on C2 attestation records that don't exist (dead triggers), no navigation rule
tells an agent the registries exist, and consumer repos lack the grounding files agents auto-load.
This slice wires the consumers. Rationale, alternatives, and ratified resolutions live in the two
proposals — not restated here.

**Verified current state (2026-07-09, this repo):**
- `plugins/nexus/agents/solo.md:14`, `developer.md:66`, `architect.md:246` — attestation-drift hooks
  reference the registry path but trigger on C2 records: "no C2 attestation records exist … this rule
  activates the day the first one ships." Inert by construction.
- `plugins/nexus/rules/kb-navigation.md`, `kb-maintenance.md` — zero references to
  `docs/business-rules/` (grep-verified).
- `harness/merge.workflow.js:492` — `REGISTRY_PATH` default still composes
  `${SR}\docs\kb\golden\${TARGET_CLASS}.md` (the summary's cited `:444` has drifted; re-verified
  against source). `harness/lib/rules-registry.mjs:4,159` comments name the old default;
  `tests/unit/rules-registry.test.mjs` and `tests/unit/kb-distill.test.mjs` fixture old paths.
- `plugins/nexus/agents/reviewer.md` — no registry awareness; rider slots into `## Before Reviewing`
  and `## Review Dimensions`.
- `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md` — has `## Picking a target (this decides
  the ceiling)` (line ~131), the natural neighbor for the graph-extraction recipe.

## Work units

### U1 — Guardrail rebase C2→C1 (solo, developer, architect hooks)

Rebase the three inert hooks on the registry that already exists. New trigger: **the unit being
touched (or planned) has a registry at `docs/business-rules/<area>/<unit>.md`** — checkable now, live
on the 6 classes mined to date.

- **solo + developer (pre-edit):** before editing such a unit, read its registry — the load-bearing
  behaviors are context, not something to rediscover from source.
- **solo + developer (post-edit):** a cheap **scoped skeptic re-verify** — a read-only subagent
  re-verifies only the touched rules against the edited source; findings are flagged (semantic drift →
  fix or escalate), never silently absorbed and never a full re-mine. Where subagent spawn is
  unavailable, the documented fallback is an in-context re-check of the touched rules, disclosed as
  such in implementation.md / the solo report.
- **Test obligation retained:** the existing "update the affected tests in the same pass, or flag an
  M3 re-mine" obligation stays, now conditioned on the C1 registry. C2 attestation remains a one-line
  forward note (the records are still a future SddLifecycle arc), no longer the trigger.
- **architect hook:** same rebase at plan/done-check altitude — when a unit in scope has a registry,
  plan the registry-load + skeptic obligation and the test update (the architect never executes them).
- Regenerate `commands/*.md` **once, after ALL agent edits land** — solo, developer, architect, and
  reviewer (U2) — `scripts/gen-commands.mjs nexus` is plugin-wide; one run covers all four (critic
  observation folded).

### U2 — Rule-aware review rider (reviewer)

Same trigger and path resolution as U1, at review altitude: when the diff touches a unit with a
registry, the reviewer loads it (`## Before Reviewing`) and checks the change against the rule rows —
findings name the specific rule ("this change flips BR-12: {statement}"), severity per the existing
scale, instead of generic correctness commentary. Rider on the existing dimensions (slots beside plan
conformance in `## Review Dimensions`), not a new review stage; absence of a registry changes nothing.

### U3 — Registry discoverability (kb-navigation + kb-maintenance rules)

- `kb-navigation.md`: add `docs/business-rules/<area>/<unit>.md` as a first-class navigation layer —
  for a behavior question about a specific class/unit, check its registry before reading source: it
  holds the verified rules with per-row provenance (`source: code|spec|both`), status, and
  criticality. Sits beside the existing KB and structural-graph layers; skip silently when the folder
  doesn't exist.
- `kb-maintenance.md`: a species-boundary note — this file governs `docs/kb/` only. Registries under
  `docs/business-rules/` are their own species (ADR-45) with their own lifecycle: **never hand-edit**;
  changes flow through re-mine or the post-edit skeptic re-verify (U1). Prevents the maintenance
  rules (Edit-tool updates, index registration) from being misapplied to registries.

### U4 — Consumer-repo grounding contract (ADR-52 + shipped section)

The contract a consumer repo satisfies for instant agent grounding:

1. **Three thin indexes** over its existing doc estate — `docs/architecture/index.md`,
   `docs/conventions/coding-conventions.md`, `docs/product/index.md` — the grounding set agents
   consult (verified per file, critic MED-3: the architecture index is auto-loaded by the architect;
   coding-conventions auto-loaded by architect/developer/solo — `developer.md:64`, `solo.md:12`; the
   product index is read **on-demand** by po and architect — `po.md:62`; no single agent auto-loads
   all three). Thin = an index pointing at existing docs, not a rewrite of them.
2. **KB access, both layers (Resolution 4):** a **tracked, script-synced copy** of the estate KB
   (never a manual untracked copy — stale silently), plus the knowledge-gateway MCP as the runtime
   layer **once the gateway consultation rule ships** (conditional — that rule is spike-gated, out of
   scope here).

Shipped surface: a compact `## Repo Grounding Contract` section in `kb-navigation.md` — states the
contract and instructs agents to surface a missing grounding file **once per session** (note it,
offer to help create the index; never nag, never block). Dev-repo record: **ADR-52** in
`docs/architecture/README.md`. The consumer-repo executions themselves (SDK grounding pass, sync
script authoring) stay out of scope per the proposal boundary — the estate implements the contract
per repo; the plugin ships the generic contract only.

### U5 — C++ graph-extraction recipe (nexus-cpp)

A short self-contained section in `plugins/nexus-cpp/skills/mine-verify-cover-cpp/SKILL.md`, beside
`## Picking a target` (graph-selected targeting is the ratified coverage strategy — rules-registry
Resolution 5): **clang-uml** as the extraction layer feeding `graphify-out/GRAPH_REPORT.md` —
`compile_commands.json` via Ninja, GraphML + JSON model output, context-radius and path/regex filters
that exclude god nodes at extraction time; **CodeQL licence-barred** for private repos; **Joern** as
the zero-build fallback. Self-containment rule applies: essentials inline; the SDK repo's research
entry (`docs/kb/research/cpp-code-graph-tooling.md`) cited as provenance only, never the sole
resolver.

### U6 — Merge-harness path rebase (dev-repo files, no version bump)

Align the harness to Contract R1 (the deferred `adhoc-RulesRegistry` successor item, re-verified
against current source — see Context):
- `harness/merge.workflow.js` — the `REGISTRY_PATH` default (currently `:492`) composes the old
  `docs\kb\golden\{Class}.md`; new default composes `docs/business-rules/<area>/<unit>.md` with the
  area supplied via args (an explicit `registryPath` arg already overrides and stays supported;
  Contract R1 permits omitting `<area>` in single-area repos — pick the no-area fallback
  accordingly).
- `harness/lib/rules-registry.mjs:4,159` — update the two comments naming the old default.
- `tests/unit/rules-registry.test.mjs`, `tests/unit/kb-distill.test.mjs` — re-fixture to the new
  path; suite green.

## Out of scope (queued, with owners)

1. **Gateway consultation rule** — spike first (proposal item 2, Resolutions 1–2); the spike queues
   directly behind this slice.
2. **`mine-verify-flows` graduation** — its own tech-spec, gated on the app-repo device-day closing
   (proposal item 4).
3. **`ground-repo` scaffold skill** — deferred successor (Resolution 3); trigger = a second consumer
   repo showing onboarding friction.
4. **Cross-platform conformance spike** — rules-registry, needs a shared-logic pair first.
5. **Graphify node-payload fusion** — its own spike (rules-registry Resolution 5).
6. **Consumer-repo executions** (SDK grounding pass, KB sync script, MVC expansion) — the SDK repo's
   `adhoc-MineCode` roadmap.

## Acceptance criteria (grep-checkable)

- **AC-1 (U1), amended per critic MED-2 — two clean greps, no judgment:** **negative** —
  `grep -rn "activates the day the first one ships" plugins/` → **0 hits** (all three hooks carry
  the phrase today as their trigger; the retained C2 forward note is pinned by the plan to different
  wording — e.g. "C2 attestation records remain a future arc; when they ship, attestation joins this
  trigger" — so the old phrase greps clean). **Positive** — the plan pins the exact new
  trigger sentence (registry-existence condition); the done-check greps the pinned phrase in each of
  the 3 agent docs and confirms the 3 regenerated commands match.
- **AC-2 (U1):** solo.md and developer.md each name the pre-edit registry read AND the post-edit
  scoped skeptic re-verify (grep `skeptic` in both hooks); the in-context fallback is documented.
- **AC-3 (U2):** `reviewer.md` references `docs/business-rules/` in `## Before Reviewing` and carries
  the rule-diff rider in `## Review Dimensions` (grep; regenerated command matches).
- **AC-4 (U3):** `kb-navigation.md` names `docs/business-rules/<area>/<unit>.md` as a navigation
  layer; `kb-maintenance.md` carries the species-boundary note (grep `business-rules` in both; the
  maintenance note contains "never hand-edit" scoped to registries).
- **AC-5 (U4):** ADR-52 present in `docs/architecture/README.md` (index line + body);
  `kb-navigation.md` contains a `## Repo Grounding Contract` section (Title Case — the file's house
  style) naming the three index files and the tracked script-synced KB copy, with the gateway clause
  marked conditional.
- **AC-6 (U5):** `mine-verify-cover-cpp/SKILL.md` contains `clang-uml` and `Joern` (grep); the SDK
  research entry appears only as a provenance citation.
- **AC-7 (U6), amended per critic HIGH-1:** **tracked-files negative sweep** —
  `git grep -nE "kb[\\\\/]+golden" -- harness tests` → **0 hits**. `git grep` scopes to tracked files,
  excluding the gitignored `harness/.runs/` run history (which legitimately records old
  consuming-repo paths and is NOT a deliverable — the original "nothing is historical record" premise
  was false); the separator-agnostic pattern also matches the JS escaped form `kb\\golden` at
  `merge.workflow.js:492`, which a `kb.golden` regex misses. Known tracked targets to re-point (baseline grep re-run 2026-07-09 — 12 lines):
  `rules-registry.mjs:4,159`, `kb-distill.test.mjs:24,28,36,55,68,72,106` (line 72 is a regex
  assertion in escaped-slash form, `docs\/kb\/golden\/…` — caught only by the separator-agnostic
  pattern), `rules-registry.test.mjs:4,129`, `merge.workflow.js:492`. **Positive assertion** (the sweep alone
  cannot prove the rebase): `grep -nE "docs[\\\\/]+business-rules" harness/merge.workflow.js` → ≥1
  hit, on the `REGISTRY_PATH` default (separator-agnostic, mirroring the negative gate — plan-critic
  MED-2). `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green (repo CI form; the bare
  directory form errors on Node v24 — plan-critic MED-1).
- **AC-8 (release), amended per critic LOW-5:** one bump landed per plugin whose shipped files
  changed, after all edits land; CHANGELOG entries name the guardrail rebase and the grounding
  contract; gen-omni twin sync rides the close-out. Tier per `release-plugin` policy — PATCH
  default, **owner escalates**; the architect's recommendation at release: MINOR for both (new
  consumer capability / new guidance section). The tier is the owner's call, not an AC fact.

## ADRs extracted

- **ADR-52** — the consumer-repo grounding contract (three thin indexes + script-synced KB copy;
  gateway clause conditional). Extracted to `docs/architecture/README.md` at graduation, same
  session. The only shipped-contract change in this slice warranting an ADR (the proposal's own
  call); U1–U3/U5 execute already-ratified decisions (ADR-45 + the two proposals' resolutions).

## Decisions (self-resolved at definition, disclosed)

- **U5 placement — nexus-cpp adapter, not core** (two-way door): C++ toolchain guidance doesn't
  belong in rules shipped to all stacks; recorded as Resolution 5 in the proposal. Rejected
  alternative: one sentence in core `kb-navigation.md`. Status: decided.
- **U4 shipped surface — a section in `kb-navigation.md`, not a new rule file** (two-way door): the
  contract is navigation-adjacent ("where knowledge lives"), and a new always-on rule file adds a
  per-session context cost the master gate (ADR-25) says to avoid for a compact contract. Rejected
  alternative: standalone `grounding-contract.md` rule. Status: decided — critic to sanity-check.
- **U6 rides this slice** (two-way door): the summary Notes earmark it for the C2→C1 rebase
  successor, which U1 is. Rejected alternative: separate dev-repo chore. Status: decided.

## Critic Review

Code-grounded critic pass, 2026-07-09 (fresh-context; live files read, greps re-executed, git-ignore
state checked). Verdict: **REVISE** → all findings folded, spec flipped to Ready.

| Finding | Severity | Disposition |
|---------|----------|-------------|
| HIGH-1 — AC-7 unachievable (180 working-tree hits incl. gitignored `harness/.runs/` history), regex-blind to `merge.workflow.js:492`'s escaped `kb\\golden`, no positive assertion for the rebase | HIGH | Fixed — AC-7 rewritten: tracked-files `git grep` + separator-agnostic pattern + positive `docs/business-rules` assertion on the `REGISTRY_PATH` default; false premise dropped |
| MED-2 — AC-1 mixed a grep with a judgment call ("as the trigger condition") while U1 retains a C2 forward note | MED | Fixed — AC-1 split: decisive negative grep (phrase → 0, C2 note pinned to different wording) + plan-pinned positive trigger sentence |
| MED-3 — U4's "(verified: … auto-load)" overstated the auto-load set (product index is on-demand; no agent loads all three) | MED | Fixed — U4 prose aligned to per-file loader attribution (ADR-52 body was already accurate) |
| LOW-4 — ADR-52 missing the `> **Status:**` provenance blockquote its siblings (ADR-45/49/51) carry | LOW | Fixed — blockquote added in README.md |
| LOW-5 — AC-8 hard-declared MINOR vs the PATCH-default / owner-escalates policy | LOW | Fixed — tier restated as owner's call with architect recommendation |
| OBS — regen obligation sat under U1 only while U2 also edits reviewer.md | note | Fixed — one plugin-wide regen after all four agent edits |

## Cross-references

- Proposals (ratified sources): `docs/proposals/agent-grounding-memory-wiring.md`,
  `docs/proposals/rules-registry-vertical-slice.md`
- Predecessor slice: `docs/specs/adhoc-RulesRegistry/` (tech-spec Out-of-scope #1 = U1/U2; summary
  Notes = U6)
- Registry species + invariants: ADR-45; merge machinery: ADR-40/43
- Gateway + flows successors: proposal items 2 and 4 (queued, not here)
