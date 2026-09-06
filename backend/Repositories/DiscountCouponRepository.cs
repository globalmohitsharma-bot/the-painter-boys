using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Repositories;

public class DiscountCouponRepository : IDiscountCouponRepository
{
    private readonly Container _container;

    public DiscountCouponRepository(CosmosClient client, IOptions<CosmosDbOptions> options)
    {
        var o = options.Value;
        _container = client.GetContainer(o.DatabaseName, o.DiscountCouponsContainer);
    }

    public async Task<List<DiscountCoupon>> GetAllAsync(CancellationToken ct)
    {
        var results = new List<DiscountCoupon>();
        using var iterator = _container.GetItemQueryIterator<DiscountCoupon>("SELECT * FROM c ORDER BY c.createdAt DESC");
        while (iterator.HasMoreResults)
        {
            results.AddRange(await iterator.ReadNextAsync(ct));
        }
        return results;
    }

    public async Task<DiscountCoupon?> GetByIdAsync(string id, CancellationToken ct)
    {
        try
        {
            var response = await _container.ReadItemAsync<DiscountCoupon>(id, new PartitionKey(id), cancellationToken: ct);
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<DiscountCoupon?> GetByCodeAsync(string code, CancellationToken ct)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.code = @code").WithParameter("@code", code);
        using var iterator = _container.GetItemQueryIterator<DiscountCoupon>(query);
        if (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync(ct);
            return page.FirstOrDefault();
        }
        return null;
    }

    public async Task<DiscountCoupon> UpsertAsync(DiscountCoupon coupon, CancellationToken ct)
    {
        var response = await _container.UpsertItemAsync(coupon, new PartitionKey(coupon.Id), cancellationToken: ct);
        return response.Resource;
    }
}
