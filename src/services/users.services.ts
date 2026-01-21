import { ObjectId } from 'mongodb'
import User from '~/models/schemas/users.schema'
import databaseService from '~/services/database.services'
import dotenv from 'dotenv'
dotenv.config()
class UserService {
  async register(payload: { email: string; password: string }) {
    const { email, password } = payload
    const result = await databaseService.users.insertOne(
      new User({
        email,
        password
      })
    )
    return result
  }

  async checkEmailExists(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}

const userService = new UserService()
export default userService
