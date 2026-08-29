using System.Text;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Services;

public record SyncedEntry(string Name, string SheetRef);
public record SyncResult(int Imported, List<SyncedEntry> Entries);

/// <summary>
/// One-way pull from the legacy Staff Portal's Google Sheet into Cosmos — the
/// two systems were never kept in sync after the original one-time migration
/// (that's what each record's SheetRef is for: a stable pointer back to its
/// origin row, used here to skip rows already imported). Only reads the
/// sheet's published CSV export; never writes back to it. Shared by
/// SheetSyncController (an admin's manual "Sync now" click) and
/// WeeklySheetSyncBackgroundService (the unattended weekly run).
/// </summary>
public class SheetSyncService(
    IProjectRepository projectRepository,
    IClientRepository clientRepository,
    IHttpClientFactory httpClientFactory)
{
    // Same published-to-web CSV export the Staff Portal itself reads from
    // (src/PBDashboard.jsx's CSV_URL) — publicly readable, no credentials needed.
    private const string CsvUrl =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRHqp1TWLyAEgydJ19b6vCJcTGCCxGrLcB1Mccw95xndfc9mbC1y5y3ev5T1njzE0evlvGIHA6OGH1/pub?gid=1417050744&single=true&output=csv";

    public async Task<SyncResult> SyncAsync(CancellationToken ct)
    {
        var http = httpClientFactory.CreateClient();
        var csv = await http.GetStringAsync(CsvUrl, ct);

        var rows = ParseCsv(csv);
        var existingRefs = (await projectRepository.GetAllAsync(ct))
            .Select(p => p.SheetRef)
            .Where(r => !string.IsNullOrEmpty(r))
            .ToHashSet();

        var imported = new List<SyncedEntry>();
        foreach (var row in rows)
        {
            var sheetRef = Get(row, "#");
            if (string.IsNullOrEmpty(sheetRef) || existingRefs.Contains(sheetRef)) continue;

            var contactName = Get(row, "Contact Name");
            if (string.IsNullOrEmpty(contactName)) continue; // blank/spacer row

            var newClient = new Client
            {
                ContactName = contactName,
                Phone = Get(row, "Phone"),
                Address = Get(row, "Address"),
                Society = Get(row, "Society"),
                CustomerUrl = Get(row, "Customer URL"),
                SheetRef = sheetRef,
            };
            var savedClient = await clientRepository.UpsertAsync(newClient, ct);

            var progress = Get(row, "Progress");
            var newProject = new Project
            {
                ClientId = savedClient.Id,
                Progress = string.IsNullOrEmpty(progress) ? "Inquiry" : progress,
                PaintType = Get(row, "Type of Paint"),
                DateContacted = Get(row, "Date Contacted"),
                DateStarted = Get(row, "Date Started"),
                DateCompleted = Get(row, "Date Completed"),
                Remarks = Get(row, "Remarks"),
                NoOfDays = Get(row, "No Of Days"),
                Amount = ParseDecimal(Get(row, "Amount")),
                OtherDetails = Get(row, "Other Details"),
                PainterNames = ParseList(Get(row, "PainterName")),
                TokenReceived = ParseDecimal(Get(row, "Token Received")),
                PendingAmount = ParseDecimal(Get(row, "Pending Amount")),
                TokenHistory = ParseHistory(Get(row, "TokenHistory")),
                AdditionalWork = Get(row, "Additional Work"),
                SheetRef = sheetRef,
            };
            await projectRepository.UpsertAsync(newProject, ct);
            imported.Add(new SyncedEntry(contactName, sheetRef));
        }

        return new SyncResult(imported.Count, imported);
    }

    private static string Get(Dictionary<string, string> row, string key)
        => row.TryGetValue(key, out var v) ? v : "";

    private static decimal ParseDecimal(string val) => decimal.TryParse(val, out var d) ? d : 0;

    private static List<string> ParseList(string val) =>
        string.IsNullOrWhiteSpace(val) ? [] : val.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToList();

    // Mirrors pbParseHistory in PBDashboard.jsx: "date:amount|date:amount|...",
    // splitting on the LAST colon since a date itself may contain one.
    private static List<TokenHistoryEntry> ParseHistory(string val)
    {
        var result = new List<TokenHistoryEntry>();
        if (string.IsNullOrWhiteSpace(val)) return result;
        foreach (var entry in val.Split('|'))
        {
            var idx = entry.LastIndexOf(':');
            if (idx < 0) continue;
            if (decimal.TryParse(entry[(idx + 1)..], out var amount) && amount > 0)
                result.Add(new TokenHistoryEntry { Date = entry[..idx], Amount = amount });
        }
        return result;
    }

    // Quote-aware CSV parser mirroring parseCSV() in PBDashboard.jsx — a naive
    // comma split breaks on the multi-line quoted Remarks field the sheet uses.
    private static List<Dictionary<string, string>> ParseCsv(string text)
    {
        var lines = new List<List<string>>();
        var cur = new StringBuilder();
        var cells = new List<string>();
        var inQuotes = false;

        for (var i = 0; i < text.Length; i++)
        {
            var c = text[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < text.Length && text[i + 1] == '"') { cur.Append('"'); i++; }
                else inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                cells.Add(cur.ToString()); cur.Clear();
            }
            else if ((c == '\n' || c == '\r') && !inQuotes)
            {
                if (c == '\r' && i + 1 < text.Length && text[i + 1] == '\n') i++;
                cells.Add(cur.ToString()); cur.Clear();
                lines.Add([.. cells]); cells.Clear();
            }
            else
            {
                cur.Append(c);
            }
        }
        if (cur.Length > 0 || cells.Count > 0) { cells.Add(cur.ToString()); lines.Add([.. cells]); }
        if (lines.Count == 0) return [];

        var headers = lines[0].Select(h => h.Trim()).ToList();
        var rows = new List<Dictionary<string, string>>();
        foreach (var line in lines.Skip(1))
        {
            if (!line.Any(c => c.Trim().Length > 0)) continue;
            var row = new Dictionary<string, string>();
            for (var j = 0; j < headers.Count; j++)
            {
                if (headers[j].Length == 0) continue; // the sheet has one unused spacer column
                row[headers[j]] = j < line.Count ? line[j].Trim() : "";
            }
            rows.Add(row);
        }
        return rows;
    }
}
