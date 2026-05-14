namespace WelcomeApp.Api.Models;

public class Workspace
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string OwnerUserId { get; set; } = string.Empty;
    public string Plan { get; set; } = "Free";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
