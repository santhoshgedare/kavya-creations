using FluentValidation;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Products.Commands.CreateProduct;

public record CreateProductCommand(
    string Name,
    string Slug,
    string Description,
    string? ShortDescription,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    Guid CategoryId,
    bool IsFeatured,
    List<string> ImageUrls
) : IRequest<Guid>;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200).Matches("^[a-z0-9-]+$").WithMessage("Slug must be lowercase alphanumeric with hyphens.");
        RuleFor(x => x.Description).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DiscountPrice).GreaterThan(0).LessThan(x => x.Price).When(x => x.DiscountPrice.HasValue);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public sealed class CreateProductCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var slugExists = await db.Products
            .AnyAsync(p => p.Slug == request.Slug && !p.IsDeleted, cancellationToken);
        if (slugExists) throw new ConflictException($"Product with slug '{request.Slug}' already exists.");

        var category = await db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Category), request.CategoryId);

        var product = Product.Create(
            request.Name, request.Slug, request.Description,
            request.Price, request.StockQuantity, request.CategoryId,
            request.ShortDescription);

        if (request.DiscountPrice.HasValue)
            product.UpdateDetails(request.Name, request.Description, request.Price,
                currentUser.Email ?? "system", request.ShortDescription, request.DiscountPrice);

        for (int i = 0; i < request.ImageUrls.Count; i++)
        {
            var image = ProductImage.Create(product.Id, request.ImageUrls[i], i == 0);
            db.ProductImages.Add(image);
        }

        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);
        product.ClearDomainEvents();
        return product.Id;
    }
}
