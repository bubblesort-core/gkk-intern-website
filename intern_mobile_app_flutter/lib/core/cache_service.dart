class CacheEntry {
  final dynamic data;
  final DateTime timestamp;

  CacheEntry({required this.data, required this.timestamp});

  bool isValid(Duration ttl) => DateTime.now().difference(timestamp) < ttl;
}

class CacheService {
  static final Map<String, CacheEntry> _cache = {};
  
  // Default TTL is 5 minutes
  static const Duration defaultTtl = Duration(minutes: 5);

  /// Get cached data if it exists and is still valid.
  static dynamic get(String key, {Duration? ttl}) {
    final entry = _cache[key];
    if (entry != null) {
      if (entry.isValid(ttl ?? defaultTtl)) {
        return entry.data;
      } else {
        _cache.remove(key); // Stale
      }
    }
    return null;
  }

  /// Store data in the cache.
  static void set(String key, dynamic data) {
    _cache[key] = CacheEntry(data: data, timestamp: DateTime.now());
  }
  
  /// Invalidate specific cache key
  static void invalidate(String key) {
    _cache.remove(key);
  }

  /// Clear all cache
  static void clear() {
    _cache.clear();
  }
}
