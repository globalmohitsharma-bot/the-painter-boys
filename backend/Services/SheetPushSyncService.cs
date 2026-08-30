using System.Text;
using System.Text.Json;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Services;

public record PushResult(int Appended, int Updated, int Skipped);
public record PushPlanEntry(string ProjectId, string ClientName, string Action); // Action: "append" | "update"
public record PushPreview(List<PushPlanEntry> ToAppend, List<PushPlanEntry> ToUpdate, int Skipped);

/// <summary>
/// Push from Cosmos back into the legacy Staff Portal's Google Sheet — the
/// other direction from SheetSyncService, which only ever pulls. Writes go
/// through the same Google Apps Script Web App the Staff Portal itself uses
/// for its own edits (src/PBDashboard.jsx's DEFAULT_SCRIPT_URL); the sheet's
/// published CSV export is read-only, so there's no way to write through it.
///
/// Column order isn't hardcoded — it's read live from the sheet's own header
/// row on every run (same defensive approach PBDashboard.jsx already uses),
/// so a column getting reordered in the sheet doesn't silently misalign data.
///
/// Two write paths:
///  - A project with a SheetRef that still matches a "#" value currently in
///    the sheet gets an `update` at that row (safe to repeat every run).
///  - A project with no SheetRef (created directly in the Admin Portal) and
///    not yet PushedToSheet gets `append`ed once, then flagged — the Apps
///    Script's append action doesn't return the new row number (confirmed
///    2026-08-30: POST returns only `{"ok":true}`), so there's no way to
///    safely target that row for a later update. This is a known, accepted
///    limitation: a portal-created project's first push is its only push
///    until the sheet happens to re-sync it a different way (e.g. someone
///    fills in its "#" column by hand and a later pull-sync picks it up).
/// </summary>
public class SheetPushSyncService(
    IProjectRepository projectRepository,
    IClientRepository clientRepository,
    IHttpClientFactory httpClientFactory)
{
    private const string CsvUrl =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRHqp1TWLyAEgydJ19b6vCJcTGCCxGrLcB1Mccw95xndfc9mbC1y5y3ev5T1njzE0evlvGIHA6OGH1/pub?gid=1417050744&single=true&output=csv";

    private const string ScriptUrl =
        "https://script.google.com/macros/s/AKfycbxhbcdl1g0N9947w05vrmS8aewit0unY35R4tFNs2JJv0KI77hgyF0f9izDdaXCe4zR-w/exec";

    // Read-only — makes no writes to the sheet or to Cosmos. Lets an admin see
    // exactly which clients would get a new row appended vs. an existing row
    // updated before actually committing anything. Added 2026-08-30 after a
    // live push wrote 9 unwanted rows from leftover local test data straight
    // into the production sheet with no review step first.
    public async Task<PushPreview> PreviewAsync(CancellationToken ct)
    {
        var (plan, _, _, skipped) = await BuildPlanAsync(ct);
        return new PushPreview(
            plan.Where(p => p.Action == "append").ToList(),
            plan.Where(p => p.Action == "update").ToList(),
            skipped);
    }

    public async Task<PushResult> PushAsync(CancellationToken ct)
    {
        var (plan, headers, byProjectId, skipped) = await BuildPlanAsync(ct);
        var http = httpClientFactory.CreateClient();

        int appended = 0, updated = 0;
        foreach (var entry in plan)
        {
            var (client, project, rowIndex) = byProjectId[entry.ProjectId];
            var values = BuildValues(headers, client, project);

            if (entry.Action == "update")
            {
                await PostAsync(http, new { action = "update", rowIndex, values }, ct);
                updated++;
            }
            else
            {
                await PostAsync(http, new { action = "append", values }, ct);
                project.PushedToSheet = true;
                await projectRepository.UpsertAsync(project, ct);
                appended++;
            }
        }

        return new PushResult(appended, updated, skipped);
    }

    // Shared by PreviewAsync and PushAsync so "what will happen" and "what
    // actually happens" can never drift apart. Archived clients are never
    // included — same "hidden everywhere" rule the rest of the Admin Portal
    // already applies to archived data.
    private async Task<(List<PushPlanEntry> Plan, List<string> Headers,
        Dictionary<string, (Client Client, Project Project, int RowIndex)> ByProjectId, int Skipped)>
        BuildPlanAsync(CancellationToken ct)
    {
        var http = httpClientFactory.CreateClient();
        var csv = await http.GetStringAsync(CsvUrl, ct);
        var (headers, rows) = ParseCsv(csv);

        // "#" value -> 1-based sheet row (row 1 is the header, so the first
        // data row is row 2) — mirrors PBDashboard.jsx's `__row = i + 2`.
        var refToRow = new Dictionary<string, int>();
        for (var i = 0; i < rows.Count; i++)
        {
            var sheetRef = Get(rows[i], "#");
            if (!string.IsNullOrEmpty(sheetRef) && !refToRow.ContainsKey(sheetRef))
                refToRow[sheetRef] = i + 2;
        }

        var clients = (await clientRepository.GetAllAsync(ct)).ToDictionary(c => c.Id);
        var projects = await projectRepository.GetAllAsync(ct);

        var plan = new List<PushPlanEntry>();
        var byProjectId = new Dictionary<string, (Client, Project, int)>();
        var skipped = 0;

        foreach (var project in projects)
        {
            if (!clients.TryGetValue(project.ClientId, out var client) || !client.IsActive || !project.IsActive)
            {
                skipped++;
                continue;
            }

            if (!string.IsNullOrEmpty(project.SheetRef) && refToRow.TryGetValue(project.SheetRef, out var rowIndex))
            {
                plan.Add(new PushPlanEntry(project.Id, client.ContactName, "update"));
                byProjectId[project.Id] = (client, project, rowIndex);
            }
            else if (string.IsNullOrEmpty(project.SheetRef) && !project.PushedToSheet)
            {
                plan.Add(new PushPlanEntry(project.Id, client.ContactName, "append"));
                byProjectId[project.Id] = (client, project, 0);
            }
            else
            {
                skipped++;
            }
        }

        return (plan, headers, byProjectId, skipped);
    }

    private static async Task PostAsync(HttpClient http, object payload, CancellationToken ct)
    {
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "text/plain");
        await http.PostAsync(ScriptUrl, content, ct);
    }

    // Maps each header name to the matching Client/Project field — falls back
    // to blank for any header with no corresponding field (e.g. the sheet's
    // one unnamed column), same tolerance ParseCsv's Get() already has for
    // reading. Trims header names since "Additional Work " has a trailing
    // space in the live sheet.
    private static List<string> BuildValues(List<string> headers, Client client, Project project)
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
            // Archived entries are excluded here the same way they're excluded
            // from the receipt/WhatsApp text and the totals — the sheet should
            // never show a payment the admin has hidden as a mistaken entry.
            "TokenHistory" => string.Join("|", project.TokenHistory.Where(e => !e.Archived).Select(e => $"{e.Date}:{e.Amount}")),
            "Additional Work" => project.AdditionalWork,
            "Customer URL" => client.CustomerUrl,
            _ => "",
        }).ToList();
    }

    private static string Get(Dictionary<string, string> row, string key)
        => row.TryGetValue(key, out var v) ? v : "";

    // Quote-aware CSV parser mirroring SheetSyncService.ParseCsv, but also
    // returns the header row itself (needed here to build the outgoing
    // values array in the sheet's own live column order).
    private static (List<string> Headers, List<Dictionary<string, string>> Rows) ParseCsv(string text)
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
                cells.Add(cur.ToString());
                cur.Clear();
            }
            else if ((c == '\n' || c == '\r') && !inQuotes)
            {
                if (c == '\r' && i + 1 < text.Length && text[i + 1] == '\n') i++;
                cells.Add(cur.ToString());
                cur.Clear();
                if (cells.Any(cell => cell.Trim().Length > 0)) lines.Add(cells);
                cells = [];
            }
            else
            {
                cur.Append(c);
            }
        }
        if (cur.Length > 0 || cells.Count > 0)
        {
            cells.Add(cur.ToString());
            if (cells.Any(cell => cell.Trim().Length > 0)) lines.Add(cells);
        }

        if (lines.Count == 0) return ([], []);
        var headers = lines[0].Select(h => h.Trim()).ToList();
        var rows = lines.Skip(1).Select(line =>
        {
            var row = new Dictionary<string, string>();
            for (var i = 0; i < headers.Count && i < line.Count; i++)
                row[headers[i]] = line[i];
            return row;
        }).ToList();
        return (headers, rows);
    }
}
