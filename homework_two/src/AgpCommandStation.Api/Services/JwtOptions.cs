namespace AgpCommandStation.Api.Services;
public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "AgpCommandStation";
    public string Audience { get; set; } = "AgpCommandStation.Spa";
    public int ExpiresMinutes { get; set; } = 60;
}
