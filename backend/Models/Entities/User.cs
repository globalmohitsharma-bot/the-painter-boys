using System.Text.Json.Serialization;

namespace ThePainterBoys.Api.Models.Entities;

/// <summary>
/// Staff (Admin/Manager/Partner) and, eventually, signed-in clients (role "Client")
/// share this one container — role is what distinguishes them and drives access.
/// Only Admin is fully wired up for now, per current scope.
/// </summary>
public static class UserRole
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string Partner = "Partner";
    public const string Client = "Client";
}

public class User
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = UserRole.Client;

    /// <summary>Google's `sub` claim — set on first sign-in, null for staff seeded before they've signed in.</summary>
    [JsonPropertyName("authProviderId")]
    public string? AuthProviderId { get; set; }

    /// <summary>Set when this user (role Client) is matched to a Client record by email.</summary>
    [JsonPropertyName("linkedClientId")]
    public string? LinkedClientId { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [JsonPropertyName("lastLoginAt")]
    public DateTimeOffset? LastLoginAt { get; set; }

    /// <summary>Set when this customer has asked (from the dashboard) for an
    /// admin to link a project to their account without already knowing a
    /// code — shown in the Admin Portal's Requests queue until resolved.</summary>
    [JsonPropertyName("projectRequestPending")]
    public bool ProjectRequestPending { get; set; }

    [JsonPropertyName("projectRequestedAt")]
    public DateTimeOffset? ProjectRequestedAt { get; set; }
}
