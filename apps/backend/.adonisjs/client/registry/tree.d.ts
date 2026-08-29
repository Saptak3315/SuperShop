/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    logout: typeof routes['auth.logout']
    me: typeof routes['auth.me']
  }
  inventory: {
    createProduct: typeof routes['inventory.create_product']
    listProducts: typeof routes['inventory.list_products']
    updateProduct: typeof routes['inventory.update_product']
    deleteProduct: typeof routes['inventory.delete_product']
    createBatch: typeof routes['inventory.create_batch']
    createBatchesBulk: typeof routes['inventory.create_batches_bulk']
    expiringBatches: typeof routes['inventory.expiring_batches']
  }
  sales: {
    checkout: typeof routes['sales.checkout']
  }
  dashboard: {
    summary: typeof routes['dashboard.summary']
    expiringChart: typeof routes['dashboard.expiring_chart']
  }
}
