using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace ConventionsCheck;

public class RepositoryScan
{
    private static readonly string[] SkippedFolders = ["bin", "obj", ".git", ".vs", "node_modules", "TestResults"];
    private static readonly string[] ProjectExtensions = [".csproj", ".props", ".targets"];
    private static readonly Regex SolutionProject = new(@"Project\(""\{[^}]+\}""\)\s*=\s*""[^""]*"",\s*""([^""]+\.csproj)""");
    private static readonly Regex SolutionXmlProject = new(@"<Project\s+Path=""([^""]+\.csproj)""");
    private static readonly string[] SharedBuildFiles = ["Directory.Packages.props", "Directory.Build.props", "Directory.Build.targets"];
    private static readonly Regex GeneratedFile = new(@"\.(?:g|g\.i|designer)\.cs$", RegexOptions.IgnoreCase);
    private static readonly StringComparison PathComparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
    private static readonly StringComparer PathComparer = StringComparer.FromComparison(PathComparison);

    public string? Failure { get; private init; }
    public string SettingsPath { get; private init; } = ConventionSettings.FileName;
    public string ListsPath { get; private init; } = "";
    public ConventionSettings Settings { get; private init; } = new();
    public List<ConventionHit> Hits { get; private init; } = [];

    public static RepositoryScan Run(string callerFile)
    {
        var fromSource = Path.GetDirectoryName(callerFile) ?? "";
        var projectFolder = File.Exists(callerFile) ? ProjectFolderFrom(fromSource) : null;
        projectFolder ??= ProjectFolderFrom(AppContext.BaseDirectory);
        if (projectFolder is null)
        {
            return Failed(ConventionSettings.FileName, $"the check found no project folder above {fromSource} or above {AppContext.BaseDirectory}");
        }

        var settingsPath = Path.Combine(projectFolder, ConventionSettings.FileName);
        try
        {
            var settings = ConventionSettings.Read(settingsPath);
            var unknown = settings.Off.Where(id => ConventionChecks.All.All(check => check.Id != id)).ToList();
            if (unknown.Count > 0)
            {
                return Failed(settingsPath, $"it switches off checks that do not exist: {string.Join(", ", unknown)}");
            }

            var repositoryRoot = RepositoryRoot(projectFolder);
            if (repositoryRoot is null)
            {
                return Failed(settingsPath, $"the check found no .git and no solution file above {projectFolder}");
            }

            var listsPath = InRepository(repositoryRoot, settings.ListsFile);
            var lists = ProjectLists.Read(listsPath);
            var files = SourceFiles(repositoryRoot, settings, projectFolder);
            if (files.Count == 0)
            {
                return Failed(settingsPath, $"the scan found no source file under {repositoryRoot} (its own project at {projectFolder} is never scanned)");
            }

            var libraryRoots = settings.LibraryRoots.Select(root => InRepository(repositoryRoot, root)).ToList();
            var scanner = new ConventionScanner(lists);
            var hits = files
                .SelectMany(file => scanner.Scan(
                    Encoding.UTF8.GetString(File.ReadAllBytes(file)),
                    InRepositoryName(repositoryRoot, file),
                    file.EndsWith(".cs", StringComparison.Ordinal) ? "cs" : "project",
                    libraryRoots.Any(root => IsUnder(file, root))))
                .ToList();
            if (settings.Report is not null)
            {
                var reportPath = InRepository(repositoryRoot, settings.Report);
                var failure = WriteReport(reportPath, repositoryRoot, settings, files, hits);
                if (failure is not null)
                {
                    return Failed(settingsPath, $"the report could not be written to {reportPath}: {failure}");
                }
            }

            return new RepositoryScan
            {
                SettingsPath = settingsPath,
                ListsPath = IsUnder(listsPath, repositoryRoot) ? InRepositoryName(repositoryRoot, listsPath) : listsPath,
                Settings = settings,
                Hits = hits,
            };
        }
        catch (Exception problem) when (problem is InvalidOperationException or System.Text.Json.JsonException or IOException or UnauthorizedAccessException or ArgumentException)
        {
            return Failed(settingsPath, problem.Message);
        }
    }

    private static RepositoryScan Failed(string settingsPath, string reason) =>
        new() { SettingsPath = settingsPath, Failure = $"The convention check could not run: {reason.TrimEnd('.')}. Settings: {settingsPath}." };

    private static string? WriteReport(string reportPath, string repositoryRoot, ConventionSettings settings, List<string> files, List<ConventionHit> hits)
    {
        try
        {
            var withFindings = hits.Select(hit => hit.File).ToHashSet(StringComparer.Ordinal);
            var projectOfFolder = new Dictionary<string, string>(PathComparer);
            var projects = files
                .Select(file => (Name: InRepositoryName(repositoryRoot, file), Folder: Path.GetDirectoryName(file)!))
                .Where(file => withFindings.Contains(file.Name))
                .ToDictionary(file => file.Name, file => ProjectOf(file.Folder, repositoryRoot, projectOfFolder));
            var text = ConventionReport.Render(ConventionChecks.All, settings.Off, hits, projects);
            var folder = Path.GetDirectoryName(reportPath);
            if (!string.IsNullOrEmpty(folder))
            {
                Directory.CreateDirectory(folder);
            }

            File.WriteAllText(reportPath, text, new UTF8Encoding(false));
            return null;
        }
        catch (Exception problem) when (problem is IOException or UnauthorizedAccessException or ArgumentException or NotSupportedException)
        {
            return problem.Message;
        }
    }

    private static string ProjectOf(string start, string repositoryRoot, Dictionary<string, string> known)
    {
        var visited = new List<string>();
        var project = ConventionReport.NoProject;
        for (var folder = new DirectoryInfo(start); folder is not null; folder = folder.Parent)
        {
            if (known.TryGetValue(folder.FullName, out var found))
            {
                project = found;
                break;
            }

            visited.Add(folder.FullName);
            if (folder.Exists && folder.EnumerateFiles("*.csproj").Any())
            {
                project = InRepositoryName(repositoryRoot, folder.FullName);
                break;
            }

            if (PathComparer.Equals(folder.FullName.TrimEnd('/', '\\'), repositoryRoot.TrimEnd('/', '\\')))
            {
                break;
            }
        }

        foreach (var folder in visited)
        {
            known[folder] = project;
        }

        return project;
    }

    private static string InRepositoryName(string repositoryRoot, string path) =>
        Path.GetRelativePath(repositoryRoot, path).Replace('\\', '/');

    private static string? ProjectFolderFrom(string start)
    {
        for (var folder = new DirectoryInfo(start); folder is not null; folder = folder.Parent)
        {
            if (folder.Exists && folder.EnumerateFiles("*.csproj").Any())
            {
                return folder.FullName;
            }
        }

        return null;
    }

    private static string? RepositoryRoot(string projectFolder)
    {
        for (var folder = new DirectoryInfo(projectFolder); folder is not null; folder = folder.Parent)
        {
            var marker = Path.Combine(folder.FullName, ".git");
            if (Directory.Exists(marker) || File.Exists(marker))
            {
                return folder.FullName;
            }
        }

        for (var folder = new DirectoryInfo(projectFolder); folder is not null; folder = folder.Parent)
        {
            if (Solutions(folder.FullName).Any())
            {
                return folder.FullName;
            }
        }

        return null;
    }

    private static IEnumerable<string> Solutions(string folder) =>
        Directory.EnumerateFiles(folder, "*.sln").Concat(Directory.EnumerateFiles(folder, "*.slnx"));

    private static List<string> SourceFiles(string repositoryRoot, ConventionSettings settings, string projectFolder)
    {
        var roots = settings.Roots.Count > 0
            ? settings.Roots.Select(root => InRepository(repositoryRoot, root)).ToList()
            : SolutionRoots(repositoryRoot);
        if (roots.Count == 0)
        {
            roots = Directory.EnumerateFiles(repositoryRoot, "*.csproj", SearchOption.AllDirectories)
                .Where(file => !IsSkipped(repositoryRoot, file))
                .Select(file => Path.GetDirectoryName(file)!)
                .ToList();
        }

        var files = new SortedSet<string>(PathComparer);
        foreach (var folder in roots.Append(repositoryRoot).SelectMany(root => FoldersUpTo(root, repositoryRoot)))
        {
            foreach (var name in SharedBuildFiles)
            {
                var shared = Path.Combine(folder, name);
                if (File.Exists(shared))
                {
                    files.Add(shared);
                }
            }
        }

        foreach (var root in roots.Where(Directory.Exists))
        {
            foreach (var file in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories))
            {
                if (IsSource(file) && !IsSkipped(repositoryRoot, file) && !IsGenerated(file))
                {
                    files.Add(file);
                }
            }
        }

        files.RemoveWhere(file => IsUnder(file, projectFolder));
        return files.ToList();
    }

    private static List<string> SolutionRoots(string repositoryRoot) =>
        Solutions(repositoryRoot)
            .SelectMany(solution => SolutionProject.Matches(File.ReadAllText(solution))
                .Concat(SolutionXmlProject.Matches(File.ReadAllText(solution))))
            .Select(match => Path.GetDirectoryName(InRepository(repositoryRoot, match.Groups[1].Value.Replace('\\', '/')))!)
            .Distinct(PathComparer)
            .ToList();

    private static IEnumerable<string> FoldersUpTo(string start, string repositoryRoot)
    {
        for (var folder = new DirectoryInfo(start); folder is not null; folder = folder.Parent)
        {
            if (!PathComparer.Equals(folder.FullName.TrimEnd('/', '\\'), repositoryRoot.TrimEnd('/', '\\')) && !IsUnder(folder.FullName, repositoryRoot))
            {
                yield break;
            }

            yield return folder.FullName;
        }
    }

    private static bool IsSource(string file) =>
        file.EndsWith(".cs", StringComparison.Ordinal) || ProjectExtensions.Any(extension => file.EndsWith(extension, StringComparison.Ordinal));

    private static bool IsSkipped(string repositoryRoot, string file) =>
        Path.GetRelativePath(repositoryRoot, file).Split('/', '\\').SkipLast(1).Any(segment => SkippedFolders.Contains(segment));

    private static bool IsGenerated(string file)
    {
        if (GeneratedFile.IsMatch(file))
        {
            return true;
        }

        using var reader = new StreamReader(file);
        var head = new char[512];
        var read = reader.Read(head, 0, head.Length);
        return new string(head, 0, read).Contains("<auto-generated", StringComparison.Ordinal);
    }

    private static string InRepository(string repositoryRoot, string path) =>
        Path.GetFullPath(Path.Combine(repositoryRoot, path));

    private static bool IsUnder(string file, string folder) =>
        file.StartsWith(folder.TrimEnd('/', '\\') + Path.DirectorySeparatorChar, PathComparison);
}
