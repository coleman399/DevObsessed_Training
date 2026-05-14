using System.IdentityModel.Tokens.Jwt;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Services;
using WelcomeApp.Api.Tests.Infrastructure;

namespace WelcomeApp.Api.Tests.Unit;

public class JwtTokenServiceTests
{
    private const string Key = "unit-test-key-unit-test-key-unit-test-key-1234";

    private static (JwtTokenService Service, FakeClock Clock, JwtOptions Options) CreateService(int expiresMinutes = 60)
    {
        var options = new JwtOptions
        {
            Key = Key,
            Issuer = "WelcomeApp",
            Audience = "WelcomeApp.Spa",
            ExpiresMinutes = expiresMinutes,
        };
        var clock = new FakeClock();
        var service = new JwtTokenService(Options.Create(options), clock);
        return (service, clock, options);
    }

    private static ApplicationUser SampleUser() => new()
    {
        Id = "user-123",
        UserName = "jane@example.com",
        Email = "jane@example.com",
        DisplayName = "Jane",
    };

    [Fact]
    public void IssueFor_emits_sub_email_name_jti_iat_claims()
    {
        var (service, _, _) = CreateService();
        var result = service.IssueFor(SampleUser());

        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        token.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "user-123");
        token.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "jane@example.com");
        token.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Name && c.Value == "Jane");
        token.Claims.Should().ContainSingle(c => c.Type == JwtRegisteredClaimNames.Jti);
        token.Claims.Should().ContainSingle(c => c.Type == JwtRegisteredClaimNames.Iat);
    }

    [Fact]
    public void IssueFor_expiry_honours_config_via_clock()
    {
        var (service, clock, _) = CreateService(expiresMinutes: 30);
        var result = service.IssueFor(SampleUser());

        result.ExpiresAt.Should().Be(clock.Now.AddMinutes(30));
    }

    [Fact]
    public void IssueFor_token_validates_with_configured_key()
    {
        var (service, _, options) = CreateService();
        var result = service.IssueFor(SampleUser());

        var handler = new JwtSecurityTokenHandler();
        var validation = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            // ValidateLifetime is off here on purpose: the token's nbf/exp comes from FakeClock (2026-01-01)
            // while ValidateToken uses the real system clock. This test is about key/issuer/audience, not lifetime —
            // expiry is covered by IssueFor_expiry_honours_config_via_clock above.
            ValidateLifetime = false,
            ValidIssuer = options.Issuer,
            ValidAudience = options.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
        };

        var act = () => handler.ValidateToken(result.Token, validation, out _);
        act.Should().NotThrow();
    }

    [Fact]
    public void IssueFor_tampered_signature_fails_validation()
    {
        var (service, _, options) = CreateService();
        var result = service.IssueFor(SampleUser());

        var parts = result.Token.Split('.');
        // Flip a character in the signature segment.
        var sig = parts[2].ToCharArray();
        sig[0] = sig[0] == 'A' ? 'B' : 'A';
        var tampered = $"{parts[0]}.{parts[1]}.{new string(sig)}";

        var handler = new JwtSecurityTokenHandler();
        var validation = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
        };

        var act = () => handler.ValidateToken(tampered, validation, out _);
        act.Should().Throw<SecurityTokenInvalidSignatureException>();
    }
}
