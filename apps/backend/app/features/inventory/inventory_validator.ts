import vine from '@vinejs/vine'

/**
 * Validator for creating a new product
 */
export const createProductValidator = vine.compile(
  vine.object({
    barcode: vine.string().trim().maxLength(100),
    name: vine.string().trim().maxLength(255),
    category: vine.string().trim().maxLength(100).optional(),
    unit: vine.string().trim().maxLength(50).optional(),
    minStockAlert: vine.number().positive().optional(),
  })
)

/**
 * Validator for updating a product
 */
export const updateProductValidator = vine.compile(
  vine.object({
    barcode: vine.string().trim().maxLength(100),
    name: vine.string().trim().maxLength(255),
    category: vine.string().trim().maxLength(100).nullable().optional(),
    unit: vine.string().trim().maxLength(50).nullable().optional(),
    minStockAlert: vine.number().positive().optional(),
  })
)

/**
 * Validator for creating a new batch
 */
export const createBatchValidator = vine.compile(
  vine.object({
    productId: vine.string().uuid(),
    batchNumber: vine.string().trim().maxLength(100),
    quantity: vine.number().positive(),
    receivedDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expiryDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    costPrice: vine.number().positive(),
    sellingPrice: vine.number().positive(),
  })
)

/**
 * Validator for bulk batch creation
 */
export const createBulkBatchesValidator = vine.compile(
  vine.object({
    batches: vine.array(
      vine.object({
        productId: vine.string().uuid(),
        batchNumber: vine.string().trim().maxLength(100),
        quantity: vine.number().positive(),
        receivedDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        expiryDate: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        costPrice: vine.number().positive(),
        sellingPrice: vine.number().positive(),
      })
    ),
  })
)
