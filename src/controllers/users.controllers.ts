import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import User from '~/models/schemas/users.schema'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESSFUL,
    result
  })
}

export const registerController = async (req: Request, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    return res.json({
      message: USERS_MESSAGES.REGISTER_SUCCESSFUL,
      result
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      message: USERS_MESSAGES.REGISTER_FAILED
    })
  }
}

export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}
