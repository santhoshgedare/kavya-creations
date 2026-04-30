using Asp.Versioning;
using KavyaCreations.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/images")]
public sealed class ImagesController(IFileStorageService fileStorage) : ControllerBase
{
    private const int MaxFiles = 10;
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    /// <summary>Upload one or more product images. Returns the relative URLs of the saved files.</summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB total request
    [ProducesResponseType<IReadOnlyList<string>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IList<IFormFile> files, CancellationToken ct)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { message = "No files were provided." });

        if (files.Count > MaxFiles)
            return BadRequest(new { message = $"You may upload at most {MaxFiles} files at once." });

        var urls = new List<string>(files.Count);
        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            if (file.Length > MaxFileSizeBytes)
                return BadRequest(new { message = $"File '{file.FileName}' exceeds the 10 MB size limit." });

            var url = await fileStorage.UploadAsync(file.OpenReadStream(), file.FileName, file.ContentType, ct);
            urls.Add(url);
        }

        return Ok(urls);
    }

    /// <summary>Delete a previously uploaded image by its relative path.</summary>
    [HttpDelete]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete([FromQuery] string path, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest(new { message = "Path is required." });

        await fileStorage.DeleteAsync(path, ct);
        return NoContent();
    }
}
