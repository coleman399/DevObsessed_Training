namespace AgpCommandStation.Api.Dtos;
public record SendMessageRequest(string Message, string[]? PinnedFiles = null);
