namespace ThePainterBoys.Api.Configuration;

/// <summary>Bound from the "BlobStorage" section of appsettings.json / app settings.</summary>
public class BlobStorageOptions
{
    public const string SectionName = "BlobStorage";

    public string AccountUrl { get; set; } = string.Empty;
    public string ProjectPhotosContainer { get; set; } = "project-photos";
}
