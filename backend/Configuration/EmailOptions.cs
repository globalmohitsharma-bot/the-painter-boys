namespace ThePainterBoys.Api.Configuration;

/// <summary>Bound from the "Email" section of appsettings.json / app settings.</summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>SMTP host, e.g. smtpout.secureserver.net for GoDaddy-hosted mailboxes.</summary>
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "The Painter Boys";

    /// <summary>True once SmtpHost/Username/Password are all actually set — lets callers skip sending gracefully rather than failing.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(SmtpHost) && !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password);
}
