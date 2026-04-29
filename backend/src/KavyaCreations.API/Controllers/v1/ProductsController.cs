using Asp.Versioning;
using KavyaCreations.Application.Features.Products.Commands.CreateProduct;
using KavyaCreations.Application.Features.Products.Commands.DeleteProduct;
using KavyaCreations.Application.Features.Products.Commands.UpdateProduct;
using KavyaCreations.Application.Features.Products.DTOs;
using KavyaCreations.Application.Features.Products.Queries.GetProductById;
using KavyaCreations.Application.Features.Products.Queries.GetProductBySlug;
using KavyaCreations.Application.Features.Products.Queries.GetProducts;
using KavyaCreations.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/products")]
public sealed class ProductsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ProductListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 12,
        [FromQuery] string? category = null, [FromQuery] string? search = null,
        [FromQuery] decimal? minPrice = null, [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? isFeatured = null, [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortDir = "desc", CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetProductsQuery(page, pageSize, category, search, minPrice, maxPrice, isFeatured, sortBy, sortDir), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ProductDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpGet("slug/{slug}")]
    [ProducesResponseType<ProductDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProductBySlugQuery(slug), ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<Guid>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateProductCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductCommand command, CancellationToken ct)
    {
        await mediator.Send(command with { Id = id }, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductCommand(id), ct);
        return NoContent();
    }
}
