using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Entities;

public class ProductAttribute : BaseEntity
{
    private ProductAttribute() { }
    public string Name { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string InputType { get; private set; } = "select"; // select | chips | radio

    public ICollection<ProductAttributeValue> Values { get; private set; } = [];
    public ICollection<CategoryAttributeMapping> CategoryMappings { get; private set; } = [];

    public static ProductAttribute Create(string name, string displayName, string inputType = "select")
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        return new ProductAttribute { Name = name, DisplayName = displayName, InputType = inputType };
    }

    public void Update(string displayName, string inputType, string updatedBy)
    {
        DisplayName = displayName;
        InputType = inputType;
        SetAudit(updatedBy);
    }
}
