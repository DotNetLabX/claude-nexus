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
Rule list: `docs/specs/{slug}/definition/spec-rules.md` (stamped) — or, where there is none, the line that says why: `Rule list: not applicable — {reason}` (the spec commits to no rule-shaped behavior), `Rule list: not landed` (the review ended before the list did; the list is mined during the build, and this line is then set to its path), `Rule list: not available — mining skills not installed`. *Written without bold, so the header line is the exact text agents search for; omit while drafting.*

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

Use numbered step-by-step interactions by default, one flow per distinct user journey.

```
Flow 1: {Name}
1. User does X
2. System responds with Y
3. ...
```

For a source listing feedback points on an existing feature, the optional **feedback-point** shape
uses one flow per point, in source order, named after the point. Include the parts that apply, each
in a few lines:

- **Today** describes what happens and why it hurts the user. Check it against what is at hand about
  the feature's behaviour, as in § Acceptance Criteria.
- **After** gives the steps after the change.
- **Unchanged** names what a reader might otherwise expect to change.
- **Options** are lettered, unattributed and undecided. Include them only where the source names no
  fix, and write each option here once.
- **Open questions** lists the relevant question numbers.

```
Flow 1: Finding a saved item
Today: The saved-items page lists items by name. A shopper returning to the newest saved item has to scan the list.
After:
1. Open saved items.
2. Sort by date saved.
Unchanged: The name sort remains available.
Options:
A. Remember the last sort for this shopper.
B. Start each visit with the name sort.
Open questions: 1
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

A rule built from two sources lists both, separated by `;`. If a source covers a rule only in part, cite it for the covered part and route any open scope or solution choice to § Open Questions. Use `added` for behaviour no source asks for. Where the ticket and the mirrored pattern disagree, the ticket wins: the rule cites the ticket, never the pattern. An `added` rule keeps the spec from Ready until the owner keeps or drops it: a kept rule reads `Source: added — kept by owner {YYYY-MM-DD}` — settled by its author with the owner away, `Source: added — kept, owner away {YYYY-MM-DD}` — and a dropped one leaves this list for `## Out of Scope`, its reason `dropped at the owner's keep-or-drop`. The check `spec-sources.js`, beside the plugin's `verify-run.js`, lists every rule with no source and every `added` rule not yet kept; a main-session write that marks the spec Ready with one of them is refused.

1. Team names are unique, compared without regard to case. *(Source: owner, Q4)*
2. A deleted team's name can be reused at once. *(Source: added)*

## Parts

*Optional — only in a spec or epic too big for one plan, and only where the owner took the split, or, with the owner away, where its author's recommendation stood. Without it the spec is planned whole.*

The parts the work is built in, one block per part. The PO calls them stories, the architect tasks: they are the same thing at one level, and only the word differs. Each block names what it builds and what it waits for; a part's detail goes in its entry or in the section it covers. Where a feature keeps an `sdd/` folder, the list goes in its SDD spec, never in a development spec beside it.

Once the spec is Ready and committed, `parts.js --spec docs/specs/{slug}` (beside the plugin's `verify-run.js`) makes one folder per part under this spec's folder, its slug built from this spec's id, the part's id and the first words of its title, and its definition a generated pointer back to this entry, which is planned and built as a feature of its own. Change the list, commit it, and run the command again; never edit or add a file at a part's folder. Any spec folder may hold part folders, an epic's own story folder included (a story that is itself a part holds no list); the deepest is a part inside a story inside an epic.

### Story 1: {title}
**Covers:** {the sections, flows or rules of this spec the part builds}
**Waits for:** none

### Story 2: {title}
**Covers:** {…}
**Waits for:** Story 1

`**Waits for:**` takes `none`, or a comma-separated list of parts of this list (`Story 1`, `Task 2`) and feature slugs — another feature's part included. Ids are letters, digits and dots, each unique within its kind (`Story 1` and `Task 1` may both stand); a heading off the `### Story {id}: {title}` form, an empty `**Covers:**` or `**Waits for:**`, a wait naming nothing, and parts that wait for each other in a loop, are refused.

## Technical part

*Optional — omit the section when no architect adds one. Written by the architect for its own team only, from its own code repository: a few high-level points, with no class-level detail, no step list and no plan. It is the only section that may name a code fact, and the only one the architect writes.*

## Decisions and why

*Keep this section in `spec.md` and `epic.md`; leave it out of `bug.md`.*

The why behind this document's decisions — the owner's reasons, what was turned down and the fact each decision rests on — so a run without the owner decides as the owner would, and stops where a decision no longer holds. When an agent follows or stops on an entry is `rules/on-demand/agents-workflow.md` § Decision entries; this section owns only the entry's shape.

Two kinds of entry: an **owner ruling** (`By: owner`), and a **writer's decision** — a question a fact or the source settles, still listed for the owner, its `By` naming the role that decided and never presented as the owner's. Open scope or solution choices go to § Open Questions.

An owner ruling gets an entry when (a) the owner gave a reason in words, (b) the owner chose something other than the recommendation — another listed option or an answer of their own, (c) a discussion settled it, or (d) it changes a decision that already has an entry, even by a plain pick. A plain pick of the recommendation with no words gets no entry: the document's text already carries the outcome.

Entries are numbered `D1`, `D2`, … (`P1`, `P2`, … in a plan), and every reference names its document with the id — `spec D3`, `plan P2`, `epic D1`. A changed decision adds a new entry and sets the old one's State to `replaced by {reference}`; no entry is ever deleted. With no entry, the section reads exactly `None — no ruling carried the owner's reason.` The owner is never asked to review this section.

### D1 — {decision}
- **By:** `owner`, or the role that decided (`PO`, `architect`)
- **Decided:** the outcome, in one line
- **Kind:** business | product | technical — business is what the customers or the company get or pay, product what the user sees or can do, technical how it is built; an entry written before this part has none, and a reader takes it as untagged
- **Why:** an owner ruling quotes the owner verbatim; where the owner gave no reason, the writer's explanation, marked `PO's reading` or `architect's reading`; a writer's decision gives the writer's reasoning — never an invented owner reason
- **Turned down:** each option not taken, with its reason in a few words where one was given — or `none offered` where there were no alternatives
- **Rests on:** the fact that, if it changes, reopens the decision — or `none — a preference` where nothing outside the owner's preference supports it
- **Confidence:** high | medium | low — {one-line why}: how sure the decider is, for an owner ruling and a writer's decision alike; an entry written before this part has none, and a reader takes it as missing
- **Source:** the question's number in the feature's `questions.md`, the date of the discussion, or the architecture decision record a ruling of wider reach was routed to
- **State:** `current`, or `replaced by {reference}`

## Acceptance Criteria

Use a checklist of observable outcomes a tester can verify from outside the product. Each item checks the change and fails on today's product. Rewrite a check today's product already passes until it fails there, or remove it. Use only what is at hand for today's behaviour (the source, people in the conversation or a document already open). Record any missing fact as an open question at once. Name endpoints and HTTP status codes where they describe the outcome.

- [ ] {Criterion}
- [ ] {Criterion}

## Out of Scope

What this feature explicitly does NOT include. Each item has a reason.

- **{Thing}** — {why it's deferred}

## Open Questions

*Omit section if all questions are resolved.*

Keep scope or solution choices the source leaves open here. Give the writer's suggestion and its
reason, leaving the choice to the owner or a decider the owner names. Leave it out of the rules and
decisions until that choice is settled. With the owner away, follow the owner-away rule
(→ rules/on-demand/agents-workflow.md § Owner-away runs) to take the suggestion as presumed and list it.
Behaviour no source asks for belongs in the owner keep-or-drop route for `added` rules. A question a
fact or the source settles can be recorded as a writer's decision.

Leave out facts absent from the source and any checked source. Keep checked corrections with where
they were checked. Attribute a preference only to the decider who expressed it. Labels can still
identify who requested something or who can answer a question.

Number questions a flow points to. A question about flow options names the flow and the option letters.

- [ ] 1. Which sort should shoppers see when reopening saved items (Flow 1, Finding a saved item, A or B)? Suggestion: A, because returning shoppers can pick up where they left off.
```
