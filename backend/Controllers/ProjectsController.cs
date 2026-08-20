using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ThePainterBoys.Api.Configuration;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

public record ShareProjectRequest(string UserId);
public record DeleteImageRequest(string Url);

[ApiController]
[Route("api/projects")]
[Authorize(Roles = UserRole.Admin)]
public class ProjectsController(
    IProjectRepository projectRepository,
    BlobServiceClient blobServiceClient,
    IOptions<BlobStorageOptions> blobOptions) : ControllerBase
{
    private static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/heic",
    };
    private const long MaxImageBytes = 15 * 1024 * 1024; // 15 MB — phone photos, not raw camera files
    [HttpGet]
    public async Task<ActionResult<List<Project>>> GetAll([FromQuery] string? clientId, CancellationToken ct)
        => Ok(clientId is null
            ? await projectRepository.GetAllAsync(ct)
            : await projectRepository.GetByClientIdAsync(clientId, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetById(string id, CancellationToken ct)
    {
        var project = await projectRepository.GetByIdAsync(id, ct);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> Create([FromBody] Project project, CancellationToken ct)
    {
        project.Id = Guid.NewGuid().ToString();
        project.CreatedAt = DateTimeOffset.UtcNow;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Project>> Update(string id, [FromBody] Project project, CancellationToken ct)
    {
        var existing = await projectRepository.GetByIdAsync(id, ct);
        if (existing is null) return NotFound();
        project.Id = id;
        project.CreatedAt = existing.CreatedAt;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return Ok(saved);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await projectRepository.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id}/images")]
    [RequestSizeLimit(MaxImageBytes)]
    public async Task<ActionResult<Project>> UploadImage(string id, IFormFile file, [FromForm] string? caption, CancellationToken ct)
    {
        var project = await projectRepository.GetByIdAsync(id, ct);
        if (project is null) return NotFound("Project not found.");
        if (file is null || file.Length == 0) return BadRequest("No file uploaded.");
        if (file.Length > MaxImageBytes) return BadRequest("Image too large (max 15 MB).");
        if (!AllowedImageTypes.Contains(file.ContentType)) return BadRequest("Only JPEG, PNG, WebP or HEIC images are allowed.");

        var container = blobServiceClient.GetBlobContainerClient(blobOptions.Value.ProjectPhotosContainer);
        var extension = Path.GetExtension(file.FileName);
        var blobName = $"{id}/{Guid.NewGuid()}{extension}";
        var blobClient = container.GetBlobClient(blobName);

        await using (var stream = file.OpenReadStream())
        {
            await blobClient.UploadAsync(stream, new Azure.Storage.Blobs.Models.BlobHttpHeaders { ContentType = file.ContentType }, cancellationToken: ct);
        }

        project.Images.Add(new ProjectImage { Url = blobClient.Uri.ToString(), Caption = caption ?? "", UploadedAt = DateTimeOffset.UtcNow });
        project.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return Ok(saved);
    }

    [HttpDelete("{id}/images")]
    public async Task<ActionResult<Project>> DeleteImage(string id, [FromBody] DeleteImageRequest request, CancellationToken ct)
    {
        var project = await projectRepository.GetByIdAsync(id, ct);
        if (project is null) return NotFound("Project not found.");

        var image = project.Images.FirstOrDefault(i => i.Url == request.Url);
        if (image is not null)
        {
            project.Images.Remove(image);
            var container = blobServiceClient.GetBlobContainerClient(blobOptions.Value.ProjectPhotosContainer);
            var blobName = image.Url[(image.Url.IndexOf(blobOptions.Value.ProjectPhotosContainer, StringComparison.Ordinal) + blobOptions.Value.ProjectPhotosContainer.Length + 1)..];
            await container.DeleteBlobIfExistsAsync(blobName, cancellationToken: ct);
        }
        project.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return Ok(saved);
    }

    /// <summary>Grants (or re-shows, if already shared but hidden) a user visibility into this project.</summary>
    [HttpPost("{id}/share")]
    public async Task<ActionResult<Project>> Share(string id, [FromBody] ShareProjectRequest request, CancellationToken ct)
    {
        var project = await projectRepository.GetByIdAsync(id, ct);
        if (project is null) return NotFound("Project not found.");

        var existing = project.SharedWith.FirstOrDefault(s => s.UserId == request.UserId);
        if (existing is not null) { existing.Visible = true; }
        else { project.SharedWith.Add(new ProjectShare { UserId = request.UserId, Visible = true }); }

        project.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return Ok(saved);
    }

    /// <summary>Toggles visibility without removing the share grant.</summary>
    [HttpPost("{id}/share/{userId}/toggle")]
    public async Task<ActionResult<Project>> ToggleShareVisibility(string id, string userId, CancellationToken ct)
    {
        var project = await projectRepository.GetByIdAsync(id, ct);
        if (project is null) return NotFound("Project not found.");

        var share = project.SharedWith.FirstOrDefault(s => s.UserId == userId);
        if (share is null) return NotFound("This user isn't shared on this project.");
        share.Visible = !share.Visible;

        project.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return Ok(saved);
    }

    /// <summary>Fully removes the share grant (distinct from hiding it via toggle).</summary>
    [HttpDelete("{id}/share/{userId}")]
    public async Task<ActionResult<Project>> Unshare(string id, string userId, CancellationToken ct)
    {
        var project = await projectRepository.GetByIdAsync(id, ct);
        if (project is null) return NotFound("Project not found.");

        project.SharedWith.RemoveAll(s => s.UserId == userId);
        project.UpdatedAt = DateTimeOffset.UtcNow;
        var saved = await projectRepository.UpsertAsync(project, ct);
        return Ok(saved);
    }
}
