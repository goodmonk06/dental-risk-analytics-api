/**
 * Event Bus for Domain Events
 *
 * Provides pub/sub mechanism for domain events.
 * Handlers can subscribe to specific event types and react asynchronously.
 */

import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';
import { DomainEvent, EventType } from './types';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

class EventBus {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private wildcardHandlers: Set<EventHandler> = new Set();

  /**
   * Subscribe to a specific event type
   */
  on<T extends DomainEvent>(eventType: EventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    this.wildcardHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  /**
   * Emit an event to all subscribed handlers
   */
  async emit<T extends DomainEvent>(eventType: EventType, data: Omit<T['data'], never>, metadata?: T['metadata']): Promise<void> {
    const event: DomainEvent = {
      id: randomUUID(),
      type: eventType,
      timestamp: new Date(),
      data: data as any,
      metadata,
    } as DomainEvent;

    logger.debug(`Event emitted: ${eventType}`, { eventId: event.id, data });
    metrics.incrementCounter('events_emitted', { type: eventType });

    // Get handlers for this specific event type
    const typeHandlers = this.handlers.get(eventType) || new Set();
    const allHandlers = [...Array.from(typeHandlers), ...Array.from(this.wildcardHandlers)];

    if (allHandlers.length === 0) {
      logger.debug(`No handlers registered for event: ${eventType}`);
      return;
    }

    // Execute all handlers (async, non-blocking)
    const results = await Promise.allSettled(
      allHandlers.map(async (handler) => {
        try {
          await handler(event);
          metrics.incrementCounter('event_handlers_success', { type: eventType });
        } catch (error) {
          logger.error(`Error in event handler for ${eventType}`, { error, eventId: event.id });
          metrics.incrementCounter('event_handlers_failed', { type: eventType });
          throw error;
        }
      })
    );

    // Log any failures
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`${failures.length}/${allHandlers.length} handlers failed for event ${eventType}`, {
        eventId: event.id,
      });
    }
  }

  /**
   * Remove all handlers for a specific event type
   */
  removeAllListeners(eventType?: EventType): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
      this.wildcardHandlers.clear();
    }
  }

  /**
   * Get count of handlers for an event type
   */
  listenerCount(eventType: EventType): number {
    return (this.handlers.get(eventType)?.size || 0) + this.wildcardHandlers.size;
  }
}

// Export singleton instance
export const eventBus = new EventBus();
