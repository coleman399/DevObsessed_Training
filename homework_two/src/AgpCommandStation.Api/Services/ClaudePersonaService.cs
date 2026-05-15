using System.Text;
using System.Text.RegularExpressions;

namespace AgpCommandStation.Api.Services;

public interface IClaudePersonaService
{
    string GetPersonaMarkdown(string? overrideMarkdown = null);
    void InvalidateCache();
}

public class ClaudePersonaService : IClaudePersonaService
{
    private static readonly object _lock = new();
    private string? _cached;
    private DateTime _cachedAt = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private const string FallbackPersona = """
        You are an AI assistant for AGP (AGP Consulting Group). You help team members
        be productive with their work items, code, emails, calendar, and Teams channels.
        Be concise, professional, and business-focused.
        """;

    public string GetPersonaMarkdown(string? overrideMarkdown = null)
    {
        lock (_lock)
        {
            if (_cached is not null && DateTime.UtcNow - _cachedAt < CacheTtl)
                return _cached;

            _cached = BuildPersona(overrideMarkdown);
            _cachedAt = DateTime.UtcNow;
            return _cached;
        }
    }

    public void InvalidateCache() { lock (_lock) { _cached = null; } }

    private static string BuildPersona(string? overrideMarkdown)
    {
        var claudeDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".claude");
        var claudeMdPath = Path.Combine(claudeDir, "CLAUDE.md");

        if (!File.Exists(claudeMdPath))
            return overrideMarkdown ?? FallbackPersona;

        try
        {
            var claudeMd = File.ReadAllText(claudeMdPath);
            var sb = new StringBuilder();
            sb.AppendLine(claudeMd);

            // Find backtick file references: `SOUL.md`, `USER.md`, etc.
            var refs = Regex.Matches(claudeMd, @"`([A-Z][A-Z0-9_\-]*\.md)`");
            foreach (Match m in refs)
            {
                var fileName = m.Groups[1].Value;
                var filePath = Path.Combine(claudeDir, fileName);
                if (File.Exists(filePath))
                {
                    sb.AppendLine($"\n---\n## {fileName}\n");
                    sb.AppendLine(File.ReadAllText(filePath));
                }
            }

            return sb.ToString();
        }
        catch
        {
            return overrideMarkdown ?? FallbackPersona;
        }
    }
}
