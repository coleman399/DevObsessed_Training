using System.ComponentModel.DataAnnotations;

namespace WelcomeApp.Api.Dtos;

public class SendMessageRequest
{
    // 4000 chars is our input cap to keep requests bounded — not the GitHub Models token limit (which is much higher).
    [Required]
    [StringLength(4000)]
    public string Message { get; set; } = string.Empty;
}
