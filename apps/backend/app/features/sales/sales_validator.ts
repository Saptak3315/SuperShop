import vine from '@vinejs/vine'

/**
 * Validator for checkout request
 */
export const checkoutValidator = vine.compile(
  vine.object({
    paymentMethod: vine.enum(['CASH', 'CARD', 'MFS']),
    items: vine.array(
      vine.object({
        productId: vine.string().uuid(),
        quantity: vine.number().positive(),
      })
    ),
  })
)
