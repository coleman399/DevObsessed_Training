using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AgpCommandStation.Api.Data;
using AgpCommandStation.Api.Dtos;
using AgpCommandStation.Api.Models;
using AgpCommandStation.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace AgpCommandStation.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtTokenService _jwt;
    private readonly IClock _clock;
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;

    public AuthController(
        UserManager<ApplicationUser> users,
        IJwtTokenService jwt,
        IClock clock,
        IConfiguration config,
        AppDbContext db)
    {
        _users = users;
        _jwt = jwt;
        _clock = clock;
        _config = config;
        _db = db;
    }

    /// <summary>
    /// POST /api/auth/microsoft — validate Microsoft ID token, upsert user, return app JWT.
    /// </summary>
    [HttpPost("microsoft")]
    public async Task<IActionResult> Microsoft([FromBody] MicrosoftAuthRequest request, CancellationToken ct)
    {
        var tenantId = _config["AzureAd:TenantId"]
            ?? throw new InvalidOperationException("AzureAd:TenantId not configured");
        var clientId = _config["AzureAd:ClientId"]
            ?? throw new InvalidOperationException("AzureAd:ClientId not configured");

        ClaimsPrincipal principal;
        try
        {
            principal = await ValidateMicrosoftTokenAsync(request.IdToken, tenantId, clientId, ct);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = "invalid_token", message = ex.Message });
        }

        var oid = principal.FindFirstValue("oid") ?? principal.FindFirstValue("sub");
        var email = principal.FindFirstValue(JwtRegisteredClaimNames.Email)
                    ?? principal.FindFirstValue("preferred_username")
                    ?? string.Empty;
        var name = principal.FindFirstValue(JwtRegisteredClaimNames.Name)
                   ?? principal.FindFirstValue("name")
                   ?? email.Split('@')[0];

        if (string.IsNullOrEmpty(oid))
            return BadRequest(new { error = "missing_oid" });

        // Upsert by OID (stored as the user's Id)
        var user = await _db.Users.FindAsync(new object[] { oid }, ct);
        if (user is null)
        {
            user = new ApplicationUser
            {
                Id = oid,
                UserName = email,
                Email = email,
                NormalizedEmail = email.ToUpperInvariant(),
                NormalizedUserName = email.ToUpperInvariant(),
                DisplayName = name,
                CreatedAt = _clock.Now,
                EmailConfirmed = true,
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            // Refresh display name / email in case they changed in AAD
            user.DisplayName = name;
            user.Email = email;
            user.NormalizedEmail = email.ToUpperInvariant();
            await _db.SaveChangesAsync(ct);
        }

        var tokenResult = _jwt.IssueFor(user);
        var profile = ToProfileResponse(user);
        return Ok(new AuthResponse(tokenResult.Token, tokenResult.ExpiresAt, profile));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static async Task<ClaimsPrincipal> ValidateMicrosoftTokenAsync(
        string idToken, string tenantId, string clientId, CancellationToken ct)
    {
        var metadataEndpoint = $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration";
        var configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            metadataEndpoint,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever());

        var oidcConfig = await configManager.GetConfigurationAsync(ct);

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuers = new[]
            {
                $"https://login.microsoftonline.com/{tenantId}/v2.0",
                $"https://sts.windows.net/{tenantId}/",
            },
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateLifetime = true,
            IssuerSigningKeys = oidcConfig.SigningKeys,
            NameClaimType = JwtRegisteredClaimNames.Name,
            ClockSkew = TimeSpan.FromMinutes(5),
        };

        var handler = new JwtSecurityTokenHandler();
        handler.InboundClaimTypeMap.Clear();
        return handler.ValidateToken(idToken, validationParams, out _);
    }

    internal static UserProfileResponse ToProfileResponse(ApplicationUser user) =>
        new(
            user.Id,
            user.DisplayName,
            user.Email ?? string.Empty,
            user.Role,
            user.OnboardingComplete,
            user.DevOpsOrganization,
            user.DevOpsProject,
            user.GitHubOrganization,
            HasAnthropicKey: user.AnthropicApiKeyEncrypted is not null,
            HasGitHubPat: user.GitHubPatEncrypted is not null,
            user.TeamsChannelsJson,
            Model: "claude-sonnet-4-6"
        );
}
