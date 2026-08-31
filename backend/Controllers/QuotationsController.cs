using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

[ApiController]
[Route("api/quotations")]
[Authorize(Roles = UserRole.Admin)]
public class QuotationsController(IQuotationRepository quotationRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Quotation>>> GetAll(CancellationToken ct)
        => Ok(await quotationRepository.GetAllAsync(ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<Quotation>> GetById(string id, CancellationToken ct)
    {
        var quotation = await quotationRepository.GetByIdAsync(id, ct);
        return quotation is null ? NotFound() : Ok(quotation);
    }

    [HttpPost]
    public async Task<ActionResult<Quotation>> Create([FromBody] Quotation quotation, CancellationToken ct)
    {
        quotation.Id = Guid.NewGuid().ToString();
        quotation.CreatedAt = DateTimeOffset.UtcNow;
        var saved = await quotationRepository.UpsertAsync(quotation, ct);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Quotation>> Update(string id, [FromBody] Quotation quotation, CancellationToken ct)
    {
        var existing = await quotationRepository.GetByIdAsync(id, ct);
        if (existing is null) return NotFound();
        quotation.Id = id;
        quotation.CreatedAt = existing.CreatedAt;
        var saved = await quotationRepository.UpsertAsync(quotation, ct);
        return Ok(saved);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await quotationRepository.DeleteAsync(id, ct);
        return NoContent();
    }
}
