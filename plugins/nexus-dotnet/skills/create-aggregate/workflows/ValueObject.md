# Create Value Object

A value object is a class — never a record — with a private constructor and a guarded static `Create`, compared by
value. The guard throws the domain error; the private constructor is also the one the data library rebuilds
through.

## The Base

Equality by value is the base's one job. Built once, in the lowest project every service references:

```csharp file=ValueObject.cs
public abstract class ValueObject
{
    public override bool Equals(object? obj) =>
        obj is ValueObject other && GetType() == other.GetType() && GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());

    public override int GetHashCode() =>
        GetEqualityComponents().Aggregate(0, (hash, component) => HashCode.Combine(hash, component));

    protected abstract IEnumerable<object?> GetEqualityComponents();
}
```

## Pattern: One Value

```csharp file=EmailAddress.cs
public class EmailAddress : ValueObject
{
    private EmailAddress(string value) => Value = value;

    public string Value { get; }

    public static EmailAddress Create(string value)
    {
        var email = Guard.ThrowIfNullOrWhiteSpace(value).Trim();
        Guard.ThrowIfFalse(email.Contains('@'), $"{email} is not an e-mail address.");

        return new EmailAddress(email);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value.ToLowerInvariant();
    }
}
```

## Pattern: Several Values

```csharp file=Money.cs
public class Money : ValueObject
{
    private Money(decimal amount, string currency) => (Amount, Currency) = (amount, currency);

    public decimal Amount { get; }

    public string Currency { get; }

    public static Money Create(decimal amount, string currency)
    {
        Guard.ThrowIfFalse(amount >= 0, "An amount cannot be negative.");
        Guard.ThrowIfFalse(currency.Length == 3, $"{currency} is not a currency code.");

        return new Money(amount, currency);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}
```

Where a serializer must rebuild a value object (a document store, a cached copy), mark the private constructor
`[JsonConstructor]`.

## Location

`{Svc}.Domain/{Aggregates}/ValueObjects/{Name}.cs`, or a top-level `ValueObjects/` folder in the flat layout. Each
service owns its value objects, even where two hold the same shape; only the base is shared.

## When Not To

A value with no rule (a count, a flag) stays a plain member; a closed set of values is an enum. A choice: in a
service with little real domain, a value becomes a type only where one class shows that it helps.

## Persistence

An owned or complex type in the table configuration, its lengths from the field-length constants and its column
named by the repo's one naming choice. `persistence-patterns` § Entity Configuration owns the sample
(`CustomerConfiguration`, which maps `EmailAddress` as a complex type).
