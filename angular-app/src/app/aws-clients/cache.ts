interface CacheEntry {
    data: Uint8Array;
    timestamp: number;
    expiresAt: number;
    lastAccessed: number;
    size: number;
}

export class Cache {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    private readonly MAX_SIZE_BYTES = 100 * 1024 * 1024; // 150 MB in bytes
    private currentSize: number = 0;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start automatic cleanup every hour
        this.startCleanupInterval();
    }

    /**
     * Store data in cache with 24-hour expiration and size management
     * @param key - The cache key
     * @param data - The Uint8Array data to store
     */
    set(key: string, data: Uint8Array): void {
        const now = Date.now();
        const dataSize = data.byteLength;
        
        // Check if adding this entry would exceed size limit
        if (dataSize > this.MAX_SIZE_BYTES) {
            console.log(`Cache: Entry "${key}" (${this.formatBytes(dataSize)}) exceeds maximum cache size, not caching`);
            return;
        }

        // Remove existing entry if it exists to get accurate size calculation
        if (this.cache.has(key)) {
            const existingEntry = this.cache.get(key)!;
            this.currentSize -= existingEntry.size;
            this.cache.delete(key);
        }

        // Evict oldest entries until we have enough space
        while (this.currentSize + dataSize > this.MAX_SIZE_BYTES && this.cache.size > 0) {
            this.evictOldestEntry();
        }

        const entry: CacheEntry = {
            data: data,
            timestamp: now,
            expiresAt: now + this.TTL_MS,
            lastAccessed: now,
            size: dataSize
        };
        
        this.cache.set(key, entry);
        this.currentSize += dataSize;
        
        console.log(`Cache: Stored entry for key "${key}" (${this.formatBytes(dataSize)}), total cache size: ${this.formatBytes(this.currentSize)}, expires at ${new Date(entry.expiresAt).toISOString()}`);
    }

    /**
     * Retrieve data from cache if not expired
     * @param key - The cache key
     * @returns The cached Uint8Array or undefined if not found/expired
     */
    get(key: string): Uint8Array | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            console.log(`Cache: Key "${key}" not found`);
            return undefined;
        }

        const now = Date.now();
        if (now > entry.expiresAt) {
            console.log(`Cache: Key "${key}" expired, removing from cache`);
            this.removeEntry(key);
            return undefined;
        }

        // Update last accessed time for LRU tracking
        entry.lastAccessed = now;
        console.log(`Cache: Retrieved entry for key "${key}" (${this.formatBytes(entry.size)})`);
        return entry.data;
    }

    /**
     * Check if a key exists and is not expired
     * @param key - The cache key
     * @returns true if key exists and is valid
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }

        const now = Date.now();
        if (now > entry.expiresAt) {
            this.removeEntry(key);
            return false;
        }

        return true;
    }

    /**
     * Remove a specific key from cache
     * @param key - The cache key to remove
     * @returns true if key was removed, false if not found
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry) {
            this.removeEntry(key);
            console.log(`Cache: Manually deleted key "${key}" (${this.formatBytes(entry.size)})`);
            return true;
        }
        return false;
    }

    /**
     * Clear all entries from cache
     */
    clear(): void {
        const size = this.cache.size;
        const totalSize = this.currentSize;
        this.cache.clear();
        this.currentSize = 0;
        console.log(`Cache: Cleared all ${size} entries (${this.formatBytes(totalSize)})`);
    }

    /**
     * Get cache statistics
     * @returns Object with cache stats
     */
    getStats(): { 
        size: number; 
        keys: string[]; 
        currentSizeBytes: number;
        currentSizeMB: number;
        maxSizeBytes: number;
        maxSizeMB: number;
        utilizationPercent: number;
        oldestEntry?: Date; 
        newestEntry?: Date;
        leastRecentlyUsed?: { key: string; lastAccessed: Date };
        mostRecentlyUsed?: { key: string; lastAccessed: Date };
    } {
        const keys = Array.from(this.cache.keys());
        const entries = Array.from(this.cache.entries());
        
        let oldestTimestamp = Number.MAX_SAFE_INTEGER;
        let newestTimestamp = 0;
        let lruTimestamp = Number.MAX_SAFE_INTEGER;
        let mruTimestamp = 0;
        let lruKey = '';
        let mruKey = '';

        entries.forEach(([key, entry]) => {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
            }
            if (entry.timestamp > newestTimestamp) {
                newestTimestamp = entry.timestamp;
            }
            if (entry.lastAccessed < lruTimestamp) {
                lruTimestamp = entry.lastAccessed;
                lruKey = key;
            }
            if (entry.lastAccessed > mruTimestamp) {
                mruTimestamp = entry.lastAccessed;
                mruKey = key;
            }
        });

        return {
            size: this.cache.size,
            keys: keys,
            currentSizeBytes: this.currentSize,
            currentSizeMB: Math.round((this.currentSize / (1024 * 1024)) * 100) / 100,
            maxSizeBytes: this.MAX_SIZE_BYTES,
            maxSizeMB: 150,
            utilizationPercent: Math.round((this.currentSize / this.MAX_SIZE_BYTES) * 10000) / 100,
            oldestEntry: entries.length > 0 ? new Date(oldestTimestamp) : undefined,
            newestEntry: entries.length > 0 ? new Date(newestTimestamp) : undefined,
            leastRecentlyUsed: lruKey ? { key: lruKey, lastAccessed: new Date(lruTimestamp) } : undefined,
            mostRecentlyUsed: mruKey ? { key: mruKey, lastAccessed: new Date(mruTimestamp) } : undefined
        };
    }

    /**
     * Remove all expired entries
     * @returns Number of entries removed
     */
    cleanup(): number {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.removeEntry(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`Cache: Cleanup removed ${removedCount} expired entries`);
        }

        return removedCount;
    }

    /**
     * Evict the oldest entry (LRU - Least Recently Used)
     * @returns true if an entry was evicted
     */
    private evictOldestEntry(): boolean {
        if (this.cache.size === 0) {
            return false;
        }

        let oldestKey = '';
        let oldestTime = Number.MAX_SAFE_INTEGER;

        // Find the least recently used entry
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const entry = this.cache.get(oldestKey)!;
            this.removeEntry(oldestKey);
            console.log(`Cache: Evicted LRU entry "${oldestKey}" (${this.formatBytes(entry.size)}) to make space`);
            return true;
        }

        return false;
    }

    /**
     * Remove an entry and update size tracking
     * @param key - The key to remove
     */
    private removeEntry(key: string): void {
        const entry = this.cache.get(key);
        if (entry) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
        }
    }

    /**
     * Format bytes to human readable string
     * @param bytes - Number of bytes
     * @returns Formatted string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Start automatic cleanup interval (runs every hour)
     */
    private startCleanupInterval(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000); // 1 hour

        console.log('Cache: Started automatic cleanup interval (every hour)');
    }

    /**
     * Stop automatic cleanup interval
     */
    stopCleanupInterval(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('Cache: Stopped automatic cleanup interval');
        }
    }

    /**
     * Get time remaining until expiration for a key
     * @param key - The cache key
     * @returns Milliseconds until expiration, or -1 if key doesn't exist
     */
    getTimeToExpiration(key: string): number {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return -1;
        }

        const now = Date.now();
        return Math.max(0, entry.expiresAt - now);
    }

    /**
     * Get current cache size in bytes
     * @returns Current cache size in bytes
     */
    getCurrentSize(): number {
        return this.currentSize;
    }

    /**
     * Get maximum cache size in bytes
     * @returns Maximum cache size in bytes
     */
    getMaxSize(): number {
        return this.MAX_SIZE_BYTES;
    }

    /**
     * Get cache utilization percentage
     * @returns Percentage of cache space used (0-100)
     */
    getUtilization(): number {
        return (this.currentSize / this.MAX_SIZE_BYTES) * 100;
    }

    /**
     * Cleanup resources when cache is no longer needed
     */
    destroy(): void {
        this.stopCleanupInterval();
        this.clear();
        console.log('Cache: Destroyed cache instance');
    }
}

// Export a singleton instance for convenience
export const globalCache = new Cache();
