using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.Enums;
using KavyaCreations.Domain.Events;
using KavyaCreations.Domain.ValueObjects;

namespace KavyaCreations.Domain.Entities;

public class Product : BaseEntity
{
    private Product() { }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string? ShortDescription { get; private set; }
    public Money Price { get; private set; } = Money.Zero();
    public Money? DiscountPrice { get; private set; }
    public int StockQuantity { get; private set; }
    public ProductStatus Status { get; private set; } = ProductStatus.Active;
    public bool IsFeatured { get; private set; }
    public Guid CategoryId { get; private set; }

    public Category Category { get; private set; } = null!;
    public ICollection<ProductImage> Images { get; private set; } = [];
    public ICollection<OrderItem> OrderItems { get; private set; } = [];
    public ICollection<CartItem> CartItems { get; private set; } = [];
    public ICollection<ProductVariant> Variants { get; private set; } = [];

    public static Product Create(
        string name,
        string slug,
        string description,
        decimal price,
        int stockQuantity,
        Guid categoryId,
        string? shortDescription = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        var product = new Product
        {
            Name = name,
            Slug = slug.ToLowerInvariant(),
            Description = description,
            ShortDescription = shortDescription,
            Price = Money.Create(price),
            StockQuantity = stockQuantity,
            CategoryId = categoryId,
            Status = stockQuantity > 0 ? ProductStatus.Active : ProductStatus.OutOfStock
        };

        product.AddDomainEvent(new ProductCreatedEvent(product.Id, name));
        return product;
    }

    public void UpdateDetails(
        string name,
        string description,
        decimal price,
        string updatedBy,
        string? shortDescription = null,
        decimal? discountPrice = null)
    {
        Name = name;
        Description = description;
        ShortDescription = shortDescription;
        Price = Money.Create(price);
        DiscountPrice = discountPrice.HasValue ? Money.Create(discountPrice.Value) : null;
        SetAudit(updatedBy);
    }

    public void UpdateStock(int quantity, string updatedBy)
    {
        if (quantity < 0) throw new ArgumentException("Stock quantity cannot be negative.");
        StockQuantity = quantity;
        Status = quantity == 0 ? ProductStatus.OutOfStock : ProductStatus.Active;
        SetAudit(updatedBy);
    }

    public void DecrementStock(int quantity)
    {
        if (quantity > StockQuantity) throw new InvalidOperationException("Insufficient stock.");
        StockQuantity -= quantity;
        if (StockQuantity == 0) Status = ProductStatus.OutOfStock;
    }

    public void SetFeatured(bool featured, string updatedBy)
    {
        IsFeatured = featured;
        SetAudit(updatedBy);
    }

    public void ChangeStatus(ProductStatus status, string updatedBy)
    {
        Status = status;
        SetAudit(updatedBy);
    }

    public decimal GetEffectivePrice() => DiscountPrice?.Amount ?? Price.Amount;
}
