---
name: create-module-claude-md
description: Architect-only. Captures axes for a new module and writes src/Modules/{Name}/CLAUDE.md. Branches on archetype (Component vs Domain). Use when an architect has decided a new module and needs to capture its axes before the developer scaffolds it (run before the create-module Developer skill).
user-invocable: true
disable-model-invocation: true
---

# Create Module CLAUDE.md (Architect)

Walks the Architect through the axis checklist for a new module and writes `src/Modules/{Name}/CLAUDE.md`. The file is the single source of truth the Developer's `create-module` skill reads to scaffold the skeleton.

Modules come in two archetypes, and the captured axes differ per archetype:

- **Component** — the generic module: no business rules, a `.Contracts` interface + one or more implementation projects (e.g., `FileService`, `EmailService`)
- **Domain** — the business module: owns its business rules, domain model and tables, with an optional application layer and an optional class-library API layer; it depends on other services and runs inside a service or a host

A unit that could stand alone as a product is a service, captured by `create-service-claude-md` instead:

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

## Assumes

- **A design conversation or plan** that decided the module; the axes come from it first.
- **The module rules `create-module` scaffolds against** — a contracts project only for several implementations or a
  planned second (never for several consumers), no reference to another module except the orchestrating case named
  here, its own schema where it owns tables.
- No shared library: the template names none.

## Precondition

The Architect is in the middle of a design conversation with the user, or has an existing plan in `docs/specs/{slug}/delivery/` with the module's shape already sketched out. Pull everything you can from conversation context before asking the user anything new.

## Steps

1. **Capture common axes** — follow `workflows/CaptureCommonAxes.md`. The archetype decision (Component vs Domain) happens here.

2. **Capture archetype-specific axes:**
   - If archetype = Component → follow `workflows/CaptureComponentAxes.md`
   - If archetype = Domain → follow `workflows/CaptureDomainAxes.md` (includes the mandatory framework-host-compatibility warning)

3. **Confirm with the user.** Present the full axis list and ask: "Here's what I captured — any changes?" Do not proceed until the user confirms or corrects.

4. **Write the CLAUDE.md file** — follow `workflows/WriteClaudeMd.md`. Two templates, one per archetype.

5. **Tell the user:**
   > `src/Modules/{Name}/CLAUDE.md` written. The Developer can now run `create-module {Name}` in a Developer session to scaffold the skeleton.

## What this skill does NOT do

- Does not scaffold any folders or files. Only writes the CLAUDE.md.
- Does not update the solution file (`.slnx`).
- Does not run `dotnet` commands.
- Does not make architectural decisions silently — every axis is confirmed with the user.

## Arguments

Pass the module name: `create-module-claude-md Audit`
