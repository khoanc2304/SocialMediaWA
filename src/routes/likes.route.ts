import { Router } from 'express'
import { likeTweetController, unLikeTweetController } from '~/controllers/likes.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const likeRouter = Router()
/**
 * Description: Like a tweet
 * Path: /likes
 * Method: POST
 * Body: { tweet_id: string }
 */
likeRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(likeTweetController))
/**
 * Description: Unlike a tweet
 * Path: /likes/:tweet_id
 * Method: DELETE
 */
likeRouter.delete('/:tweet_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(unLikeTweetController))
export default likeRouter
