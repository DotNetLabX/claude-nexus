---
name: create-service-claude-md
description: Architect-only. Captures every axis needed to scaffold a new service and writes src/Services/{Name}/CLAUDE.md. Use when an architect has decided a new service and needs to capture its axes before the developer scaffolds it (run before the Developer's create-service skill).
user-invocable: true
disable-model-invocation: true
---

# Create Service CLAUDE.md (Architect Reference)

This skill is for the **Architect agent only**. It produces `src/Services/{Name}/CLAUDE.md` — the single source of truth for scaffolding a new service. The Developer's `create-service` skill reads this file and branches on it.

## Assumes

- **A design conversation or plan** that decided the service; the axes come from it first.
- **The rules `create-service` scaffolds against** — one endpoint framework per service, references only to the
  shared projects and modules it uses, never another service's projects.
- No shared library: the template names none.

## When to use

When a new service has been decided (via `system-design` or direct discussion with the user) and the Architect needs to capture the decisions before handing off to the Developer.

Confirm first that the unit is a service by the kinds below — a unit that could not stand alone is a module, captured by `create-module-claude-md` instead.

<!-- nexus-gen coding-conventions sections="unit-kinds" BEGIN -->
#### Kinds of Reusable Unit

A unit's kind comes from whether it could stand alone. Neither having endpoints nor being shared by two apps decides it.

| Kind | What it holds | The test |
|---|---|---|
| Generic module | a capability usable anywhere, often a contract with swappable implementations | it holds no business rules |
| Business module | business rules and its own tables, with endpoints or without | it depends on other services, so it lives inside a service or a host and never stands alone |
| Service | its own data, endpoints, integration events and gRPC calls — everything it needs | it is self-contained, so it could ship as a product of its own |

A service runs on its own by default. In a repo that has a host, a service may instead run inside one host or several
(`create-host`). In the module skills, the Component archetype is the generic module and the Domain archetype the
business module; a generic module that keeps its own tables takes the Domain scaffold.

A module gets a contracts project only where it has several implementations or a second is planned (a generic
module's swappable ones), never because it has several consumers: a business module is referenced directly by the
service or host that composes it. The contracts of integration events and gRPC are always shared projects, whatever
the count, because they cross deployables.
<!-- nexus-gen coding-conventions END -->

## Steps

1. **Pre-fill from conversation context.** The Architect has typically been discussing the service before invoking this skill. Pull every answer you can from the existing conversation. Do not re-ask what the user already said.

2. **Walk through the full axis checklist** — follow `workflows/CaptureAxes.md`. For every axis, either confirm the pre-filled value or mark it as unanswered.

3. **Ask the user about every unanswered axis in one batch.** No sequential Q&A — one consolidated question. Do not write the file yet.

4. **Confirmation step.** Present the full captured axis list back to the user: "Here's what I captured — any changes?" Wait for the user to confirm or correct.

5. **Write the CLAUDE.md file** — follow `workflows/WriteClaudeMd.md`. Output path: `src/Services/{Name}/CLAUDE.md`.

6. **Tell the user:** "Service CLAUDE.md ready at `src/Services/{Name}/CLAUDE.md`. The Developer can now run `/create-service {Name}`."

## Arguments

Pass the service name: `create-service-claude-md Indexing`

## What this skill does NOT do

- Does not scaffold any project files or folders — that is the Developer's `create-service` skill.
- Does not update `the solution file`, `docker-compose.yml`, or any other repo-level file.
- Does not create aggregates, features, or any business code.
- Does not write the feature plan — that is the Architect's normal plan workflow.
