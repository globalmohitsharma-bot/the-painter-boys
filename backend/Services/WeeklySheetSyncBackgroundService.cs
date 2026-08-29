namespace ThePainterBoys.Api.Services;

/// <summary>
/// Runs SheetSyncService once a week automatically, so new sheet entries show
/// up in the Admin Portal without anyone remembering to click "Sync now".
/// Requires the App Service's "Always On" setting so the process doesn't idle
/// out between runs — without it, this timer would just stop between requests.
/// SheetSyncService itself only ever adds records, never deletes or overwrites
/// existing ones, so a missed or repeated run is always safe.
/// </summary>
public class WeeklySheetSyncBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<WeeklySheetSyncBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromDays(7);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var sync = scope.ServiceProvider.GetRequiredService<SheetSyncService>();
                var result = await sync.SyncAsync(stoppingToken);
                logger.LogInformation("Weekly sheet sync: imported {Count} new entr{Suffix}",
                    result.Imported, result.Imported == 1 ? "y" : "ies");
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                // Never let a bad sync (sheet unreachable, transient Cosmos hiccup)
                // take the whole app down — just log it and try again next week.
                logger.LogError(ex, "Weekly sheet sync failed");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
