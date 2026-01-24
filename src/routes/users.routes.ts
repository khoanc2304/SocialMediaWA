import { wrapRequestHandler } from '~/utils/handlers'
import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'

const usersRouter = Router()

/**
 * Description: User login
 * Path: /login
 * Method: POST
 *  Body: { email: string, password: string }
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description: User registration
 * Path: /register
 * Method: POST
 * Body: { username: string, email: string, password: string, confirm_password: string, date_of_birth: string }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description: User logout
 * Path: /logout
 * Method: POST
 */
usersRouter.post('/logout', wrapRequestHandler(logoutController))

export default usersRouter
