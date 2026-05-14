using WelcomeApp.Api.Dtos;

namespace WelcomeApp.Api.Services;

public interface IChatService
{
    Task<ConversationDetailDto> StartConversationAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ConversationSummaryDto>> ListConversationsAsync(string userId, CancellationToken ct = default);
    Task<ConversationDetailDto?> GetConversationAsync(string userId, string conversationId, CancellationToken ct = default);
    Task<bool> UpdateTitleAsync(string userId, string conversationId, string newTitle, CancellationToken ct = default);
    IAsyncEnumerable<string> StreamReplyAsync(string userId, string conversationId, string userText, CancellationToken ct = default);
}
