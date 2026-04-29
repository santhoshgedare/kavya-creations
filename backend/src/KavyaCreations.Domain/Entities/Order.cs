using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.Enums;
using KavyaCreations.Domain.Events;
using KavyaCreations.Domain.ValueObjects;

namespace KavyaCreations.Domain.Entities;

public class Order : BaseEntity
{
    private Order() { }

    public string OrderNumber { get; private set; } = string.Empty;
    public Guid UserId { get; private set; }
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; private set; } = PaymentStatus.Pending;
    public Money SubTotal { get; private set; } = Money.Zero();
    public Money ShippingCost { get; private set; } = Money.Zero();
    public Money TotalAmount { get; private set; } = Money.Zero();
    public Address ShippingAddress { get; private set; } = null!;
    public string? Notes { get; private set; }
    public string? PaymentMethod { get; private set; }
    public string? PaymentTransactionId { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }

    public ApplicationUser User { get; private set; } = null!;
    public ICollection<OrderItem> Items { get; private set; } = [];

    public static Order Create(Guid userId, Address shippingAddress, string? notes = null)
    {
        var order = new Order
        {
            UserId = userId,
            ShippingAddress = shippingAddress,
            Notes = notes,
            OrderNumber = GenerateOrderNumber()
        };
        order.AddDomainEvent(new OrderCreatedEvent(order.Id, userId));
        return order;
    }

    public void AddItem(Guid productId, string productName, decimal unitPrice, int quantity)
    {
        var item = OrderItem.Create(Id, productId, productName, unitPrice, quantity);
        ((List<OrderItem>)Items).Add(item);
        RecalculateTotals();
    }

    public void SetShipping(decimal shippingCost)
    {
        ShippingCost = Money.Create(shippingCost);
        RecalculateTotals();
    }

    public void Confirm(string updatedBy)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Only pending orders can be confirmed.");
        Status = OrderStatus.Confirmed;
        SetAudit(updatedBy);
        AddDomainEvent(new OrderStatusChangedEvent(Id, OrderStatus.Confirmed));
    }

    public void Ship(string updatedBy)
    {
        if (Status != OrderStatus.Confirmed && Status != OrderStatus.Processing)
            throw new InvalidOperationException("Order must be confirmed before shipping.");
        Status = OrderStatus.Shipped;
        ShippedAt = DateTime.UtcNow;
        SetAudit(updatedBy);
        AddDomainEvent(new OrderStatusChangedEvent(Id, OrderStatus.Shipped));
    }

    public void Deliver(string updatedBy)
    {
        if (Status != OrderStatus.Shipped)
            throw new InvalidOperationException("Order must be shipped before delivery.");
        Status = OrderStatus.Delivered;
        DeliveredAt = DateTime.UtcNow;
        SetAudit(updatedBy);
        AddDomainEvent(new OrderStatusChangedEvent(Id, OrderStatus.Delivered));
    }

    public void Cancel(string updatedBy)
    {
        if (Status is OrderStatus.Shipped or OrderStatus.Delivered)
            throw new InvalidOperationException("Cannot cancel a shipped or delivered order.");
        Status = OrderStatus.Cancelled;
        SetAudit(updatedBy);
        AddDomainEvent(new OrderStatusChangedEvent(Id, OrderStatus.Cancelled));
    }

    public void SetPayment(string paymentMethod, string transactionId, string updatedBy)
    {
        PaymentMethod = paymentMethod;
        PaymentTransactionId = transactionId;
        PaymentStatus = PaymentStatus.Paid;
        SetAudit(updatedBy);
    }

    private void RecalculateTotals()
    {
        SubTotal = Money.Create(Items.Sum(i => i.UnitPrice.Amount * i.Quantity));
        TotalAmount = SubTotal.Add(ShippingCost);
    }

    private static string GenerateOrderNumber() =>
        $"KC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";
}
