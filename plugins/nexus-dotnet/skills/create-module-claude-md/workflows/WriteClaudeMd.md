# Write Module CLAUDE.md

Writes `src/Modules/{Name}/CLAUDE.md`. Two templates, one per archetype. Pick the template that matches the captured archetype and substitute every placeholder with the captured axes.

## Output path

`src/Modules/{Name}/CLAUDE.md`

If the folder does not exist, create it. If the file already exists, **ask the user before overwriting** — the existing file may contain pattern notes from a previous scaffold. For Component archetype second-implementation runs, update the `Implementations:` line and add a section for the new impl rather than rewriting from scratch.

## Component template

```markdown
# {Name} Module

**Type:** Component (infra adapter)
**Contract:** {IContractName}
**Implementations:** {FirstImpl}

## Purpose

{Purpose paragraph — 1-2 sentences}

## Structure

- `{Name}.Contracts/` — interface {IContractName} and related DTOs/options
- `{Name}.{FirstImpl}/` — {FirstImpl tech description}. DI extension: `Add{FirstImpl}{Name}()`

## Host wiring

Host services reference `{Name}.Contracts` + exactly one implementation project. The DI extension registers the concrete type against {IContractName}. Host config supplies `{ImplName}Options` (connection string, container name, API key, etc.) via `appsettings.json`.

## Adding a new implementation

Re-run `create-module {Name}` with the new impl name. The skill detects the existing `.Contracts` project and scaffolds only the new implementation project.
```

## Domain template

```markdown
# {Name} Module

**Type:** Domain module
**Endpoint framework:** {framework or "(deferred)"}
**Persistence:** {persistence}
**DB connection:** {embedded-host-connection | own-connection}
**Schema:** {schema name or "N/A"}
**Application layer:** {yes | no}
**API layer:** {yes | no}
**Current hosts:** {list}

## Purpose

{Purpose paragraph — 1-2 sentences}

## Structure

- `{Name}.Domain/` — aggregates, value objects, domain events
- `{Name}.Persistence/` — DbContext, entity configurations, repositories, migrations
{- `{Name}.Application/` — handlers, domain-event handlers, per-call factories} (only if application-layer=Y)
{- `{Name}.API/` — class library exposing `Map{Name}Endpoints()` for host mounting} (only if api-layer=Y)

## Integration shape

Host services mount this module by:

1. **DI wire-up:**
   - `services.Add{Name}Persistence(configuration)` — registers DbContext + repositories
   {- `services.Add{Name}Application(configuration)` — registers its handlers and factories} (if application-layer=Y)

2. **Database:**
   - The module reads `ConnectionStrings:{Name}` itself — the host's database (embedded) or its own (own-connection).
   - Its tables live in the `{SchemaName}` schema.

3. **Migrations:**
   - Module owns its own migration history table at `{SchemaName}.__EFMigrationsHistory`
   - Migrations live in `{Name}.Persistence/Migrations/` and are applied at host startup via `app.Migrate<{Name}DbContext>()` (`persistence-patterns` § Migrations at Start-up)

{4. **Endpoint mounting:**
   - Host calls `app.Map{Name}Endpoints()` to expose the module's routes
   - Framework: {framework}
}

## Domain events handled

None yet. Added by the Developer when implementing the first feature.

## Host responsibilities

- Provide `ConnectionStrings:{Name}` in its settings
- Call the module's DI extensions at startup
- Apply the module's migrations at startup
{- Call `Map{Name}Endpoints()` in the Use region (minimal APIs), or name the module's assembly to the endpoint framework} (if api-layer=Y)
```

## Substitution rules

- Lines wrapped in `{ ... }` are conditional. Include them only if the corresponding axis is set. Remove the braces in the output.
- Lists should always render, even when empty — use `None` instead of deleting the section.
- Escape nothing — the CLAUDE.md is plain markdown, not a string literal.

## After this step

The CLAUDE.md file exists. Return to the SKILL.md and tell the user:

> `src/Modules/{Name}/CLAUDE.md` written. The Developer can now run `create-module {Name}` in a Developer session to scaffold the skeleton.
