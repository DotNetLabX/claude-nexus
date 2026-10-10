using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace ConventionsCheck;

public class ConventionScanner(IReadOnlyCollection<string> _loggingClasses)
{
    private const char ByteOrderMark = (char)0xFEFF;

    private const string Name = @"[\p{L}_]\w*";

    private static readonly Regex AttributeLine = new(@"^\s*\[");
    private static readonly Regex ClassWord = new(@"\bclass\b");
    private static readonly Regex LoggerOwner = new(@"\bILogger<\s*(" + Name + @")\s*>");
    private static readonly Regex Attributes = new(@"\[[^\]]*\]");
    private static readonly Regex DefaultValue = new(@"=[\s\S]*$");
    private static readonly Regex ParameterTail = new(@"(" + Name + @")\s*$");
    private static readonly Regex CommandOrQueryFile = new(@"(?:Command|Query)\.cs$");
    private static readonly Regex ModelsFile = new(@"(?:^|[\\/])Models\.cs$");
    private static readonly Regex InterfaceName = new(@"^I\p{Lu}");

    private readonly Dictionary<string, Regex> _patterns = [];
    private readonly TopLevelTypeReader _typeReader = new();

    public List<ConventionHit> Scan(string content, string file, string lang, bool library)
    {
        var text = content.Replace("\r\n", "\n");
        var csharp = lang == "cs" ? new CSharpText(text) : null;
        var fileName = Path.GetFileName(file);
        var hits = new List<ConventionHit>();
        foreach (var check in ConventionChecks.All)
        {
            if (library && check.LibraryHalf)
            {
                continue;
            }

            if (check.Lang != "both" && check.Lang != lang)
            {
                continue;
            }

            var view = csharp is null || check.Kind == "bom"
                ? text
                : check.Comments ? csharp.WithComments : csharp.CodeOnly;
            foreach (var line in Run(check, view.Split('\n'), view, text, fileName))
            {
                hits.Add(new ConventionHit(check.Id, file, line, check.Message));
            }
        }

        return hits;
    }

    private IEnumerable<int> Run(ConventionCheck check, string[] lines, string text, string source, string fileName) => check.Kind switch
    {
        "line" => LineHits(check, lines, text),
        "text" => TextHits(check, text, source),
        "order" => OrderHits(check, lines),
        "bom" => text.Length > 0 && text[0] == ByteOrderMark ? new[] { 1 } : Array.Empty<int>(),
        "types" => TypeHits(check, lines, fileName),
        _ => throw new InvalidOperationException($"The check {check.Id} has a kind this file does not read: {check.Kind}."),
    };

    private List<int> LineHits(ConventionCheck check, string[] lines, string text)
    {
        var hits = new List<int>();
        if (check.UnlessText is not null && Pattern(check.UnlessText, null).IsMatch(text))
        {
            return hits;
        }

        for (var i = 0; i < lines.Length; i++)
        {
            foreach (var pattern in check.Patterns)
            {
                var match = Pattern(pattern.Pattern, pattern.Flags).Match(lines[i]);
                if (!match.Success)
                {
                    continue;
                }

                if (pattern.Unless is not null && Pattern(pattern.Unless, pattern.Flags).IsMatch(lines[i]))
                {
                    continue;
                }

                if (pattern.UnlessNext is not null && Pattern(pattern.UnlessNext, null).IsMatch(NextNonBlank(lines, i)))
                {
                    continue;
                }

                var name = match.Groups["name"];
                if (pattern.NameMust is not null && name.Success && Pattern(pattern.NameMust, null).IsMatch(name.Value))
                {
                    continue;
                }

                hits.Add(i + 1);
                break;
            }
        }

        return hits;
    }

    private List<int> TextHits(ConventionCheck check, string text, string source)
    {
        var hits = new List<int>();
        foreach (Match match in Pattern(check.Pattern!, "m").Matches(text))
        {
            string Value(string name)
            {
                var group = match.Groups[name];
                return name == check.LiteralGroup ? source.Substring(group.Index, group.Length) : group.Value;
            }

            if (check.Compare == "camelEqual" && Value("json") != Camel(Value("name")))
            {
                continue;
            }

            if (check.ParamsMust is not null)
            {
                var must = Pattern(check.ParamsMust, null);
                var names = SplitTopLevel(match.Groups["params"].Value).Select(ParameterName).Where(name => name.Length > 0);
                if (names.All(must.IsMatch))
                {
                    continue;
                }
            }

            hits.Add(text[..match.Index].Count(character => character == '\n') + 1);
        }

        return hits;
    }

    private List<int> OrderHits(ConventionCheck check, string[] lines)
    {
        var groups = check.Groups.Select(group => Pattern(group, null)).ToList();
        var hits = new List<int>();
        var i = 0;
        while (i < lines.Length)
        {
            if (!AttributeLine.IsMatch(lines[i]))
            {
                i++;
                continue;
            }

            var start = i;
            while (i < lines.Length && AttributeLine.IsMatch(lines[i]))
            {
                i++;
            }

            if (i >= lines.Length || !ClassWord.IsMatch(lines[i]))
            {
                continue;
            }

            var highest = -1;
            for (var j = start; j < i; j++)
            {
                var rank = groups.FindIndex(group => group.IsMatch(lines[j]));
                if (rank < 0)
                {
                    continue;
                }

                if (rank < highest)
                {
                    hits.Add(j + 1);
                    break;
                }

                highest = rank;
            }
        }

        return hits;
    }

    private List<int> TypeHits(ConventionCheck check, string[] lines, string fileName)
    {
        var types = _typeReader.Read(lines);
        return check.Rule switch
        {
            "one-per-file" => OnePerFile(types, lines, fileName),
            "endpoint-layout" => EndpointLayout(types, fileName),
            _ => LoggingHits(check, lines, types),
        };
    }

    private static List<int> OnePerFile(List<TypeDeclaration> types, string[] lines, string fileName)
    {
        if (types.Count <= 1 || CommandOrQueryFile.IsMatch(fileName) || ModelsFile.IsMatch(fileName))
        {
            return [];
        }

        var others = types.Where(type => type.Kind != "delegate").ToList();
        if (others.Count == 1 && others[0].Kind == "interface")
        {
            return [];
        }

        return IsContractFamily(types, lines, fileName) ? [] : [types[1].Line];
    }

    private static bool IsContractFamily(List<TypeDeclaration> types, string[] lines, string fileName)
    {
        var at = types.FindIndex(type => type.Kind == "interface");
        if (at < 0 || types[at].Name != Path.GetFileNameWithoutExtension(fileName) || !InterfaceName.IsMatch(types[at].Name))
        {
            return false;
        }

        var contract = types[at].Name;
        var shapes = types.Select((type, index) => (type, text: TypeText(lines, types, index))).Where((_, index) => index != at).ToList();
        if (shapes.Any(shape => shape.type.Kind is not ("record" or "enum") || Names(shape.text, contract)))
        {
            return false;
        }

        var reached = new List<string> { TypeText(lines, types, at) };
        var found = true;
        while (found)
        {
            found = false;
            foreach (var shape in shapes.ToList())
            {
                if (!reached.Any(text => Names(text, shape.type.Name)))
                {
                    continue;
                }

                reached.Add(shape.text);
                shapes.Remove(shape);
                found = true;
            }
        }

        return shapes.Count == 0;
    }

    private static string TypeText(string[] lines, List<TypeDeclaration> types, int index)
    {
        var end = index + 1 < types.Count ? types[index + 1].Line - 1 : lines.Length;
        return string.Join('\n', lines[(types[index].Line - 1)..end]);
    }

    private static bool Names(string text, string name) => Regex.IsMatch(text, @"\b" + Regex.Escape(name) + @"\b");

    private static List<int> EndpointLayout(List<TypeDeclaration> types, string fileName)
    {
        var baseName = Path.GetFileNameWithoutExtension(fileName);
        if (baseName.EndsWith("Endpoint", StringComparison.Ordinal))
        {
            return types.Count > 1 ? [types[1].Line] : [];
        }

        if (!baseName.EndsWith("Command", StringComparison.Ordinal) && !baseName.EndsWith("Query", StringComparison.Ordinal))
        {
            return [];
        }

        if (types.Count > 0 && types.All(type => type.Kind == "interface"))
        {
            return [];
        }

        if (!types.Any(type => type.Name == baseName))
        {
            return [types.Count > 0 ? types[0].Line : 1];
        }

        var validators = types.Where(type => type.Name.EndsWith("Validator", StringComparison.Ordinal)).ToList();
        var stray = validators.FirstOrDefault(type => type.Name != baseName + "Validator");
        if (stray is not null)
        {
            return [stray.Line];
        }

        return validators.Count > 0 ? [] : [types[0].Line];
    }

    private List<int> LoggingHits(ConventionCheck check, string[] lines, List<TypeDeclaration> types)
    {
        var allowName = Pattern(check.AllowName!, null);
        var allowBase = Pattern(check.AllowBase!, null);
        var hits = new List<int>();
        for (var i = 0; i < lines.Length; i++)
        {
            foreach (Match match in LoggerOwner.Matches(lines[i]))
            {
                var owner = match.Groups[1].Value;
                if (_loggingClasses.Contains(owner) || allowName.IsMatch(owner))
                {
                    continue;
                }

                var declared = types.FirstOrDefault(type => type.Name == owner);
                if (declared is not null && allowBase.IsMatch(DeclarationText(lines, declared)))
                {
                    continue;
                }

                hits.Add(i + 1);
                break;
            }
        }

        return hits;
    }

    private static string DeclarationText(string[] lines, TypeDeclaration type)
    {
        var text = new StringBuilder();
        for (var i = type.Line - 1; i < Math.Min(lines.Length, type.Line + 4); i++)
        {
            text.Append(lines[i]).Append(' ');
            if (lines[i].Contains('{'))
            {
                break;
            }
        }

        return text.ToString();
    }

    private static string NextNonBlank(string[] lines, int index)
    {
        for (var i = index + 1; i < lines.Length; i++)
        {
            if (lines[i].Trim().Length > 0)
            {
                return lines[i];
            }
        }

        return "";
    }

    private static List<string> SplitTopLevel(string list)
    {
        var parts = new List<string>();
        var depth = 0;
        var current = new StringBuilder();
        foreach (var character in list)
        {
            if (character is '<' or '[')
            {
                depth++;
            }

            if (character is '>' or ']')
            {
                depth--;
            }

            if (character == ',' && depth == 0)
            {
                parts.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(character);
            }
        }

        if (current.ToString().Trim().Length > 0)
        {
            parts.Add(current.ToString());
        }

        return parts;
    }

    private static string ParameterName(string parameter)
    {
        var bare = DefaultValue.Replace(Attributes.Replace(parameter, ""), "").Trim();
        var tail = ParameterTail.Match(bare);
        return tail.Success ? tail.Groups[1].Value : "";
    }

    private static string Camel(string name) => name.Length == 0 ? name : char.ToLowerInvariant(name[0]) + name[1..];

    private Regex Pattern(string pattern, string? flags)
    {
        var key = $"{flags}\u0001{pattern}";
        if (_patterns.TryGetValue(key, out var compiled))
        {
            return compiled;
        }

        var options = RegexOptions.CultureInvariant;
        if (flags?.Contains('i') == true)
        {
            options |= RegexOptions.IgnoreCase;
        }

        if (flags?.Contains('m') == true)
        {
            options |= RegexOptions.Multiline;
        }

        compiled = new Regex(pattern, options);
        _patterns[key] = compiled;
        return compiled;
    }
}
