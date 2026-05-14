namespace WelcomeApp.Api.Dtos;

public record AuthResponse(string Token, DateTimeOffset ExpiresAt, AuthUser User);

public record AuthUser(string Id, string Name, string Email);
