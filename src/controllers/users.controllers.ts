import { Request, Response } from 'express'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body

  if (email === 'khoa@gmail.com' && password === '123456') {
    return res.status(200).json({
      message: 'Login success'
    })
  }

  return res.status(400).json({
    error: 'Login failed'
  })
}
