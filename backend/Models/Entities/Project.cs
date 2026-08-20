using System.Text.Json.Serialization;

namespace ThePainterBoys.Api.Models.Entities;

public class TokenHistoryEntry
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public class ProjectImage
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("caption")]
    public string Caption { get; set; } = string.Empty;

    [JsonPropertyName("uploadedAt")]
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Grants a signed-in user (role Client) visibility into a project directly —
/// independent of the 1:1 Client.LinkedUserId auto-match, so an admin can share
/// a project with someone whose account isn't (or shouldn't be) the project's
/// primary linked client, and can hide it again without deleting the grant.
/// </summary>
public class ProjectShare
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("visible")]
    public bool Visible { get; set; } = true;

    [JsonPropertyName("sharedAt")]
    public DateTimeOffset SharedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>A painting job/project, linked to a Client via ClientId.</summary>
public class Project
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    /// <summary>Short identifying name for the project, e.g. "3BHK Interior Repaint" — distinct from paintType so a client with multiple projects can tell them apart at a glance.</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("progress")]
    public string Progress { get; set; } = "Inquiry";

    [JsonPropertyName("paintType")]
    public string PaintType { get; set; } = string.Empty;

    [JsonPropertyName("dateContacted")]
    public string DateContacted { get; set; } = string.Empty;

    [JsonPropertyName("dateStarted")]
    public string DateStarted { get; set; } = string.Empty;

    [JsonPropertyName("dateCompleted")]
    public string DateCompleted { get; set; } = string.Empty;

    [JsonPropertyName("remarks")]
    public string Remarks { get; set; } = string.Empty;

    [JsonPropertyName("noOfDays")]
    public string NoOfDays { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("otherDetails")]
    public string OtherDetails { get; set; } = string.Empty;

    [JsonPropertyName("painterNames")]
    public List<string> PainterNames { get; set; } = [];

    [JsonPropertyName("tokenReceived")]
    public decimal TokenReceived { get; set; }

    [JsonPropertyName("pendingAmount")]
    public decimal PendingAmount { get; set; }

    [JsonPropertyName("tokenHistory")]
    public List<TokenHistoryEntry> TokenHistory { get; set; } = [];

    [JsonPropertyName("additionalWork")]
    public string AdditionalWork { get; set; } = string.Empty;

    [JsonPropertyName("images")]
    public List<ProjectImage> Images { get; set; } = [];

    [JsonPropertyName("sharedWith")]
    public List<ProjectShare> SharedWith { get; set; } = [];

    /// <summary>Original row number from the migrated Google Sheet, kept for traceability.</summary>
    [JsonPropertyName("sheetRef")]
    public string SheetRef { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
