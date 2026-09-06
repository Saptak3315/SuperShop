import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const DashboardController = () => import('./dashboard_controller.js')

export default function dashboardRoutes() {
  router
    .group(() => {
      router.get('summary', [DashboardController, 'summary'])
      router.get('expiring-chart', [DashboardController, 'expiringChart'])
    })
    .prefix('api/dashboard')
    .use(middleware.auth())
}
