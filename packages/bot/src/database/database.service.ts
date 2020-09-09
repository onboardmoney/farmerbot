import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { Tweet } from 'src/types';
import { TransactionReceipt } from '@onboardmoney/sdk';

const USER_KEY_PREFIX = 'user:'
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

  private getUserKey(userId: string): string {
    return USER_KEY_PREFIX + userId
  }

  async getClient() {
    return this.redisService.getClient()
  }

  // TODO : define return type
  async createUser(userId: string, address: string): Promise<any> {

    const user = {
      userId,
      address
    }

    const key = this.getUserKey(userId)
    // console.log('storing user', key, user)
    await this.client.set(key, JSON.stringify(user))
    return user
  }

  async getUser(userId: string): Promise<any> {
    const key = this.getUserKey(userId)
    const user = await this.client.get(key);
    return JSON.parse(user)
  }

  // TODO : define return type
  buildEvent(command: string, receipt: TransactionReceipt): any {
    const { transactionHash } = receipt
    return {
      command,
      txHash: transactionHash
    }
  }

  // TODO : wip
  async createEvent(command: string, receipt: TransactionReceipt): Promise<any> {
    const key = "events:ids"
    const event = this.buildEvent(command, receipt)
    return this.client.append(key, event)
  }

  async addPendingTransfer(sender: string, txs: any[]) {
    return this.client.sadd('pending_transfers', sender)
  }

  async getPendingTransfers(): Promise<string[]> {
    return this.client.smembers('pending_transfers')
  }

  async removePendingTransfer(sender: string): Promise<any> {
    return this.client.srem('pending_transfers', sender)
  }

  async addTweets(tweets: Tweet[]): Promise<any> {
    if (tweets === undefined || tweets.length === 0) return;
    const ids = tweets.map(t => t.id)
    const lastId = ids.reduce((prev, current) =>
      BigInt(current).valueOf() > BigInt(prev).valueOf() ? current : prev
    )

    await Promise.all(tweets.map(t => {
      this.client.hset(TWEETS_KEY, t.id, JSON.stringify(t))
    }))
    console.log('tweets stored')

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
    return this.client.hdel(TWEETS_KEY, tweetId)
  }
}
