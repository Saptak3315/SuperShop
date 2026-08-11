import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('invoice_no').notNullable()
      table.decimal('total_amount', 10, 2).notNullable()
      table.enum('payment_method', ['CASH', 'CARD', 'MFS']).notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
