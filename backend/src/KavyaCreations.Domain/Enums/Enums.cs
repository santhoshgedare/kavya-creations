namespace KavyaCreations.Domain.Enums;

public enum ProductStatus
{
    Active = 1,
    Inactive = 2,
    OutOfStock = 3,
    Discontinued = 4
}

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Processing = 3,
    Shipped = 4,
    Delivered = 5,
    Cancelled = 6,
    Refunded = 7
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Failed = 3,
    Refunded = 4
}

public enum UserRole
{
    Customer = 1,
    Admin = 2
}
