using System.Text.Json;

public sealed record JsonResult(bool Success, string? Method = null, string? TargetWindow = null, string? ErrorCode = null, string? Message = null)
{
    public string ToJson() => JsonSerializer.Serialize(new
    {
        success = Success,
        method = Method,
        targetWindow = TargetWindow,
        errorCode = ErrorCode,
        message = Message
    });
}
