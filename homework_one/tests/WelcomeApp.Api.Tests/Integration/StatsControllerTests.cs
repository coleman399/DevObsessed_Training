using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Integration;

public class StatsControllerTests : IntegrationTestBase
{
    public StatsControllerTests(ApiFactory factory) : base(factory) { }

    [Fact]
    public async Task Stats_for_new_user_returns_zeros_and_personal_workspace()
    {
        var (_, authed) = await RegisterAsync(name: "Jane Doe", email: "stats-new@example.com");

        var response = await authed.GetAsync("/api/stats");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var stats = await response.Content.ReadFromJsonAsync<StatsResponse>();
        stats.Should().NotBeNull();
        stats!.Drafts.Should().Be(0);
        stats.PendingInvites.Should().Be(0);
        stats.WorkspaceName.Should().Be("jane-hq");
        stats.MemberCount.Should().Be(1);
        stats.Plan.Should().Be("Free");
    }

    [Fact]
    public async Task Stats_counts_seeded_drafts_and_pending_invites()
    {
        var (auth, authed) = await RegisterAsync(name: "Jane", email: "stats-seed@example.com");

        await using (var db = CreateDbContext())
        {
            var workspace = await db.Workspaces.SingleAsync(w => w.OwnerUserId == auth.User.Id);
            await db.SeedDraftAsync(auth.User.Id, "First draft");
            await db.SeedDraftAsync(auth.User.Id, "Second draft");
            await db.SeedInviteAsync(workspace.Id, "a@example.com", InviteStatus.Pending);
            await db.SeedInviteAsync(workspace.Id, "b@example.com", InviteStatus.Pending);
            await db.SeedInviteAsync(workspace.Id, "c@example.com", InviteStatus.Accepted); // shouldn't count
        }

        var stats = await authed.GetFromJsonAsync<StatsResponse>("/api/stats");
        stats!.Drafts.Should().Be(2);
        stats.PendingInvites.Should().Be(2);
        stats.MemberCount.Should().Be(1);
    }

    [Fact]
    public async Task Stats_without_token_returns_401()
    {
        var response = await Client.GetAsync("/api/stats");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
