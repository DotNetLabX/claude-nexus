# Knowledge Base Navigation

> Read when: answering a domain, analytics, or feature question in a project that has `docs/kb/index.md` — before you start reading source.

Before reading source files for domain, analytics, or feature questions, check `docs/kb/index.md` first.

1. Read `docs/kb/index.md` (topic map, ~30 lines)
2. Follow the link to the relevant entry
3. Get: business rules, computation formulas, edge cases, key file paths
4. Only then read the specific source files you need — and for a large entry or source file, read the specific **section** you need (locate by heading, then `Read` with `offset/limit`), not the whole file (ADR-22 Extended)

This saves context — a KB entry gives you the business logic in ~60 lines vs reading 3-5 source files (~300+ lines).

## Business-Rules Registries

For a behavior question about a specific class/unit, check `docs/business-rules/<area>/<unit>.md` before reading source — if present it holds the unit's verified rules with per-row provenance (`source: code | spec | both`), status, and criticality (ADR-45). Skip silently when `docs/business-rules/` doesn't exist in the repo.

**The module digest is the rung above the row — read it before editing or reviewing behaviour in that module.** For a *concept*-level question — "how does versioning/netting/pricing work in this module?" — read `docs/business-rules/{module}/digest.md` before descending to individual rows. It states the module's business concepts in plain language and cites its rules by tag, so it answers the question a single row cannot and a whole registry answers too slowly. The full ladder is four rungs, coarse to fine, each pointing at the next and never duplicating it: structural graph → KB → module digest → registry row (read per tag). Stop descending as soon as the question is answered.

## Glossary-First Naming

When naming new types, properties, or UI labels, read `docs/kb/glossary.md` first. Use the canonical term exactly. If the glossary says "Avoid" a synonym, don't use it in code or specs. Update the glossary when a new domain concept is introduced.

## Structural Navigation

If a structural code graph is present (e.g. `graphify-out/GRAPH_REPORT.md`), use it to find what touches what — it shows god nodes (most-connected types) and community clusters. Skip this step if no such graph exists in the project.

## Repo Grounding Contract

A consumer repo is agent-ready when it provides the three thin indexes — `docs/architecture/index.md`, `docs/conventions/coding-conventions.md`, `docs/product/index.md` — each an index over existing docs, not a rewrite — plus the knowledge a question needs, reachable by its kind. Two kinds ground differently. A **repo-private corpus** is the repo's own knowledge, content nothing outside it publishes: it is always local, read KB-first exactly as the steps at the top of this file say. A **published copy** is a copy of a corpus whose authoritative source lives elsewhere: ground from the copy **while current**, and from that source otherwise — and where the repo declares no channel to that source, ground from the copy and say it may be behind. Current means the copy's version matches the source's — a comparison, never an age and never a date.

If the repo declares its corpora in `.claude/access.yaml` (the `nexus-channels` extension), that declaration decides how each corpus is reached — its local copy, its declared remote, or a check the session runs first to choose between the two — and the session-start table names the outcome per corpus; without the declaration every corpus is local, as today.

When a grounding file is missing, surface it **once per session** — note it and offer to create the index; never nag, never block.
