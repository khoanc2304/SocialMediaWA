import { ObjectId, WithId } from 'mongodb'
import { TweetRequestBody } from '~/models/requests/tweets.request'
import databaseService from './database.service'
import Tweet from '~/models/schemas/tweets.schema'
import Hashtag from '~/models/schemas/hashtags.schema'
import { TweetType } from '~/constants/enums'

class TweetsService {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )
    return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }

  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkAndCreateHashtag(body.hashtags)
    // console.log(hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags,
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async getTweetById(tweetId: string): Promise<Tweet | null> {
    const tweet = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            _id: new ObjectId(tweetId)
          }
        },

        // 1. Hashtags (Giữ nguyên vì số lượng ít)
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },

        // 2. Mentions (Opti: name, username, email)
        {
          $lookup: {
            from: 'users',
            let: { mentions_ids: '$mentions' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$mentions_ids'] } } },
              { $project: { name: 1, username: 1, email: 1, _id: 1 } }
            ],
            as: 'mentions'
          }
        },

        // 3. Bookmarks (Opti: Chỉ lấy _id để đếm)
        // Thay vì lấy full document bookmarks => lấy field _id.
        // Giảm size mảng trong RAM đi 90%.
        {
          $lookup: {
            from: 'bookmarks',
            let: { tweet_id: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1 } }],
            as: 'bookmarks'
          }
        },

        // 4. Likes (Opti: Chỉ lấy _id để đếm)
        {
          $lookup: {
            from: 'likes',
            let: { tweet_id: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tweet_id'] } } }, { $project: { _id: 1 } }],
            as: 'likes'
          }
        },

        // 5. Tweet Children (Opti: Chỉ lấy field 'type')
        // Chỉ cần field 'type' để phân loại (comment/quote/retweet).
        // Ko cần lấy content, img của comment..
        {
          $lookup: {
            from: 'tweets',
            let: { tweet_id: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$parent_id', '$$tweet_id'] } } }, { $project: { type: 1 } }],
            as: 'tweet_children'
          }
        },

        // 6. Calc và Format (Giữ nguyên logic nhưng chạy trên data siêu nhẹ)
        {
          $addFields: {
            bookmarks: { $size: '$bookmarks' },
            likes: { $size: '$likes' },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.Retweet] }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.Comment] }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
                }
              }
            },
            views: {
              $add: ['$user_views', '$guest_views'] // Cộng view
            }
          }
        },

        // 7. Clean up
        {
          $project: {
            tweet_children: 0
          }
        }
      ])
      .toArray()
    return tweet[0] || null
  }

  async increaseView(tweetId: string, userId?: string | null) {
    const inc = userId ? { user_views: 1 } : { guest_views: 1 }
    const tweet = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweetId) },
      { $inc: inc, $currentDate: { updated_at: true } },
      { returnDocument: 'after', projection: { guest_views: 1, user_views: 1, updated_at: 1 } }
    )
    return tweet as {
      guest_views: number
      user_views: number
      updated_at: Date
    }
  }

  async getTweetChildren(tweetId: string, tweetType: TweetType, limit: number, skip: number, user_id?: string) {
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        // phase 1: LỌC DỮ LIỆU
        {
          $match: {
            parent_id: new ObjectId(tweetId),
            type: tweetType
          }
        },

        // phase 2: pagi & sort (most impo)
        // handle tại đây để giảm tải cho server
        {
          $sort: {
            created_at: -1 // newsest lên đầu (or 1 if muốn oldest lên đầu)
          }
        },
        {
          $skip: limit * (skip - 1) // * biến 'skip' ~~ 'page'
        },
        {
          $limit: limit
        },

        // phase 3: get in4 detail (only run items ĐÃ LIMIT)
        // 1. Hashtags
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        // 2. Mentions (Tối ưu: Select field ngay trong lookup)
        {
          $lookup: {
            from: 'users',
            let: { mentions_ids: '$mentions' },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ['$_id', '$$mentions_ids'] }
                }
              },
              {
                $project: {
                  name: 1,
                  username: 1,
                  email: 1,
                  _id: 1
                }
              }
            ],
            as: 'mentions'
          }
        },
        // 3. Bookmarks (cnt)
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },

        // 4. Likes (cnt)
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },

        // 5. Tweet Children (cnt Retweet, Comment, Quote)
        {
          $lookup: {
            from: 'tweets',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_children'
          }
        },

        // phase 4: FORMAT DỮ LIỆU ĐẦU RA
        {
          $addFields: {
            bookmarks: { $size: '$bookmarks' },
            likes: { $size: '$likes' },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.Retweet] }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.Comment] }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0, // del tweet[] con sau khi đã đếm xong
            bookmarks: 0, // del bookmarks[] (nếu chỉ cần count)
            likes: 0 // del likes[] (nếu chỉ cần count)
          }
        }
      ])
      .toArray() // run aggregate & chuyển result thành [] để dễ hanlde

    const ids = tweets.map((tweet) => tweet._id).filter((id): id is ObjectId => id !== undefined)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    const [, total] = await Promise.all([
      databaseService.tweets.updateMany({ _id: { $in: ids } }, { $inc: inc, $set: { updated_at: new Date() } }),
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweetId),
        type: tweetType
      })
    ])

    tweets.forEach((tweet) => {
      tweet.updated_at = new Date()
      if (user_id) {
        tweet.user_views = tweet.user_views + 1
      } else {
        tweet.guest_views = tweet.guest_views + 1
      }
    })

    return {
      tweets,
      total
    }
  }
}

const tweetsService = new TweetsService()
export default tweetsService
