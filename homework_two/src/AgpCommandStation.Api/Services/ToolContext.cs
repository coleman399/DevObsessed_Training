namespace AgpCommandStation.Api.Services;

/// <summary>
/// Token context forwarded from the frontend for tool execution.
/// Neither token is stored; they're used only for the duration of the request.
/// </summary>
public record ToolContext(
    string? DevOpsToken,
    string? GraphToken,
    string? DevOpsOrg,
    string? DevOpsProject,
    string? GitHubOrg
);
