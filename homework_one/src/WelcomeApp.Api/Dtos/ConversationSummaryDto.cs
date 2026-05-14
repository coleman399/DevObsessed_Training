namespace WelcomeApp.Api.Dtos;

public record ConversationSummaryDto(string Id, string Title, DateTimeOffset UpdatedAt, int MessageCount);
