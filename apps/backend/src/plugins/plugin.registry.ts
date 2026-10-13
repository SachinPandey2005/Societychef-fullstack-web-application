import { logger } from '../utils/logger';

type HookHandler = (payload: any) => Promise<any>;

export class PluginRegistry {
  private static hooks: Map<string, HookHandler[]> = new Map();

  /**
   * Stage 4: Extensibility - Register a plugin hook handler
   */
  static registerHook(hookName: string, handler: HookHandler, pluginId: string) {
    logger.info(`Plugin [${pluginId}] attached to hook: ${hookName}`);
    
    const handlers = this.hooks.get(hookName) || [];
    handlers.push(handler);
    this.hooks.set(hookName, handlers);
  }

  /**
   * Stage 4: Execute hooks synchronously. Placed within core business modules.
   */
  static async executeHooks(hookName: string, payload: any): Promise<any> {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) return payload;

    let modifiedPayload = { ...payload };
    
    for (const handler of handlers) {
      try {
        modifiedPayload = await handler(modifiedPayload);
      } catch (err) {
        logger.error(`Plugin execution failed on hook ${hookName}`, err);
        // Plugins should not crash core logic, swallow error and proceed with last known good payload
      }
    }

    return modifiedPayload;
  }
}
