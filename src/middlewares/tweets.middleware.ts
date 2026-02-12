import { Media } from '~/models/Others'
import { checkSchema } from 'express-validator'
import { has, isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType } from '~/constants/enums'
import { TWEETS_MESSAGES } from '~/constants/messages'
import Tweet from '~/models/schemas/tweets.schema'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validation'
import { types } from 'node:util'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

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
