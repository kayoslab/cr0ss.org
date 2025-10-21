type CacheEntry = {
  timestamp: number;
  data: unknown;
};

export class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttl: number;

  constructor(ttlSeconds: number = 300) { // 5 minutes default
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }
} 