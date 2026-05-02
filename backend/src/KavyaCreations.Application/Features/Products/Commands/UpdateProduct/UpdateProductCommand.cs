using FluentValidation;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Products.Commands.UpdateProduct;

public record UpdateProductCommand(
    Guid Id,
    string Name,
    string Description,
    string? ShortDescription,
    decimal Price,
    decimal? DiscountPrice,
    int StockQuantity,
    Guid CategoryId,
    bool IsFeatured
) : IRequest;

public sealed class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DiscountPrice).GreaterThan(0).LessThan(x => x.Price).When(x => x.DiscountPrice.HasValue);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateProductCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateProductCommand>
{
    public async Task Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Product", request.Id);

        product.UpdateDetails(
            request.Name, request.Description, request.Price,
            currentUser.Email ?? "system", request.ShortDescription, request.DiscountPrice);

        product.UpdateStock(request.StockQuantity, currentUser.Email ?? "system");
        product.SetFeatured(request.IsFeatured, currentUser.Email ?? "system");

        await db.SaveChangesAsync(cancellationToken);
    }
}
