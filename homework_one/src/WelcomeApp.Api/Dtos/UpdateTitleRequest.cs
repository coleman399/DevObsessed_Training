using System.ComponentModel.DataAnnotations;

namespace WelcomeApp.Api.Dtos;

public class UpdateTitleRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;
}
