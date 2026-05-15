using AgpCommandStation.Api.Services;
using FluentAssertions;
using Xunit;

namespace AgpCommandStation.Api.Tests;

public class AnthropicChatServiceTests
{
    [Theory]
    [InlineData("Short title", "Short title")]
    [InlineData("This is exactly thirty-eight chars!!", "This is exactly thirty-eight chars!!")]
    [InlineData("This is a very long user message that exceeds the limit for titles", "This is a very long user message th…")]
    public void DeriveTitle_TruncatesCorrectly(string input, string expected)
    {
        AnthropicChatService.DeriveTitle(input).Should().Be(expected);
    }
}
