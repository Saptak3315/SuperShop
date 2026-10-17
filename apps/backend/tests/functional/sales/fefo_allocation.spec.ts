import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Product from '#models/product'
import Batch from '#models/batch'
import SalesService from '#features/sales/sales_service'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

// ---------------------------------------------------------------------------
// Test 1: FEFO Ordering Validation
// ---------------------------------------------------------------------------
test.group('SalesService | Test 1: FEFO Ordering Validation', (group) => {
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

    // batch1: expires LATER (30 days) — should NOT be touched first
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

    // batch2: expires SOONER (5 days) — FEFO mandates this is consumed first
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
    // Clean up sale_items → batches → products (FK order)
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

    // Checkout 10 units — must fully consume batch2 (sooner expiry) only
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

// ---------------------------------------------------------------------------
// Test 2: Double Allocation & Stock Exhaustion
// ---------------------------------------------------------------------------
test.group('SalesService | Test 2: Double Allocation & Stock Exhaustion', (group) => {
  let user: User
  let productId: string
  let batchId: string

  group.each.setup(async () => {
    user = await User.firstOrFail()

    productId = uuidv4()
    batchId = uuidv4()

    await Product.create({
      id: productId,
      name: 'Flash Sale Item [Exhaustion Test]',
      userId: user.id,
      barcode: `FLASH-${Date.now()}`,
    })

    // Only 30 units in stock; 3 concurrent requests each demand 15 → one must be rejected
    await Batch.create({
      id: batchId,
      productId,
      userId: user.id,
      batchNumber: 'BATCH-FLASH',
      quantity: 30,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 60 }).toISODate()!,
      costPrice: 10,
      sellingPrice: 15,
      status: 'ACTIVE',
    })
  })

  group.each.teardown(async () => {
    await db.from('sale_items').where('batch_id', batchId).delete()
    await db
      .from('sales')
      .whereIn('id', db.from('sale_items').select('sale_id').where('batch_id', batchId))
      .delete()
    await Batch.query().where('id', batchId).delete()
    await Product.query().where('id', productId).delete()
  })

  test('exactly 2 of 3 parallel checkouts succeed, 0 negative inventory, batch depleted', async ({
    assert,
  }) => {
    const salesService = new SalesService()

    // 3 concurrent requests; only 2 lots of 15 can succeed (total stock = 30)
    const results = await Promise.allSettled([
      salesService.checkout(user, {
        paymentMethod: 'CARD',
        items: [{ productId, quantity: 15 }],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CARD',
        items: [{ productId, quantity: 15 }],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CARD',
        items: [{ productId, quantity: 15 }],
      }),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    // Verify atomic rejection — exactly 2 succeed, 1 is atomically rejected
    assert.equal(fulfilled.length, 2, '2 of 3 concurrent requests must complete successfully')
    assert.equal(
      rejected.length,
      1,
      '1 request must be atomically rejected with INSUFFICIENT_STOCK'
    )

    // Verify the rejected reason is INSUFFICIENT_STOCK
    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason as {
      code?: string
    }
    assert.equal(
      rejectedReason.code,
      'INSUFFICIENT_STOCK',
      'Rejection must carry INSUFFICIENT_STOCK error code'
    )

    // Verify no negative inventory — batch must be at exactly 0
    const batch = await Batch.findOrFail(batchId)
    assert.equal(batch.quantity, 0, 'Final batch quantity must be exactly 0 (no double-allocation)')
    assert.equal(batch.status, 'DEPLETED', 'Batch must be marked DEPLETED after full exhaustion')
  })
})

// ---------------------------------------------------------------------------
// Test 3: Deadlock Immunity
// ---------------------------------------------------------------------------
test.group('SalesService | Test 3: Deadlock Immunity', (group) => {
  let user: User
  let p1Id: string
  let p2Id: string
  let b1Id: string
  let b2Id: string

  group.each.setup(async () => {
    user = await User.firstOrFail()

    p1Id = uuidv4()
    p2Id = uuidv4()
    b1Id = uuidv4()
    b2Id = uuidv4()

    await Product.create({
      id: p1Id,
      name: 'Item A [Deadlock Test]',
      userId: user.id,
      barcode: `A-${Date.now()}`,
    })
    await Product.create({
      id: p2Id,
      name: 'Item B [Deadlock Test]',
      userId: user.id,
      barcode: `B-${Date.now() + 1}`,
    })

    await Batch.create({
      id: b1Id,
      productId: p1Id,
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
      id: b2Id,
      productId: p2Id,
      userId: user.id,
      batchNumber: 'BB',
      quantity: 100,
      receivedDate: DateTime.now().toISODate()!,
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      costPrice: 5,
      sellingPrice: 10,
      status: 'ACTIVE',
    })
  })

  group.each.teardown(async () => {
    await db.from('sale_items').whereIn('batch_id', [b1Id, b2Id]).delete()
    await db
      .from('sales')
      .whereIn('id', db.from('sale_items').select('sale_id').whereIn('batch_id', [b1Id, b2Id]))
      .delete()
    await Batch.query().whereIn('id', [b1Id, b2Id]).delete()
    await Product.query().whereIn('id', [p1Id, p2Id]).delete()
  })

  test('concurrent reverse-order multi-item checkouts complete without deadlock', async ({
    assert,
  }) => {
    const salesService = new SalesService()

    // Thread A: [P1, P2] order
    // Thread B: [P2, P1] order  ← reverse, deadlock-prone without deterministic sort
    const results = await Promise.all([
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items: [
          { productId: p1Id, quantity: 2 },
          { productId: p2Id, quantity: 2 },
        ],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items: [
          { productId: p2Id, quantity: 3 },
          { productId: p1Id, quantity: 3 },
        ],
      }),
    ])

    // Both transactions must complete — no deadlock abort
    assert.equal(results.length, 2, 'Both concurrent checkouts must complete without deadlock')
    assert.isNotNull(results[0].invoiceNo, 'First checkout must have a valid invoice number')
    assert.isNotNull(results[1].invoiceNo, 'Second checkout must have a valid invoice number')

    // Verify correct stock was deducted: P1: 100 - 2 - 3 = 95, P2: 100 - 2 - 3 = 95
    const b1 = await Batch.findOrFail(b1Id)
    const b2 = await Batch.findOrFail(b2Id)
    assert.equal(b1.quantity, 95, 'Batch for Product A must reflect combined deductions')
    assert.equal(b2.quantity, 95, 'Batch for Product B must reflect combined deductions')
  })
})
