import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('./auth_controller.js')

export default function authRoutes() {
  router
    .group(() => {
      router.post('register', [AuthController, 'register'])
      router.post('login', [AuthController, 'login'])
      router.post('logout', [AuthController, 'logout']).use(middleware.auth())
      router.get('me', [AuthController, 'me']).use(middleware.auth())
    })
    .prefix('api/auth')
}
