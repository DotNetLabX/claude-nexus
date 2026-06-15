# Questions — adhoc-ResearchKB (P2: research-KB)

**Slug:** adhoc-ResearchKB · **Phase:** Architect Phase 1 (Analyze) · **Date:** 2026-06-13
**Inputs:** `docs/proposals/research-kb.md` (P2), `research-system-overview.md`,
`plugins/nexus/rules/research-before-asking.md` (P1, shipped 1.8.2), ADR-1 / ADR-4 / ADR-23.
**Status of pass:** ad-hoc — no spec.md; binding inputs are the P2 proposal + the governing ADRs.

There is no central backlog row to reconstruct from; scope below is taken from P2 and confirmed
against the shipped P1 rule. Two genuine forks need the owner before I write the plan; the rest I
resolved against source (recorded under "Resolved by the architect").

**Update 2026-06-14:** both forks answered **Option A** (below). Pass is ready for Phase 2
(write plan), queued **after** `adhoc-TokenAuditFidelity` (the smaller version-closer).

---

## Q1 — The research engine: self-contained, or wrap the external `deep-research`?

**To:** user (owner ratifies — touches ADR-1)
**Status:** Answered — **Option A (self-contained)**, owner-confirmed 2026-06-14. `search-researches`
is a nexus skill that depends on no non-shipped skill/agent: platform-native `WebSearch`/`WebFetch` +
Claude Code's built-in `Explore`/`general-purpose` subagents only, on the cache-miss path. It does
**not** wrap `deep-research` (a standalone non-nexus skill) or any OMC skill/agent
(`document-specialist`, `autoresearch`) — that is the cross-plugin dependency ADR-1 forbids. This is
the "build our own, don't depend on OMC/external" intent.

P2 says "lead with a skill over the existing `deep-research` engine." Verified against source:
`deep-research` is **not shipped by the nexus plugin** (not in `plugins/nexus/skills/`, not in the
plugin's loaded skill list) — it is a standalone global/user skill. ADR-1 requires the plugin to be
self-contained (the same reason P2 already rules out `omc:document-specialist`). And the shipped P1
rule deliberately describes research engine-agnostically ("web search, fetching and cross-checking
sources") — it never names `deep-research`.

So building `search-researches` *on* `deep-research` would reintroduce exactly the cross-plugin
dependency ADR-1 forbids: a consumer install may not have that skill.

- **Option A (recommended, confidence: high):** `search-researches` is **self-contained** — it
  orchestrates research via the platform-native `WebSearch`/`WebFetch` tools (present in every Claude
  Code session) plus the already-sanctioned `Explore`/`general-purpose` subagents. No dependency on
  any non-shipped skill or agent. Honors ADR-1 and matches P1's engine-agnostic wording.
- **Option B:** Wrap `deep-research` when present, degrade to platform tools when absent. Adds a
  capability-detection branch and a soft external dependency; more surface for no guaranteed gain.

**Recommendation:** A. The local-first recall layer (the load-bearing part of P2) is unchanged either
way; this only decides what runs on a cache *miss*, and a self-contained miss-path is the only one
that ships cleanly to consumers.

---

## Q2 — Delivery shape: skill only, or a dedicated researcher agent?

**To:** user (owner — scope)
**Status:** Answered — **Option A (skill only)**, owner-confirmed 2026-06-14. Ship `search-researches`
as a skill (invokable by po/architect/solo, referenced from the P1 rule); defer a dedicated researcher
agent to a future pass if context-budget pain shows up.

P2 marks this its one **Medium-confidence** open part: "Lead with a skill ... promote to a dedicated
researcher agent only if it needs its own context budget."

- **Option A (recommended, confidence: high):** **Skill only** for P2 — `search-researches`,
  invokable by po/architect/solo, referenced from the P1 rule. A researcher *agent* is a much larger
  surface (new persona + command-gen + frontmatter + ADR-21 spawn-sanctioning + gate interactions)
  and the context-budget pressure that would justify it is unmeasured. Defer the agent to a future
  pass if that pain shows up.
- **Option B:** Ship the researcher agent now.

**Recommendation:** A — ship the skill, keep the agent as a documented future option. Smallest change
that delivers the compounding-recall value.

---

## Resolved by the architect (recorded, not blocking — override if any is wrong)

- **R1 — Two skills, per ADR-4.** `search-researches` (the local-first behavior + output format) and
  a sibling format skill (working name `research-entry-schema`, beside `kb-entry-schema`) for the
  entry fields. Formats-are-skills (ADR-4); P2 explicitly asks for "a skill sibling to
  `kb-entry-schema`."
- **R2 — P2/P3 boundary.** P2 ships **write-time supersede** (Status: superseded, keep the old —
  build-persona Hard rule 8) and a **read-time validity/staleness check** (reconfirm-trigger fired or
  past validity scope ⇒ treat as miss ⇒ re-research). P2 **excludes** heat-tiering, archive
  demotion, periodic GC, and the learner consolidation mode — all P3, which is BLOCKED-on-research.
- **R3 — Recall mechanism.** No embeddings in a plugin: local-first = grep the pool
  (`docs/kb/research/*.md`) keyed on the question, model judges the hit, validity-gate it (R2). An
  optional lightweight index is a plan detail, not a new dependency.
- **R4 — Consumer wiring + bump.** P2 updates the shipped P1 rule (`research-before-asking.md`) to
  route capture/recall through `search-researches` and reference the schema skill. Shipped-file change
  ⇒ **MINOR** bump (new capability) via release-plugin; command regen only if an agent frontmatter
  changes.
- **R5 — Done-condition.** Both new skills exit 0 on `improve-skills/scripts/skill-lint.mjs`
  (ADR-23, born-compliant). The pool folder is never shipped — created lazily in the consumer (ADR-1,
  already P1's behavior).
- **R6 — Slug.** `adhoc-ResearchKB` (standalone-assigned; confirm if you'd prefer another).
