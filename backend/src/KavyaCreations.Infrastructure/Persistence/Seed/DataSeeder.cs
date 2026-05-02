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
        await SeedAttributesAsync(db);
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

    private static async Task SeedAttributesAsync(AppDbContext db)
    {
        if (await db.ProductAttributes.AnyAsync()) return;

        // ── Create attributes ──────────────────────────────────────────────────
        var metalType = ProductAttribute.Create("metal_type", "Metal Type", "select");
        var size      = ProductAttribute.Create("size",       "Size",       "chips");
        var finish    = ProductAttribute.Create("finish",     "Finish",     "select");

        db.ProductAttributes.AddRange(metalType, size, finish);
        await db.SaveChangesAsync();

        // ── Attribute values ───────────────────────────────────────────────────
        var metalValues = new[]
        {
            ProductAttributeValue.Create(metalType.Id, "gold_plated",   "Gold Plated",   0),
            ProductAttributeValue.Create(metalType.Id, "silver_925",    "925 Silver",    1),
            ProductAttributeValue.Create(metalType.Id, "rose_gold",     "Rose Gold",     2),
            ProductAttributeValue.Create(metalType.Id, "oxidized",      "Oxidized",      3),
            ProductAttributeValue.Create(metalType.Id, "brass",         "Brass",         4),
        };
        var sizeValues = new[]
        {
            ProductAttributeValue.Create(size.Id, "xs",         "XS",          0),
            ProductAttributeValue.Create(size.Id, "s",          "S",           1),
            ProductAttributeValue.Create(size.Id, "m",          "M",           2),
            ProductAttributeValue.Create(size.Id, "l",          "L",           3),
            ProductAttributeValue.Create(size.Id, "xl",         "XL",          4),
            ProductAttributeValue.Create(size.Id, "free_size",  "Free Size",   5),
        };
        var finishValues = new[]
        {
            ProductAttributeValue.Create(finish.Id, "polished",   "Polished",    0),
            ProductAttributeValue.Create(finish.Id, "matte",      "Matte",       1),
            ProductAttributeValue.Create(finish.Id, "antique",    "Antique",     2),
            ProductAttributeValue.Create(finish.Id, "textured",   "Textured",    3),
        };

        db.ProductAttributeValues.AddRange(metalValues);
        db.ProductAttributeValues.AddRange(sizeValues);
        db.ProductAttributeValues.AddRange(finishValues);
        await db.SaveChangesAsync();

        // ── Map attributes to categories ───────────────────────────────────────
        var banglesId     = (await db.Categories.FirstAsync(c => c.Slug == "bangles")).Id;
        var earringsId    = (await db.Categories.FirstAsync(c => c.Slug == "earrings")).Id;
        var necklacesId   = (await db.Categories.FirstAsync(c => c.Slug == "necklaces")).Id;
        var accessoriesId = (await db.Categories.FirstAsync(c => c.Slug == "accessories")).Id;

        var mappings = new[]
        {
            // Bangles: Metal Type (required), Size, Finish
            CategoryAttributeMapping.Create(banglesId,     metalType.Id, 0, isRequired: true),
            CategoryAttributeMapping.Create(banglesId,     size.Id,      1),
            CategoryAttributeMapping.Create(banglesId,     finish.Id,    2),
            // Earrings: Metal Type (required), Finish
            CategoryAttributeMapping.Create(earringsId,   metalType.Id, 0, isRequired: true),
            CategoryAttributeMapping.Create(earringsId,   finish.Id,    1),
            // Necklaces: Metal Type (required), Finish
            CategoryAttributeMapping.Create(necklacesId,  metalType.Id, 0, isRequired: true),
            CategoryAttributeMapping.Create(necklacesId,  finish.Id,    1),
            // Accessories: Metal Type, Size, Finish
            CategoryAttributeMapping.Create(accessoriesId, metalType.Id, 0, isRequired: true),
            CategoryAttributeMapping.Create(accessoriesId, size.Id,      1),
            CategoryAttributeMapping.Create(accessoriesId, finish.Id,    2),
        };

        db.CategoryAttributeMappings.AddRange(mappings);
        await db.SaveChangesAsync();
    }

    private static async Task SeedProductsAsync(AppDbContext db)
    {
        if (await db.Products.AnyAsync()) return;

        var banglesId     = (await db.Categories.FirstAsync(c => c.Slug == "bangles")).Id;
        var earringsId    = (await db.Categories.FirstAsync(c => c.Slug == "earrings")).Id;
        var necklacesId   = (await db.Categories.FirstAsync(c => c.Slug == "necklaces")).Id;
        var accessoriesId = (await db.Categories.FirstAsync(c => c.Slug == "accessories")).Id;

        var productSeeds = new[]
        {
            (Name: "Golden Filigree Bangle Set",   Slug: "golden-filigree-bangle-set",
             Desc: "A stunning set of 6 handcrafted gold-plated bangles with intricate filigree work. Each bangle is individually crafted by skilled artisans using traditional techniques passed down through generations.",
             Short: "Set of 6 gold-plated filigree bangles", Price: 1299m, CatId: banglesId,
             Featured: true,
             Image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800"),
            (Name: "Silver Oxidized Bangle",        Slug: "silver-oxidized-bangle",
             Desc: "Traditional oxidized silver bangle with floral motifs. Handcrafted by tribal artisans from Rajasthan using antique silver techniques.",
             Short: "Oxidized silver bangle with floral motifs", Price: 849m, CatId: banglesId,
             Featured: false,
             Image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800"),
            (Name: "Kundan Embellished Bangle",     Slug: "kundan-embellished-bangle",
             Desc: "Elegant bangle adorned with kundan stones in emerald and ruby. A statement piece for festive occasions and weddings.",
             Short: "Kundan stone embellished gold bangle", Price: 2199m, CatId: banglesId,
             Featured: true,
             Image: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800"),
            (Name: "Jhumka Drop Earrings",           Slug: "jhumka-drop-earrings",
             Desc: "Classic Indian jhumka earrings with intricate bell-shaped drops. Handcrafted in gold-plated brass with tiny pearl accents.",
             Short: "Gold-plated jhumka earrings with pearls", Price: 699m, CatId: earringsId,
             Featured: true,
             Image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800"),
            (Name: "Silver Chandbali Earrings",      Slug: "silver-chandbali-earrings",
             Desc: "Moon-shaped chandbali earrings in pure silver with delicate engravings. A timeless design that complements both traditional and fusion outfits.",
             Short: "Pure silver chandbali earrings", Price: 1149m, CatId: earringsId,
             Featured: false,
             Image: "https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=800"),
            (Name: "Kolhapuri Necklace",             Slug: "kolhapuri-necklace",
             Desc: "Authentic Kolhapuri-style necklace with multiple gold-plated strands and traditional coin pendants. Handcrafted in Maharashtra.",
             Short: "Traditional Kolhapuri multi-strand necklace", Price: 3499m, CatId: necklacesId,
             Featured: true,
             Image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800"),
            (Name: "Temple Jewellery Necklace",      Slug: "temple-jewellery-necklace",
             Desc: "Inspired by South Indian temple art, this necklace features deities and floral motifs in gold plating. Perfect for classical dance and weddings.",
             Short: "South Indian temple jewellery necklace", Price: 4599m, CatId: necklacesId,
             Featured: true,
             Image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"),
            (Name: "Meenakari Ring",                 Slug: "meenakari-ring",
             Desc: "Vibrant enamel ring with traditional Meenakari artwork in blue and red. Each piece is hand-painted by artisans from Jaipur.",
             Short: "Handpainted Meenakari enamel ring", Price: 549m, CatId: accessoriesId,
             Featured: false,
             Image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"),
            (Name: "Oxidized Anklet Pair",           Slug: "oxidized-anklet-pair",
             Desc: "Pair of oxidized silver anklets with tiny bells and leaf motifs. Handcrafted to produce a melodious sound with every step.",
             Short: "Oxidized silver anklet pair with bells", Price: 449m, CatId: accessoriesId,
             Featured: false,
             Image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800"),
        };

        var products = productSeeds.Select(s =>
        {
            var product = Product.Create(s.Name, s.Slug, s.Desc, s.Price, 25, s.CatId, s.Short);
            product.SetFeatured(s.Featured, "seed");
            return (product, s.Image, s.Name);
        }).ToList();

        db.Products.AddRange(products.Select(p => p.product));
        await db.SaveChangesAsync();

        foreach (var (product, imageUrl, name) in products)
            db.ProductImages.Add(ProductImage.Create(product.Id, imageUrl, isPrimary: true, altText: name));

        await db.SaveChangesAsync();
    }
}
