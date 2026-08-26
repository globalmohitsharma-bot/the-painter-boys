using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = UserRole.Admin)]
public class UsersController(IUserRepository userRepository, IDataProtectionProvider dataProtectionProvider) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAll(CancellationToken ct)
        => Ok(await userRepository.GetAllAsync(ct));

    /// <summary>
    /// Issues a short-lived "view as this user" token an admin can use in place
    /// of a real Google ID token — see GoogleTokenAuthenticationHandler for how
    /// it's recognized and unwrapped. Deliberately carries the target's own
    /// role (never Admin), so an impersonation session can only ever do what
    /// that customer could already do, nothing more.
    /// </summary>
    [HttpPost("{id}/impersonate")]
    public async Task<ActionResult<object>> Impersonate(string id, CancellationToken ct)
    {
        var user = await userRepository.GetByIdAsync(id, ct);
        if (user is null) return NotFound("User not found.");

        var protector = dataProtectionProvider.CreateProtector(Auth.GoogleTokenAuthenticationHandler.ImpersonationPurpose)
            .ToTimeLimitedDataProtector();
        var payload = protector.Protect(user.Id, TimeSpan.FromHours(2));
        return Ok(new { token = Auth.GoogleTokenAuthenticationHandler.ImpersonationPrefix + payload, user.Name, user.Email });
    }

    /// <summary>Clears a customer's "please link my project" request — call once
    /// an admin has found and shared the right project with them (see
    /// MyProjectsController.RequestLink for where the flag gets set).</summary>
    [HttpPost("{id}/resolve-request")]
    public async Task<ActionResult<User>> ResolveRequest(string id, CancellationToken ct)
    {
        var user = await userRepository.GetByIdAsync(id, ct);
        if (user is null) return NotFound("User not found.");

        user.ProjectRequestPending = false;
        var saved = await userRepository.UpsertAsync(user, ct);
        return Ok(saved);
    }
}
