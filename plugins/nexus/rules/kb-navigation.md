# Knowledge Base Navigation

Before reading source files for domain, analytics, or feature questions, check `docs/kb/index.md` first.

1. Read `docs/kb/index.md` (topic map, ~30 lines)
2. Follow the link to the relevant entry
3. Get: business rules, computation formulas, edge cases, key file paths
4. Only then read the specific source files you need — and for a large entry or source file, read the specific **section** you need (locate by heading, then `Read` with `offset/limit`), not the whole file (ADR-22 Extended)

This saves context — a KB entry gives you the business logic in ~60 lines vs reading 3-5 source files (~300+ lines).

## Business-Rules Registries

For a behavior question about a specific class/unit, check `docs/business-rules/<area>/<unit>.md` before reading source — if present it holds the unit's verified rules with per-row provenance (`source: code | spec | both`), status, and criticality (ADR-45). Skip silently when `docs/business-rules/` doesn't exist in the repo.

## Glossary-First Naming

When naming new types, properties, or UI labels, read `docs/kb/glossary.md` first. Use the canonical term exactly. If the glossary says "Avoid" a synonym, don't use it in code or specs. Update the glossary when a new domain concept is introduced.

## Structural Navigation

If a structural code graph is present (e.g. `graphify-out/GRAPH_REPORT.md`), use it to find what touches what — it shows god nodes (most-connected types) and community clusters. Skip this step if no such graph exists in the project.

## Repo Grounding Contract

A consumer repo is agent-ready when it provides the three thin indexes — `docs/architecture/index.md`, `docs/conventions/coding-conventions.md`, `docs/product/index.md` — each an index over existing docs, not a rewrite — plus a **tracked, script-synced** copy of the estate KB (never a manual untracked copy — it goes stale silently). The knowledge-gateway MCP is the runtime layer **once the gateway consultation rule ships** (conditional — that rule is spike-gated).

When a grounding file is missing, surface it **once per session** — note it and offer to create the index; never nag, never block.
