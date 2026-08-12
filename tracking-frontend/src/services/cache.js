/**
 * Simple request cache with TTL (Time-To-Live) support
 * Prevents duplicate API calls for the same resource within a time window
 */

const cache = new Map();

/**
 * Create a cache key from path and options
 */
function getCacheKey(path, options = {}) {
  const optionsStr = JSON.stringify(options);
  return `${path}:${optionsStr}`;
}

/**
 * Get cached value if still valid
 */
export function getCached(path, options = {}) {
  const key = getCacheKey(path, options);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return cached.value;
}

/**
 * Set cache value with TTL (default 5 minutes)
 */
export function setCached(path, value, options = {}, ttl = 5 * 60 * 1000) {
  const key = getCacheKey(path, options);
  cache.set(key, {
    value,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * Clear all cache or specific key
 */
export function clearCache(path = null, options = {}) {
  if (!path) {
    cache.clear();
    return;
  }
  const key = getCacheKey(path, options);
  cache.delete(key);
}

/**
 * Wrap an async function with automatic caching
 */
export function withCache(fn, ttl = 5 * 60 * 1000) {
  return async (path, options = {}) => {
    const cached = getCached(path, options);
    if (cached) return cached;
    
    const value = await fn(path, options);
    setCached(path, value, options, ttl);
    return value;
  };
}
