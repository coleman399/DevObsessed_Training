using WelcomeApp.Api.Services;

namespace WelcomeApp.Api.Tests.Infrastructure;

public class FakeClock : IClock
{
    private DateTimeOffset _now;

    public FakeClock() : this(DateTimeOffset.Parse("2026-01-01T00:00:00Z")) { }

    public FakeClock(DateTimeOffset start)
    {
        _now = start;
    }

    public DateTimeOffset Now => _now;

    public void Advance(TimeSpan by) => _now = _now.Add(by);
    public void Set(DateTimeOffset to) => _now = to;
}
