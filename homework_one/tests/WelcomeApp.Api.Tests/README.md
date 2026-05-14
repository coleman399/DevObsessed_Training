# WelcomeApp.Api.Tests

xUnit integration + unit tests for the WelcomeApp API. Runs against the same SQL Server LocalDB
provider as production (no SQLite swap) so green tests genuinely mean production code works.

## Prerequisites

- `(localdb)\MSSQLLocalDB` instance available
- `dotnet-ef` 8.x global tool installed
- The `Jwt:Key` user-secret is **not** required for tests — `ApiFactory` injects an in-memory
  config override

## One-time setup — migrate the test database

The test fixture does not auto-migrate. Create + migrate the dedicated test DB once:

```powershell
cd homework_one/src/WelcomeApp.Api
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;"
```

If the schema later drifts:

```powershell
dotnet ef database drop --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;" --force
dotnet ef database update --connection "Server=(localdb)\MSSQLLocalDB;Database=sqldb-welcomeapp-tests;Trusted_Connection=True;TrustServerCertificate=True;"
```

## Run the tests

```powershell
cd homework_one
dotnet test tests/WelcomeApp.Api.Tests
```

## Per-test isolation

Each integration test starts with a Respawn `ResetAsync` (TRUNCATE-equivalent in FK order;
leaves `__EFMigrationsHistory` alone). Tests within `ApiCollection` run serially, so the
per-test reset stays correct even though they share a single `WebApplicationFactory`.
