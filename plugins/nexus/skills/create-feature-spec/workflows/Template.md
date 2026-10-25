# Feature Spec Template

Use this template for every `docs/specs/{slug}/definition/spec.md` file (or `epic.md` for epics, `bug.md` for bugs). Omit sections marked "if applicable" when they don't apply. Do not add sections beyond this template.

---

```markdown
# {Feature Name}

**Traces to:** `docs/product/index.md` §{section numbers}
**Source:** Scratch | Jira {TICKET-KEY}
**Dependencies:** {features or aggregates that must exist first, or "None"}
**Status:** Draft | Ready | Done
**Model:** {your own model's exact id, self-reported from your system context — write "unknown" if unstated, never the model you were dispatched as; see agents-workflow.md § Artifact Formats}
**Plan:** `docs/specs/{slug}/delivery/plan.md` | None
Rule list: `docs/specs/{slug}/definition/spec-rules.md` (stamped) — or, where there is none, the line that says why: `Rule list: not applicable — {reason}` (the spec commits to no rule-shaped behavior), `Rule list: not landed` (the review ended before the list did; the close mines the final spec), `Rule list: not available — mining skills not installed`. *Written without bold, so the header line is the exact text agents search for; omit while drafting.*

---

> **Revision (YYYY-MM-DD) — Pending:** One-paragraph summary: what changed, why, what's already implemented, and where the implementation delta is. Include enough detail that the architect can plan only the delta — not re-plan the entire feature. Status is `Pending` (not yet implemented) or `Implemented` (done). Stack multiple revisions in reverse chronological order (newest first). The architect plans only `Pending` revisions; mark `Implemented` when the pipeline completes. *Only add when revising a spec that already reached `Status: Ready`. Omit during initial creation.*

---

## Purpose

Why this feature exists in the product. One paragraph max. Reference the product spec for broader context — don't repeat it.

## Entities

Domain concepts this feature introduces or extends. Only what this feature owns — don't repeat entities owned by other features.

For each entity, specify:
- Fields with types and constraints (required, max length, unique)
- Relationships in domain language ("A Team belongs to one creator", not FK column names)
- Creation rules ("only created through a factory that enforces X" — without naming the method)

Do not include: persistence details (cascade behavior, collation, index types, migration names), constructor visibility, base class names, or interface names. Those belong in the plan.

Reference the product spec (`docs/product/index.md`) section that owns the canonical entity definitions.

## User Flows

Numbered step-by-step interactions. One flow per distinct user journey.

```
Flow 1: {Name}
1. User does X
2. System responds with Y
3. ...
```

## API Surface

| Method | Route | Auth | Request body | Response | Status codes |
|--------|-------|------|-------------|----------|-------------|
| | | | | | |

For each endpoint, specify error responses and their conditions.

## Real-time Events

*Omit section if this feature produces no real-time events.*

| Event | Payload | Trigger |
|-------|---------|---------|
| | | |

## Business Rules

Numbered list. Each rule is enforceable and testable. State rules in domain language — "email comparison is case-insensitive", not "uses `StringComparer.OrdinalIgnoreCase`". Describe what the system guarantees, not how the code enforces it.

Each rule ends with its source, in italics in parentheses — `*(Source: {kind} {reference})*` — one of six kinds:
- `ticket` — the tracker item, or its quoted text in the spec's source notes;
- `contract` — a counterpart's written contract, such as a platform comment;
- `owner` — an owner answer: a question id, or the conversation and its date;
- `document` — any written source in the repo, by path and section: a product document, an ADR, a ratified proposal;
- `pattern` — the existing pattern the owner said to mirror, by name;
- `added` — no source: the spec's author or a reviewer added it.

A rule built from two sources lists both, separated by `;`. A rule its source covers only in part is split in two: the covered part keeps its source, the rest is `added`. Where the ticket and the mirrored pattern disagree, the ticket wins: the rule cites the ticket, never the pattern. An `added` rule keeps the spec from Ready until the owner keeps or drops it: a kept rule reads `Source: added — kept by owner {YYYY-MM-DD}`, and a dropped one leaves this list for `## Out of Scope`, its reason `dropped at the owner's keep-or-drop`. The check `spec-sources.js`, beside the plugin's `verify-run.js`, lists every rule with no source and every `added` rule not yet kept; a main-session write that marks the spec Ready with one of them is refused.

1. Team names are unique, compared without regard to case. *(Source: owner, Q4)*
2. A deleted team's name can be reused at once. *(Source: added)*

## Technical part

*Optional — omit the section when no architect adds one. Written by the architect for its own team only, from its own code repository: a few high-level points, with no class-level detail, no step list and no plan. It is the only section that may name a code fact, and the only one the architect writes.*

## Decisions and why

*Keep this section in `spec.md` and `epic.md`; leave it out of `bug.md`.*

The why behind this document's decisions — the owner's reasons, what was turned down and the fact each decision rests on — so a run without the owner decides as the owner would, and stops where a decision no longer holds. When an agent follows or stops on an entry is `rules/on-demand/agents-workflow.md` § Decision entries; this section owns only the entry's shape.

Two kinds of entry: an **owner ruling** (`By: owner`), and a **writer's decision** — a question the PO or architect resolved itself by recommendation, still listed for the owner as today, its `By` naming the role that decided and never presented as the owner's.

An owner ruling gets an entry when (a) the owner gave a reason in words, (b) the owner chose something other than the recommendation — another listed option or an answer of their own, (c) a discussion settled it, or (d) it changes a decision that already has an entry, even by a plain pick. A plain pick of the recommendation with no words gets no entry: the document's text already carries the outcome.

Entries are numbered `D1`, `D2`, … (`P1`, `P2`, … in a plan), and every reference names its document with the id — `spec D3`, `plan P2`, `epic D1`. A changed decision adds a new entry and sets the old one's State to `replaced by {reference}`; no entry is ever deleted. With no entry, the section reads exactly `None — no ruling carried the owner's reason.` The owner is never asked to review this section.

### D1 — {decision}
- **By:** `owner`, or the role that decided (`PO`, `architect`)
- **Decided:** the outcome, in one line
- **Why:** an owner ruling quotes the owner verbatim; where the owner gave no reason, the writer's explanation, marked `PO's reading` or `architect's reading`; a writer's decision gives the writer's reasoning — never an invented owner reason
- **Turned down:** each option not taken, with its reason in a few words where one was given — or `none offered` where there were no alternatives
- **Rests on:** the fact that, if it changes, reopens the decision — or `none — a preference` where nothing outside the owner's preference supports it
- **Confidence:** high | medium | low — {one-line why}: how sure the decider is, for an owner ruling and a writer's decision alike; an entry written before this part has none, and a reader takes it as missing
- **Source:** the question's number in the feature's `questions.md`, the date of the discussion, or the architecture decision record a ruling of wider reach was routed to
- **State:** `current`, or `replaced by {reference}`

## Acceptance Criteria

Checklist format. Each item is an observable outcome — something a tester can verify from the outside without reading source code. Name endpoints and HTTP status codes, not classes or methods.

- [ ] {Criterion}
- [ ] {Criterion}

## Out of Scope

What this feature explicitly does NOT include. Each item has a reason.

- **{Thing}** — {why it's deferred}

## Open Questions

*Omit section if all questions are resolved.*

Questions that must be answered before the implementation plan can be written.

- [ ] {Question}
```
