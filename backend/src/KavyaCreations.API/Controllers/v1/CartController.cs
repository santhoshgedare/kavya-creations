using Asp.Versioning;
using KavyaCreations.Application.Features.Cart.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cart")]
[Authorize]
public sealed class CartController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CartDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCartQuery(), ct);
        return Ok(result);
    }

    [HttpPost("items")]
    [ProducesResponseType<CartDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> AddItem([FromBody] AddToCartCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPut("items/{productId:guid}")]
    [ProducesResponseType<CartDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateItem(Guid productId, [FromBody] int quantity, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateCartItemCommand(productId, quantity), ct);
        return Ok(result);
    }

    [HttpDelete("items/{productId:guid}")]
    [ProducesResponseType<CartDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveItem(Guid productId, CancellationToken ct)
    {
        var result = await mediator.Send(new RemoveFromCartCommand(productId), ct);
        return Ok(result);
    }
}
