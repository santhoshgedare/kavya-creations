using KavyaCreations.Application.Features.Categories.DTOs;
using KavyaCreations.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Categories.Queries;

public record GetCategoriesQuery : IRequest<List<CategoryDto>>;

public sealed class GetCategoriesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCategoriesQuery, List<CategoryDto>>
{
    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        return await db.Categories
            .Where(c => !c.IsDeleted && c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryDto(
                c.Id, c.Name, c.Slug, c.Description, c.ImageUrl,
                c.DisplayOrder, c.IsActive,
                c.Products.Count(p => !p.IsDeleted)))
            .ToListAsync(cancellationToken);
    }
}

public record GetCategoryBySlugQuery(string Slug) : IRequest<CategoryDto>;

public sealed class GetCategoryBySlugQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCategoryBySlugQuery, CategoryDto>
{
    public async Task<CategoryDto> Handle(GetCategoryBySlugQuery request, CancellationToken cancellationToken)
    {
        var category = await db.Categories
            .Where(c => c.Slug == request.Slug && !c.IsDeleted)
            .Select(c => new CategoryDto(
                c.Id, c.Name, c.Slug, c.Description, c.ImageUrl,
                c.DisplayOrder, c.IsActive,
                c.Products.Count(p => !p.IsDeleted)))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new Domain.Exceptions.NotFoundException("Category", request.Slug);

        return category;
    }
}
