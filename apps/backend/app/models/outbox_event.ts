import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * OutboxEvent represents a domain event record written atomically
 * inside the primary checkout ACID transaction.
 *
 * A background relay worker polls rows WHERE status = 'PENDING',
 * dispatches each event to its downstream target (Redis pub/sub,
 * WebSockets, Elasticsearch, etc.), then marks the row 'PROCESSED'.
 *
 * This decouples expensive I/O from the critical checkout path and
 * guarantees at-least-once delivery even if external systems are
 * temporarily unavailable.
 */
export default class OutboxEvent extends BaseModel {
  public static table = 'outbox_events'

  @column({ isPrimary: true })
  declare id: string

  /**
   * Semantic event discriminator used by the relay to decide which
   * downstream handler to invoke.
   * Examples: 'SALE_COMPLETED', 'STOCK_DEPLETED', 'BATCH_EXPIRED'
   */
  @column()
  declare eventType: string

  /**
   * Arbitrary JSON payload serialised at write time.
   * Stored as-is; the relay deserialises it before dispatching.
   */
  @column()
  declare payload: Record<string, unknown>

  /**
   * Processing state:
   *   PENDING   – written, awaiting relay pick-up
   *   PROCESSED – successfully dispatched
   *   FAILED    – dispatch exhausted retry budget
   */
  @column()
  declare status: 'PENDING' | 'PROCESSED' | 'FAILED'

  /** Number of dispatch attempts made so far (for retry budget). */
  @column()
  declare attempts: number

  /** Stores the last dispatch error for observability / alerting. */
  @column()
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /** Populated by the relay worker once dispatch succeeds. */
  @column.dateTime()
  declare processedAt: DateTime | null
}
