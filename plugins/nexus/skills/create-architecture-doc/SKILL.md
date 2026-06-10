---
name: create-architecture-doc
description: Generates or updates the project architecture document with mandatory skill inventory and skill-deferred decisions. Ensures implementation details live in skills, not in the architecture doc.
user-invocable: true
---

# Create Architecture Doc (Architect Reference)

This skill is for the **architect agent**. It produces `docs/architecture/index.md` — the technical architecture document that implementation plans are built against (the canonical name every nexus agent reads). The architecture doc defines system shape and decisions; implementation patterns live in skills.

## Purpose

Generate or update `docs/architecture/index.md` with a structural guarantee that implementation patterns are deferred to skills. Every architectural decision explicitly names what it is NOT defining — the forcing function that prevents over-specification.

## When to use

- Starting a new project or adding a new service (Generate mode).
- After significant skill additions or changes that may make inline architecture doc sections redundant (Refresh mode).

## Two modes

- **Generate** — first-time creation. Full template. Builds the skill inventory from scratch.
- **Refresh** — re-builds the inventory, diffs against the current one, flags sections where a new skill now covers what was previously inline detail. Updates the inventory table. Does NOT rewrite the architecture doc from scratch.

## Reading protocol

Before writing, ensure you have:

1. **Business spec** — read on-demand (`docs/product/index.md` if present)
2. **Architecture reference** — if Refresh mode, read the existing `docs/architecture/index.md`
3. **Skill inventory** — **use the skills surfaced in your context** (plugin skills live in the version-keyed cache — globbing `.claude/skills/` under-reports them); ALSO scan the project's own `.claude/skills/` for project-local skills. Build a skill inventory table from both.
4. **Existing architecture docs** — read `docs/architecture/*.md` for format consistency and history

## Steps

1. **Build the skill inventory** — from the skills surfaced in your context plus the project's `.claude/skills/` (frontmatter `name` + `description`). Columns: Skill, Covers, Disposition (Referenced / Gap).

2. **If Refresh mode:** read the existing architecture doc, compare its Skill Inventory against the current scan, identify stale entries (skills removed or renamed) and new entries (skills added since last scan).

3. **For each architectural decision area:** check if a skill covers it.
   - If yes: reference the skill and fill the "Not specified here" field naming what the skill owns. Do not restate the skill's pattern.
   - If no skill exists: write the inline detail AND add the area to the Gaps section.

4. **Write the architecture doc** following `references/template.md`. Output path: `docs/architecture/index.md` (record version history inside the doc, not in the filename — readers expect one canonical path).

5. **Report:** list of skills referenced, list of gaps (areas needing skills that should be logged to `lessons.md`).

## Arguments

`create-architecture-doc` (Generate) or `create-architecture-doc --refresh` (Refresh).

## What this skill does NOT do

- Make architectural decisions — those come from the architect's analysis. This skill enforces structure, not content.
- Write implementation code or plan artifacts.
- Replace the architect agent's judgment about system shape, technology choices, or domain modeling.
- Rewrite the architecture doc from scratch when in Refresh mode — it only updates the inventory and flags stale sections.
