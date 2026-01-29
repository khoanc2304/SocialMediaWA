import { wrapRequestHandler } from '~/utils/handlers'
import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/media.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

const mediasRouter = Router()


mediasRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
)

mediasRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
)

export default mediasRouter
