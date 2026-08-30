using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Services;

namespace ThePainterBoys.Api.Controllers;

/// <summary>
/// Manual trigger for SheetSyncService — see that class for what the sync
/// actually does. WeeklySheetSyncBackgroundService calls the same service
/// directly (no HTTP hop, no key needed) for the unattended weekly run.
/// </summary>
[ApiController]
[Route("api/admin/sheet-sync")]
[Authorize(Roles = UserRole.Admin)]
public class SheetSyncController(
    SheetSyncService sheetSyncService,
    SheetPushSyncService sheetPushSyncService,
    IConfiguration configuration) : ControllerBase
{
    // Lets an admin trigger this from a plain HTTP call without a live browser
    // session (e.g. a quick curl/Postman check) — set via the SheetSync__ApiKey
    // app setting. The normal admin-JWT path above still works unchanged; this
    // is purely an alternate way in, checked only when the header is present.
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<SyncResult>> Sync([FromHeader(Name = "X-Sync-Key")] string? syncKey, CancellationToken ct)
    {
        var configuredKey = configuration["SheetSync:ApiKey"];
        var byKey = !string.IsNullOrEmpty(configuredKey) && syncKey == configuredKey;
        var byAdmin = User.IsInRole(UserRole.Admin);
        if (!byKey && !byAdmin) return Unauthorized();

        try
        {
            return Ok(await sheetSyncService.SyncAsync(ct));
        }
        catch (Exception ex)
        {
            return StatusCode(502, $"Could not reach the Google Sheet: {ex.Message}");
        }
    }

    // Read-only — shows exactly what a Push would do (which clients get a new
    // row appended vs. an existing row updated) before anything is written.
    [HttpGet("push/preview")]
    [AllowAnonymous]
    public async Task<ActionResult<PushPreview>> PushPreview([FromHeader(Name = "X-Sync-Key")] string? syncKey, CancellationToken ct)
    {
        var configuredKey = configuration["SheetSync:ApiKey"];
        var byKey = !string.IsNullOrEmpty(configuredKey) && syncKey == configuredKey;
        var byAdmin = User.IsInRole(UserRole.Admin);
        if (!byKey && !byAdmin) return Unauthorized();

        try
        {
            return Ok(await sheetPushSyncService.PreviewAsync(ct));
        }
        catch (Exception ex)
        {
            return StatusCode(502, $"Could not reach the Google Sheet: {ex.Message}");
        }
    }

    // Same manual-trigger pattern as Sync above, for the opposite direction —
    // see SheetPushSyncService for what this actually writes and its known
    // limitation around portal-created entries.
    [HttpPost("push")]
    [AllowAnonymous]
    public async Task<ActionResult<PushResult>> Push([FromHeader(Name = "X-Sync-Key")] string? syncKey, CancellationToken ct)
    {
        var configuredKey = configuration["SheetSync:ApiKey"];
        var byKey = !string.IsNullOrEmpty(configuredKey) && syncKey == configuredKey;
        var byAdmin = User.IsInRole(UserRole.Admin);
        if (!byKey && !byAdmin) return Unauthorized();

        try
        {
            return Ok(await sheetPushSyncService.PushAsync(ct));
        }
        catch (Exception ex)
        {
            return StatusCode(502, $"Could not reach the Google Sheet: {ex.Message}");
        }
    }
}
