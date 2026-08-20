using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly Container _container;

    public ProjectRepository(CosmosClient client, IOptions<CosmosDbOptions> options)
    {
        var o = options.Value;
        _container = client.GetContainer(o.DatabaseName, o.ProjectsContainer);
    }

    public async Task<List<Project>> GetAllAsync(CancellationToken ct)
    {
        var results = new List<Project>();
        using var iterator = _container.GetItemQueryIterator<Project>("SELECT * FROM c ORDER BY c.createdAt DESC");
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync(ct));
        }
        return results;
    }

    public async Task<List<Project>> GetByClientIdAsync(string clientId, CancellationToken ct)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.clientId = @clientId ORDER BY c.createdAt DESC")
            .WithParameter("@clientId", clientId);
        var results = new List<Project>();
        using var iterator = _container.GetItemQueryIterator<Project>(query);
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync(ct));
        }
        return results;
    }

    public async Task<Project?> GetByIdAsync(string id, CancellationToken ct)
    {
        try
        {
            var response = await _container.ReadItemAsync<Project>(id, new PartitionKey(id), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Project> UpsertAsync(Project project, CancellationToken ct)
    {
        project.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.UpsertItemAsync(project, new PartitionKey(project.Id), cancellationToken: ct);
        return response.Resource;
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await _container.DeleteItemAsync<Project>(id, new PartitionKey(id), cancellationToken: ct);
    }
}
