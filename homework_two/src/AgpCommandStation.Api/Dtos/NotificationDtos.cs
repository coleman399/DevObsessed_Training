namespace AgpCommandStation.Api.Dtos;

public record NotificationDto(
    string Id,
    string Type,         // "mention" | "pr_review" | "work_item" | "email" | "meeting"
    string Title,
    string Body,
    string PanelTarget,
    string Timestamp,
    bool IsRead
);
