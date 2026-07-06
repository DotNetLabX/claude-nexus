# Create Integration Event Contract

## Pattern

**Reference:** `src/BuildingBlocks/{ProjectName}.Integration.Contracts/{Domain}/{EventName}Event.cs`

Create in `BuildingBlocks/{ProjectName}.Integration.Contracts/{Domain}/`:

```csharp
namespace {ContractsNamespace}.{Domain};

public record {EventName}Event({DtoType} {DtoName});
```

> **Namespace ≠ folder — verify, don't derive.** The contracts project's **namespace may diverge from its folder name**. Declare and reference the project's *actual* namespace (open an existing contract file to read it); never infer it from the folder path. Getting this wrong compiles nowhere the consumer can `using` it.
>
> Reference app: the folder is `Articles.Integration.Contracts` but the namespace is `Articles.IntegrationEvents.Contracts` (a commented-out wrong-namespace line in source marks the trap). So `{ContractsNamespace}` = `Articles.IntegrationEvents.Contracts`, not the folder-derived `Articles.Integration.Contracts`.

### DTO (included in same file or separate)

```csharp
public record {DtoType}(
    int Id,
    string {Property},
    // ... all data the consumer needs
);
```

## Rules

- Integration events are **records** (immutable)
- Include ALL data the consumer needs — consumers should NOT call back to the publisher service
- Use simple types (int, string, DateTime) — no domain types in contracts
- Event naming: `{What Happened}Event` (past tense) — e.g., `OrderApprovedForFulfillmentEvent`
- DTOs carry the snapshot of state at the time of the event
