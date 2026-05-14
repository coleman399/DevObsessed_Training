using Microsoft.AspNetCore.Identity;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Models;

namespace WelcomeApp.Api.Services;

public class UserRegistrationService : IUserRegistrationService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly AppDbContext _db;
    private readonly IClock _clock;
    private readonly ILogger<UserRegistrationService> _logger;

    public UserRegistrationService(
        UserManager<ApplicationUser> users,
        AppDbContext db,
        IClock clock,
        ILogger<UserRegistrationService> logger)
    {
        _users = users;
        _db = db;
        _clock = clock;
        _logger = logger;
    }

    public async Task<UserRegistrationResult> RegisterAsync(string displayName, string email, string password)
    {
        // UserName is set to the email so RequireUniqueEmail's guarantee is enforced on the username path too.
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            CreatedAt = _clock.Now,
        };

        await using var tx = await _db.Database.BeginTransactionAsync();

        var identity = await _users.CreateAsync(user, password);
        if (!identity.Succeeded)
        {
            return UserRegistrationResult.Failure(identity.Errors);
        }

        var workspace = new Workspace
        {
            Id = Guid.NewGuid().ToString(),
            Name = WorkspaceNameHelper.DeriveFromDisplayName(displayName),
            OwnerUserId = user.Id,
            Plan = "Free",
            CreatedAt = _clock.Now,
        };
        _db.Workspaces.Add(workspace);

        _db.WorkspaceMembers.Add(new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = user.Id,
            JoinedAt = _clock.Now,
        });

        try
        {
            await _db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist workspace/membership for user {UserId}; rolling back.", user.Id);
            await tx.RollbackAsync();
            throw;
        }

        return UserRegistrationResult.Success(user);
    }
}
