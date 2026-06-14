---
name: proposal-format
description: RFC-lite front-matter and section order for proposals under docs/proposals/. Load when writing or revising a proposal so the NABC sections, ratification front-matter, and impact/effort ranking signals stay consistent. The lifecycle rules (who ratifies, graduate-to-spec) live in ADR-28 — this skill is the format only.
---

# Proposal Format

RFC-lite shape for every `docs/proposals/*.md` entry. A proposal is **not a decision** — it gathers
feedback and a **named owner ratifies** it. This skill defines the **front-matter + section order**
only; the **lifecycle rules** (named-owner ratification, confidence-from-P1 gating, Mode-0 critic,
graduate-to-spec) live in **ADR-28** (`docs/architecture/README.md`). Follow the ADR for *when* and
*who*; follow this skill for *shape*.

The proposal extends P2's research-output format — the only proposal-layer additions on top of it are
`Impact` and `Effort` (recommendation, confidence, and alternatives are the research engine's, reused
not re-decided).

## Front-matter (required, at the top)

```markdown
# Proposal — {Title}

**Status:** Draft | Ratified | Superseded
**Decision-maker:** {named owner who ratifies — a person, not "the team"}
**Recommendation:** {the recommended choice, in one line}
**Confidence:** High | Medium | Low — {one-line basis; derived from unconfirmed assumptions per P1, never self-rated}
**Impact:** {1-10 — product/user impact; may be omitted ONLY on the master-gate "one ADR line" path — see Impact/Effort rule below}
**Effort:** low | med | high
**Date:** {YYYY-MM-DD}
```

Front-matter rules:
- `Status:` starts at `Draft`. It moves to `Ratified` only by the named decision-maker (ADR-28), and to
  `Superseded` when a later proposal replaces it — supersede, never delete or rewrite the record.
- `Confidence:` is derived from P1 (`research-before-asking.md`), not self-assigned. **Below-High
  confidence means the recommendation is "research first" (the P1 research branch), not a go/no-go to
  ratify** (the anti-regression rule, ADR-28). Only High-confidence proposals are ratifiable.
- `Impact` and `Effort` give the backlog its ranking: a ratified proposal becomes a backlog row ordered
  by impact / effort (ADR-29). Keep `Effort` to the three buckets — it is an appetite signal, not an
  estimate.
- **Impact/Effort rule (reconciles the master gate with backlog ranking, ADR-25/ADR-28/ADR-29):** a
  proposal that **omits `Impact`** is the master-gate **"one ADR line"** path (ADR-25) — a small,
  pure-internal-plumbing decision recorded directly, which does **NOT** enter the ranked backlog. **Any
  proposal that becomes a backlog row MUST carry both `Impact` and `Effort`** — that is what gives the
  row its impact ÷ effort rank (ADR-29). So Impact is optional only for the not-ranked, record-only
  path; the moment a proposal is destined for a backlog row, both fields are required.

## Body sections (required — NABC + Unresolved, in this order)

```markdown
## Need
The problem, why now, and what is explicitly out of scope.

## Approach
The proposed solution. How it works, where it lives.

## Benefits
What this buys — for the user, the system, or the pipeline.

## Alternatives
Other options considered and why each was not chosen. Neutral framing — this is the
anti-confirmation-bias section (P2 already requires it); a proposal with no real alternatives is a
decision wearing a proposal's clothes.

## Unresolved
Open questions a reader (or the ratifier) still needs answered before this can be ratified.
```

## Optional sections

```markdown
## Graduate-to-spec
On ratification this proposal graduates (ADR-28): a technical proposal is promoted to a tech-spec with
ADRs extracted; a product proposal is handed to the PO as the spec seed. Note which branch applies and
where it goes.

## Provenance
Session, date, and what fed this proposal (prior research, a traced incident, a related proposal).
```

## Rules

- Section order must match the schema above — NABC then Unresolved. Readers and the ratifier scan by
  heading name.
- The front-matter block sits at the very top, right under the `# Proposal — {Title}` line.
- `## Need` carries the problem and the out-of-scope boundary; `## Alternatives` carries the options not
  taken. Do not merge them — the master gate reserves ceremony for high-stakes, and a clear Need is what
  lets a reviewer apply it.
- This skill is the **format**. For the ratification gate, the confidence rule, the Mode-0 critic
  (default-skip; user confirmation is the gate), and graduate-to-spec semantics, follow **ADR-28** — do
  not restate those rules here.
- This is a **dev-repo / proposal-authoring** format. Existing freeform proposals keep their `Status:`
  until an operator adopts this front-matter; the skill applies to new and revised proposals.

## Consumers

| Agent | Uses | Impact |
|-------|------|--------|
| Architect | Front-matter, Need, Approach, Alternatives | Recommends + sets confidence; below-High routes to research-first |
| PO | A ratified product proposal as the spec seed | Shapes it into `spec.md` (the product branch) |
| Team Lead | Status, Impact, Effort | A ratified proposal becomes a backlog row ranked impact / effort (ADR-29) |
| Owner | The whole proposal | Ratifies (Draft to Ratified) — the named decision-maker, never an agent |
