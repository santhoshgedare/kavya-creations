using KavyaCreations.Application.Features.Auth.DTOs;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace KavyaCreations.Application.Features.Auth.Queries;

public record GetProfileQuery(Guid UserId) : IRequest<UserProfileDto>;

public sealed class GetProfileQueryHandler(UserManager<ApplicationUser> userManager)
    : IRequestHandler<GetProfileQuery, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString())
            ?? throw new NotFoundException("User", request.UserId);

        var roles = await userManager.GetRolesAsync(user);
        return new UserProfileDto(user.Id, user.FirstName, user.LastName, user.Email!, user.ProfileImageUrl, user.PhoneNumber, roles.ToList());
    }
}
