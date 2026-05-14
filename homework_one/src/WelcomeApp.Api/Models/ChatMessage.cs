namespace WelcomeApp.Api.Models;

public class ChatMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ConversationId { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // user / assistant / system
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public Conversation? Conversation { get; set; }
}
