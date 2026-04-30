namespace KavyaCreations.Application.Interfaces;

public interface IFileStorageService
{
    /// <summary>Uploads a file stream and returns the public relative URL (e.g. /uploads/abc.jpg).</summary>
    Task<string> UploadAsync(Stream stream, string originalFileName, string contentType, CancellationToken ct = default);

    /// <summary>Deletes the file at the given relative URL path.</summary>
    Task DeleteAsync(string relativeUrl, CancellationToken ct = default);
}
