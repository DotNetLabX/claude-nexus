# Scaffold Persistence Project

The Persistence project's source files, by the database axis. The samples and rules behind them are
`persistence-patterns`; this workflow places the first files.

## Branch: EF Core (SQL Server or PostgreSQL)

### `{Name}.Persistence/GlobalUsings.cs`

Grouped under comment headers (`service-infra-conventions` § 8. Per-project GlobalUsings):

```csharp
// Third-party libraries
global using Microsoft.EntityFrameworkCore;
global using Microsoft.EntityFrameworkCore.Diagnostics;
global using Microsoft.EntityFrameworkCore.Metadata.Builders;
global using Microsoft.Extensions.Caching.Memory;
global using Microsoft.Extensions.Configuration;
global using Microsoft.Extensions.DependencyInjection;

// Shared libraries — the namespaces of the repository base, the save interceptor and the settings binder

// Domain
global using {Name}.Domain;
```

### `{Name}.Persistence/{Name}DbContext.cs`

Named for the service — never `AppDbContext`:

```csharp
public class {Name}DbContext(DbContextOptions<{Name}DbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof({Name}DbContext).Assembly);
}
```

### `{Name}.Persistence/DependencyInjection.cs`

`AddPersistenceServices(services, configuration)` reads the connection string itself and attaches the save
interceptor, so a scaffolded service sends its domain events from the first save (`persistence-patterns`
§ DbContext Setup has the full sample):

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetRequiredConnectionString("{Name}");

        services.AddScoped<ISaveChangesInterceptor, DispatchDomainEventsInterceptor>();
        services.AddDbContext<{Name}DbContext>((provider, options) => options
            .UseSqlServer(connectionString)
            .AddInterceptors(provider.GetServices<ISaveChangesInterceptor>()));
        services.AddScoped(typeof(Repository<>));

        return services;
    }
}
```

For PostgreSQL, `UseNpgsql`. Each repository the service adds later gets its own scoped line here. The repository
base, the service's `Repository<T>` and the save interceptor are found first, or built once (`persistence-patterns`).

### `Data: schema` — its own schema in a shared database

The service's tables and its migration history table live in its schema (`persistence-patterns` § Data Ownership).
The context sets the default schema:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.HasDefaultSchema("{Schema}");
    modelBuilder.ApplyConfigurationsFromAssembly(typeof({Name}DbContext).Assembly);
}
```

and the registration puts the migration history table in it:

```csharp
services.AddDbContext<{Name}DbContext>((provider, options) => options
    .UseSqlServer(connectionString, sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "{Schema}"))
    .AddInterceptors(provider.GetServices<ISaveChangesInterceptor>()));
```

For PostgreSQL, `UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "{Schema}"))`.

## Branch: Redis

### `{Name}.Persistence/GlobalUsings.cs`

```csharp
// Third-party libraries
global using Redis.OM;
global using Redis.OM.Modeling;
global using Microsoft.Extensions.Configuration;
global using Microsoft.Extensions.DependencyInjection;

// Shared libraries — the namespaces of the document base and the settings binder

// Domain
global using {Name}.Domain;
```

### `{Name}.Persistence/DependencyInjection.cs`

The connection, the open-generic document repository and the read store — `redis-patterns` § DI Registration.
No table configurations and no migrations.

## Start-up

The API's start-up file migrates in its InitData region (`app.Migrate<{Name}DbContext>()`) and seeds test data in
development only (`app.SeedTestData()`) — `service-registration` § Program.cs Structure (self-hosted service); both
helpers are sampled in `persistence-patterns` § Migrations at Start-up and § Seed Data (Dual Pattern). A service a
host runs has no start-up file: both calls go in its data entry point, `Init{Name}DataAsync` in `{Name}Extensions`
(`ScaffoldHostedApi.md`), which the host calls — the entry point a converted service's InitData region moves into
(`../../create-host/workflows/ConvertService.md` § 3. Program.cs becomes the entry points).

## After this step

Next: `ScaffoldApplicationProject.md` (mediator style) or `ScaffoldInfrastructure.md`.
