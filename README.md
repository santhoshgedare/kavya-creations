# Kavya Creations 💎

A handcrafted jewelry e-commerce application built with **.NET 10 Web API** and **Angular 21**.

Featuring unique bangles, earrings, necklaces, and artisanal accessories — each piece crafted with love and tradition.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21 (standalone components, signals) |
| Backend | ASP.NET Core 10 Web API |
| Styling | SCSS with responsive design |
| State | Angular Signals (cart) |
| API Comm | Angular HttpClient with dev proxy |

---

## 📁 Project Structure

```
kavya-creations/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/             # Landing page with hero + featured products
│   │   │   ├── navbar/           # Sticky top navigation with cart badge
│   │   │   ├── products/         # Product listing with category filter & search
│   │   │   ├── product-detail/   # Product detail page with related items
│   │   │   ├── cart/             # Shopping cart with quantity management
│   │   │   └── footer/           # Site footer
│   │   ├── models/               # TypeScript interfaces (Product, Category, CartItem)
│   │   ├── services/             # ProductService, CartService
│   │   ├── app.routes.ts         # Angular routing
│   │   └── app.config.ts         # App configuration (HttpClient, Router)
│   └── styles.scss               # Global styles
├── api/                          # .NET 10 Web API backend
│   ├── Controllers/
│   │   ├── ProductsController.cs # GET /api/products, /api/products/featured, /api/products/{id}
│   │   └── CategoriesController.cs # GET /api/categories, /api/categories/{slug}
│   ├── Models/                   # Product, Category, CartItem models
│   ├── Data/SeedData.cs          # In-memory seed data (14 jewellery products)
│   └── Program.cs                # App startup with CORS
├── proxy.conf.json               # Angular → API proxy config
└── KavyaCreations.sln            # .NET solution file
```

---

## 🚀 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) and npm

### Run the Backend (.NET API)

```bash
# From repo root
dotnet run --project api/KavyaCreations.API.csproj
# API available at http://localhost:5000
```

Or with npm:
```bash
npm run start:api
```

### Run the Frontend (Angular)

```bash
# Install dependencies (first time)
npm install

# Start Angular dev server (proxies /api to :5000)
npm start
# App available at http://localhost:4200
```

### Build for Production

```bash
# Build Angular
npm run build

# Build .NET API
dotnet publish api/KavyaCreations.API.csproj -c Release
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products (optional `?category=bangles`) |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/{id}` | Get a single product |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/{slug}` | Get category by slug |

---

## ✨ Features

- **Home page** — Hero section, category showcase, featured products, value propositions
- **Product listing** — Filter by category, full-text search, skeleton loading states
- **Product detail** — Image gallery, quantity selector, related products
- **Shopping cart** — Add/remove/update quantity, order summary, checkout flow
- **Responsive design** — Works beautifully on mobile and desktop
- **Categories** — Bangles, Earrings, Necklaces, Accessories

---

Made with ❤️ by Kavya

