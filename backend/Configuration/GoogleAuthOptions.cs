namespace ThePainterBoys.Api.Configuration;

/// <summary>Bound from the "GoogleAuth" section — see appsettings.json for the ClientId gap.</summary>
public class GoogleAuthOptions
{
    public const string SectionName = "GoogleAuth";
    public string ClientId { get; set; } = string.Empty;
}
