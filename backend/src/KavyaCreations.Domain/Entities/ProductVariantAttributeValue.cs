namespace KavyaCreations.Domain.Entities;

public class ProductVariantAttributeValue
{
    public Guid VariantId { get; set; }
    public Guid AttributeValueId { get; set; }

    public ProductVariant Variant { get; set; } = null!;
    public ProductAttributeValue AttributeValue { get; set; } = null!;
}
