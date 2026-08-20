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
}
