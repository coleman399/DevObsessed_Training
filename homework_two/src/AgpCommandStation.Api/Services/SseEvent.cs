namespace AgpCommandStation.Api.Services;

/// <summary>
/// Discriminated union for SSE events emitted by the chat service.
/// Controllers serialize each variant to the appropriate JSON payload.
/// </summary>
public abstract record SseEvent;

/// <param name="Token">A text token from the model's streaming response.</param>
public record TextToken(string Token) : SseEvent;

/// <param name="Name">Tool name, e.g. "search_code".</param>
/// <param name="Label">Human-readable status label shown in the UI.</param>
public record ToolCallEvent(string Name, string Label) : SseEvent;
