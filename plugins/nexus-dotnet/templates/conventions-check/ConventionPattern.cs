namespace ConventionsCheck;

public class ConventionPattern
{
    public required string Pattern { get; init; }
    public string? Flags { get; init; }
    public string? Unless { get; init; }
    public string? UnlessNext { get; init; }
    public string? NameMust { get; init; }
}
