using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

public record MyProjectDto(
    string Id, string Name, string Progress, string PaintType,
    string DateContacted, string DateStarted, string DateCompleted,
    decimal Amount, decimal TokenReceived, decimal PendingAmount,
    List<TokenHistoryEntry> TokenHistory, List<ProjectImage> Images,
    string? ClientSociety, string? ClientAddress);

public record LinkByCodeRequest(string Code);

/// <summary>
/// Customer-facing (any signed-in role, not Admin-only) view of a user's own
/// projects — via their linked Client record, plus anything an admin has
/// explicitly shared with them via ProjectShare, independent of that link.
/// </summary>
[ApiController]
[Route("api/my-projects")]
[Authorize]
public class MyProjectsController(
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    IClientRepository clientRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MyProjectDto>>> GetMine(CancellationToken ct)
    {
        var userId = User.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userId)) return Ok(new List<MyProjectDto>());

        var user = await userRepository.GetByIdAsync(userId, ct);
        if (user is null) return Ok(new List<MyProjectDto>());

        var projects = new List<Project>();
        Client? linkedClient = null;
        if (!string.IsNullOrEmpty(user.LinkedClientId))
        {
            linkedClient = await clientRepository.GetByIdAsync(user.LinkedClientId, ct);
            projects.AddRange(await projectRepository.GetByClientIdAsync(user.LinkedClientId, ct));
        }

        var shared = await projectRepository.GetSharedWithUserAsync(userId, ct);
        foreach (var p in shared)
        {
            if (projects.All(existing => existing.Id != p.Id)) projects.Add(p);
        }

        var clientCache = new Dictionary<string, Client?> { [user.LinkedClientId ?? ""] = linkedClient };
        var dtos = new List<MyProjectDto>();
        foreach (var p in projects)
        {
            if (!clientCache.TryGetValue(p.ClientId, out var client))
            {
                client = await clientRepository.GetByIdAsync(p.ClientId, ct);
                clientCache[p.ClientId] = client;
            }
            dtos.Add(new MyProjectDto(
                p.Id, p.Name, p.Progress, p.PaintType,
                p.DateContacted, p.DateStarted, p.DateCompleted,
                p.Amount, p.TokenReceived, p.PendingAmount,
                p.TokenHistory, p.Images,
                client?.Society, client?.Address));
        }

        return Ok(dtos);
    }

    /// <summary>Self-service request to see a project — the code comes from an admin
    /// out-of-band (WhatsApp/call). Creates a hidden (pending) share rather than an
    /// immediately-visible one, so it only shows up on the dashboard once an admin
    /// approves it from the Pending Links view (the same show/hide toggle admins
    /// already use for shares generally).</summary>
    [HttpPost("link")]
    public async Task<IActionResult> LinkByCode([FromBody] LinkByCodeRequest request, CancellationToken ct)
    {
        var userId = User.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var code = (request.Code ?? "").Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(code)) return BadRequest("Enter a code.");

        var project = await projectRepository.GetByLinkCodeAsync(code, ct);
        if (project is null) return NotFound("That code doesn't match any project. Double-check it with your painter.");

        var existing = project.SharedWith.FirstOrDefault(s => s.UserId == userId);
        if (existing is not null)
        {
            return Ok(new { status = existing.Visible ? "already-linked" : "already-pending" });
        }

        project.SharedWith.Add(new ProjectShare { UserId = userId, Visible = false });
        project.UpdatedAt = DateTimeOffset.UtcNow;
        await projectRepository.UpsertAsync(project, ct);
        return Ok(new { status = "requested" });
    }

    /// <summary>Self-service "I don't have a code, please help" request — no project
    /// is known yet, so this just flags the caller's own User record. Shows up in
    /// the Admin Portal's Requests queue (see UsersController) until an admin finds
    /// and shares the right project, then marks it resolved.</summary>
    [HttpPost("request-link")]
    public async Task<IActionResult> RequestLink(CancellationToken ct)
    {
        var userId = User.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await userRepository.GetByIdAsync(userId, ct);
        if (user is null) return Unauthorized();

        if (user.ProjectRequestPending) return Ok(new { status = "already-pending" });

        user.ProjectRequestPending = true;
        user.ProjectRequestedAt = DateTimeOffset.UtcNow;
        await userRepository.UpsertAsync(user, ct);
        return Ok(new { status = "requested" });
    }
}
