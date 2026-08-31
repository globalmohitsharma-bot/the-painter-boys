namespace ThePainterBoys.Api.Services;

public interface IEmailService
{
    /// <summary>
    /// Sends an HTML email. Never throws — no-ops when SMTP isn't configured,
    /// and swallows a failed send — so email being unset or briefly down never
    /// breaks sign-in or any other flow that triggers a send. Returns whether
    /// it actually sent (true) or silently skipped/failed (false), for the one
    /// caller that needs to know — the SMTP health-check endpoint — while every
    /// other caller is free to ignore the return value exactly as before.
    /// </summary>
    Task<bool> SendAsync(string toAddress, string toName, string subject, string htmlBody, CancellationToken ct);
}
