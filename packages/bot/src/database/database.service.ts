import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { Tweet } from 'src/types';

const TWEETS_KEY = 'tweets'

@Injectable()
export class DatabaseService implements OnModuleInit {
  client: Redis;

  constructor(private readonly redisService: RedisService) {
  }
  async onModuleInit() {
    this.client = await this.getClient()
  }

  private getUserKey(userId: string): string {
    return 'user:' + userId
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
    await this.client.set(key, JSON.stringify(user))
    return user
  }

  async getUser(userId: string): Promise<any> {
    const key = this.getUserKey(userId)
    const user = await this.client.get(key);
    return JSON.parse(user)
  }

  // TODO : wip
  async createEvent(event: any): Promise<any> {
    const key = "events:ids"
    return this.client.append(key, event)
  }

  private async addTweet(tweet: Tweet): Promise<any> {
    return this.client.rpush(TWEETS_KEY, JSON.stringify(tweet))
  }

  async addTweets(tweets: Tweet[]): Promise<any> {
    // TODO : can this be done is only one command?
    for (const tweet of tweets) {
      await this.client.rpush(TWEETS_KEY, JSON.stringify(tweet))
    }
  }

  async getTweets(): Promise<Tweet[]> {
    const amount = await this.client.llen(TWEETS_KEY)
    if (amount === 0) return []
    const tweets = await this.client.lrange(TWEETS_KEY, 0, amount - 1)
    return tweets.map(t => JSON.parse(t))
  }

}
