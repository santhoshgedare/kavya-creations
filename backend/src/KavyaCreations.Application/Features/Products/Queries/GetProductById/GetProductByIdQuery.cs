using KavyaCreations.Application.Features.Products.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Products.Queries.GetProductById;

public record GetProductByIdQuery(Guid Id) : IRequest<ProductDto>;

public sealed class GetProductByIdQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductByIdQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Product), request.Id);

        return MapToDto(product);
    }

    internal static ProductDto MapToDto(Domain.Entities.Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.ShortDescription,
        p.Price.Amount, p.DiscountPrice?.Amount,
        p.GetEffectivePrice(), p.StockQuantity,
        p.Status, p.IsFeatured, p.CategoryId, p.Category.Name,
        p.Images.Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.IsPrimary)).ToList(),
        p.CreatedAt, p.UpdatedAt);
}
