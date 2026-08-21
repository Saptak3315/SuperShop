import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const SalesController = () => import('./sales_controller.js')

export default function salesRoutes() {
  router
    .group(() => {
      router.post('checkout', [SalesController, 'checkout'])
    })
    .prefix('api/sales')
    .use(middleware.auth())
}
