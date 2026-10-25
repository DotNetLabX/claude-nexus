---
name: flow-atlas-dotnet
description: "The .NET server profile for a flow atlas - its entry kinds (FastEndpoints, controller and minimal-API endpoints, MCP tools, hosted services, bus consumers, event and mediator handlers, executables), its tier words, the closed reg vocabulary for binding rows with its modifiers, the S1 tool that lists entries, registrations and each host's composition tree, and the reading hints S2 needs for factories, decorators and selections. Use when building or refreshing a flow atlas over a .NET solution, mapping which classes run behind an endpoint, a tool or a hosted job, or reading which class a registration binds to an interface."
---

# Flow atlas — .NET server profile

Needs the `nexus-pro` plugin — if `build-flow-atlas` is not in your skill list, stop and tell the user `/plugin install nexus-pro@claude-nexus-pro`.
It also needs the repo's switch on — `features.flowAtlas` set to `true` in `.claude/nexus-agents.json`; `build-flow-atlas` checks it first and builds nothing while it is off.

## Assumes

- **The `build-flow-atlas` skill** (`nexus-pro`): the page kinds, the row grammar, the stages and the atlas tool.
  This profile supplies only the .NET parts.
- **A .NET solution read as text** — the tool never builds it, restores it or loads an assembly, so it works on a
  tree that does not compile on this machine.
- **The registration forms of the standard service collection**, Scrutor's `Decorate` and `Scan`, MediatR,
  MassTransit, FastEndpoints, controllers, minimal APIs and the MCP server's `WithTools<T>()`. A repo on another
  container or framework adapts by reading its registrations by hand into the same vocabulary; the tool lists
  what it recognises and never guesses the rest.

## Entry kinds

| Kind | Found by | Id |
|---|---|---|
| `fastendpoints` | a class-level verb attribute (`[HttpPost("…")]`, alone or in a list such as `[HttpGet("…"), AllowAnonymous]`), or a verb call in `Configure()` | `{VERB} {route}` |
| `controller` | `[Http{Verb}]` on a method of a class deriving from `ControllerBase` or `Controller`, directly or through a base class in the tree; its route, or a method-level `[Route]`, joined to the class `[Route]` (inherited from the base where the class has none, `[controller]` replaced); a `~/` or `/` method route replaces it; a route constant resolves in its own class first, and one it cannot resolve leaves the entry `unresolved`, never a shortened route | `{VERB} {route}` |
| `minimal-api` | `Map{Verb}(…)`, the route a literal or a constant (`Routes.Search`, or a name only one class holds), behind every `MapGroup("…")` along its receiver chain; a constant several classes hold is `unresolved`, a group variable is read only from assignments in scope, and a receiver that is a route group built elsewhere leaves `absolute` empty with a `group` note | `{VERB} {route}` |
| `mcp-tool` | the explicit `WithTools<T>()` list; a `[McpServerToolType]` class missing from it is reported not exposed | class |
| `hosted` | `AddHostedService<T>()`, `AddHostedService(factory)` — the class the factory builds (`CreateInstance<T>`, `new T(…)`), else an entry with no id marked `unresolved` — and `TryAddEnumerable(ServiceDescriptor.*<IHostedService, T>())` | class |
| `consumer` | a class implementing `IConsumer<T>` | class |
| `event-handler` | `INotificationHandler<T>` or `IEventHandler<T>` | class |
| `mediator-handler` | `IRequestHandler<T, …>`, where the repo uses a mediator | class |
| `executable` | a non-web project's `Exe` entry point (`Program.cs`) | project |

A root route's id is `{VERB} /`. The global route prefix is the endpoint framework's own — a `RoutePrefix = "…"` in
`UseFastEndpoints(…)` or on its `Endpoints` options; any other `RoutePrefix` (a Swagger UI's) is not it. It is
reported once, and where the tree declares two different ones `routePrefix` stays empty and `routePrefixConflict`
lists them. An entry the prefix does not reach — a FastEndpoints endpoint calling `RoutePrefixOverride`, a
controller, a minimal-API route — is `absolute`. A route written with the prefix already at its start
(`[HttpPost("/api/orders")]` under the prefix `api`) is reported as written; the prefix is not added to it again. The
client profile's join uses both.

## Tiers

`entry` → `handler` (the endpoint body, the tool method, the job's pass) → `application` → `module seam` (where the
call crosses into a composition extension or another project the module list names) → `persistence` or `external`
(a data context, a raw data source, a typed client, a model client).

## Binding rows — the closed vocabulary

A binding row's `wired-how` is one primary token, then modifiers in this order: `+factory`, `+keyed {key}`,
`+conditional {condition}`, `+order {n}`; cross-references after `; `.

| Token | The registration |
|---|---|
| `reg:direct` | one line, contract to class (`AddScoped<IFoo, Foo>()`, `AddScoped<Foo>()`, `AddSingleton<IFoo>(new Foo())`, `AddScoped(typeof(IFoo), typeof(Foo))`, `AddDbContext<T>()`); an open generic (`typeof(IRepo<>)`) is marked unproven |
| `reg:forwarded` | a lambda that only resolves another registration (`sp => sp.GetRequiredService<Foo>()`) |
| `reg:keyed {key}` | a keyed registration (`AddKeyedScoped<IFoo, Foo>("key")`) |
| `reg:factory {selector}` | a lambda that builds per call; one sub-row per arm where few (`r5a`, `r5b`) |
| `reg:enumerable` | one of several plain registrations of a contract that can run together, resolved as `IEnumerable<T>`; two in opposite arms of one `if` are a switch, not a collection |
| `reg:decorator {order}` | `Decorate<IFoo, Bar>()`; the order is the registration order, counted per contract |
| `reg:conditional {condition}` | a plain registration inside an `if` or `else` arm — an `else` arm reads `!({condition})`, nested arms join with `&&`, an arm holding `||` or `?:` in parentheses; any other shape there gains `+conditional` |
| `reg:scan {pinned list}` | an assembly scan, pinned by `typeof(…)` or a generic argument (`…FromAssemblyContaining<T>()`); `reg:scan unpinned` where nothing pins it — the row is then unproven |
| `reg:hosted` | a hosted service, in either registration form |
| `direct-new` | a registered implementation built with `new` outside registration code — a container bypass |

Every binding row's search counts **every** registration form of its contract — the generic call, the keyed call,
the descriptor form — so a second registration added later fails the count. One shape covers them all, `{C}` the
contract (a `|` written `\|` inside the cell):

```
/\b(?:Try)?Add(?:Keyed)?(?:Scoped|Singleton|Transient)(?:<{C}\b|\(\s*typeof\({C}\))|ServiceDescriptor(?:\.\w+)?(?:<{C}\b|\(\s*typeof\({C}\))/
```

The row's `file` cites the registration that binds its class. Its `composed-by` points at the host page's row for
the extension that registers it.

### A worked composite

```csharp
services.AddScoped<OrderIndex>();
services.AddScoped<IOrderIndex>(sp => sp.GetRequiredService<OrderIndex>());
services.AddKeyedScoped<IReindexPolicy>("nightly", (sp, key) => new NightlyReindexPolicy(sp.GetRequiredService<TimeProvider>()));
services.AddKeyedSingleton<ReindexJob>("nightly");
services.AddHostedService(sp => sp.GetRequiredKeyedService<ReindexJob>("nightly"));
```

| Line | `wired-how` |
|---|---|
| 1 | `reg:direct` |
| 2 | `reg:forwarded` — the binding row names `IOrderIndex → OrderIndex` |
| 3 | `reg:keyed nightly +factory` — the factory builds `NightlyReindexPolicy` |
| 4 | `reg:keyed nightly` |
| 5 | `reg:hosted +factory +keyed nightly; composed-by {docs/flow-atlas/hosts/{host}.md, r7}` |

The endpoint and the job the composite serves:

```csharp file=ReindexOrdersEndpoint.cs
[Authorize(Policy = "orders:admin")]
[HttpPost("orders:reindex")]
[Tags("Orders")]
public class ReindexOrdersEndpoint(IOrderIndex _orderIndex) : EndpointWithoutRequest
{
    public override async Task HandleAsync(CancellationToken ct)
    {
        await _orderIndex.RebuildAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
```

```csharp file=ReindexJob.cs
public class ReindexJob(IServiceScopeFactory _scopeFactory, ILogger<ReindexJob> _logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var policy = scope.ServiceProvider.GetRequiredKeyedService<IReindexPolicy>("nightly");
        var count = await scope.ServiceProvider.GetRequiredService<IOrderIndex>().RebuildAsync(policy, stoppingToken);
        _logger.LogInformation("Order index rebuilt with {Count} orders", count);
    }
}
```

The atlas rows for this sample: the endpoint's entry page holds `ReindexOrdersEndpoint` (`route`), a call row
`IOrderIndex.RebuildAsync` (`ctor-injection`) and a link into the index segment; that segment's door row is the
binding `IOrderIndex → OrderIndex` (`reg:forwarded`). The job's entry page starts at the line-5 binding.

## S1 — run the tool

The tool sits in this skill's `tools/` folder; the base directory is the path the platform prints as
`Base directory for this skill:` when the skill loads. Write its output outside the repo it reads:

```bash
node "{base-dir}/tools/extract-dotnet.mjs" --repo {tree} > {scratch}/server.json
```

Test code is left out: a project named `*Tests` (`Orders.Tests`, `Orders.IntegrationTests`), a project referencing
a test framework or any of its packages (xUnit, NUnit, MSTest, TUnit, `xunit.extensibility.core`, the .NET test SDK)
and everything under a `test` or `tests` folder.
`--include-tests` reads it too; `directNew` still lists only classes registered in non-test code.

It prints `testCode` (whether test code was read, and how many test files the tree holds), `routePrefix`,
`routePrefixConflict`, `entries[]`, `registrations[]` (contract, implementation or `factory {selector, arms, unproven}`,
primary token, modifiers, lifetime, `scan`, `unproven` where it applies, the hosts that reach it, method, file,
line), `hosts[]` (each web host's and executable's composition tree from `Program.cs`,
every call with its `if` or `else` condition) and `directNew[]`. Comments and the inside of every string, char,
verbatim, raw and interpolated literal are never read as code. A composition call it cannot resolve to one
definition is marked `ambiguous` with its candidates, and an entry it cannot complete carries `unresolved` or a
`group` note — read those by hand. Exit 2: the tree does not exist.

## S2 — reading hints

- **Factories.** Read the lambda: the selector is the value it switches on; each class it builds is an arm. The
  tool lists as an arm a class that is the contract or derives from it through the tree's classes, records and
  interfaces; a thrown exception, or a helper the tree shows is no arm, is not one. A class it can neither prove nor
  refute (a base outside the tree) stays in `factory.unproven` and marks the registration unproven, as does a factory
  with no declared service type whose body is more than one `new` (`AddSingleton(sp => new Foo(…))` takes `Foo`).
  Few
  arms → one sub-row each, with the arm's condition in `next`'s `when`. Many arms → one row, and a selection row
  for how the arm is picked.
- **Decorators.** `Decorate` wraps the registration as it stands at that line, so the last registered decorator is
  the outermost: a call runs the decorators from the last registered to the first, then the decorated class. Write
  the chain in that order.
- **Selections.** Where code picks among registered variants by a string (a request field matched against each
  variant's name), write a selection row: the input that selects, the comparison, and one row per candidate, each
  with its search.
- **A parameter defaulted to `null`** is `optional — silent if unregistered`: the row stays, and S3 checks a
  registration exists in every host that reaches it.
- **Composition per host.** Start each host page from its `hosts[]` tree; a registration reached by several hosts
  is written once, on the segment page, with a variant row per host where it differs.
- **`directNew`** candidates are only that: a bypass row is written where the class is built with `new` on a path
  the container also serves; a value object is not one, and the tool never lists a class registered only in test
  code or an unproven arm.

## The optional container oracle

Where the repo already has a host test factory (`WebApplicationFactory<Program>`), S3 may check each binding row
against the built container. Work in an **isolated copy** of the repo beside it, never in the repo itself: add one
probe test next to the existing host tests there, run only that test, and have it write — outside the copy — what
each contract resolves to:

```csharp
public class ContainerOracleProbe(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public void WritesWhatEachContractResolvesTo()
    {
        using var scope = factory.Services.CreateScope();
        var resolved = new Dictionary<string, string>
        {
            ["IOrderIndex"] = scope.ServiceProvider.GetRequiredService<IOrderIndex>().GetType().Name,
            ["IReindexPolicy[nightly]"] = scope.ServiceProvider.GetRequiredKeyedService<IReindexPolicy>("nightly").GetType().Name,
        };
        File.WriteAllText(Environment.GetEnvironmentVariable("ATLAS_ORACLE_OUT")!, JsonSerializer.Serialize(resolved));
    }
}
```

Run it alone in the copy — `ATLAS_ORACLE_OUT={scratch}/oracle.json dotnet test {host test project} --filter
ContainerOracleProbe` — then delete the copy. The keys are the binding rows' contracts, `{contract}[{key}]` for a
keyed one. Pass the file to the atlas tool's
`verify --oracle {file}`; a row whose class differs fails. The container is the check, never the row source — a
factory registration resolves to its built class here, while a container dump names the lambda's declaring type.

## What this skill does NOT do

- Build the atlas — `build-flow-atlas` owns the pages, the stages and the verification.
- Run the app or trace a request; the oracle builds a container and resolves contracts, nothing more.
- Read a Vue client — `flow-atlas-vue`, beside this profile, owns the client side and its join to these entries.
