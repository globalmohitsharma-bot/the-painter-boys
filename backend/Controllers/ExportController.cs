using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;
using ThePainterBoys.Api.Services;

namespace ThePainterBoys.Api.Controllers;

/// <summary>
/// Downloadable CSV backup of every client/project, in the same column shape
/// as the Staff Portal's Google Sheet (see SheetRowFormatter) — but unlike
/// the Sheet Sync feature, this includes archived clients/projects too, since
/// an export is meant to be a complete snapshot for backup/audit, not a feed
/// into a live document that should only show current work.
/// </summary>
[ApiController]
[Route("api/admin/export")]
[Authorize(Roles = UserRole.Admin)]
public class ExportController(IClientRepository clientRepository, IProjectRepository projectRepository) : ControllerBase
{
    [HttpGet("csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var clients = (await clientRepository.GetAllAsync(ct)).ToDictionary(c => c.Id);
        var projects = (await projectRepository.GetAllAsync(ct)).OrderBy(p => p.CreatedAt);

        var sb = new StringBuilder();
        sb.Append(string.Join(",", SheetRowFormatter.DefaultHeaders.Select(CsvEscape)));
        sb.Append("\r\n");

        foreach (var project in projects)
        {
            if (!clients.TryGetValue(project.ClientId, out var client)) continue;
            var row = SheetRowFormatter.BuildRow(SheetRowFormatter.DefaultHeaders, client, project);
            sb.Append(string.Join(",", row.Select(CsvEscape)));
            sb.Append("\r\n");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"painterboys-export-{DateTime.UtcNow:yyyy-MM-dd}.csv";
        return File(bytes, "text/csv", fileName);
    }

    private static string CsvEscape(string? value)
    {
        value ??= "";
        return value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r')
            ? "\"" + value.Replace("\"", "\"\"") + "\""
            : value;
    }
}
