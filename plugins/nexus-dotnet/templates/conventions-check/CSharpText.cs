using System;
using System.Linq;

namespace ConventionsCheck;

public class CSharpText
{
    private const byte Code = 0;
    private const byte Comment = 1;
    private const byte Literal = 2;

    private readonly string _text;
    private readonly byte[] _kinds;

    public CSharpText(string text)
    {
        _text = text;
        _kinds = new byte[text.Length];
        ReadCode(0, false);
    }

    public string CodeOnly => Blank(Comment, Literal);

    public string WithComments => Blank(Literal);

    private string Blank(params byte[] hidden)
    {
        var characters = _text.ToCharArray();
        for (var i = 0; i < characters.Length; i++)
        {
            if (hidden.Contains(_kinds[i]) && characters[i] != '\n')
            {
                characters[i] = ' ';
            }
        }

        return new string(characters);
    }

    private void Mark(int from, int to, byte kind)
    {
        for (var i = from; i < Math.Min(to, _kinds.Length); i++)
        {
            _kinds[i] = kind;
        }
    }

    private char At(int index) => index < _text.Length ? _text[index] : '\0';

    private int ReadCode(int i, bool inHole)
    {
        var depth = 0;
        while (i < _text.Length)
        {
            var character = _text[i];
            if (character == '/' && At(i + 1) == '/')
            {
                var end = _text.IndexOf('\n', i);
                end = end < 0 ? _text.Length : end;
                Mark(i, end, Comment);
                i = end;
            }
            else if (character == '/' && At(i + 1) == '*')
            {
                var close = _text.IndexOf("*/", i + 2, StringComparison.Ordinal);
                var end = close < 0 ? _text.Length : close + 2;
                Mark(i, end, Comment);
                i = end;
            }
            else if (character == '\'')
            {
                i = ReadCharLiteral(i);
            }
            else if (character is '"' or '$' or '@' && ReadStringLiteral(i) is var after && after != i)
            {
                i = after;
            }
            else if (inHole && character is '{' or '(' or '[')
            {
                depth++;
                i++;
            }
            else if (inHole && character is '}' or ')' or ']')
            {
                if (depth == 0 && character == '}')
                {
                    return i;
                }

                if (depth > 0)
                {
                    depth--;
                }

                i++;
            }
            else if (inHole && character == ':' && depth == 0)
            {
                if (At(i + 1) != ':')
                {
                    return i;
                }

                i += 2;
            }
            else
            {
                i++;
            }
        }

        return i;
    }

    private int ReadCharLiteral(int i)
    {
        var k = i + 1;
        if (At(k) == '\\')
        {
            k += 2;
        }

        while (k < _text.Length && _text[k] != '\'' && _text[k] != '\n')
        {
            k++;
        }

        Mark(i + 1, k, Literal);
        return At(k) == '\'' ? k + 1 : k;
    }

    private int ReadStringLiteral(int i)
    {
        var j = i;
        var dollars = 0;
        var verbatim = false;
        while (At(j) == '$')
        {
            dollars++;
            j++;
        }

        if (At(j) == '@')
        {
            verbatim = true;
            j++;
            while (At(j) == '$')
            {
                dollars++;
                j++;
            }
        }

        if (At(j) != '"')
        {
            return i;
        }

        var quotes = 0;
        while (At(j + quotes) == '"')
        {
            quotes++;
        }

        var raw = !verbatim && quotes >= 3;
        var closing = new string('"', raw ? quotes : 1);
        var braces = raw ? dollars : 1;
        var k = j + closing.Length;
        var segment = k;
        while (k < _text.Length)
        {
            var character = _text[k];
            if (raw && string.CompareOrdinal(_text, k, closing, 0, closing.Length) == 0)
            {
                break;
            }

            if (!raw && character == '"')
            {
                if (verbatim && At(k + 1) == '"')
                {
                    k += 2;
                    continue;
                }

                break;
            }

            if (!raw && !verbatim && character == '\\')
            {
                k += 2;
                continue;
            }

            if (!raw && !verbatim && character == '\n')
            {
                break;
            }

            if (dollars > 0 && character == '{')
            {
                var run = 0;
                while (At(k + run) == '{')
                {
                    run++;
                }

                if (raw ? run < dollars : run > 1)
                {
                    k += raw ? run : 2;
                    continue;
                }

                var open = k + (raw ? run : 1);
                Mark(segment, open - braces, Literal);
                var end = ReadHole(open);
                var close = 0;
                while (close < braces && At(end + close) == '}')
                {
                    close++;
                }

                k = end + close;
                segment = k;
                continue;
            }

            k++;
        }

        Mark(segment, k, Literal);
        if (k >= _text.Length)
        {
            return _text.Length;
        }

        return string.CompareOrdinal(_text, k, closing, 0, closing.Length) == 0 ? k + closing.Length : k;
    }

    private int ReadHole(int from)
    {
        var end = ReadCode(from, true);
        if (At(end) != ':')
        {
            return end;
        }

        var format = end + 1;
        while (format < _text.Length && _text[format] is not ('}' or '"' or '\n'))
        {
            format++;
        }

        Mark(end + 1, format, Literal);
        return format;
    }
}
