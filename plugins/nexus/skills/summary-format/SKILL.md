---
name: summary-format
description: Format spec for docs/specs/{slug}/delivery/summary.md — written by the team lead after approval; its existence means the pipeline completed. Load when closing a pipeline run.
---

# Summary File Format

Written by team lead after reviewer approval: `docs/specs/{slug}/delivery/summary.md`. Its existence means the pipeline completed successfully.

**Section map (targeting index).** `summary.md`'s fixed top-level headings — the set agents target for a section read (ADR-22 Extended): `## Status`, `## What Was Built`, `## Key Outcomes`, `## Deviations from Plan`, `## Notes`. Grep `^##` for live line numbers, then `Read` with `offset/limit` around the section you need rather than the whole file.

```
# {Feature Name} — Summary

## Status: COMPLETE

## What Was Built
- [1-3 sentence description of the feature/change]

## Key Outcomes
- [Files created/modified count]
- [Build status]
- [Review verdict and cycle count]

## Deviations from Plan
- [Any deviations, or "None"]

## Notes
- [Anything the user should know before committing]
```
