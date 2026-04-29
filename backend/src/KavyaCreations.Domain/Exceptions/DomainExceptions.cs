namespace KavyaCreations.Domain.Exceptions;

public sealed class NotFoundException(string name, object key)
    : Exception($"{name} with key '{key}' was not found.");

public sealed class DomainException(string message) : Exception(message);

public sealed class UnauthorizedException(string message = "Unauthorized access.")
    : Exception(message);

public sealed class ConflictException(string message) : Exception(message);

public sealed class ValidationException(string message) : Exception(message);
