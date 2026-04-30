using KavyaCreations.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Product> Products { get; }
    DbSet<Category> Categories { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<ProductAttribute> ProductAttributes { get; }
    DbSet<ProductAttributeValue> ProductAttributeValues { get; }
    DbSet<CategoryAttributeMapping> CategoryAttributeMappings { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductVariantAttributeValue> ProductVariantAttributeValues { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
