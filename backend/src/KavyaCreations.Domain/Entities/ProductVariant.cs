using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.ValueObjects;

namespace KavyaCreations.Domain.Entities;

public class ProductVariant : BaseEntity
{
    private ProductVariant() { }
    public Guid ProductId { get; private set; }
    public string SKU { get; private set; } = string.Empty;
    public Money Price { get; private set; } = Money.Zero();
    public int StockQuantity { get; private set; }
    public bool IsAvailable { get; private set; } = true;

    public Product Product { get; private set; } = null!;
    public ICollection<ProductVariantAttributeValue> AttributeValues { get; private set; } = [];
    public ICollection<CartItem> CartItems { get; private set; } = [];

    public static ProductVariant Create(Guid productId, string sku, decimal price, int stockQuantity)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sku);
        return new ProductVariant
        {
            ProductId = productId,
            SKU = sku,
            Price = Money.Create(price),
            StockQuantity = stockQuantity,
            IsAvailable = stockQuantity > 0
        };
    }

    public void UpdatePricing(decimal price, int stockQuantity, string updatedBy)
    {
        Price = Money.Create(price);
        StockQuantity = stockQuantity;
        IsAvailable = stockQuantity > 0;
        SetAudit(updatedBy);
    }

    public void DecrementStock(int quantity)
    {
        if (quantity > StockQuantity) throw new InvalidOperationException("Insufficient variant stock.");
        StockQuantity -= quantity;
        if (StockQuantity == 0) IsAvailable = false;
    }
}
