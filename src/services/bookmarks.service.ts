import HTTP_STATUS from '~/constants/httpStatus'
import { ObjectId } from 'mongodb'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from './database.service'

export const BookmarkService = {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: {
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return {
      message: BOOKMARK_MESSAGES.BOOKMARK_CREATED_SUCCESSFULLY,
      result: {
        _id: result?._id,
        user_id: result?.user_id,
        tweet_id: result?.tweet_id
      }
    }
  },
  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    if (!result) {
      throw new ErrorWithStatus({
        message: BOOKMARK_MESSAGES.BOOKMARK_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return {
      message: BOOKMARK_MESSAGES.BOOKMARK_DELETED_SUCCESSFULLY,
      result: result
    }
  }
}
