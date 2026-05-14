using System.Data.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Respawn;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Services;

namespace WelcomeApp.Api.Tests.Infrastructure;

public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string TestDbConnectionString =
        "Server=(localdb)\\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;";

    private const string TestJwtKey = "test-key-test-key-test-key-test-key-test-key-1234";

    static ApiFactory()
    {
        // Process-wide env vars are read by WebApplication.CreateBuilder's default
        // AddEnvironmentVariables() source BEFORE Program.cs validates Jwt:Key at line 36.
        // UseSetting / ConfigureAppConfiguration apply too late for top-level statement Program.cs.
        // Safe to set globally because ApiCollection serializes integration tests.
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", TestDbConnectionString);
        Environment.SetEnvironmentVariable("Jwt__Key", TestJwtKey);
        Environment.SetEnvironmentVariable("Jwt__Issuer", "WelcomeApp");
        Environment.SetEnvironmentVariable("Jwt__Audience", "WelcomeApp.Spa");
        Environment.SetEnvironmentVariable("Jwt__ExpiresMinutes", "60");
    }

    // Constructed at real UTC so tokens issued via the factory are valid against
    // JwtBearer's system-clock check. Tests that want a deterministic instant call Clock.Set(...).
    public FakeClock Clock { get; } = new(DateTimeOffset.UtcNow);

    private Respawner? _respawner;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // UseSetting feeds the host's IConfiguration before WebApplication.CreateBuilder reads
        // Jwt:Key. ConfigureAppConfiguration runs too late for top-level Program.cs config access.
        builder.UseSetting("ConnectionStrings:Default", TestDbConnectionString);
        builder.UseSetting("Jwt:Key", TestJwtKey);
        builder.UseSetting("Jwt:Issuer", "WelcomeApp");
        builder.UseSetting("Jwt:Audience", "WelcomeApp.Spa");
        builder.UseSetting("Jwt:ExpiresMinutes", "60");
        builder.UseSetting("Cors:SpaOrigin", "http://localhost:5173");

        builder.ConfigureServices(services =>
        {
            // Replace the IClock registration so tests can advance time deterministically.
            services.RemoveAll<IClock>();
            services.AddSingleton<IClock>(Clock);
        });
    }

    public async Task InitializeAsync()
    {
        // Schema is migrated explicitly by the developer before the first test run
        // (see tests/WelcomeApp.Api.Tests/README.md). Here we just stand up the Respawner
        // so per-test resets are cheap.
        await using var connection = new SqlConnection(TestDbConnectionString);
        await connection.OpenAsync();
        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.SqlServer,
            TablesToIgnore = new[] { new Respawn.Graph.Table("__EFMigrationsHistory") },
        });
    }

    public async Task ResetDatabaseAsync()
    {
        if (_respawner is null) return;
        await using var connection = new SqlConnection(TestDbConnectionString);
        await connection.OpenAsync();
        await _respawner.ResetAsync(connection);
    }

    public new Task DisposeAsync() => Task.CompletedTask;

    public AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(TestDbConnectionString)
            .Options;
        return new AppDbContext(options);
    }
}
