import HTTP_STATUS from '~/constants/httpStatus'
import { LIKE_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from './database.service'
import { ObjectId } from 'mongodb'

export const LikeService = {
  async likeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      { user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) },
      {
        $setOnInsert: { user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) }
      },
      { upsert: true, returnDocument: 'after' }
    )
    if (!result) {
      throw new ErrorWithStatus({
        message: LIKE_MESSAGES.LIKE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return {
      message: LIKE_MESSAGES.LIKE_CREATED_SUCCESSFULLY,
      result: {
        _id: result._id,
        user_id: result.user_id,
        tweet_id: result.tweet_id
      }
    }
  },
  async unlikeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    if (!result) {
      throw new ErrorWithStatus({
        message: LIKE_MESSAGES.LIKE_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return {
      message: LIKE_MESSAGES.LIKE_DELETED_SUCCESSFULLY
    }
  }
}
