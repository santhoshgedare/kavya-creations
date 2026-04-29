using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Entities;

public class CartItem : BaseEntity
{
    private CartItem() { }

    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }

    public Cart Cart { get; private set; } = null!;
    public Product Product { get; private set; } = null!;

    public static CartItem Create(Guid cartId, Guid productId, int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be positive.");
        return new CartItem { CartId = cartId, ProductId = productId, Quantity = quantity };
    }

    public void UpdateQuantity(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be positive.");
        Quantity = quantity;
    }
}
