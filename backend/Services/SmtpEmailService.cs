using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using ThePainterBoys.Api.Configuration;

namespace ThePainterBoys.Api.Services;

public class SmtpEmailService(IOptions<EmailOptions> options, ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendAsync(string toAddress, string toName, string subject, string htmlBody, CancellationToken ct)
    {
        var o = options.Value;
        if (!o.IsConfigured)
        {
            logger.LogInformation("Email not configured (no SMTP host/username/password set) — skipped sending \"{Subject}\" to {To}.", subject, toAddress);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(o.FromName, o.FromAddress));
        message.To.Add(new MailboxAddress(toName, toAddress));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(o.SmtpHost, o.SmtpPort, SecureSocketOptions.StartTlsWhenAvailable, ct);
            await client.AuthenticateAsync(o.Username, o.Password, ct);
            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            // Email failures should never break the flow that triggered them
            // (e.g. sign-in) — log and move on rather than propagating.
            logger.LogError(ex, "Failed to send email \"{Subject}\" to {To}.", subject, toAddress);
        }
    }
}
