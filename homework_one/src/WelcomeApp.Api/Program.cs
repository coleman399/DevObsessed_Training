using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using WelcomeApp.Api.Data;
using WelcomeApp.Api.Models;
using WelcomeApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// EF Core + SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Identity (Core only — no cookie scheme, no MVC UI). JWT bearer is the only auth scheme.
// Password policy is deliberately weak to match the prototype UX; documented in plans/implementation-plan.md.
builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<AppDbContext>();

// JWT bearer authentication
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is not configured. Run `dotnet user-secrets set \"Jwt:Key\" \"<32+ chars>\"` from homework_one/src/WelcomeApp.Api/.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "WelcomeApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "WelcomeApp.Spa";

// Stop the SOAP-URI claim rewriting so raw claim names (sub, email, name) survive.
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // .NET 8's default handler is JsonWebTokenHandler; JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()
        // only affects the legacy handler. MapInboundClaims = false stops the new handler from rewriting
        // "sub"/"email"/"name" to the SOAP-URI ClaimTypes.* variants. Without this, MeController.User.FindFirstValue("sub")
        // returns null because "sub" was mapped to ClaimTypes.NameIdentifier.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            NameClaimType = JwtRegisteredClaimNames.Name,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorization();

// Application services
builder.Services.AddScoped<IUserRegistrationService, UserRegistrationService>();

// CORS — JWT in Authorization header, so no AllowCredentials.
const string SpaCorsPolicy = "spa";
builder.Services.AddCors(options =>
{
    options.AddPolicy(SpaCorsPolicy, policy =>
    {
        var spaOrigin = builder.Configuration["Cors:SpaOrigin"] ?? "http://localhost:5173";
        policy.WithOrigins(spaOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "WelcomeApp API", Version = "v1" });

    var bearerScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Paste the JWT from /api/auth/login. Include the word \"Bearer\" before the token.",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
    };
    options.AddSecurityDefinition("Bearer", bearerScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [bearerScheme] = Array.Empty<string>(),
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // HTTPS redirect only outside dev — the Vite proxy targets HTTP in development.
    app.UseHttpsRedirection();
}

app.UseRouting();

// Security headers — cheap baseline against the JWT-in-localStorage XSS surface called out in plans/.
app.Use(async (ctx, next) =>
{
    var headers = ctx.Response.Headers;
    headers.Append("X-Content-Type-Options", "nosniff");
    headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.Append("X-Frame-Options", "DENY");
    if (!ctx.Request.Path.StartsWithSegments("/swagger"))
    {
        headers.Append("Content-Security-Policy", "default-src 'self'");
    }
    await next();
});

app.UseCors(SpaCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// Exposes the generated Program class to WebApplicationFactory<Program> in the test project.
public partial class Program { }
