# Scaffold a Hosted API Project

**Only where the CLAUDE.md says** `**Runs:** host`. The API project of a service a host runs is a class library, not
a web project: the host provides the process, and the service offers it entry points. This workflow replaces the API
block of `ScaffoldCsprojFiles.md` and the whole of `ScaffoldApiProject.md`, and builds directly the end state
`../../create-host/workflows/ConvertService.md` leaves a converted service with — one shape for a service a host runs,
however it got there.

## Folder tree

```text
src/Services/{Name}/
└── {Name}.API/
    ├── Features/
    ├── GlobalUsings.cs
    ├── DependencyInjection.cs
    ├── {Name}Registration.cs
    ├── {Name}Extensions.cs     only where the service has an entry point of that class
    └── {Name}.API.csproj
```

No `Program.cs`, no `appsettings*.json`, no `Properties/launchSettings.json`, no user-secrets id, no Dockerfile and no
compose entry — the host owns them (`../../create-host/SKILL.md` § What the Host Owns on Disk).

## 1. The project file

The plain SDK, with the ASP.NET Core framework as a framework reference:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="FastEndpoints" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Application\{Name}.Application.csproj" />
  </ItemGroup>

</Project>
```

The framework package follows the endpoint axis — `FastEndpoints`, or `Carter`, or none for minimal APIs — and the
reference is the Persistence project where there is no Application project. The packages of what only the host
registers stay out: the EF design package, the OpenAPI package and the API reference package
(`../../create-host/workflows/ConvertService.md` § 4. What moves to the host), and the sign-in package, since the
host registers sign-in once (`../../create-host/workflows/ConvertService.md` § 5. What the service stops registering).

## 2. GlobalUsings.cs

The plain SDK lacks the nine implicit usings of the web SDK, and a missing one fails with a missing type, never a
missing using. The file starts with exactly these:

```csharp file=GlobalUsings.cs
// Implicit usings of the web SDK
global using Microsoft.AspNetCore.Builder;
global using Microsoft.AspNetCore.Hosting;
global using Microsoft.AspNetCore.Http;
global using Microsoft.AspNetCore.Routing;
global using Microsoft.Extensions.Configuration;
global using Microsoft.Extensions.DependencyInjection;
global using Microsoft.Extensions.Hosting;
global using Microsoft.Extensions.Logging;
global using System.Net.Http.Json;
```

The entry points' own usings join it under their usual headers
(`service-infra-conventions` § 8. Per-project GlobalUsings) — `MassTransit` where the service offers
`Add{Name}Consumers`, and the namespace of the migration and seed helpers its `Init{Name}DataAsync` calls. The file
grows as features arrive.

## 3. The registration and the entry points

- **`DependencyInjection.cs`** — `ConfigureApiOptions` and `AddApiServices`
  (`service-registration` § What Goes Where), without what the host registers once: the endpoint framework, the
  OpenAPI document, sign-in and the `JwtOptions` binding, the bus and its transport, and CORS
  (`../../create-host/SKILL.md` § Registered Once, by the Host). The service keeps its own authorization policies and
  handlers.
- **`{Name}Registration.cs`** — the composing class: `Add{Name}Services`, which binds the service's settings first
  and calls its layers in order (`service-registration` § Composing services into one host), and
  `Add{Name}Consumers` where the service consumes bus messages.
- **`{Name}Extensions.cs`** — `Init{Name}DataAsync` where the service sets up its tables or seeds data at start-up,
  which an EF service always does (`ScaffoldPersistenceProject.md` § Start-up); `Use{Name}` only for middleware of
  its own routes; `Map{Name}Endpoints` only for routes the endpoint framework does not find.

Each entry point and when it is present: `../../create-host/SKILL.md` § What a Service Offers Its Host. The
request-wide middleware — error mapping, the request context, request diagnostics — goes to no entry point: the host
runs it once.

## Framework branches

- **FastEndpoints or Carter** — no `AddFastEndpoints` or `AddCarter` in the service, and no mapping call: the host
  registers the framework and names this project's assembly in its list.
- **Minimal APIs with a mediator** — the endpoint extensions of one explicit line per endpoint
  (`../../create-feature/workflows/EndpointMinimalApi.md`), called from `Map{Name}Endpoints`.
- **A read-model service** — no mediator; its consumers are registered in `Add{Name}Consumers`, and the bus is the
  host's.

## Settings

The service's settings sections and its `ConnectionStrings:{Name}` go in the settings of each host that runs it,
each host pointing at its own database — or at the shared one the `**Database:**` line names, on `Data: schema`.
`create-host` adds them when it adds the service.

## After this step

`Features/` stays empty until `create-feature`. Next: `ScaffoldDomainProject.md`.
