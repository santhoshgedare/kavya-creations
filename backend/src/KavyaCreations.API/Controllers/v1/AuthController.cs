using Asp.Versioning;
using KavyaCreations.Application.Features.Auth.Commands;
using KavyaCreations.Application.Features.Auth.DTOs;
using KavyaCreations.Application.Features.Auth.Queries;
using KavyaCreations.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
public sealed class AuthController(ISender mediator, ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType<AuthResponseDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new RegisterCommand(request), ct);
        return CreatedAtAction(nameof(GetProfile), result);
    }

    [HttpPost("login")]
    [ProducesResponseType<AuthResponseDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new LoginCommand(request), ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponseDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new RefreshTokenCommand(request), ct);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await mediator.Send(new ForgotPasswordCommand(request.Email), ct);
        return Ok(new { message = "If an account exists, a reset email has been sent." });
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await mediator.Send(new ResetPasswordCommand(request), ct);
        return Ok(new { message = "Password reset successfully." });
    }

    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType<UserProfileDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var result = await mediator.Send(new GetProfileQuery(currentUser.UserId!.Value), ct);
        return Ok(result);
    }

    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType<UserProfileDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateProfileCommand(request, currentUser.UserId!.Value), ct);
        return Ok(result);
    }
}
