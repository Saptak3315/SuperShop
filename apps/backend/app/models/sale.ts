import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import SaleItem from '#models/sale_item'

export default class Sale extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare invoiceNo: string

  @column()
  declare totalAmount: number

  @column()
  declare paymentMethod: 'CASH' | 'CARD' | 'MFS'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => SaleItem)
  declare items: HasMany<typeof SaleItem>
}
