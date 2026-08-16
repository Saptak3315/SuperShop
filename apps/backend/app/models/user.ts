import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Product from '#models/product'
import Batch from '#models/batch'
import Sale from '#models/sale'

const AuthFinder = withAuthFinder(BaseModel, {
  uids: ['email'],
  passwordColumn: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare storeName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'OWNER' | 'CASHIER'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  static async verifyCredentials(email: string, password: string) {
    const user = await this.findBy('email', email)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    return user
  }

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @hasMany(() => Batch)
  declare batches: HasMany<typeof Batch>

  @hasMany(() => Sale)
  declare sales: HasMany<typeof Sale>
}
