using Microsoft.AspNetCore.Identity;
using WelcomeApp.Api.Models;

namespace WelcomeApp.Api.Services;

public interface IUserRegistrationService
{
    Task<UserRegistrationResult> RegisterAsync(string displayName, string email, string password);
}

public record UserRegistrationResult(
    bool Succeeded,
    ApplicationUser? User,
    IReadOnlyList<IdentityError>? Errors)
{
    public static UserRegistrationResult Success(ApplicationUser user) => new(true, user, null);

    public static UserRegistrationResult Failure(IEnumerable<IdentityError> errors) =>
        new(false, null, errors.ToList());
}
