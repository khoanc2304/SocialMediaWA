import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { validate } from '~/utils/validation'

const usersRouter = Router()

/**
 * Description: User login
 * Path: /login
 * Method: POST
 */

usersRouter.post('/login', loginValidator, loginController)

/**
 * Description: User registration
 * Path: /register
 * Method: POST
 */

usersRouter.post('/register', registerValidator, registerController)

export default usersRouter
