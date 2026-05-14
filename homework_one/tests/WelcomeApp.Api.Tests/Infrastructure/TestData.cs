using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Services;

namespace WelcomeApp.Api.Tests.Infrastructure;

public static class TestData
{
    public const string DefaultPassword = "Pass123";

    public static async Task<ApplicationUser> SeedUserAsync(
        this ApiFactory factory,
        string email = "jane@example.com",
        string displayName = "Jane Doe",
        string password = DefaultPassword)
    {
        using var scope = factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var result = await users.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                "Seed user failed: " + string.Join("; ", result.Errors.Select(e => $"{e.Code}: {e.Description}")));
        }

        var workspace = new Workspace
        {
            Id = Guid.NewGuid().ToString(),
            Name = WorkspaceNameHelper.DeriveFromDisplayName(displayName),
            OwnerUserId = user.Id,
            Plan = "Free",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = user.Id,
            JoinedAt = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync();
        return user;
    }

    public static async Task<Draft> SeedDraftAsync(this AppDbContext db, string userId, string title = "Draft")
    {
        var draft = new Draft { UserId = userId, Title = title };
        db.Drafts.Add(draft);
        await db.SaveChangesAsync();
        return draft;
    }

    public static async Task<Invite> SeedInviteAsync(
        this AppDbContext db,
        string workspaceId,
        string invitedEmail = "guest@example.com",
        InviteStatus status = InviteStatus.Pending)
    {
        var invite = new Invite
        {
            WorkspaceId = workspaceId,
            InvitedEmail = invitedEmail,
            Status = status,
        };
        db.Invites.Add(invite);
        await db.SaveChangesAsync();
        return invite;
    }

    public static Task<Workspace?> FindOwnedWorkspaceAsync(this AppDbContext db, string userId) =>
        db.Workspaces.AsNoTracking().FirstOrDefaultAsync(w => w.OwnerUserId == userId);
}
