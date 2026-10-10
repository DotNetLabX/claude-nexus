# Project lists

The repo's own lists that its conventions point at. Copy this file once to `docs/conventions/project-lists.md` and
keep it there: it belongs to the repo, and a plugin update never copies it again. A row enters a list in the same
change as the class or helper it names. Each section holds one table under the fixed header shown; an empty table is
valid, and the convention check reads the file as it stands.

## Helpers

The helper that implements each pattern in this repo, and where it lives. A repo with no shared library names its
own code here, and starts with an empty table.

| Pattern | Helper | Where |
|---|---|---|

## Logging classes

The classes that may log while serving a request: a class whose request runs several stages with outside calls,
where a stage can fail or fall back without failing the request. Hosted services, jobs, workers, middleware,
pipeline behaviours and the central error handler log by their kind and are not listed.

| Class | Reason |
|---|---|

## Shared-state caches

The classes that hold state beyond one request. Everything else is scoped and keeps no shared state.

| Class | Reason |
|---|---|

## Run-time settings

The settings that may change while the service runs. Every other settings class is read once, at start-up.

| Settings class | Reason |
|---|---|
