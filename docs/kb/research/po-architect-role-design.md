# po-architect-role-design

## How do software organizations and multi-agent AI dev frameworks design the PO vs architect roles — questioning stance, decision-authority boundary, and mechanisms against silent architecture decisions?

**Verdict:** The architect role is consistently designed as a non-adjudicative collaborative partner (trade-offs, not verdicts; no veto), the challenger/questioning function belongs to the product role (best practice = active challenger; weaker frameworks make it a passive elicitor), and silent decisions are countered not by more questioning but by a mandatory decision-disclosure artifact (ADR / alternatives-considered / BMAD's spine, where an un-decided dimension is a reviewable defect).
**Evidence tier:** read-docs
**As-of:** 2026-07-06
**Validity scope:** Surveyed frameworks as of their current main branches (BMAD-METHOD v6.9, GPT-Pilot main with architect veto still an unimplemented TODO, MetaGPT per ICLR-2024 paper); human-org doctrine (ADR, RFC sections, Amazon door framing) is stable and slow-moving.
**Status:** current
**Reconfirm trigger:** BMAD major version past v6, or GPT-Pilot implementing its `revise_spec` architect-veto TODO, or 2027-07 passing (fast-moving agentic-framework field).
**Corroboration:** high-stakes — 22 sources fetched, 25 claims each confirmed by a 3-vote adversarial panel (0 refuted); a second independent source agreed on every core verdict (architect-as-collaborator is backed by 4 independent primaries: BMAD config, GPT-Pilot source, MetaGPT paper, SVPG).

## Verdict

Organizations and agentic frameworks converge on a two-part design: the product role owns discovery and challenge, the architect owns technical shaping as a collaborator — and where the field worries about silent decisions, the remedy is a disclosure artifact (a decision record with rationale and rejected alternatives), never a stance change on the architect. The strongest implementations treat "a dimension was never explicitly decided" as a defect a reviewer can flag.

## Finding

- Across human-org doctrine and all surveyed AI frameworks, the architect/technical-design role is a NON-adjudicative collaborator — designer, translator, trade-off partner — never a challenger; GPT-Pilot's architect literally has no veto path (non-blocking "Continue" button only) [5].
- The product role's stance varies by maturity: modern requirements-engineering doctrine (IREB) prescribes an ACTIVE CHALLENGER that "challenges stakeholders' perceptions on any assumed solutions" [1].
- BMAD-METHOD deliberately encodes the contrast: its PM (John) has communication style "Detective's 'why?' relentless" with "PRDs emerge from user interviews, not template filling", while its Architect (Winston) "answers with trade-offs, not verdicts" [2].
- GPT-Pilot's spec-writer is a sequential elicitor ("Ask questions ONE BY ONE") and MetaGPT's Product Manager analyzes given requirements into a PRD with no interview-back step — passive elicitors, not challengers [4].
- MetaGPT's PM/Architect split is disclosure-by-artifact: mandatory structured outputs (PRD; File Lists, Data Structures, Interface Definitions) exchanged through a shared message pool with role-based subscription [3].
- The product/architecture authority boundary is drawn at the PRD hand-off: product owns WHAT (PRD), architecture owns HOW (design doc), run as parallel side-by-side artifacts [6].
- The canonical anti-silent-decision mechanism is the ADR: it records the decision AND rationale AND ruled-out alternatives for architecturally significant choices, accumulating into a decision log [10].
- Microsoft's Azure Well-Architected Framework names the exact failure mode: "A decision that's made but never recorded will likely be forgotten, leading to repeated debates or later changes that unknowingly contradict the original intent" [9].
- "Alternatives considered" is a mainstream fixture of major RFC/design-doc templates (Google "Alternatives considered", HashiCorp "Abandoned ideas", Couchbase/RazorPay "Alternatives") because it forces authors to disclose rejected options [6].
- BMAD v6.9's ARCHITECTURE-SPINE goes furthest: a breadth-coverage rubric requires every altitude-owned dimension to be marked decided / deferred / open, with an opt-in reviewer gate that treats any silently-skipped dimension as a finding [2].
- Amazon's doctrine calibrates decision process by reversibility: one-way-door decisions get slow careful analysis, two-way-door decisions get a lightweight process, and "disagree and commit" unblocks conviction-without-consensus — a velocity/calibration mechanism, not a transparency one [7].
- The one-way/two-way door definition and "walk through two-way doors on reasonable evidence" prescription are primary-sourced from AWS's Day-1 culture material [8].
- Marty Cagan's SVPG model casts the architect as a collaborative contributor to product discovery alongside PMs — not a gatekeeper [11].

## Fix

- Keep the nexus split as-is: PO = challenger-interviewer, architect = collaborative partner — it matches both best-practice human doctrine and the strongest agentic framework (BMAD) [2].
- Close the silent-decision gap with a disclosure artifact, not a stance change: a mandatory `## Decisions` section in plan.md (decision + rationale + rejected alternative) is a lightweight ADR, the field's canonical remedy [9].
- Adopt the decided / deferred / open trichotomy for judgment calls so "never explicitly decided" becomes greppable and reviewable, per BMAD's spine rubric [2].
- Calibrate which decisions need disclosure by reversibility (one-way vs two-way door) — nexus's ADR-25 master gate already encodes this axis, so reuse it as the trigger for a Decisions row [7].

## Alternatives

- Making the architect a challenger like the PO — rejected: no surveyed system (human or agentic) does this; the challenge function is consistently vested in the product role or a separate reviewer gate [2].
- Leaving decision disclosure to prose judgment ("surface judgment calls") without an artifact — rejected: the unrecorded-decision failure mode is explicitly named against exactly this, and prescribed remedies are structural (ADR/spine), not behavioral [9].
- Relying on more upfront questioning to eliminate silent decisions — rejected: questioning governs open unknowns; the failure mode at issue is confidently-resolved calls, which only a record surfaces [10].

## Caveat

The human-org stance findings (product-as-challenger; PRD-vs-design-doc boundary) each rest on a single authoritative secondary source (IREB magazine; Pragmatic Engineer) — medium confidence. The BMAD spine claims passed verification 2-1: the reviewer gate is opt-in, "decision blocks" is the claimant's gloss (BMAD says "altitude-owned dimensions"), and v6 generates epics/stories after architecture. Several "architect is not a critic" claims are inferential negatives (grounded in the demonstrable absence of any pushback/veto mechanism, but beyond literal prompt text). No claims survived for CrewAI, ChatDev, or OpenHands — coverage gap, not evidence of absence. No empirical data exists on whether prescribed transparency artifacts actually reduce unrecorded decisions in practice (prescription ≠ measured effectiveness).

## Fallback

If the verdict proves wrong or the trigger fires, re-run a scoped low–medium dive on the specific moved target (the one framework or doctrine that changed) rather than repeating the breadth scan; the open questions below name the probes.

## Sources

[1] https://re-magazine.ireb.org/articles/requirements-elicitation-in-modern-product-discovery
[2] https://github.com/bmad-code-org/bmad-method
[3] https://arxiv.org/html/2308.00352v6
[4] https://github.com/Pythagora-io/gpt-pilot/blob/main/core/prompts/spec-writer/ask_questions.prompt
[5] https://github.com/Pythagora-io/gpt-pilot/blob/main/core/agents/architect.py
[6] https://blog.pragmaticengineer.com/rfcs-and-design-docs/
[7] https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders
[8] https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/
[9] https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record
[10] https://adr.github.io/
[11] https://www.svpg.com/the-architect-role/

## Recommendation

Adopt the "declare, don't ask" design for the nexus architect: keep the partner stance, add a mandatory `## Decisions` plan section (decision + rationale + rejected alternative, one row per self-resolved judgment call, triggered by the ADR-25 reversibility lens) and surface "Decisions taken: N" at the checkpoint report — this is the field-canonical ADR/spine mechanism at plan scale. Next probes if the question reopens: (a) gray-zone arbitration — who arbitrates when a product decision has architectural consequences; (b) empirical effectiveness of ADR-style artifacts against decay; (c) CrewAI/ChatDev/OpenHands role designs; (d) whether any agentic framework operationalizes one-way/two-way-door routing of decisions to heavier review.
