export enum UserVerifyStatus {
  UNVERIFIED,
  VERIFIED,
  BANNED
}

export enum TokenType {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  EMAIL_VERIFY_TOKEN,
  FORGOT_PASSWORD_TOKEN
}

export enum MediaType {
  IMAGE,
  VIDEO,
  HLS
}

export enum EncodingStatus {
  PENDING,
  PROCESSING,
  SUCCESS,
  FAILED
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone,
  TwitterCircle
}
