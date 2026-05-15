namespace AgpCommandStation.Api.Dtos;
public record AuthResponse(string Token, DateTimeOffset ExpiresAt, UserProfileResponse User);
