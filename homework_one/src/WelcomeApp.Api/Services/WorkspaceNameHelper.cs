using System.Globalization;
using System.Text;

namespace WelcomeApp.Api.Services;

public static class WorkspaceNameHelper
{
    // "Jane Doe" -> "jane-hq", "François O'Brien" -> "francois-hq", "Zoë" -> "zoe-hq",
    // "張偉" -> "user-hq" (no Latin decomposition, ASCII-strip removes everything), "——" -> "user-hq".
    public static string DeriveFromDisplayName(string? displayName)
    {
        var firstWord = (displayName ?? string.Empty)
            .Trim()
            .Split(' ', 2, StringSplitOptions.RemoveEmptyEntries) is { Length: > 0 } parts
            ? parts[0]
            : string.Empty;

        var normalized = firstWord.Normalize(NormalizationForm.FormD);
        var withoutMarks = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                withoutMarks.Append(c);
            }
        }

        var lowered = withoutMarks.ToString().ToLowerInvariant();
        var asciiOnly = new StringBuilder(lowered.Length);
        foreach (var c in lowered)
        {
            if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                asciiOnly.Append(c);
            }
        }

        var slug = asciiOnly.Length > 0 ? asciiOnly.ToString() : "user";
        return slug + "-hq";
    }
}
