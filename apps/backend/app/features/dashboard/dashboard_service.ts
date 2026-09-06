import Product from '#models/product'
import Batch from '#models/batch'
import type User from '#models/user'
import { DateTime } from 'luxon'

export default class DashboardService {
  /**
   * Get dashboard summary counts scoped to store
   */
  public async getSummary(user: User) {
    // 1. Total Products
    const products = await Product.query()
      .where('user_id', user.id)
      .whereNull('deleted_at')
      .preload('batches', (query) => {
        query.where('status', 'ACTIVE').where('quantity', '>', 0)
      })

    const totalProducts = products.length

    // 2. Total active batches
    const totalBatches = await Batch.query()
      .where('user_id', user.id)
      .where('status', 'ACTIVE')
      .where('quantity', '>', 0)
      .count('* as total')
      .first()

    // 3. Low stock products (total stock < min_stock_alert)
    let lowStockWarnings = 0
    for (const product of products) {
      const totalStock = product.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      if (totalStock < product.minStockAlert) {
        lowStockWarnings++
      }
    }

    // 4. Critical expiring batches (<= 7 days)
    const threshold7Days = DateTime.now().plus({ days: 7 }).toISODate()
    const criticalExpiring = await Batch.query()
      .where('user_id', user.id)
      .where('status', 'ACTIVE')
      .where('quantity', '>', 0)
      .where('expiry_date', '<=', threshold7Days!)
      .count('* as total')
      .first()

    return {
      totalProducts,
      totalBatches: Number(totalBatches?.$extras.total || 0),
      lowStockWarnings,
      criticalExpiringBatches: Number(criticalExpiring?.$extras.total || 0),
    }
  }

  /**
   * Get timeline data of expiring batches for charts
   */
  public async getExpiringChart(user: User) {
    const start = DateTime.now().startOf('day')
    const end = DateTime.now().plus({ months: 6 }).endOf('day')

    const batches = await Batch.query()
      .where('user_id', user.id)
      .where('status', 'ACTIVE')
      .where('quantity', '>', 0)
      .where('expiry_date', '>=', start.toISODate()!)
      .where('expiry_date', '<=', end.toISODate()!)
      .orderBy('expiry_date', 'asc')

    const dailyData: Record<string, { date: string; quantity: number; count: number }> = {}

    for (const b of batches) {
      // Safely parse expiry_date
      let parsedDate: DateTime
      if (typeof b.expiryDate === 'string') {
        parsedDate = DateTime.fromISO(b.expiryDate)
      } else if (b.expiryDate instanceof DateTime) {
        parsedDate = b.expiryDate
      } else {
        parsedDate = DateTime.fromJSDate(new Date(b.expiryDate as any))
      }

      const key = parsedDate.toISODate()!
      if (!dailyData[key]) {
        dailyData[key] = { date: key, quantity: 0, count: 0 }
      }
      dailyData[key].quantity += b.quantity
      dailyData[key].count += 1
    }

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
  }
}
