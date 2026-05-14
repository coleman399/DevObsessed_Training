using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using WelcomeApp.Api.Dtos;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Integration;

public class MeControllerTests : IntegrationTestBase
{
    private const string TestKey = "test-key-test-key-test-key-test-key-test-key-1234";

    public MeControllerTests(ApiFactory factory) : base(factory) { }

    [Fact]
    public async Task Me_with_valid_token_returns_user()
    {
        var (auth, authed) = await RegisterAsync(name: "Jane Doe", email: "me@example.com");

        var response = await authed.GetAsync("/api/me");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var me = await response.Content.ReadFromJsonAsync<MeResponse>();
        me.Should().NotBeNull();
        me!.Id.Should().Be(auth.User.Id);
        me.Name.Should().Be("Jane Doe");
        me.Email.Should().Be("me@example.com");
    }

    [Fact]
    public async Task Me_without_token_returns_401()
    {
        var response = await Client.GetAsync("/api/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_with_expired_token_returns_401()
    {
        var expired = WriteToken(
            notBefore: DateTime.UtcNow.AddHours(-2),
            expires: DateTime.UtcNow.AddHours(-1));
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expired);

        var response = await client.GetAsync("/api/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_with_tampered_token_returns_401()
    {
        var (auth, _) = await RegisterAsync(email: "tampered@example.com");
        var parts = auth.Token.Split('.');
        var sigChars = parts[2].ToCharArray();
        sigChars[0] = sigChars[0] == 'A' ? 'B' : 'A';
        var tampered = $"{parts[0]}.{parts[1]}.{new string(sigChars)}";

        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tampered);

        var response = await client.GetAsync("/api/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static string WriteToken(DateTime notBefore, DateTime expires)
    {
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: "WelcomeApp",
            audience: "WelcomeApp.Spa",
            claims: new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "phantom-user"),
                new Claim(JwtRegisteredClaimNames.Email, "phantom@example.com"),
                new Claim(JwtRegisteredClaimNames.Name, "Phantom"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            },
            notBefore: notBefore,
            expires: expires,
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
