using FluentValidation;
using KavyaCreations.Application.Features.Auth.DTOs;
using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using KavyaCreations.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace KavyaCreations.Application.Features.Auth.Commands;

// REGISTER
public record RegisterCommand(RegisterRequest Request) : IRequest<AuthResponseDto>;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterRequest>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}

public sealed class RegisterCommandHandler(
    UserManager<ApplicationUser> userManager,
    IJwtService jwtService)
    : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        if (await userManager.FindByEmailAsync(r.Email) is not null)
            throw new ConflictException($"Email '{r.Email}' is already registered.");

        var user = new ApplicationUser
        {
            FirstName = r.FirstName,
            LastName = r.LastName,
            UserName = r.Email,
            Email = r.Email
        };

        var result = await userManager.CreateAsync(user, r.Password);
        if (!result.Succeeded)
            throw new Domain.Exceptions.ValidationException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, "Customer");

        var refreshToken = jwtService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email!, roles);
        return new AuthResponseDto(
            accessToken, refreshToken, DateTime.UtcNow.AddHours(1),
            new UserProfileDto(user.Id, user.FirstName, user.LastName, user.Email!, user.ProfileImageUrl, user.PhoneNumber, roles.ToList()));
    }
}

// LOGIN
public record LoginCommand(LoginRequest Request) : IRequest<AuthResponseDto>;

public sealed class LoginCommandHandler(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IJwtService jwtService)
    : IRequestHandler<LoginCommand, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var user = await userManager.FindByEmailAsync(r.Email)
            ?? throw new UnauthorizedException("Invalid credentials.");

        if (!user.IsActive) throw new UnauthorizedException("Account is disabled.");

        var result = await signInManager.CheckPasswordSignInAsync(user, r.Password, true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut) throw new UnauthorizedException("Account is locked out.");
            throw new UnauthorizedException("Invalid credentials.");
        }

        var refreshToken = jwtService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email!, roles);
        return new AuthResponseDto(
            accessToken, refreshToken, DateTime.UtcNow.AddHours(1),
            new UserProfileDto(user.Id, user.FirstName, user.LastName, user.Email!, user.ProfileImageUrl, user.PhoneNumber, roles.ToList()));
    }
}

// REFRESH TOKEN
public record RefreshTokenCommand(RefreshTokenRequest Request) : IRequest<AuthResponseDto>;

public sealed class RefreshTokenCommandHandler(
    UserManager<ApplicationUser> userManager,
    IJwtService jwtService)
    : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var userId = jwtService.GetUserIdFromToken(r.AccessToken)
            ?? throw new UnauthorizedException("Invalid token.");

        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new UnauthorizedException("User not found.");

        if (!user.IsRefreshTokenValid(r.RefreshToken))
            throw new UnauthorizedException("Invalid or expired refresh token.");

        var newRefresh = jwtService.GenerateRefreshToken();
        user.SetRefreshToken(newRefresh, DateTime.UtcNow.AddDays(30));
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Email!, roles);
        return new AuthResponseDto(
            accessToken, newRefresh, DateTime.UtcNow.AddHours(1),
            new UserProfileDto(user.Id, user.FirstName, user.LastName, user.Email!, user.ProfileImageUrl, user.PhoneNumber, roles.ToList()));
    }
}

// FORGOT PASSWORD
public record ForgotPasswordCommand(string Email) : IRequest;

public sealed class ForgotPasswordCommandHandler(
    UserManager<ApplicationUser> userManager,
    IEmailService emailService)
    : IRequestHandler<ForgotPasswordCommand>
{
    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null) return; // Don't reveal user existence

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        await emailService.SendPasswordResetAsync(user.Email!, user.FullName, token, cancellationToken);
    }
}

// RESET PASSWORD
public record ResetPasswordCommand(ResetPasswordRequest Request) : IRequest;

public sealed class ResetPasswordCommandHandler(UserManager<ApplicationUser> userManager)
    : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var user = await userManager.FindByEmailAsync(r.Email)
            ?? throw new NotFoundException("User", r.Email);

        var result = await userManager.ResetPasswordAsync(user, r.Token, r.NewPassword);
        if (!result.Succeeded)
            throw new Domain.Exceptions.ValidationException(string.Join("; ", result.Errors.Select(e => e.Description)));
    }
}

// UPDATE PROFILE
public record UpdateProfileCommand(UpdateProfileRequest Request, Guid UserId) : IRequest<UserProfileDto>;

public sealed class UpdateProfileCommandHandler(UserManager<ApplicationUser> userManager)
    : IRequestHandler<UpdateProfileCommand, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(request.UserId.ToString())
            ?? throw new NotFoundException("User", request.UserId);

        user.UpdateProfile(request.Request.FirstName, request.Request.LastName, request.Request.ProfileImageUrl);
        user.PhoneNumber = request.Request.PhoneNumber;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        return new UserProfileDto(user.Id, user.FirstName, user.LastName, user.Email!, user.ProfileImageUrl, user.PhoneNumber, roles.ToList());
    }
}
