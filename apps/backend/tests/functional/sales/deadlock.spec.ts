import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Product from '#models/product'
import Batch from '#models/batch'
import SalesService from '#features/sales/sales_service'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

test.group('SalesService | Stress: High-Concurrency Deadlock Immunity', (group) => {
  let user: User
  const p1Id = uuidv4()
  const p2Id = uuidv4()
  const b1Id = uuidv4()
  const b2Id = uuidv4()

  group.setup(async () => {
    user = await User.firstOrFail()

    await Product.create({
      id: p1Id,
      name: 'Stress Product A',
      userId: user.id,
      barcode: `STRESS-A-${Date.now()}`,
    })
    await Product.create({
      id: p2Id,
      name: 'Stress Product B',
      userId: user.id,
      barcode: `STRESS-B-${Date.now() + 1}`,
    })

    await Batch.create({
      id: b1Id,
      productId: p1Id,
      userId: user.id,
      batchNumber: 'STRESS-BA',
      quantity: 10000,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 1,
      sellingPrice: 2,
      status: 'ACTIVE',
    })
    await Batch.create({
      id: b2Id,
      productId: p2Id,
      userId: user.id,
      batchNumber: 'STRESS-BB',
      quantity: 10000,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 1,
      sellingPrice: 2,
      status: 'ACTIVE',
    })
  })

  group.teardown(async () => {
    await db.from('sale_items').whereIn('batch_id', [b1Id, b2Id]).delete()
    await db
      .from('sales')
      .whereIn('id', db.from('sale_items').select('sale_id').whereIn('batch_id', [b1Id, b2Id]))
      .delete()
    await Batch.query().whereIn('id', [b1Id, b2Id]).delete()
    await Product.query().whereIn('id', [p1Id, p2Id]).delete()
  })

  test('10 concurrent reverse-order checkouts complete without a single deadlock', async ({
    assert,
  }) => {
    const salesService = new SalesService()
    const CONCURRENCY = 10

    const requests = Array.from({ length: CONCURRENCY }, (_, i) =>
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items:
          i % 2 === 0
            ? [
                { productId: p1Id, quantity: 1 },
                { productId: p2Id, quantity: 1 },
              ]
            : [
                { productId: p2Id, quantity: 1 },
                { productId: p1Id, quantity: 1 },
              ],
      })
    )

    const results = await Promise.allSettled(requests)
    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const deadlocks = results.filter(
      (r) =>
        r.status === 'rejected' && (r as PromiseRejectedResult).reason?.message?.includes('40P01')
    )

    assert.equal(fulfilled.length, CONCURRENCY, 'All 10 concurrent requests must succeed')
    assert.equal(deadlocks.length, 0, 'Zero deadlock exceptions must be thrown')

    const b1 = await Batch.findOrFail(b1Id)
    const b2 = await Batch.findOrFail(b2Id)
    assert.equal(b1.quantity, 10000 - CONCURRENCY, 'Product A stock must reflect exact deductions')
    assert.equal(b2.quantity, 10000 - CONCURRENCY, 'Product B stock must reflect exact deductions')
  })
})
