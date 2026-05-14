using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Integration;

public class UserRegistrationServiceTests : IntegrationTestBase
{
    public UserRegistrationServiceTests(ApiFactory factory) : base(factory) { }

    [Fact]
    public async Task Register_creates_user_workspace_and_member_atomically()
    {
        await RegisterAsync(name: "Jane Doe", email: "atomic@example.com");

        await using var db = CreateDbContext();
        var user = await db.Users.SingleAsync(u => u.Email == "atomic@example.com");
        var workspace = await db.Workspaces.SingleAsync(w => w.OwnerUserId == user.Id);
        var member = await db.WorkspaceMembers.SingleAsync(
            m => m.WorkspaceId == workspace.Id && m.UserId == user.Id);

        workspace.Name.Should().Be("jane-hq");
        workspace.Plan.Should().Be("Free");
        member.Should().NotBeNull();
    }

    [Fact]
    public async Task Register_failure_leaves_no_orphan_workspace_or_member()
    {
        await RegisterAsync(name: "Jane", email: "orphan@example.com");

        // Second registration with the same email fails — Identity rejects it before
        // workspace/member rows would be inserted (transaction would roll back if any later step failed).
        var second = await Client.PostAsJsonAsync("/api/auth/register",
            new { name = "Jane2", email = "orphan@example.com", password = "Pass123" });
        second.StatusCode.Should().Be(System.Net.HttpStatusCode.Conflict);

        await using var db = CreateDbContext();
        (await db.Users.CountAsync(u => u.Email == "orphan@example.com")).Should().Be(1);
        var user = await db.Users.SingleAsync(u => u.Email == "orphan@example.com");
        (await db.Workspaces.CountAsync(w => w.OwnerUserId == user.Id)).Should().Be(1);
        (await db.WorkspaceMembers.CountAsync(m => m.UserId == user.Id)).Should().Be(1);
    }
}
