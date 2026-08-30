using ThePainterBoys.Api.Models.Entities;

namespace ThePainterBoys.Api.Services;

/// <summary>
/// Maps a Client+Project pair to a row of values in the Staff Portal sheet's
/// column shape — shared by SheetPushSyncService (which fetches the sheet's
/// live header row, resilient to a column getting reordered) and the CSV
/// export feature (which uses DefaultHeaders directly, since a one-off
/// download doesn't need that same live resilience).
/// </summary>
public static class SheetRowFormatter
{
    // Matches the live Staff Portal sheet's column order as of 2026-08-30 —
    // the unnamed entry is a genuine blank column in the real sheet.
    public static readonly List<string> DefaultHeaders =
    [
        "#", "Contact Name", "Phone", "Address", "Society", "Progress", "Type of Paint",
        "Date Contacted", "Date Started", "Date Completed", "Remarks", "No Of Days",
        "Amount", "Other Details", "", "PainterName", "Token Received", "Pending Amount",
        "TokenHistory", "Additional Work", "Customer URL",
    ];

    public static List<string> BuildRow(List<string> headers, Client client, Project project)
    {
        return headers.Select(h => h.Trim() switch
        {
            "#" => project.SheetRef,
            "Contact Name" => client.ContactName,
            "Phone" => client.Phone,
            "Address" => client.Address,
            "Society" => client.Society,
            "Progress" => project.Progress,
            "Type of Paint" => project.PaintType,
            "Date Contacted" => project.DateContacted,
            "Date Started" => project.DateStarted,
            "Date Completed" => project.DateCompleted,
            "Remarks" => project.Remarks,
            "No Of Days" => project.NoOfDays,
            "Amount" => project.Amount == 0 ? "" : project.Amount.ToString(),
            "Other Details" => project.OtherDetails,
            "PainterName" => string.Join(", ", project.PainterNames),
            "Token Received" => project.TokenReceived == 0 ? "" : project.TokenReceived.ToString(),
            "Pending Amount" => project.PendingAmount == 0 ? "" : project.PendingAmount.ToString(),
            // Archived payment entries are excluded here the same way they're
            // excluded from the receipt, WhatsApp text, and totals elsewhere.
            "TokenHistory" => string.Join("|", project.TokenHistory.Where(e => !e.Archived).Select(e => $"{e.Date}:{e.Amount}")),
            "Additional Work" => project.AdditionalWork,
            "Customer URL" => client.CustomerUrl,
            _ => "",
        }).ToList();
    }
}
