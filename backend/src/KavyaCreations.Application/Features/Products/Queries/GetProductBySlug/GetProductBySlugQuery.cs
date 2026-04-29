using KavyaCreations.Application.Features.Products.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Products.Queries.GetProductBySlug;

public record GetProductBySlugQuery(string Slug) : IRequest<ProductDto>;

public sealed class GetProductBySlugQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductBySlugQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Product", request.Slug);

        return GetProductById.GetProductByIdQueryHandler.MapToDto(product);
    }
}
