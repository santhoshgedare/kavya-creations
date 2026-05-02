using Google.Apis.Auth;
using KavyaCreations.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace KavyaCreations.Infrastructure.Services;

public sealed class GoogleTokenValidator(IConfiguration configuration) : IGoogleTokenValidator
{
    private readonly string? _clientId = configuration["Google:ClientId"];

    public async Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken ct = default)
    {
        var settings = new GoogleJsonWebSignature.ValidationSettings();
        if (!string.IsNullOrWhiteSpace(_clientId))
            settings.Audience = [_clientId];

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            throw new Domain.Exceptions.UnauthorizedException($"Invalid Google ID token: {ex.Message}");
        }

        return new GoogleTokenPayload(
            Subject:    payload.Subject,
            Email:      payload.Email,
            FirstName:  payload.GivenName,
            LastName:   payload.FamilyName,
            PictureUrl: payload.Picture
        );
    }
}
