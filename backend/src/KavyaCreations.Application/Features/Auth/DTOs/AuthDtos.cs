namespace KavyaCreations.Application.Features.Auth.DTOs;

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiry,
    UserProfileDto User
);

public record UserProfileDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? ProfileImageUrl,
    string? PhoneNumber,
    List<string> Roles
);

public record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string ConfirmPassword
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshTokenRequest(
    string AccessToken,
    string RefreshToken
);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword,
    string ConfirmPassword
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword
);

public record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string? ProfileImageUrl,
    string? PhoneNumber
);
