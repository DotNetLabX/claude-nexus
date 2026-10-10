using System;
using System.Linq;
using System.Runtime.CompilerServices;
using Xunit;

namespace ConventionsCheck;

public class ConventionsTests
{
    private static readonly Lazy<RepositoryScan> Scan = new(() => RepositoryScan.Run(SourceFile()));

    public static TheoryData<string> CheckIds()
    {
        var ids = new TheoryData<string>();
        foreach (var check in ConventionChecks.All)
        {
            ids.Add(check.Id);
        }

        return ids;
    }

    [Fact]
    public void TheScanReadsTheRepository()
    {
        Assert.True(Scan.Value.Failure is null, Scan.Value.Failure);
    }

    [Theory]
    [MemberData(nameof(CheckIds))]
    public void TheSourceFollowsTheRule(string checkId)
    {
        var scan = Scan.Value;
        Assert.True(scan.Failure is null, "The scan did not run — see TheScanReadsTheRepository.");
        if (scan.Settings.Off.Contains(checkId))
        {
            return;
        }

        var hits = scan.Hits
            .Where(hit => hit.Check == checkId)
            .Select(hit => $"{hit.File}:{hit.Line} [{hit.Check}] {hit.Message}")
            .ToList();
        Assert.True(
            hits.Count == 0,
            $"{hits.Count} place(s) break the rule [{checkId}]:{Environment.NewLine}{string.Join(Environment.NewLine, hits)}{Environment.NewLine}" +
            $"To switch this check off, add \"{checkId}\" to \"off\" in {scan.SettingsPath}.");
    }

    private static string SourceFile([CallerFilePath] string path = "") => path;
}
