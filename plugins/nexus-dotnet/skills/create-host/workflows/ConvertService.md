# Convert a Service

A self-hosted `{Name}.API` turned into a class library a host runs. Work in this order; the solution builds again
only once every step is done.

## 1. The project file

`Microsoft.NET.Sdk.Web` becomes `Microsoft.NET.Sdk`, and the ASP.NET Core framework comes back as a framework
reference:

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

## 2. The implicit usings — the silent trap

The web SDK adds nine implicit usings the plain SDK does not. After the switch every file that relied on them stops
compiling, and the errors name a missing type, never the missing using. Restore exactly these in the project's
`GlobalUsings.cs`:

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

The entry points' own usings join the same file under their usual headers — `MassTransit` where the service offers
`Add{Name}Consumers`, and the namespace of the migration and seed helpers its `Init{Name}DataAsync` calls.

## 3. Program.cs becomes the entry points

The body of `Program.cs` moves into the entry points the service offers (`../SKILL.md` § What a Service Offers Its
Host): its Add region into the composing class, its InitData region into `Init{Name}DataAsync`, the middleware that
serves only its own routes into `Use{Name}`, its non-framework routes into `Map{Name}Endpoints`. The request-wide
middleware — error mapping, request context, request diagnostics — goes to no entry point: the host runs it once.
Then `Program.cs` is deleted.

## 4. What moves to the host

- `Microsoft.EntityFrameworkCore.Design`, the OpenAPI package and the API reference package.
- `UserSecretsId`, `appsettings*.json`, `Properties/launchSettings.json`.
- Static files and runtime assets.
- **The code that used a moved package moves with it** — a sign-in set-up helper, an API reference set-up — to the
  host, or to the shared place where another service still calls it. A `global using` naming a moved package's
  namespace (`global using Scalar.AspNetCore;`) leaves the service's `GlobalUsings.cs`, or the project stops
  compiling. A package the service's own code still uses stays in its project file.

## 5. What the service stops registering

The registrations the host now makes once leave the service's API registration: the endpoint framework, the OpenAPI
document, `AddJwtAuthentication` and the `JwtOptions` binding, the bus and its transport — the consumers move into
`Add{Name}Consumers` — and CORS (`../SKILL.md` § Registered Once, by the Host). The request-wide middleware leaves
with them. The service keeps its own authorization policies and handlers.

## 6. Paths, tests and the image

- **Relative paths** — a data file, a SQLite database, a seed folder — are re-derived from the host's folder, or from
  the output folder, never from the old API project's.
- **Test projects** reference the host and use its `Program` in `WebApplicationFactory<Program>`.
- **The Dockerfile** builds and runs the host, not the service.

## 7. Verify

`../SKILL.md` § Verify, after adding the service to its host (`ComposeHost.md`).
