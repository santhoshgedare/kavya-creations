using KavyaCreations.Domain.Enums;

namespace KavyaCreations.Application.Features.Orders.DTOs;

public record OrderDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    decimal SubTotal,
    decimal ShippingCost,
    decimal TotalAmount,
    string ShippingAddress,
    string? Notes,
    string? PaymentMethod,
    List<OrderItemDto> Items,
    DateTime CreatedAt,
    DateTime? ShippedAt,
    DateTime? DeliveredAt
);

public record OrderItemDto(
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal SubTotal
);

public record OrderListItemDto(
    Guid Id,
    string OrderNumber,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    decimal TotalAmount,
    int ItemCount,
    DateTime CreatedAt
);
