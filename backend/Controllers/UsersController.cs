using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThePainterBoys.Api.Models.Entities;
using ThePainterBoys.Api.Repositories.Interfaces;

namespace ThePainterBoys.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = UserRole.Admin)]
public class UsersController(IUserRepository userRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAll(CancellationToken ct)
        => Ok(await userRepository.GetAllAsync(ct));
}
