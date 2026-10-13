import { internalEventBus, EVENTS } from '../events/eventEmitter';
import { logger } from '../utils/logger';

/**
 * CacheService Abstraction Layer
 * Currently uses an in-memory Map for deployment portability.
 * Swap the Map with a Redis client (e.g. `ioredis`) for real deployments.
 */
class InMemoryCache {
  private store = new Map<string, { value: any, expiresAt: number }>();

  async set(key: string, value: any, ttlSeconds: number = 60) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  async clear() {
    this.store.clear();
  }
}

export const CacheService = new InMemoryCache();

// Example invalidation wiring
internalEventBus.on(EVENTS.MENU_UPDATED, async (data) => {
  logger.info(`Invalidating menu cache for kitchen ${data?.kitchen_id}`);
  await CacheService.delete(`menu:${data?.kitchen_id}`);
  internalEventBus.emit(EVENTS.CACHE_INVALIDATED, { key: `menu:${data?.kitchen_id}` });
});
