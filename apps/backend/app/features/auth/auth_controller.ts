import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AuthService from './auth_service.js'
import { registerValidator, loginValidator } from './auth_validator.js'

@inject()
export default class AuthController {
  constructor(protected authService: AuthService) {}

  /**
   * Handle user registration
   */
  public async register({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await this.authService.register(payload)

    await auth.use('web').login(user)

    return response.created({
      message: 'Store account registered successfully',
      user,
    })
  }

  /**
   * Handle user login
   */
  public async login({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const user = await this.authService.login(payload)

    await auth.use('web').login(user)

    return response.ok({
      message: 'Logged in successfully',
      user,
    })
  }

  /**
   * Handle user logout
   */
  public async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({
      message: 'Logged out successfully',
    })
  }

  /**
   * Get current authenticated user
   */
  public async me({ response, auth }: HttpContext) {
    return response.ok({
      user: auth.use('web').user,
    })
  }
}
