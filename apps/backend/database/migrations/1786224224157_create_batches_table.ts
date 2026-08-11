import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'batches'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
      table
        .string('product_id')
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
        .notNullable()
      table.string('batch_number').notNullable()
      table.integer('quantity').unsigned().notNullable().defaultTo(0)
      table.date('received_date').notNullable()
      table.date('expiry_date').notNullable()
      table.decimal('cost_price', 10, 2).notNullable()
      table.decimal('selling_price', 10, 2).notNullable()
      table.enum('status', ['ACTIVE', 'EXPIRED', 'DEPLETED']).defaultTo('ACTIVE').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index(['expiry_date'])
      table.index(['received_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
