namespace AgpCommandStation.Api.Dtos;

public record SearchResult(
    string Type,         // "workitem" | "pr" | "code" | "email" | "teams" | "calendar"
    string Title,
    string Subtitle,
    string PanelTarget,  // "workitems" | "repos" | "email" | "calendar" | "teams"
    string? Url,
    string? Id
);
