# note-schemas — the consumer field-set contract

The producer↔consumer contract for note frontmatter, scoped to **what the consumer surface reads**.
`search-notes` filters and ranks on these fields; `claim-notes` reads them and stamps two of its own.
Both skills cite this file instead of restating the fields.

This is deliberately **a subset**. The full producer-side schema (the six note-type JSON schemas, the
per-claim extraction fields, and the quote/owner evidence contracts) governs how notes are *produced*,
not how they are searched or claimed, and is out of scope for the consumer surface. It returns with the
wave-2 producer skills if a producer reference is needed then.

## Frontmatter fields the consumer surface uses

Every note carries YAML frontmatter. The fields search/claim depend on:

| Field | Type | Meaning / values |
|-------|------|------------------|
| `meeting_date` | string (ISO date `YYYY-MM-DD`) | When the meeting happened. Default sort key (newest first) and the target of the `date` filter. |
| `meeting` | string | Meeting name (e.g. "Sprint 28 Planning"). Partial-match target of the `meeting` filter. |
| `topic` | string | Concise topic title. Shown in results; free-text target of the `keyword` filter. |
| `type` | enum | One of the six note types: `decision`, `requirement`, `bug`, `process_change`, `status_update`, `brainstorm`. Exact-match target of the `type` filter. |
| `tags` | array of strings | 3–7 topic tags. The `tags` filter matches when any requested tag appears in the array. |
| `domain` | array of strings | Kebab-case bounded-context slugs. The `domain` filter matches when any requested domain appears in the array. |
| `status` | enum | `actionable` \| `informational` \| `needs_discussion`. Exact-match target of the `status` filter. |
| `confidence` | integer (1–10) | Note-level evidence strength (the weighted floor of per-claim scores). `7+` is the Jira-ready threshold. Target of `confidence:7+` / `confidence:1..4` filters. |
| `completeness` | enum | `verified` \| `gap-found` \| `unverified`. **A note without the field counts as `unverified`.** `gap-found` = the note was flagged with omissions and is held for re-extraction before claiming. Target of the `completeness` filter. |
| `category` | enum | `product` \| `strategy` — the routing category, corresponding to the inbox subfolder (see below). |

## Claim stamps (written by `claim-notes`)

Two fields are **not** present on unclaimed notes — `claim-notes` adds them when a note is claimed:

| Field | Type | Meaning |
|-------|------|---------|
| `claimed_by` | string | The `{slug}` the note was claimed into. |
| `claimed_at` | string (ISO date) | When it was claimed. |

A note carrying `claimed_by` is already claimed; `search-notes` treats the inbox as unclaimed notes only,
and `claim-notes` skips a note that already has these stamps.

## Note-category folders

Inside the inbox root, notes are filed by category folder:

```
{inbox}/
  product/    — requirements, bugs, product decisions
  strategy/   — status updates, process changes, brainstorms
  review/     — low-confidence triage output (the unflagged Slack lane)
```

`product/` and `strategy/` mirror the `category` frontmatter value. `review/` is a routing folder for the
unflagged Slack-triage lane rather than a `category` value; the `category:review` filter targets it.
`search-notes` searches these three folders; it does not descend into `summaries/` (summary emails and
lessons, not notes), raw staging (`transcripts/`, `slack-pulls/`), or already-claimed feature folders.

## Example (unclaimed note frontmatter)

```yaml
---
meeting_date: 2026-05-22
meeting: Sprint 28 Planning
topic: SKU vs Index Code Facing Match
type: requirement
tags: [catalog, facing-match, import]
domain: [catalog-service]
status: actionable
confidence: 8
completeness: verified
category: product
---
```

After `claim-notes` claims it into a feature, the same frontmatter additionally carries
`claimed_by: F1-NotesPlugin` and `claimed_at: 2026-07-12`.
