using System.Net;
using System.Text;

namespace WelcomeApp.Api.Tests.Infrastructure;

// Replays a pre-built SSE body so ChatService can be unit-tested without hitting GitHub Models.
public class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly string _sseBody;
    private readonly HttpStatusCode _statusCode;

    public FakeHttpMessageHandler(string sseBody, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        _sseBody = sseBody;
        _statusCode = statusCode;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = new HttpResponseMessage(_statusCode)
        {
            Content = new StringContent(_sseBody, Encoding.UTF8, "text/event-stream")
        };
        return Task.FromResult(response);
    }

    public static string BuildSseBody(params string[] tokens)
    {
        var sb = new StringBuilder();
        foreach (var token in tokens)
        {
            var escaped = token.Replace("\"", "\\\"");
            sb.AppendLine($"data: {{\"choices\":[{{\"delta\":{{\"content\":\"{escaped}\"}},\"finish_reason\":null,\"index\":0}}]}}");
            sb.AppendLine();
        }
        sb.AppendLine("data: [DONE]");
        return sb.ToString();
    }
}
