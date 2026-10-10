# Scaffold Component Module

A Component module: a contracts project and its implementations. Two modes, by whether the contracts project exists.

## Mode detection

```text
if src/Modules/{Name}/{Name}.Contracts/ exists  → second run: add an implementation only
else                                            → first run: the contracts project and the first implementation
```

## Mode: first-run

### `{Name}.Contracts/{Name}.Contracts.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

</Project>
```

The contracts project holds interfaces, records and settings only. Where the contract's types come from a shared
project, add that one reference, found while writing the interface — nothing "just in case".

### `{Name}.Contracts/I{ContractName}.cs`

The interface, with the members the first feature that needs the module asks for — the architect's plan names them.
Written with members, never left as an empty placeholder:

```csharp
public interface I{ContractName}
{
    Task<{Result}> {Operation}Async({Request} request, CancellationToken ct = default);
}
```

## Mode: second-run

Leave `{Name}.Contracts/` alone; scaffold the new implementation only, and add it to the CLAUDE.md's
`**Implementations:**` line with a `## {NewImpl} implementation` section.

## Implementation project (both modes)

### `{Name}.{ImplName}/{Name}.{ImplName}.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Options" />
    <PackageReference Include="Microsoft.Extensions.Configuration.Abstractions" />
    <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Contracts\{Name}.Contracts.csproj" />
  </ItemGroup>

</Project>
```

The three packages supply `IOptions<T>`, `IConfiguration` and `IServiceCollection`. Add the shared project that
holds the settings binder (Look First), and the outside system's client package (a storage SDK, a mail client) — each
with no version; the central package file holds it.

### `{Name}.{ImplName}/{ImplName}{Name}Options.cs`

A settings class: data only, named for its subject, its section named after the class
(`service-infra-conventions` § 3. Options binding — fail fast at startup):

```csharp
using System.ComponentModel.DataAnnotations;

public class {ImplName}{Name}Options
{
    [Required]
    public required string ConnectionStringName { get; init; }
}
```

### `{Name}.{ImplName}/{ImplName}{ContractName}.cs`

```csharp
using Microsoft.Extensions.Options;

public class {ImplName}{ContractName}(IOptions<{ImplName}{Name}Options> options) : I{ContractName}
{
    private readonly {ImplName}{Name}Options _options = options.Value;

    public async Task<{Result}> {Operation}Async({Request} request, CancellationToken ct)
    {
        {the call to the outside system, through its client}
    }
}
```

Each member of the contract is implemented in the same change; the body is the plan step's.

### `{Name}.{ImplName}/{ImplName}{Name}Registration.cs`

A registration class named for its subject, holding only `Add…` methods; the provider is a visible line
(`service-registration` § Naming Conventions):

```csharp
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using {SharedNamespace};

public static class {ImplName}{Name}Registration
{
    public static IServiceCollection Add{ImplName}{Name}(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAndValidateOptions<{ImplName}{Name}Options>(configuration);
        services.AddSingleton<I{ContractName}, {ImplName}{ContractName}>();

        return services;
    }
}
```

## After this step

Next: `ScaffoldInfrastructure.md`.
