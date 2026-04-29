using Microsoft.AspNetCore.Identity;

namespace KavyaCreations.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();

    public ICollection<Order> Orders { get; set; } = [];
    public Cart? Cart { get; set; }

    public void UpdateProfile(string firstName, string lastName, string? profileImageUrl = null)
    {
        FirstName = firstName;
        LastName = lastName;
        ProfileImageUrl = profileImageUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetRefreshToken(string token, DateTime expiry)
    {
        RefreshToken = token;
        RefreshTokenExpiry = expiry;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RevokeRefreshToken()
    {
        RefreshToken = null;
        RefreshTokenExpiry = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsRefreshTokenValid(string token) =>
        RefreshToken == token && RefreshTokenExpiry > DateTime.UtcNow;
}
