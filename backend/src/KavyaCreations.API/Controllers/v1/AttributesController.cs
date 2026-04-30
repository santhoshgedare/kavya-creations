using Asp.Versioning;
using KavyaCreations.Application.Features.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/attributes")]
public sealed class AttributesController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<AttributeDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAllAttributesQuery(), ct);
        return Ok(result);
    }

    [HttpGet("by-category/{categoryId:guid}")]
    [ProducesResponseType<List<CategoryAttributeDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCategory(Guid categoryId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCategoryAttributesQuery(categoryId), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<Guid>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateAttributeCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetAll), new { }, id);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAttributeCommand command, CancellationToken ct)
    {
        await mediator.Send(command with { Id = id }, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteAttributeCommand(id), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/values")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<Guid>(StatusCodes.Status201Created)]
    public async Task<IActionResult> AddValue(Guid id, [FromBody] AddAttributeValueCommand command, CancellationToken ct)
    {
        var valueId = await mediator.Send(command with { AttributeId = id }, ct);
        return CreatedAtAction(nameof(GetAll), new { }, valueId);
    }

    [HttpPut("values/{valueId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateValue(Guid valueId, [FromBody] UpdateAttributeValueCommand command, CancellationToken ct)
    {
        await mediator.Send(command with { Id = valueId }, ct);
        return NoContent();
    }

    [HttpDelete("values/{valueId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteValue(Guid valueId, CancellationToken ct)
    {
        await mediator.Send(new DeleteAttributeValueCommand(valueId), ct);
        return NoContent();
    }

    [HttpPost("category-mappings")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<Guid>(StatusCodes.Status201Created)]
    public async Task<IActionResult> MapToCategory([FromBody] MapAttributeToCategoryCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetAll), new { }, id);
    }

    [HttpDelete("category-mappings/{mappingId:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFromCategory(Guid mappingId, CancellationToken ct)
    {
        await mediator.Send(new RemoveAttributeFromCategoryCommand(mappingId), ct);
        return NoContent();
    }
}
