import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import OutboxEvent from '#models/outbox_event'

/**
 * Maximum number of dispatch attempts before an event is marked FAILED
 * and removed from the retry pool.
 */
const MAX_ATTEMPTS = 5

/**
 * How long (ms) the relay sleeps between polling cycles when the
 * outbox is empty.
 */
const POLL_INTERVAL_MS = 2_000

/**
 * How many PENDING events are fetched per polling cycle.
 * Keeps each cycle bounded and avoids unbounded memory usage.
 */
const BATCH_SIZE = 50

// ─────────────────────────────────────────────────────────────────────────────
// Handler registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type signature for all event handler functions.
 * Each handler receives the raw payload and must return a Promise.
 * Throwing an error signals a failed dispatch attempt.
 */
type EventHandler = (payload: Record<string, unknown>) => Promise<void>

/**
 * Registry of concrete handlers keyed by event_type string.
 *
 * To add a new downstream integration:
 *   1. Write a handler function below (or import from a dedicated file).
 *   2. Register it here.
 *
 * The relay worker will automatically pick it up on the next poll cycle.
 */
const handlers: Record<string, EventHandler> = {
  /**
   * SALE_COMPLETED
   * Triggered when a checkout transaction completes successfully.
   *
   * Extend this handler to:
   *   - Push a WebSocket notification to the connected cashier session.
   *   - Index the sale document in Elasticsearch for fast search.
   *   - Publish a message to Redis pub/sub for downstream microservices.
   */
  SALE_COMPLETED: async (payload) => {
    // TODO: integrate with your real-time / search / pub-sub layer.
    // Example placeholder implementation logs the event:
    console.log('[OutboxRelay] Dispatching SALE_COMPLETED event:', JSON.stringify(payload))
  },

  /**
   * STOCK_DEPLETED
   * Triggered when a batch quantity reaches zero (status → DEPLETED).
   *
   * Extend this handler to:
   *   - Send a low-stock alert to the inventory management dashboard.
   *   - Trigger an automated re-order workflow.
   */
  STOCK_DEPLETED: async (payload) => {
    console.log('[OutboxRelay] Dispatching STOCK_DEPLETED event:', JSON.stringify(payload))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Relay worker
// ─────────────────────────────────────────────────────────────────────────────

export default class OutboxRelayService {
  private running = false

  /**
   * Start the relay worker loop.
   * Call this once during application boot (e.g. from a custom provider or
   * a long-running ace command).  The loop runs until `stop()` is called.
   */
  public start(): void {
    if (this.running) return
    this.running = true
    console.log('[OutboxRelay] Worker started')
    void this.#loop()
  }

  /** Gracefully stop the worker after the current cycle finishes. */
  public stop(): void {
    this.running = false
    console.log('[OutboxRelay] Worker stopped')
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────────────

  /** Main polling loop – runs forever until `this.running = false`. */
  async #loop(): Promise<void> {
    while (this.running) {
      await this.#processBatch()
      await this.#sleep(POLL_INTERVAL_MS)
    }
  }

  /**
   * Fetch up to BATCH_SIZE PENDING events (ordered oldest-first) and
   * dispatch each one.  Each event is processed in its own transaction
   * so a single bad event never blocks the rest of the batch.
   */
  async #processBatch(): Promise<void> {
    const events = await OutboxEvent.query()
      .where('status', 'PENDING')
      .where('attempts', '<', MAX_ATTEMPTS)
      .orderBy('created_at', 'asc')
      .limit(BATCH_SIZE)

    for (const event of events) {
      await this.#dispatch(event)
    }
  }

  /**
   * Attempt to dispatch a single outbox event.
   *
   * On success  → marks the row PROCESSED and stamps processed_at.
   * On failure  → increments attempts; marks FAILED if budget exhausted.
   *
   * Uses a row-level update inside a transaction to prevent concurrent
   * relay instances from double-processing the same event.
   */
  async #dispatch(event: OutboxEvent): Promise<void> {
    const trx = await db.transaction()

    try {
      // Re-fetch with a FOR UPDATE lock so multiple relay instances
      // cannot concurrently process the same row.
      const locked = await OutboxEvent.query({ client: trx })
        .where('id', event.id)
        .where('status', 'PENDING')
        .forUpdate()
        .first()

      // Another relay instance already claimed this event; skip.
      if (!locked) {
        await trx.rollback()
        return
      }

      const handler = handlers[locked.eventType]
      if (!handler) {
        console.warn(`[OutboxRelay] No handler registered for event type: ${locked.eventType}`)
        locked.status = 'FAILED'
        locked.errorMessage = `No handler registered for event type: ${locked.eventType}`
        locked.attempts += 1
        await locked.useTransaction(trx).save()
        await trx.commit()
        return
      }

      // Invoke the downstream handler
      await handler(locked.payload)

      locked.status = 'PROCESSED'
      locked.processedAt = DateTime.now()
      locked.attempts += 1
      await locked.useTransaction(trx).save()
      await trx.commit()
    } catch (error) {
      await trx.rollback()

      // Update attempts / status outside the failed transaction
      try {
        event.attempts += 1
        event.errorMessage = error instanceof Error ? error.message : String(error)
        if (event.attempts >= MAX_ATTEMPTS) {
          event.status = 'FAILED'
          console.error(
            `[OutboxRelay] Event ${event.id} (${event.eventType}) permanently FAILED after ${event.attempts} attempts:`,
            event.errorMessage
          )
        }
        await event.save()
      } catch (saveErr) {
        console.error('[OutboxRelay] Failed to persist error state:', saveErr)
      }
    }
  }

  /** Simple Promise-based sleep utility. */
  #sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
