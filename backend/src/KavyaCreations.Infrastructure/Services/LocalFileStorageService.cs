using KavyaCreations.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace KavyaCreations.Infrastructure.Services;

public sealed class LocalFileStorageService(IWebHostEnvironment env) : IFileStorageService
{
    private static readonly HashSet<string> AllowedContentTypes =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

    private static readonly HashSet<string> AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public async Task<string> UploadAsync(Stream stream, string originalFileName, string contentType, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

        if (!AllowedContentTypes.Contains(contentType.ToLowerInvariant()))
            throw new InvalidOperationException($"File type '{contentType}' is not allowed. Only images are accepted.");

        if (!AllowedExtensions.Contains(extension))
            throw new InvalidOperationException($"File extension '{extension}' is not allowed.");

        if (stream.CanSeek && stream.Length > MaxFileSizeBytes)
            throw new InvalidOperationException($"File size exceeds the maximum allowed size of 10 MB.");

        var webRootPath = env.WebRootPath;
        if (string.IsNullOrEmpty(webRootPath))
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        var uploadsDir = Path.Combine(webRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var safeFileName = Path.GetFileNameWithoutExtension(originalFileName)
            .Replace(" ", "-")
            .ToLowerInvariant();
        // Keep only safe characters
        safeFileName = new string(safeFileName.Where(c => char.IsLetterOrDigit(c) || c == '-').ToArray());
        safeFileName = string.IsNullOrEmpty(safeFileName) ? "image" : safeFileName[..Math.Min(safeFileName.Length, 40)];

        var uniqueName = $"{safeFileName}-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsDir, uniqueName);

        await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true);
        await stream.CopyToAsync(fileStream, ct);

        return $"/uploads/{uniqueName}";
    }

    public Task DeleteAsync(string relativeUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
            return Task.CompletedTask;

        // Prevent path traversal
        var fileName = Path.GetFileName(relativeUrl);
        if (string.IsNullOrWhiteSpace(fileName))
            return Task.CompletedTask;

        var webRootPath = env.WebRootPath;
        if (string.IsNullOrEmpty(webRootPath))
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        var filePath = Path.Combine(webRootPath, "uploads", fileName);

        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }
}
