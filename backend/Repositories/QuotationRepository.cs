using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Repositories;

public class QuotationRepository : IQuotationRepository
{
    private readonly Container _container;

    public QuotationRepository(CosmosClient client, IOptions<CosmosDbOptions> options)
    {
        var o = options.Value;
        _container = client.GetContainer(o.DatabaseName, o.QuotationsContainer);
    }

    public async Task<List<Quotation>> GetAllAsync(CancellationToken ct)
    {
        var results = new List<Quotation>();
        using var iterator = _container.GetItemQueryIterator<Quotation>("SELECT * FROM c ORDER BY c.updatedAt DESC");
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync(ct));
        }
        return results;
    }

    public async Task<Quotation?> GetByIdAsync(string id, CancellationToken ct)
    {
        try
        {
            var response = await _container.ReadItemAsync<Quotation>(id, new PartitionKey(id), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Quotation> UpsertAsync(Quotation quotation, CancellationToken ct)
    {
        quotation.UpdatedAt = DateTimeOffset.UtcNow;
        var response = await _container.UpsertItemAsync(quotation, new PartitionKey(quotation.Id), cancellationToken: ct);
        return response.Resource;
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await _container.DeleteItemAsync<Quotation>(id, new PartitionKey(id), cancellationToken: ct);
    }
}
