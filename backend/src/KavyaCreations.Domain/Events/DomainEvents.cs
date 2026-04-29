using KavyaCreations.Domain.Common;

namespace KavyaCreations.Domain.Events;

public sealed record ProductCreatedEvent(Guid ProductId, string Name) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public sealed record OrderCreatedEvent(Guid OrderId, Guid UserId) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public sealed record OrderStatusChangedEvent(Guid OrderId, KavyaCreations.Domain.Enums.OrderStatus NewStatus) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
