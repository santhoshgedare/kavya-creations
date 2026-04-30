using Asp.Versioning;
using KavyaCreations.Application.Features.Variants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/variants")]
public sealed class VariantsController(ISender mediator) : ControllerBase
{
    [HttpGet("by-product/{productId:guid}")]
    [ProducesResponseType<List<ProductVariantDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByProduct(Guid productId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductVariantsQuery(productId), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ProductVariantDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetVariantByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<Guid>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateVariantCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPost("generate")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<List<Guid>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Generate([FromBody] GenerateVariantsCommand command, CancellationToken ct)
    {
        var ids = await mediator.Send(command, ct);
        return Ok(ids);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVariantCommand command, CancellationToken ct)
    {
        await mediator.Send(command with { Id = id }, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteVariantCommand(id), ct);
        return NoContent();
    }
}
