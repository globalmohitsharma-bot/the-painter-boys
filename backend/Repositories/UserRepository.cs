using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Repositories.Interfaces;
using User = ThePainterBoys.Api.Models.Entities.User;

namespace ThePainterBoys.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly Container _container;

    public UserRepository(CosmosClient client, IOptions<CosmosDbOptions> options)
    {
        var o = options.Value;
        _container = client.GetContainer(o.DatabaseName, o.UsersContainer);
    }

    public async Task<User?> GetByIdAsync(string id, CancellationToken ct)
    {
        try
        {
            var response = await _container.ReadItemAsync<User>(id, new PartitionKey(id), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE LOWER(c.email) = LOWER(@email)").WithParameter("@email", email);
        using var iterator = _container.GetItemQueryIterator<User>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            return page.FirstOrDefault();
        }
        return null;
    }

    public async Task<User?> GetByAuthProviderIdAsync(string authProviderId, CancellationToken ct)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.authProviderId = @sub").WithParameter("@sub", authProviderId);
        using var iterator = _container.GetItemQueryIterator<User>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            return page.FirstOrDefault();
        }
        return null;
    }

    public async Task<List<User>> GetAllAsync(CancellationToken ct)
    {
        var results = new List<User>();
        using var iterator = _container.GetItemQueryIterator<User>("SELECT * FROM c ORDER BY c.createdAt DESC");
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync(ct));
        }
        return results;
    }

    public async Task<User> UpsertAsync(User user, CancellationToken ct)
    {
        var response = await _container.UpsertItemAsync(user, new PartitionKey(user.Id), cancellationToken: ct);
        return response.Resource;
    }
}
