using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Entities;

public class ProductAttributeValue : BaseEntity
{
    private ProductAttributeValue() { }
    public Guid AttributeId { get; private set; }
    public string Value { get; private set; } = string.Empty;
    public string DisplayValue { get; private set; } = string.Empty;
    public int DisplayOrder { get; private set; }

    public ProductAttribute Attribute { get; private set; } = null!;
    public ICollection<ProductVariantAttributeValue> VariantAttributeValues { get; private set; } = [];

    public static ProductAttributeValue Create(Guid attributeId, string value, string displayValue, int displayOrder = 0)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        return new ProductAttributeValue
        {
            AttributeId = attributeId,
            Value = value,
            DisplayValue = displayValue,
            DisplayOrder = displayOrder
        };
    }

    public void Update(string value, string displayValue, int displayOrder, string updatedBy)
    {
        Value = value;
        DisplayValue = displayValue;
        DisplayOrder = displayOrder;
        SetAudit(updatedBy);
    }
}
