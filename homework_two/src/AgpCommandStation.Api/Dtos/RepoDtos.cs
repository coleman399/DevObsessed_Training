namespace AgpCommandStation.Api.Dtos;

// ── Shared tree node (normalized from ADO + GitHub) ───────────────────────────

public record TreeNode(string Name, string Type, string Path); // type: "file" | "folder"

public record FileContent(string Path, string Content, string Language, string? Url);

// ── Repos ────────────────────────────────────────────────────────────────────

public record RepoSummary(string Id, string Name, string Platform, string? DefaultBranch, string? Url);

public record BranchSummary(string Name, bool IsDefault);

public record CommitSummary(string Id, string Message, string Author, string Date);

// ── Pull Requests ─────────────────────────────────────────────────────────────

public record PullRequestSummary(
    string Id,
    string Title,
    string SourceBranch,
    string TargetBranch,
    string Author,
    string Status,
    string Platform,
    string RepoId,
    string RepoName,
    string? Url,
    string? Description
);

public record CreatePrRequest(
    string Title,
    string Body,
    string SourceBranch,
    string TargetBranch
);

public record VoteRequest(int Vote); // 10=approve, -10=reject, 0=reset

public record AddPrThreadRequest(string Text);

// ── PR draft / summary ────────────────────────────────────────────────────────

public record PrDraftRequest(
    string Platform,        // "ado" | "github"
    string RepoId,          // ADO repo GUID or "owner/repo" for GitHub
    string SourceBranch,
    string TargetBranch
);

public record PrDraftResponse(string Title, string Body);

public record PrSummaryRequest(
    string Title,
    string? Description,
    string[] ChangedFiles
);

public record ReviewRequest(string Body, string Event); // APPROVE | REQUEST_CHANGES | COMMENT
