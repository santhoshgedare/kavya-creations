using KavyaCreations.Application.Features.Products.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Products.Queries.GetProducts;

public record GetProductsQuery(
    int Page = 1,
    int PageSize = 12,
    string? Category = null,
    string? Search = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    bool? IsFeatured = null,
    string SortBy = "createdAt",
    string SortDir = "desc"
) : IRequest<PagedResult<ProductListItemDto>>;

public sealed class GetProductsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductsQuery, PagedResult<ProductListItemDto>>
{
    public async Task<PagedResult<ProductListItemDto>> Handle(
        GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Where(p => !p.IsDeleted && p.Status != ProductStatus.Discontinued);

        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(p => p.Category.Slug == request.Category.ToLower());

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.Description.ToLower().Contains(search) ||
                (p.Material != null && p.Material.ToLower().Contains(search)));
        }

        if (request.MinPrice.HasValue)
            query = query.Where(p => p.Price.Amount >= request.MinPrice.Value);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => p.Price.Amount <= request.MaxPrice.Value);

        if (request.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == request.IsFeatured.Value);

        query = request.SortBy.ToLower() switch
        {
            "price" => request.SortDir == "asc"
                ? query.OrderBy(p => p.Price.Amount)
                : query.OrderByDescending(p => p.Price.Amount),
            "name" => request.SortDir == "asc"
                ? query.OrderBy(p => p.Name)
                : query.OrderByDescending(p => p.Name),
            _ => request.SortDir == "asc"
                ? query.OrderBy(p => p.CreatedAt)
                : query.OrderByDescending(p => p.CreatedAt)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.Slug, p.ShortDescription,
                p.DiscountPrice != null ? p.DiscountPrice.Amount : p.Price.Amount,
                p.DiscountPrice != null ? p.Price.Amount : null,
                p.StockQuantity, p.Status, p.IsFeatured,
                p.Category.Name,
                p.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                    ?? p.Images.Select(i => i.Url).FirstOrDefault()))
            .ToListAsync(cancellationToken);

        return PagedResult<ProductListItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
