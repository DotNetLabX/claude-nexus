---
name: extract-endpoint-types
description: A repair recipe for endpoint files written before the endpoint split was mandatory — moves the request, its reply, its DTOs and its validator out of the endpoint file into the operation's command or query file, leaving the endpoint file with the endpoint class alone. Use when an existing endpoint file holds more than the endpoint class, or a review or the convention check flags the endpoint file layout. New endpoints are written split from the start with create-feature.
---

# Extract Endpoint Types

Every endpoint is written split from the start: the endpoint class alone in `{Operation}Endpoint.cs`, the request,
its reply and its validator in `{Operation}Command.cs` or `{Operation}Query.cs` (`create-feature`). This recipe
repairs a file written before that rule, in either endpoint style.

## Assumes

- **An existing feature folder** — `Features/{Area}/{Operation}/` — whose endpoint file holds more than the endpoint
  class.
- **The service's one endpoint framework** — FastEndpoints, or a mediator with minimal or Carter endpoints — as its
  `CLAUDE.md` names it. The repair is the same in both: only the file the types move into differs in project.
- No shared library: the recipe moves types and renames them; it builds nothing.

## When to Use

- An existing `{Operation}Endpoint.cs` declares a request, a reply, a DTO or a validator beside the endpoint class.
- The convention check or a review reports the endpoint file layout for a file.
- A validator sits in a file of its own instead of beside its request.

Never as a step of a new feature: `create-feature` writes the split form directly.

## Steps

1. **Classify the operation** — a write takes `{Operation}Command.cs`, a read `{Operation}Query.cs`. Rename a
   request that does not follow the names (`{Operation}Command`, `{Operation}Query`, `{Operation}Response`) in the
   same pass, with every reference.
2. **Create the command or query file** in the same folder and namespace.
3. **Move into it:** the request record, its reply record, and the request's validator, renamed
   `{Request}Validator` where it is named otherwise.
4. **A DTO the reply uses** gets its own file — in the operation's folder when only this reply uses it, in the
   area's `_Shared` folder when another reply does too.
5. **Keep in the endpoint file** only the endpoint class and the `using` lines it needs; move the rest of the
   `using` lines with the types that need them.
6. **Build** — `dotnet build` — and run the convention check where the repo has adopted it
   (`add-conventions-check`).

## File Layout After

```text
Features/{Area}/{Operation}/
├── {Operation}Endpoint.cs     the endpoint class only
├── {Operation}Command.cs      the request, its reply and its validator — or {Operation}Query.cs
└── {Thing}Dto.cs              a DTO only this reply uses, where there is one
```

## What This Skill Does NOT Do

- Create an endpoint — use `create-feature`.
- Introduce a mediator, or move the endpoint's logic out of it.
- Move logic several endpoints share — that is a base endpoint (`create-feature` § Shared Base Endpoint).
