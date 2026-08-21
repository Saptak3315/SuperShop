import db from '@adonisjs/lucid/services/db'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import Sale from '#models/sale'
import SaleItem from '#models/sale_item'
import Batch from '#models/batch'
import type User from '#models/user'
import { Exception } from '@adonisjs/core/exceptions'

export default class SalesService {
  /**
   * Process a checkout using transactional FEFO batch allocation
   */
  public async checkout(
    user: User,
    data: {
      paymentMethod: 'CASH' | 'CARD' | 'MFS'
      items: { productId: string; quantity: number }[]
    }
  ) {
    const trx = await db.transaction()

    try {
      const invoiceNo = `INV-${DateTime.now().toFormat('yyyyMMddHHmmss')}-${Math.floor(100 + Math.random() * 900)}`
      const saleId = uuidv4()
      let totalAmount = 0
      const saleItemsToInsert: any[] = []

      for (const item of data.items) {
        let neededQuantity = item.quantity

        // Enforce strict user_id scope, active stock, non-expired, and lock rows using forUpdate()
        const batches = await Batch.query({ client: trx })
          .where('user_id', user.id)
          .where('product_id', item.productId)
          .where('quantity', '>', 0)
          .where('status', 'ACTIVE')
          .where('expiry_date', '>=', DateTime.now().toISODate()!)
          .orderBy('expiry_date', 'asc')
          .orderBy('received_date', 'asc')
          .forUpdate()

        // Sum up total available stock in locked active batches
        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0)
        if (totalAvailable < neededQuantity) {
          throw new Exception(
            `Insufficient stock for product ${item.productId}. Required: ${neededQuantity}, Available: ${totalAvailable}`,
            { status: 400, code: 'INSUFFICIENT_STOCK' }
          )
        }

        // Sequential FEFO deduction
        for (const batch of batches) {
          if (neededQuantity <= 0) break

          const deductQuantity = Math.min(batch.quantity, neededQuantity)
          const subtotal = Number((deductQuantity * batch.sellingPrice).toFixed(2))
          totalAmount += subtotal

          // Deduct quantity from batch
          batch.quantity -= deductQuantity
          if (batch.quantity === 0) {
            batch.status = 'DEPLETED'
          }
          await batch.useTransaction(trx).save()

          // Add to sale item collection
          saleItemsToInsert.push({
            id: uuidv4(),
            saleId,
            productId: item.productId,
            batchId: batch.id,
            quantity: deductQuantity,
            unitPrice: batch.sellingPrice,
            subtotal,
          })

          neededQuantity -= deductQuantity
        }
      }

      // Save Sale
      const sale = await Sale.create(
        {
          id: saleId,
          userId: user.id,
          invoiceNo,
          totalAmount: Number(totalAmount.toFixed(2)),
          paymentMethod: data.paymentMethod,
        },
        { client: trx }
      )

      // Create SaleItems
      for (const itemData of saleItemsToInsert) {
        await SaleItem.create(itemData, { client: trx })
      }

      await trx.commit()

      // Reload the sale with items
      await sale.load('items')
      return sale
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
