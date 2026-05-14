namespace WelcomeApp.Api.Services;

public class ChatOptions
{
    public string Endpoint { get; set; } = "https://models.github.ai/inference";
    public string Model { get; set; } = "openai/gpt-4.1-mini";
    public string ApiKey { get; set; } = string.Empty;
    public int MaxHistoryMessages { get; set; } = 20;
    public string SystemPromptTemplate { get; set; } =
        "You are Nova, a calm and concise assistant inside {workspaceName}.\n" +
        "The user's name is {firstName}. They are on the {plan} plan with {drafts} drafts and {pendingInvites} pending invites.\n" +
        "Reply in 1–2 short sentences. Warm but never effusive. Never use exclamation marks.\n" +
        "Plain prose only — no markdown, no lists, no headers. Do not sign off (\"- Nova\", \"Best,\"). Just reply.\n" +
        "Address the user only by their first name.";
}
