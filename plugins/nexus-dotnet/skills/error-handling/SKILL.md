---
name: error-handling
description: One family of errors, the guard helpers and throwing lookups, the validation-message helpers, and the one central error mapper that turns every error into its reply (400, 401, 404, 409, 500, and 499 on a cancelled request). Use when throwing or translating an error, adding an error type and its status, writing a guard or a not-found lookup, or choosing a validation message.
user-invocable: true
---

# Error Handling

Errors are thrown, never returned, and translated into a reply **once**, by one central mapper. Endpoints, handlers
and consumers neither catch to build a reply nor check for null by hand: a required lookup throws not-found, a
broken rule throws the domain error, and the mapper chooses the status.

## Assumes

- **ASP.NET Core** for the mapper (a middleware) and **FluentValidation** for the validation failure it maps.
- **A Domain project** (or, in a one-project repo, a `Shared` folder) as the lowest place every user of the error
  types references.
- No shared library: the error types, the guards, the message helpers and the mapper are all sampled below and
  built once under Look First.

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

## Prohibitions (load-bearing)

- **No inline null or not-found check.** Never `if (order is null) return NotFound();` and never
  `Send.NotFoundAsync` — a required lookup throws through the guard helpers, and the mapper replies 404.
- **No `try/catch` that turns an error into a reply** — in an endpoint, a handler or a consumer. The mapper is the
  only place an error becomes a reply.
- **A `catch` stands only at an I/O boundary, and only to clean up and rethrow:** an outside call, a stream or file,
  a transaction to roll back, a consumer undoing its own work so the bus delivers again. It never swallows and never
  branches on a domain error. The one other `catch` is a background job's loop, which has no mapper above it: it
  logs the failed pass and lets the next one run (`add-hosted-service`).
- **No `Result<T>` or `Either` type for errors.** Errors flow as exceptions.

## Exception Hierarchy

One family. Each type lives in the Domain project and carries a message and nothing else:

| Error | Thrown when | Reply |
|---|---|---|
| `DomainException` | a business rule is broken — its message written inline where the rule is | 400 |
| `NotFoundException` | a required lookup finds nothing (through the guard helpers) | 404 |
| `AlreadyExistsException` | a create would duplicate what exists | 409 |
| `UnauthorizedException` | sign-in code rejects a credential or token | 401 |
| A service's own error | a service-specific rule; derives `DomainException`, carries no extra data | 400 |

An optional lookup returns nothing and its caller decides; only a required one throws. Framework error types
(`InvalidOperationException`, `ArgumentException`) appear only in a shared library or a module — for a configuration
fault, in one short sentence and never `NotSupportedException`, and as the guards' own argument errors, which the
mapper turns into a 400. A service meets a configuration fault through a shared helper that throws it (the settings
binder's `GetRequiredConnectionString`, the seed-file reader, the cached-table reader); a failure at run time, an
outside system's included, is one of the family's errors.

```csharp file=DomainException.cs
public class DomainException(string message) : Exception(message);
```

```csharp file=NotFoundException.cs
public class NotFoundException(string message) : DomainException(message);
```

```csharp file=AlreadyExistsException.cs
public class AlreadyExistsException(string message) : DomainException(message);
```

```csharp file=UnauthorizedException.cs
public class UnauthorizedException(string message) : DomainException(message);
```

A broken rule's message is written where the rule is: `throw new DomainException("An order ships only once.");`.

**Adding an error type and its status** is two edits in one change: the type, and its arm in the mapper's switch
below. A type with no arm falls through to 500.

## Guard Utilities

The guards throw the family's errors. A value object's factory guards its value; a handler loads through a
throwing lookup; nothing else checks arguments (a service has no argument-checking preamble).

```csharp file=Guard.cs
using System.Runtime.CompilerServices;

public static class Guard
{
    public static T NotFound<T>(T? value, object id)
        where T : class =>
        value ?? throw new NotFoundException($"{typeof(T).Name} {id} was not found.");

    public static string ThrowIfNullOrWhiteSpace(string? value, [CallerArgumentExpression(nameof(value))] string? name = null) =>
        string.IsNullOrWhiteSpace(value) ? throw new DomainException($"{name} is required.") : value;

    public static void ThrowIfFalse(bool condition, string message)
    {
        if (!condition)
            throw new DomainException(message);
    }
}
```

```csharp file=GuardExtensions.cs
public static class GuardExtensions
{
    public static T OrThrowNotFound<T>(this T? value, object id)
        where T : class =>
        Guard.NotFound(value, id);
}
```

The throwing lookups (`…OrThrow…`) build on them — one per lookup a feature needs, never an inline check:

- `GetByIdOrThrowAsync(id, ct)` on the repository base (`persistence-patterns`);
- `GetBy{Key}Async(key, ct)` returning nothing, followed by `.OrThrowNotFound(key)` where that lookup is required;
- a read store's `…OrThrowAsync` for a read model that must exist.

```csharp
var order = await _orderRepository.GetByIdOrThrowAsync(command.OrderId, ct);
var customer = (await _customerRepository.GetByEmailAsync(command.Email, ct)).OrThrowNotFound(command.Email);
```

## Validation Messages

Validation messages come from shared message helpers or constants, never a literal per rule. The library's default
message is fine where it says enough. A small rule that no check can hold, so it is kept in review:

```csharp file=ValidationMessages.cs
public static class ValidationMessages
{
    public static readonly string Required = "'{PropertyName}' is required.";
    public static readonly string TooLong = "'{PropertyName}' must be at most {MaxLength} characters.";
    public static readonly string InvalidId = "'{PropertyName}' must be a valid id.";
}
```

```csharp file=ValidationExtensions.cs
public static class ValidationExtensions
{
    public static IRuleBuilderOptions<T, string> RequiredWithMaxLength<T>(this IRuleBuilder<T, string> rule, int maxLength) =>
        rule.NotEmpty().WithMessage(ValidationMessages.Required)
            .MaximumLength(maxLength).WithMessage(ValidationMessages.TooLong);

    public static IRuleBuilderOptions<T, int> ValidId<T>(this IRuleBuilder<T, int> rule) =>
        rule.GreaterThan(0).WithMessage(ValidationMessages.InvalidId);
}
```

Both endpoint styles use the same helpers: FastEndpoints' `Validator<T>` derives FluentValidation's
`AbstractValidator<T>`.

## Global Exception Middleware

One central mapper turns every error into its reply. It is registered early in the pipeline
(`service-registration` § Program.cs Structure (self-hosted service)), it is one of the few classes that log, and it
is the only place a status is chosen for an error — a new status (409 for "already exists") is added here once,
never written in an endpoint.

```csharp file=GlobalExceptionMiddleware.cs
using FluentValidation;

public class GlobalExceptionMiddleware(RequestDelegate _next, ILogger<GlobalExceptionMiddleware> _logger, IHostEnvironment _environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            context.Response.StatusCode = StatusCodes.Status499ClientClosedRequest;
        }
        catch (Exception exception)
        {
            await WriteErrorAsync(context, exception);
        }
    }

    private async Task WriteErrorAsync(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            ValidationException => StatusCodes.Status400BadRequest,
            NotFoundException => StatusCodes.Status404NotFound,
            AlreadyExistsException => StatusCodes.Status409Conflict,
            UnauthorizedException => StatusCodes.Status401Unauthorized,
            DomainException => StatusCodes.Status400BadRequest,
            ArgumentException => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        var unexpected = statusCode == StatusCodes.Status500InternalServerError;
        if (unexpected)
            _logger.LogError(exception, "Request {Path} failed", context.Request.Path);

        var message = unexpected && !_environment.IsDevelopment() ? "An unexpected error occurred." : exception.Message;
        var errors = exception is ValidationException validation
            ? validation.Errors.Select(error => new ValidationError(error.PropertyName, error.ErrorMessage)).ToList()
            : null;

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new ErrorResponse(statusCode, message, context.TraceIdentifier, errors), context.RequestAborted);
    }
}
```

```csharp file=ErrorResponse.cs
public record ErrorResponse(int StatusCode, string Message, string TraceId, List<ValidationError>? Errors);
```

```csharp file=ValidationError.cs
public record ValidationError(string PropertyName, string ErrorMessage);
```

The arms run most-derived first: `NotFoundException` and its siblings derive `DomainException`, so the domain arm
comes after them. A FastEndpoints service replies to a validation failure itself, before its endpoint runs; the
mediator style throws `ValidationException` from its validation behaviour, and the mapper replies 400 with the
errors.

## What this skill does NOT do

- **Validation itself** — the validators are `create-feature`'s (`../create-feature/workflows/Validator.md`).
- **The repository's throwing lookups** — `persistence-patterns` carries the base class.
- **Request logging** — the request-diagnostics middleware or pipeline behaviour (`add-pipeline-behavior`).
