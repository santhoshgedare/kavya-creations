using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Entities;

public class Category : BaseEntity
{
    private Category() { }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? ImageUrl { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public Guid? ParentCategoryId { get; private set; }

    public Category? ParentCategory { get; private set; }
    public ICollection<Category> SubCategories { get; private set; } = [];
    public ICollection<Product> Products { get; private set; } = [];

    public static Category Create(string name, string slug, string? description = null, Guid? parentCategoryId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        return new Category
        {
            Name = name,
            Slug = slug.ToLowerInvariant(),
            Description = description,
            ParentCategoryId = parentCategoryId
        };
    }

    public void Update(string name, string? description, string? imageUrl, int displayOrder, string updatedBy)
    {
        Name = name;
        Description = description;
        ImageUrl = imageUrl;
        DisplayOrder = displayOrder;
        SetAudit(updatedBy);
    }

    public void SetActive(bool isActive, string updatedBy)
    {
        IsActive = isActive;
        SetAudit(updatedBy);
    }
}
