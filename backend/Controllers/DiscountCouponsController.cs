using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

public record CreateCouponRequest(string ProjectId, string ClientId, decimal DiscountAmount, string Reason);
public record RedeemCouponRequest(string Code);

[ApiController]
[Route("api/discount-coupons")]
[Authorize(Roles = UserRole.Admin)]
public class DiscountCouponsController(IDiscountCouponRepository couponRepository) : ControllerBase
{
    // Excludes visually-ambiguous characters (0/O, 1/I/L) — this gets read
    // back over the phone by a customer, not scanned, so every character
    // needs to be unambiguous when spoken/heard.
    private const string CodeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    [HttpGet]
    public async Task<ActionResult<List<DiscountCoupon>>> GetAll(CancellationToken ct)
        => Ok(await couponRepository.GetAllAsync(ct));

    [HttpPost]
    public async Task<ActionResult<DiscountCoupon>> Create([FromBody] CreateCouponRequest request, CancellationToken ct)
    {
        if (request.DiscountAmount <= 0) return BadRequest("Discount amount must be positive.");

        string code;
        do
        {
            code = GenerateCode();
        } while (await couponRepository.GetByCodeAsync(code, ct) is not null);

        var coupon = new DiscountCoupon
        {
            ProjectId = request.ProjectId,
            ClientId = request.ClientId,
            DiscountAmount = request.DiscountAmount,
            Reason = request.Reason,
            Code = code,
        };
        var saved = await couponRepository.UpsertAsync(coupon, ct);
        return Ok(saved);
    }

    // Marks the coupon redeemed only — appending the resulting discount to
    // the project's own payment history/totals is a separate PUT the admin
    // portal already makes to /api/projects/{id} (same path "add a payment"
    // already uses), so this endpoint doesn't need write access to Projects.
    [HttpPost("redeem")]
    public async Task<ActionResult<DiscountCoupon>> Redeem([FromBody] RedeemCouponRequest request, CancellationToken ct)
    {
        var code = (request.Code ?? string.Empty).Trim().ToUpperInvariant();
        var coupon = await couponRepository.GetByCodeAsync(code, ct);
        if (coupon is null) return NotFound(new { message = "No coupon found with that code." });
        if (coupon.IsRedeemed) return Conflict(new { message = $"Already redeemed on {coupon.RedeemedAt:dd MMM yyyy}." });
        if (coupon.ExpiresAt < DateTimeOffset.UtcNow) return Conflict(new { message = $"Expired on {coupon.ExpiresAt:dd MMM yyyy} — coupons are valid for 7 days." });

        coupon.IsRedeemed = true;
        coupon.RedeemedAt = DateTimeOffset.UtcNow;
        var saved = await couponRepository.UpsertAsync(coupon, ct);
        return Ok(saved);
    }

    private static string GenerateCode()
    {
        Span<char> chars = stackalloc char[8];
        for (var i = 0; i < chars.Length; i++)
        {
            chars[i] = CodeAlphabet[Random.Shared.Next(CodeAlphabet.Length)];
        }
        return new string(chars);
    }
}
