using KavyaCreations.API.Models;

namespace KavyaCreations.API.Data;

public static class SeedData
{
    public static List<Category> GetCategories() =>
    [
        new() { Id = 1, Name = "Bangles", Slug = "bangles", Description = "Handcrafted bangles in gold, silver, and mixed metals with intricate designs.", ImageUrl = "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600" },
        new() { Id = 2, Name = "Earrings", Slug = "earrings", Description = "Artisanal earrings ranging from delicate studs to statement jhumkas.", ImageUrl = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600" },
        new() { Id = 3, Name = "Necklaces", Slug = "necklaces", Description = "Handmade necklaces with traditional and contemporary designs.", ImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600" },
        new() { Id = 4, Name = "Accessories", Slug = "accessories", Description = "Artisanal jewelry accessories — anklets, rings, and maang tikkas.", ImageUrl = "https://images.unsplash.com/photo-1601121141461-9d6647bef0a4?w=600" },
    ];

    public static List<Product> GetProducts() =>
    [
        // Bangles
        new() { Id = 1, Name = "Golden Filigree Bangle Set", Description = "A stunning set of 6 handcrafted gold-plated bangles with intricate filigree work. Each bangle is individually crafted by skilled artisans using traditional techniques passed down through generations.", Price = 1299.00m, ImageUrl = "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800", Category = "bangles", IsAvailable = true, IsFeatured = true, Material = "Gold-plated Brass", StockQuantity = 15 },
        new() { Id = 2, Name = "Silver Oxidized Bangle", Description = "Traditional oxidized silver bangle with floral motifs. Handcrafted by tribal artisans from Rajasthan using antique silver techniques.", Price = 849.00m, ImageUrl = "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800", Category = "bangles", IsAvailable = true, IsFeatured = false, Material = "Oxidized Silver", StockQuantity = 20 },
        new() { Id = 3, Name = "Kundan Embellished Bangle", Description = "Elegant bangle adorned with kundan stones in emerald and ruby. A statement piece for festive occasions and weddings.", Price = 2199.00m, ImageUrl = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800", Category = "bangles", IsAvailable = true, IsFeatured = true, Material = "22kt Gold-plated", StockQuantity = 8 },
        new() { Id = 4, Name = "Lac Bangle Set (Multicolor)", Description = "Vibrant lac bangles with mirror work in festive colors. Handmade by artisans in Jaipur using traditional lac craft.", Price = 599.00m, ImageUrl = "https://images.unsplash.com/photo-1601121141461-9d6647bef0a4?w=800", Category = "bangles", IsAvailable = true, IsFeatured = false, Material = "Lac & Mirrors", StockQuantity = 30 },

        // Earrings
        new() { Id = 5, Name = "Jhumka Earrings — Gold", Description = "Classic gold jhumka earrings with bell-shaped drops and intricate filigree. A timeless piece that complements both traditional and contemporary outfits.", Price = 999.00m, ImageUrl = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800", Category = "earrings", IsAvailable = true, IsFeatured = true, Material = "Gold-plated Brass", StockQuantity = 25 },
        new() { Id = 6, Name = "Terracotta Stud Earrings", Description = "Lightweight terracotta earrings with hand-painted floral designs. Eco-friendly and perfect for everyday wear.", Price = 349.00m, ImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", Category = "earrings", IsAvailable = true, IsFeatured = false, Material = "Terracotta Clay", StockQuantity = 40 },
        new() { Id = 7, Name = "Pearl Drop Earrings", Description = "Delicate freshwater pearl drop earrings with a gold vermeil setting. Perfect for weddings and formal occasions.", Price = 1499.00m, ImageUrl = "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800", Category = "earrings", IsAvailable = true, IsFeatured = true, Material = "Freshwater Pearl, Gold Vermeil", StockQuantity = 12 },
        new() { Id = 8, Name = "Chandbali Earrings", Description = "Traditional crescent-shaped chandbali earrings studded with meenakari work in vibrant colors.", Price = 1799.00m, ImageUrl = "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800", Category = "earrings", IsAvailable = true, IsFeatured = false, Material = "Silver with Meenakari", StockQuantity = 10 },

        // Necklaces
        new() { Id = 9, Name = "Temple Jewellery Necklace", Description = "Handcrafted temple jewellery necklace in antique gold finish. Features deities and floral motifs etched by hand.", Price = 3499.00m, ImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", Category = "necklaces", IsAvailable = true, IsFeatured = true, Material = "Antique Gold-plated", StockQuantity = 5 },
        new() { Id = 10, Name = "Beaded Choker Necklace", Description = "Colorful handmade beaded choker with seed beads in traditional patterns. Light and perfect for summer wear.", Price = 449.00m, ImageUrl = "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800", Category = "necklaces", IsAvailable = true, IsFeatured = false, Material = "Glass Beads", StockQuantity = 35 },
        new() { Id = 11, Name = "Hasli Necklace — Silver", Description = "Traditional torque-style hasli necklace in sterling silver. A bold statement piece with tribal-inspired engravings.", Price = 2799.00m, ImageUrl = "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800", Category = "necklaces", IsAvailable = true, IsFeatured = false, Material = "Sterling Silver", StockQuantity = 7 },

        // Accessories
        new() { Id = 12, Name = "Silver Anklet Set", Description = "Pair of handcrafted silver anklets with tiny bells that create a melodious sound with each step. Traditional payal design.", Price = 899.00m, ImageUrl = "https://images.unsplash.com/photo-1601121141461-9d6647bef0a4?w=800", Category = "accessories", IsAvailable = true, IsFeatured = true, Material = "Sterling Silver", StockQuantity = 18 },
        new() { Id = 13, Name = "Maang Tikka — Kundan", Description = "Ornate maang tikka with kundan stones and a pearl drop. Perfect for bridal and festive occasions.", Price = 1649.00m, ImageUrl = "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800", Category = "accessories", IsAvailable = true, IsFeatured = true, Material = "Gold-plated, Kundan", StockQuantity = 10 },
        new() { Id = 14, Name = "Statement Ring — Floral", Description = "Large adjustable floral cocktail ring in oxidized silver. A bold accessory for casual and festive wear.", Price = 549.00m, ImageUrl = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", Category = "accessories", IsAvailable = true, IsFeatured = false, Material = "Oxidized Silver", StockQuantity = 22 },
    ];
}
