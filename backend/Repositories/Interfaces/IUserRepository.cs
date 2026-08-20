using ThePainterBoys.Api.Models.Entities;

namespace ThePainterBoys.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User?> GetByAuthProviderIdAsync(string authProviderId, CancellationToken ct);
    Task<List<User>> GetAllAsync(CancellationToken ct);
    Task<User> UpsertAsync(User user, CancellationToken ct);
}
