using KavyaCreations.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace KavyaCreations.Infrastructure.Services;

public sealed class MemoryCacheService(IMemoryCache cache) : ICacheService
{
    private readonly HashSet<string> _keys = [];
    private readonly Lock _lock = new();

    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? TimeSpan.FromMinutes(10)
        };
        lock (_lock) _keys.Add(key);
        cache.Set(key, value, options);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken ct = default)
    {
        lock (_lock) _keys.Remove(key);
        cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        List<string> toRemove;
        lock (_lock) toRemove = _keys.Where(k => k.StartsWith(prefix)).ToList();
        foreach (var key in toRemove)
        {
            cache.Remove(key);
            lock (_lock) _keys.Remove(key);
        }
        return Task.CompletedTask;
    }
}
