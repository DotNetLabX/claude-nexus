---
name: diagnose-dotnet
description: "The .NET adapter for the diagnose skill's Phase-1 feedback-loop menu — the concrete .NET / ASP.NET Core / EF Core tool per menu item: a .http request file, a throwaway console Program.cs, Invoke-WebRequest or curl, EF Core EnableSensitiveDataLogging() plus SQL logging, an xUnit failing test, a ws client. Use when diagnosing a bug in a .NET service alongside nexus:diagnose."
user-invocable: true
---

# Diagnose — .NET adapter

The **stack adapter** for `diagnose` (the nexus core method). The method owns the phases, the gates, the hypothesis grammar, and the escalation rules; this skill fills in only which concrete .NET tool serves each item of its Phase-1 feedback-loop menu. Read `diagnose` first — it is the method of record.

## Assumes

- **ASP.NET Core** for the HTTP items (2, 4), and the SignalR / WebSocket stack for item 7.
- **EF Core** for item 6's query trace, with a `DbContext` you can configure at composition time.
- **xUnit** (v3 where the repo is current) plus `dotnet test` for item 1; the .NET SDK's `dotnet new console` for item 3.
- **No shared library** — every fill below is a stock .NET SDK or first-party package facility, so no house framework is presumed.
- **Without one of these, adapt by substituting the framework-native equivalent** — e.g. on Dapper or raw ADO.NET instead of EF Core, log the command text from a `DbCommand` interceptor rather than through `EnableSensitiveDataLogging()`. The method's menu item is unchanged; only the tool moves.

## Menu item → .NET tool

| Phase-1 item | .NET fill |
|---|---|
| 1. Failing test | an xUnit `[Fact]` in the service's test project, run with `dotnet test` — no test project yet? `mine-verify-cover-dotnet` (needs `nexus-miner`) scaffolds a self-contained one |
| 2. Saved request file | a checked-in `.http` file beside the endpoint (Visual Studio and Rider run it natively; VS Code needs the REST Client extension) |
| 3. Throwaway harness | a scratch `dotnet new console` project whose `Program.cs` calls the suspect type directly |
| 4. Manual HTTP request | `Invoke-WebRequest` in PowerShell, or `curl` — capture expected vs actual status and body |
| 6. ORM / SQL query trace | `EnableSensitiveDataLogging()` plus `LogTo(Console.WriteLine, LogLevel.Information)` on the `DbContext`, to read the generated SQL with its parameter values |
| 7. WebSocket/realtime test | a SignalR client (`HubConnectionBuilder`) or a raw `ClientWebSocket` — trigger the event, observe the payload |

The remaining items — frontend repro, `git bisect`, differential, and manual HITL — need no .NET fill; the method already states them in stack-neutral terms.

**Tag the item-6 configuration, or cleanup will miss it.** `EnableSensitiveDataLogging()` logs parameter values, which is precisely why it is a diagnostic and not a setting — but it carries no marker of its own, so the method's Phase 6 cleanup grep (which searches for `[DEBUG-{prefix}]`) is structurally blind to it. Put the run's tag in a trailing comment when you add the line — `// [DEBUG-a4f2] remove after diagnosis` — and the existing Phase 6 grep sweeps it up with everything else.

## What This Skill Does NOT Do

- Restate the `diagnose` phases, gates, or circuit-breaker rules — that skill owns the method; this one only names the .NET tool per menu item.
