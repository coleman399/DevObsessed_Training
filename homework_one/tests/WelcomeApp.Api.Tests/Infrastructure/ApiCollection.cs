namespace WelcomeApp.Api.Tests.Infrastructure;

// Integration tests share a single ApiFactory across the run (one migration check, one
// Respawner) and run serially within the collection — keeps the test DB sane without
// the per-class WebApplicationFactory race.
[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "Api";
}
