using WelcomeApp.Api.Models;

namespace WelcomeApp.Api.Services;

public record JwtIssueResult(string Token, DateTimeOffset ExpiresAt);

public interface IJwtTokenService
{
    JwtIssueResult IssueFor(ApplicationUser user);
}
