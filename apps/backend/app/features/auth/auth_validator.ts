import vine from '@vinejs/vine'

/**
 * Validator for user registration
 */
export const registerValidator = vine.compile(
  vine.object({
    storeName: vine.string().trim().minLength(3).maxLength(255),
    email: vine
      .string()
      .trim()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8).maxLength(32),
  })
)

/**
 * Validator for user login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string(),
  })
)
