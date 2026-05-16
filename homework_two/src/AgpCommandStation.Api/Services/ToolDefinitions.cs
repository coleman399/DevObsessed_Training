namespace AgpCommandStation.Api.Services;

/// <summary>
/// Static tool definitions in Anthropic's tool format.
/// </summary>
public static class ToolDefinitions
{
    public static object[] All => new object[]
    {
        new
        {
            name = "search_code",
            description = "Search for code across the user's Azure DevOps or GitHub repositories. " +
                          "Returns matching file paths and snippets. Use repo parameter as 'ado' or 'github'.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    query = new { type = "string", description = "Search query, e.g. a class name, method, or keyword" },
                    repo = new { type = "string", description = "Optional: 'ado' to search ADO repos, 'github' to search GitHub repos" }
                },
                required = new[] { "query" }
            }
        },
        new
        {
            name = "get_file",
            description = "Read the contents of a file from a repository. " +
                          "Use after search_code to read full file contents. " +
                          "Specify repo as 'ado:repoName' or 'github:owner/repo'.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    repo = new { type = "string", description = "Repo reference: 'ado:repoName' or 'github:owner/repo'" },
                    path = new { type = "string", description = "File path, e.g. '/Controllers/AuthController.cs'" }
                },
                required = new[] { "repo", "path" }
            }
        },
        new
        {
            name = "list_directory",
            description = "List files and folders in a repository directory.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    repo = new { type = "string", description = "Repo reference: 'ado:repoName' or 'github:owner/repo'" },
                    path = new { type = "string", description = "Directory path, e.g. '/Controllers'" }
                },
                required = new[] { "repo", "path" }
            }
        },
        new
        {
            name = "search_emails",
            description = "Search Outlook emails by keyword. Returns matching messages with sender, subject, date, and preview.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    query = new { type = "string", description = "Search terms" },
                    top = new { type = "integer", description = "Max results (default 5)" }
                },
                required = new[] { "query" }
            }
        },
        new
        {
            name = "get_email_thread",
            description = "Get the full body of an email message by ID.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    messageId = new { type = "string", description = "The email message ID from search_emails" }
                },
                required = new[] { "messageId" }
            }
        },
        new
        {
            name = "search_teams_messages",
            description = "Search Microsoft Teams messages and chat history by keyword.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    query = new { type = "string", description = "Search terms" }
                },
                required = new[] { "query" }
            }
        },
        new
        {
            name = "get_channel_messages",
            description = "Get recent messages from a specific Teams channel.",
            input_schema = new
            {
                type = "object",
                properties = new
                {
                    teamId = new { type = "string", description = "Teams team ID" },
                    channelId = new { type = "string", description = "Channel ID" },
                    top = new { type = "integer", description = "Number of messages (default 10)" }
                },
                required = new[] { "teamId", "channelId" }
            }
        }
    };
}
