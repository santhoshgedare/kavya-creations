using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Enums;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Orders.Commands.UpdateOrderStatus;

public record UpdateOrderStatusCommand(Guid OrderId, OrderStatus NewStatus) : IRequest;

public sealed class UpdateOrderStatusCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateOrderStatusCommand>
{
    public async Task Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken)
            ?? throw new NotFoundException("Order", request.OrderId);

        var updatedBy = currentUser.Email ?? "system";
        switch (request.NewStatus)
        {
            case OrderStatus.Confirmed: order.Confirm(updatedBy); break;
            case OrderStatus.Shipped: order.Ship(updatedBy); break;
            case OrderStatus.Delivered: order.Deliver(updatedBy); break;
            case OrderStatus.Cancelled: order.Cancel(updatedBy); break;
            default: throw new DomainException($"Cannot transition to status {request.NewStatus}.");
        }

        await db.SaveChangesAsync(cancellationToken);
        order.ClearDomainEvents();
    }
}
