# Create Validator

Every input has a validator, route ids included; it lives in the command or query file beside the request, and it
runs before the logic.

## Inputs
- The command or query and its members
- The plan step's rules for each member (required, length, range, format)

## Outputs
- `{Request}Validator` — in `{Operation}Command.cs` or `{Operation}Query.cs`, never a file of its own

## Gate
Proceed only after: the request's members are known.

## Rules

- **Named `{Request}Validator`** — `ShipOrderCommandValidator` for `ShipOrderCommand`. A base validator several
  commands share is named for its family (`OrderCommandValidator<T>`) and lives with the family's base command.
- **Every required member is validated,** and a route id is validated greater than zero.
- **Messages** come from the shared message helpers or constants (`error-handling` § Validation Messages), or the
  library's default message — never a literal per rule.
- **Lengths** come from the shared field-length constants where the repo has them (`create-aggregate`), so the
  validator and the table configuration agree.
- **Validation only.** A validator checks the shape of the input; a business rule is the aggregate's, and a lookup
  belongs to the handler. A validator does not log.

## FastEndpoints: `Validator<T>`

FastEndpoints finds and runs validators itself:

```csharp file=PlaceOrderCommand.cs
public record PlaceOrderCommand : ActionCommandBase<OrderActionType>
{
    public required int CustomerId { get; init; }

    public required List<OrderLineDto> Lines { get; init; }

    public override OrderActionType ActionType => OrderActionType.Place;
}

public class PlaceOrderCommandValidator : Validator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(command => command.CustomerId).ValidId();
        RuleFor(command => command.Lines).NotEmpty();
        RuleForEach(command => command.Lines).ChildRules(line =>
        {
            line.RuleFor(item => item.ProductCode).RequiredWithMaxLength(MaxLength.Code);
            line.RuleFor(item => item.Quantity).GreaterThan(0);
        });
    }
}
```

`AddError` and `ThrowIfAnyErrors` belong to validation; a broken business rule is thrown by the domain.

## Mediator Style: `AbstractValidator<T>`

The same validator derives FluentValidation's `AbstractValidator<T>`; the mediator's validation pipeline behaviour
runs it before the handler (`add-pipeline-behavior`):

```csharp
public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(command => command.CustomerId).ValidId();
        RuleFor(command => command.Lines).NotEmpty();
    }
}
```

How the validators are registered follows `service-registration` § Registration Patterns.
