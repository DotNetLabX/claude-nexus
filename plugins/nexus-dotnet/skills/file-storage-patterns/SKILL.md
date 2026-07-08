---
name: file-storage-patterns
description: Compose a pluggable file-storage module inside a service — choose a storage provider (e.g. Mongo GridFS / Azure Blob / MinIO), add a second store via a generic options-marker subclass, wire singleton-default plus scoped-per-extra registration, write uploads with a compensating TryDeleteAsync, and migrate file bytes across lifecycle stages in consumers. Use when a service uploads, downloads, or deletes a file asset, needs a second file store (its own plus a foreign stage's), registers an IFileService, or when a stage-change consumer must copy files from the previous stage's store.
user-invocable: true
---

# File Storage Patterns

A pluggable file-storage module (a `FileService.Contracts` package plus swappable provider implementations — e.g. `FileService.MongoGridFS` / `FileService.AzureBlob` / `FileService.MinIO`) is the only way a service touches file bytes. Each service **owns its storage engine** and injects the module through one interface, `IFileService`. When a service needs more than one store, the disambiguator is the **generic options-marker type** `IFileService<TFileStorageOptions>` — the type system is the DI key, never keyed DI (no `AddKeyed`).

Full copy-paste templates for every step below live in `references/templates.md`.

> **Worked exemplar — the reference app (dotnet-microservices).** The concrete provider choices, service names (Submission / Review / Production), option-marker classes (`SubmissionFileStorageOptions`, `ReviewFileStorageOptions`), and the article-asset migration are that app's Articles pipeline. The pattern below is provider- and domain-neutral; substitute your own providers and aggregate.

## When to use

- A feature uploads, downloads, or deletes a file asset.
- A service needs a **second** store — its own, plus read access to a foreign stage's store.
- You are registering an `IFileService` in a service's `DependencyInjection.cs`.
- A stage-change consumer must move an aggregate's files from the previous stage's store into its own.

## The five phases

### Phase 1 — Choose the provider (per service)

Each service picks **one primary store**, chosen at compile time as a visible line in `DependencyInjection.cs` — never a config or reflection switch. It is registered as the non-generic `IFileService` singleton. Rule: each service owns its file-storage technology — no bucket is shared across services.

Reference app: Submission and Review use Mongo GridFS; Production uses Azure Blob.

### Phase 2 — Subclass the options per extra store (the DI key)

When a service needs a **second** store (typically read access to the previous stage's bucket so it can migrate bytes), register it as a second `IFileService` instance. .NET DI cannot hold two `IFileService` registrations told apart by a runtime key without keyed DI — and this pattern never uses keyed DI. Instead the **type** is the key: subclass the provider's options into an empty marker, then resolve the closed generic `IFileService<ThatMarker>`.

```csharp
namespace {Svc}.API.FileStorage;

// The service's own store stays the non-generic IFileService (Phase 1).
// This empty subclass exists only to be a distinct closed generic that
// resolves the foreign (previous-stage) bucket, bound to its own config section.
public class {PrevStage}FileStorageOptions : MongoGridFsFileStorageOptions;
```

The subclass carries no members. Its only job is to make `IFileService<{PrevStage}FileStorageOptions>` a resolvable, distinct DI key. (Reference app: `SubmissionFileStorageOptions`, `ReviewFileStorageOptions`.)

### Phase 3 — Register (singleton default + scoped per extra)

- **Own / primary store** → `AddMongoFileStorageAsSingletone(config)` (registers the `IFileService` singleton on the default `MongoGridFsFileStorageOptions`) or `AddAzureFileStorage(config)` for Azure. Client and bucket are singletons for connection reuse.
- **Each extra store** → `AddMongoFileStorageAsScoped<TOptions>(config)` (registers `IFileService<TOptions>` scoped, bound to `TOptions`' own config section). `TOptions` is mandatory here — it is what lets DI hold more than one `IFileService`.

Call the module's extension; do not hand-build the client. Reference-app wiring:

```csharp
// Submission — one store:
services.AddMongoFileStorageAsSingletone(config);

// Review — own GridFS + read access to Submission's GridFS + the runtime factory (Phase 4 variant):
services.AddMongoFileStorageAsSingletone(config);
services.AddMongoFileStorageAsScoped<SubmissionFileStorageOptions>(config);
services.AddFileServiceFactory();

// Production — own Azure Blob + read access to Review's GridFS:
services.AddAzureFileStorage(configuration);
services.AddMongoFileStorageAsScoped<ReviewFileStorageOptions>(configuration);
```

### Phase 4 — Upload with a compensating delete

The file write lands in the storage engine **before** the SQL row commits, and the two stores share no transaction. So the order is fixed: **upload first, then** wrap the domain mutation and `SaveChangesAsync` in try/catch; on any exception, compensate with `TryDeleteAsync(storagePath)` and rethrow. Same shape in every write-side service, whether the handler is MediatR or FastEndpoints.

```csharp
var uploadResponse = await UploadFile(command, asset, assetType, ct);
try
{
    asset.CreateFile(uploadResponse, assetType, command);
    await _repository.SaveChangesAsync();
}
catch (Exception)
{
    await _fileService.TryDeleteAsync(uploadResponse.StoragePath); // delete the file if something is wrong
    throw;
}
```

Never invert to mutate-save-then-upload: a failed upload after a committed row would leave the row pointing at nothing.

### Phase 5 — Migrate bytes across stages (consumers)

When an aggregate advances a stage, the receiving service's consumer **physically copies** each asset's bytes from the previous stage's store into its own — `DownloadAsync` from the foreign `IFileService<{PrevStage}Options>`, `UploadAsync` into the own `IFileService`. No shared bucket, no passing a URL or pointer. The deliberate cost is byte duplication per stage; the payoff is that each service owns its storage.

```csharp
var (fileStream, fileMetadata) = await prevStageFileService.DownloadAsync(assetDto.File.FileServerId, ct);

var uploadedMetadata = await ownFileService.UploadAsync(
    new FileUploadRequest(fileMetadata.StoragePath, fileMetadata.FileName, fileMetadata.ContentType, fileMetadata.FileSize),
    fileStream,
    ct: ct);

asset.CreateAndAddFile(uploadedMetadata, assetType);
```

## Variant decision — factory vs direct injection

How a consumer or handler obtains its two stores depends on whether the choice is dynamic:

| Situation | Wiring | Reference-app example |
|-----------|--------|-----------------------|
| The store is decided at runtime per call (a handler picks the foreign store vs the own store depending on the data) | enum-keyed delegate `FileServiceFactory` | Review |
| Both stores are always needed together (always read the foreign one, always write the own one) | direct multi-parameter injection — `IFileService<ForeignOptions>` + `IFileService` | Production |

Rule: pay for the factory ceremony **only** when the choice is dynamic. If the code always touches both stores, just inject both.

Factory shape, enum keys switched to closed-generic resolutions:

```csharp
public enum FileStorageType { Own, Foreign }
public delegate IFileService FileServiceFactory(FileStorageType fileStorageType);

services.AddScoped<FileServiceFactory>(serviceProvider => fileStorageType => fileStorageType switch
{
    FileStorageType.Foreign => serviceProvider.GetRequiredService<IFileService<ForeignFileStorageOptions>>(),
    FileStorageType.Own     => serviceProvider.GetRequiredService<IFileService>(), // own store = the non-generic singleton
    _ => throw new ApplicationException()
});
```

The own-store arm resolves the non-generic `IFileService` — the singleton from Phase 3 — because a service registers its own store only under that plain interface. Foreign stores are the closed generic `IFileService<TOptions>`.

> **Correctness note (reference app).** The shipped Review factory keys its own arm to a closed generic (`IFileService<MongoGridFsFileStorageOptions>`) that its registration does not provide; the resolvable form is the one above — own arm resolves the non-generic `IFileService`, foreign arm the closed generic — matching how the own store is actually registered.

## Binding rules

- **The type system is the DI key.** Resolve extra stores as `IFileService<TOptions>` closed generics; never `AddKeyed` or named lookup.
- **Only the contract records cross the boundary.** Pass `FileUploadRequest` and `FileMetadata` — plain immutable records defined once in the contracts package. Provider-native types (`BsonDocument`, `BlobHttpHeaders`, GridFS tagging) never cross `IFileService`; they stay inside the provider adapter.
- **Each service owns its storage.** No shared bucket, no cross-service `IFileService` injection at rest. A stage change copies bytes (Phase 5); it does not share a store.
- **Provider choice is a visible code line** — one explicit `Add*FileStorage(config)` call in `DependencyInjection.cs`, never config or reflection selection.

## Verify

After wiring a service's file storage, run these post-conditions (replace `{Svc}` with the service folder; provider names shown are the reference app's):

```bash
# no keyed DI crept in (the type is the key):
rg -n "AddKeyed" src/Services/{Svc}            # expect zero

# Phase 2 — each extra store is an EMPTY options subclass:
rg -n "class \w+FileStorageOptions : (MongoGridFsFileStorageOptions|AzureBlobFileStorageOptions);" src/Services/{Svc}

# every upload write path compensates on failure:
rg -n "TryDeleteAsync" src/Services/{Svc}      # one per upload handler/endpoint

# no provider-native type leaks across the boundary:
rg -n "BsonDocument|BlobHttpHeaders|Tagging" src/Services/{Svc}   # expect zero
```

## Templates

`references/templates.md` holds the full lifted code for each phase: the boundary contract, the options subclass, the Mongo and Azure registration extensions, both upload handlers (MediatR and FastEndpoints), the factory with its registration, and the direct-injection consumer with cross-stage migration.

## What this skill does NOT do

- Author or edit the stage-change consumer's wiring and idempotency — that is `consumer-patterns`; this skill owns only the file-byte migration inside it.
- Define the cross-service integration event that triggers the migration consumer — that is `add-integration-event`.
- Register non-file-storage dependencies — DI layer placement is `service-registration`.
