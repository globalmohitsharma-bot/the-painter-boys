using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Repositories;

public class ClientRepository : IClientRepository
{
    private readonly Container _container;

    public ClientRepository(CosmosClient client, IOptions<CosmosDbOptions> options)
    {
        var o = options.Value;
        _container = client.GetContainer(o.DatabaseName, o.ClientsContainer);
    }

    public async Task<List<Client>> GetAllAsync(CancellationToken ct)
    {
        var results = new List<Client>();
        using var iterator = _container.GetItemQueryIterator<Client>("SELECT * FROM c ORDER BY c.createdAt DESC");
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync(ct));
        }
        return results;
    }

    public async Task<Client?> GetByIdAsync(string id, CancellationToken ct)
    {
        try
        {
            var response = await _container.ReadItemAsync<Client>(id, new PartitionKey(id), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Client?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.email = @email").WithParameter("@email", email);
        using var iterator = _container.GetItemQueryIterator<Client>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            return page.FirstOrDefault();
        }
        return null;
    }

    public async Task<Client?> GetByInviteTokenAsync(string token, CancellationToken ct)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.inviteToken = @token").WithParameter("@token", token);
        using var iterator = _container.GetItemQueryIterator<Client>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            return page.FirstOrDefault();
        }
        return null;
    }

    public async Task<Client> UpsertAsync(Client client, CancellationToken ct)
    {
        client.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.UpsertItemAsync(client, new PartitionKey(client.Id), cancellationToken: ct);
        return response.Resource;
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await _container.DeleteItemAsync<Client>(id, new PartitionKey(id), cancellationToken: ct);
    }
}
