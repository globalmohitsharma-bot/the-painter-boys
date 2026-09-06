using System.Text.Json.Serialization;

namespace ThePainterBoys.Api.Models.Entities;

public class TokenHistoryEntry
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    /// <summary>Soft-hide a mistaken/incorrect payment entry — pulled out of
    /// the receipt, WhatsApp text, and tokenReceived/pendingAmount by the
    /// frontend, but kept here (not deleted) so an admin can restore it.</summary>
    [JsonPropertyName("archived")]
    public bool Archived { get; set; }

    /// <summary>"payment" (default, omitted for older entries) or "discount" —
    /// a redeemed DiscountCoupon appends a "discount" entry here so it counts
    /// toward tokenReceived/pendingAmount exactly like a real payment, while
    /// still being labeled distinctly on the receipt/history UI.</summary>
    [JsonPropertyName("kind")]
    public string Kind { get; set; } = "payment";

    /// <summary>Set only on "discount" entries — the coupon code that was
    /// redeemed to create this entry, kept for traceability back to
    /// DiscountCoupon.</summary>
    [JsonPropertyName("couponCode")]
    public string? CouponCode { get; set; }
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

    /// <summary>Soft hide/archive, independent of Progress — a deactivated project
    /// isn't necessarily Cancelled (e.g. a duplicate entry), and a Cancelled job
    /// isn't necessarily meant to disappear from view. Missing on older documents
    /// deserializes to this default (true), so nothing already stored is hidden.</summary>
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

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

    /// <summary>The work steps committed to the customer, e.g. "2 Coat Putty,
    /// Primer, 2 Coat Paint" — a comma-joined list, same convention as PaintType,
    /// so both can grow their tile options without a schema change.</summary>
    [JsonPropertyName("workProcess")]
    public string WorkProcess { get; set; } = string.Empty;

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

    /// <summary>Short code an admin hands a customer (WhatsApp/call) so they can
    /// self-request access to this project from their dashboard — see
    /// MyProjectsController.LinkByCode. Null until an admin generates one.</summary>
    [JsonPropertyName("linkCode")]
    public string? LinkCode { get; set; }

    /// <summary>Original row number from the migrated Google Sheet, kept for traceability.</summary>
    [JsonPropertyName("sheetRef")]
    public string SheetRef { get; set; } = string.Empty;

    /// <summary>Set once this project (created directly in the Admin Portal, no
    /// SheetRef) has been appended to the Google Sheet by SheetPushSyncService —
    /// guards against appending the same project twice on repeated sync runs.
    /// The Apps Script's append action doesn't return a row number, so a
    /// portal-created project can't be safely targeted for further row updates
    /// after its first push; this flag only prevents duplicate rows.</summary>
    [JsonPropertyName("pushedToSheet")]
    public bool PushedToSheet { get; set; }

    /// <summary>Explicitly set on create/update (see ProjectsController,
    /// ProjectRepository) — the fixed 2026-01-01 default below only ever
    /// surfaces for documents saved before these fields existed, so it
    /// reads as a stable "before we tracked this" marker rather than
    /// recomputing to "now" on every fetch (which DateTimeOffset.UtcNow as
    /// a default would do, since C# property initializers evaluate at
    /// deserialization time when the JSON field is absent).</summary>
    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; } = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [JsonPropertyName("updatedAt")]
    public DateTimeOffset UpdatedAt { get; set; } = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
}
