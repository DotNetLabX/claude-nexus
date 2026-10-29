---
name: persistence-patterns
description: EF Core persistence — the data context named for its service, one configuration class per table, migrations, repositories over one base that hold every query, the change that survives two writers racing on a row, the save interceptor that sends domain events, seeding, and the cached repository of a small stable table. Use when working with database entities, a repository or a query, a table configuration, seeding, or the persistence project's registration.
user-invocable: true
---

# Persistence Patterns (EF Core)

Every service stores its data through EF Core: a data context, one configuration class per table, migrations, and
repositories over one shared base. Every query written in C# is an EF Core query in a repository; no class reads with
SQL. The samples use an ordering service; substitute your own.

## Assumes

- **EF Core** with a relational provider (SQL Server or PostgreSQL), and its migrations tool.
- **The aggregate base** (`create-aggregate` § The Aggregate Base), **the error family and guards**
  (`error-handling`), **the event publisher** (`create-domain-event-handler`).
- No shared library: the repository base, the cached repository and its start-up warm-up, the save interceptor, the
  start-up migration and the seeding reader are sampled whole below and built once under Look First.
- **SQL that an agent or a user builds at run time** is run by a query runner and is outside this skill.

<!-- nexus-gen coding-conventions sections="look-first" BEGIN -->
#### Look First

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a table-configuration base, a save interceptor, an event publisher — look at what the
repo already has: first `project-lists.md` § Helpers, then the shared libraries, modules and packages the project can
reach (its project references and the central package file). Use what you find. Only otherwise build it once, in the
shared place: the lowest project every user of it already references; in a repo of one project, a `Shared` folder in
it; where the users share no project, a new shared project each of them references, with no reference cycle. Never a
copy beside each user. Add its row to `project-lists.md` § Helpers in the same change. An ordinary class — a table
configuration, a repository, an endpoint, a consumer — derives from the base the repo's libraries offer for its kind,
picked by reading that base's members; a skill's sample is the form for a repo with no such library.
<!-- nexus-gen coding-conventions END -->

## Spine Rules

- **EF Core for every table the service owns,** in every service and module. Every query written in C# is an EF Core
  query, held by a repository as a named read; no class reads with SQL. Never a query against another unit's tables
  or database (§ Data Ownership, below).
- **A table another library creates and owns** is not an EF table: no configuration and no migration for it, and it
  keeps that library's names.
- **The persistence project holds** the data context, the table configurations, the migrations, the repositories,
  the seeding, the start-up warm-up of a cached table and its registration — and declares no records, enums or
  settings of its own. It has `Repositories/` and `Data/` folders and one `DependencyInjection` class.
- **No project references an API project,** except a host project, which references the API project of each service
  or module it runs (`create-host`), and a module's or service's own test project, which may reference that unit's
  API project. A service never references another service's projects.
- **The repository is the unit of work.** No class outside the persistence project uses the data context, for a read
  or a save: a handler, an endpoint, a consumer and a resource access checker go through a repository, and call its
  `SaveChangesAsync(ct)` once; the save interceptor sends the domain events on that save. Inside the persistence
  project, only the start-up steps (migration, seeding) and the save interceptor reach the context beside the
  repositories.
- **Registration is explicit:** the generic repository by one open-generic line, each derived repository by its own
  scoped line — no assembly scan, no factory lambda per repository.
- **Table set-up runs at start-up** through migrations, never as a repository method; a lock that keeps two
  instances from migrating at once lives with the migration runner, if one is still needed.

<!-- nexus-gen ef-core sections="data-ownership" BEGIN -->
#### Data Ownership

- **Every service and business module owns its own tables and its own migration history.**
- **A business module defaults to its own schema in the database it shares; a service defaults to its own
  database.** Either may take the other: a module may keep a database of its own, and a service its own schema in a
  shared database.
- **No foreign key, join or shared table ever crosses from one unit's tables to another's.** A unit reaches another
  unit's data through that unit's contract — a call or an event — never through its tables.
<!-- nexus-gen ef-core END -->

## Repository Pattern (3-Tier)

### Tier 1: The base

Built once, in the lowest project every service's persistence references. No interface: a repository has one
implementation, and a test uses the real one against a test database.

```csharp file=RepositoryBase.cs
using System.Linq.Expressions;

public abstract class RepositoryBase<TContext, TEntity>(TContext dbContext)
    where TContext : DbContext
    where TEntity : Entity<int>
{
    public async Task<TEntity?> FindByIdAsync(int id, CancellationToken ct = default) =>
        await Entities.FindAsync([id], ct);

    public async Task<TEntity?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await Query().SingleOrDefaultAsync(entity => entity.Id == id, ct);

    public Task<bool> ExistsAsync(int id, CancellationToken ct = default) =>
        QueryNotTracked().AnyAsync(entity => entity.Id == id, ct);

    public Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken ct = default) =>
        QueryNotTracked().AnyAsync(predicate, ct);

    public async Task<TEntity> AddAsync(TEntity entity, CancellationToken ct = default) =>
        (await Entities.AddAsync(entity, ct)).Entity;

    public TEntity Update(TEntity entity) => Entities.Update(entity).Entity;

    public void Remove(TEntity entity) => Entities.Remove(entity);

    public virtual async Task<TEntity> UpsertAsync(TEntity entity, CancellationToken ct = default)
    {
        var existing = await FindByIdAsync(entity.Id, ct);
        if (existing is null)
            return await AddAsync(entity, ct);

        DbContext.Entry(existing).CurrentValues.SetValues(DbContext.Entry(entity).CurrentValues);
        return existing;
    }

    public async Task<TEntity> ChangeAsync(int id, Action<TEntity> change, CancellationToken ct = default)
    {
        var entity = (await GetByIdAsync(id, ct)).OrThrowNotFound(id);
        change(entity);
        if (await TrySaveChangesAsync(entity, ct))
            return entity;

        await DbContext.Entry(entity).ReloadAsync(ct);
        if (DbContext.Entry(entity).State == EntityState.Detached)
            throw new NotFoundException($"{typeof(TEntity).Name} {id} was deleted by another request.");
        if (entity is IAggregateRoot aggregate)
            aggregate.ClearDomainEvents();
        change(entity);
        if (await TrySaveChangesAsync(entity, ct))
            return entity;

        throw new ConcurrencyConflictException($"{typeof(TEntity).Name} {id} was changed by another request; try again.");
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => DbContext.SaveChangesAsync(ct);

    protected TContext DbContext { get; } = dbContext;

    protected DbSet<TEntity> Entities => DbContext.Set<TEntity>();

    protected virtual IQueryable<TEntity> Query() => Entities;

    protected virtual IQueryable<TEntity> QueryNotTracked() => Entities.AsNoTracking();

    private async Task<bool> TrySaveChangesAsync(TEntity entity, CancellationToken ct)
    {
        try
        {
            await DbContext.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateConcurrencyException exception) when (exception.Entries.Any(entry => ReferenceEquals(entry.Entity, entity)))
        {
            return false;
        }
    }
}
```

`Query()` and `QueryNotTracked()` are the base's two queryable seams, both protected: a derived repository composes
its named reads on them, and nothing outside the repository receives either (`conventions/ef-core.md` § Queries).
`Query()` is tracked, and a repository overrides it to add its includes, so `GetByIdAsync` loads what a change needs.
`QueryNotTracked()` is the raw set read with no tracking: it carries none of `Query()`'s includes, and a named read
that needs one adds it. A load that will be changed and saved is tracked; every other read is no-tracking.

`FindByIdAsync` is EF's find, which checks the entities already loaded before it asks the database, and applies no
include. No read throws when a row is missing: a required lookup is the nullable read plus `.OrThrowNotFound(id)`
at the call site (`error-handling` § Guard Utilities). `ChangeAsync`, the change that survives two writers
(§ A row two writers race on, below), loads by id itself, so it guards its own load and returns the changed entity.

`UpsertAsync` copies through EF's property values, never `SetValues(object)`: the object overload uses plain
reflection and skips members mapped to private fields. Neither copies an owned or complex member deeply — assign
those by hand.

### Tier 2: The service's repository

One line binds the base to the service's context; it serves every table with no lookups of its own:

```csharp file=Repository.cs
public class Repository<TEntity>(OrdersDbContext dbContext) : RepositoryBase<OrdersDbContext, TEntity>(dbContext)
    where TEntity : Entity<int>;
```

### Tier 3: A repository with its own reads

A table that needs reads beyond the base gets its own repository, with no interface of its own — it may implement a
read port the Domain declares (`domain-service`). It overrides `Query()` to add the includes a change needs, and
holds every other query on that table as a named read — a list, a page, a read for a reply, a join with the tables
it owns. Names: a lookup by key is `GetBy{Key}Async` — the base's own are `FindByIdAsync` and `GetByIdAsync`;
`Find…` is a search by something that is not a key, which may return none or many; existence is `Exists…`; writes
are `AddAsync`, `Update`, `Remove`, `UpsertAsync`, `ChangeAsync`. A read returns domain types or a two-element named
pair, never a reply type of the API project:

```csharp file=OrderRepository.cs
public class OrderRepository(OrdersDbContext dbContext) : Repository<Order>(dbContext)
{
    protected override IQueryable<Order> Query() => base.Query().Include(order => order.Lines);

    public Task<Order?> GetByIdNotTrackedAsync(int id, CancellationToken ct = default) =>
        QueryNotTracked().Include(order => order.Lines).SingleOrDefaultAsync(order => order.Id == id, ct);

    public async Task<(IReadOnlyList<Order> Orders, int Total)> ListAsync(OrderStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = QueryNotTracked().Where(order => status == null || order.Status == status);
        var total = await query.CountAsync(ct);
        var orders = await query.OrderByDescending(order => order.CreatedOn).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return (orders, total);
    }

    public async Task<IReadOnlyList<Order>> FindOpenForCustomerAsync(int customerId, CancellationToken ct = default) =>
        await QueryNotTracked().Where(order => order.CustomerId == customerId && order.Status == OrderStatus.Placed).ToListAsync(ct);
}
```

### A row two writers race on

On a table two writers really race on — and only there, since the concurrency token is off by default
(§ Entity Configuration) — the table takes a version column, which EF Core checks on every save. Both forms are a
shadow property, so the entity does not change. On SQL Server, a rowversion column the database sets on every write,
`builder.Property<byte[]>("Version").IsRowVersion();`. On PostgreSQL, a `uint` row version, which the provider maps
onto the system `xmin` column, so no column is added: `builder.Property<uint>("Version").IsRowVersion();`.

A handler changes such a row through the base's `ChangeAsync`, which loads the entity, lets the domain change it,
and saves:

```csharp
await _orderRepository.ChangeAsync(command.OrderId, order => order.Ship(command.TrackingNumber, command), ct);
```

When another writer saved first, EF Core throws its concurrency error. `ChangeAsync` catches it once — a `catch`
the error rules allow (`error-handling` § Prohibitions) — and only when the error's entries name the entity it
changed, so the row's own save failed. A concurrency error on another row propagates: a retry would apply a saved
change twice. The one retry is safe because a domain-event handler never changes the aggregate that raised its
event (`create-domain-event-handler` § Writing the handler), so a clash naming the entity comes from the row's own
save, never from a handler's save after it. On its own failed save it reloads the entity's values from the database,
clears the domain events the failed attempt queued, and applies the change again on the fresh values. A row the
other writer deleted is detached by the reload and throws not-found. A second clash
throws `ConcurrencyConflictException`, which the central mapper answers with 409. The reload refreshes the row's own
columns only: it does not undo a change to a child collection, so `ChangeAsync` suits a change to the row itself. No
row lock: the version check needs no database-specific SQL.

## Entity Configuration

- **One configuration class per table,** `{Entity}Configuration`, applied by the context; lengths from the
  field-length constants (`create-aggregate` § Field-Length Constants), never a literal.
- **A configuration derives from the table-configuration base the repo's libraries offer,** picked by reading the
  base's members (Look First, above) — a base that maps the audit columns or the key, say. A link table with no
  entity of its own takes EF Core's `IEntityTypeConfiguration<T>`. The sample below is the form for a repo with no
  such library.
- **Enums take two forms.** Stored as text by default (`HasConversion<string>()`). A table of its own where each
  value carries data — a limit, a display order, the next allowed state — or where the database must refuse an
  unknown value through a foreign key to that table; its rows are master data, cached as a small table
  (§ Caching Small Tables). No enum is stored as a number.
- **Value objects** map as complex types (`ComplexProperty`, flat columns) or owned types (`OwnsOne`, a separate or
  JSON column).
- **The concurrency token is off by default.** Turn it on for a table only with a stated reason (two writers really
  race on it — § A row two writers race on, above); a sample that turns it on for every table teaches a cost with no
  need.
- **Ids and times:** which id type and which time type an entity uses is not settled; a table keeps the types its
  entity has. One `Guid` in a route reads fine, several ids in one route do not, and a catalog needs no `Guid`.
- **Schemas:** a unit whose tables sit in a database it shares owns its schema there (`HasDefaultSchema`) and keeps
  its migration history table in it — a business module by default, a service by choice; a service in a database of
  its own needs no schema (§ Data Ownership, above).
- **Table and column names, a choice:** the entity type's name (the default), or lower-case with underscores — the
  form a database or other SQL readers expect, since mixed-case names must be quoted in every SQL text. Pick one per
  repo and apply it in the context, not per table. A table another library owns keeps that library's names.

The form for a repo with no configuration base:

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
        services.AddMemoryCache();
        services.AddScoped<CachedRepository<OrdersDbContext, OrderStateTransition>>();
        services.AddHostedService<SmallTableWarmUp<OrdersDbContext, OrderStateTransition>>();

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

A table that is truly small and stable — a transition table, a list of kinds — is cached once, whole, and read from
the cache. Only for such a table: a cache is one more thing that can be stale. Its rows change only with a
migration, so a restart refreshes them.

The table is read through a cached repository: its one read takes the whole table, with no tracking, on its first
call, and keeps it in the memory cache keyed by the entity type. The read is synchronous, so a state machine's
factory reads it as easily as a handler does. The entity needs no id, so the class stands beside the repository
base rather than deriving it:

```csharp file=CachedRepository.cs
public class CachedRepository<TContext, TEntity>(TContext _dbContext, IMemoryCache _cache)
    where TContext : DbContext
    where TEntity : class
{
    public IReadOnlyList<TEntity> GetAll() =>
        _cache.GetOrCreate<IReadOnlyList<TEntity>>(typeof(TEntity), _ => _dbContext.Set<TEntity>().AsNoTracking().ToList()) ?? [];
}
```

The persistence registration (§ DbContext Setup, above) adds the memory cache, then the cached repository, scoped,
one line per cached table. A plain host registers no memory cache, and without that line the service cannot start.

Where synchronous code reads the table during a request — a state machine does — a start-up warm-up fills the cache
before the service takes requests, so no request waits on the first read. It is a hosted service that calls the
read once in a scope; a table read only by handlers needs none and fills on its first read:

```csharp file=SmallTableWarmUp.cs
public class SmallTableWarmUp<TContext, TEntity>(IServiceScopeFactory _scopeFactory, ILogger<SmallTableWarmUp<TContext, TEntity>> _logger)
    : IHostedService
    where TContext : DbContext
    where TEntity : class
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var rows = scope.ServiceProvider.GetRequiredService<CachedRepository<TContext, TEntity>>().GetAll();
        _logger.LogInformation("Cached {Count} {Table} rows", rows.Count, typeof(TEntity).Name);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

## Interceptors

One line in the persistence registration attaches the save interceptor (above). `create-domain-event-handler` covers
the choice between the two flavours and the publish-after-write path of stores with no interceptor.
