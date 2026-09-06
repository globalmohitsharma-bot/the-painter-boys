using ThePainterBoys.Api.Models.Entities;

namespace ThePainterBoys.Api.Repositories.Interfaces;

public interface IDiscountCouponRepository
{
    Task<List<DiscountCoupon>> GetAllAsync(CancellationToken ct);
    Task<DiscountCoupon?> GetByIdAsync(string id, CancellationToken ct);
    Task<DiscountCoupon?> GetByCodeAsync(string code, CancellationToken ct);
    Task<DiscountCoupon> UpsertAsync(DiscountCoupon coupon, CancellationToken ct);
}
