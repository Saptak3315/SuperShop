import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'outbox_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('event_type').notNullable()
      table.json('payload').notNullable()
      table.enum('status', ['PENDING', 'PROCESSED', 'FAILED']).defaultTo('PENDING').notNullable()
      table.integer('attempts').unsigned().defaultTo(0).notNullable()
      table.text('error_message').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('processed_at').nullable()
      table.index(['status', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
