using FluentValidation;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Attributes;

// DTOs
public record AttributeDto(Guid Id, string Name, string DisplayName, string InputType, List<AttributeValueDto> Values);
public record AttributeValueDto(Guid Id, Guid AttributeId, string Value, string DisplayValue, int DisplayOrder);
public record CategoryAttributeDto(Guid MappingId, Guid CategoryId, Guid AttributeId, string AttributeName, string AttributeDisplayName, string InputType, bool IsRequired, int DisplayOrder, List<AttributeValueDto> Values);

// Get attributes by category
public record GetCategoryAttributesQuery(Guid CategoryId) : IRequest<List<CategoryAttributeDto>>;

public sealed class GetCategoryAttributesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCategoryAttributesQuery, List<CategoryAttributeDto>>
{
    public async Task<List<CategoryAttributeDto>> Handle(GetCategoryAttributesQuery request, CancellationToken cancellationToken)
    {
        var mappings = await db.CategoryAttributeMappings
            .Where(m => m.CategoryId == request.CategoryId && !m.IsDeleted)
            .Include(m => m.Attribute).ThenInclude(a => a.Values.Where(v => !v.IsDeleted).OrderBy(v => v.DisplayOrder))
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync(cancellationToken);

        return mappings.Select(m => new CategoryAttributeDto(
            m.Id, m.CategoryId, m.AttributeId,
            m.Attribute.Name, m.Attribute.DisplayName, m.Attribute.InputType,
            m.IsRequired, m.DisplayOrder,
            m.Attribute.Values.Select(v => new AttributeValueDto(v.Id, v.AttributeId, v.Value, v.DisplayValue, v.DisplayOrder)).ToList()
        )).ToList();
    }
}

// Get all attributes
public record GetAllAttributesQuery : IRequest<List<AttributeDto>>;

public sealed class GetAllAttributesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAllAttributesQuery, List<AttributeDto>>
{
    public async Task<List<AttributeDto>> Handle(GetAllAttributesQuery request, CancellationToken cancellationToken)
    {
        var attrs = await db.ProductAttributes
            .Where(a => !a.IsDeleted)
            .Include(a => a.Values.Where(v => !v.IsDeleted).OrderBy(v => v.DisplayOrder))
            .OrderBy(a => a.Name)
            .ToListAsync(cancellationToken);

        return attrs.Select(a => new AttributeDto(a.Id, a.Name, a.DisplayName, a.InputType,
            a.Values.Select(v => new AttributeValueDto(v.Id, v.AttributeId, v.Value, v.DisplayValue, v.DisplayOrder)).ToList()
        )).ToList();
    }
}

// Create attribute
public record CreateAttributeCommand(string Name, string DisplayName, string InputType = "select") : IRequest<Guid>;

public sealed class CreateAttributeCommandValidator : AbstractValidator<CreateAttributeCommand>
{
    public CreateAttributeCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.InputType).Must(t => new[] { "select", "chips", "radio" }.Contains(t)).WithMessage("InputType must be select, chips, or radio.");
    }
}

public sealed class CreateAttributeCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateAttributeCommand, Guid>
{
    public async Task<Guid> Handle(CreateAttributeCommand request, CancellationToken cancellationToken)
    {
        if (await db.ProductAttributes.AnyAsync(a => a.Name == request.Name && !a.IsDeleted, cancellationToken))
            throw new ConflictException($"Attribute '{request.Name}' already exists.");

        var attr = ProductAttribute.Create(request.Name, request.DisplayName, request.InputType);
        db.ProductAttributes.Add(attr);
        await db.SaveChangesAsync(cancellationToken);
        return attr.Id;
    }
}

// Update attribute
public record UpdateAttributeCommand(Guid Id, string DisplayName, string InputType) : IRequest;

public sealed class UpdateAttributeCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateAttributeCommand>
{
    public async Task Handle(UpdateAttributeCommand request, CancellationToken cancellationToken)
    {
        var attr = await db.ProductAttributes.FirstOrDefaultAsync(a => a.Id == request.Id && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductAttribute", request.Id);
        attr.Update(request.DisplayName, request.InputType, currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}

// Delete attribute
public record DeleteAttributeCommand(Guid Id) : IRequest;

public sealed class DeleteAttributeCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteAttributeCommand>
{
    public async Task Handle(DeleteAttributeCommand request, CancellationToken cancellationToken)
    {
        var attr = await db.ProductAttributes.FirstOrDefaultAsync(a => a.Id == request.Id && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductAttribute", request.Id);
        attr.SoftDelete(currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}

// Add attribute value
public record AddAttributeValueCommand(Guid AttributeId, string Value, string DisplayValue, int DisplayOrder = 0) : IRequest<Guid>;

public sealed class AddAttributeValueCommandHandler(IApplicationDbContext db)
    : IRequestHandler<AddAttributeValueCommand, Guid>
{
    public async Task<Guid> Handle(AddAttributeValueCommand request, CancellationToken cancellationToken)
    {
        _ = await db.ProductAttributes.FirstOrDefaultAsync(a => a.Id == request.AttributeId && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductAttribute", request.AttributeId);

        if (await db.ProductAttributeValues.AnyAsync(v => v.AttributeId == request.AttributeId && v.Value == request.Value && !v.IsDeleted, cancellationToken))
            throw new ConflictException($"Value '{request.Value}' already exists for this attribute.");

        var val = ProductAttributeValue.Create(request.AttributeId, request.Value, request.DisplayValue, request.DisplayOrder);
        db.ProductAttributeValues.Add(val);
        await db.SaveChangesAsync(cancellationToken);
        return val.Id;
    }
}

// Update attribute value
public record UpdateAttributeValueCommand(Guid Id, string Value, string DisplayValue, int DisplayOrder) : IRequest;

public sealed class UpdateAttributeValueCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateAttributeValueCommand>
{
    public async Task Handle(UpdateAttributeValueCommand request, CancellationToken cancellationToken)
    {
        var val = await db.ProductAttributeValues.FirstOrDefaultAsync(v => v.Id == request.Id && !v.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductAttributeValue", request.Id);
        val.Update(request.Value, request.DisplayValue, request.DisplayOrder, currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}

// Delete attribute value
public record DeleteAttributeValueCommand(Guid Id) : IRequest;

public sealed class DeleteAttributeValueCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteAttributeValueCommand>
{
    public async Task Handle(DeleteAttributeValueCommand request, CancellationToken cancellationToken)
    {
        var val = await db.ProductAttributeValues.FirstOrDefaultAsync(v => v.Id == request.Id && !v.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("ProductAttributeValue", request.Id);
        val.SoftDelete(currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}

// Map attribute to category
public record MapAttributeToCategoryCommand(Guid CategoryId, Guid AttributeId, int DisplayOrder = 0, bool IsRequired = false) : IRequest<Guid>;

public sealed class MapAttributeToCategoryCommandHandler(IApplicationDbContext db)
    : IRequestHandler<MapAttributeToCategoryCommand, Guid>
{
    public async Task<Guid> Handle(MapAttributeToCategoryCommand request, CancellationToken cancellationToken)
    {
        if (await db.CategoryAttributeMappings.AnyAsync(m => m.CategoryId == request.CategoryId && m.AttributeId == request.AttributeId && !m.IsDeleted, cancellationToken))
            throw new ConflictException("Attribute is already mapped to this category.");

        var mapping = CategoryAttributeMapping.Create(request.CategoryId, request.AttributeId, request.DisplayOrder, request.IsRequired);
        db.CategoryAttributeMappings.Add(mapping);
        await db.SaveChangesAsync(cancellationToken);
        return mapping.Id;
    }
}

// Remove attribute from category
public record RemoveAttributeFromCategoryCommand(Guid MappingId) : IRequest;

public sealed class RemoveAttributeFromCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<RemoveAttributeFromCategoryCommand>
{
    public async Task Handle(RemoveAttributeFromCategoryCommand request, CancellationToken cancellationToken)
    {
        var mapping = await db.CategoryAttributeMappings.FirstOrDefaultAsync(m => m.Id == request.MappingId && !m.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("CategoryAttributeMapping", request.MappingId);
        mapping.SoftDelete(currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}
