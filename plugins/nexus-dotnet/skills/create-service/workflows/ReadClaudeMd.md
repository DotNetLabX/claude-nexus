# Read Service CLAUDE.md

## Path

`src/Services/{Name}/CLAUDE.md`

## Hard-error if missing

If the file does not exist, stop and tell the user:

> `src/Services/{Name}/CLAUDE.md` not found. Ask the architect to run `create-service-claude-md` first.

Scaffold nothing.

## Axes to extract

The file's format is the one `create-service-claude-md/workflows/WriteClaudeMd.md` writes, with stable section
headers.

| Axis | Location in CLAUDE.md | Used by |
|------|----------------------|---------|
| Service name | `# {Name} Service` | folder paths, project names |
| Endpoint framework | `**Endpoint framework:**` | `ScaffoldApiProject.md` branch |
| Database | `**Database:**` | `ScaffoldPersistenceProject.md` branch, compose `depends_on` |
| Ports | `**Port:**` | `launchSettings.json`, compose — none for a service a host runs |
| How it runs | `**Runs:**` (optional) | `ScaffoldHostedApi.md` in place of the API project's self-running files, `ScaffoldInfrastructure.md` |
| Where its data lives | `**Data:**` (optional, EF Core on SQL Server or PostgreSQL only) | `ScaffoldPersistenceProject.md` schema branch, `ScaffoldInfrastructure.md` connection string |
| Application project Y/N | `## Domain model` → `**Application layer:**` | whether `ScaffoldApplicationProject.md` runs |
| gRPC clients consumed | `## gRPC clients` | a reference to the gRPC contracts project, client registrations |
| gRPC server exposed | `## gRPC server` | server registration, port mapping |
| Integration events | `## Integration events` → `**Published:**` / `**Consumed:**` | a reference to the event contracts project, the bus registration |
| File storage | `## File storage` (optional) | the file-storage module's reference |
| Modules used | `## Modules` (optional) | a reference to each module the service runs on |

## Derived decisions

- **Runs** — on its own unless the file has a `**Runs:** host` line. A service a host runs has no port and no
  Docker, whatever its `**Port:**` and `**Docker:**` lines say.
- **Data** — its own database unless the file has a `**Data:** schema {Schema} in a shared database` line; an absent
  line, or `own database`, is its own database.
- **Docker** — yes unless the file has a `**Docker:** N` line or a `**Runs:** host` line.
- **Mediator** — yes for Carter or minimal APIs with a mediator; no for FastEndpoints.
- **Bus** — yes when any integration event is published or consumed.
- **Each shared or module reference** — only for an axis that needs it; nothing "just in case".

## Keep the model

The remaining workflows branch on these values.
