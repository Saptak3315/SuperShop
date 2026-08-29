import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import InventoryService from './inventory_service.js'
import {
  createProductValidator,
  updateProductValidator,
  createBatchValidator,
  createBulkBatchesValidator,
} from './inventory_validator.js'

@inject()
export default class InventoryController {
  constructor(protected inventoryService: InventoryService) {}

  /**
   * Register a new product
   */
  public async createProduct({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const payload = await request.validateUsing(createProductValidator)
    const product = await this.inventoryService.createProduct(user, payload)

    return response.created(product)
  }

  /**
   * Update an existing product
   */
  public async updateProduct({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const productId = request.param('id')
    const payload = await request.validateUsing(updateProductValidator)
    const product = await this.inventoryService.updateProduct(user, productId, payload)

    return response.ok(product)
  }

  /**
   * Delete a product
   */
  public async deleteProduct({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const productId = request.param('id')
    const product = await this.inventoryService.deleteProduct(user, productId)

    return response.ok(product)
  }

  /**
   * List all products with their aggregate stock
   */
  public async listProducts({ response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const products = await this.inventoryService.listProducts(user)

    return response.ok(products)
  }

  /**
   * Register a new batch for a product
   */
  public async createBatch({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const payload = await request.validateUsing(createBatchValidator)
    const batch = await this.inventoryService.createBatch(user, payload)

    return response.created(batch)
  }

  /**
   * Register multiple batches in bulk
   */
  public async createBatchesBulk({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const payload = await request.validateUsing(createBulkBatchesValidator)
    const batches = await this.inventoryService.createBatchesBulk(user, payload)

    return response.created(batches)
  }

  /**
   * Get list of expiring batches
   */
  public async expiringBatches({ request, response, auth }: HttpContext) {
    const user = auth.use('web').user!
    const days = request.input('days', 7)
    const batches = await this.inventoryService.getExpiringBatches(user, Number.parseInt(days))

    return response.ok(batches)
  }
}
