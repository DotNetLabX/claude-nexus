# Table-First Output

## Enumerable content is a table, never a list (owner directive, 2026-07-18)

Whenever a user-facing response enumerates parallel items — statuses, options, findings,
next steps, remaining work, comparisons, per-item verdicts — render them as a compact
Markdown table, never a bulleted or numbered list. This applies to every agent's replies
and to reports relayed to the user.

Table hygiene (terminals wrap wide cells into unreadable fragments): at most ~5 columns;
cells short (≈8 words); one fact per cell; explanations go in the prose around the table,
never inside cells. Narrative paragraphs stay prose — the rule targets enumerations.

## Status questions (the specific case)

When the user asks for feature status, pipeline status, or "what's the status," respond with the
compact three-column form:

| ID | Name | Status |
|----|------|--------|

Only show **uncompleted** features unless the user explicitly asks for all. No lists, no prose
beyond a framing sentence.
