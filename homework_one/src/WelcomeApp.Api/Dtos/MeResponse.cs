namespace WelcomeApp.Api.Dtos;

public record MeResponse(string Id, string Name, string Email, DateTimeOffset CreatedAt);
