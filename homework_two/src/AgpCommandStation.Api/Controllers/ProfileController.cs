using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AgpCommandStation.Api.Data;
using AgpCommandStation.Api.Dtos;
using AgpCommandStation.Api.Models;
using AgpCommandStation.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgpCommandStation.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEncryptionService _encryption;
    private readonly IClaudePersonaService _persona;

    public ProfileController(AppDbContext db, IEncryptionService encryption, IClaudePersonaService persona)
    {
        _db = db;
        _encryption = encryption;
        _persona = persona;
    }

    // GET /api/profile
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user is null) return NotFound();
        return Ok(AuthController.ToProfileResponse(user));
    }

    // PATCH /api/profile
    [HttpPatch]
    public async Task<IActionResult> Patch([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = UserId();
        if (userId is null) return Unauthorized();
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user is null) return NotFound();

        if (request.Role.HasValue) user.Role = request.Role.Value;
        if (request.DevOpsOrganization is not null) user.DevOpsOrganization = request.DevOpsOrganization;
        if (request.DevOpsProject is not null) user.DevOpsProject = request.DevOpsProject;
        if (request.GitHubOrganization is not null) user.GitHubOrganization = request.GitHubOrganization;
        if (request.TeamsChannelsJson is not null) user.TeamsChannelsJson = request.TeamsChannelsJson;

        if (request.AnthropicApiKey is not null)
        {
            user.AnthropicApiKeyEncrypted = string.IsNullOrWhiteSpace(request.AnthropicApiKey)
                ? null
                : _encryption.Encrypt(request.AnthropicApiKey);
        }

        if (request.GitHubPat is not null)
        {
            user.GitHubPatEncrypted = string.IsNullOrWhiteSpace(request.GitHubPat)
                ? null
                : _encryption.Encrypt(request.GitHubPat);
        }

        // Mark onboarding complete once role + anthropic key are set
        if (user.Role != UserRole.SoftwareEngineer || user.AnthropicApiKeyEncrypted is not null)
            user.OnboardingComplete = true;

        _persona.InvalidateCache(); // clear cached persona so next chat picks up any file changes
        await _db.SaveChangesAsync(ct);
        return Ok(AuthController.ToProfileResponse(user));
    }

    private string? UserId() => User.FindFirstValue(JwtRegisteredClaimNames.Sub);
}
