# Create Validator

## Inputs
- Command/request type name and its properties
- Validation rules from the plan step (required fields, format constraints, business rules)
- Framework (FastEndpoints or FluentValidation standalone)

## Outputs
- FastEndpoints: `{FeatureName}CommandValidator` class co-located with the command
- Other: `{FeatureName}Validator.cs` alongside the command file

## Gate
Proceed only after: command/request type is defined and its properties are known.

## Framework Variants

### FastEndpoints: `Validator<T>`

Co-located with command. Auto-discovered by FastEndpoints. FastEndpoints validators draw their strings
from a **service-local `ValidatorsMessagesConstants`** — they do **not** call the `Blocks.Core` helpers
(`service-infra-conventions` §10 forbids reaching across the framework line):

```csharp
public class {FeatureName}CommandValidator : Validator<{FeatureName}Command>
{
    public {FeatureName}CommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidatorsMessagesConstants.NameRequired)
            .MaximumLength(64).WithMessage(ValidatorsMessagesConstants.NameTooLong);
    }
}
```

**Optional:** if the service defines a custom base validator (check service CLAUDE.md — the reference
app's Production uses a local `BaseValidator<T>`), extend it instead of `Validator<T>`.

### MediatR: `AbstractValidator<T>`

Co-located with command in the same file. Discovered via `AddValidatorsFromAssemblyContaining<T>()`, run by `ValidationBehavior`. This is the **only** path that uses the `Blocks.Core` message helpers:

```csharp
public record {FeatureName}Command : ICommand<{ResponseType}>
{
    // properties...
}

public class {FeatureName}CommandValidator : AbstractValidator<{FeatureName}Command>
{
    public {FeatureName}CommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmptyWithMessage(nameof({FeatureName}Command.Name))
            .MaximumLengthWithMessage(MaxLength.C64, nameof({FeatureName}Command.Name));
    }
}
```

## Custom Validation Extensions (MediatR path only)

**File:** `src/BuildingBlocks/Blocks.Core/FluentValidation/Extensions.cs`

Use these for consistent error messages **in the MediatR `AbstractValidator<T>` path** — never from a
FastEndpoints validator (`service-infra-conventions` §10):
- `NotEmptyWithMessage(propertyName)` — consistent "'PropertyName' must not be empty."
- `MaximumLengthWithMessage(maxLength, propertyName)` — consistent "'PropertyName' must not exceed {max} characters."

### No Blocks.Core in this service? (MediatR path fallback)

The helpers above are a reference-app convenience, not a requirement. Without the `Blocks.Core`
FluentValidation extensions, use plain FluentValidation and inline the messages — the validator still
discovers and runs identically:

```csharp
RuleFor(x => x.Name)
    .NotEmpty().WithMessage("'Name' must not be empty.")
    .MaximumLength(64);
```

If you want the shared-message consistency without adopting all of `Blocks.Core`, copy the extension
source (the `NotEmptyWithMessage` / `MaximumLengthWithMessage` methods) into the service — the full
listing lives in `service-infra-conventions` §10 (its `## 10. Validators` section).

## MaxLength Constants

**File:** `src/BuildingBlocks/Blocks.Core/MaxLength.cs`

```csharp
MaxLength.C0, C8, C16, C32, C64, C128, C256, C512, C1024, C2048
```

Use these instead of magic numbers for `HasMaxLength` (EF config) and, on the **MediatR path**,
`MaximumLengthWithMessage` (validator). Without `Blocks.Core`, use raw lengths (`MaximumLength(64)`) — the
FastEndpoints template above already does.
