import { Router } from 'express'
import { bookmarkTweetController, unBookmarkTweetController } from '~/controllers/bookmarks.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRouter = Router()
/**
 * Description: Bookmark a tweet
 * Path: /bookmarks
 * Method: POST
 * Body: { tweet_id: string }
 */
bookmarkRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(bookmarkTweetController)
)
/**
 * Description: Unbookmark a tweet
 * Path: /bookmarks/:tweet_id
 * Method: DELETE
 */
bookmarkRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unBookmarkTweetController)
)
export default bookmarkRouter
