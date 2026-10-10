# Scaffold Domain Module Application Project

**Only where the CLAUDE.md says `Application layer: yes`.** It holds the module's handlers and their validators (in
the mediator style), its domain-event handlers, and its per-call factories (a state machine). It references the
module's Persistence project directly — no repository interfaces in Domain.

## Folder tree

```text
src/Modules/{Name}/
└── {Name}.Application/
    ├── Features/
    ├── DependencyInjection.cs
    └── {Name}.Application.csproj
```

## `{Name}.Application.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Persistence\{Name}.Persistence.csproj" />
  </ItemGroup>

</Project>
```

The mediator and FluentValidation packages only where the module's API uses the mediator style.

## `{Name}.Application/DependencyInjection.cs`

Registers only the module's own classes:

```csharp
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection Add{Name}Application(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(config => config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
```

The pipeline behaviours are the host's — registered once in its composition, never per module. A module with no
mediator registers its factories and handlers line by line here instead.

## What lives here

- `Features/{Area}/{Operation}/` — commands, queries, validators, handlers (mediator style)
- Domain-event handlers, named for their effect
- Per-call factories and the module's access checker

No mapping profiles: mapping is by hand.

## After this step

- API axis yes → `ScaffoldDomainApi.md`
- Otherwise → `ScaffoldInfrastructure.md`
