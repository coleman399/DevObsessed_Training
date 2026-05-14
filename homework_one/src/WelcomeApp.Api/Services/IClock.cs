namespace WelcomeApp.Api.Services;

// Tiny abstraction so JwtTokenServiceTests can swap in a FakeClock and assert expiry deterministically.
public interface IClock
{
    DateTimeOffset Now { get; }
}

public class SystemClock : IClock
{
    public DateTimeOffset Now => DateTimeOffset.UtcNow;
}
