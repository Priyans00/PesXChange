// Centralized Rate Limiter Utility
interface RateLimitConfig {
  limit: number;
  window: number;
}

interface RateLimitEntry {
  count: number;
  reset: number;
}

class RateLimiter {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  // Lazy cleanup during rate limit checks to avoid setInterval memory leaks
  private cleanupStaleEntries(): void {
    const now = Date.now();
    for (const [ip, data] of this.rateLimitMap.entries()) {
      if (now > data.reset) {
        this.rateLimitMap.delete(ip);
      }
    }
  }

  checkRateLimit(clientIP: string): boolean {
    // Clean up stale entries first
    this.cleanupStaleEntries();
    
    const now = Date.now();
    const clientData = this.rateLimitMap.get(clientIP);

    if (!clientData || now > clientData.reset) {
      this.rateLimitMap.set(clientIP, { 
        count: 1, 
        reset: now + this.config.window 
      });
      return true;
    }

    if (clientData.count >= this.config.limit) {
      return false;
    }

    clientData.count++;
    return true;
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = new RateLimiter({
  limit: 100,
  window: 60 * 1000, // 1 minute
});

export const profileUpdateRateLimiter = new RateLimiter({
  limit: 10,
  window: 60 * 1000, // 1 minute
});

export const profileStatsRateLimiter = new RateLimiter({
  limit: 30,
  window: 2 * 60 * 1000, // 2 minutes
});

// Generic function for custom rate limiters
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
