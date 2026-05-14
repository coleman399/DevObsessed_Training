using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Models;

namespace WelcomeApp.Api.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StatsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var workspace = await _db.Workspaces
            .Where(w => w.OwnerUserId == userId)
            .OrderBy(w => w.CreatedAt)
            .FirstOrDefaultAsync();

        if (workspace is null)
        {
            // Shouldn't happen — UserRegistrationService creates a personal workspace transactionally.
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "No personal workspace found for this user.",
            });
        }

        var drafts = await _db.Drafts.CountAsync(d => d.UserId == userId);
        var pendingInvites = await _db.Invites.CountAsync(
            i => i.WorkspaceId == workspace.Id && i.Status == InviteStatus.Pending);
        var memberCount = await _db.WorkspaceMembers.CountAsync(m => m.WorkspaceId == workspace.Id);

        return Ok(new StatsResponse(drafts, pendingInvites, workspace.Name, memberCount, workspace.Plan));
    }
}
