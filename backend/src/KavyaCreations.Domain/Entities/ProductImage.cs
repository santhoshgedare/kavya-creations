using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Entities;

public class ProductImage : BaseEntity
{
    private ProductImage() { }

    public Guid ProductId { get; private set; }
    public string Url { get; private set; } = string.Empty;
    public string? AltText { get; private set; }
    public bool IsPrimary { get; private set; }
    public int DisplayOrder { get; private set; }

    public Product Product { get; private set; } = null!;

    public static ProductImage Create(Guid productId, string url, bool isPrimary = false, string? altText = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(url);
        return new ProductImage
        {
            ProductId = productId,
            Url = url,
            IsPrimary = isPrimary,
            AltText = altText
        };
    }
}
