using System.Text.Json.Serialization;

namespace ThePainterBoys.Api.Models.Entities;

/// <summary>
/// An admin-generated discount, bound to one specific Project. The admin
/// shares the Code with the client (via the same WhatsApp share-card pattern
/// as Receipt/Quotation/Thank You), the client reads it back to the admin by
/// phone, and the admin redeems it in the Admin Portal — there's no
/// self-service customer-side redemption flow. Redeeming appends a
/// TokenHistoryEntry (Kind "discount") to the linked Project, so it reduces
/// PendingAmount exactly like a real payment would.
/// </summary>
public class DiscountCoupon
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("projectId")]
    public string ProjectId { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    /// <summary>8-character alphanumeric, uppercase — generated server-side,
    /// never chosen by the admin, so it can't collide with a guessable value.</summary>
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("discountAmount")]
    public decimal DiscountAmount { get; set; }

    /// <summary>Why the discount was given — e.g. "Loyalty Discount",
    /// "Membership Discount", "Special Discount" — shown on the share-card
    /// template and the receipt entry it creates on redemption. Free text so
    /// new categories don't need a schema change, same convention as
    /// Project.PaintType/WorkProcess.</summary>
    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Always CreatedAt + 7 days — not admin-editable.</summary>
    [JsonPropertyName("expiresAt")]
    public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddDays(7);

    [JsonPropertyName("redeemedAt")]
    public DateTimeOffset? RedeemedAt { get; set; }

    [JsonPropertyName("isRedeemed")]
    public bool IsRedeemed { get; set; }
}
