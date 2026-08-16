import User from '#models/user'
import { v4 as uuidv4 } from 'uuid'

export default class AuthService {
  /**
   * Handle the registration of a new user
   */
  public async register(data: any) {
    const user = await User.create({
      id: uuidv4(),
      storeName: data.storeName,
      email: data.email,
      password: data.password,
      role: 'OWNER',
    })

    return user
  }

  /**
   * Handle the login of a user
   */
  public async login(data: any) {
    const user = await User.verifyCredentials(data.email, data.password)
    return user
  }
}
