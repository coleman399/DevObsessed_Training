using System.Net.Http.Headers;
using System.Net.Http.Json;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Dtos;

namespace WelcomeApp.Api.Tests.Infrastructure;

[Collection(ApiCollection.Name)]
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected ApiFactory Factory { get; }
    protected HttpClient Client { get; }

    protected IntegrationTestBase(ApiFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await Factory.ResetDatabaseAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    protected AppDbContext CreateDbContext() => Factory.CreateDbContext();

    protected async Task<(AuthResponse Auth, HttpClient Authed)> RegisterAsync(
        string name = "Jane Doe",
        string email = "jane@example.com",
        string password = "Pass123")
    {
        var response = await Client.PostAsJsonAsync("/api/auth/register",
            new { name, email, password });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Empty auth response.");
        var authed = Factory.CreateClient();
        authed.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return (auth, authed);
    }

    protected async Task<HttpClient> LoginAsync(string email, string password)
    {
        var response = await Client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Empty auth response.");
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return client;
    }
}
