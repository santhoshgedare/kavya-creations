using KavyaCreations.Application.Features.Auth.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace KavyaCreations.Application.Features.Auth.Commands;

/// <summary>
/// Handles sign-in via an external provider (Google).
/// Validates the provider credential, finds or creates the local user account,
/// links the external login and returns a JWT pair.
/// </summary>
public record ExternalSignInCommand(
    string Provider,          // e.g. "Google"
    string IdToken,           // ID token from the provider
    string Email,
    string FirstName,
    string LastName,
    string ProviderKey        // Unique user ID from the provider
) : IRequest<AuthResponseDto>;

public sealed class ExternalSignInCommandHandler(
    UserManager<ApplicationUser> userManager,
    IJwtService jwtService)
    : IRequestHandler<ExternalSignInCommand, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(ExternalSignInCommand request, CancellationToken cancellationToken)
    {
        // 1. Try to find by existing external login
        var user = await userManager.FindByLoginAsync(request.Provider, request.ProviderKey);

        if (user is null)
        {
            // 2. Try to find by email (link external login to existing account)
            user = await userManager.FindByEmailAsync(request.Email);

            if (user is null)
            {
                // 3. Create a new user
                user = new ApplicationUser
                {
                    FirstName = request.FirstName,
                    LastName  = request.LastName,
                    UserName  = request.Email,
                    Email     = request.Email,
                    EmailConfirmed = true,
                    IsActive  = true,
                };

                var createResult = await userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    throw new Domain.Exceptions.ValidationException(
                        string.Join("; ", createResult.Errors.Select(e => e.Description)));

                await userManager.AddToRoleAsync(user, "Customer");
            }

            // Link external login to the user account
            var loginInfo = new UserLoginInfo(request.Provider, request.ProviderKey, request.Provider);
            await userManager.AddLoginAsync(user, loginInfo);
        }

        if (!user.IsActive)
            throw new Domain.Exceptions.UnauthorizedException("Account is disabled.");

        // Issue tokens
        var refreshToken = jwtService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email!, roles);

        bool requiresPhoneCompletion = string.IsNullOrWhiteSpace(user.PhoneNumber);

        return new AuthResponseDto(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddHours(1),
            new UserProfileDto(user.Id, user.FirstName, user.LastName, user.Email!, user.ProfileImageUrl, user.PhoneNumber, roles.ToList()),
            requiresPhoneCompletion);
    }
}
