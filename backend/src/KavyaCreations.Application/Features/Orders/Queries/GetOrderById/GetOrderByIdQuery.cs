using KavyaCreations.Application.Features.Orders.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Orders.Queries.GetOrderById;

public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDto>;

public sealed class GetOrderByIdQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetOrderByIdQuery, OrderDto>
{
    public async Task<OrderDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.Id &&
                (o.UserId == userId || currentUser.IsAdmin), cancellationToken)
            ?? throw new NotFoundException("Order", request.Id);

        var addr = order.ShippingAddress;
        return new OrderDto(
            order.Id, order.OrderNumber, order.Status, order.PaymentStatus,
            order.SubTotal.Amount, order.ShippingCost.Amount, order.TotalAmount.Amount,
            addr.ToString(), order.Notes, order.PaymentMethod,
            order.Items.Select(i => new OrderItemDto(
                i.ProductId, i.ProductName, i.UnitPrice.Amount, i.Quantity, i.SubTotal.Amount
            )).ToList(),
            order.CreatedAt, order.ShippedAt, order.DeliveredAt);
    }
}
