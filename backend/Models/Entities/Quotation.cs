using System.Text.Json.Serialization;

namespace ThePainterBoys.Api.Models.Entities;

/// <summary>
/// A saved quotation an admin has generated and shared — kept so it can be
/// reopened, edited, and re-shared later without retyping everything, e.g.
/// after a customer asks for a revised price. Independent of Client/Project:
/// a quotation is often prepared before a client record exists at all (see
/// AdminPortal.jsx's "Create Client from This Quotation" for the point
/// where one may later turn into a real client).
/// </summary>
public class Quotation
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("mobile")]
    public string Mobile { get; set; } = string.Empty;

    [JsonPropertyName("society")]
    public string Society { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    /// <summary>Free-text property description — "Shop", "Home", "3 BHK Flat", etc.</summary>
    [JsonPropertyName("bhk")]
    public string Bhk { get; set; } = string.Empty;

    /// <summary>Comma-joined tile selections, same convention as Project.PaintType.</summary>
    [JsonPropertyName("paintType")]
    public string PaintType { get; set; } = string.Empty;

    /// <summary>Comma-joined tile selections, same convention as Project.WorkProcess.</summary>
    [JsonPropertyName("workProcess")]
    public string WorkProcess { get; set; } = string.Empty;

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
