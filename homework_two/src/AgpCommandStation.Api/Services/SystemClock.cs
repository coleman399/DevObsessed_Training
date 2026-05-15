namespace AgpCommandStation.Api.Services;
public class SystemClock : IClock { public DateTimeOffset Now => DateTimeOffset.UtcNow; }
