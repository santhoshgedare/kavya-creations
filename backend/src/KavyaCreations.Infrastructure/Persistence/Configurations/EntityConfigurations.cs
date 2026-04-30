using KavyaCreations.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KavyaCreations.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).IsRequired().HasMaxLength(5000);
        builder.Property(p => p.ShortDescription).HasMaxLength(500);
        builder.Property(p => p.Material).HasMaxLength(200);
        builder.Property(p => p.Dimensions).HasMaxLength(100);
        builder.Property(p => p.Weight).HasMaxLength(50);

        builder.OwnsOne(p => p.Price, money =>
        {
            money.Property(m => m.Amount).HasColumnName("Price").HasPrecision(18, 2);
            money.Property(m => m.Currency).HasColumnName("PriceCurrency").HasMaxLength(3).HasDefaultValue("INR");
        });

        builder.OwnsOne(p => p.DiscountPrice, money =>
        {
            money.Property(m => m.Amount).HasColumnName("DiscountPrice").HasPrecision(18, 2);
            money.Property(m => m.Currency).HasColumnName("DiscountPriceCurrency").HasMaxLength(3);
        });

        builder.HasIndex(p => p.Slug).IsUnique();
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.IsFeatured);
        builder.HasIndex(p => p.IsDeleted);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Images)
            .WithOne(i => i.Product)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Slug).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(500);
        builder.Property(c => c.ImageUrl).HasMaxLength(2000);

        builder.HasIndex(c => c.Slug).IsUnique();
        builder.HasIndex(c => c.IsDeleted);

        builder.HasOne(c => c.ParentCategory)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);
    }
}

public sealed class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Url).IsRequired().HasMaxLength(2000);
        builder.Property(i => i.AltText).HasMaxLength(200);
        builder.HasIndex(i => i.ProductId);
    }
}

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.OrderNumber).IsRequired().HasMaxLength(50);
        builder.Property(o => o.Notes).HasMaxLength(500);
        builder.Property(o => o.PaymentMethod).HasMaxLength(50);
        builder.Property(o => o.PaymentTransactionId).HasMaxLength(200);

        builder.OwnsOne(o => o.SubTotal, m => { m.Property(x => x.Amount).HasColumnName("SubTotal").HasPrecision(18, 2); m.Property(x => x.Currency).HasColumnName("SubTotalCurrency").HasMaxLength(3).HasDefaultValue("INR"); });
        builder.OwnsOne(o => o.ShippingCost, m => { m.Property(x => x.Amount).HasColumnName("ShippingCost").HasPrecision(18, 2); m.Property(x => x.Currency).HasColumnName("ShippingCostCurrency").HasMaxLength(3).HasDefaultValue("INR"); });
        builder.OwnsOne(o => o.TotalAmount, m => { m.Property(x => x.Amount).HasColumnName("TotalAmount").HasPrecision(18, 2); m.Property(x => x.Currency).HasColumnName("TotalAmountCurrency").HasMaxLength(3).HasDefaultValue("INR"); });

        builder.OwnsOne(o => o.ShippingAddress, addr =>
        {
            addr.Property(a => a.Street).HasColumnName("ShippingStreet").HasMaxLength(200);
            addr.Property(a => a.City).HasColumnName("ShippingCity").HasMaxLength(100);
            addr.Property(a => a.State).HasColumnName("ShippingState").HasMaxLength(100);
            addr.Property(a => a.PostalCode).HasColumnName("ShippingPostalCode").HasMaxLength(20);
            addr.Property(a => a.Country).HasColumnName("ShippingCountry").HasMaxLength(100);
        });

        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.HasIndex(o => o.UserId);
        builder.HasIndex(o => o.Status);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.ProductName).IsRequired().HasMaxLength(200);
        builder.OwnsOne(i => i.UnitPrice, m => { m.Property(x => x.Amount).HasColumnName("UnitPrice").HasPrecision(18, 2); m.Property(x => x.Currency).HasColumnName("UnitPriceCurrency").HasMaxLength(3).HasDefaultValue("INR"); });
    }
}

public sealed class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.HasKey(c => c.Id);
        builder.HasIndex(c => c.UserId).IsUnique();

        builder.HasMany(c => c.Items)
            .WithOne(i => i.Cart)
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.HasIndex(i => new { i.CartId, i.ProductId, i.VariantId }).IsUnique();

        builder.HasOne(i => i.Variant)
            .WithMany(v => v.CartItems)
            .HasForeignKey(i => i.VariantId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}

public sealed class ProductAttributeConfiguration : IEntityTypeConfiguration<ProductAttribute>
{
    public void Configure(EntityTypeBuilder<ProductAttribute> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).IsRequired().HasMaxLength(100);
        builder.Property(a => a.DisplayName).IsRequired().HasMaxLength(100);
        builder.Property(a => a.InputType).HasMaxLength(20).HasDefaultValue("select");
        builder.HasIndex(a => a.Name).IsUnique();

        builder.HasMany(a => a.Values)
            .WithOne(v => v.Attribute)
            .HasForeignKey(v => v.AttributeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ProductAttributeValueConfiguration : IEntityTypeConfiguration<ProductAttributeValue>
{
    public void Configure(EntityTypeBuilder<ProductAttributeValue> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Value).IsRequired().HasMaxLength(100);
        builder.Property(v => v.DisplayValue).IsRequired().HasMaxLength(100);
        builder.HasIndex(v => new { v.AttributeId, v.Value }).IsUnique();
    }
}

public sealed class CategoryAttributeMappingConfiguration : IEntityTypeConfiguration<CategoryAttributeMapping>
{
    public void Configure(EntityTypeBuilder<CategoryAttributeMapping> builder)
    {
        builder.HasKey(m => m.Id);
        builder.HasIndex(m => new { m.CategoryId, m.AttributeId }).IsUnique();

        builder.HasOne(m => m.Category)
            .WithMany(c => c.AttributeMappings)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Attribute)
            .WithMany(a => a.CategoryMappings)
            .HasForeignKey(m => m.AttributeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.SKU).IsRequired().HasMaxLength(100);
        builder.HasIndex(v => v.SKU).IsUnique();
        builder.HasIndex(v => v.ProductId);

        builder.OwnsOne(v => v.Price, money =>
        {
            money.Property(m => m.Amount).HasColumnName("Price").HasPrecision(18, 2);
            money.Property(m => m.Currency).HasColumnName("PriceCurrency").HasMaxLength(3).HasDefaultValue("INR");
        });

        builder.HasOne(v => v.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ProductVariantAttributeValueConfiguration : IEntityTypeConfiguration<ProductVariantAttributeValue>
{
    public void Configure(EntityTypeBuilder<ProductVariantAttributeValue> builder)
    {
        builder.HasKey(x => new { x.VariantId, x.AttributeValueId });

        builder.HasOne(x => x.Variant)
            .WithMany(v => v.AttributeValues)
            .HasForeignKey(x => x.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AttributeValue)
            .WithMany(av => av.VariantAttributeValues)
            .HasForeignKey(x => x.AttributeValueId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
