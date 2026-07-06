---
name: persistence-patterns
description: EF Core persistence — repository pattern, entity configurations, DbContext setup, seed data, interceptors. Use when working with database entities or persistence infrastructure.
user-invocable: true
---

# Persistence Patterns (EF Core)

## Repository Pattern (3-Tier)

### Tier 1: Interface + Base
**Files:**
- `src/BuildingBlocks/Blocks.EntityFrameworkCore/Repositories/IRepository.cs`
- `src/BuildingBlocks/Blocks.EntityFrameworkCore/Repositories/Repository.cs`

`IRepository<TEntity, TKey>` — comprehensive interface: CRUD, batch, query, save.
`RepositoryBase<TContext, TEntity, TKey>` — generic EF implementation with smart defaults.

Key interface methods: `Query()` (returns `IQueryable`), `AddAsync()`, `SaveChangesAsync()`, `DeleteByIdAsync()` (raw SQL for required-property entities).
Additional `RepositoryBase` methods (not on `IRepository`): `UpsertAsync()`, `FindByIdAsync()`, `TableName`.

**`UpsertAsync` value-copy rule — copy through EF `PropertyValues`, never `SetValues(object)`.** When applying a detached entity onto a tracked one, go through EF's property machinery:

```csharp
DbContext.Entry(existing).CurrentValues.SetValues(DbContext.Entry(entity).CurrentValues);
```

The `SetValues(object)` overload with the detached POCO uses plain reflection and **silently skips properties mapped to private backing fields** (`PropertyAccessMode.Field`) — a latent shallow-copy bug invisible to shape greps. Aggregates adopting backing fields must configure the matching access mode in their entity configuration. This is the backing-field sibling of the owned/complex-type caveat: `SetValues` does not deep-copy owned/complex members either — those need explicit member assignment (see "Mapping a Command onto a Tracked Entity" below).

### Tier 2: Service-Level Repository
Each service defines a thin concrete `Repository<TEntity>` binding to its DbContext:
```csharp
public class Repository<TEntity>({Svc}DbContext dbContext)
    : RepositoryBase<{Svc}DbContext, TEntity>(dbContext)
    where TEntity : class, IEntity<int>;
```

### Tier 3: Domain-Specific Repository
Custom queries with eager loading:
```csharp
public class {Entity}Repository({Svc}DbContext dbContext) : Repository<{Entity}>(dbContext)
{
    public override IQueryable<{Entity}> Query()
    {
        return base.Entity
            .Include(e => e.{Navigation})
                .ThenInclude(e => e.{ChildNavigation})
            .Include(e => e.{OtherNavigation});
    }

    public async Task<{Entity}?> GetFullByIdAsync(int id, CancellationToken ct = default)
    {
        return await Query()
            .Include(e => e.{AdditionalNavigation})
            .SingleOrDefaultAsync(e => e.Id == id, ct);
    }
}
```

### Extension: FindByIdOrThrowAsync
**File:** `src/BuildingBlocks/Blocks.EntityFrameworkCore/Extensions/RepositoryExtensions.cs`

Shared extension — do NOT reimplement per service:
```csharp
await repository.FindByIdOrThrowAsync(id);
```

### Repository Registration Variants

| Variant | How | When to use |
|---------|-----|-------------|
| Auto (assembly scan) | `AddDerivedTypesOf(typeof(Repository<>))` | Services with many repositories |
| Manual | `AddScoped<{Entity}Repository>()` per repo | Services with few repositories or explicit control needed |

## Spine Rules

Two load-bearing conventions the persistence layer rests on:

- **Repository is the unit of work.** The repository base owns the commit — handlers call
  `repository.SaveChangesAsync()`, not a separately injected `IUnitOfWork`/`DbContext.SaveChanges`. One
  repository, one transaction boundary; the `DispatchDomainEventsInterceptor` fires on that save. Do not
  expose the `DbContext` directly to handlers to save.
- **Reference data is cached type-keyed.** `ApplicationDbContext<T>` exposes an in-memory cache keyed by
  **entity type** (`GetAllCached<TEntity>`, `GetByIdCached<TEntity>`) for slow-changing reference/master data,
  so repeated reads don't round-trip the database. (Reminder: these helpers use `ref` internally and cannot be
  awaited — call them from synchronous paths, see DbContext Setup.)

## Entity Configuration

### Base: `EntityConfiguration<T>`
**File:** `src/BuildingBlocks/Blocks.EntityFrameworkCore/EntityConfigurations/EntityConfiguration.cs`

- `HasKey(e => e.Id)` + auto-calls `builder.SeedFromJsonFile()`
- `HasGeneratedId` virtual (default `true`) — override to `false` for natural keys

### Audited: `AuditedEntityConfiguration<T>`
**File:** `src/BuildingBlocks/Blocks.EntityFrameworkCore/EntityConfigurations/AuditedEntityConfiguration.cs`

The configuration base is a generic **ladder**, not a flat extend:
`AuditedEntityConfiguration<T> : AuditedEntityConfiguration<T,int> : EntityConfiguration<T,TKey>`.
The `<T>` convenience form fixes `TKey = int`; the two-arg `<T,TKey>` form carries the real key type and
extends `EntityConfiguration<T,TKey>`. Three opt-in override points:
- `HasGeneratedId` — `ValueGeneratedOnAdd()` vs `ValueGeneratedNever()`
- `DefaultDateSql` — default `"GETUTCDATE()"`, override `"NOW() AT TIME ZONE 'UTC'"` for PostgreSQL. **Requires** `Microsoft.EntityFrameworkCore.Relational` package — `HasDefaultValueSql()` is not in the base EF Core package.
- `HasConcurrencyToken` — default `false`, set `true` for opt-in `RowVersion` shadow property

```csharp
public class {Entity}EntityConfiguration : AuditedEntityConfiguration<{Entity}>
{
    protected override bool HasConcurrencyToken => true;

    public override void Configure(EntityTypeBuilder<{Entity}> builder)
    {
        base.Configure(builder);
        // custom configuration...
    }
}
```

### Value Object Mapping
Two approaches:
- `OwnsOne` (owned entity type): `builder.OwnsOne(p => p.Email, ...)`
- `ComplexProperty` (complex type): `builder.ComplexProperty(a => a.Email, ...)`

### Mapping a Command onto a Tracked Entity (Mapster — the write path)

For the **inbound** direction — applying a request/command onto an already-loaded, change-tracked entity (a partial update, e.g. `req.Adapt(existing)`) — two Mapster facts are routinely gotten backwards. Both have caused **silent no-op writes** that pass every existence/shape grep:

- **`IgnoreNonMapped(true)` is a whitelist, not a shield.** It turns OFF name-convention matching and restricts mapping to explicit `.Map()` resolvers only. A config with `IgnoreNonMapped(true)` and **zero** `.Map()` calls maps **nothing** — `req.Adapt(existing)` becomes a no-op and the update silently fails to persist. Do not add it expecting it to "protect" unmatched fields.
- **`.Adapt(onto existing)` already leaves unmatched destination members untouched.** Mapster's default adapt-onto-existing never nulls a destination member that has no matching source. So a name-aligned partial update needs **no** guard at all: register **nothing** and just call `req.Adapt(existing)`.

Net rule: **for a name-aligned `Command → Entity` partial update, register nothing and call `req.Adapt(existing)`** — no `IgnoreNonMapped`, no per-field `.Map()`.

**Exception — `ComplexProperty`/owned VOs on a tracked entity: assign explicitly.** `.Adapt(existing)` does not reliably propagate change-tracking for complex/owned-type members, and `DbContext.Entry(existing).CurrentValues.SetValues(source)` does **not** deep-copy them either — any manual reassignment block already present for JSON/owned members is the signal that newly-grouped VOs need the same treatment (`existing.BugRatio = source.BugRatio;`). Match the existing explicit-assignment pattern (`SaveXraySettings`, `SaveCycleTimeBoundaries`); it is slightly more verbose but EF-safe and unambiguous.

**Verification that actually catches a no-op write:** a silent no-write is invisible to existence/shape greps *and* to "does it leave other fields alone?" reasoning. The only check that catches it is **save → reload → assert the value changed** (or a unit test on the mapping). Any done-check or review of a write path must include a positive-write assertion, not just a non-clobber argument.

See `create-feature` (Mappings workflow) for the Mapster eligibility test and the **outbound** domain→DTO direction.

## DbContext Setup

**File:** `src/BuildingBlocks/Blocks.EntityFrameworkCore/ApplicationDbContext.cs`

- `ApplicationDbContext<TDbContext>` base with in-memory cache helpers (`GetAllCached`, `GetByIdCached`). **Warning:** these methods use `ref` parameters internally — they cannot be called from `async` methods. Call them from synchronous code paths or extract the cached value before entering an async context.

**Variants:**
- `ApplicationDbContext<T>` — most services
- `IdentityDbContext<User, Role, int>` — services using ASP.NET Identity

**Database engine variants:**
- SQL Server: `UseSqlServer(connectionString)` — default
- PostgreSQL: `UseNpgsql(connectionString)` — opt-in per service

(Redis-backed services do not use EF Core at all — see `redis-patterns`.)

## Seed Data (Dual Pattern)

### Master Data (schema-deployed via migrations)
**Files:**
- `src/BuildingBlocks/Blocks.EntityFrameworkCore/Extensions/EntityTypeBuilderExtensions.cs`

Convention: drop a `Data/Master/{EntityName}.json` file → `EntityConfiguration` base auto-calls `builder.SeedFromJsonFile()` → becomes EF `HasData` → included in migrations. Zero code changes needed.

### Test/Dev Data (runtime, behind IsDevelopment guard)
**Files:**
- `src/BuildingBlocks/Blocks.EntityFrameworkCore/Extensions/DbContextExtensions.Seed.cs`
- `src/BuildingBlocks/Blocks.EntityFrameworkCore/Seeding/ManualGenerateIdScope.cs`
- `src/Services/{Svc}/*/Data/Test/Seed.cs` per service

Pattern per service:
```csharp
public static class Seed
{
    public static void SeedTestData(this IServiceProvider services)
    {
        services.SeedTestData<{Svc}DbContext>(context =>
        {
            context.SeedFromJsonFile<{Entity}>();
        });
    }
}
```

- Idempotent: checks `if (context.Set<T>().Any()) return`
- `ManualGenerateIdScope` wraps `SET IDENTITY_INSERT ON/OFF` when JSON has explicit IDs
- JSON file naming: `typeof(T).Name` must match filename exactly

**IMPORTANT:** JSON files must be marked in `.csproj`:
```xml
<ItemGroup>
  <None Update="Data\**\*.json">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
</ItemGroup>
```

### Seed Variants

| Variant | Mechanism | When to use |
|---------|-----------|-------------|
| EF JSON | `context.SeedFromJsonFile<T>()` | EF Core services (default) |
| Identity custom | `UserManager.CreateAsync()` (can't bypass Identity) | Services using ASP.NET Identity |
| Redis JSON | `provider.SeedFromJson<T>(redisDb)` | Redis-backed services |

### Wiring in Program.cs
```csharp
app.Migrate<{Svc}DbContext>();
if (app.Environment.IsDevelopment())
    app.Services.SeedTestData();
```

## Interceptors

Registered in `Persistence/DependencyInjection.cs`:
```csharp
services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
```

See `domain-patterns` skill for interceptor variant details (standard vs transactional).
