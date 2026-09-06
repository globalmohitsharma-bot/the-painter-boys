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
public record RedeemMyCouponRequest(string Code);

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
    IClientRepository clientRepository,
    IDiscountCouponRepository couponRepository) : ControllerBase
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

    /// <summary>Powers the customer dashboard's "You have a discount
    /// available" banner — the customer never sees/types the raw code
    /// (that's only ever delivered via the admin's separate WhatsApp
    /// share), just the amount/reason and a one-tap Redeem button. Only
    /// returns coupons still active for the duration they're valid; once
    /// redeemed or expired, this stops returning them and the banner
    /// disappears on its own.</summary>
    [HttpGet("coupons")]
    public async Task<ActionResult<List<DiscountCoupon>>> GetMyActiveCoupons(CancellationToken ct)
    {
        var userId = User.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userId)) return Ok(new List<DiscountCoupon>());

        var user = await userRepository.GetByIdAsync(userId, ct);
        if (user is null || string.IsNullOrEmpty(user.LinkedClientId)) return Ok(new List<DiscountCoupon>());

        var all = await couponRepository.GetAllAsync(ct);
        var active = all.Where(c => c.ClientId == user.LinkedClientId && !c.IsRedeemed && c.ExpiresAt > DateTimeOffset.UtcNow).ToList();
        return Ok(active);
    }

    /// <summary>Customer self-service redemption — unlike the Admin Portal's
    /// version (DiscountCouponsController.Redeem, admin-only), this one
    /// verifies the coupon's ClientId matches the caller's own linked
    /// client before doing anything, and returns the same generic "invalid
    /// or expired" message whether the code doesn't exist at all or exists
    /// but belongs to someone else — a customer shouldn't be able to tell
    /// those two cases apart. Applies the discount to the project's payment
    /// history itself (the customer has no general Project write access to
    /// do that in a second call the way the Admin Portal does).</summary>
    [HttpPost("redeem-coupon")]
    public async Task<IActionResult> RedeemCoupon([FromBody] RedeemMyCouponRequest request, CancellationToken ct)
    {
        var userId = User.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await userRepository.GetByIdAsync(userId, ct);
        if (user is null || string.IsNullOrEmpty(user.LinkedClientId))
        {
            return NotFound(new { message = "Invalid or expired coupon code." });
        }

        var code = (request.Code ?? string.Empty).Trim().ToUpperInvariant();
        var coupon = await couponRepository.GetByCodeAsync(code, ct);
        if (coupon is null || coupon.ClientId != user.LinkedClientId)
        {
            return NotFound(new { message = "Invalid or expired coupon code." });
        }
        if (coupon.IsRedeemed) return Conflict(new { message = "This coupon has already been redeemed." });
        if (coupon.ExpiresAt < DateTimeOffset.UtcNow) return Conflict(new { message = "This coupon has expired — coupons are valid for 7 days." });

        var project = await projectRepository.GetByIdAsync(coupon.ProjectId, ct);
        if (project is null || project.ClientId != user.LinkedClientId)
        {
            return NotFound(new { message = "Invalid or expired coupon code." });
        }

        project.TokenHistory.Add(new TokenHistoryEntry
        {
            Date = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd"),
            Amount = coupon.DiscountAmount,
            Kind = "discount",
            CouponCode = coupon.Code,
        });
        project.TokenReceived += coupon.DiscountAmount;
        project.PendingAmount = project.Amount > 0
            ? Math.Max(0, project.Amount - project.TokenReceived)
            : Math.Max(0, project.PendingAmount - coupon.DiscountAmount);
        await projectRepository.UpsertAsync(project, ct);

        coupon.IsRedeemed = true;
        coupon.RedeemedAt = DateTimeOffset.UtcNow;
        await couponRepository.UpsertAsync(coupon, ct);

        return Ok(new { discountAmount = coupon.DiscountAmount, projectId = coupon.ProjectId, reason = coupon.Reason });
    }
}
