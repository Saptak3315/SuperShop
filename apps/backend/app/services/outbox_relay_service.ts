import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import OutboxEvent from '#models/outbox_event'

const MAX_ATTEMPTS = 5
const POLL_INTERVAL_MS = 2_000
const BATCH_SIZE = 50

type EventHandler = (payload: Record<string, unknown>) => Promise<void>

const handlers: Record<string, EventHandler> = {
  SALE_COMPLETED: async (payload) => {
    console.log('[OutboxRelay] Dispatching SALE_COMPLETED event:', JSON.stringify(payload))
  },

  STOCK_DEPLETED: async (payload) => {
    console.log('[OutboxRelay] Dispatching STOCK_DEPLETED event:', JSON.stringify(payload))
  },
}

export default class OutboxRelayService {
  private running = false

  public start(): void {
    if (this.running) return
    this.running = true
    console.log('[OutboxRelay] Worker started')
    void this.#loop()
  }

  public stop(): void {
    this.running = false
    console.log('[OutboxRelay] Worker stopped')
  }

  async #loop(): Promise<void> {
    while (this.running) {
      await this.#processBatch()
      await this.#sleep(POLL_INTERVAL_MS)
    }
  }

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

  async #dispatch(event: OutboxEvent): Promise<void> {
    const trx = await db.transaction()

    try {
      const locked = await OutboxEvent.query({ client: trx })
        .where('id', event.id)
        .where('status', 'PENDING')
        .forUpdate()
        .first()

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

      await handler(locked.payload)

      locked.status = 'PROCESSED'
      locked.processedAt = DateTime.now()
      locked.attempts += 1
      await locked.useTransaction(trx).save()
      await trx.commit()
    } catch (error) {
      await trx.rollback()

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

  #sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
