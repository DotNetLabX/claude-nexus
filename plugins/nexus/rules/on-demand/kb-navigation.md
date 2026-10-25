# Knowledge Base Navigation

> Read when: answering a domain, analytics or feature question, or changing behaviour, in a project with a KB, rule registries or code maps.

## Reading order

Maps read before the code never found code faster than a search, and, read first, framed wrong answers. An agent
cannot read a map only for a location: what it reads shapes what it then sees in the code. So, for any question
about how the code behaves:

1. **Find the place by searching the code** — names, strings, routes, configuration keys. Use a map only when the
   search finds nothing, and then only for a location: the KB index, a code graph, or the flow atlas —
   `docs/flow-atlas/`, only where it exists and `.claude/nexus-agents.json` sets `features.flowAtlas` to `true`; otherwise skip it.
2. **The answer comes from the code you read.** Every claim rests on code or configuration you opened.
3. **Read the KB entry, digest or registry row afterwards, for the why** — a decision, a ruling, a reason the code
   cannot show. Where a document and the code disagree, the code wins.

## Business-Rules Registries

For a behavior question about a specific class/unit, after reading the unit's code, read `docs/business-rules/<area>/<unit>.md` for its rules and their reasons — if present it holds the unit's verified rules with per-row provenance (`source: code | spec | both`), status, and criticality (ADR-45). Skip silently when `docs/business-rules/` doesn't exist in the repo.

The module digest (`docs/business-rules/{module}/digest.md`) states a module's business concepts in plain language and cites its rules by tag. Read it after the code of that module, when the question is about a concept, or before editing or reviewing behaviour in that module (→ § Reading order); read registry rows per tag, never front to back.

## Glossary-First Naming

When naming new types, properties, or UI labels, read `docs/kb/glossary.md` first. Use the canonical term exactly. If the glossary says "Avoid" a synonym, don't use it in code or specs. Update the glossary when a new domain concept is introduced.

## Repo Grounding Contract

A consumer repo is agent-ready when it provides the three thin indexes — `docs/architecture/index.md`, `docs/conventions/coding-conventions.md`, `docs/product/index.md` — each an index over existing docs, not a rewrite — plus the knowledge a question needs, reachable by its kind. Two kinds ground differently. A **repo-private corpus** is the repo's own knowledge, content nothing outside it publishes: it is always local, read as § Reading order says. A **published copy** is a copy of a corpus whose authoritative source lives elsewhere: ground from the copy **while current**, and from that source otherwise — and where the repo declares no channel to that source, ground from the copy and say it may be behind. Current means the copy's version matches the source's — a comparison, never an age and never a date.

If the repo declares its corpora in `.claude/access.yaml` (the `nexus-channels` extension), that declaration decides how each corpus is reached — its local copy, its declared remote, or a check the session runs first to choose between the two — and the session-start table names the outcome per corpus; without the declaration every corpus is local, as today.

When a grounding file is missing, surface it **once per session** — note it and offer to create the index; never nag, never block.
