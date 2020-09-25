import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { Tweet, User } from 'src/types';
import { TransactionReceipt } from '@onboardmoney/sdk';

const USER_KEY = userId => `user:${userId}`
const TWEETS_KEY = 'tweets'
const LAST_TWEET_ID_KEY = 'last_tweet_id'

@Injectable()
export class DatabaseService implements OnModuleInit {
  client: Redis;

  constructor(private readonly redisService: RedisService) {
  }
  async onModuleInit() {
    // TODO : is this really necessary? do we gain anything by storing the redis client?
    this.client = await this.getClient()
  }

  async getClient() {
    return this.redisService.getClient()
  }

  async createUser(userId: string, address: string): Promise<User> {
    const user = {
      userId,
      address
    }

    await this.client.set(USER_KEY(userId), JSON.stringify(user))
    return user
  }

  async getUser(userId: string): Promise<any> {
    const user = await this.client.get(USER_KEY(userId));
    return JSON.parse(user)
  }

  async addPendingTransfer(sender: string, tweetId: string) {
    Logger.debug(`Adding pending tranfer from: ${sender}`)
    return this.client.hset('pending_transfers', sender, tweetId)
  }

  async getPendingTransfers(): Promise<Record<string, string>> {
    return this.client.hgetall('pending_transfers')
  }

  async removePendingTransfer(sender: string): Promise<boolean> {
    Logger.debug(`Removing pending transfer from ${sender}`)
    const removed = await this.client.hdel('pending_transfers', sender)
    return removed > 0
  }

  async addTweets(tweets: Tweet[]): Promise<void> {
    if (tweets === undefined || tweets.length === 0) return;
    const ids = tweets.map(t => t.id)
    // get lastest id from tweets
    // TODO : can i get this from the api's response?
    const lastId = ids.reduce((prev, current) =>
      BigInt(current).valueOf() > BigInt(prev).valueOf() ? current : prev
    )

    await Promise.all(tweets.map(t => {
      this.client.hset(TWEETS_KEY, t.id, JSON.stringify(t))
    }))
    Logger.debug(`Tweets stored: ${tweets.length}`)
    Logger.debug(`Last tweet: ${lastId}`)
    await this.client.set(LAST_TWEET_ID_KEY, lastId)
  }

  async getLastTweetId(): Promise<string> {
    return this.client.get(LAST_TWEET_ID_KEY)
  }

  async getTweets(): Promise<Tweet[]> {
    const tweets = await this.client.hvals(TWEETS_KEY)
    return tweets.map(t => JSON.parse(t))
  }

  async removeTweet(tweetId: string): Promise<any> {
    Logger.debug(`Deleting tweet ${tweetId}`)
    return this.client.hdel(TWEETS_KEY, tweetId)
  }
}
