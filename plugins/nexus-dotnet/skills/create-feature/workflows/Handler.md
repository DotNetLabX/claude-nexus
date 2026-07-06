# Create MediatR Handler

Used by: MediatR services

## Inputs
- Feature name and domain area
- Command/query type (command = write, query = read)
- Handler dependencies (repositories, services)
- Return type

## Outputs
- `{Svc}.Application/Features/{Domain}/{FeatureName}/{FeatureName}Command.cs` (or Query)
- `{Svc}.Application/Features/{Domain}/{FeatureName}/{FeatureName}CommandHandler.cs`

## Gate
Proceed only after: service CLAUDE.md confirms MediatR usage.

## Command + Handler Pattern

**Reference:** `src/Services/{Svc}/{Svc}.Application/Features/{FeatureName}/{FeatureName}CommandHandler.cs`

### Command file: `{FeatureName}Command.cs`

```csharp
public record {FeatureName}Command : ICommand<{ResponseType}>, IAuditableAction
{
    [JsonIgnore] // stamped server-side by AssignUserIdBehavior — NEVER bound from the request body
    public int CreatedById { get; set; }
    public required int {EntityId} { get; init; }
    // other properties...
}
```

- Use `ICommand<T>` for mutations, `IQuery<T>` for reads
- Implement `IAuditableAction` if the command needs user ID assignment via pipeline behavior
- **Acting-user provenance is server-side, never wire-bound.** `IAuditableAction` requires `CreatedById`, so
  the property stays — but it MUST be non-bindable from the request: mark it `[JsonIgnore]` (or inherit a base
  command that stamps it, e.g. the reference app's `ArticleCommandBase` — `[JsonIgnore] public int CreatedById`).
  The `AssignUserIdBehavior` pipeline sets it from the JWT claims. Binding the creator id from the caller is a
  provenance/security regression.
- Validator class co-located in same file (see `workflows/Validator.md`)

### Handler file: `{FeatureName}CommandHandler.cs`

```csharp
public class {FeatureName}CommandHandler({Dependencies})
    : IRequestHandler<{FeatureName}Command, {ResponseType}>
{
    public async Task<{ResponseType}> Handle({FeatureName}Command command, CancellationToken ct)
    {
        // Load aggregate
        var entity = await _repository.FindByIdOrThrowAsync(command.{EntityId});

        // Execute domain logic
        entity.{DomainMethod}(command.{Params}, command);

        // Save (domain events dispatch via interceptor)
        await _repository.SaveChangesAsync();

        return new {ResponseType}(entity.Id);
    }
}
```

### Query Handler Pattern

```csharp
public class {FeatureName}QueryHandler({Dependencies})
    : IRequestHandler<{FeatureName}Query, {ResponseType}>
{
    public async Task<{ResponseType}> Handle({FeatureName}Query query, CancellationToken ct)
    {
        var entity = await _repository.FindByIdOrThrowAsync(query.Id);
        return entity.Adapt<{ResponseType}>();
    }
}
```

## Location

Handlers live in the Application project:
```
{Service}.Application/Features/{Domain}/{FeatureName}/
├── {FeatureName}Command.cs          (command record + validator)
└── {FeatureName}CommandHandler.cs   (handler)
```
