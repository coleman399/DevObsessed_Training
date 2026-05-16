namespace AgpCommandStation.Api.Dtos;

// ── Mail ──────────────────────────────────────────────────────────────────────

public record MailMessage(
    string Id,
    string Subject,
    string FromName,
    string FromEmail,
    string ReceivedAt,
    string BodyPreview,
    bool IsRead
);

public record MailMessageDetail(
    string Id,
    string Subject,
    string FromName,
    string FromEmail,
    string ReceivedAt,
    string Body
);

public record SendMailRequest(
    string ToEmail,
    string Subject,
    string Body,
    string? ReplyToMessageId
);

public record EmailDraftRequest(string EmailBody, string EmailSubject);

public record EmailDraftResponse(string Subject, string Body);

// ── Calendar ─────────────────────────────────────────────────────────────────

public record CalendarEvent(
    string Id,
    string Title,
    string Start,
    string End,
    bool IsAllDay,
    string? JoinUrl,
    string? Location,
    string[]? Attendees
);

public record CreateEventRequest(
    string Title,
    string StartTime,
    string EndTime,
    string[]? Attendees,
    string? Description,
    bool AddTeamsMeeting
);

public record EventDraftRequest(string Description);

public record EventDraftResponse(
    string Title,
    string StartTime,
    string EndTime,
    string[] Attendees,
    string Description
);

// ── Teams ─────────────────────────────────────────────────────────────────────

public record TeamsChat(
    string Id,
    string Topic,
    string LastMessagePreview,
    string LastMessageAt
);

public record ChannelMessage(
    string Id,
    string Sender,
    string SentAt,
    string Content
);

public record SendChannelMessageRequest(string Content);

public record MessagePolishRequest(string Message);

public record MessagePolishResponse(string PolishedMessage);
