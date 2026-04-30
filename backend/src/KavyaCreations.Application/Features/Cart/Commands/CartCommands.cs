using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Cart.Commands;

// DTOs
public record CartDto(
    Guid CartId,
    List<CartItemDto> Items,
    decimal Total,
    int TotalItems
);

public record CartItemDto(
    Guid ProductId,
    string ProductName,
    string? ProductImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal SubTotal,
    Guid? VariantId,
    string? VariantSKU,
    string? VariantAttributes
);

// Add to cart
public record AddToCartCommand(Guid ProductId, int Quantity, Guid? VariantId = null) : IRequest<CartDto>;

public sealed class AddToCartCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<AddToCartCommand, CartDto>
{
    public async Task<CartDto> Handle(AddToCartCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var product = await db.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Product", request.ProductId);

        if (request.VariantId.HasValue)
        {
            var variant = await db.ProductVariants
                .FirstOrDefaultAsync(v => v.Id == request.VariantId.Value && !v.IsDeleted, cancellationToken)
                ?? throw new NotFoundException("ProductVariant", request.VariantId.Value);
            if (variant.StockQuantity < request.Quantity)
                throw new DomainException("Insufficient variant stock.");
        }
        else if (product.StockQuantity < request.Quantity)
        {
            throw new DomainException("Insufficient stock.");
        }

        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .Include(c => c.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (cart is null)
        {
            cart = Domain.Entities.Cart.Create(userId);
            db.Carts.Add(cart);
        }

        cart.AddItem(request.ProductId, request.Quantity, request.VariantId);
        await db.SaveChangesAsync(cancellationToken);
        return MapToDto(cart);
    }

    internal static CartDto MapToDto(Domain.Entities.Cart cart) => new(
        cart.Id,
        cart.Items.Select(i => new CartItemDto(
            i.ProductId,
            i.Product?.Name ?? "",
            i.Product?.Images.FirstOrDefault(img => img.IsPrimary)?.Url
                ?? i.Product?.Images.FirstOrDefault()?.Url,
            i.Variant?.Price.Amount ?? i.Product?.GetEffectivePrice() ?? 0,
            i.Quantity,
            (i.Variant?.Price.Amount ?? i.Product?.GetEffectivePrice() ?? 0) * i.Quantity,
            i.VariantId,
            i.Variant?.SKU,
            i.Variant?.AttributeValues != null
                ? string.Join(", ", i.Variant.AttributeValues
                    .Select(av => av.AttributeValue?.DisplayValue ?? ""))
                : null
        )).ToList(),
        cart.Items.Sum(i => (i.Variant?.Price.Amount ?? i.Product?.GetEffectivePrice() ?? 0) * i.Quantity),
        cart.Items.Sum(i => i.Quantity)
    );
}

// Update quantity
public record UpdateCartItemCommand(Guid ProductId, int Quantity) : IRequest<CartDto>;

public sealed class UpdateCartItemCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateCartItemCommand, CartDto>
{
    public async Task<CartDto> Handle(UpdateCartItemCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .Include(c => c.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("Cart", userId);

        cart.UpdateItemQuantity(request.ProductId, request.Quantity);
        await db.SaveChangesAsync(cancellationToken);
        return AddToCartCommandHandler.MapToDto(cart);
    }
}

// Remove from cart
public record RemoveFromCartCommand(Guid ProductId) : IRequest<CartDto>;

public sealed class RemoveFromCartCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<RemoveFromCartCommand, CartDto>
{
    public async Task<CartDto> Handle(RemoveFromCartCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .Include(c => c.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("Cart", userId);

        cart.RemoveItem(request.ProductId);
        await db.SaveChangesAsync(cancellationToken);
        return AddToCartCommandHandler.MapToDto(cart);
    }
}

// Get cart
public record GetCartQuery : IRequest<CartDto?>;

public sealed class GetCartQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetCartQuery, CartDto?>
{
    public async Task<CartDto?> Handle(GetCartQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .Include(c => c.Items).ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        return cart is null ? null : AddToCartCommandHandler.MapToDto(cart);
    }
}
