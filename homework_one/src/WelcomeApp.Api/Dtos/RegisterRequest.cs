using System.ComponentModel.DataAnnotations;

namespace WelcomeApp.Api.Dtos;

public class RegisterRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    // Cap input fed to PBKDF2 to prevent trivial DoS from a multi-MB password body.
    [Required]
    [StringLength(128, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;
}
