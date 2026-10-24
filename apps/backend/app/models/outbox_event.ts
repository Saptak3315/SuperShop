import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class OutboxEvent extends BaseModel {
  public static table = 'outbox_events'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare eventType: string

  @column()
  declare payload: Record<string, unknown>

  @column()
  declare status: 'PENDING' | 'PROCESSED' | 'FAILED'

  @column()
  declare attempts: number

  @column()
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare processedAt: DateTime | null
}
