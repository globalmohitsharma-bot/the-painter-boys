using ThePainterBoys.Api.Models.Entities;

namespace ThePainterBoys.Api.Repositories.Interfaces;

public interface IClientRepository
{
    Task<List<Client>> GetAllAsync(CancellationToken ct);
    Task<Client?> GetByIdAsync(string id, CancellationToken ct);
    Task<Client?> GetByEmailAsync(string email, CancellationToken ct);
    Task<Client?> GetByInviteTokenAsync(string token, CancellationToken ct);
    Task<Client> UpsertAsync(Client client, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}
