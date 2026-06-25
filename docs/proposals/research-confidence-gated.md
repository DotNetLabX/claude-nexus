# Proposal P1 — Confidence (from assumptions) gates research-vs-ask

**Status:** Ratified (overview: `research-system-overview.md`).
**Delivered:** adhoc-ConfidenceGatedResearch (nexus 1.8.2) — 5 agent files + `agents-workflow.md` + the `research-before-asking.md` rule. Bookkept Ratified 2026-06-22.
**Confidence:** **High** — clear traced pain, builds on three confidence signals already in the
agents, mostly prose wiring, low blast radius.
**Priority:** 1 (smallest surface; the only piece with concrete pain behind it).

## Problem
Confidence already exists as a **passive annotation** in three places (`po.md` ~L102, `architect.md`
~L196 / ~L275 / ~L352) but changes nothing about what the agent *does*. And it's **self-rated**, which
is the deeper bug: in the Stryker case the agent declared NO-GO on an **unconfirmed assumption** ("MTP
not supported") it treated as fact — confidence should have been *low precisely because the claim was
unverified*, and low confidence should have forced research before the verdict.

## Decision

**1. Derive confidence from unconfirmed assumptions, not a self-rating.** Both agents already run a gap
check (PO "Before Writing the Spec"; architect "Gap analysis"). Each gap filled by an assumption the
agent could **not confirm** drops confidence below High — and that assumption *names the research
target*. No vibe ratings; confidence is a readout of the unconfirmed-assumption list. **Conditional:** a
High artifact (no load-bearing unconfirmed assumption) stays silent, as today.

**2. Below-High confidence gates a branch by the shape of the unknown:**

| Unknown | Resolution | Already half-encoded |
|---|---|---|
| **Fact-shaped** (codebase / library / doc fact) | research is the **default action**; cheap → just resolve; expensive/external → recommended option **with a cost estimate** | "never ask the user codebase facts you can look up" — `architect.md` ~L69, `po.md` ~L98 |
| **Preference-shaped** (scope / priority / risk) | **ask**, with the confidence label + recommendation | the existing labelled recommendation |
| **Hybrid** (a preference research would sharpen) | ask, but **offer the research first** | "I can research {X} first?" — `architect.md` ~L70-71 |

**3. Depth dial.** Research cost is unbounded. Cheap codebase fact → resolve silently. Expensive /
external → surface as a recommended option **with a rough cost** (the Stryker agent's "~15 min agent
run" instinct is right). Never auto-spawn deep web research without the offer.

**4. Capture-before-surface.** Whatever the research finds is written to the research-KB (P2) as the
primary deliverable *before* the summary is surfaced — ADR-17 applied to research.

## Allocation
branch + assumption-derived confidence → agent prose (`po.md`, `architect.md`); depth dial → prose;
capture → P2 + ADR-17.

## Builds on
the three existing confidence signals; the existing "don't ask lookup-able facts" rule; ADR-17. Feeds
P2.

## Provenance
Session `researcher-build-persona`, 2026-06-13. Failure mechanism: Stryker NO-GO from an unconfirmed
"MTP unsupported" assumption (overview).
