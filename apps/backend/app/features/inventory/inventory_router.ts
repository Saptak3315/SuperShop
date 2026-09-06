import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const InventoryController = () => import('./inventory_controller.js')

export default function inventoryRoutes() {
  router
    .group(() => {
      // Product routes
      router.post('products', [InventoryController, 'createProduct'])
      router.get('products', [InventoryController, 'listProducts'])
      router.put('products/:id', [InventoryController, 'updateProduct'])
      router.delete('products/:id', [InventoryController, 'deleteProduct'])

      // Batch routes
      router.post('batches', [InventoryController, 'createBatch'])
      router.post('batches/bulk', [InventoryController, 'createBatchesBulk'])
      router.get('batches/expiring', [InventoryController, 'expiringBatches'])
    })
    .prefix('api/inventory')
    .use(middleware.auth())
}
