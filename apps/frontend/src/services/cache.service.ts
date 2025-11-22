interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class CacheService {
    private cache = new Map<string, CacheItem<any>>();
    private maxSize = 100; // Maximum number of cache items

    set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
        // Clean expired items before adding new one
        this.cleanExpired();

        // Remove oldest if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) return null;

        // Check if item is expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanExpired(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

export const cacheService = new CacheService();
