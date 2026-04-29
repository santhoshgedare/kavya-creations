using KavyaCreations.API.Data;
using KavyaCreations.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private static readonly List<Category> _categories = SeedData.GetCategories();

    [HttpGet]
    public ActionResult<IEnumerable<Category>> GetAll()
    {
        return Ok(_categories);
    }

    [HttpGet("{slug}")]
    public ActionResult<Category> GetBySlug(string slug)
    {
        var category = _categories.FirstOrDefault(c => c.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase));
        if (category is null) return NotFound();
        return Ok(category);
    }
}
