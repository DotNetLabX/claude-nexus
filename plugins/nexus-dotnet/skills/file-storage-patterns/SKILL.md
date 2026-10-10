---
name: file-storage-patterns
description: Compose a pluggable file-storage module inside a service — choose a storage provider (for example Mongo GridFS, Azure Blob or MinIO), add a second store through an options marker type, register the own store as a singleton and each extra store scoped, write uploads with a compensating delete, and copy file bytes across lifecycle stages in consumers. Use when a service uploads, downloads or deletes a file, needs a second file store (its own plus another stage's), registers an IFileService, or when a stage-change consumer must copy files from the previous stage's store.
user-invocable: true
---

# File Storage Patterns

A file-storage module — one contract plus swappable provider implementations — is the only way a service touches
file bytes. Each service **owns its storage** and takes it through one interface, `IFileService`. Where a service
needs more than one store, the second is told apart by a **marker type**, `IFileService<TOptions>` — the repo's
choice of marker over key (`service-registration` § Registration Patterns).

Templates for every phase are in `references/templates.md`; the samples use an ordering service storing order
documents.

## Assumes

- **One storage provider per service** and its client package (MongoDB.Driver for GridFS, Azure.Storage.Blobs, a
  MinIO client).
- **The settings binder** (`service-infra-conventions` § 3. Options binding — fail fast at startup) and **the error
  family** (`error-handling`).
- No shared library: the contract and a provider's registration are sampled whole and built once, in the shared
  place, under Look First.

<!-- nexus-gen coding-conventions sections="look-first" BEGIN -->
#### Look First

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a save interceptor, an event publisher — look at what the repo already has: first
`project-lists.md` § Helpers, then the shared libraries, modules and packages the project can reach (its project
references and the central package file). Use what you find. Only otherwise build it once, in the shared place: the
lowest project every user of it already references; in a repo of one project, a `Shared` folder in it; where the
users share no project, a new shared project each of them references, with no reference cycle. Never a copy beside
each user. Add its row to `project-lists.md` § Helpers in the same change.
<!-- nexus-gen coding-conventions END -->

## When to use

- A feature uploads, downloads or deletes a file.
- A service needs a **second** store — its own, plus read access to another stage's.
- A service registers an `IFileService`.
- A stage-change consumer must move an aggregate's files from the previous stage's store into its own.

## The five phases

### Phase 1 — Choose the provider (per service)

Each service picks **one own store**, as one visible line in its registration — never chosen by a setting. It is
registered as the plain `IFileService`, a singleton. No store is shared between services.

### Phase 2 — Subclass the options per extra store (the marker type)

A second store is a second `IFileService`, told apart by its type: subclass the provider's options into an empty
marker and resolve `IFileService<ThatMarker>`. The marker carries no members; it binds its own settings section.

```csharp file=OrderingFileStorageOptions.cs
public class OrderingFileStorageOptions : GridFsFileStorageOptions;
```

### Phase 3 — Register (singleton default + scoped per extra)

- **The own store** — `AddGridFsFileStorageAsSingleton(configuration)` (or the Azure equivalent): the client and the
  bucket are singletons, reused across requests.
- **Each extra store** — `AddGridFsFileStorageAsScoped<TOptions>(configuration)`: registers `IFileService<TOptions>`
  scoped, bound to `TOptions`' own section. The marker type is what lets one service hold two.

```csharp
services.AddGridFsFileStorageAsSingleton(configuration);
services.AddGridFsFileStorageAsScoped<OrderingFileStorageOptions>(configuration);
```

### Phase 4 — Upload with a compensating delete

The file lands in its store **before** the row commits, and the two share no transaction. So: upload first, then
change the aggregate and save inside a `try`; on any failure, delete the uploaded file and rethrow. The `catch` only
cleans up — it never builds a reply or swallows.

```csharp
var file = await _fileService.UploadAsync(request, stream, ct: ct);
try
{
    order.AddDocument(command.Kind, file.FileId, command);
    await _orderRepository.SaveChangesAsync(ct);
}
catch
{
    await _fileService.TryDeleteAsync(file.FileId, ct);
    throw;
}
```

Never save first and upload after: a failed upload would leave a row pointing at nothing.

### Phase 5 — Copy bytes across stages (consumers)

When an aggregate moves to another service's stage, that service's consumer **copies** each file's bytes from the
previous stage's store into its own — download from `IFileService<{PreviousStage}Options>`, upload into the plain
`IFileService`. No shared store, no passed link. The cost is a copy per stage; the gain is that each service owns its
storage. The consumer's sample is `consumer-patterns` (`../consumer-patterns/references/write-side-consumer.md`).

## Variant decision — factory vs direct injection

| Situation | Wiring |
|-----------|--------|
| The store is chosen at run time, per call, from the data | a factory delegate, `FileServiceFactory`, keyed by an enum |
| Both stores are always used together (read the foreign one, write the own one) | inject both — `IFileService<ForeignOptions>` and `IFileService` |

Pay for the factory only when the choice is really made at run time (`references/templates.md` § 5).

## Binding rules

- **The type is the key.** Extra stores resolve as `IFileService<TOptions>`, not a keyed registration: the storage
  module is the repo's own code, and keyed registrations stay only for a library that already keys its clients.
- **Only the contract records cross the boundary** — `FileUploadRequest` and `FileMetadata`. A provider's own types
  stay inside its implementation.
- **Each service owns its storage.** A stage change copies bytes; it never shares a store.
- **The provider is a visible line** in the registration, never selected by a setting.
- **Names are spelled correctly** — `AsSingleton`, not a misspelling copied from elsewhere.

## Verify

```bash
rg -n "AddKeyed" {Svc}                                   # no keyed registration — expect zero
rg -n "class \w+FileStorageOptions : \w+FileStorageOptions;" {Svc}   # each extra store is an empty marker
rg -n "TryDeleteAsync" {Svc}                             # one per upload path
rg -n "BsonDocument|BlobHttpHeaders" {Svc} --glob '!**/FileStorage/**'   # no provider type outside the module — expect zero
```

## Templates

`references/templates.md` holds each phase in full: the contract, the options marker, the GridFS registration, the
upload handler, and the factory with its registration. The cross-stage copy is in `consumer-patterns`.

## What this skill does NOT do

- The consumer's wiring and idempotency — `consumer-patterns`; this skill owns only the byte copy inside it.
- The integration event that triggers the copy — `add-integration-event`.
- Where other dependencies are registered — `service-registration`.
