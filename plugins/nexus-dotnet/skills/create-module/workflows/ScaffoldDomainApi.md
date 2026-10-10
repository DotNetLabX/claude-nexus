# Scaffold Domain Module API Project

**Only where the CLAUDE.md says `API layer: yes`.** A module's API project is a **class library**, not a web host: the
host provides the web host, and the module contributes its endpoints.

## Framework compatibility

A module with an API binds its framework to every host that mounts it. **Minimal APIs with an explicit
`Map{Name}Endpoints()` is the only framework-neutral option**; FastEndpoints and Carter work only in hosts on the same
framework, which then name the module's assembly.

## Folder tree

```text
src/Modules/{Name}/
└── {Name}.API/
    ├── Features/
    ├── EndpointExtensions.cs
    └── {Name}.API.csproj
```

No `Program.cs`, no settings file, no launch settings — this is a library.

## `{Name}.API.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Application\{Name}.Application.csproj" />
  </ItemGroup>

</Project>
```

The framework reference gives a class library the ASP.NET Core types without making it a web project. Reference the
Persistence project instead where there is no Application project. FastEndpoints adds the `FastEndpoints` package;
Carter adds `Carter`.

## `{Name}.API/EndpointExtensions.cs` — by framework

`Map…` lives in an `Extensions` class and extends the narrowest type (`service-registration` § Naming Conventions).

### Minimal APIs (framework-neutral)

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

public static class EndpointExtensions
{
    public static IEndpointRouteBuilder Map{Name}Endpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("{name}").WithTags("{Name}");

        return app;
    }
}
```

Each feature in `Features/` has a static `Map` method; `Map{Name}Endpoints` calls each one, a line per endpoint.

### FastEndpoints or Carter

No `Map{Name}Endpoints`: the framework finds the module's endpoints in the assemblies the host names
(`service-registration` § Composing services into one host). Leave no stub file — the host's composition is where the
assembly is named.

## After this step

Next: `ScaffoldInfrastructure.md`.
