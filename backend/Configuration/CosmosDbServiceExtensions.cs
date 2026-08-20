using System.Text.Json;
using Azure.Identity;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace ThePainterBoys.Api.Configuration;

public static class CosmosDbServiceExtensions
{
    /// <summary>
    /// Registers a singleton CosmosClient using System.Text.Json (camelCase, matching the
    /// entity models' [JsonPropertyName] attributes and the migrated data's field casing).
    ///
    /// Authenticates via Azure AD (DefaultAzureCredential) when no AccountKey is configured —
    /// the same pattern already proven on the sibling FindBuyRentProtect project against this
    /// same shared `pilotai` account. Locally this resolves through the developer's `az login`
    /// session, which must hold the Cosmos DB Data Contributor role scoped to
    /// /dbs/PB_ThePainterBoysDb. Falls back to key auth only if AccountKey is explicitly set.
    /// </summary>
    public static IServiceCollection AddCosmosDb(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<CosmosDbOptions>(configuration.GetSection(CosmosDbOptions.SectionName));

        services.AddSingleton(sp =>
        {
            var options = sp.GetRequiredService<IOptions<CosmosDbOptions>>().Value;

            var clientOptions = new CosmosClientOptions
            {
                UseSystemTextJsonSerializerWithOptions = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                },
                ApplicationName = "ThePainterBoys.Api"
            };

            if (string.IsNullOrWhiteSpace(options.AccountKey))
            {
                return new CosmosClient(options.AccountEndpoint, new DefaultAzureCredential(), clientOptions);
            }

            return new CosmosClient(options.AccountEndpoint, options.AccountKey, clientOptions);
        });

        return services;
    }
}
