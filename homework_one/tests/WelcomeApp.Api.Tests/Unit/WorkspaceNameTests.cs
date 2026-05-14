using FluentAssertions;
using WelcomeApp.Api.Services;

namespace WelcomeApp.Api.Tests.Unit;

public class WorkspaceNameTests
{
    [Theory]
    [InlineData("Jane Doe", "jane-hq")]
    [InlineData("  Jane Doe  ", "jane-hq")]
    [InlineData("jane", "jane-hq")]
    [InlineData("JANE", "jane-hq")]
    [InlineData("François O'Brien", "francois-hq")]
    [InlineData("Zoë", "zoe-hq")]
    [InlineData("Ñoño", "nono-hq")]
    [InlineData("張偉", "user-hq")]
    [InlineData("——", "user-hq")]
    [InlineData("", "user-hq")]
    [InlineData("   ", "user-hq")]
    public void DeriveFromDisplayName_returns_expected_slug(string input, string expected)
    {
        WorkspaceNameHelper.DeriveFromDisplayName(input).Should().Be(expected);
    }

    [Fact]
    public void DeriveFromDisplayName_handles_null()
    {
        WorkspaceNameHelper.DeriveFromDisplayName(null).Should().Be("user-hq");
    }
}
