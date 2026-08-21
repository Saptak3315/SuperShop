import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import DashboardService from './dashboard_service.js'

@inject()
export default class DashboardController {
  constructor(protected dashboardService: DashboardService) {}

  /**
   * Get dashboard summary counts scoped to store
   */
  public async summary({ response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const summary = await this.dashboardService.getSummary(user)

    return response.ok(summary)
  }

  /**
   * Get timeline data of expiring batches for charts
   */
  public async expiringChart({ response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const chartData = await this.dashboardService.getExpiringChart(user)

    return response.ok(chartData)
  }
}
