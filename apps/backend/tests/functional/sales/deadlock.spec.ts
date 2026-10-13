import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'
import Batch from '#models/batch'
import SalesService from '#features/sales/sales_service'
import { DateTime } from 'luxon'

test.group('SalesService deadlock prevention', () => {
  test('should not deadlock when processing concurrent requests with different order', async ({
    assert,
  }) => {
    // 1. Setup products
    const user = await User.first() // Assuming there is at least one user
    if (!user) throw new Error('No user found')

    const p1Id = 'p1-' + Math.random()
    const p2Id = 'p2-' + Math.random()
    const p1 = await Product.create({
      id: p1Id,
      name: 'Product 1',
      userId: user.id,
      barcode: 'BC1-' + Math.random(),
    })
    const p2 = await Product.create({
      id: p2Id,
      name: 'Product 2',
      userId: user.id,
      barcode: 'BC2-' + Math.random(),
    })

    await Batch.create({
      id: 'b1-' + Math.random(),
      productId: p1.id,
      userId: user.id,
      quantity: 100,
      status: 'ACTIVE',
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      receivedDate: DateTime.now().toISODate()!,
      sellingPrice: 10,
      costPrice: 5,
      batchNumber: 'B1-' + Math.random(),
    })

    await Batch.create({
      id: 'b2-' + Math.random(),
      productId: p2.id,
      userId: user.id,
      quantity: 100,
      status: 'ACTIVE',
      expiryDate: DateTime.now().plus({ days: 30 }).toISODate()!,
      receivedDate: DateTime.now().toISODate()!,
      sellingPrice: 10,
      costPrice: 5,
      batchNumber: 'B2-' + Math.random(),
    })

    const salesService = new SalesService()

    // 2. Execute concurrent requests with reverse order
    await Promise.all([
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items: [
          { productId: p1.id, quantity: 1 },
          { productId: p2.id, quantity: 1 },
        ],
      }),
      salesService.checkout(user, {
        paymentMethod: 'CASH',
        items: [
          { productId: p2.id, quantity: 1 },
          { productId: p1.id, quantity: 1 },
        ],
      }),
    ])

    // If no deadlock occurred, this will pass.
    assert.isTrue(true)
  })
})
