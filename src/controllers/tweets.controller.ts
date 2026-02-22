import express, { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/users.request'
import { config } from 'dotenv'
import { TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/tweets.request'
import tweetsService from '~/services/tweets.service'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { TweetType } from '~/constants/enums'
config()

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_auth as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({
    message: TWEETS_MESSAGES.TWEET_CREATED_SUCCESSFULLY,
    data: result
  })
}

export const getTweetDetailController = async (req: Request<TweetParam, any, any, any>, res: Response) => {
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_auth?.user_id)
  console.log(result)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    views: result.guest_views + result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    result: tweet
  })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const tweetType = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_auth?.user_id
  const { tweets, total } = await tweetsService.getTweetChildren(req.params.tweet_id, tweetType, limit, page, user_id)
  return res.json({
    message: TWEETS_MESSAGES.TWEET_CHILDREN_FETCHED_SUCCESSFULLY,
    result: {
      tweets,
      tweetType,
      limit,
      page,
      total_pages: Math.ceil(total / limit)
    }
  })
}
