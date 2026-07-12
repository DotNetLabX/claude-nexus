---
name: search-notes
description: Search the unclaimed meeting-notes inbox by domain, tags, type, category, date range, keyword, confidence, status, completeness, or meeting, and return a ranked result table. Read-only — it never moves, edits, or claims a note. Use before shaping or updating any spec to surface relevant unclaimed notes, or when triaging the inbox. Paths resolve via the notes config (references/notes-config.md), so no consumer path is hardcoded.
user-invocable: true
---

# search-notes

Searches the unclaimed meeting-notes inbox and returns a filtered, ranked table of matching notes.
Used before claiming notes into a feature's definition folder, and by anyone triaging the inbox.

This is a **read-only** utility — it searches and reports. It never moves, edits, or claims a note.
(Claiming is the separate `claim-notes` skill.)

## Where it searches

The inbox root resolves through the notes config — never a hardcoded path. Read
`references/notes-config.md`: it maps each source's `inbox` root and defines the single documented
default used when no config file exists. Resolve the root there first; every path below is relative to
that resolved root.

Inside the root, notes are filed in three category folders — `product/`, `strategy/`, and `review/`
(defined in `references/note-schemas.md`). Search all three. `review/` items appear in unfiltered
listings (so the bucket surfaces in the weekly review) and can be targeted with `category:review`.

**Do not search:**
- `summaries/` under the root — summary emails and lessons, not notes.
- `docs/specs/{slug}/definition/notes/` — already-claimed notes live in feature folders.
- the raw staging locations (`transcripts/`, `slack-pulls/`) — raw input, not notes.
- any note whose frontmatter carries `claimed_by` — it is already claimed.

## Parameters

All parameters are optional. Combine any number to narrow results. With no parameters, list all
unclaimed notes sorted by `meeting_date` (newest first). Field types, enums, and semantics are defined
once in `references/note-schemas.md` — this table maps each filter to its field, it does not restate the
schema.

| Parameter | Type | Match logic | Example |
|---|---|---|---|
| `domain` | string or list | Any provided domain appears in the note's `domain` array | `domain:catalog-service` |
| `tags` | string or list | Any provided tag appears in the note's `tags` array | `tags:import,validation` |
| `type` | enum | Exact match on the note's `type` | `type:requirement` |
| `category` | enum (`product`, `strategy`, `review`) | Restricts search to one subfolder | `category:product` |
| `date` | date or range | `meeting_date` falls within the range | `date:2026-05-20` or `date:2026-05-15..2026-05-22` |
| `keyword` | string | Free-text match in the `topic` field or the note body | `keyword:duplicate detection` |
| `confidence` | integer or threshold | Note-level `confidence` meets the threshold | `confidence:7+` (Jira-ready) or `confidence:1..4` (needs review) |
| `status` | enum | Exact match on `status` | `status:actionable` |
| `completeness` | enum (`verified`, `gap-found`, `unverified`) | Exact match on `completeness`; a note without the field counts as `unverified` | `completeness:gap-found` (held for re-extraction before claiming) |
| `meeting` | string | Partial match on the `meeting` field | `meeting:sprint 28` |

**Natural language is fine.** The user can say things like:
- "search notes about catalog import from last week"
- "find all bugs with low confidence"
- "unclaimed notes in the shelf-recognition domain"
- "what requirement notes do we have tagged with planogram?"

Parse the intent into the structured parameters above.

## How to search

The agent running this skill performs each step:

1. **Resolve the inbox root** from `references/notes-config.md` (config `inbox`, or the documented
   default).
2. **List all note files** in the `product/`, `strategy/`, and `review/` folders under that root.
3. **Apply filters.** For a small inbox (under ~50 files), read each file's YAML frontmatter and filter
   in memory. For a larger inbox, pre-filter with Grep — `domain`/`tags`/`type` against the frontmatter,
   `keyword` against the full body — then read frontmatter of the matches for the remaining filters
   (`date`, `confidence`, `status`, `completeness`). Skip any file carrying `claimed_by`.
4. **Rank.** Default: newest `meeting_date` first. When `domain` or `tags` was given, prioritize exact
   matches over partial ones.
5. **Present** using the output format below.

## Output format

Return a markdown table, one row per matching note:

```
## Search Results

**Query:** {natural-language summary of filters applied}
**Matches:** {count} notes

| # | Date | Topic | Type | Domain | Confidence | Status | File |
|---|------|-------|------|--------|------------|--------|------|
| 1 | 2026-05-22 | SKU vs Index Code Facing Match | requirement | catalog-service | 8 | actionable | product/2026-05-22-sku-vs-index-code-facing-match.md |
| 2 | 2026-05-22 | KB Graphify Tooling Gaps | brainstorm | platform | 5 | actionable | strategy/2026-05-22-kb-graphify-tooling-gaps.md |

**Jira-ready (confidence 7+):** {count}
**Needs review (confidence 4-6):** {count}
**Low confidence (1-3):** {count}
```

If no matches: "No unclaimed notes match the search criteria."

## Workflow integration

This skill is the first step before shaping or updating a spec. The typical flow:

1. Start work on a feature (e.g. catalog import improvements).
2. **Search:** `search-notes domain:catalog-service,import-pipeline` — surface all unclaimed notes
   touching that domain.
3. **Review** the results and decide which notes are relevant.
4. **Claim** the selected notes with the `claim-notes` skill (present → confirm → move → stamp).
5. **Shape or update the spec** using the claimed notes.

### Common searches

- **Before refinement:** `domain:{feature-domain}` + `type:requirement` — all requirements in a domain.
- **Bug triage:** `type:bug` + `confidence:7+` — validated bugs ready to promote.
- **Weekly inbox review:** no filters — everything, newest first.
- **After a meeting:** `date:{meeting-date}` — what was just extracted.
- **Quality check:** `confidence:1..4` — notes that need manual review or discard.
- **Held for re-extraction:** `completeness:gap-found` — notes flagged with omissions; repair before
  claiming.
- **Review-bucket drain:** `category:review` — disposition every item in the low-confidence lane
  (claim into a spec, or discard with a reason).

## What this skill does NOT do

- **Claim or move notes** — that is `claim-notes`; this skill only searches.
- **Edit or update notes** — read-only.
- **Search claimed notes** — only the inbox; claimed notes live in feature folders.
- **Search summaries or lessons** — only note files with YAML frontmatter.
