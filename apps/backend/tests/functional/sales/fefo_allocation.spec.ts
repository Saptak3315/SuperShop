import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'
import Batch from '#models/batch'
import SalesService from '#features/sales/sales_service'
import { DateTime } from 'luxon'

test.group('SalesService Strict FEFO Allocation & Concurrency Suite', (group) => {
  let user: User

  group.each.setup(async () => {
    user = await User.first()!
    if (!user) {
      user = await User.create({
        fullName: 'Test Cashier',
        email: `cashier_${Date.now()}@aetherflow.test`,
        password: 'Password123!',
      })
    }
  })

  test('Test 1: FEFO Ordering Validation - stock deducted strictly from earliest expiry date', async ({
    assert,
  }) => {
    const productId = 'prod-' + Math.random()
    const product = await Product.create({
      id: productId,
      name: 'Perishable Milk',
      userId: user.id,
      barcode: 'MILK-' + Math.random(),
    })

    const batch1Id = 'b-later-' + Math.random()
    const batch1 = await Batch.create({
      id: batch1Id,
      productId: product.id,
      userId: user.id,
      batchNumber: 'BATCH-LATER',
      quantity: 50,
      receivedDate: DateTime.now().minus({ days: 2 }).toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 2.0,
      sellingPrice: 3.5,
      status: 'ACTIVE',
    })

    const batch2Id = 'b-sooner-' + Math.random()
    const batch2 = await Batch.create({
      id: batch2Id,
      productId: product.id,
      userId: user.id,
      batchNumber: 'BATCH-SOONER',
      quantity: 10,
      receivedDate: DateTime.now().minus({ days: 5 }).toISODate()!,
      expiryDate: DateTime.now().plus({ days: 5 }).toISODate()!,
      costPrice: 2.0,
      sellingPrice: 3.5,
      status: 'ACTIVE',
    })

    const salesService = new SalesService()

    const sale = await salesService.checkout(user, {
      paymentMethod: 'CASH',
      items: [{ productId: product.id, quantity: 10 }],
    })

    assert.isNotNull(sale)
    assert.equal(sale.items.length, 1)
    assert.equal(sale.items[0].batchId, batch2.id)
    assert.equal(sale.items[0].quantity, 10)

    await batch1.refresh()
    await batch2.refresh()

    assert.equal(batch1.quantity, 50, 'Batch 1 (later expiry) should remain untouched')
    assert.equal(batch1.status, 'ACTIVE')
    assert.equal(batch2.quantity, 0, 'Batch 2 (earlier expiry) should be fully depleted')
    assert.equal(batch2.status, 'DEPLETED', 'Batch 2 status must transition to DEPLETED')
  })

  test('Test 2: Double Allocation & Stock Exhaustion - parallel requests over single batch with atomic rejection', async ({
    assert,
  }) => {
    const productId = 'prod-ex-' + Math.random()
    const product = await Product.create({
      id: productId,
      name: 'Flash Sale Item',
      userId: user.id,
      barcode: 'FLASH-' + Math.random(),
    })

    const batch = await Batch.create({
      id: 'b-ex-' + Math.random(),
      productId: product.id,
      userId: user.id,
      batchNumber: 'BATCH-FLASH',
      quantity: 30,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 60 }).toISODate()!,
      costPrice: 10,
      sellingPrice: 15,
      status: 'ACTIVE',
    })

    const salesService = new SalesService()

    const results = await Promise.allSettled([
      salesService.checkout(user, {
        paymentMethod: 'CARD',
        items: [{ productId: product.id, quantity: 15 }],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CARD',
        items: [{ productId: product.id, quantity: 15 }],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CARD',
        items: [{ productId: product.id, quantity: 15 }],
      }),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    assert.equal(fulfilled.length, 2)
    assert.equal(rejected.length, 1)

    await batch.refresh()
    assert.equal(batch.quantity, 0)
    assert.equal(batch.status, 'DEPLETED')
  })

  test('Test 3: Deadlock Immunity - concurrent reverse-order multi-item checkouts', async ({
    assert,
  }) => {
    const p1 = await Product.create({
      id: 'p1-' + Math.random(),
      name: 'Item A',
      userId: user.id,
      barcode: 'A-' + Math.random(),
    })
    const p2 = await Product.create({
      id: 'p2-' + Math.random(),
      name: 'Item B',
      userId: user.id,
      barcode: 'B-' + Math.random(),
    })

    await Batch.create({
      id: 'ba-' + Math.random(),
      productId: p1.id,
      userId: user.id,
      batchNumber: 'BA',
      quantity: 100,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 5,
      sellingPrice: 10,
      status: 'ACTIVE',
    })

    await Batch.create({
      id: 'bb-' + Math.random(),
      productId: p2.id,
      userId: user.id,
      batchNumber: 'BB',
      quantity: 100,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 5,
      sellingPrice: 10,
      status: 'ACTIVE',
    })

    const salesService = new SalesService()

    const results = await Promise.all([
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items: [
          { productId: p1.id, quantity: 2 },
          { productId: p2.id, quantity: 2 },
        ],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items: [
          { productId: p2.id, quantity: 3 },
          { productId: p1.id, quantity: 3 },
        ],
      }),
    ])

    assert.equal(results.length, 2)
    assert.isNotNull(results[0].invoiceNo)
    assert.isNotNull(results[1].invoiceNo)
  })
})
