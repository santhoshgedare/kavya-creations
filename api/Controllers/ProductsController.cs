using KavyaCreations.API.Data;
using KavyaCreations.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace KavyaCreations.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private static readonly List<Product> _products = SeedData.GetProducts();

    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll([FromQuery] string? category = null)
    {
        var query = _products.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        return Ok(query);
    }

    [HttpGet("featured")]
    public ActionResult<IEnumerable<Product>> GetFeatured()
    {
        return Ok(_products.Where(p => p.IsFeatured));
    }

    [HttpGet("{id:int}")]
    public ActionResult<Product> GetById(int id)
    {
        var product = _products.FirstOrDefault(p => p.Id == id);
        if (product is null) return NotFound();
        return Ok(product);
    }
}
