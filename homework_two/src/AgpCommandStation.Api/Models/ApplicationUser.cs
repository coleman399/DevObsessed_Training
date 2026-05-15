using Microsoft.AspNetCore.Identity;
namespace AgpCommandStation.Api.Models;

public class ApplicationUser : IdentityUser<string>
{
    public string DisplayName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.SoftwareEngineer;
    public string? AnthropicApiKeyEncrypted { get; set; }
    public string? DevOpsOrganization { get; set; }
    public string? DevOpsProject { get; set; }
    public string? GitHubOrganization { get; set; }
    public string? GitHubPatEncrypted { get; set; }
    public string? TeamsChannelsJson { get; set; }
    public string? BotPersonaMarkdownOverride { get; set; }
    public bool OnboardingComplete { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }
}
