using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WelcomeApp.Api.Data;

namespace WelcomeApp.Api.Tests.Infrastructure;

// Lightweight IServiceScopeFactory backed by EF Core InMemory — for ChatService unit tests only.
public class InMemoryScopeFactory : IServiceScopeFactory
{
    private readonly DbContextOptions<AppDbContext> _options;

    public InMemoryScopeFactory(string dbName)
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
    }

    public AppDbContext CreateContext() => new(_options);

    public IServiceScope CreateScope() => new InMemoryScope(new AppDbContext(_options));

    private sealed class InMemoryScope : IServiceScope
    {
        private readonly AppDbContext _db;
        public IServiceProvider ServiceProvider { get; }

        public InMemoryScope(AppDbContext db)
        {
            _db = db;
            ServiceProvider = new InMemoryServiceProvider(db);
        }

        public void Dispose() => _db.Dispose();
    }

    private sealed class InMemoryServiceProvider : IServiceProvider
    {
        private readonly AppDbContext _db;
        public InMemoryServiceProvider(AppDbContext db) => _db = db;
        public object? GetService(Type serviceType) =>
            serviceType == typeof(AppDbContext) ? _db : null;
    }
}
