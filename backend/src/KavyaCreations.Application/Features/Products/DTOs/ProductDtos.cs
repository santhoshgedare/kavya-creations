using KavyaCreations.Domain.Enums;

namespace KavyaCreations.Application.Features.Products.DTOs;

public record ProductDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    string? ShortDescription,
    decimal Price,
    decimal? DiscountPrice,
    decimal EffectivePrice,
    int StockQuantity,
    ProductStatus Status,
    bool IsFeatured,
    Guid CategoryId,
    string CategoryName,
    List<ProductImageDto> Images,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ProductImageDto(
    Guid Id,
    string Url,
    string? AltText,
    bool IsPrimary
);

public record ProductListItemDto(
    Guid Id,
    string Name,
    string Slug,
    string? ShortDescription,
    decimal EffectivePrice,
    decimal? DiscountPrice,
    int StockQuantity,
    ProductStatus Status,
    bool IsFeatured,
    string CategoryName,
    string? PrimaryImageUrl
);
