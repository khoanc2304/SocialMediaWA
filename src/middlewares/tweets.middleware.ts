import { Media } from '~/models/Others'
import { checkSchema } from 'express-validator'
import { has, isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import Tweet from '~/models/schemas/tweets.schema'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validation'
import { types } from 'node:util'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { wrapRequestHandler } from '~/utils/handlers'
import { Request, Response, NextFunction } from 'express'
import databaseService from '~/services/database.service'
import tweetsService from '~/services/tweets.service'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudiences = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes], // TweetType
        errorMessage: TWEETS_MESSAGES.INVALID_TWEET_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudiences], // TweetAudience
        errorMessage: TWEETS_MESSAGES.INVALID_TWEET_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          // neu la retweet, comment, quote tweet thi parent_id phai la tweet id cua tweet cha
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_VALID_TWEET_ID)
          }
          // neu type la tweet thi khong duoc co parent_id => null
          if (type === TweetType.Tweet && value != null) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          // neu la tweet, comment, quote tweet va khong co hashtags, mentions thi content la string va phai khac rong
          if (
            [TweetType.Comment, TweetType.Retweet, TweetType.Tweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          // neu type la retweet thi content phai la rong
          if (type === TweetType.Retweet && value != null) {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // check tung phan tu trong mang hashtags phai la string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_ARRAY_OF_STRINGS)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // check tung phan tu trong mang mentions phai la user_id
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_ARRAY_OF_STRINGS)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // check tung phan tu trong mang phai la media object
          if (
            value.some((item: any) => {
              return typeof item.url != 'string' || !mediaTypes.includes(item.type)
            })
          ) {
            throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_ARRAY_OF_MEDIA_OBJECTS)
          }
          return true
        }
      }
    }
  })
)

export const validateTweetId = validate(
  checkSchema(
    {
      tweet_id: {
        isString: true,
        isMongoId: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.TWEET_ID_MUST_BE_VALID_OBJECT_ID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const tweet = await tweetsService.getTweetById(value)
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)

export const audienceValidator = wrapRequestHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // check người xem tw đã login chưa
    if (!req.decoded_auth) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      })
    }
    // check acc bị khóa chưa
    const author = await databaseService.users.findOne({ _id: new ObjectId(tweet.user_id) })
    if (!author || author.verify === UserVerifyStatus.BANNED) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    // check viewer tw này có trong tw circle của tác giả không
    const { user_id } = req.decoded_auth
    const isInTweetCircle = author.twitter_circle?.some((user_circle_id) => user_circle_id.toString() === user_id)
    // Chỉ throw error if user KHÔNG trong circle VÀ user KHÔNG phải author
    if (!isInTweetCircle && author._id?.toString() !== user_id) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEETS_MESSAGES.INVALID_TWEET_TYPE
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const num = Number(value)
            if (num > 100) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.MAX_LIMIT_IS_100,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            if (num < 1) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.MIN_LIMIT_IS_1,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const num = Number(value)
            if (num < 1) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGES.MIN_PAGE_IS_1,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)
