import express from 'express'
import { body, validationResult, ContextRunner, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/httpStatus'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// can be reused by many routes
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // get data from request -> checkSchema validation
    await validation.run(req)
    const error = validationResult(req) //gom err

    // nếu không có lỗi thì next()
    if (error.isEmpty()) {
      return next()
    }

    const errorObject = error.mapped()
    const entityError = new EntityError({ errors: {} })
    for (const key in errorObject) {
      const { msg } = errorObject[key]
      // return next error nếu error không phải lỗi validation
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.errors[key] = errorObject[key]
    }
    next(entityError)
    // return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({ errors: error.mapped() })
  }
}
