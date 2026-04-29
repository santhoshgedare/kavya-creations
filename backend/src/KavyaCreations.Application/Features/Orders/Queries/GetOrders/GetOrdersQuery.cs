using KavyaCreations.Application.Features.Orders.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Orders.Queries.GetOrders;

public record GetMyOrdersQuery(int Page = 1, int PageSize = 10)
    : IRequest<PagedResult<OrderListItemDto>>;

public sealed class GetMyOrdersQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetMyOrdersQuery, PagedResult<OrderListItemDto>>
{
    public async Task<PagedResult<OrderListItemDto>> Handle(
        GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var query = db.Orders.Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderListItemDto(
                o.Id, o.OrderNumber, o.Status, o.PaymentStatus,
                o.TotalAmount.Amount, o.Items.Count, o.CreatedAt))
            .ToListAsync(cancellationToken);

        return PagedResult<OrderListItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}

public record GetAllOrdersQuery(int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<OrderListItemDto>>;

public sealed class GetAllOrdersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAllOrdersQuery, PagedResult<OrderListItemDto>>
{
    public async Task<PagedResult<OrderListItemDto>> Handle(
        GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Orders.OrderByDescending(o => o.CreatedAt);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderListItemDto(
                o.Id, o.OrderNumber, o.Status, o.PaymentStatus,
                o.TotalAmount.Amount, o.Items.Count, o.CreatedAt))
            .ToListAsync(cancellationToken);

        return PagedResult<OrderListItemDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
