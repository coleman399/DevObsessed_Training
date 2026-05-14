namespace WelcomeApp.Api.Dtos;

public record ChatMessageDto(string Id, string Role, string Content, DateTimeOffset CreatedAt);
