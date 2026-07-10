# Tech-Spec — The Data-Analyst Domain Extension Plugin (v1 thin slice)

**Status:** Ready — name resolved by owner 2026-07-10: **`nexus-analytics`** (picked from the
shortlist over `nexus-bi`; "plain and simple"). Twin: `omni-analytics`.
**Branch:** technical (ADR-27 — architect-owned definition)
**Provenance:** `docs/proposals/nexus-data-extension-2026-07.md` (P5 intake resolved 2026-07-10:
first consumer `D:\omnishelf\analytics`, thin slice, define-now/build-after-P4; owner instructed
spec authoring same day). Grounded against the live machinery: 5 plugins ship today
(nexus + 4 stack adapters), `marketplace.json` drives `tests/lint/release.test.mjs` iteration,
`gen-omni.mjs` registers twins via explicit `mirrorPlugin()` calls + a `wantPlugins` array
(scripts/gen-omni.mjs:98-102, 114-120).
**Plan:** `docs/specs/adhoc-AnalystExtension/delivery/plan.md`

## Problem

Data-analyst method lives in two project-local silos that cannot reach other consumers and drift
apart: the analytics workspace (13 skills + 7 rules + a CSV semantic model, in daily
Account-Manager use) and KG (the formal bundle + SQL validation obligations). Both independently
evolved the same guardrails (bad-reports filter, no-gold-tables, large-table bound patterns) —
proof the method is real. omnivision-ai-sdk is next in line to need it from zero.

## Design

### The first domain extension

`plugins/nexus-analytics/` — a sibling of the stack adapters, but domain-shaped. The boundary rule
governs every artifact: **method → plugin, data → project, autonomous loop → VWH.** The plugin
REQUIRES nexus core installed (the same premise every stack adapter already carries).

### Package contents (v1)

| Artifact | Content | Precedent |
|---|---|---|
| `.claude-plugin/plugin.json` | name `nexus-analytics`, version **0.1.0**, own `CHANGELOG.md` | nexus-cpp started 0.1.x |
| `agents/data-analyst.md` + generated `commands/data-analyst.md` | the analyst persona: semantic-model-first navigation, batched-interview intake (all missing questions in ONE message; answered defaults persisted, never re-asked), answer-contract discipline | first extension-shipped agent; `gen-commands.mjs {plugin}` already takes the plugin argument |
| `skills/semantic-model-query/` | the resolution ladder — grain → table, metric → column, dimension → join — with the project's mandatory obligations (bad-reports-excluded, no-gold-tables, large-table bound patterns) as pre-query checks; synonym matching case-insensitive | analytics repo's Column Resolution System + KG's validator obligations (convergent) |
| `skills/mine-semantic-model/` | **RELOCATED IN (owner decision 2026-07-10):** the fifth mine, built + done-check-verified under adhoc-MineSemanticModel in core, moves here wholesale (SKILL.md + 4 references + 7 probes, folder was never committed). One required edit: its four `../mine-verify-cover/references/mine-family-core.md §X` relative pointers become the cross-plugin prose form ("read nexus core's `mine-verify-cover` → mine-family-core reference, §X" — the `mine-verify-cover-dotnet` precedent); content otherwise untouched (its own AC battery — token scoping, stack anchors, BOM, probe carve-outs — travels with it and re-runs at the new path) | owner ruling; domain cohesion |
| `skills/data-investigation/` | the analyst-side "what does this column actually mean" discipline: invoke the sibling `mine-semantic-model` skill (SAME plugin now — plain-name reference) in read-only investigation mode; the skill is usage discipline, the mine is the method | nexus-dotnet's `mine-verify-cover-dotnet` adapter shape |
| `skills/answer-qa/` | the shipped-answer contract: every answer names grain, filters applied (mandatory ones called out), date range, and model constructs used; a missing-obligation answer is malformed | analytics repo's "Bad/invalid reports excluded." response rule, generalized |

### The model contract (resolves proposal Unresolved #2)

All three skills read the model **through the P4 project profile** (`docs/semantic-model/profile.md`
in the consuming repo). The profile's construct-file map may name either representation flavor:
the JSON bundle (KG) or a CSV trio (the analytics repo's grain-routing / metric-dictionary /
dimension-dictionary). The resolution ladder is representation-agnostic — it consumes whatever the
profile maps. **First-consumer onboarding = authoring the analytics repo's profile file** (a
one-time write in THAT repo, operator-owed, out of this slug's edit scope).

### Repo machinery (one-time, in this slug)

0. **Dev-tooling generalization (critic C1/H1 — PREREQUISITE, dev-repo scripts/tests only, no
   `plugins/**` shipped file):**
   - `scripts/gen-commands.mjs` — executed proof: `gen-commands.mjs nexus-analytics` CRASHES
     today (the agent set is a hard-coded 8-role `MAP`, gen-commands.mjs:26-35; ENOENT on
     `architect.md`, exit 1). Generalize: agent set = `readdirSync(AGENTS_DIR)`; per-agent
     `proper`/`desc` = MAP entry when present, else derived from the agent doc — **MAP-as-override
     keeps the nexus output byte-identical** (regression gate: selfcheck's gen-commands drift
     check stays green).
   - `tests/lint/frontmatter.test.mjs` (skills hard-code `['nexus','nexus-dotnet']` :35;
     agents/commands hard-code nexus :18/:52), `wiring.test.mjs` test 4 (`nexus:X` resolution,
     nexus surfaces only :86-90), `skill-refs.test.mjs` — generalize discovery to iterate
     `marketplace.plugins` (release.test.mjs:19 is the in-estate precedent). **Pre-existing-
     violation protocol:** violations the widened net surfaces in OTHER plugins are recorded and
     named in an explicit skip-list — their fixes ride each plugin's own next release (bump
     implications), never this slug.
   - `scripts/selfcheck.mjs` gen-commands drift check — extend from nexus-only to every
     agent-bearing plugin.
1. `.claude-plugin/marketplace.json` — one `{ name, source }` entry (release.test.mjs coverage
   extends automatically — the ONLY lint suite that iterates `marketplace.plugins` today; the
   others get there via item 0).
2. `scripts/gen-omni.mjs` — two edits: `mirrorPlugin('nexus-analytics', 'omni-analytics')` after
   line 102, and the matching `wantPlugins` entry (the twin marketplace array is regenerated,
   never hand-edited in ../omni). Critic-verified: the token swap already produces
   `omni-analytics` / `omni:mine-semantic-model` in twin content, no double-swap.
3. `bump-plugin.mjs` needs NO edit — and **the initial release runs NO apply** (critic H2: apply
   would classify the new files PATCH and bump 0.1.0→0.1.1, breaking AC-1; `--check` verified to
   accept the unbumped scaffold). The 0.1.0 scaffold + its CHANGELOG entry IS the release.
4. Root `README.md` — one line in the plugin list (token-swapped into the omni README by gen-omni).

### Sequencing (REVISED by the owner relocation decision — largely dissolved)

The mine now ships INSIDE this plugin, so the old "build after MineSemanticModel's core release"
gate is gone. **Entry precondition (hard, plan Step 1):** the built skill folder
`plugins/nexus/skills/mine-semantic-model/` exists on disk (untracked — the done-check-verified
adhoc-MineSemanticModel output awaiting relocation); the build MOVES it in. This build touches no
`plugins/nexus/**` shipped content (AC-7) and no core version — it can run CONCURRENTLY with other
core slugs; the only shared-tree courtesy is that the mine's 3 family-registration edits in core
(mine-family-core.md + two siblings, already made) stay uncommitted until a later core PATCH.

## Decisions (extracted; ADR-25 — two-way door, no standalone ADR)

| Decision | Why | Rejected |
|---|---|---|
| Name: `nexus-analytics` (owner pick 2026-07-10, over `nexus-bi`); spec was authored name-parameterized so the pick dropped in mechanically | domain-plain, consistent with the consumer vocabulary; the shortlist + rationale live in the proposal's Unresolved #1 | `nexus-bi` (dated); `nexus-insights`/`nexus-lens` (owner passed); `nexus-analyst`/`nexus-data` (owner rejected earlier) |
| v1 ships an AGENT in an extension (first time) | the persona IS the product for a domain extension; `gen-commands.mjs {plugin}` already supports it | skills-only v1 (an analyst without the interview/answer discipline persona is a toolbox, not a colleague) |
| `data-investigation` invokes the core mine's method — zero file duplication | a copied probe catalog forks the BR1/BR12 rails at the first divergence; the dependency direction (extension → core) is the estate's existing rule | vendoring probe-catalog/runner-contract copies into the extension |
| Model access is profile-mediated, representation-agnostic (CSV trio and JSON bundle are both valid flavors) | serves both proven consumers with one skill; the profile is already P4's seam — reusing it costs nothing new | v1 hard-coded to one representation; forcing the analytics repo to migrate CSVs→JSON before onboarding |
| Version starts 0.1.0 with own CHANGELOG | matches nexus-cpp's precedent for a new plugin; signals pre-1.0 API looseness for v1 | inheriting nexus's version (falsely couples release cadences) |
| Twin = `omni-analytics` via the standard two gen-omni edits | the explicit mirrorPlugin list is the shipped convention (verified at gen-omni.mjs:98-102) | auto-discovery refactor of gen-omni (out of scope; touch the seam, don't rebuild it) |
| Analytics-repo profile authoring is out-of-slug (operator-owed, other repo) | this repo never edits consumers (same rule as the KG-migration exclusion in P4) | bundling a cross-repo onboarding step |
| Dev-tooling generalization (gen-commands, lint discovery, selfcheck drift) folds INTO this slug as a prerequisite step (critic C1/H1) | ~tens of lines across dev scripts/tests, this slug is their first consumer, and a separate slug adds pipeline overhead for no isolation gain; scripts/tests are not `plugins/**` so AC-7 and the bump machinery are untouched | a separate preceding dev-tooling slug; hand-authoring the command as a generated-artifact exception |
| gen-commands generalization = readdir-driven agent set + MAP-as-override | byte-identity for the existing 8 nexus commands is the regression contract (selfcheck drift gate); pure frontmatter derivation would rewrite them | dropping the MAP (breaks byte-identity); keeping MAP-only (the crash) |
| Widened lint net: pre-existing violations in other plugins go to an explicit named skip-list, fixed in each plugin's own next release | fixing them here means bumping stack plugins this slug doesn't own; hiding them means a silent skip | silent narrow-scoping; cross-plugin fix cascade in one slug |
| Initial release ships WITHOUT a bump-plugin apply (0.1.0 scaffold IS the release) | apply verifiably bumps a new plugin to 0.1.1 (PATCH classification), breaking AC-1; `--check` accepts the unbumped scaffold | following release-plugin's apply step verbatim |
| Persona-restore gap accepted for v1 (extension personas don't survive compaction) | restore-agent.js is nexus-scoped (core-owned); AC-7 forbids core edits here | fixing restore machinery in this slug; pretending the gap doesn't exist |

## Acceptance criteria

(Name resolved — all ACs executable as written. Signature greps verified virgin at authoring
time: `nexus-analytics|omni-analytics` = 0 hits outside the proposal's shortlist, no sixth plugin
dir, marketplace has exactly 5 entries, gen-omni has exactly 5 mirrorPlugin calls today.)

- **AC-1** (scaffold): `plugins/nexus-analytics/.claude-plugin/plugin.json` exists, `name` == `nexus-analytics`,
  `version` == `0.1.0`; `CHANGELOG.md` present with a `[0.1.0]` entry.
- **AC-2** (agent + command): `agents/data-analyst.md` exists with the batched-interview and
  answer-contract obligations grep-able (`one message`, `never re-asked`); `commands/data-analyst.md`
  regenerated via `node scripts/gen-commands.mjs nexus-analytics` in the same commit.
- **AC-3** (skills): the three skill folders exist, each SKILL.md with valid frontmatter — linted
  for REAL only after AC-8's discovery generalization (critic H1: today's frontmatter lint
  hard-codes two plugins and would stay green on a malformed file); `semantic-model-query`
  contains the STRUCTURAL ladder signature (critic M3 — bare `grain`/`metric`/`dimension` greps
  are near-vacuous English): the literal phrase `resolution ladder` plus the three arrow forms
  (`grain → table`, `metric → column`, `dimension → join`) and the mandatory-obligation pre-query
  check; `data-investigation` references the RELOCATED sibling mine by plain name
  (`mine-semantic-model`, same plugin — owner relocation), never by a cross-plugin file path
  (grep `\.\./\.\./nexus/` = 0 hits in the extension — now also covering the relocated skill's
  re-worded family pointers); `answer-qa` carries its contract signature (critic M4): `grain`,
  `date range`, `malformed` each ≥1.
- **AC-4** (profile mediation, all three — critic M4): EACH of the three SKILL.mds names
  `docs/semantic-model/profile.md`; `semantic-model-query` additionally states BOTH flavors (JSON
  bundle, CSV trio) resolve through it; zero hard-coded consumer paths (grep
  `omnishelf|fmcg_platform|knowledge-gateway` = 0 hits across the plugin).
- **AC-5** (machinery): marketplace.json lists 6 plugins including `nexus-analytics`; gen-omni.mjs has
  the 6th `mirrorPlugin` + `wantPlugins` entries; `node scripts/gen-omni.mjs` runs clean and
  `--check` passes; root README lists the plugin.
- **AC-6** (estate green): `node --test tests/lint/*.test.mjs tests/unit/*.test.mjs` green
  (release.test's marketplace iteration now covers the new plugin automatically);
  `node scripts/selfcheck.mjs` 5/5.
- **AC-7** (no core bump side-effect): `git diff --name-only -- plugins/nexus/` is EMPTY for this
  slug (the extension must not ride a core version bump; dev-repo scripts + marketplace are
  outside the version-keyed plugin caches).
- **AC-8** (tooling generalization, new — critic C1): `node scripts/gen-commands.mjs
  nexus-analytics` exits 0 and produces `commands/data-analyst.md`; `node scripts/gen-commands.mjs
  nexus` remains byte-identical to HEAD (selfcheck's gen-commands drift check green) — the
  MAP-as-override regression contract.
- **AC-9** (lint coverage is real, new — critic H1; timing split per critic N1): STRUCTURAL half
  (provable at Step 1): `frontmatter.test.mjs`, `wiring.test.mjs` (test 4) and
  `skill-refs.test.mjs` each iterate `marketplace.plugins` (grep the identifier in each file ≥1),
  suite green over current 5-plugin discovery, any pre-existing other-plugin violations recorded
  in the named skip-list (may be empty; may not be silent). COVERAGE half (provable only at
  Step 5, via AC-6): suite green over 6-plugin discovery once the sixth plugin is registered —
  which is also when the new plugin's frontmatter becomes lint-covered (critic N2).

## Out of scope (v1 — recorded forward pointers)

- data-engineer persona; measure/dimension authoring formats; ESTIMATED→MEASURED lifecycle
  (adopt when analyst claims ship to stakeholders); migrating any of the analytics repo's 13
  project-local skills; Sheets/gspread tooling (data/tooling → project); the analytics repo's
  profile authoring (first-run onboarding, operator-owed, that repo); VWH's retail flavor
  (autonomous loop stays there); F60 feedback-loop consumption (arrives via the mine later).
- **Persona restore-on-compact (KNOWN v1 GAP, critic M1):** `register-persona.js` accepts
  `data-analyst`, but `restore-agent.js` resolves roles and bodies from `plugins/nexus/agents`
  only — an extension persona silently drops after a compact. Core-owned machinery; AC-7 forbids
  fixing it here. Forward pointer: a separate nexus-core slug makes register/restore
  plugin-agnostic (discover across all installed plugins' `agents/`).

## Definition review

Shared-artifact pass (marketplace.json, gen-omni.mjs, root README — repo-wide surfaces) — the
**code-grounded critic (Mode 2) is mandatory at plan review**. Known verification items for that
pass: whether `gen-commands.mjs` truly handles a plugin with agents/ but no hooks (nexus is the
only agents-bearing plugin today), whether `frontmatter.test.mjs`'s discovery picks up a sixth
plugin automatically or has a hard-coded pair (its test title says "both plugins" — stale-title
vs stale-glob must be distinguished by reading it), and the omni-twin token swap's treatment of
the new plugin's name. `mine-from-spec`: default-skip — v1 ships discipline prose, not new
rule-shaped behavior born here (the obligations are lifted from two proven consumers).
