---
name: redis-patterns
description: Redis OM persistence — when Redis fits as a primary store, the document model, the repository over one collection, the replace-whole rule for child collections, index creation and seeding at start-up, and the registration. Use when working with a Redis-backed service.
user-invocable: true
---

# Redis Patterns (Redis OM)

## Assumes

- **Redis Stack** (search and JSON modules) and the **Redis OM** and **StackExchange.Redis** packages.
- **The error family and guards** (`error-handling`), **the event publisher** for the publish-after-write path
  (`create-domain-event-handler`).
- No shared library: the document base and the repository are sampled whole below and built once under Look First.

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

## When to Use Redis as Primary DB

Use for: read-heavy, a shallow model, data that fits in memory, very fast reads — reference data, lookups,
configuration, light create-read-update-delete. Do **not** use for: deep aggregates, invariants across documents,
transactions across documents, reporting, data larger than memory. Typically one or two services of a system.

## Document Base

```csharp file=Document.cs
public abstract class Document
{
    [RedisIdField]
    [Indexed]
    public int Id { get; set; }
}
```

A Redis document has no aggregate base, no audit fields and no event list; the code that writes publishes the event
after the write (`create-domain-event-handler` § Decision 2 — dispatch trigger). Redis OM sets members through public
setters, so a document is the one domain type with them; changes that carry a rule still go through methods on it.

## Document Decoration

```csharp file=Product.cs
[Document(StorageType = StorageType.Json, Prefixes = [nameof(Product)])]
public class Product : Document
{
    [Indexed]
    public required string Code { get; set; }

    [Searchable]
    public required string Name { get; set; }

    [Indexed(Sortable = true)]
    public string NormalizedName { get; set; } = null!;

    [Indexed(JsonPath = "$.Code")]
    public List<ProductVariant> Variants { get; set; } = [];

    public void Rename(string name)
    {
        Name = Guard.ThrowIfNullOrWhiteSpace(name);
        NormalizedName = name.ToUpperInvariant();
    }
}
```

- `[Indexed]` — equality and range queries; `[Indexed(Sortable = true)]` — sortable.
- `[Searchable]` — full-text search.
- `[Indexed(JsonPath = "$.Code")]` on the parent's collection member indexes a nested field; nested documents have no
  index of their own.
- `StorageType.Json` for nested objects, `StorageType.Hash` for flat ones.
- A normalised copy of a name (`NormalizedName`) gives case-insensitive equality without full-text search.

## Repository

One repository over one collection, registered open-generic. It numbers new documents from a per-type counter:

```csharp file=DocumentRepository.cs
public class DocumentRepository<T>(RedisConnectionProvider provider, IConnectionMultiplexer _redis)
    where T : Document
{
    private readonly IRedisCollection<T> _collection = provider.RedisCollection<T>();

    public Task<T?> GetByIdAsync(int id) => _collection.FindByIdAsync(id.ToString());

    public async Task<T> GetByIdOrThrowAsync(int id) => (await GetByIdAsync(id)).OrThrowNotFound(id);

    public Task<bool> ExistsAsync(int id) => _collection.AnyAsync(document => document.Id == id);

    public async Task AddAsync(T document)
    {
        if (document.Id == 0)
            document.Id = (int)await _redis.GetDatabase().StringIncrementAsync($"{typeof(T).Name}:Id:Sequence");

        await _collection.InsertAsync(document);
    }

    public Task UpdateAsync(T document) => _collection.UpdateAsync(document);

    public async Task ReplaceAsync(T document)
    {
        await _collection.DeleteAsync(document);
        await _collection.InsertAsync(document);
    }

    public Task RemoveAsync(T document) => _collection.DeleteAsync(document);
}
```

Redis OM's methods take no cancellation token, so none is passed on.

### Replace a parent whole

**Redis OM does not persist changes to nested child collections through `UpdateAsync`.** Save a parent whose child
list changed with `ReplaceAsync` (delete, then insert); use `UpdateAsync` only for changes to its own scalar members.
Delete-then-insert is not atomic — fine for low-write administration, risky for concurrent writes.

## Multi-Collection Reads

A read that spans collections takes a small read store holding the collections it needs:

```csharp file=CatalogReadStore.cs
public class CatalogReadStore(RedisConnectionProvider provider)
{
    public IRedisCollection<Product> Products { get; } = provider.RedisCollection<Product>();

    public IRedisCollection<Category> Categories { get; } = provider.RedisCollection<Category>();
}
```

## DI Registration

In the persistence project's `AddPersistenceServices(services, configuration)`, which reads its connection string
itself:

```csharp
var connectionString = configuration.GetRequiredConnectionString("Redis");

services.AddSingleton(new RedisConnectionProvider(connectionString));
services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(connectionString.Replace("redis://", string.Empty)));
services.AddScoped(typeof(DocumentRepository<>));
services.AddScoped<CatalogReadStore>();
```

## Indexes and Seeding at Start-up

Both run from the start-up file's InitData region, through extensions on the host — never in a constructor:

```csharp file=RedisStartupExtensions.cs
public static class RedisStartupExtensions
{
    public static async Task CreateIndexesAsync(this IHost host)
    {
        var provider = host.Services.GetRequiredService<RedisConnectionProvider>();
        await provider.Connection.CreateIndexAsync(typeof(Product));
        await provider.Connection.CreateIndexAsync(typeof(Category));
    }

    public static async Task SeedTestDataAsync(this IHost host)
    {
        var provider = host.Services.GetRequiredService<RedisConnectionProvider>();
        var products = provider.RedisCollection<Product>();
        if (await products.AnyAsync())
            return;

        await products.InsertAsync(SeedFile.Read<Product>("Data/Test"));
        await host.Services.GetRequiredService<IConnectionMultiplexer>().GetDatabase()
            .StringSetAsync($"{nameof(Product)}:Id:Sequence", 100);
    }
}
```

Index only top-level documents. After seeding rows with explicit ids, move the id counter past them, or the next
`AddAsync` reuses an id. Test data is seeded in development only. `SeedFile` is `persistence-patterns`' seed reader.
