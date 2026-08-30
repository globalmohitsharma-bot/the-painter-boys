namespace ThePainterBoys.Api.Services;

/// <summary>
/// Runs SheetPushSyncService once a week automatically, so entries created or
/// edited in the Admin Portal make their way back into the Staff Portal's
/// Google Sheet without anyone remembering to click "Push to Sheet". Same
/// "Always On" requirement and same safe-to-repeat reasoning as
/// WeeklySheetSyncBackgroundService — see that class.
/// </summary>
public class WeeklySheetPushSyncBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<WeeklySheetPushSyncBackgroundService> logger) : BackgroundService
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
                var push = scope.ServiceProvider.GetRequiredService<SheetPushSyncService>();
                var result = await push.PushAsync(stoppingToken);
                logger.LogInformation("Weekly sheet push: appended {Appended}, updated {Updated}, skipped {Skipped}",
                    result.Appended, result.Updated, result.Skipped);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Weekly sheet push failed");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
