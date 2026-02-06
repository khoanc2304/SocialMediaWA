import express, { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/users.request'
import { config } from 'dotenv'
import { TweetRequestBody } from '~/models/requests/tweets.request'
import tweetsService from '~/services/tweets.service'
config()

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_auth as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({
    message: 'Tweet created successfully',
    data: result
  })
}
