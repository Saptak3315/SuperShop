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

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Register Auth Routes
authRoutes()
