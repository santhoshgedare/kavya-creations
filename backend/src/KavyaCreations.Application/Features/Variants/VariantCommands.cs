using FluentValidation;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Variants;

// DTOs
public record VariantAttributeValueDto(Guid AttributeValueId, string AttributeName, string Value, string DisplayValue);
public record ProductVariantDto(
    Guid Id, Guid ProductId, string SKU, decimal Price, int StockQuantity, bool IsAvailable,
    List<VariantAttributeValueDto> AttributeValues);

// Get variants for a product
public record GetProductVariantsQuery(Guid ProductId) : IRequest<List<ProductVariantDto>>;

public sealed class GetProductVariantsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProductVariantsQuery, List<ProductVariantDto>>
{
    public async Task<List<ProductVariantDto>> Handle(GetProductVariantsQuery request, CancellationToken cancellationToken)
    {
        var variants = await db.ProductVariants
            .Where(v => v.ProductId == request.ProductId && !v.IsDeleted)
            .Include(v => v.AttributeValues)
                .ThenInclude(av => av.AttributeValue)
                    .ThenInclude(avv => avv.Attribute)
            .ToListAsync(cancellationToken);

        return variants.Select(MapToDto).ToList();
    }

    internal static ProductVariantDto MapToDto(ProductVariant v) => new(
        v.Id, v.ProductId, v.SKU, v.Price.Amount, v.StockQuantity, v.IsAvailable,
        v.AttributeValues.Select(av => new VariantAttributeValueDto(
            av.AttributeValueId,
            av.AttributeValue.Attribute.DisplayName,
            av.AttributeValue.Value,
            av.AttributeValue.DisplayValue
        )).ToList()
    );
}

// Get variant by ID
public record GetVariantByIdQuery(Guid VariantId) : IRequest<ProductVariantDto>;

public sealed class GetVariantByIdQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetVariantByIdQuery, ProductVariantDto>
{
    public async Task<ProductVariantDto> Handle(GetVariantByIdQuery request, CancellationToken cancellationToken)
    {
        var variant = await db.ProductVariants
            .Where(v => v.Id == request.VariantId && !v.IsDeleted)
            .Include(v => v.AttributeValues)
                .ThenInclude(av => av.AttributeValue)
                    .ThenInclude(avv => avv.Attribute)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("ProductVariant", request.VariantId);

        return GetProductVariantsQueryHandler.MapToDto(variant);
    }
}

// Generate variants from attribute value combinations
public record GenerateVariantsCommand(
    Guid ProductId,
    List<Guid> AttributeValueIds,
    decimal DefaultPrice,
    int DefaultStock
) : IRequest<List<Guid>>;

public sealed class GenerateVariantsCommandValidator : AbstractValidator<GenerateVariantsCommand>
{
    public GenerateVariantsCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.AttributeValueIds).NotEmpty();
        RuleFor(x => x.DefaultPrice).GreaterThan(0);
        RuleFor(x => x.DefaultStock).GreaterThanOrEqualTo(0);
    }
}

public sealed class GenerateVariantsCommandHandler(IApplicationDbContext db)
    : IRequestHandler<GenerateVariantsCommand, List<Guid>>
{
    public async Task<List<Guid>> Handle(GenerateVariantsCommand request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Product", request.ProductId);

        var attributeValues = await db.ProductAttributeValues
            .Where(v => request.AttributeValueIds.Contains(v.Id) && !v.IsDeleted)
            .Include(v => v.Attribute)
            .ToListAsync(cancellationToken);

        var grouped = attributeValues
            .GroupBy(v => v.AttributeId)
            .Select(g => g.ToList())
            .ToList();

        if (grouped.Count == 0) throw new DomainException("No valid attribute values found.");

        // Generate cartesian product (all combinations)
        var combinations = grouped.Aggregate(
            new List<List<ProductAttributeValue>> { new List<ProductAttributeValue>() },
            (acc, group) => acc.SelectMany(combo =>
                group.Select(val => new List<ProductAttributeValue>(combo) { val })
            ).ToList()
        );

        var createdIds = new List<Guid>();
        foreach (var combo in combinations)
        {
            var skuSuffix = string.Join("-", combo.Select(v =>
                System.Text.RegularExpressions.Regex.Replace(v.Value.ToLowerInvariant(), @"[^a-z0-9]+", "")));
            var sku = $"{product.Slug}-{skuSuffix}";

            if (await db.ProductVariants.AnyAsync(v => v.SKU == sku && !v.IsDeleted, cancellationToken))
                continue;

            var variant = ProductVariant.Create(request.ProductId, sku, request.DefaultPrice, request.DefaultStock);
            db.ProductVariants.Add(variant);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var val in combo)
            {
                db.ProductVariantAttributeValues.Add(
                    ProductVariantAttributeValue.Create(variant.Id, val.Id));
            }
            await db.SaveChangesAsync(cancellationToken);
            createdIds.Add(variant.Id);
        }
        return createdIds;
    }
}

// Create a single variant manually
public record CreateVariantCommand(
    Guid ProductId,
    string SKU,
    decimal Price,
    int StockQuantity,
    List<Guid> AttributeValueIds
) : IRequest<Guid>;

public sealed class CreateVariantCommandValidator : AbstractValidator<CreateVariantCommand>
{
    public CreateVariantCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.SKU).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateVariantCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateVariantCommand, Guid>
{
    public async Task<Guid> Handle(CreateVariantCommand request, CancellationToken cancellationToken)
    {
        if (await db.ProductVariants.AnyAsync(v => v.SKU == request.SKU && !v.IsDeleted, cancellationToken))
            throw new ConflictException($"Variant with SKU '{request.SKU}' already exists.");

        var variant = ProductVariant.Create(request.ProductId, request.SKU, request.Price, request.StockQuantity);
        db.ProductVariants.Add(variant);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var valueId in request.AttributeValueIds)
        {
            db.ProductVariantAttributeValues.Add(
                ProductVariantAttributeValue.Create(variant.Id, valueId));
        }
        await db.SaveChangesAsync(cancellationToken);
        return variant.Id;
    }
}

// Update variant pricing/stock
public record UpdateVariantCommand(Guid Id, decimal Price, int StockQuantity) : IRequest;

public sealed class UpdateVariantCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateVariantCommand>
{
    public async Task Handle(UpdateVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == request.Id && !v.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductVariant", request.Id);
        variant.UpdatePricing(request.Price, request.StockQuantity, currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}

// Bulk update variant pricing/stock
public record BulkUpdateVariantItem(Guid Id, decimal Price, int StockQuantity);
public record BulkUpdateVariantsCommand(List<BulkUpdateVariantItem> Variants) : IRequest;

public sealed class BulkUpdateVariantsCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<BulkUpdateVariantsCommand>
{
    public async Task Handle(BulkUpdateVariantsCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Variants.Select(v => v.Id).ToList();
        var variants = await db.ProductVariants
            .Where(v => ids.Contains(v.Id) && !v.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var item in request.Variants)
        {
            var variant = variants.FirstOrDefault(v => v.Id == item.Id);
            if (variant is not null)
                variant.UpdatePricing(item.Price, item.StockQuantity, currentUser.Email ?? "system");
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}

// Delete variant
public record DeleteVariantCommand(Guid Id) : IRequest;

public sealed class DeleteVariantCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteVariantCommand>
{
    public async Task Handle(DeleteVariantCommand request, CancellationToken cancellationToken)
    {
        var variant = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == request.Id && !v.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductVariant", request.Id);
        variant.SoftDelete(currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}
