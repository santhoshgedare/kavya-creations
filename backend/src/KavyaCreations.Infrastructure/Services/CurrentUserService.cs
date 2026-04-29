using KavyaCreations.Application.Interfaces;
using KavyaCreations.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace KavyaCreations.Infrastructure.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var id = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return id is null ? null : Guid.TryParse(id, out var guid) ? guid : null;
        }
    }

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);

    public bool IsAdmin => Principal?.IsInRole("Admin") ?? false;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
}
