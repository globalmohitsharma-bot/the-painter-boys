using Azure.Identity;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Options;

namespace ThePainterBoys.Api.Configuration;

public static class BlobStorageServiceExtensions
{
    /// <summary>
    /// Registers a singleton BlobServiceClient authenticated via Azure AD
    /// (DefaultAzureCredential) — same keyless pattern as Cosmos, no account key
    /// stored anywhere. Locally this resolves through the developer's `az login`
    /// session, which must hold Storage Blob Data Contributor on the account.
    /// </summary>
    public static IServiceCollection AddBlobStorage(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<BlobStorageOptions>(configuration.GetSection(BlobStorageOptions.SectionName));

        services.AddSingleton(sp =>
        {
            var options = sp.GetRequiredService<IOptions<BlobStorageOptions>>().Value;
            return new BlobServiceClient(new Uri(options.AccountUrl), new DefaultAzureCredential());
        });

        return services;
    }
}
