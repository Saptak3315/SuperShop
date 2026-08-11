import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('barcode').notNullable()
      table.string('name').notNullable()
      table.string('category').nullable()
      table.string('unit').nullable()
      table.integer('min_stock_alert').defaultTo(10).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.unique(['user_id', 'barcode'])
      table.index(['barcode'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
