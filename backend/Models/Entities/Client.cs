using System.Text.Json.Serialization;

namespace ThePainterBoys.Api.Models.Entities;

/// <summary>
/// A client/lead record — exists independent of whether they've ever signed in.
/// Once a client signs in via Google on the public site and their email matches,
/// LinkedUserId gets set to the matching PB_Users document's id.
/// </summary>
public class Client
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("contactName")]
    public string ContactName { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("society")]
    public string Society { get; set; } = string.Empty;

    [JsonPropertyName("customerUrl")]
    public string CustomerUrl { get; set; } = string.Empty;

    [JsonPropertyName("linkedUserId")]
    public string? LinkedUserId { get; set; }

    /// <summary>
    /// Set when an admin generates a "sign in to link your account" link for this
    /// client — whoever signs in with Google via that link gets linked directly,
    /// bypassing the email-match requirement. Cleared after first successful use.
    /// </summary>
    [JsonPropertyName("inviteToken")]
    public string? InviteToken { get; set; }

    /// <summary>Original row number from the migrated Google Sheet, kept for traceability.</summary>
    [JsonPropertyName("sheetRef")]
    public string SheetRef { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
