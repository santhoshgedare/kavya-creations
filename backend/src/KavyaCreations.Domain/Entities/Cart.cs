using KavyaCreations.Domain.Common;
using KavyaCreations.Domain.ValueObjects;

namespace KavyaCreations.Domain.Entities;

public class Cart : BaseEntity
{
    private Cart() { }

    public Guid UserId { get; private set; }
    public ICollection<CartItem> Items { get; private set; } = [];

    public Money Total => Money.Create(Items.Sum(i => i.Product?.GetEffectivePrice() * i.Quantity ?? 0));
    public int TotalItems => Items.Sum(i => i.Quantity);

    public ApplicationUser User { get; private set; } = null!;

    public static Cart Create(Guid userId) => new() { UserId = userId };

    public CartItem AddItem(Guid productId, int quantity, Guid? variantId = null)
    {
        var existing = Items.FirstOrDefault(i => i.ProductId == productId && i.VariantId == variantId);
        if (existing is not null)
        {
            existing.UpdateQuantity(existing.Quantity + quantity);
            SetAudit(UserId.ToString());
            return existing;
        }

        var item = CartItem.Create(Id, productId, quantity, variantId);
        ((List<CartItem>)Items).Add(item);
        SetAudit(UserId.ToString());
        return item;
    }

    public void UpdateItemQuantity(Guid productId, int quantity, Guid? variantId = null)
    {
        var item = Items.FirstOrDefault(i => i.ProductId == productId && i.VariantId == variantId)
            ?? throw new InvalidOperationException("Item not in cart.");
        if (quantity <= 0) RemoveItem(productId, variantId);
        else item.UpdateQuantity(quantity);
        SetAudit(UserId.ToString());
    }

    public void RemoveItem(Guid productId, Guid? variantId = null)
    {
        var item = Items.FirstOrDefault(i => i.ProductId == productId && i.VariantId == variantId);
        if (item is not null)
        {
            ((List<CartItem>)Items).Remove(item);
            SetAudit(UserId.ToString());
        }
    }

    public void Clear()
    {
        ((List<CartItem>)Items).Clear();
        SetAudit(UserId.ToString());
    }
}
