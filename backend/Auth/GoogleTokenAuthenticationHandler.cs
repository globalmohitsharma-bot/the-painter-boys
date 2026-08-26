using System.Security.Claims;
using System.Text.Encodings.Web;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Auth;

/// <summary>
/// Every protected request carries the raw Google ID token as a Bearer credential
/// (no separate session/JWT issuance) — this handler verifies it with Google on
/// every request, then looks up the caller's role from PB_Users by email. A valid
/// Google token with no matching staff role still authenticates (so callers can
/// tell "not signed in" apart from "signed in but not staff"), it just won't carry
/// the role claim, so [Authorize(Roles = "Admin")] rejects it with 403 rather than
/// 401. Only the Admin role is meaningfully wired up right now — Manager/Partner
/// exist in the data model but aren't granted access to anything yet.
/// </summary>
public class GoogleTokenAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptions<GoogleAuthOptions> googleAuthOptions,
    IUserRepository userRepository,
    IHostEnvironment hostEnvironment,
    IDataProtectionProvider dataProtectionProvider)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "GoogleToken";

    /// <summary>Local-only shortcut so the customer dashboard can be exercised end to
    /// end (real project data, real linked-client lookups) without a real Google
    /// account — gated on IsDevelopment() so this sentinel can never authenticate
    /// anything once deployed. See TestLoginHelper.cs for the frontend trigger.</summary>
    public const string DevTestToken = "DEV_TEST_TOKEN";
    public const string DevTestEmail = "testuser@test.com";
    public const string DevTestAdminToken = "DEV_TEST_ADMIN_TOKEN";
    public const string DevTestAdminEmail = "testadmin@test.com";

    /// <summary>Marks a Bearer value as an admin "view as this user" token rather
    /// than a real Google ID token — see UsersController.Impersonate, which is the
    /// only place these get issued (Admin-only, 2-hour lifetime).</summary>
    public const string ImpersonationPrefix = "IMPERSONATE_";
    public const string ImpersonationPurpose = "ThePainterBoys.UserImpersonation.v1";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authHeader) ||
            !authHeader.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.NoResult();
        }

        var idToken = authHeader.ToString()["Bearer ".Length..].Trim();

        if (idToken.StartsWith(ImpersonationPrefix, StringComparison.Ordinal))
        {
            string userId;
            try
            {
                var protector = dataProtectionProvider.CreateProtector(ImpersonationPurpose).ToTimeLimitedDataProtector();
                userId = protector.Unprotect(idToken[ImpersonationPrefix.Length..]);
            }
            catch
            {
                return AuthenticateResult.Fail("Impersonation link has expired or is invalid.");
            }

            var impersonated = await userRepository.GetByIdAsync(userId, Context.RequestAborted);
            if (impersonated is null) return AuthenticateResult.Fail("That user no longer exists.");

            var impersonatedClaims = new List<Claim>
            {
                new(ClaimTypes.Email, impersonated.Email),
                new(ClaimTypes.Name, impersonated.Name ?? impersonated.Email),
                new(ClaimTypes.Role, impersonated.Role),
                new("user_id", impersonated.Id),
            };
            var impersonatedIdentity = new ClaimsIdentity(impersonatedClaims, SchemeName);
            return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(impersonatedIdentity), SchemeName));
        }

        GoogleJsonWebSignature.Payload payload;
        if (hostEnvironment.IsDevelopment() && idToken == DevTestToken)
        {
            payload = new GoogleJsonWebSignature.Payload { Email = DevTestEmail, Name = "Test User", Subject = "dev-test-subject" };
        }
        else if (hostEnvironment.IsDevelopment() && idToken == DevTestAdminToken)
        {
            payload = new GoogleJsonWebSignature.Payload { Email = DevTestAdminEmail, Name = "Test Admin", Subject = "dev-test-admin-subject" };
        }
        else
        {
            var clientId = googleAuthOptions.Value.ClientId;
            if (string.IsNullOrEmpty(clientId))
            {
                return AuthenticateResult.Fail("Google sign-in is not configured on this server.");
            }
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });
            }
            catch (InvalidJwtException ex)
            {
                return AuthenticateResult.Fail(ex);
            }
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, payload.Email),
            new(ClaimTypes.Name, payload.Name ?? payload.Email),
            new("google_sub", payload.Subject),
        };

        var user = await userRepository.GetByEmailAsync(payload.Email, Context.RequestAborted);
        if (user is not null)
        {
            claims.Add(new Claim(ClaimTypes.Role, user.Role));
            claims.Add(new Claim("user_id", user.Id));
        }

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
    }
}
