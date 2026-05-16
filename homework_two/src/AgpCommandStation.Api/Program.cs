using System.IdentityModel.Tokens.Jwt;
using System.Text;
using AgpCommandStation.Api.Data;
using AgpCommandStation.Api.Models;
using AgpCommandStation.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// EF Core + SQL Server LocalDB
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("Default")
        ?? "Server=(localdb)\\mssqllocaldb;Database=AgpCommandStation;Trusted_Connection=True;"));

// Identity (core only, no cookie UI) — used only for user storage
builder.Services
    .AddIdentityCore<ApplicationUser>(opts =>
    {
        opts.User.RequireUniqueEmail = true;
        opts.Password.RequiredLength = 1;
        opts.Password.RequireDigit = false;
        opts.Password.RequireLowercase = false;
        opts.Password.RequireUppercase = false;
        opts.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<AppDbContext>();

// JWT bearer (our app's own token)
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AgpCommandStation";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AgpCommandStation.Spa";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.MapInboundClaims = false;
        opts.TokenValidationParameters = new TokenValidationParameters
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
builder.Services.AddSingleton<IEncryptionService, EncryptionService>();
builder.Services.AddSingleton<IClaudePersonaService, ClaudePersonaService>();

// Anthropic chat
builder.Services.Configure<AnthropicChatOptions>(builder.Configuration.GetSection("Anthropic"));
builder.Services.AddHttpClient<IAnthropicChatService, AnthropicChatService>((sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AnthropicChatOptions>>().Value;
    client.BaseAddress = new Uri(opts.Endpoint.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromMinutes(3);
});

// Named HTTP client for DevOps proxy (no base address — org/project are dynamic per user)
builder.Services.AddHttpClient("devops", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// CORS
const string SpaCorsPolicy = "spa";
builder.Services.AddCors(opts =>
{
    opts.AddPolicy(SpaCorsPolicy, policy =>
    {
        var origin = builder.Configuration["Cors:SpaOrigin"] ?? "http://localhost:5173";
        policy.WithOrigins(origin).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo { Title = "AGP Command Station API", Version = "v1" });
    var bearer = new OpenApiSecurityScheme
    {
        Name = "Authorization", In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey, Scheme = "Bearer",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
    };
    opts.AddSecurityDefinition("Bearer", bearer);
    opts.AddSecurityRequirement(new OpenApiSecurityRequirement { [bearer] = [] });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    ctx.Response.Headers.Append("X-Frame-Options", "DENY");
    ctx.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});
app.UseCors(SpaCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public partial class Program { }
