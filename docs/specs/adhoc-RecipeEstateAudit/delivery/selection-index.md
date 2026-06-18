# Selection Index (DRAFT) — "situation → recipe + gate"

**Phase 1 deliverable · adhoc-RecipeEstateAudit · 2026-06-17**
The missing navigation layer: ADR-2 says *where* knowledge lives (rules / inlined protocol / skills /
project docs); nothing said *which recipe to reach for in situation X*. This is that map. **Placement is
an open question** (new skill vs. a section in the architecture README vs. a rule) — resolved at build
time; this is the content draft.

Full per-item inventory (21 skills / 11 rules / 7 named gates) is in the inventory sweep record; the
decision content is the routing table and the ambiguity tie-breakers below.

## The routing table

| When you are… | Reach for | Gate / capture that applies |
|---|---|---|
| facing a **fact-shaped unknown** (library capability, does-this-approach-work, what-a-spec-decided), inline in a conversation | `search-researches` (recall first → forked dive → **capture before surface**) | `cite-check`; entry written to `docs/kb/research/` *before* you answer |
| doing a **landscape / competitive / multi-stream scan** (breadth) | the built-in **`deep-research`** workflow (purpose-built for fan-out + adversarial synthesis) | ⚠ emits a report, **does not** write a pool entry — outside the pipeline. If a specific fact from the scan must be captured, run `search-researches` on that fact afterward |
| wanting a **standalone deep multi-source research report** (not pipeline capture) | the built-in **`deep-research`** workflow (user-invocable only; gated by CLI version / plan) | ⚠ report, no pool entry; ADR-1 keeps `search-researches` decoupled from it — it is a Claude Code BUILT-IN, **not** an external/OMC harness |
| shaping a **product** feature (the what / why) | `create-feature-spec` (PO) | spec-review gate before `Status: Ready` |
| shaping a **technical** feature (no product "what") | architect defines: tech-spec + extracted ADRs (ADR-27) | master gate (ADR-25) sizes the artifact |
| spec is `Ready`, need the **how** | `create-implementation-plan` (architect) | critic Mode 2 (plan vs spec / ADR register) |
| writing any **pipeline artifact** | the matching `*-format` skill | some auto-load via frontmatter; the rest are on-demand (see gap below) |
| just **touched a file**, want adjacent cleanup | `boy-scout` (in-file, always reports) — or `simplify` (diff-scoped) | — |
| a **build error persists / test fails oddly** | `diagnose` | after the first obvious attempt, before the 3-attempt escalation |
| a **skill misbehaves or underdelivers** | `evaluate-skill` (judge → findings) **then** `improve-skills` (apply) | skill-lint gate at the end |
| **consolidating lessons** | `learner` → `improve-flow` (flow) / `improve-skills` (skills) | approval gate: classify → approve → promote |
| **plugin source changed** | `release-plugin` (bump in same commit) | CI bump-gate (ADR-9) |

## Ambiguity tie-breakers (the 6 clusters)

These are where an agent reaches for the wrong tool. The index above encodes the resolutions; stated
explicitly here:

- **A · research routing (the incident that started this).** `search-researches` = inline, pipeline,
  **captures** a fact-shaped unknown to the pool (recall first → forked dive → cited entry before you
  answer). For a **breadth-first landscape / competitive scan**, reach for the built-in **`deep-research`**
  workflow — it is purpose-built for fan-out and adversarial synthesis (`search-researches` stays the
  single-fact, captures-to-the-pool path; its fan-out is only a budget-gated option, never the sanctioned
  breadth mode). `deep-research` is a Claude Code **BUILT-IN workflow** (user-invocable only, gated by CLI
  version / plan), **not** an external/OMC harness; it emits a report and writes **no** pool entry —
  outside the pipeline, decoupled per ADR-1. Bare generic/Explore agent for a fact-shaped unknown =
  **wrong** — it captures nothing and skips recall. Default for any pipeline fact-capture →
  `search-researches`.
- **B · spec authorship.** `create-feature-spec` (product, PO-owned) vs. architect technical definition
  (ADR-27). The split is product-"what" vs. technical-"how"; PO owns the former, architect the latter.
- **C · evaluate vs. improve skills.** `evaluate-skill` **diagnoses** (severity-rated findings);
  `improve-skills` **applies** the fix (and ends in skill-lint). Order: evaluate → improve. They are not
  interchangeable despite both mentioning "fix."
- **D · `*-format` auto-load gap.** `implementation-format`, `questions-format`, `lessons-format`,
  `review-format` are frontmatter-preloaded onto their producer agents; `proposal-format`,
  `kb-entry-schema`, `research-entry-schema`, `summary-format` are **on-demand only** — an agent writing
  a proposal or KB entry has no auto-load signal and must remember. **Resolved (2026-06-18): document the
  on-demand expectation, do NOT preload the missing four.** The research verdict (minimize always-on
  weight at our tool count) makes adding four resident format skills the wrong move; the on-demand four
  stay on-demand. Who reaches for each: `proposal-format` → po/architect/solo writing a proposal under
  `docs/proposals/`; `kb-entry-schema` → any agent writing a KB entry under `docs/kb/`;
  `research-entry-schema` → the forked researcher in `search-researches` drafting a pool entry;
  `summary-format` → the team lead closing a pipeline run. Each agent invokes the matching `*-format` skill
  by name when it writes that artifact — there is no auto-load, by design.
- **E · boy-scout vs. simplify.** `boy-scout` = in-file adjacent improvements, always emits a report;
  `simplify` = diff-scoped cleanup. Scope is the tie-breaker.
- **F · diagnose timing.** Reach for `diagnose` after the first obvious fix fails — before the
  3-attempt circuit-breaker escalates, not after.

## Placement — RESOLVED by research (2026-06-17)

Cited: `docs/kb/research/agent-tool-selection-discoverability.md` (cite-checked). The medium-confidence
"fold the whole table into always-on rules" lean was **wrong**; the evidence points to a **two-phase
hybrid**, which is also what Claude Code's skill system already is:

1. **The always-on metadata layer is the skill `description` frontmatter** — already injected every
   session, already what agents route on. The **highest-ROI fix is raising the quality of those
   descriptions/triggers**, not adding a parallel index. The audit's vague-trigger + stale-framing +
   ambiguity findings map directly onto the six-component description rubric. At our active tool count
   (~30 nexus + ~35 dotnet + MCP + built-ins, past the ~20–30 threshold where always-on injection starts
   to degrade from context-rot / lost-in-the-middle), dumping a big table into always-on rules would hurt.
2. **A compact always-on tie-breaker pointer** — only the genuinely-ambiguous clusters (research routing
   first) as situation→skill one-liners, placed near the **top** of the always-on rules (primacy beats
   lost-in-the-middle).
3. **The full routing table stays on-demand** (this doc / a skill) — loaded when needed, not resident.

So the "selection index" build is really: (a) tighten skill `description` triggers to the rubric,
(b) add the compact tie-breaker pointer up top, (c) keep this full table on-demand. Cluster A is
incident-confirmed and locks down first, converging with the research-capture trio.

## Status

DRAFT — content complete; placement resolved (above). Ready to feed the Phase-3 build plan.
