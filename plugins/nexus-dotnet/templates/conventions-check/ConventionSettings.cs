using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ConventionsCheck;

public class ConventionSettings
{
    public const string FileName = "conventions-check.json";

    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
    };

    public List<string> Off { get; init; } = [];
    public List<string> Roots { get; init; } = [];
    public List<string> LibraryRoots { get; init; } = [];
    public string ListsFile { get; init; } = "docs/conventions/project-lists.md";

    public static ConventionSettings Read(string path) =>
        File.Exists(path) ? JsonSerializer.Deserialize<ConventionSettings>(File.ReadAllText(path), Options) ?? new() : new();
}
