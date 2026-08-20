using ThePainterBoys.Api.Models.Entities;

namespace ThePainterBoys.Api.Repositories.Interfaces;

public interface IProjectRepository
{
    Task<List<Project>> GetAllAsync(CancellationToken ct);
    Task<List<Project>> GetByClientIdAsync(string clientId, CancellationToken ct);
    Task<Project?> GetByIdAsync(string id, CancellationToken ct);
    Task<Project> UpsertAsync(Project project, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
}
