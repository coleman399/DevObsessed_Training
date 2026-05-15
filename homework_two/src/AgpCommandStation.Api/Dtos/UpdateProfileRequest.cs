using AgpCommandStation.Api.Models;
namespace AgpCommandStation.Api.Dtos;
public record UpdateProfileRequest(
    UserRole? Role,
    string? AnthropicApiKey,
    string? DevOpsOrganization,
    string? DevOpsProject,
    string? GitHubOrganization,
    string? GitHubPat,
    string? TeamsChannelsJson
);
