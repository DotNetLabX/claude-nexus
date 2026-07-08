---
name: add-state-machine
description: Add data-driven state-transition validation to an aggregate — a cached transition table (legal moves are seed data, never a hardcoded switch), a factory-provided validator, and a validate-before-mutate guard in the aggregate behavior. Use when a write-side service must gate an aggregate's state changes by legal action, or when adding a new state, action, or transition to a service that already has the machine.
user-invocable: true
---

# Add State Machine

Builds the data-driven guard that decides whether an aggregate may change state. Legal moves are stored as rows in a cached transition table and enforced by a `Validate…Transition` guard that runs *before* the aggregate mutates its state field. This is the sanctioned way to enforce a lifecycle invariant on a write-side aggregate.

**The whole point: legal transitions are DATA, not a hardcoded `switch`.** Adding or removing a legal move is a seed-data edit, never a code change.

> **Worked exemplar — the reference app (dotnet-microservices).** The pattern below is drawn from the Articles lifecycle: `ArticleStage` (the shared state enum, range-partitioned per service), `ArticleActionType` (the per-service action enum), the `ArticleStageTransition` seed table, `IArticleStateMachine` + `ArticleStateMachineFactory`, and the `ValidateStageTransition` guard in the `Article` aggregate. Every concrete `Article*` name in this skill is that exemplar — substitute your own aggregate's names. The placeholders `{Aggregate}` / `{Aggregate}State` / `{Aggregate}ActionType` carry the template.

## When to use

- Standing up state-transition validation on a new write-side aggregate (a lifecycle where legal moves depend on the current state and the action taken).
- Adding a new legal transition, action, or state to a service that already has the machine (jump to "Adding a new transition").

## Binding rules

1. **Transitions are DATA.** They live in the `{Aggregate}StateTransition` seed table, loaded through a cache — never a `switch` or `if`-ladder in the domain.
2. **Validate before mutate.** The guard is the *first* statement of the state-mutation method, before the state field is reassigned and before the no-op short-circuit.
3. **The guard throw is a sanctioned enforcement site.** The `DomainException` raised from the state-machine seam lives outside the aggregate's `Behaviors/` files by design — invariant enforcement is normally confined to behavior files; the state-machine guard is the deliberate exception. Do not "fix" it by relocating the throw.
4. **The transition table is whole-table cached** with a type-only key. Cache-backed services must prewarm it at startup or the lookup returns null.
5. **The domain never constructs the machine.** A per-service `{Aggregate}StateMachineFactory` delegate is resolved from DI and passed into the aggregate behavior.

## Phase 1 — Transition entity + seed data

The entity is a metadata row: a `(CurrentState, ActionType, DestinationState)` triple. A seedable-metadata marker makes it seedable; a cacheable marker marks it for the whole-table cache.

```csharp
// {Svc}.Domain/Entities/{Aggregate}StateTransition.cs
public class {Aggregate}StateTransition : IMetadataEntity, ICacheable
{
    public {Aggregate}State CurrentState { get; set; }
    public {Aggregate}ActionType ActionType { get; set; }
    public {Aggregate}State DestinationState { get; set; }
}
```

The EF config derives from the metadata base config — whose base `Configure` already calls `ToTable(typeof(T).Name)` and `SeedFromJsonFile()`. You add the composite key and the enum conversions:

```csharp
// {Svc}.Persistence/EntityConfigurations/{Aggregate}StateTransitionConfiguration.cs
internal class {Aggregate}StateTransitionConfiguration : MetadataConfiguration<{Aggregate}StateTransition>
{
    public override void Configure(EntityTypeBuilder<{Aggregate}StateTransition> builder)
    {
        base.Configure(builder);

        builder.HasKey(e => new { e.CurrentState, e.ActionType, e.DestinationState });

        builder.Property(e => e.CurrentState).IsRequired().HasEnumConversion();
        builder.Property(e => e.DestinationState).IsRequired().HasEnumConversion();
        builder.Property(e => e.ActionType).IsRequired().HasEnumConversion();
    }
}
```

The seed file **must** be named after the entity type and sit under `Data/Master/` — `SeedFromJsonFile()` resolves `{AppContext.BaseDirectory}Data/Master/{EntityName}.json`. A row whose `CurrentState` equals its `DestinationState` is a same-state reentry (e.g. re-uploading an asset). `//` comments are tolerated in the JSON.

Each service seeds only its own slice of the lifecycle. Concretely, in the reference app the Submission service's seed file looks like this — substitute your own states and actions:

```json
// {Svc}.Persistence/Data/Master/ArticleStageTransition.json  (reference app)
[
    {"CurrentStage": "None", "ActionType": "CreateArticle", "DestinationStage": "Created"},
    {"CurrentStage": "Created", "ActionType": "UploadAsset", "DestinationStage": "ManuscriptUploaded"},
    {"CurrentStage": "ManuscriptUploaded", "ActionType": "UploadAsset", "DestinationStage": "ManuscriptUploaded"},
    {"CurrentStage": "ManuscriptUploaded", "ActionType": "SubmitDraft", "DestinationStage": "Submitted"},
    {"CurrentStage": "Submitted", "ActionType": "ApproveDraft", "DestinationStage": "InitialApproved"},
    {"CurrentStage": "Submitted", "ActionType": "RejectDraft", "DestinationStage": "InitialRejected"}
]
```

The state enum is typically **shared** across the services that participate in one lifecycle (e.g. an `Abstractions` package), and **range-partitioned per service** so each service owns a numeric band. In the reference app that shared enum is `ArticleStage`:

```csharp
// reference app: Articles.Abstractions
public enum ArticleStage : int
{
    None = 0,
    // Submission: 101-105
    Created = 101, ManuscriptUploaded = 102, Submitted = 103,
    InitialRejected = 104, InitialApproved = 105,
    // Review: 201-205
    UnderReview = 201, ReadyForDecision = 202, AwaitingRevision = 203,
    Rejected = 204, Accepted = 205,
    // Production: 300-305
    InProduction = 300, DraftProduction = 301, FinalProduction = 302,
    PublicationScheduled = 304, Published = 305
}
```

The action enum is **per-service** (`{Svc}.Domain` — reference app: `ArticleActionType` with `CreateArticle, UploadAsset, SubmitDraft, ApproveDraft, RejectDraft`). Every action named in the seed JSON must be a member of it.

## Phase 2 — The state-machine interface + wrapper

The interface, the factory delegate, and the guard extension live together in the **Domain** layer. The guard is the enforcement point — it is where the lifecycle `DomainException` is thrown.

```csharp
// {Svc}.Domain/StateMachines/I{Aggregate}StateMachine.cs
public interface I{Aggregate}StateMachine
{
    bool CanFire({Aggregate}ActionType actionType);
}

public delegate I{Aggregate}StateMachine {Aggregate}StateMachineFactory({Aggregate}State state);

public static class Extensions
{
    public static void ValidateStateTransition(this {Aggregate}StateMachineFactory factory, {Aggregate}State state, {Aggregate}ActionType actionType)
    {
        var stateMachine = factory(state);

        if (!stateMachine.CanFire(actionType))
            throw new DomainException($"Action {actionType} not allowed in the {state} state");
    }
}
```

The concrete wrapper lives in the **Application** layer (or the module's API/Domain composition when the service has no Application layer). It builds the machine from the cached transition table: a real move becomes a permitted transition, a same-state row becomes a permitted reentry. The reference app wraps the `Stateless` library:

```csharp
// {Svc}.Application/StateMachines/{Aggregate}StateMachine.cs
public class {Aggregate}StateMachine : I{Aggregate}StateMachine
{
    private StateMachine<{Aggregate}State, {Aggregate}ActionType> _stateMachine;
    public {Aggregate}StateMachine({Aggregate}State state, IMemoryCache cache)
    {
        _stateMachine = new(state);

        var transitions = cache.Get<List<{Aggregate}StateTransition>>();
        foreach (var transition in transitions)
        {
            if (transition.CurrentState != transition.DestinationState)
                _stateMachine.Configure(transition.CurrentState)
                    .Permit(transition.ActionType, transition.DestinationState);
            else
                _stateMachine.Configure(transition.CurrentState)
                    .PermitReentry(transition.ActionType);
        }
    }

    public bool CanFire({Aggregate}ActionType actionType)
    {
        return _stateMachine.CanFire(actionType);
    }
}
```

## Phase 3 — Factory delegate DI registration

Register the `{Aggregate}StateMachineFactory` as **Scoped** in the service's `DependencyInjection.cs`, alongside the other scoped collaborators. Two proven variants — pick by how the transition table reaches the wrapper.

**Cache-backed** (reference app: Submission, Review) — the table is prewarmed into `IMemoryCache`:

```csharp
services.AddScoped<{Aggregate}StateMachineFactory>(provider => state =>
{
    var cache = provider.GetRequiredService<IMemoryCache>();
    return new {Aggregate}StateMachine(state, cache);
});
```

**DbContext-backed** (reference app: Production) — the wrapper reads `dbContext.GetAllCached<{Aggregate}StateTransition>()` instead of `cache.Get<...>()`:

```csharp
services.AddScoped<{Aggregate}StateMachineFactory>(provider => state =>
{
    var dbContext = provider.GetRequiredService<{Svc}DbContext>();
    return new {Aggregate}StateMachine(state, dbContext);
});
```

For the cache-backed variant, the transition table must be loaded into `IMemoryCache` at startup — a hosted cache-loader prewarms it (see `persistence-patterns` for the whole-table cache and the `DatabaseCacheLoader`). Without the prewarm, `cache.Get<List<{Aggregate}StateTransition>>()` returns null and the constructor throws.

## Phase 4 — The guard in the aggregate behavior

The state-mutation method is the single mutation point for the state field. The guard is its **first** line — before the no-op short-circuit, before any field is touched:

```csharp
// {Svc}.Domain/Behaviors/{Aggregate}.cs
public void SetState({Aggregate}State newState, I{Aggregate}Action<{Aggregate}ActionType> action, {Aggregate}StateMachineFactory stateMachineFactory)
{
    stateMachineFactory.ValidateStateTransition(State, action.ActionType);

    if (newState == State) // there is no transition to be done
        return;

    var currentState = State;
    State = newState;
    LastModifiedOn = action.CreatedOn;
    LastModifiedById = action.CreatedById;

    AddDomainEvent(
        new {Aggregate}StateChanged(currentState, newState, action));
}
```

Higher-level behaviors thread the factory through to the mutation method — they receive it as a parameter and never new-up the machine:

```csharp
public void Approve(I{Aggregate}Action<{Aggregate}ActionType> action, {Aggregate}StateMachineFactory stateMachineFactory)
{
    // an actor/provenance-recording line goes here for services that track who performed the action
    // (reference app: Article.Approve also records the approving editor as an ArticleActor)
    SetState({Aggregate}State.InitialApproved, action, stateMachineFactory);

    AddDomainEvent(new {Aggregate}Approved(this, action));
}
```

The command handler resolves the `{Aggregate}StateMachineFactory` from DI and passes it in; the `ActionType` comes from the command via `action.ActionType`.

## Adding a new transition

The common repeat case — no C# change unless the enum members are new:

1. Add the row to `{Svc}.Persistence/Data/Master/{Aggregate}StateTransition.json` (`CurrentState` = `DestinationState` for a same-state reentry).
2. If the action or state is new, add the member — the action enum in `{Svc}.Domain`, the state enum in the shared abstractions package (keep the per-service numeric range).
3. Reseed. The table is seed-on-configure metadata; the cache reloads it at startup.

That is the full change — the machine picks the new move up as data.

## Known future direction (reference app)

The reference app carries a `//todo` on the Application-layer wrapper recording the intended evolution: replace the `Stateless` library with direct DB-backed (cached) checks. Its Production service is already partway — its wrapper reads from `dbContext.GetAllCached<{Aggregate}StateTransition>()` — but still wraps `Stateless`. When you implement that direction, keep the `CanFire` seam and the `ValidateStateTransition` guard identical; only the wrapper internals change, so no call site or DI registration moves.

## What this skill does NOT do

- Create the aggregate, the state/action enums, or the command and handler — the aggregate comes from `create-aggregate`; this skill assumes it already exists and only adds the transition guard to it.
- Build the cache prewarm loader — that is the caching/persistence setup (`persistence-patterns`), referenced here, not created here.
- Add cross-service integration events — the `{Aggregate}StateChanged` domain event is in-process; propagating it across services is `add-integration-event` and `consumer-patterns`.
- Discuss the design-level state-machine placement trade-offs (Application-layer vs module composition) — that stays in `domain-patterns` ("State Machine Pattern"); this skill is the build recipe.
