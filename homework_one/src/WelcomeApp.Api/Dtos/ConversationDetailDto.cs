namespace WelcomeApp.Api.Dtos;

public record ConversationDetailDto(string Id, string Title, DateTimeOffset UpdatedAt, IReadOnlyList<ChatMessageDto> Messages);
