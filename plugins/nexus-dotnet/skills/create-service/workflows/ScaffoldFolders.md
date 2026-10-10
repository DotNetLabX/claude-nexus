# Scaffold Folders

Create the folders the first files will need. Empty folders are not tracked: a folder is created when its first file
is, so this step names where things go rather than leaving placeholder files (no `.gitkeep`).

## Base tree

```text
src/Services/{Name}/
├── {Name}.API/
│   ├── Features/
│   ├── Middlewares/        only when the service has a middleware of its own
│   └── Properties/
├── {Name}.Domain/          aggregate-grouped or flat folders, per create-aggregate
├── {Name}.Persistence/
│   ├── Configurations/
│   ├── Repositories/
│   ├── Migrations/
│   └── Data/
│       ├── Master/
│       └── Test/
```

## Conditional tree

### Application axis Y → add the Application project

```text
└── {Name}.Application/
    ├── Features/           commands, queries, handlers, consumers
    └── Behaviors/          only for a behaviour this service alone needs
```

A FastEndpoints service keeps its features in `{Name}.API/Features/`; it has an Application project only for shared
pieces (a state machine, the access checker), with no `Features/` folder.

### Redis → a smaller Persistence tree

```text
{Name}.Persistence/
├── Repositories/
└── Data/
    └── Test/
```

No table configurations and no migrations.

### A read-model service

Its consumers live in `{Name}.API/{Area}/Consumers/` and its read endpoints in `{Name}.API/Features/`.

## After this step

Next: `ScaffoldCsprojFiles.md`.
