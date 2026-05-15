namespace AgpCommandStation.Api.Services;

public class AnthropicChatOptions
{
    public string Endpoint { get; set; } = "https://api.anthropic.com";
    public string ApiVersion { get; set; } = "2023-06-01";
    public string DefaultModel { get; set; } = "claude-sonnet-4-6";
    public int MaxTokens { get; set; } = 4096;
    public int MaxHistoryMessages { get; set; } = 20;
}
