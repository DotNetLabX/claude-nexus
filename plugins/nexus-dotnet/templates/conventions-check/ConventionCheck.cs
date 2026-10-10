using System.Collections.Generic;

namespace ConventionsCheck;

public class ConventionCheck
{
    public required string Id { get; init; }
    public required string Scope { get; init; }
    public required string Lang { get; init; }
    public required string Kind { get; init; }
    public required string Message { get; init; }
    public bool LibraryHalf { get; init; }
    public bool Comments { get; init; }
    public string? UnlessText { get; init; }
    public List<ConventionPattern> Patterns { get; init; } = [];
    public string? Pattern { get; init; }
    public string? Compare { get; init; }
    public string? LiteralGroup { get; init; }
    public string? ParamsMust { get; init; }
    public List<string> Groups { get; init; } = [];
    public string? Rule { get; init; }
    public string? AllowName { get; init; }
    public string? AllowBase { get; init; }
}
