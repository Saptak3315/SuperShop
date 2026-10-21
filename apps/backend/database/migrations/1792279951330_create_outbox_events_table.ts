import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'outbox_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()

      // Discriminator – what kind of domain event this is
      // e.g. 'SALE_COMPLETED', 'STOCK_DEPLETED'
      table.string('event_type').notNullable()

      // Full JSON payload for the downstream consumers
      table.json('payload').notNullable()

      // Processing state machine: PENDING → PROCESSED | FAILED
      table.enum('status', ['PENDING', 'PROCESSED', 'FAILED']).defaultTo('PENDING').notNullable()

      // How many dispatch attempts have been made (for retry capping)
      table.integer('attempts').unsigned().defaultTo(0).notNullable()

      // Last error message, helpful for debugging failed events
      table.text('error_message').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('processed_at').nullable()

      // Index to let the relay worker efficiently poll PENDING events
      table.index(['status', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
