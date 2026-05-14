namespace WelcomeApp.Api.Dtos;

public record StatsResponse(
    int Drafts,
    int PendingInvites,
    string WorkspaceName,
    int MemberCount,
    string Plan);
