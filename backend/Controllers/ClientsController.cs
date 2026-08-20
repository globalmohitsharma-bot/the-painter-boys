using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

public record LinkUserRequest(string UserId);

[ApiController]
[Route("api/clients")]
[Authorize(Roles = UserRole.Admin)]
public class ClientsController(IClientRepository clientRepository, IUserRepository userRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Client>>> GetAll(CancellationToken ct)
        => Ok(await clientRepository.GetAllAsync(ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<Client>> GetById(string id, CancellationToken ct)
    {
        var client = await clientRepository.GetByIdAsync(id, ct);
        return client is null ? NotFound() : Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<Client>> Create([FromBody] Client client, CancellationToken ct)
    {
        client.Id = Guid.NewGuid().ToString();
        client.CreatedAt = DateTimeOffset.UtcNow;
        var saved = await clientRepository.UpsertAsync(client, ct);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Client>> Update(string id, [FromBody] Client client, CancellationToken ct)
    {
        var existing = await clientRepository.GetByIdAsync(id, ct);
        if (existing is null) return NotFound();
        client.Id = id;
        client.CreatedAt = existing.CreatedAt;
        var saved = await clientRepository.UpsertAsync(client, ct);
        return Ok(saved);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await clientRepository.DeleteAsync(id, ct);
        return NoContent();
    }

    /// <summary>
    /// Generates (or regenerates) a one-time invite token for this client — the admin
    /// shares the resulting link, and whoever signs in with Google through it gets
    /// linked directly, bypassing the need for the client's stored email to match.
    /// </summary>
    [HttpPost("{id}/generate-invite")]
    public async Task<ActionResult<Client>> GenerateInvite(string id, CancellationToken ct)
    {
        var client = await clientRepository.GetByIdAsync(id, ct);
        if (client is null) return NotFound("Client not found.");
        client.InviteToken = Guid.NewGuid().ToString("N");
        client.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await clientRepository.UpsertAsync(client, ct);
        return Ok(saved);
    }

    /// <summary>
    /// Manual fallback for when auto-linking (by email match on sign-in) didn't
    /// happen — e.g. the client's intake record has no email, or a typo means it
    /// doesn't match what they actually signed into Google with.
    /// </summary>
    [HttpPost("{id}/link-user")]
    public async Task<ActionResult<Client>> LinkUser(string id, [FromBody] LinkUserRequest request, CancellationToken ct)
    {
        var client = await clientRepository.GetByIdAsync(id, ct);
        if (client is null) return NotFound("Client not found.");
        var user = await userRepository.GetByIdAsync(request.UserId, ct);
        if (user is null) return NotFound("User not found.");

        // Clear any stale link on the client's previous user, and on the target
        // user's previous client, so a client/user is never linked to two of the
        // other side at once.
        if (!string.IsNullOrEmpty(client.LinkedUserId) && client.LinkedUserId != user.Id)
        {
            var oldUser = await userRepository.GetByIdAsync(client.LinkedUserId, ct);
            if (oldUser is not null) { oldUser.LinkedClientId = null; await userRepository.UpsertAsync(oldUser, ct); }
        }
        if (!string.IsNullOrEmpty(user.LinkedClientId) && user.LinkedClientId != client.Id)
        {
            var oldClient = await clientRepository.GetByIdAsync(user.LinkedClientId, ct);
            if (oldClient is not null) { oldClient.LinkedUserId = null; await clientRepository.UpsertAsync(oldClient, ct); }
        }

        user.LinkedClientId = client.Id;
        await userRepository.UpsertAsync(user, ct);
        client.LinkedUserId = user.Id;
        client.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await clientRepository.UpsertAsync(client, ct);
        return Ok(saved);
    }

    [HttpPost("{id}/unlink-user")]
    public async Task<ActionResult<Client>> UnlinkUser(string id, CancellationToken ct)
    {
        var client = await clientRepository.GetByIdAsync(id, ct);
        if (client is null) return NotFound("Client not found.");

        if (!string.IsNullOrEmpty(client.LinkedUserId))
        {
            var user = await userRepository.GetByIdAsync(client.LinkedUserId, ct);
            if (user is not null) { user.LinkedClientId = null; await userRepository.UpsertAsync(user, ct); }
        }
        client.LinkedUserId = null;
        client.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await clientRepository.UpsertAsync(client, ct);
        return Ok(saved);
    }
}
