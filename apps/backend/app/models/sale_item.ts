import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Sale from '#models/sale'
import Product from '#models/product'
import Batch from '#models/batch'

export default class SaleItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare saleId: string

  @column()
  declare productId: string

  @column()
  declare batchId: string

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @column()
  declare subtotal: number

  @belongsTo(() => Sale)
  declare sale: BelongsTo<typeof Sale>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Batch)
  declare batch: BelongsTo<typeof Batch>
}
