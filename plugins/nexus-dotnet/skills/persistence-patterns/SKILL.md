---
name: persistence-patterns
description: EF Core persistence — the data context named for its service, one configuration class per table, migrations, repositories over one base, read stores for raw reads, the save interceptor that sends domain events, seeding, and the cache of a small stable table. Use when working with database entities, a repository or a read store, a table configuration, seeding, or the persistence project's registration.
user-invocable: true
---

# Persistence Patterns (EF Core)

Every service stores its data through EF Core: a data context, one configuration class per table, migrations, and
repositories over one shared base. Raw SQL stays only where EF has no answer, inside read stores. The samples use an
ordering service; substitute your own.

## Assumes

- **EF Core** with a relational provider (SQL Server or PostgreSQL), and its migrations tool.
- **The aggregate base** (`create-aggregate` § The Aggregate Base), **the error family and guards**
  (`error-handling`), **the event publisher** (`create-domain-event-handler`).
- No shared library: the repository base, the queryable lookup, the save interceptor, the start-up migration, the
  seeding reader, the cache loader and its reader are sampled whole below and built once under Look First.

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

## Spine Rules

- **EF Core for every table the service owns,** in every service and module. SQL only where EF has no answer — a
  search EF cannot express, a read on a database the service does not own — and that SQL lives in a read store.
- **A table another library creates and owns** is not an EF table: no configuration and no migration for it, and it
  keeps that library's names.
- **The persistence project holds** the data context, the table configurations, the migrations, the repositories and
  read stores, the seeding, the cache loader and its registration — and declares no records, enums or settings of
  its own. It has `Repositories/` and `Data/` folders and one `DependencyInjection` class.
- **No project references an API project,** and a service never references another service's projects.
- **The repository or the data context is the unit of work.** Handlers call `SaveChangesAsync(ct)` once; the save
  interceptor sends the domain events on that save.
- **Registration is explicit:** the generic repository by one open-generic line, each derived repository and read
  store by its own scoped line — no assembly scan, no factory lambda per repository.
- **Table set-up runs at start-up** through migrations, never as a repository method; a lock that keeps two
  instances from migrating at once lives with the migration runner, if one is still needed.

## Repository Pattern (3-Tier)

### Tier 1: The base

Built once, in the lowest project every service's persistence references. No interface: a repository has one
implementation, and a test uses the real one against a test database.

```csharp file=RepositoryBase.cs
public abstract class RepositoryBase<TContext, TEntity>(TContext dbContext)
    where TContext : DbContext
    where TEntity : Entity<int>
{
    public async Task<TEntity?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await Entities.FindAsync([id], ct);

    public async Task<TEntity> GetByIdOrThrowAsync(int id, CancellationToken ct = default) =>
        (await GetByIdAsync(id, ct)).OrThrowNotFound(id);

    public Task<bool> ExistsAsync(int id, CancellationToken ct = default) =>
        Entities.AnyAsync(entity => entity.Id == id, ct);

    public async Task AddAsync(TEntity entity, CancellationToken ct = default) =>
        await Entities.AddAsync(entity, ct);

    public void Update(TEntity entity) => Entities.Update(entity);

    public void Remove(TEntity entity) => Entities.Remove(entity);

    public virtual async Task UpsertAsync(TEntity entity, CancellationToken ct = default)
    {
        var existing = await GetByIdAsync(entity.Id, ct);
        if (existing is null)
            await AddAsync(entity, ct);
        else
            DbContext.Entry(existing).CurrentValues.SetValues(DbContext.Entry(entity).CurrentValues);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => DbContext.SaveChangesAsync(ct);

    protected TContext DbContext { get; } = dbContext;

    protected DbSet<TEntity> Entities => DbContext.Set<TEntity>();

    protected virtual IQueryable<TEntity> Query() => Entities;
}
```

`Query()` is the base's one queryable seam, and it is protected: a derived repository composes its own lookups on
it, and nothing outside the repository receives it (`conventions/ef-core.md` § Queries).

`UpsertAsync` copies through EF's property values, never `SetValues(object)`: the object overload uses plain
reflection and skips members mapped to private fields. Neither copies an owned or complex member deeply — assign
those by hand.

### Tier 2: The service's repository

One line binds the base to the service's context; it serves every table with no lookups of its own:

```csharp file=Repository.cs
public class Repository<TEntity>(OrdersDbContext dbContext) : RepositoryBase<OrdersDbContext, TEntity>(dbContext)
    where TEntity : Entity<int>;
```

### Tier 3: A repository with its own lookups

A table that needs lookups beyond the base gets its own repository, with no interface. Names: a lookup by key is
`GetBy{Key}Async` — the base's own are `GetByIdAsync` and `GetByIdOrThrowAsync`; `Find…` is a search by something
that is not a key, which may return none or many; existence is `Exists…`; writes are `AddAsync`, `Update`,
`Remove`, `UpsertAsync`. A required lookup throws not-found:

```csharp file=OrderRepository.cs
public class OrderRepository(OrdersDbContext dbContext) : Repository<Order>(dbContext)
{
    public Task<Order> GetByIdWithLinesOrThrowAsync(int id, CancellationToken ct = default) =>
        Query().Include(order => order.Lines).SingleOrThrowAsync(order => order.Id == id, ct);

    public async Task<IReadOnlyList<Order>> FindOpenForCustomerAsync(int customerId, CancellationToken ct = default) =>
        await Query().Where(order => order.CustomerId == customerId && order.Status == OrderStatus.Placed).ToListAsync(ct);
}
```

### The queryable throwing lookup

```csharp file=QueryableExtensions.cs
using System.Linq.Expressions;

public static class QueryableExtensions
{
    public static async Task<T> SingleOrThrowAsync<T>(this IQueryable<T> query, Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        where T : class =>
        await query.SingleOrDefaultAsync(predicate, ct)
            ?? throw new NotFoundException($"No {typeof(T).Name} matches the lookup.");
}
```

### Read stores

A read-only class is a read store, `…ReadStore`: the queries a read needs, often projected, and the raw SQL EF has
no answer for. It returns domain types or a two-element named pair, never a reply type of the API project:

```csharp file=OrderReadStore.cs
public class OrderReadStore(OrdersDbContext _dbContext)
{
    public async Task<(IReadOnlyList<Order> Orders, int Total)> ListAsync(OrderStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _dbContext.Orders.AsNoTracking().Where(order => status == null || order.Status == status);
        var total = await query.CountAsync(ct);
        var orders = await query.OrderByDescending(order => order.CreatedOn).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return (orders, total);
    }
}
```

## Entity Configuration

- **One configuration class per table,** `{Entity}Configuration : IEntityTypeConfiguration<T>`, applied by the
  context; lengths from the field-length constants (`create-aggregate` § Field-Length Constants), never a literal.
- **Enums are stored as text** (`HasConversion<string>()`).
- **Value objects** map as complex types (`ComplexProperty`, flat columns) or owned types (`OwnsOne`, a separate or
  JSON column).
- **The concurrency token is off by default.** Turn it on for a table only with a stated reason (two writers really
  race on it); a sample that turns it on for every table teaches a cost with no need.
- **Ids and times:** which id type and which time type an entity uses is not settled; a table keeps the types its
  entity has. One `Guid` in a route reads fine, several ids in one route do not, and a catalog needs no `Guid`.
- **Schemas:** a module that owns tables owns its schema (`HasDefaultSchema`) and its own migration history; a
  service has no schema of its own.
- **Table and column names, a choice:** the entity type's name (the default), or lower-case with underscores — the
  form a database or other SQL readers expect, since mixed-case names must be quoted in every SQL text. Pick one per
  repo and apply it in the context, not per table. A table another library owns keeps that library's names.

```csharp file=CustomerConfiguration.cs
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(customer => customer.Id);
        builder.Property(customer => customer.Name).HasMaxLength(MaxLength.Name).IsRequired();
        builder.ComplexProperty(customer => customer.Email, email =>
            email.Property(value => value.Value).HasColumnName("Email").HasMaxLength(MaxLength.Email));
        builder.Property(customer => customer.Tier).HasConversion<string>().HasMaxLength(MaxLength.Code);
    }
}
```

**Changing a tracked entity.** An aggregate changes through its behaviour methods; nothing copies a command's members
onto a tracked entity. Where a replica row is replaced whole, `UpsertAsync` copies its values; an owned or complex
member is assigned by hand. The check that catches a write that silently did nothing is **save, reload, assert the
value changed** — a test, not a reading of the code.

## DbContext Setup

The context is named for its service — `OrdersDbContext`, never `AppDbContext` — derives `DbContext` (or
`IdentityDbContext<…>` where the service uses ASP.NET Core Identity), and applies its configurations from its
assembly, which is the data context's own discovery:

```csharp file=OrdersDbContext.cs
public class OrdersDbContext(DbContextOptions<OrdersDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();

    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OrdersDbContext).Assembly);
}
```

The provider is the service's choice — `UseSqlServer` or `UseNpgsql` — made once in the registration below. A
Redis-backed service uses no EF Core (`redis-patterns`).

```csharp file=DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetRequiredConnectionString("Orders");

        services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
        services.AddDbContext<OrdersDbContext>((provider, options) => options
            .UseSqlServer(connectionString)
            .AddInterceptors(provider.GetServices<ISaveChangesInterceptor>()));

        services.AddScoped(typeof(Repository<>));
        services.AddScoped<OrderRepository>();
        services.AddScoped<OrderReadStore>();
        services.AddMemoryCache();
        services.AddHostedService<SmallTableCacheLoader<OrdersDbContext, OrderStateTransition>>();

        return services;
    }
}
```

## Save Interceptor

Sends the domain events of the tracked aggregates after a successful save — the one place domain events are sent on
an EF Core store:

```csharp file=DispatchDomainEventsInterceptor.cs
public class DispatchDomainEventsInterceptor(IDomainEventPublisher _domainEventPublisher) : SaveChangesInterceptor
{
    public override async ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            await DispatchAsync(eventData.Context, cancellationToken);

        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    private async Task DispatchAsync(DbContext dbContext, CancellationToken ct)
    {
        var aggregates = dbContext.ChangeTracker.Entries<IAggregateRoot>()
            .Select(entry => entry.Entity)
            .Where(aggregate => aggregate.DomainEvents.Count > 0)
            .ToList();
        var domainEvents = aggregates.SelectMany(aggregate => aggregate.DomainEvents).ToList();

        foreach (var aggregate in aggregates)
            aggregate.ClearDomainEvents();

        foreach (var domainEvent in domainEvents)
            await _domainEventPublisher.PublishAsync(domainEvent, ct);
    }
}
```

The events are cleared before they are sent, so a handler that saves again does not send them twice. **The
transactional flavour** is described here, not sampled: it opens a transaction before the save (in
`SavingChangesAsync`), sends after it, and commits — so a handler's writes land with the trigger's; use it only where
a handler must write in that same transaction (`create-domain-event-handler` § Decision 3 — interceptor flavor (interceptor path only)).

## Migrations at Start-up

Table set-up runs once, at start-up, from the start-up file's InitData region — one line per data context, before
the service takes requests:

```csharp file=MigrationExtensions.cs
public static class MigrationExtensions
{
    public static IHost Migrate<TContext>(this IHost host)
        where TContext : DbContext
    {
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TContext>().Database.Migrate();

        return host;
    }
}
```

## Seed Data (Dual Pattern)

Two kinds of seed data, two places — never a repository method:

- **Master data** — rows that ship with the schema (a transition table, a list of kinds): the table configuration
  reads the JSON file and seeds it with `HasData`, so the rows land in a migration.
- **Test data** — rows for local work: a seeding step called from the start-up file's InitData region, in
  development only.

```csharp file=SeedFile.cs
using System.Text.Json;
using System.Text.Json.Serialization;

public static class SeedFile
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static IReadOnlyList<TEntity> Read<TEntity>(string folder)
    {
        var path = Path.Combine(AppContext.BaseDirectory, folder, $"{typeof(TEntity).Name}.json");
        if (!File.Exists(path))
            throw new InvalidOperationException($"The seed file {path} is missing.");

        return JsonSerializer.Deserialize<List<TEntity>>(File.ReadAllText(path), JsonOptions)
            ?? throw new InvalidOperationException($"The seed file {path} holds no rows.");
    }
}
```

A master-data configuration seeds with `builder.HasData(SeedFile.Read<OrderStateTransition>("Data/Master"))`. The
test-data step is the service's own, called in development only, and adds the rows of a table that is still empty:

```csharp file=SeedExtensions.cs
public static class SeedExtensions
{
    public static IHost SeedTestData(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<OrdersDbContext>();
        if (!dbContext.Customers.Any())
        {
            dbContext.Customers.AddRange(SeedFile.Read<Customer>("Data/Test"));
            dbContext.SaveChanges();
        }

        return host;
    }
}
```

**The gotchas:**

- **A missing seed file fails,** as above — a reader that returns nothing for a missing file hides a broken deploy.
- **The file is named after the entity type exactly** (`OrderStateTransition.json`).
- **The files are copied to the output** — the persistence project file carries
  `<None Update="Data\**\*.json" CopyToOutputDirectory="PreserveNewest" />`.
- **Explicit ids in test data** need the provider's identity-insert switch while the rows are added (SQL Server).
- **ASP.NET Core Identity users** are seeded through `UserManager`, never as rows.

## Caching Small Tables

A table that is truly small and stable — a transition table, a list of kinds — is cached once, whole, in the
persistence layer, keyed by its entity type's name, and read from the cache everywhere else. Only for such a table:
a cache is one more thing that can be stale. It is filled at start-up by a hosted service, never in a constructor:

```csharp file=SmallTableCacheLoader.cs
public class SmallTableCacheLoader<TContext, TEntity>(IServiceScopeFactory _scopeFactory, IMemoryCache _cache, ILogger<SmallTableCacheLoader<TContext, TEntity>> _logger)
    : IHostedService
    where TContext : DbContext
    where TEntity : class
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TContext>();
        IReadOnlyList<TEntity> rows = await dbContext.Set<TEntity>().AsNoTracking().ToListAsync(cancellationToken);

        _cache.Set(typeof(TEntity).Name, rows);
        _logger.LogInformation("Cached {Count} {Table} rows", rows.Count, typeof(TEntity).Name);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

The persistence registration (above) adds the memory cache on the line before the loader: a plain host registers
none, and without it the service cannot start.

A reader takes `IMemoryCache` and reads the table through one shared helper, which fails when the entry is missing;
the cached lists are ordinary values, read from synchronous and asynchronous code alike:

```csharp file=CachedTableExtensions.cs
public static class CachedTableExtensions
{
    public static IReadOnlyList<TEntity> GetCachedTable<TEntity>(this IMemoryCache cache) =>
        cache.Get<IReadOnlyList<TEntity>>(typeof(TEntity).Name)
            ?? throw new InvalidOperationException($"The {typeof(TEntity).Name} table is not cached; the start-up cache loader did not run.");
}
```

## Interceptors

One line in the persistence registration attaches the save interceptor (above). `create-domain-event-handler` covers
the choice between the two flavours and the publish-after-write path of stores with no interceptor.
