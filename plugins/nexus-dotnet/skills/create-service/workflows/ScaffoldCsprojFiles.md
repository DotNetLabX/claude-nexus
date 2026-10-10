# Scaffold csproj Files

One project file per layer, with only the references the service's axes need. Project files set the basics only:
no versions (the central package file holds them), no documentation-file generation, no warning suppressions, no
comments. Reference direction:

- Domain references nothing of the service; Persistence references Domain; Application (where present) references
  Persistence; API references Application, or Persistence where there is no Application project.
- A shared or contracts project is referenced by the layer whose code uses it, and only once that code exists.
- Never another service's projects; never an API project.

## Domain

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

</Project>
```

Domain projects reference shared projects **by fit**, never as a blanket: the project that holds the aggregate base
where the repo keeps it in one, and a shared contracts or abstractions project only when an aggregate actually uses
one of its types (a shared enum, the action interface). A domain that needs neither references nothing.

```xml
  <ItemGroup>
    <ProjectReference Include="..\..\..\Shared\{Shared}.Domain\{Shared}.Domain.csproj" />
  </ItemGroup>
```

## Persistence

EF Core — the provider package lives here, in the project that calls `UseSqlServer` or `UseNpgsql`:

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

  <ItemGroup>
    <None Update="Data\**\*.json" CopyToOutputDirectory="PreserveNewest" />
  </ItemGroup>

</Project>
```

For PostgreSQL the package is `Npgsql.EntityFrameworkCore.PostgreSQL`. For Redis it is `Redis.OM` and
`StackExchange.Redis`, and there is no EF package.

## Application

Where the Application axis is Y; the mediator and validation packages only in the mediator style:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MediatR" />
    <PackageReference Include="FluentValidation.DependencyInjectionExtensions" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Persistence\{Name}.Persistence.csproj" />
  </ItemGroup>

</Project>
```

Add, by axis and only then: `MassTransit.RabbitMQ` and the event contracts project for integration events; the gRPC
contracts project for gRPC clients; a module's contracts project for each module the service runs on.

## API

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
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" />
    <PackageReference Include="Scalar.AspNetCore" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" PrivateAssets="all" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\{Name}.Persistence\{Name}.Persistence.csproj" />
  </ItemGroup>

</Project>
```

The framework package follows the endpoint axis — `FastEndpoints`, or `Carter`, or none for minimal APIs — and the
reference is the Application project instead of Persistence where one exists. With Docker, add
`<DockerDefaultTargetOS>Linux</DockerDefaultTargetOS>` to the property group.

## One reference path per concern

When the Application project exists, API references only it; Application brings Persistence. Never both.

## After this step

The project files exist; the solution compiles once the source stubs of the next workflows are in.
