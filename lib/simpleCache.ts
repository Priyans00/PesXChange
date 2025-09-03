/**
 * Simple memory cache for API responses
 * Used for fast API response caching with TTL
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  
  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const apiCache = new SimpleCache();

// Helper function for cached API calls
export async function withCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 2 * 60 * 1000
): Promise<T> {
  // Try cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Execute query
  const result = await queryFn();
  
  // Store in cache
  apiCache.set(cacheKey, result, ttlMs);
  
  return result;
}
