# Scaffold Domain Module — Core Projects

The Domain and Persistence projects of a Domain module. Always runs for a Domain module; the Application project and
the API library follow where their axes say yes. The samples and rules behind the files are `create-aggregate` and
`persistence-patterns`.

## Folder tree

```text
src/Modules/{Name}/
├── {Name}.Domain/
│   └── {Name}.Domain.csproj
└── {Name}.Persistence/
    ├── Configurations/          EF branch
    ├── Repositories/
    ├── Migrations/              EF branch
    ├── Data/
    ├── {Name}DbContext.cs       EF branch
    ├── DependencyInjection.cs
    └── {Name}.Persistence.csproj
```

Folders are created with their first file; no placeholder files. A module has no `GlobalUsings.cs`: each file
carries its own `using` lines (`conventions/csharp.md` § Namespaces and Usings).

## `{Name}.Domain.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

</Project>
```

Add, by fit only, the shared project holding the aggregate base where the repo keeps one, and the module's own
contracts project where the domain uses its types.

## `{Name}.Persistence.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Domain\{Name}.Domain.csproj" />
  </ItemGroup>

</Project>
```

Add the shared project that holds the settings binder and the repository base (Look First). PostgreSQL: `Npgsql.EntityFrameworkCore.PostgreSQL`. Redis: `Redis.OM` and `StackExchange.Redis`, and no EF.

## `{Name}.Persistence/{Name}DbContext.cs` (EF branch)

A module that owns tables owns its schema and its migration history:

```csharp
using Microsoft.EntityFrameworkCore;

public class {Name}DbContext(DbContextOptions<{Name}DbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("{schema}");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof({Name}DbContext).Assembly);
    }
}
```

## `{Name}.Persistence/DependencyInjection.cs`

Registers only the module's own services. The method carries the module's name, so two modules' registrations never
collide in one host. It reads its connection string itself; where the module shares the host's database, the
connection string names that database and the schema keeps the tables apart:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using {SharedNamespace};

public static class DependencyInjection
{
    public static IServiceCollection Add{Name}Persistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetRequiredConnectionString("{Name}");

        services.AddDbContext<{Name}DbContext>(options => options.UseSqlServer(
            connectionString,
            sql => sql.MigrationsHistoryTable("__EFMigrationsHistory", "{schema}")));

        return services;
    }
}
```

Each repository the module adds later gets its own scoped line here (`persistence-patterns`). Where the module's
aggregates raise domain events, the save interceptor is attached the same way as in a service.

### Redis branch

The connection, the open-generic document repository — `redis-patterns` § DI Registration, under
`Add{Name}Persistence`. A Redis module always has its own connection string.

## After this step

- Application axis yes → `ScaffoldDomainApplication.md`
- API axis yes → `ScaffoldDomainApi.md`
- Otherwise → `ScaffoldInfrastructure.md`
