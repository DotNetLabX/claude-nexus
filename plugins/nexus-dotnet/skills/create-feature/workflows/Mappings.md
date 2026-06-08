# Create Mappings (Mapster)

## Inputs
- Source type (domain entity or command)
- Destination type (response DTO or view model)
- Any custom property mappings needed (non-default names, computed values)

## Outputs
- Entry in `{Svc}.Application/Mappings/{Domain}Mappings.cs` (new `IRegister` class or added config)

## Gate
Proceed only after: source and destination types are defined. Verify an existing `{Domain}Mappings.cs` doesn't already cover this mapping.

## Pattern

**Reference:** `src/Services/{Svc}/{Svc}.Application/Mappings/{Domain}Mappings.cs`

Mapster configs are auto-discovered via `IRegister` interface + assembly scan:

```csharp
public class {Domain}Mappings : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<{Source}, {Destination}>()
            .Map(dest => dest.{Prop}, src => src.{OtherProp});
    }
}
```

## Registration

**File:** `src/BuildingBlocks/Blocks.Core/Mapster/DependencyInjection.cs`

Auto-discovered — no manual registration:
```csharp
services.AddMapsterConfigsFromAssemblyContaining<GrpcMappings>();
// or: services.AddMapsterConfigsFromCurrentAssembly();
```

## Mapster Eligibility Test (run before reaching for `.Adapt`)

Mapster fits a **narrower** set of cases than "any hand-assignment." It is the right tool only for a **single-source object → object map with name-aligned fields**. Leave the assignment **explicit** (a hand-written map method or builder) when any of these hold:

| Not a Mapster target | Why |
|----------------------|-----|
| Method-dispatch (`SetCapacity` calls `UpsertCapacityAsync(...)`) | No object→object shape — it's a behavior call |
| Multi-source assembly (`UserResponse` from `User` + `Person`) | More than one source object |
| Conditional logic (secret-preservation, stage-order, branch-by-flag) | Mapping depends on runtime state, not field names |

A plan that says "replace hand-mapping with Mapster" without this carve-out pushes the developer to force-fit `.Adapt` and break behavior. Apply the test per call site.

## Inline Mapping (No Config Needed)

For simple cases where property names match:
```csharp
var response = entity.Adapt<{ResponseType}>();   // outbound: domain/entity -> response DTO (new object)
var entity = command.Adapt<{Entity}>();          // inbound: command -> NEW entity (new object)
```

> **Two directions, different rules.** The lines above both create a **new** object. The dangerous case is the **inbound partial update onto an already-tracked entity** (`req.Adapt(existing)`): `IgnoreNonMapped(true)` is a whitelist not a shield (zero `.Map()` calls → silent no-op write), `.Adapt(existing)` never nulls unmatched members (so no guard is needed), and `ComplexProperty`/owned VOs must be assigned explicitly. That direction lives with the EF-tracking rules — see `persistence-patterns` → "Mapping a Command onto a Tracked Entity."

### Outbound flattening caveat — VOs that drop their field prefix

Mapster auto-flattens by name: `Group.Member` ↔ `GroupMember`. But cohesive VOs are usually written to **drop** the group prefix for readability (`BugRatio.Target`, not `BugRatio.BugRatioTarget`), so auto-flattening **does not line up** with the flat wire names (`bugRatioTarget`). When a domain VO drops its prefix, the boundary map needs an **explicit** `.Map(dest => dest.BugRatioTarget, src => src.BugRatio.Target)` per pair — do not rely on "Mapster flattens by name." Anchor any verification grep on the **member name**, not an assumed `settings.` variable prefix (a read site may use `settings2.X`).

## Post-Mapping Actions

Use `AdaptWith<T>()` for mutations after mapping:
```csharp
var dto = entity.AdaptWith<EditorDto>(dest =>
{
    dest.Role = editorRole.EditorRole;
});
```

## Records

For immutable record types, use `MapToConstructor()`:
```csharp
config.NewConfig<Source, DestinationRecord>().MapToConstructor();
```

## Location

Mapping configs in Application project: `{Service}.Application/Mappings/{Domain}Mappings.cs`
