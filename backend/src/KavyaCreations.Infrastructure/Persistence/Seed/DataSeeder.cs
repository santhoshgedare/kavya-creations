using KavyaCreations.Domain.Entities;
using KavyaCreations.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace KavyaCreations.Infrastructure.Persistence.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db, UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager, ILogger logger)
    {
        await SeedRolesAsync(roleManager);
        await SeedUsersAsync(userManager);
        await SeedCategoriesAsync(db);
        await SeedProductsAsync(db);
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        string[] roles = ["Admin", "Customer"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new ApplicationRole(role));
        }
    }

    private static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager)
    {
        // Admin user
        if (await userManager.FindByEmailAsync("admin@kavyacreations.com") is null)
        {
            var admin = new ApplicationUser
            {
                FirstName = "Kavya",
                LastName = "Admin",
                UserName = "admin@kavyacreations.com",
                Email = "admin@kavyacreations.com",
                EmailConfirmed = true,
                IsActive = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@12345");
            if (result.Succeeded) await userManager.AddToRoleAsync(admin, "Admin");
        }

        // Demo customer
        if (await userManager.FindByEmailAsync("customer@example.com") is null)
        {
            var customer = new ApplicationUser
            {
                FirstName = "Demo",
                LastName = "Customer",
                UserName = "customer@example.com",
                Email = "customer@example.com",
                EmailConfirmed = true,
                IsActive = true
            };
            var result = await userManager.CreateAsync(customer, "Customer@12345");
            if (result.Succeeded) await userManager.AddToRoleAsync(customer, "Customer");
        }
    }

    private static async Task SeedCategoriesAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        var categories = new[]
        {
            Category.Create("Bangles", "bangles", "Handcrafted bangles in gold, silver, and mixed metals"),
            Category.Create("Earrings", "earrings", "Artisanal earrings from studs to chandeliers"),
            Category.Create("Necklaces", "necklaces", "Traditional and contemporary handcrafted necklaces"),
            Category.Create("Accessories", "accessories", "Handmade rings, anklets, and other jewellery"),
        };
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();
    }

    private static async Task SeedProductsAsync(AppDbContext db)
    {
        if (await db.Products.AnyAsync()) return;

        var banglesId = (await db.Categories.FirstAsync(c => c.Slug == "bangles")).Id;
        var earringsId = (await db.Categories.FirstAsync(c => c.Slug == "earrings")).Id;
        var necklacesId = (await db.Categories.FirstAsync(c => c.Slug == "necklaces")).Id;
        var accessoriesId = (await db.Categories.FirstAsync(c => c.Slug == "accessories")).Id;

        var products = new[]
        {
            CreateProduct("Golden Filigree Bangle Set", "golden-filigree-bangle-set",
                "A stunning set of 6 handcrafted gold-plated bangles with intricate filigree work. Each bangle is individually crafted by skilled artisans using traditional techniques passed down through generations.",
                "Set of 6 gold-plated filigree bangles", 1299, banglesId, "Gold-plated Brass", true,
                "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800"),
            CreateProduct("Silver Oxidized Bangle", "silver-oxidized-bangle",
                "Traditional oxidized silver bangle with floral motifs. Handcrafted by tribal artisans from Rajasthan using antique silver techniques.",
                "Oxidized silver bangle with floral motifs", 849, banglesId, "Oxidized Silver", false,
                "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800"),
            CreateProduct("Kundan Embellished Bangle", "kundan-embellished-bangle",
                "Elegant bangle adorned with kundan stones in emerald and ruby. A statement piece for festive occasions and weddings.",
                "Kundan stone embellished gold bangle", 2199, banglesId, "22kt Gold-plated", true,
                "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800"),
            CreateProduct("Jhumka Drop Earrings", "jhumka-drop-earrings",
                "Classic Indian jhumka earrings with intricate bell-shaped drops. Handcrafted in gold-plated brass with tiny pearl accents.",
                "Gold-plated jhumka earrings with pearls", 699, earringsId, "Gold-plated Brass", true,
                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800"),
            CreateProduct("Silver Chandbali Earrings", "silver-chandbali-earrings",
                "Moon-shaped chandbali earrings in pure silver with delicate engravings. A timeless design that complements both traditional and fusion outfits.",
                "Pure silver chandbali earrings", 1149, earringsId, "925 Sterling Silver", false,
                "https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=800"),
            CreateProduct("Kolhapuri Necklace", "kolhapuri-necklace",
                "Authentic Kolhapuri-style necklace with multiple gold-plated strands and traditional coin pendants. Handcrafted in Maharashtra.",
                "Traditional Kolhapuri multi-strand necklace", 3499, necklacesId, "Gold-plated Brass", true,
                "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800"),
            CreateProduct("Temple Jewellery Necklace", "temple-jewellery-necklace",
                "Inspired by South Indian temple art, this necklace features deities and floral motifs in gold plating. Perfect for classical dance and weddings.",
                "South Indian temple jewellery necklace", 4599, necklacesId, "Gold-plated Copper", true,
                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"),
            CreateProduct("Meenakari Ring", "meenakari-ring",
                "Vibrant enamel ring with traditional Meenakari artwork in blue and red. Each piece is hand-painted by artisans from Jaipur.",
                "Handpainted Meenakari enamel ring", 549, accessoriesId, "Silver with Enamel", false,
                "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"),
            CreateProduct("Oxidized Anklet Pair", "oxidized-anklet-pair",
                "Pair of oxidized silver anklets with tiny bells and leaf motifs. Handcrafted to produce a melodious sound with every step.",
                "Oxidized silver anklet pair with bells", 449, accessoriesId, "Oxidized Silver", false,
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800"),
        };

        db.Products.AddRange(products);
        await db.SaveChangesAsync();
    }

    private static Product CreateProduct(
        string name, string slug, string description, string shortDescription,
        decimal price, Guid categoryId, string material, bool featured, string imageUrl)
    {
        var product = Product.Create(name, slug, description, price, 25, categoryId, material, shortDescription);
        product.SetFeatured(featured, "seed");
        return product;
    }
}
