using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Integration;

public class AuthControllerTests : IntegrationTestBase
{
    public AuthControllerTests(ApiFactory factory) : base(factory) { }

    [Fact]
    public async Task Register_happy_path_returns_200_with_token_and_user()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/register",
            new { name = "Jane Doe", email = "jane@example.com", password = "Pass123" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        auth.Should().NotBeNull();
        auth!.Token.Should().NotBeNullOrEmpty();
        auth.User.Email.Should().Be("jane@example.com");
        auth.User.Name.Should().Be("Jane Doe");
        auth.ExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Register_duplicate_email_returns_409_with_stable_problem_details()
    {
        (await Client.PostAsJsonAsync("/api/auth/register",
            new { name = "Jane", email = "dup@example.com", password = "Pass123" }))
            .EnsureSuccessStatusCode();

        var second = await Client.PostAsJsonAsync("/api/auth/register",
            new { name = "Jane2", email = "dup@example.com", password = "Pass123" });

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var problem = await second.Content.ReadFromJsonAsync<ProblemDetails>();
        problem.Should().NotBeNull();
        problem!.Title.Should().Be("Email already registered.");
        problem.Type.Should().Be("https://welcomeapp.local/errors/duplicate-email");
    }

    [Fact]
    public async Task Register_email_collision_is_case_insensitive()
    {
        (await Client.PostAsJsonAsync("/api/auth/register",
            new { name = "Jane", email = "case@example.com", password = "Pass123" }))
            .EnsureSuccessStatusCode();

        var second = await Client.PostAsJsonAsync("/api/auth/register",
            new { name = "Jane2", email = "CASE@Example.com", password = "Pass123" });

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_with_correct_creds_returns_200_with_token()
    {
        await RegisterAsync(email: "login@example.com", password: "Pass123");

        var response = await Client.PostAsJsonAsync("/api/auth/login",
            new { email = "login@example.com", password = "Pass123" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        auth!.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_generic_401()
    {
        await RegisterAsync(email: "wrongpw@example.com", password: "Pass123");

        var response = await Client.PostAsJsonAsync("/api/auth/login",
            new { email = "wrongpw@example.com", password = "BadPass" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problem!.Title.Should().Be("Invalid email or password.");
    }

    [Fact]
    public async Task Login_with_unknown_email_returns_same_generic_401()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/login",
            new { email = "nobody@example.com", password = "Pass123" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problem!.Title.Should().Be("Invalid email or password.");
    }

    [Fact]
    public async Task Register_persists_hashed_password_not_plaintext()
    {
        await RegisterAsync(email: "hash@example.com", password: "Pass123");

        await using var db = CreateDbContext();
        var user = await db.Users.AsNoTracking().SingleAsync(u => u.Email == "hash@example.com");

        user.PasswordHash.Should().NotBeNullOrEmpty();
        user.PasswordHash.Should().NotBe("Pass123");
        // Identity v3 format: first byte 0x01, base64-encoded → starts with 'A' (00000001 → 000000).
        user.PasswordHash!.Should().StartWith("A");
    }

    [Fact(DisplayName = "Login timing parity: unknown-email vs wrong-password (regression guard, not a security proof)")]
    public async Task Login_unknown_email_timing_within_loose_bound_of_wrong_password()
    {
        await RegisterAsync(email: "timing@example.com", password: "Pass123");

        // Warmup — JIT + connection pool.
        for (var i = 0; i < 2; i++)
        {
            await Client.PostAsJsonAsync("/api/auth/login",
                new { email = "timing@example.com", password = "BadPass" });
            await Client.PostAsJsonAsync("/api/auth/login",
                new { email = "ghost@example.com", password = "BadPass" });
        }

        const int iterations = 5;
        var wrongPwTotal = 0L;
        var unknownEmailTotal = 0L;
        for (var i = 0; i < iterations; i++)
        {
            var sw = Stopwatch.StartNew();
            await Client.PostAsJsonAsync("/api/auth/login",
                new { email = "timing@example.com", password = "BadPass" });
            sw.Stop();
            wrongPwTotal += sw.ElapsedMilliseconds;

            sw.Restart();
            await Client.PostAsJsonAsync("/api/auth/login",
                new { email = "ghost@example.com", password = "BadPass" });
            sw.Stop();
            unknownEmailTotal += sw.ElapsedMilliseconds;
        }

        var ratio = unknownEmailTotal / (double)Math.Max(wrongPwTotal, 1);
        // Loose bound — only proves the dummy-hash path is active. Production needs rate limiting.
        ratio.Should().BeInRange(0.4, 2.5);
    }
}
