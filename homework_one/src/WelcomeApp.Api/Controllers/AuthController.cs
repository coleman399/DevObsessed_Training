using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Services;

namespace WelcomeApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string DuplicateEmailTypeUri = "https://welcomeapp.local/errors/duplicate-email";
    private const string InvalidCredentialsTypeUri = "https://welcomeapp.local/errors/invalid-credentials";
    private const string GenericLoginFailureTitle = "Invalid email or password.";

    private readonly UserManager<ApplicationUser> _users;
    private readonly IPasswordHasher<ApplicationUser> _hasher;
    private readonly IJwtTokenService _tokens;
    private readonly IUserRegistrationService _registration;

    public AuthController(
        UserManager<ApplicationUser> users,
        IPasswordHasher<ApplicationUser> hasher,
        IJwtTokenService tokens,
        IUserRegistrationService registration)
    {
        _users = users;
        _hasher = hasher;
        _tokens = tokens;
        _registration = registration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _registration.RegisterAsync(request.Name, request.Email, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors ?? Array.Empty<IdentityError>();
            if (errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName"))
            {
                return Conflict(new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Email already registered.",
                    Type = DuplicateEmailTypeUri,
                });
            }

            return ValidationProblem(new ValidationProblemDetails(BuildIdentityErrorDictionary(errors))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Registration failed.",
            });
        }

        var token = _tokens.IssueFor(result.User!);
        return Ok(BuildAuthResponse(result.User!, token));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // TODO: add rate limiting (ASP.NET Core 8's AddRateLimiter) — production must lock out
        // brute-force attempts. Out of scope for training app.
        var user = await _users.FindByEmailAsync(request.Email);
        if (user is null)
        {
            // Equalise hash cost against the wrong-password path so timing leakage stays narrow.
            // (FindByEmailAsync DB roundtrip is still skipped — full constant-time is out of scope; see plan.)
            _ = _hasher.HashPassword(new ApplicationUser(), request.Password);
            return GenericUnauthorized();
        }

        if (!await _users.CheckPasswordAsync(user, request.Password))
        {
            return GenericUnauthorized();
        }

        var token = _tokens.IssueFor(user);
        return Ok(BuildAuthResponse(user, token));
    }

    private static AuthResponse BuildAuthResponse(ApplicationUser user, JwtIssueResult token) =>
        new(token.Token,
            token.ExpiresAt,
            new AuthUser(user.Id, user.DisplayName, user.Email ?? string.Empty));

    private static Dictionary<string, string[]> BuildIdentityErrorDictionary(IEnumerable<IdentityError> errors)
    {
        return errors
            .GroupBy(e => string.IsNullOrEmpty(e.Code) ? "Identity" : e.Code)
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
    }

    private IActionResult GenericUnauthorized() => Unauthorized(new ProblemDetails
    {
        Status = StatusCodes.Status401Unauthorized,
        Title = GenericLoginFailureTitle,
        Type = InvalidCredentialsTypeUri,
    });
}
