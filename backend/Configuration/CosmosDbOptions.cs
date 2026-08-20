namespace ThePainterBoys.Api.Configuration;

/// <summary>Bound from the "CosmosDb" section of appsettings.json / app settings.</summary>
public class CosmosDbOptions
{
    public const string SectionName = "CosmosDb";

    public string AccountEndpoint { get; set; } = string.Empty;
    public string AccountKey { get; set; } = string.Empty;

    // Shares the `pilotai` Cosmos account with other, unrelated projects — the
    // PB_ prefix on the database and every container keeps this isolated from
    // their existing databases/containers (see deployment.md for the full
    // account layout and RU-headroom notes).
    public string DatabaseName { get; set; } = "PB_ThePainterBoysDb";

    public string ClientsContainer { get; set; } = "PB_ClientsDetails";
    public string ProjectsContainer { get; set; } = "PB_ProjectDetails";
    public string UsersContainer { get; set; } = "PB_Users";
}
