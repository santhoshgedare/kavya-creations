using FluentValidation;
using KavyaCreations.Application.Features.Orders.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Enums;
using KavyaCreations.Domain.Exceptions;
using KavyaCreations.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Orders.Commands.CreateOrder;

public record CreateOrderCommand(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country,
    string? Notes
) : IRequest<Guid>;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.Street).NotEmpty().MaximumLength(200);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.State).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PostalCode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateOrderCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken)
            ?? throw new DomainException("Cart is empty.");

        if (!cart.Items.Any()) throw new DomainException("Cart is empty.");

        var address = Address.Create(request.Street, request.City, request.State, request.PostalCode, request.Country);
        var order = Order.Create(userId, address, request.Notes);

        foreach (var item in cart.Items)
        {
            if (item.Product.StockQuantity < item.Quantity)
                throw new DomainException($"Insufficient stock for {item.Product.Name}.");
            order.AddItem(item.ProductId, item.Product.Name, item.Product.GetEffectivePrice(), item.Quantity);
            item.Product.DecrementStock(item.Quantity);
        }

        order.SetShipping(cart.Items.Sum(i => i.Product.GetEffectivePrice() * i.Quantity) >= 999 ? 0 : 99);

        db.Orders.Add(order);
        cart.Clear();
        await db.SaveChangesAsync(cancellationToken);
        order.ClearDomainEvents();
        return order.Id;
    }
}
