---
name: research-entry-schema
description: Standard format for research-pool entries under docs/kb/research/ — fields, the 8-part output ordering, and the machine-checkable claim/citation grammar. Load when writing or validating a researched verdict so headings, recall keys, and cite-or-drop checks stay consistent.
---

# Research Entry Schema

The format for every entry the `search-researches` skill writes to the research pool
(`docs/kb/research/{topic}.md` in the **consuming** project — created lazily, never shipped; ADR-1).
Sibling to `kb-entry-schema`. An entry exists so a *later* question can recall a verdict instead of
re-running the dive — so the fields are the recall key and the staleness signal, and the body is the
cited answer. Use these headings and the claim grammar exactly: a deterministic validator
(`search-researches/scripts/cite-check.mjs`) asserts against them, and recall greps them.

## Required Fields

Every entry opens with a metadata block (one `**Field:**` line each), then the 8-part body.

```markdown
# {topic}

## {Question answered}

**Verdict:** {one-line answer — the recall payload}
**Evidence tier:** ran-it | read-docs | inferred
**As-of:** {YYYY-MM-DD}
**Validity scope:** {what must stay true for this to hold — e.g. "the v4 API", "while on Windows"}
**Status:** current | uncertain | superseded
**Reconfirm trigger:** {the event that invalidates this — a version bump, a date, a config change}
**Corroboration:** {source count; for a high-stakes verdict, whether a second independent source agreed}
```

Field rules:

- **Question answered** is the recall key — phrase it as the question a future caller would ask, not
  as a title. Recall greps these headings.
- **Evidence tier** is one of exactly three: `ran-it` (observed it work), `read-docs` (authoritative
  source says so), `inferred` (reasoned, unverified — the weakest).
- **As-of** plus **Validity scope** are **both required**. Validity scope has no default: an entry with
  no validity scope is treated as **stale** (a verdict that never says when it stops being true cannot be
  trusted to still be true). The pair is what the recall validity-gate checks.
- **Status** starts `current`. `uncertain` flags a verdict the author could not fully stand behind;
  `superseded` marks an entry a newer one replaced (see supersede-don't-delete).
- **Reconfirm trigger** names the concrete event that makes the entry stale (a library version bump, a
  date passing, a platform change) — recall trips on it.
- **Corroboration** records how many independent sources backed the verdict. For a **high-stakes**
  verdict (one a downstream decision rests on), it must record whether a **second independent source**
  agreed — the corroboration floor the validator enforces.

## The 8-part output ordering

The body after the metadata block follows this order exactly — the headings the validator and readers
scan by:

1. `## Verdict` — the answer, stated once, plainly.
2. `## Finding` — what the research established, each claim cited (see grammar).
3. `## Fix` — what to do with it (the actionable consequence), cited.
4. `## Alternatives` — options considered and why they lost, cited.
5. `## Caveat` — the limits, the cases where the verdict does not hold.
6. `## Fallback` — what to do if the verdict turns out wrong or the trigger fires.
7. `## Sources` — the linked references the `[n]` markers resolve to.
8. `## Recommendation` — the recommended next action, plus the next probe if the question reopens.

## The claim/citation grammar (machine-checkable)

The validator (`cite-check.mjs`, shipped in `search-researches`) keys on this grammar — keep to it or an
entry will not persist:

- Claims under `## Finding`, `## Fix`, and `## Alternatives` are written as **bullet lines** (`- …`),
  one claim per bullet. A non-bullet (prose) line in one of these sections is **malformed** and fails the
  check — the validator does not skip it. Each **claim bullet** ends with an inline `[n]` reference — a
  bracketed number (one or more digits) that resolves to an entry in **this entry block's** `## Sources`
  list — **or** the literal token `[no source found]` when no source backs it. A claim with neither fails
  the check. "No source" is stated honestly; it is never invented.
- Each `## Sources` entry is a **linked URL or repo path** — never a bare placeholder. The tokens
  `TODO`, `TBD`, and `[source]` are rejected: a placeholder source reads as cited but isn't.
- A **high-stakes verdict whose Corroboration shows a single source** fails the check — high-stakes
  verdicts need the second independent source recorded in Corroboration.
- **Resolution and the corroboration floor are per entry block.** A topic file accumulates blocks
  (supersede-don't-delete keeps superseded entries), and each block opens with its own
  `## {Question answered}` heading + metadata + 8-part body. A claim's `[n]` resolves only against the
  `## Sources` of **its own block** (a later block's `[2]` never satisfies an earlier block's `[2]`), and
  **every** block's Corroboration is checked — not just the first.

Example (the shape, not the content):

```markdown
## Finding
- The v4 client exposes a streaming API for token-by-token reads [1].
- No public benchmark covers the 10k-row case [no source found].

## Sources
[1] https://example.com/docs/v4/streaming
```

## Cite-or-drop and supersede-don't-delete

- **Cite or drop.** A claim ships with its source or with `[no source found]` — it is never published as
  if confirmed when it is not. The `[no source found]` token is the honest escape hatch; an invented
  citation is the failure the validator exists to catch.
- **Supersede, don't delete.** When a newer dive replaces a verdict, mark the old entry
  `Status: superseded` and **keep it** — never delete it. The superseded entry is the audit trail of why
  the verdict changed, and a future caller may need to know the old answer was once believed.

## Consumers

| Consumer | Uses | Impact if malformed |
|----------|------|---------------------|
| `search-researches` recall | Question heading, As-of, Validity scope, Status, Reconfirm trigger | A miss-classified entry recalls a stale verdict or misses a fresh one |
| `cite-check.mjs` | Claim grammar, Sources, Corroboration | An uncited or single-source-high-stakes entry ships unchecked |
| po / architect / solo | Verdict, Finding, Recommendation | A verdict with no validity scope is trusted past its life |
