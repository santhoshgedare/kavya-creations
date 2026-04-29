namespace KavyaCreations.Domain.ValueObjects;

public sealed class Address : IEquatable<Address>
{
    public string Street { get; }
    public string City { get; }
    public string State { get; }
    public string PostalCode { get; }
    public string Country { get; }

    private Address(string street, string city, string state, string postalCode, string country)
    {
        Street = street;
        City = city;
        State = state;
        PostalCode = postalCode;
        Country = country;
    }

    public static Address Create(string street, string city, string state, string postalCode, string country)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(street);
        ArgumentException.ThrowIfNullOrWhiteSpace(city);
        ArgumentException.ThrowIfNullOrWhiteSpace(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(postalCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(country);
        return new Address(street, city, state, postalCode, country);
    }

    public bool Equals(Address? other) =>
        other is not null && Street == other.Street && City == other.City
        && State == other.State && PostalCode == other.PostalCode && Country == other.Country;

    public override bool Equals(object? obj) => obj is Address address && Equals(address);
    public override int GetHashCode() => HashCode.Combine(Street, City, State, PostalCode, Country);
    public override string ToString() => $"{Street}, {City}, {State} {PostalCode}, {Country}";
}
