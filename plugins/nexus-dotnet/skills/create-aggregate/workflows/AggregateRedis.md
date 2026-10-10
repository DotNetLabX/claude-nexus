# Create Aggregate — Redis

Used by: services that store their documents in Redis through Redis OM.

A Redis document has no aggregate base, no audit fields and no event list; the store has no save interceptor, so
the code that writes publishes the event by hand after the write (`create-domain-event-handler` § Decision 2 —
dispatch trigger). The other domain rules hold: a change that carries a rule is a method, a broken rule throws the
domain error, the action object comes last, no system clock.

## Document File: `{Svc}.Domain/{Documents}/{Name}.cs`

The document derives the document base and carries Redis OM's attributes; `redis-patterns` § Document Base and
§ Document Decoration have the samples and the attribute guide. Redis OM sets members through public setters, so a
document is the one domain type with them.

## Registration, Indexes, Seeding

The open-generic repository, the index created at start-up for every top-level document, and the test-data seed are
`redis-patterns`' (§ DI Registration, § Indexes and Seeding at Start-up).

## Key Differences from EF Core

- No aggregate base, no audit fields, no event list, no migrations — the attributes are the schema.
- A parent with child collections is replaced whole (`ReplaceAsync`), not updated.
- Events are published by the writer after the write, never by a save interceptor.
