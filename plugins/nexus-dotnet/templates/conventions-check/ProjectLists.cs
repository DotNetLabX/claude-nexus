using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace ConventionsCheck;

public class ProjectLists
{
    private static readonly (string Section, string[] Header)[] Sections =
    [
        ("Helpers", ["Pattern", "Helper", "Where"]),
        ("Logging classes", ["Class", "Reason"]),
        ("Shared-state caches", ["Class", "Reason"]),
        ("Run-time settings", ["Settings class", "Reason"]),
    ];

    public required Dictionary<string, List<string[]>> Tables { get; init; }

    public List<string> LoggingClasses => Tables["Logging classes"].Select(row => row[0]).ToList();

    public static ProjectLists Read(string path)
    {
        if (!File.Exists(path))
        {
            throw new InvalidOperationException($"The lists file is missing: {path}. Copy the plugin's project-lists.md there once, or name another path in listsFile.");
        }

        var lines = File.ReadAllText(path).Replace("\r\n", "\n").Split('\n');
        var tables = new Dictionary<string, List<string[]>>();
        foreach (var (section, header) in Sections)
        {
            tables[section] = ReadTable(lines, section, header, path);
        }

        return new ProjectLists { Tables = tables };
    }

    private static List<string[]> ReadTable(string[] lines, string section, string[] header, string path)
    {
        var start = Array.FindIndex(lines, line => line.TrimEnd() == $"## {section}");
        if (start < 0)
        {
            throw Unreadable(path, $"it has no section \"## {section}\"");
        }

        var headerLine = start + 1;
        while (headerLine < lines.Length && !lines[headerLine].TrimStart().StartsWith('|') && !lines[headerLine].StartsWith("## ", StringComparison.Ordinal))
        {
            headerLine++;
        }

        if (headerLine >= lines.Length || !Cells(lines[headerLine]).SequenceEqual(header))
        {
            throw Unreadable(path, $"the table under \"## {section}\" must start with the header | {string.Join(" | ", header)} |");
        }

        if (headerLine + 1 >= lines.Length || !Cells(lines[headerLine + 1]).All(IsSeparator))
        {
            throw Unreadable(path, $"the header of the table under \"## {section}\" must be followed by its |---| separator row");
        }

        var rows = new List<string[]>();
        for (var i = headerLine + 2; i < lines.Length && lines[i].TrimStart().StartsWith('|'); i++)
        {
            rows.Add(Cells(lines[i]).Select(cell => cell.Trim('`')).ToArray());
        }

        return rows;
    }

    private static string[] Cells(string line) =>
        line.Trim().Trim('|').Split('|').Select(cell => cell.Trim()).ToArray();

    private static bool IsSeparator(string cell) =>
        cell.Trim(':').Length > 0 && cell.Trim(':').All(character => character == '-');

    private static InvalidOperationException Unreadable(string path, string reason) =>
        new($"The lists file is unreadable: {path} — {reason}.");
}
