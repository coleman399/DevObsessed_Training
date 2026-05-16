namespace AgpCommandStation.Api.Dtos;

public record WorkItemSummary(
    int Id,
    string Title,
    string State,
    string WorkItemType,
    string? Url
);

public record CreateWorkItemBody(string Description, string WorkItemType);

public record UpdateWorkItemStateBody(string State);

public record AddWorkItemCommentBody(string Text);

public record WorkItemDraftRequest(string Description, string WorkItemType);

public record WorkItemDraftResponse(
    string WorkItemType,
    string Title,
    string Description,
    string? ReproSteps,
    int? RemainingWork,
    string[]? AcceptanceCriteria,
    string[] Tags
);
