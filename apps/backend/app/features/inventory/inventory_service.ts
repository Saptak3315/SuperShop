import Product from '#models/product'
import Batch from '#models/batch'
import type User from '#models/user'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'

export default class InventoryService {
  /**
   * Create a new product
   */
  public async createProduct(user: User, data: any) {
    const product = await Product.create({
      id: uuidv4(),
      userId: user.id,
      barcode: data.barcode,
      name: data.name,
      category: data.category,
      unit: data.unit,
      minStockAlert: data.minStockAlert || 10,
    })
    return product
  }

  /**
   * Update an existing product
   */
  public async updateProduct(user: User, productId: string, data: any) {
    const product = await Product.query()
      .where('id', productId)
      .where('user_id', user.id)
      .whereNull('deleted_at')
      .firstOrFail()

    product.merge({
      barcode: data.barcode,
      name: data.name,
      category: data.category,
      unit: data.unit,
      minStockAlert: data.minStockAlert,
    })

    await product.save()
    return product
  }

  /**
   * Soft-delete a product
   */
  public async deleteProduct(user: User, productId: string) {
    const product = await Product.query()
      .where('id', productId)
      .where('user_id', user.id)
      .whereNull('deleted_at')
      .firstOrFail()

    product.deletedAt = DateTime.now()
    await product.save()
    return product
  }

  /**
   * List products for a user with total stock
   */
  public async listProducts(user: User) {
    const products = await Product.query()
      .where('user_id', user.id)
      .whereNull('deleted_at')
      .preload('batches', (query) => {
        query.where('status', 'ACTIVE').where('quantity', '>', 0)
      })

    return products.map((product) => {
      const totalStock = product.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      return {
        ...product.toJSON(),
        totalStock,
      }
    })
  }

  /**
   * Create a new batch for a product
   */
  public async createBatch(user: User, data: any) {
    const batch = await Batch.create({
      id: uuidv4(),
      userId: user.id,
      productId: data.productId,
      batchNumber: data.batchNumber,
      quantity: data.quantity,
      receivedDate: DateTime.fromISO(data.receivedDate),
      expiryDate: DateTime.fromISO(data.expiryDate),
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      status: 'ACTIVE',
    })
    return batch
  }

  /**
   * Create multiple batches in bulk
   */
  public async createBatchesBulk(user: User, data: { batches: any[] }) {
    const batches = []
    for (const batchData of data.batches) {
      const batch = await Batch.create({
        id: uuidv4(),
        userId: user.id,
        productId: batchData.productId,
        batchNumber: batchData.batchNumber,
        quantity: batchData.quantity,
        receivedDate: DateTime.fromISO(batchData.receivedDate),
        expiryDate: DateTime.fromISO(batchData.expiryDate),
        costPrice: batchData.costPrice,
        sellingPrice: batchData.sellingPrice,
        status: 'ACTIVE',
      })
      batches.push(batch)
    }
    return batches
  }

  /**
   * Get expiring batches
   */
  public async getExpiringBatches(user: User, days: number = 7) {
    const threshold = DateTime.now().plus({ days }).toISODate()
    const batches = await Batch.query()
      .where('user_id', user.id)
      .where('status', 'ACTIVE')
      .where('quantity', '>', 0)
      .where('expiry_date', '<=', threshold!)
      .preload('product')
      .orderBy('expiry_date', 'asc')

    return batches
  }
}
