using AgpCommandStation.Api.Models;
namespace AgpCommandStation.Api.Dtos;
public record UserProfileResponse(
    string Id,
    string DisplayName,
    string Email,
    UserRole Role,
    bool OnboardingComplete,
    string? DevOpsOrganization,
    string? DevOpsProject,
    string? GitHubOrganization,
    bool HasAnthropicKey,
    bool HasGitHubPat,
    string? TeamsChannelsJson,
    string Model  // always "claude-sonnet-4-6"
);
