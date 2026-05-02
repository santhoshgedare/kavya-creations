namespace KavyaCreations.Application.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, IList<string> roles);
    string GenerateRefreshToken();
    Guid? GetUserIdFromToken(string token);
}

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string name, string token, CancellationToken ct = default);
    Task SendPasswordResetAsync(string email, string name, string token, CancellationToken ct = default);
    Task SendOrderConfirmationAsync(string email, string name, string orderNumber, CancellationToken ct = default);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAdmin { get; }
    bool IsAuthenticated { get; }
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}

public interface IGoogleTokenValidator
{
    /// <summary>
    /// Validates a Google ID token and returns the payload if valid; otherwise throws.
    /// </summary>
    Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken ct = default);
}

public record GoogleTokenPayload(
    string Subject,    // Google user ID (sub claim)
    string Email,
    string? FirstName,
    string? LastName,
    string? PictureUrl
);

