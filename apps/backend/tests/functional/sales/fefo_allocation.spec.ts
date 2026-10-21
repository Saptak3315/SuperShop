import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Product from '#models/product'
import Batch from '#models/batch'
import SalesService from '#features/sales/sales_service'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

test.group('SalesService | FEFO allocation validation', (group) => {
  let user: User
  let productId: string
  let batch1Id: string
  let batch2Id: string

  group.each.setup(async () => {
    user = await User.firstOrFail()

    productId = uuidv4()
    batch1Id = uuidv4()
    batch2Id = uuidv4()

    await Product.create({
      id: productId,
      name: 'Perishable Milk [FEFO Test]',
      userId: user.id,
      barcode: `MILK-${Date.now()}`,
    })

    await Batch.create({
      id: batch1Id,
      productId,
      userId: user.id,
      batchNumber: 'BATCH-LATER',
      quantity: 50,
      receivedDate: DateTime.now().minus({ days: 2 }).toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 2.0,
      sellingPrice: 3.5,
      status: 'ACTIVE',
    })

    await Batch.create({
      id: batch2Id,
      productId,
      userId: user.id,
      batchNumber: 'BATCH-SOONER',
      quantity: 10,
      receivedDate: DateTime.now().minus({ days: 5 }).toISODate()!,
      expiryDate: DateTime.now().plus({ days: 5 }).toISODate()!,
      costPrice: 2.0,
      sellingPrice: 3.5,
      status: 'ACTIVE',
    })
  })

  group.each.teardown(async () => {
    await db.from('sale_items').whereIn('batch_id', [batch1Id, batch2Id]).delete()
    await db
      .from('sales')
      .whereIn(
        'id',
        db.from('sale_items').select('sale_id').whereIn('batch_id', [batch1Id, batch2Id])
      )
      .delete()
    await Batch.query().whereIn('id', [batch1Id, batch2Id]).delete()
    await Product.query().where('id', productId).delete()
  })

  test('stock is deducted strictly from the batch with the earliest expiry date', async ({
    assert,
  }) => {
    const salesService = new SalesService()

    const sale = await salesService.checkout(user, {
      paymentMethod: 'CASH',
      items: [{ productId, quantity: 10 }],
    })

    assert.isNotNull(sale)
    assert.equal(sale.items.length, 1, 'Exactly one sale item should be created')
    assert.equal(sale.items[0].batchId, batch2Id, 'Deduction must come from earliest-expiry batch')
    assert.equal(sale.items[0].quantity, 10)

    const batch1 = await Batch.findOrFail(batch1Id)
    const batch2 = await Batch.findOrFail(batch2Id)

    assert.equal(batch1.quantity, 50, 'Batch 1 (later expiry) must remain untouched')
    assert.equal(batch1.status, 'ACTIVE', 'Batch 1 status must stay ACTIVE')
    assert.equal(batch2.quantity, 0, 'Batch 2 (earlier expiry) must be fully depleted')
    assert.equal(batch2.status, 'DEPLETED', 'Batch 2 status must transition to DEPLETED')
  })
})
