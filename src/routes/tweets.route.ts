import { Router } from 'express'
import {
  createTweetController,
  getTweetChildrenController,
  getTweetDetailController
} from '~/controllers/tweets.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  validateTweetId
} from '~/middlewares/tweets.middleware'
import { accessTokenValidator, requireAuthValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description: Get tweet detail
 * Path: /tweets/:tweet_id
 * Method: GET
 */
tweetsRouter.get(
  '/:id',
  validateTweetId,
  requireAuthValidator(accessTokenValidator),
  requireAuthValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetDetailController)
)

/**
 * Description: Get tweet children
 * Path: /tweets/:tweet_id/children
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Query: { limit: number, page: number , tweet_type: TweetType}
 */
tweetsRouter.get(
  '/:tweet_id/children',
  validateTweetId,
  getTweetChildrenValidator,
  requireAuthValidator(accessTokenValidator),
  requireAuthValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

export default tweetsRouter
