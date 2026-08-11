import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sale_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('sale_id').references('id').inTable('sales').onDelete('CASCADE').notNullable()
      table.string('product_id').references('id').inTable('products').notNullable()
      table.string('batch_id').references('id').inTable('batches').notNullable()
      table.integer('quantity').notNullable()
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('subtotal', 10, 2).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
