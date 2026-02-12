import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BookmarkTweetRequestBody } from '~/models/requests/bookmarks.request'
import { TokenPayload } from '~/models/requests/users.request'
import { BookmarkService } from '~/services/bookmarks.service'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response
) => {
  const { tweet_id } = req.body
  const { user_id } = req.decoded_auth as TokenPayload
  const result = await BookmarkService.bookmarkTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}

export const unBookmarkTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params as { tweet_id: string }
  const { user_id } = req.decoded_auth as TokenPayload
  const result = await BookmarkService.unBookmarkTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}
