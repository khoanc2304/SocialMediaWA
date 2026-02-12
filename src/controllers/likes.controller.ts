import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LikeRequestBody } from '~/models/requests/likes.request'
import { TokenPayload } from '~/models/requests/users.request'
import { LikeService } from '~/services/likes.service'

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeRequestBody>, res: Response) => {
  const { tweet_id } = req.body
  const { user_id } = req.decoded_auth as TokenPayload
  const result = await LikeService.likeTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}
export const unLikeTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params as { tweet_id: string }
  const { user_id } = req.decoded_auth as TokenPayload
  const result = await LikeService.unlikeTweet(user_id, tweet_id)
  return res.json({
    result: result
  })
}