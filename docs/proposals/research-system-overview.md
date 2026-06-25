# Proposal — The research / persona system (overview)

**Status:** Ratified — index (raised 2026-06-13, session `researcher-build-persona`).
**Delivered:** the research engine shipped — ADR-26 + P1 (adhoc-ConfidenceGatedResearch 1.8.2) + P2 (adhoc-ResearchKB 1.10.0, adhoc-NexusResearch 1.14.0). P3/P4/P5 remain Draft (see those files). Bookkept Ratified 2026-06-22.

Five related proposals, one per file, that add a **research capability** to the pipeline and a
**persona calibration layer** beside it. Written separately so each can be ratified, sequenced, and
built on its own.

## The engine (one shape, four feeds)

> capture → tier + cite + date → supersede-don't-delete → **recall before acting**

This engine already runs **twice** in the ecosystem — the `learner` over `lessons.md`, and omnishelf
`build-persona` over people. These proposals add two more feeds (**research**, and a **Nexus
persona**), not a new paradigm.

## Motivating case (traced, this session)

The `.NET 10` Stryker smoke test returned **NO-GO** — "mutation testing doesn't work on this stack."
Research flipped it to **very-likely-GO**. The NO-GO was *self-inflicted*: the agent's own csproj
carried the assumption **"MTP not yet supported by Stryker 4.14"** — which was **false** (the MTP
runner shipped in 4.13; the project was on 4.14.2, so the fix was already installed and unused). An
**unconfirmed assumption, treated as fact, produced a confident wrong verdict.** Each proposal traces
to preventing one part of that:

- the assumption should have made confidence **low** (P1) → which should have triggered **research
  before the verdict** (P1);
- the research result should be **captured and recalled** so the next xUnit-v3 question is free (P2);
- the finding **decays** (the MTP runner is preview; issue #3424 could bite) — so the entry needs
  validity + supersede (P2/P3);
- and the research must be **exploration, not hypothesis-confirmation** — the owner's open question on
  the run was *"did the agent search for other solutions, or just validate the proposed one?"* (now a
  required format rule in P2).

## The proposals

| # | File | Topic | Confidence | Priority |
|---|---|---|---|---|
| P1 | `research-confidence-gated.md` | Confidence (from assumptions) gates research-vs-ask | **High** | 1 |
| P2 | `research-kb.md` | `search-researches` (local-first) + entry/output schema | **High** (Medium on agent-vs-skill) | 2 |
| P3 | `research-kb-retention.md` | Retention / eviction (heat vs validity) — **research-first** | **Low** — the signal it needs research | after P2 |
| P4 | `persona-for-nexus.md` | Persona as the ask-vs-decide calibration layer | **Medium** (high drift-risk) | last |
| P5 | `skill-authoring-recipe.md` | Extract omnishelf §0/§1/§4 → `improve-skills` reference | **High** | independent |

P3's **Low** confidence is the system eating its own dog food: low confidence on a knowable unknown ⇒
research before building, not build-then-discover.

## Provenance
Session `researcher-build-persona`, 2026-06-13. Engine modeled on omnishelf `build-persona` +
`kb-sync`. Stryker case from this session's smoke-test + follow-up research (stryker-net #3117/#3237,
the MTP-runner blog).
