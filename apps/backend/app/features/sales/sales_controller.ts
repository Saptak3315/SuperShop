import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import SalesService from './sales_service.js'
import { checkoutValidator } from './sales_validator.js'

@inject()
export default class SalesController {
  constructor(protected salesService: SalesService) {}

  /**
   * Process a checkout request
   */
  public async checkout({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const payload = await request.validateUsing(checkoutValidator)
    const sale = await this.salesService.checkout(user, payload)

    return response.created(sale)
  }
}
