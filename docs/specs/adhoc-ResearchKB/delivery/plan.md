# Research-KB — `search-researches` (inline recall + forked execution)

**Feature Spec:** None — ad-hoc technical feature. Binding definition: `docs/proposals/research-kb.md`
(P2) + the resolved forks in `docs/specs/adhoc-ResearchKB/delivery/questions.md` (Q1/Q2 + R1–R6) +
the build-shape verdict in `docs/research/2026-06-15-research-capability-skill-vs-agent.md`. Governed by
ADR-1 (self-contained plugin), ADR-4 (formats-are-skills), ADR-23 (born-compliant skills).

## Context

OMC's `document-specialist` agent did our deep research; OMC was uninstalled, so the capability must be
our own and self-contained (ADR-1 — no dependency on OMC or the external `deep-research`). Today the
shipped Research & Confidence Protocol (`research-before-asking.md`, P1/1.8.2) tells po/architect/solo to
research via platform tools and capture findings as a *bare convention* — there is no skill, no enforced
output contract, and no recall. This pass builds the skill: research **compounds** instead of repeating,
and the output is **cited or it doesn't ship**.

Shape (per the 2026-06-15 verdict, revising Q2's "skill only"): **one inline skill** —
- **recall** (cheap): grep the local research pool first, in the caller's context;
- **execution** (expensive, cache miss): spawn a **forked** read-only researcher (own context window) for
  the web dive, so the dozens of searches/fetches don't bloat the caller; it returns a drafted, cited
  entry which the skill validates and persists.

This is the documented best-practice for research skills and mirrors Anthropic's orchestrator-worker
research design at single-researcher scale (fan-out to parallel workers is a budget-gated option, not the
default — the topology costs ~15× tokens).

## Scope

**In:** two new shipped skills — `search-researches` (recall + execution) and `research-entry-schema`
(the entry format) — a deterministic cite-or-drop validator, the consumer wiring into the P1 rule, and a
MINOR release. Self-contained (platform `WebSearch`/`WebFetch` + built-in `Explore`/`general-purpose`
subagents only).

**Out (P3, BLOCKED-on-research):** heat-tiering, archive demotion, periodic GC, the learner consolidation
mode — including **fuller multi-source adversarial corroboration** (the P2 §c single-second-source floor
stays in scope, Steps 1–3). **Out (P4, deferred):** a standalone researcher *agent* persona. **Out:**
embeddings/vector index (R3 — grep-based recall only). No `context: fork` at the skill level (recall must
stay inline); it's a documented future option if execution is later extracted to its own skill.

## Binding vs developer's-call

- **Binding (public surface):** skill names `search-researches`, `research-entry-schema`; the pool path
  `docs/kb/research/{topic}.md` (matches the shipped P1 rule — the *consumer* convention, **not** the dev
  repo's `docs/research/`); the entry schema field set (Step 1); the 8-part output ordering (P2 §c).
- **Developer's call:** internal skill decomposition, the validator's internal structure, the exact
  researcher subagent type (recommend `Explore` — read-only, web-capable, has `WebSearch`/`WebFetch`;
  verify its context-loading behavior in the Step-4 run; `general-purpose` is the alternative).

## Skill Mapping

| Step | Skill | Disposition | TDD | Feature-Specific Inputs | Gap? |
|------|-------|-------------|-----|------------------------|------|
| 1 | improve-skills | Follow | no | schema fields (P2 §b); sibling = `kb-entry-schema`; archetype/frontmatter per omnishelf recipe | — |
| 2 | improve-skills | Follow | no | inline skill spawns a forked `Explore` researcher on miss; 8-part output (P2 §c); pool `docs/kb/research/{topic}.md` | — |
| 3 | (none) | — | yes | every claim needs an inline source; "no source" stated, never invented | Log: no citation-validator skill |
| 4 | (none) | — | no | run on a real fact-shaped question; entry conforms + cite-check passes | — |
| 5 | improve-skills | Follow | no | grep pool keyed on the question; validity gate (R2); write-time supersede | — |
| 6 | (none) | — | no | edit `research-before-asking.md` capture/recall section | — |
| 7 | (none) | — | no | hit / miss / stale-revalidate cycle | — |
| 8 | release-plugin | Follow | no | MINOR (new capability, R4); no command regen (no agent frontmatter changed) | — |

For authoring Steps 1/2/5, consult `improve-skills/references/proven-patterns.md` and the omnishelf source
recipe `D:\omnishelf\omnishelf-docs\.claude\skills\SKILL_AND_AGENT_RECIPES.md` §0 (archetype: this is a
**light** skill — judgment-invoked by po/architect/solo), §1 (element menu), §4 (frontmatter). The
authoring-from-scratch recipe is not yet a shipped nexus reference (that's deferred proposal P5).

## Domain / Data Model Changes
N/A — markdown skills + a JS validator. No .NET domain or persistence surface.

## Implementation Steps

**1. Create the `research-entry-schema` skill (the entry format) + the machine-checkable claim grammar.**
`plugins/nexus/skills/research-entry-schema/SKILL.md`, sibling to `kb-entry-schema`. Fields (P2 §b):
Question-answered (the recall key), Verdict, Evidence tier (`ran-it | read-docs | inferred`), As-of date +
**validity scope (required — no entry without it; if absent the entry is treated as stale)**, Status
(`current | uncertain | superseded`), Reconfirm trigger, **Corroboration (source count; for a high-stakes
verdict, whether a second independent source agreed)**, plus the cite-or-drop and supersede-don't-delete
rules. Body documents the 8-part output ordering (P2 §c: verdict → finding → fix → alternatives-considered
→ caveat → fallback → sources → recommendation+next-probe).
**Define the machine-checkable claim/citation grammar Step 3 enforces:** claim lines under
`## Finding` / `## Fix` / `## Alternatives` each end with an inline `[n]` ref resolving to a `## Sources`
list entry, or the literal token `[no source found]`; `## Sources` entries are linked URLs/paths, never a
bare placeholder (`TODO` / `TBD` / `[source]`). Born-compliant. Follow improve-skills. TDD: no (format
skill; lint is the gate).
Satisfies: P2 §b + R1; ADR-4.

**2. Create the `search-researches` skill — execution path (Increment 1).**
`plugins/nexus/skills/search-researches/SKILL.md`. An **inline, user-invocable** light skill (frontmatter:
`name`, `description`, `user-invocable: true`; recall runs in the caller). On a research need it **spawns a
forked read-only researcher** (`Explore`, via the Agent tool) that runs the web dive in its own context —
`WebSearch`/`WebFetch` only, no OMC/`deep-research` dependency (ADR-1, Q1) — frames the question
**neutrally** (anti-confirmation-bias, P2 §c.4), and returns a draft entry in the Step-1 schema. The skill
then persists it to `docs/kb/research/{topic}.md` (created lazily in the consumer, ADR-1).
**Why imperative spawn, not skill-level `context: fork`:** recall must stay inline (a cheap grep in the
caller), but `context: fork` forks the *whole* skill — it would push recall into the fork too. The
imperative `Agent`-tool spawn (the research verdict's §6 shape) isolates only the dive while keeping recall
in-caller. This is a constraint-driven choice, not a workaround for the (now-Closed) fork bug; skill-level
`context: fork` stays the future option only if execution is split into its own skill.
For a **high-stakes verdict**, the researcher seeks a second independent source and records it in the
Corroboration field (Step 1) — the P2 §c corroboration floor. Default a **single** forked researcher;
fan-out to ~3 parallel workers is a budget-gated option for breadth-first topics only (~15× tokens).
Follow improve-skills. TDD: no (orchestration; validated Step 4).
Satisfies: P2 §a/§c (incl. high-stakes corroboration floor) + Q1 (self-contained) + Q2-revised.

**3. Build the cite-or-drop validator (the enforcement). Depends on the Step-1 claim grammar.**
`plugins/nexus/skills/search-researches/scripts/cite-check.mjs` — a deterministic check the skill runs
before persisting an entry, keyed on the Step-1 grammar: every claim line under
`## Finding`/`## Fix`/`## Alternatives` carries an `[n]` ref resolving to a `## Sources` entry **or** the
literal `[no source found]`; exit non-zero on a claim with neither, on a `## Sources` entry that is a bare
placeholder (`TODO`/`TBD`/`[source]`), and on a **high-stakes verdict whose Corroboration shows a single
source**. This is the **paired enforcement** for the Step-2 prompt obligation (a prompt instruction is a
request, not an enforcement) — the post-generation layer of the three-layer anti-hallucination pattern and
the defense against AP1 dead-letter enforcement. Ships inside the skill so it runs in consumers too.
None (no skill covers a validator). TDD: **yes** — failing test first via the `tdd` skill
(`tests/unit/cite-check.test.mjs`): claim-with-source passes; claim-without fails; explicit
`[no source found]` passes; bare placeholder fails; high-stakes single-source fails.
Satisfies: research verdict §3 (enforced output contract); the prompt-only-obligation plan rule.

**4. Validate the execution path (incl. fork isolation).**
Invoke `search-researches` on a real fact-shaped question; confirm (a) the `Explore` spawn ran in an
**isolated context** — the caller transcript shows only the summarized return, **not** the dozens of
`WebSearch`/`WebFetch` calls (this verifies the context isolation the whole design rests on — the research
verdict's §8 probe, folded in here); (b) a schema-conformant entry is written to `docs/kb/research/`;
(c) `cite-check.mjs` passes on it. Record in `docs/specs/adhoc-ResearchKB/delivery/implementation.md`.
None. TDD: no (live run).
Satisfies: Increment 1 acceptance (P2 §a/§c) + research verdict §8 (isolation probe).

**5. Add the recall path to `search-researches` (inline local-first, Increment 2).**
Extend the skill: **before** any dive, grep the pool (`docs/kb/research/*.md`) keyed on the question, let
the model judge the hit, then **validity-gate** it (R2: if the reconfirm-trigger fired or the entry is past
its validity scope → treat as a miss → re-research via Step 2). On a fresh hit, return it (no fork). On
write, **supersede don't delete** (mark the old entry `Status: superseded`, keep it — build-persona Hard
rule 8). Grep-based only, no embeddings (R3). Excludes heat/GC/learner-mode (P3). Follow improve-skills.
TDD: no (judgment-gated orchestration). Satisfies: P2 §a + R2/R3.

**6. Wire the shipped P1 rule.**
Edit `plugins/nexus/rules/research-before-asking.md` — the "Capture before surface" section: replace the
"bare convention" wording with routing capture **and** recall through `search-researches`, and reference
`research-entry-schema` for the entry shape. Keep the rule engine-agnostic otherwise. Done-condition:
`node --test tests/lint/skill-refs.test.mjs` passes — both referenced skill dirs must already exist
(Steps 1+2) and the references use the exact `` `search-researches` skill `` / `` `research-entry-schema`
skill `` form the lint expects. None (rule prose edit). TDD: no. Satisfies: P2 §a + Q1 + R4 (consumer wiring).

**7. Validate recall end-to-end.**
Re-invoke `search-researches` on the Step-4 question → confirm a **cache hit** (no fork). Force a stale
path (trip the reconfirm-trigger / expire the validity scope) → confirm it re-researches and supersedes the
old entry. Record in implementation.md. None. TDD: no (live run). Satisfies: P2 §a + research verdict §8.

**8. Born-compliant lint + release.**
Both new skills exit 0 on `plugins/nexus/skills/improve-skills/scripts/skill-lint.mjs` (ADR-23) and the
**full `node --test` suite (unit + lint) is green** (cite-check test + the existing frontmatter/skill-refs/
wiring lints). Then run the release: **MINOR** bump + CHANGELOG via the `release-plugin` skill
(new capability — owner-escalated per R4; `node scripts/bump-plugin.mjs --minor`). No `gen-commands` regen
(no agent frontmatter changed). Per the dev-repo CLAUDE.md, commit the bump in the same commit as the
change, then run `gen-omni.mjs` so the twin rides along. Follow release-plugin. TDD: no.
Satisfies: R5 (lint done-condition) + R4 (MINOR bump); ADR-23.

## Testing Strategy
Unit-test the deterministic `cite-check.mjs` (Step 3, TDD-first): claim-with-source passes, claim-without
fails, explicit "no source found" passes, bare placeholder fails. The skills themselves are validated by
the live runs (Steps 4 + 7) against fixed acceptance (entry conforms, cite-check passes, hit/miss/stale
behave) — they orchestrate non-deterministic research, so no unit tests on the orchestration. Lint (Step 8)
is the structural done-condition for both skills.

## KB Impact
None in the dev repo. The skill creates the `docs/kb/research/` pool **lazily in the consuming project**
(ADR-1) — it is never shipped. (This pass's own research capture lives at
`docs/research/2026-06-15-research-capability-skill-vs-agent.md`, the dev repo's separate convention.)

## Open Questions
None blocking. Forks resolved (Q1 self-contained, Q2 revised to inline-skill+forked-execution); fork
mechanism decided (imperative spawn, not skill-level `context: fork`); researcher subagent type is the
developer's call (recommend `Explore`).

## Plan Review (critic, code-grounded, 2026-06-15)

Mode 2 ad-hoc plan review by the `nexus:critic` (read the live skill estate, not just the plan). Verdict:
**REVISE** — every P2 requirement and R1–R6/Q1/Q2 decision mapped, ADR citations real, scripts/lints it
leans on confirmed present, scope clean (no P3/P4 leakage, no OMC/deep-research dependency). Three HIGH +
three LOW/MEDIUM findings, all folded in:

- **H1 — fork decision vs probe (Step 2/4).** Plan pre-committed to imperative-spawn (the verdict's §6
  *fallback*) and dropped the verdict's §8 isolation probe. Fixed: Step 2 now states the recall-inline
  rationale that *forces* imperative-spawn (not a fork-bug workaround); Step 4 folds the probe in as a
  pass/fail isolation acceptance criterion.
- **H2 — cite-check had nothing deterministic to assert (Step 1/3).** The validator depended on a
  claim/citation grammar the schema never defined (AP1 dead-letter risk). Fixed: Step 1 now defines the
  machine-checkable grammar (`[n]`→`## Sources` or `[no source found]`); Step 3 keys on it and declares the
  dependency.
- **H3 — P2 §c high-stakes corroboration silently dropped.** Fixed: added a Corroboration field (Step 1),
  a single-second-source floor (Step 2), a cite-check fail on a high-stakes single-source verdict (Step 3);
  fuller multi-source adversarial corroboration explicitly deferred to P3 (Scope/Out).
- **M4 — undeclared skill-refs lint coupling (Step 6).** Fixed: named `tests/lint/skill-refs.test.mjs` as
  the Step-6 done-condition with the exact reference form.
- **L5 — "Explore skips CLAUDE.md" unverified.** Fixed: softened to a verify-in-Step-4 note.
- **L6 — Step 8 omitted the full suite.** Fixed: full `node --test` green is now a Step-8 done-condition.
- Minor (resolved in-line): validity-scope is now a required field (absent ⇒ stale); cite-check ships
  inside the skill so it runs in consumers.
