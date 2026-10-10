# Testing Conventions

Stack-specific testing standards. For the TDD loop (red, green, refactor), see the `tdd` skill.

## Backend (.NET)

### Project Structure

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
endpoint integration tests.

### The Clock

A class that needs the time takes `TimeProvider`; a test passes a fake one (`FakeTimeProvider`) and sets the time.

## Frontend (Vue/TypeScript)

### File Location

Co-located with source: `client/src/**/*.spec.ts`

### Framework

Vitest + `@vue/test-utils`. MSW for API mocking when needed.

### Naming

Same `should ... when ...` pattern as backend, adapted to `describe`/`it`:

```typescript
describe('OrderListStore', () => {
  it('should return no orders when no filter matches', () => { ... })
})
```

## Coverage Expectations

Not every feature needs tests. Prioritize:
- Calculators with business logic (totals, rates, deltas)
- Domain aggregate behavior methods
- Edge cases flagged in plan steps or KB entries

Skip tests for:
- Pure wiring (DI registration, EF config, endpoint routing)
- UI layout and styling
- Simple CRUD with no business rules
