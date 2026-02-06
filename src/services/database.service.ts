import { MongoClient, Db, Collection } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/users.schema'
import RefreshToken from '~/models/schemas/refreshToken.schema'
import VideoStatus from '~/models/schemas/videos.schema'
import Hashtag from '~/models/schemas/hashtags.schema'
import Tweet from '~/models/schemas/tweets.schema'
dotenv.config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.epbfkay.mongodb.net/?appName=Twitter`

class DatebaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      // Ensures that the client will close when you finish/error
      console.log('Failed to connect to MongoDB', error)
    }
  }

  async indexUsers() {
    const exists = await this.users.indexExists(['email_1', 'email_1_password_1'])
    if (!exists) {
      ;(this.users.createIndex({ email: 1, password: 1 }), this.users.createIndex({ email: 1 }, { unique: true }))
      // this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshTokens() {
    const exists = await this.users.indexExists(['exp_1', 'token_1'])
    if (!exists) {
      ;(this.refreshTokens.createIndex({ token: 1 }, { unique: true }),
        this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }))
    }
  }

  async indexVideoStatus() {
    const exists = await this.users.indexExists(['name_1'])
    if (!exists) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(process.env.DB_HASHTAGS_COLLECTION as string)
  }
}

// run().catch(console.dir)
const databaseService = new DatebaseService()

export default databaseService
