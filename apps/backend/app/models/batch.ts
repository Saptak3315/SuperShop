import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Product from '#models/product'

export default class Batch extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare productId: string

  @column()
  declare batchNumber: string

  @column()
  declare quantity: number

  @column.date()
  declare receivedDate: DateTime

  @column.date()
  declare expiryDate: DateTime

  @column()
  declare costPrice: number

  @column()
  declare sellingPrice: number

  @column()
  declare status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
