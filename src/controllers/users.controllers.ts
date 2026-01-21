import { Request, Response } from 'express'
import { USERS_MESSAGES } from '~/constants/messages'
import usersService from '~/services/users.services'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body

  if (email === 'khoa@gmail.com' && password === '123456') {
    return res.status(200).json({
      message: USERS_MESSAGES.LOGIN_SUCCESSFUL
    })
  }

  return res.status(400).json({
    error: USERS_MESSAGES.LOGIN_FAILED
  })
}

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const result = await usersService.register({ email, password })
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
