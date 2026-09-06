/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import authRoutes from '#features/auth/auth_router'
import inventoryRoutes from '#features/inventory/inventory_router'
import salesRoutes from '#features/sales/sales_router'
import dashboardRoutes from '#features/dashboard/dashboard_router'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Register Auth Routes
authRoutes()

// Register Inventory Routes
inventoryRoutes()

// Register Sales Routes
salesRoutes()

// Register Dashboard Routes
dashboardRoutes()
