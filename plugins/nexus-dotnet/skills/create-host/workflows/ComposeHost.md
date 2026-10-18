# Compose a Host

A host for services that are already class libraries. A service that still hosts itself is converted first
(`ConvertService.md`). The rules each step applies are the skill's own sections (`../SKILL.md`).

## 1. The project file

`src/Hosts/{Host}/{Host}.csproj` — the one web-SDK project of the deployable. It carries the packages of what only the
host registers and a reference to the API project of each service or module it runs:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UserSecretsId>{new GUID}</UserSecretsId>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="FastEndpoints" />
    <PackageReference Include="FastEndpoints.Swagger" />
    <PackageReference Include="Scalar.AspNetCore" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
    <PackageReference Include="MassTransit.RabbitMQ" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" PrivateAssets="all" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\Services\Orders\Orders.API\Orders.API.csproj" />
    <ProjectReference Include="..\..\Services\Billing\Billing.API\Billing.API.csproj" />
    <ProjectReference Include="..\..\Modules\Audit\Audit.API\Audit.API.csproj" />
  </ItemGroup>

</Project>
```

The packages follow what the host registers: the endpoint framework of its services and its OpenAPI integration, the
transport of its bus. Add the project to the solution, and its `GlobalUsings.cs`
(`../SKILL.md` § The Host's Program.cs).

## 2. The services' entry points

Each service offers the entry points its work needs (`../SKILL.md` § What a Service Offers Its Host). Its composing
class binds its settings first; its API registration leaves out what the host registers once.

## 3. The host's registration

`{Host}Registration.Add{Host}Services` in the host project: the host's own settings first, then the endpoint
framework with its explicit assembly list — every project holding endpoints, validators or event handlers, each gated
with its owner — the OpenAPI document, sign-in, CORS, health checks and the bus calling
each service's `Add{Service}Consumers` (`../SKILL.md` § Registered Once, by the Host).

## 4. Program.cs

The three regions and their order (`../SKILL.md` § The Host's Program.cs). Where a service can be switched off,
one flag gates all its calls (`../SKILL.md` § Switching a Service by a Setting). The file ends with
`public partial class Program;`.

## 5. Settings and the files the host owns

- `appsettings.json` carries every section of every service it runs, each settings class name unique within the host;
  secrets go to user secrets locally and to the environment when deployed.
- `Properties/launchSettings.json` — the profiles the services had, now the host's.
- The Kestrel endpoints, with a separate HTTP/2-only endpoint where gRPC runs without TLS (`../SKILL.md` § gRPC in a
  Host).
- Static files and runtime assets the services need, copied to the host's output; a front end's built files under
  the web root (`../SKILL.md` § The Host's Program.cs).

## 6. Glue between services

An adapter implementing one service's port with another service's contract goes in `Composition/` and is registered
in the host's registration (`../SKILL.md` § Glue Between Services).

## 7. Infrastructure

The Dockerfile builds and runs the host; the compose entry names the host's image. The EF tooling's start-up project
is the host: `dotnet ef migrations add {Name} -p src/Services/{Service}/{Service}.Persistence -s src/Hosts/{Host}`.

## 8. Verify

`../SKILL.md` § Verify.
