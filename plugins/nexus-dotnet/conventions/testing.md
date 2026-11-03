# Testing Conventions

Stack-specific testing standards. For the TDD loop (red, green, refactor), see the `tdd` skill.

## Backend (.NET)

### Project Structure

**One test project per module or service.** Each module and each service has its own test project, `{Name}.Tests`,
beside its other projects. It references that module's or service's own projects only (its API project included,
where its features live there), never another module's or service's. Tests that need the whole running app (the
host's composition, start-up, a call through every layer) live in one small test project for the app's own wiring,
never as the home for module tests. Why: a test run follows project references, so a change then ties to the few
tests that cover it.

```text
src/Modules/Billing/
  Billing.Domain/
  Billing.Persistence/
  Billing.Tests/                 # references the Billing projects only
src/Services/Orders/
  Orders.API/
  Orders.Domain/
  Orders.Tests/                  # references the Orders projects only
src/Hosts/Shop/
  Shop.Host/
  Shop.Host.Tests/               # the app's own wiring only
```

Inside a test project:

```text
{Svc}.Tests/
  Features/{Area}/
    {ClassUnderTest}Tests.cs     # one test class per class under test
  _Fixtures/
    TestData.cs                  # static factory methods for domain entities
```

Mirror the main project's `Features/` folder structure.

### Naming

- Test class: `{ClassUnderTest}Tests`
- Test method: `Should_{ExpectedBehavior}_When_{Condition}`
- A test method is exempt from the `Async` ending: its name says the behaviour it checks. An async helper in a test
  class still ends in `Async`, and every other rule of form binds test code as it binds production code.
- The class under test: `_sut`

### Slices

Group tests by behaviour slice: one test per slice, holding the related assertions, named for the behaviour — the
test name says the slice, so no comment banners between tests. Don't split one behaviour across several tests.

### Test Data

Use static factory methods in `TestData.cs` — not builders, not object mothers:

```csharp
TestData.OpenOrder(placedOn: ..., dueOn: ...)
TestData.ActiveCustomer("cust-1", "Customer One", region: "North")
TestData.OrderLine("SKU-1", quantity: 2)
TestData.Shipment(orderId, carrier: "Road", shippedOn: shippedOn)
```

Each factory returns a valid default; optional parameters override specific fields. Keep the factories in one file
per test project.

### Assertions

One assertion library per test project — the one the repo's test projects already use. The shipped conventions check
uses plain `Assert`, so adding it brings no package.

### Mocking

Instantiate pure calculators directly (`new()`) — no mocking for stateless logic. Reserve a mocking library
(`NSubstitute`) for classes with outside dependencies (repositories, typed clients), and `WebApplicationFactory` for
endpoint integration tests, set up as § Tests That Start the App says.

### The Clock

A class that needs the time takes `TimeProvider`; a test passes a fake one (`FakeTimeProvider`) and sets the time.

### Tests That Start the App <!-- id: test-host -->

A test that boots the app through `WebApplicationFactory<Program>` reads no setting it did not set and reaches no live
system unless it says so.

- **Settings.** The factory runs the app in the `Testing` environment, never `Development`, so the developer's user
  secrets are never loaded. It hands the app every value with `UseSetting`; the factory passes its host configuration
  to `Program.cs` as command-line arguments, so the values are there before `Build()`, where a host reads its
  switches. That configuration also holds every `ASPNETCORE_`-prefixed environment variable, so before the host is
  built the factory keeps only its own values and the environment, content root and application name. In the
  `Testing` environment the host's `Program.cs` keeps those arguments as its only settings source, so no environment
  variable and no base `appsettings.json` value fills a setting the test left out: the test settings name every
  section the host binds, under its class name, and a missing one fails start-up, as any missing section does.
- **Outbound calls.** Every client the HTTP client factory makes — default, named and typed, one that sets its own
  handler too — gets a primary handler that throws, so a call fails inside the process. A test that needs a client
  registers a fake for the client's type in its own `WithWebHostBuilder`. Every other transport the host starts is
  replaced by an in-process or local test double: the bus by its test harness (MassTransit's
  `AddMassTransitTestHarness` puts an in-memory transport in place of the host's), a gRPC client by a fake of its
  contract, a distributed cache by the in-memory one. The refusing handler cannot reach a client built with
  `new HttpClient()` or owned by a vendor SDK: pointing that one at a local endpoint is the test author's job.
- **Storage.** Databases are local test ones — a container or a file database, as the repo's test projects already
  use. A file root sits under a temp folder of its own per run, set in the test settings.
- **Live tests.** A test meant to reach a live system is opt-in: marked so a default run skips it (`Explicit = true`
  on an xUnit v3 fact, or a category the default run filters out). It names the settings it uses itself, and it
  checks afterwards that it left no rows behind.

The host's `Program.cs`, before anything reads a setting:

```csharp
var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Configuration.Sources.Clear();
    builder.Configuration.AddCommandLine(args);
}
```

The factory, its refusing handler and the test settings, in the app's wiring test project:

```csharp file=TestHostFactory.cs
public class TestHostFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        foreach (var (key, value) in TestSettings.Values)
            builder.UseSetting(key, value);

        builder.ConfigureTestServices(services =>
        {
            services.PostConfigureAll<HttpClientFactoryOptions>(options =>
                options.HttpMessageHandlerBuilderActions.Add(handler => handler.PrimaryHandler = new NoOutboundCallsHandler()));
            services.AddMassTransitTestHarness();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureHostConfiguration(config =>
        {
            var keep = new HashSet<string>(TestSettings.Values.Keys, StringComparer.OrdinalIgnoreCase)
                { HostDefaults.EnvironmentKey, HostDefaults.ContentRootKey, HostDefaults.ApplicationKey };
            var kept = config.Build().AsEnumerable().Where(setting => keep.Contains(setting.Key)).ToList();
            config.Sources.Clear();
            config.AddInMemoryCollection(kept);
        });

        return base.CreateHost(builder);
    }
}
```

```csharp file=NoOutboundCallsHandler.cs
public class NoOutboundCallsHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
        throw new InvalidOperationException($"A test called {request.RequestUri}; register a fake for that client.");
}
```

```csharp file=TestSettings.cs
public static class TestSettings
{
    public static readonly IReadOnlyDictionary<string, string?> Values = new Dictionary<string, string?>
    {
        ["BillingOptions:Enabled"] = "true",
        ["JwtOptions:Issuer"] = "shop-tests",
        ["JwtOptions:Secret"] = "a-local-test-signing-key-of-at-least-32-characters",
        ["RabbitMqOptions:Host"] = "localhost",
        ["RabbitMqOptions:VirtualHost"] = "/",
        ["RabbitMqOptions:UserName"] = "guest",
        ["RabbitMqOptions:Password"] = "guest",
        ["AllowedOriginsOptions:Origins:0"] = "http://localhost:5173",
        ["ConnectionStrings:Orders"] = "Host=localhost;Port=5433;Database=orders_tests;Username=test;Password=test",
        ["ConnectionStrings:Billing"] = "Host=localhost;Port=5433;Database=billing_tests;Username=test;Password=test",
    };
}
```

`PostConfigureAll` runs after every client's own set-up, so the refusing handler replaces even a handler a client
chose itself.
<!-- id-end -->

## Frontend (Vue/TypeScript)

A Vue front end's testing conventions are in `vue.md` § Testing, from the nexus-vue plugin.

## Coverage Expectations

Not every feature needs tests. Prioritize:
- Calculators with business logic (totals, rates, deltas)
- Domain aggregate behavior methods
- Edge cases flagged in plan steps or KB entries

Skip tests for:
- Pure wiring (DI registration, EF config, endpoint routing)
- UI layout and styling
- Simple CRUD with no business rules
