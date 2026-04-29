using FluentValidation;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KavyaCreations.Application.Features.Categories.Commands;

// CREATE
public record CreateCategoryCommand(
    string Name, string Slug, string? Description, string? ImageUrl, int DisplayOrder
) : IRequest<Guid>;

public sealed class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    public CreateCategoryCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(100).Matches("^[a-z0-9-]+$");
    }
}

public sealed class CreateCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateCategoryCommand, Guid>
{
    public async Task<Guid> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        if (await db.Categories.AnyAsync(c => c.Slug == request.Slug && !c.IsDeleted, cancellationToken))
            throw new ConflictException($"Category slug '{request.Slug}' already exists.");

        var category = Category.Create(request.Name, request.Slug, request.Description);
        category.Update(request.Name, request.Description, request.ImageUrl, request.DisplayOrder, currentUser.Email ?? "system");
        db.Categories.Add(category);
        await db.SaveChangesAsync(cancellationToken);
        return category.Id;
    }
}

// UPDATE
public record UpdateCategoryCommand(Guid Id, string Name, string? Description, string? ImageUrl, int DisplayOrder) : IRequest;

public sealed class UpdateCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<UpdateCategoryCommand>
{
    public async Task Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Category", request.Id);

        category.Update(request.Name, request.Description, request.ImageUrl, request.DisplayOrder, currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}

// DELETE
public record DeleteCategoryCommand(Guid Id) : IRequest;

public sealed class DeleteCategoryCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DeleteCategoryCommand>
{
    public async Task Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await db.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id && !c.IsDeleted, cancellationToken)
            ?? throw new NotFoundException("Category", request.Id);

        category.SoftDelete(currentUser.Email ?? "system");
        await db.SaveChangesAsync(cancellationToken);
    }
}
