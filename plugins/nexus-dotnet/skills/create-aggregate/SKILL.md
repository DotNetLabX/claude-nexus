---
name: create-aggregate
description: Creates a DDD aggregate — the aggregate base where the repo has none, the state and behaviour files, value objects, domain events, the table configuration, the repository and the migration — for an EF Core or a Redis store. Use when adding an aggregate to a service's domain model, or promoting an entity to one.
---

# Create Aggregate

Builds an aggregate the way `domain-patterns` describes it: state in `{Name}.cs`, behaviour in
`Behaviors/{Name}.cs`, events raised by the behaviour and sent when the data is saved.

## Assumes

- **A Domain project** for the service (or a `Domain` folder in a one-project repo) and a Persistence project for an
  EF Core store.
- **The aggregate base, the event interface and the field-length constants** — sampled below; built once under Look
  First where the repo has none.
- **The action object** the commands carry (`create-feature` § Requests, Replies and Names) and the domain error
  family (`error-handling`).
- No shared library: every base this skill relies on is sampled whole.

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

## Binding rules

Not preferences — an aggregate that breaks one is wrong here (`domain-patterns` § AggregateRoot has the reasons):

1. It derives the aggregate base; the data library rebuilds it through a private constructor — no `Reconstitute`.
2. A member set once is `init` (and `required` when it must be given); a member behaviour changes has a private
   setter.
3. Every change goes through a behaviour method in `Behaviors/{Name}.cs` that takes the action object last, throws
   the domain error on a broken rule, and raises its event after the change.
4. No validator class, no limits record, no system clock and no persistence type in the domain.
5. Collections are private lists shown read-only; other aggregates are referenced by id.

## Steps

1. **Look first for the aggregate base** (`AggregateRoot<TKey>`, `IAggregateRoot`, the event interface). Where the
   repo has none, build it once from the samples below in the lowest project every service references.
2. **Write the state file and the behaviour file** — EF Core: `workflows/AggregateEfCore.md`; Redis:
   `workflows/AggregateRedis.md`.
3. **Write its value objects** where a value has a rule — `workflows/ValueObject.md`.
4. **Write its domain events** — `workflows/DomainEvent.md`.
5. **EF Core: write the table configuration and the repository** (in `workflows/AggregateEfCore.md`), and add the
   migration: `dotnet ef migrations add Add{Name} -p {Svc}.Persistence -s {Svc}.API`.
6. **Verify** — build, then search the domain project for what must not be there:
   ```bash
   dotnet build
   rg -n "DateTime(Offset)?\.UtcNow|Microsoft\.EntityFrameworkCore|AbstractValidator|\bsealed\b" {Svc}.Domain   # expect zero
   rg -n "public [A-Za-z<>?]+ \w+ \{ get; set; \}" {Svc}.Domain -g '!{Documents}/**'   # no public setter — expect zero
   ```

   A Redis document is the one domain type with public setters (`workflows/AggregateRedis.md`), so its folder is
   left out of the setter search.

## Folder Layouts

Two layouts; pick one per service and keep it.

- **Aggregate-grouped** — a service with several aggregates:

```text
{Svc}.Domain/
└── Orders/
    ├── Order.cs
    ├── Behaviors/Order.cs
    ├── Events/OrderShipped.cs
    ├── Enums/OrderStatus.cs
    └── ValueObjects/EmailAddress.cs
```

- **Flat** — a service with one aggregate: top-level `Behaviors/`, `Events/`, `Enums/`, `ValueObjects/` folders,
  the state file at the root.

## The Aggregate Base

Built once, in the lowest project every service references:

```csharp file=Entity.cs
public abstract class Entity<TKey>
    where TKey : struct
{
    public TKey Id { get; init; }

    public bool IsNew => EqualityComparer<TKey>.Default.Equals(Id, default);

    public override bool Equals(object? obj) =>
        ReferenceEquals(this, obj)
        || (obj is Entity<TKey> other && GetType() == other.GetType() && !IsNew && !other.IsNew && Id.Equals(other.Id));

    public override int GetHashCode() => IsNew ? base.GetHashCode() : HashCode.Combine(GetType(), Id);
}
```

```csharp file=IAggregateRoot.cs
public interface IAggregateRoot
{
    IReadOnlyList<IDomainEvent> DomainEvents { get; }

    void ClearDomainEvents();
}
```

```csharp file=AggregateRoot.cs
public abstract class AggregateRoot<TKey> : Entity<TKey>, IAggregateRoot
    where TKey : struct
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public int CreatedById { get; init; }

    public DateTimeOffset CreatedOn { get; init; }

    public int? LastModifiedById { get; private set; }

    public DateTimeOffset? LastModifiedOn { get; private set; }

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents;

    public void ClearDomainEvents() => _domainEvents.Clear();

    protected void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    protected void MarkModified(IAction action)
    {
        LastModifiedById = action.ActingUserId;
        LastModifiedOn = action.ActedOn;
    }
}
```

The event interface (`IDomainEvent`) carries the event bus's marker, so its sample sits with the publisher choice
(`create-domain-event-handler` § Decision 1 — publisher implementation); the action interface is
`create-feature`'s. The id type (`int` here) and the time type follow what the repo's entities already use.

## Field-Length Constants

One constants class gives every length its name, so the table configuration and the validator agree:

```csharp file=MaxLength.cs
public static class MaxLength
{
    public const int Code = 32;
    public const int Name = 128;
    public const int Email = 256;
    public const int Text = 2048;
}
```

## Promote an Existing Entity to an Aggregate Root (in place)

A type change in place, not a fresh scaffold:

1. **Change the base class** on the state file; keep its table configuration and repository.
2. **Check the schema consequence at plan time:** the base's audit columns make a migration — treat it as part of
   the change.
3. **Mirror an existing aggregate of the same service** for the behaviour split; raise a created event after the
   save where the id is generated by the store, so the event carries a real id.
4. **Move outside changes into behaviour methods** (`workflows/DomainEvent.md` for the events).

## Special Cases

- **A user on ASP.NET Core Identity** extends `IdentityUser<int>` and implements `IAggregateRoot` by hand.
- **A Redis store** has no aggregate base, no audit fields and no event list; it publishes its events by hand after
  the write (`workflows/AggregateRedis.md`).
