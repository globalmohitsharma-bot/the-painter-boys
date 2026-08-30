using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;
using ThePainterBoys.Api.Services;

namespace ThePainterBoys.Api.Controllers;

public record GoogleSignInRequest(string IdToken, string? InviteToken = null);
public record WhoAmIResponse(string Email, string Name, string Role, bool IsStaff, string? Picture = null);

[ApiController]
[Route("api/auth")]
public class AuthController(
    IUserRepository userRepository,
    IClientRepository clientRepository,
    IEmailService emailService,
    IOptions<GoogleAuthOptions> googleAuthOptions,
    IHostEnvironment hostEnvironment,
    IConfiguration configuration) : ControllerBase
{
    // Mirrors GoogleTokenAuthenticationHandler's dev-bypass gate — see the
    // detailed comment there. The token strings are public (ship in the JS
    // bundle); this private, App-Service-only key is what actually keeps
    // the bypass closed once deployed.
    private bool HasValidDevTestKey()
    {
        var configuredKey = configuration["DevBypass:ApiKey"];
        if (string.IsNullOrEmpty(configuredKey)) return false;
        return Request.Headers.TryGetValue("X-Dev-Test-Key", out var provided) && provided == configuredKey;
    }

    /// <summary>
    /// Verifies a Google ID token and reports the caller's role. Does NOT create a
    /// staff account on sign-in — Admin/Manager/Partner rows in PB_Users are seeded
    /// deliberately (see deployment.md), so an unrecognized email just comes back
    /// as role "Client" (or gets a fresh Client-role user record + linked to a
    /// matching PB_ClientsDetails row by email, for the public customer portal).
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<WhoAmIResponse>> SignInWithGoogle([FromBody] GoogleSignInRequest request, CancellationToken ct)
    {
        var devBypassAllowed = hostEnvironment.IsDevelopment() || HasValidDevTestKey();

        GoogleJsonWebSignature.Payload payload;
        if (devBypassAllowed && request.IdToken == Auth.GoogleTokenAuthenticationHandler.DevTestToken)
        {
            payload = new GoogleJsonWebSignature.Payload { Email = Auth.GoogleTokenAuthenticationHandler.DevTestEmail, Name = "Test User", Subject = "dev-test-subject" };
        }
        else if (devBypassAllowed && request.IdToken == Auth.GoogleTokenAuthenticationHandler.DevTestAdminToken)
        {
            payload = new GoogleJsonWebSignature.Payload { Email = Auth.GoogleTokenAuthenticationHandler.DevTestAdminEmail, Name = "Test Admin", Subject = "dev-test-admin-subject" };
        }
        else
        {
            var clientId = googleAuthOptions.Value.ClientId;
            if (string.IsNullOrEmpty(clientId))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Google sign-in is not configured on this server.");
            }
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized("Invalid Google credential.");
            }
        }

        var user = await userRepository.GetByEmailAsync(payload.Email, ct);
        var isNewUser = user is null;
        if (user is null)
        {
            user = new User { Email = payload.Email, Name = payload.Name ?? payload.Email, Role = UserRole.Client };
        }

        // An invite link (admin-generated, see ClientsController.GenerateInvite) takes
        // priority over the email-match fallback — it's a deliberate, explicit link
        // rather than a best-effort guess, and works even if the client's stored email
        // doesn't match what they actually sign into Google with.
        Client? targetClient = null;
        if (!string.IsNullOrEmpty(request.InviteToken))
        {
            targetClient = await clientRepository.GetByInviteTokenAsync(request.InviteToken, ct);
        }
        targetClient ??= isNewUser ? await clientRepository.GetByEmailAsync(payload.Email, ct) : null;

        if (targetClient is not null && user.LinkedClientId != targetClient.Id)
        {
            // Clear any stale link on the client's previous user, and on this user's
            // previous client, so neither side ends up linked to two of the other.
            if (!string.IsNullOrEmpty(targetClient.LinkedUserId) && targetClient.LinkedUserId != user.Id)
            {
                var oldUser = await userRepository.GetByIdAsync(targetClient.LinkedUserId, ct);
                if (oldUser is not null) { oldUser.LinkedClientId = null; await userRepository.UpsertAsync(oldUser, ct); }
            }
            if (!string.IsNullOrEmpty(user.LinkedClientId))
            {
                var oldClient = await clientRepository.GetByIdAsync(user.LinkedClientId, ct);
                if (oldClient is not null) { oldClient.LinkedUserId = null; await clientRepository.UpsertAsync(oldClient, ct); }
            }

            user.LinkedClientId = targetClient.Id;
            targetClient.LinkedUserId = user.Id;
            targetClient.InviteToken = null; // one-time use
            await clientRepository.UpsertAsync(targetClient, ct);
        }

        user.AuthProviderId = payload.Subject;
        user.LastLoginAt = DateTimeOffset.UtcNow;
        var saved = await userRepository.UpsertAsync(user, ct);

        if (isNewUser)
        {
            var displayName = saved.Name ?? saved.Email;
            var firstName = displayName.Split(' ')[0];
            await emailService.SendAsync(saved.Email, displayName, "Welcome to The Painter Boys!", EmailTemplates.Welcome(firstName), ct);
        }

        var isStaff = saved.Role is UserRole.Admin or UserRole.Manager or UserRole.Partner;
        return Ok(new WhoAmIResponse(saved.Email, saved.Name, saved.Role, isStaff, payload.Picture));
    }

    /// <summary>Re-checks the caller's current role without re-registering anything (page-load check).</summary>
    [HttpGet("whoami")]
    [Authorize]
    public ActionResult<WhoAmIResponse> WhoAmI()
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? UserRole.Client;
        var isStaff = role is UserRole.Admin or UserRole.Manager or UserRole.Partner;
        return Ok(new WhoAmIResponse(email, name, role, isStaff));
    }
}
