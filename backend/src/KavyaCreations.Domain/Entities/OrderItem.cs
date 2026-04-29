using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.ValueObjects;

namespace KavyaCreations.Domain.Entities;

public class OrderItem : BaseEntity
{
    private OrderItem() { }

    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public Money UnitPrice { get; private set; } = Money.Zero();
    public int Quantity { get; private set; }
    public Money SubTotal => UnitPrice.Multiply(Quantity);

    public Order Order { get; private set; } = null!;
    public Product Product { get; private set; } = null!;

    public static OrderItem Create(Guid orderId, Guid productId, string productName, decimal unitPrice, int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be positive.");
        return new OrderItem
        {
            OrderId = orderId,
            ProductId = productId,
            ProductName = productName,
            UnitPrice = Money.Create(unitPrice),
            Quantity = quantity
        };
    }
}
