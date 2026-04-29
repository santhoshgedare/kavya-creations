# Kavya Creations 💍

A production-ready full-stack e-commerce platform for handcrafted jewellery — bangles, earrings, necklaces, and accessories.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | .NET 10 · ASP.NET Core Web API |
| **Architecture** | Clean Architecture · CQRS · MediatR |
| **Database** | PostgreSQL · Entity Framework Core 10 |
| **Auth** | ASP.NET Core Identity · JWT + Refresh Tokens |
| **Validation** | FluentValidation |
| **Logging** | Serilog (console + rolling file) |
| **Rate Limiting** | AspNetCoreRateLimit |
| **Frontend** | Angular 21 · Angular Material |
| **State** | Angular Signals |

---

## Project Structure

```
kavya-creations/
├── backend/                          # .NET 10 Clean Architecture solution
│   ├── src/
│   │   ├── KavyaCreations.Domain/    # Entities, Value Objects, Domain Events
│   │   ├── KavyaCreations.Application/ # CQRS (MediatR), DTOs, Validators
│   │   ├── KavyaCreations.Infrastructure/ # EF Core, Identity, JWT, Email
│   │   └── KavyaCreations.API/       # Controllers, Middleware, Program.cs
│   └── KavyaCreations.slnx
└── frontend/                         # Angular 21 app
    └── src/app/
        ├── core/                     # Services, Guards, Interceptors, Models
        ├── layout/                   # Navbar, Footer
        └── features/                 # Auth, Products, Cart, Checkout, Profile, Admin
```

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`

---

## Getting Started

### 1. Database — PostgreSQL

Create a database:
```sql
CREATE DATABASE kavya_creations_dev;
```

### 2. Backend — .NET 10 API

```bash
cd backend

# Update connection string in src/KavyaCreations.API/appsettings.Development.json
# "DefaultConnection": "Host=localhost;Port=5432;Database=kavya_creations_dev;Username=postgres;Password=YOUR_PASSWORD"

# Install EF Core tools (if not already installed)
dotnet tool install --global dotnet-ef

# Create and apply migrations
dotnet ef migrations add InitialCreate --project src/KavyaCreations.Infrastructure --startup-project src/KavyaCreations.API
dotnet ef database update --project src/KavyaCreations.Infrastructure --startup-project src/KavyaCreations.API

# Run the API (auto-migrates + seeds data on startup)
dotnet run --project src/KavyaCreations.API
```

API runs at: **http://localhost:5034**  
Swagger UI: **http://localhost:5034/swagger**

### 3. Frontend — Angular 21

```bash
cd frontend

npm install
ng serve
```

Frontend runs at: **http://localhost:4200**

---

## Default Accounts (Seed Data)

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@kavyacreations.com | Admin@12345 |
| **Customer** | customer@example.com | Customer@12345 |

---

## API Endpoints (v1)

Base URL: `http://localhost:5034/api/v1`

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/auth/register` | Public |
| `POST` | `/auth/login` | Public |
| `POST` | `/auth/refresh` | Public |
| `POST` | `/auth/forgot-password` | Public |
| `POST` | `/auth/reset-password` | Public |
| `GET` | `/auth/profile` | 🔒 User |
| `PUT` | `/auth/profile` | 🔒 User |

### Products
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/products?page=1&pageSize=12&category=bangles&search=gold&sortBy=price&sortDir=asc` | Public |
| `GET` | `/products/{id}` | Public |
| `GET` | `/products/slug/{slug}` | Public |
| `POST` | `/products` | 🔒 Admin |
| `PUT` | `/products/{id}` | 🔒 Admin |
| `DELETE` | `/products/{id}` | 🔒 Admin |

### Categories
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/categories` | Public |
| `GET` | `/categories/{slug}` | Public |
| `POST` | `/categories` | 🔒 Admin |
| `PUT` | `/categories/{id}` | 🔒 Admin |
| `DELETE` | `/categories/{id}` | 🔒 Admin |

### Cart
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/cart` | 🔒 User |
| `POST` | `/cart/items` | 🔒 User |
| `PUT` | `/cart/items/{productId}` | 🔒 User |
| `DELETE` | `/cart/items/{productId}` | 🔒 User |

### Orders
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/orders/mine` | 🔒 User |
| `GET` | `/orders/{id}` | 🔒 User |
| `POST` | `/orders` | 🔒 User |
| `GET` | `/orders` | 🔒 Admin |
| `PUT` | `/orders/{id}/status` | 🔒 Admin |

---

## Frontend Features

| Feature | Route |
|---|---|
| Home / Hero + Featured Products | `/` |
| Product Listing (filter/search/sort/paginate) | `/products` |
| Product Detail | `/products/:slug` |
| Shopping Cart | `/cart` |
| Checkout | `/checkout` |
| Order Detail | `/orders/:id` |
| User Profile + Order History | `/profile` |
| Login / Register | `/auth/login`, `/auth/register` |
| Forgot / Reset Password | `/auth/forgot-password`, `/auth/reset-password` |
| Admin Dashboard | `/admin` |
| Admin Product Management | `/admin/products` |
| Admin Order Management | `/admin/orders` |

---

## Configuration

### Backend (`backend/src/KavyaCreations.API/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=kavya_creations;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "SecretKey": "change-this-in-production",
    "Issuer": "KavyaCreations",
    "Audience": "KavyaCreations",
    "AccessTokenExpiryMinutes": 60
  },
  "Email": {
    "Host": "smtp.your-provider.com",
    "Port": 587,
    "Username": "your-email",
    "Password": "your-password",
    "FromEmail": "noreply@kavyacreations.com"
  }
}
```

> **Note:** Email is optional for development. Password reset emails are silently skipped when `Email.Host` is empty.

### Frontend (`frontend/src/environments/environment.ts`)

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5034/api/v1'
};
```

---

## Seed Data

The API auto-seeds on startup in development:

- **4 Categories**: Bangles, Earrings, Necklaces, Accessories
- **9 Products**: Golden Filigree Bangles, Jhumka Earrings, Kolhapuri Necklace, Meenakari Ring, and more
- **2 Users**: Admin + Demo Customer

---

## Architecture Overview

```
API Layer          → Controllers, Middleware, Swagger
Application Layer  → CQRS Commands/Queries (MediatR), DTOs, FluentValidation
Domain Layer       → Entities, Value Objects (Money, Address), Domain Events
Infrastructure     → EF Core DbContext, Identity, JWT Service, Email Service
```

### Key Design Decisions

- **CQRS with MediatR** — Commands and Queries are separate. Each handler lives alongside its request.
- **Value Objects** — `Money` (with currency) and `Address` are immutable value objects, preventing primitive obsession.
- **Soft Delete** — All entities support `IsDeleted` for data recovery.
- **Audit Fields** — `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy` on every entity.
- **JWT + Refresh Tokens** — Access tokens expire in 60 minutes; refresh tokens in 30 days.
- **Rate Limiting** — Login endpoint is limited to 10 requests per 10 minutes to prevent brute force.
- **Signals** — Angular state managed with signals; no NgRx boilerplate.
- **Lazy Loading** — All Angular feature modules are lazy-loaded for fast initial load.
