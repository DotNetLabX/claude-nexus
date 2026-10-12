using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ConventionsCheck;

public class ConventionReport
{
    public const string NoProject = "(no project)";

    public static string Render(
        IReadOnlyList<ConventionCheck> checks,
        IReadOnlyCollection<string> off,
        IReadOnlyList<ConventionHit> hits,
        IReadOnlyDictionary<string, string> projects)
    {
        var order = checks.Select((check, index) => (check.Id, index)).ToDictionary(entry => entry.Id, entry => entry.index);
        var text = new StringBuilder();
        text.Append("# Convention check report\n\n");

        text.Append("## Findings per check\n\n| Check | Findings |\n|-------|----------|\n");
        foreach (var check in checks)
        {
            var count = hits.Count(hit => hit.Check == check.Id);
            var mark = off.Contains(check.Id) ? " (off)" : "";
            text.Append($"| {check.Id} | {count}{mark} |\n");
        }

        text.Append("\n## Findings per project\n\n| Project | Check | Findings |\n|---------|-------|----------|\n");
        var perProject = hits
            .GroupBy(hit => (Project: projects.GetValueOrDefault(hit.File, NoProject), hit.Check))
            .OrderBy(group => group.Key.Project, StringComparer.Ordinal)
            .ThenBy(group => order[group.Key.Check]);
        foreach (var group in perProject)
        {
            text.Append($"| {group.Key.Project} | {group.Key.Check} | {group.Count()} |\n");
        }

        text.Append("\n## Every finding\n\n");
        var ordered = hits
            .OrderBy(hit => order[hit.Check])
            .ThenBy(hit => hit.File, StringComparer.Ordinal)
            .ThenBy(hit => hit.Line);
        foreach (var hit in ordered)
        {
            text.Append($"- {hit.Check} · {hit.File} · {hit.Line}\n");
        }

        return text.ToString();
    }
}
