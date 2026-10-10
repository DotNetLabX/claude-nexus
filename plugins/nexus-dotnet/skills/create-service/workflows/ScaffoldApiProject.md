# Scaffold API Project

The API project's source files, by the endpoint axis. The API project holds its features, its usings and its
registration — nothing else.

## Common files

### `{Name}.API/GlobalUsings.cs`

Grouped under comment headers (`service-infra-conventions` § 8. Per-project GlobalUsings); start with what the
start-up and registration files use and grow it as features arrive.

### `{Name}.API/appsettings.json`

A section per settings class, named after the class, plus `ConnectionStrings`:

- `ConnectionStrings:{Name}` — the database, by the database axis
- `JwtOptions` — `Issuer`, `Secret`
- `RabbitMqOptions` — only with integration events
- a file-storage options section — only with file storage
- `Logging`, `AllowedHosts`

A secret is never committed: the local value lives in user secrets, the deployed one in the environment.

### `{Name}.API/Properties/launchSettings.json`

An `https` profile on the port axis, and a `Container (Dockerfile)` profile when Docker is on.

### `{Name}.API/DependencyInjection.cs` and the settings

`ConfigureApiOptions` and `AddApiServices` — `service-registration` § Options Validation and § What Goes Where. The
endpoint framework, authentication and authorization (`authorization-patterns`), the request context
(`service-infra-conventions`), the host's JSON settings, gRPC clients, the bus where there is no Application
project.

### `{Name}.API/Program.cs`

The three regions, the middleware order, the API reference pages in development only —
`service-registration` § Program.cs Structure (self-hosted service). The error middleware and the request-context
middleware are found first, or built once in the shared place (`error-handling`, `service-infra-conventions`).

## Framework branches

- **FastEndpoints** — `AddFastEndpoints()` in the registration; `app.UseFastEndpoints(config => …)` last in the Use
  region, setting the route prefix and the serializer's JSON settings (`service-infra-conventions` § 6. HTTP JSON casing — keep the framework default); the identity stamp as a
  global pre-processor.
- **Carter with a mediator** — `AddCarter()` in the registration and `app.MapCarter()` under the `api` route group.
- **Minimal APIs with a mediator** — `app.MapAllEndpoints()`, the endpoint extensions of one explicit line per endpoint
  (`../../create-feature/workflows/EndpointMinimalApi.md`).
- **A read-model service** — no mediator; the bus registered with its consumers.

## After this step

`Features/` stays empty until `create-feature`. Next: `ScaffoldDomainProject.md`.
