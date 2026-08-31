using ThePainterBoys.Api.Models.Entities;

namespace ThePainterBoys.Api.Repositories.Interfaces;

public interface IQuotationRepository
{
    Task<List<Quotation>> GetAllAsync(CancellationToken ct);
    Task<Quotation?> GetByIdAsync(string id, CancellationToken ct);
    Task<Quotation> UpsertAsync(Quotation quotation, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}
