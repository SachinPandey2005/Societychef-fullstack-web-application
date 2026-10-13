type Listener = (...args: any[]) => void;

class PubSub {
  private events = new Map<string, Set<Listener>>();

  subscribe(event: string, listener: Listener): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return () => {
      this.events.get(event)?.delete(listener);
    };
  }

  publish(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach((listener) => {
      try {
        listener(...args);
      } catch (err) {
        console.error('Error in pubsub listener:', err);
      }
    });
  }
}

export const pubsub = new PubSub();
