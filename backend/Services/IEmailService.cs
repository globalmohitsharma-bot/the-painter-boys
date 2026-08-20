namespace ThePainterBoys.Api.Services;

public interface IEmailService
{
    /// <summary>
    /// Sends an HTML email. No-ops (logs and returns) rather than throwing when
    /// SMTP isn't configured yet, so email being unset never breaks sign-in or
    /// any other flow that triggers a send.
    /// </summary>
    Task SendAsync(string toAddress, string toName, string subject, string htmlBody, CancellationToken ct);
}
