using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Entities;

public class CategoryAttributeMapping : BaseEntity
{
    private CategoryAttributeMapping() { }
    public Guid CategoryId { get; private set; }
    public Guid AttributeId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsRequired { get; private set; }

    public Category Category { get; private set; } = null!;
    public ProductAttribute Attribute { get; private set; } = null!;

    public static CategoryAttributeMapping Create(Guid categoryId, Guid attributeId, int displayOrder = 0, bool isRequired = false)
        => new() { CategoryId = categoryId, AttributeId = attributeId, DisplayOrder = displayOrder, IsRequired = isRequired };
}
