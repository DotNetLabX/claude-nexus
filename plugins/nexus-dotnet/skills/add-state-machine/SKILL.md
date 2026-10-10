---
name: add-state-machine
description: Add data-driven state-transition validation to an aggregate — a cached transition table (legal moves are seed data, never a hard-coded switch), a validator supplied by a factory delegate registered once, and a validate-before-change guard in the aggregate's behaviour. Use when a write-side service must gate an aggregate's state changes by the action taken, or when adding a state, an action or a transition to a service that already has the machine.
user-invocable: true
---

# Add State Machine

Builds the guard that decides whether an aggregate may change state. Legal moves are rows of a cached transition
table, and a guard checks them **before** the aggregate changes its state member. The samples use an order's
lifecycle — placed, packed, shipped; substitute your own aggregate's states and actions.

**The whole point: legal transitions are data, not a `switch`.** Adding or removing a legal move is a seed-data edit,
never a code change.

## Assumes

- **The aggregate** (`create-aggregate`), its state enum and its action enum, and the action object the commands
  carry.
- **EF Core** for the transition table, the seeding step and the small-table cache (`persistence-patterns`).
- **A state-machine library** for the wrapper — Stateless in the sample; the guard and the delegate do not depend
  on it.
- No shared library: the delegate, the guard and the wrapper are sampled whole.

<!-- nexus-gen coding-conventions sections="look-first" BEGIN -->
#### Look First

Before building anything a skill relies on — a guard helper, the central error mapper, a settings binder, an
aggregate or repository base, a save interceptor, an event publisher — look at what the repo already has: first
`project-lists.md` § Helpers, then the shared libraries, modules and packages the project can reach (its project
references and the central package file). Use what you find. Only otherwise build it once, in the shared place: the
lowest project every user of it already references; in a repo of one project, a `Shared` folder in it; where the
users share no project, a new shared project each of them references, with no reference cycle. Never a copy beside
each user. Add its row to `project-lists.md` § Helpers in the same change.
<!-- nexus-gen coding-conventions END -->

## When to use

- Standing up transition validation on a write-side aggregate whose legal moves depend on its state and the action.
- Adding a transition, an action or a state to a service that already has the machine ("Adding a new transition").

## Binding rules

1. **Transitions are data** — rows of the `{Aggregate}StateTransition` table, loaded through the cache; never a
   `switch` or an `if` ladder.
2. **Validate before changing.** The guard is the first statement of the state-changing method, before the state
   member changes and before the no-op return.
3. **The guard's domain error is a sanctioned place to throw** outside the aggregate's behaviour files; do not move
   it.
4. **The table is cached whole,** and the cache is filled at start-up.
5. **The domain never builds the machine.** A factory delegate, registered once, is passed into the behaviour.

## Phase 1 — Transition entity + seed data

A row is a `(CurrentState, ActionType, DestinationState)` triple:

```csharp file=OrderStateTransition.cs
public class OrderStateTransition
{
    public OrderStatus CurrentState { get; init; }

    public OrderActionType ActionType { get; init; }

    public OrderStatus DestinationState { get; init; }
}
```

```csharp file=OrderStateTransitionConfiguration.cs
public class OrderStateTransitionConfiguration : IEntityTypeConfiguration<OrderStateTransition>
{
    public void Configure(EntityTypeBuilder<OrderStateTransition> builder)
    {
        builder.HasKey(transition => new { transition.CurrentState, transition.ActionType, transition.DestinationState });
        builder.Property(transition => transition.CurrentState).HasConversion<string>().HasMaxLength(MaxLength.Code);
        builder.Property(transition => transition.ActionType).HasConversion<string>().HasMaxLength(MaxLength.Code);
        builder.Property(transition => transition.DestinationState).HasConversion<string>().HasMaxLength(MaxLength.Code);
        builder.HasData(SeedFile.Read<OrderStateTransition>("Data/Master"));
    }
}
```

The rows are master data: a seed file named after the table, read by the configuration and seeded with `HasData`,
so they ship in a migration (`persistence-patterns` § Seed Data (Dual Pattern)). A row whose current state equals its destination is a same-state
re-entry (re-uploading a file):

```json
[
    {"CurrentState": "None", "ActionType": "Place", "DestinationState": "Placed"},
    {"CurrentState": "Placed", "ActionType": "AddNote", "DestinationState": "Placed"},
    {"CurrentState": "Placed", "ActionType": "Pack", "DestinationState": "Packed"},
    {"CurrentState": "Packed", "ActionType": "Ship", "DestinationState": "Shipped"},
    {"CurrentState": "Placed", "ActionType": "Cancel", "DestinationState": "Cancelled"}
]
```

The state enum and the action enum live in the Domain project's `Enums/` folder; every action in the seed file is a
member of the action enum. Where several services own slices of one lifecycle, the state enum lives in the lowest
project they share, and each service seeds only its own slice.

## Phase 2 — The state-machine interface + wrapper

The interface, the factory delegate and the guard live in the **Domain** project. The guard is where the lifecycle's
domain error is thrown.

```csharp file=IOrderStateMachine.cs
public interface IOrderStateMachine
{
    bool CanFire(OrderActionType actionType);
}
```

```csharp file=OrderStateMachineFactory.cs
public delegate IOrderStateMachine OrderStateMachineFactory(OrderStatus state);
```

```csharp file=OrderStateMachineExtensions.cs
public static class OrderStateMachineExtensions
{
    public static void ValidateTransition(this OrderStateMachineFactory factory, OrderStatus state, OrderActionType actionType)
    {
        if (!factory(state).CanFire(actionType))
            throw new DomainException($"{actionType} is not allowed on an order that is {state}.");
    }
}
```

The wrapper lives where the service registers its per-call objects (the Application project, else the API project).
It builds the machine from the cached table: a move becomes a permitted transition, a same-state row a permitted
re-entry.

```csharp file=OrderStateMachine.cs
using Stateless;

public class OrderStateMachine : IOrderStateMachine
{
    private readonly StateMachine<OrderStatus, OrderActionType> _stateMachine;

    public OrderStateMachine(OrderStatus state, IReadOnlyList<OrderStateTransition> transitions)
    {
        _stateMachine = new StateMachine<OrderStatus, OrderActionType>(state);

        foreach (var transition in transitions)
        {
            var configuration = _stateMachine.Configure(transition.CurrentState);
            if (transition.CurrentState == transition.DestinationState)
                configuration.PermitReentry(transition.ActionType);
            else
                configuration.Permit(transition.ActionType, transition.DestinationState);
        }
    }

    public bool CanFire(OrderActionType actionType) => _stateMachine.CanFire(actionType);
}
```

The explicit constructor stays because its body builds state.

## Phase 3 — Factory delegate DI registration

An object with behaviour that must be built per call from run-time values — a state machine, a per-request helper —
comes from a named factory delegate registered once, never from `new` inside the logic. Replies, records and other
plain data are built with `new`. The registration is a lambda by necessity: it is the one place the object is built.

```csharp
services.AddScoped<OrderStateMachineFactory>(provider => state =>
    new OrderStateMachine(state, provider.GetRequiredService<IMemoryCache>().GetCachedTable<OrderStateTransition>()));
```

The table reaches the cache at start-up through the small-table cache loader, registered with the memory cache it
fills (`persistence-patterns` § Caching Small Tables). A choice: a good pattern with few uses — reach for it where a behaviour object really is built per call, not
for every class.

## Phase 4 — The guard in the aggregate behavior

The state-changing method is the one place the state member changes, and the guard is its first line:

```csharp
public void ChangeState(OrderStatus newState, OrderStateMachineFactory stateMachineFactory, IOrderAction action)
{
    stateMachineFactory.ValidateTransition(Status, action.ActionType);

    if (newState == Status)
        return;

    var previous = Status;
    Status = newState;
    MarkModified(action);
    AddDomainEvent(new OrderStateChanged(this, previous, newState, action));
}
```

Higher-level behaviours pass the factory through; they never build the machine:

```csharp
public void Pack(OrderStateMachineFactory stateMachineFactory, IOrderAction action) =>
    ChangeState(OrderStatus.Packed, stateMachineFactory, action);
```

The handler or endpoint takes the factory by injection and passes it in; the action type comes from the command
(`IOrderAction` is the area's action interface, carrying `ActionType` beside who and when; its sample, and the area
command base that implements it, are `create-feature` § Requests, Replies and Names).

## Adding a new transition

No C# change unless an enum member is new:

1. Add the row to the seed file (current state equal to destination for a re-entry).
2. If the action or the state is new, add the enum member.
3. Add a migration — the seeded rows change with it; the cache reloads the table at start-up.

## What this skill does NOT do

- Create the aggregate, its enums, or the command and handler — `create-aggregate`, `create-feature`.
- Build the seeding step or the cache loader — `persistence-patterns`.
- Propagate the state change to other services — `add-integration-event`, `consumer-patterns`.
- Decide where the machine sits in the design — `domain-patterns` § State Machine Pattern.
