using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace ConventionsCheck;

public class TopLevelTypeReader
{
    private const string Modifiers = @"(?:(?:public|internal|private|protected|static|sealed|abstract|partial|readonly|ref|file|unsafe|new)\s+)*";
    private const string Name = @"[\p{L}_]\w*";

    private static readonly Regex TypeLine = new(@"^\s*" + Modifiers + @"(?<keyword>class|interface|enum|struct|record)(?:\s+(?:class|struct))?\s+(?<name>" + Name + ")");
    private static readonly Regex DelegateLine = new(@"^\s*" + Modifiers + @"delegate\s+.+?\s+(?<name>" + Name + @")\s*(?:<[^>]*>)?\s*\(");
    private static readonly Regex NamespaceLine = new(@"^\s*namespace\s+[\w.]+\s*(?:\{|$)");

    public List<TypeDeclaration> Read(string[] codeLines)
    {
        var types = new List<TypeDeclaration>();
        var braces = new Stack<bool>();
        var namespacePending = false;
        for (var i = 0; i < codeLines.Length; i++)
        {
            var line = codeLines[i];
            if (braces.All(isNamespace => isNamespace))
            {
                var declaredDelegate = DelegateLine.Match(line);
                var declaredType = declaredDelegate.Success ? Match.Empty : TypeLine.Match(line);
                if (declaredDelegate.Success)
                {
                    types.Add(new TypeDeclaration("delegate", declaredDelegate.Groups["name"].Value, i + 1));
                }
                else if (declaredType.Success)
                {
                    types.Add(new TypeDeclaration(declaredType.Groups["keyword"].Value, declaredType.Groups["name"].Value, i + 1));
                }
            }

            if (NamespaceLine.IsMatch(line))
            {
                namespacePending = true;
            }

            foreach (var character in line)
            {
                if (character == '{')
                {
                    braces.Push(namespacePending);
                    namespacePending = false;
                }
                else if (character == '}' && braces.Count > 0)
                {
                    braces.Pop();
                }
            }
        }

        return types;
    }
}
